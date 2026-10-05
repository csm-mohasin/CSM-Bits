/* Tab Lock — service worker part (state lives in chrome.storage.session, so it is wiped when the browser closes) */
const LKS="lkState";
const LKDEF={lkOn:false,lkMode:"all",lkList:[],lkSkip:[],lkNewTab:true,lkSwitch:true,lkDelay:0,lkBlur:false,lkIdleOn:false,lkIdle:5,lkStart:true,lkRelock:0,lkAttempts:5,lkPagesOn:true,lkPages:["chrome://extensions"]};
const lkHost=u=>{try{const x=new URL(u);
  if(x.protocol==="chrome-extension:")return /\/newtab\.html$/.test(x.pathname)?"newtab":"";
  if(x.protocol==="chrome:")return x.hostname==="newtab"?"newtab":"";
  if(!/^(https?|file):$/.test(x.protocol))return"";
  return x.hostname.replace(/^www\./,"")}catch(e){return""}};
let lkQ=Promise.resolve(),lkFixSig="";
const lkLock=fn=>{const p=lkQ.then(fn);lkQ=p.catch(()=>{});return p};
const lkGet=async()=>({g:0,u:{},f:{},pg:{},away:{},act:{},fail:{n:0,until:0},opt:0,blur:false,...((await chrome.storage.session.get(LKS))[LKS]||{})});
const lkPut=s=>chrome.storage.session.set({[LKS]:s});
async function lkCfg(){const r=await chrome.storage.local.get(["cfg","lkHas"]);return{c:{...LKDEF,...(r.cfg||{})},has:!!r.lkHas}}

function lkScope(c,h){
  if(!c.lkOn||!h)return false;
  if(h==="newtab")return c.lkNewTab!==false;
  if(matchHost(c.lkSkip,h))return false;
  return c.lkMode==="list"?matchHost(c.lkList,h):true;
}
function lkIsLocked(st,c,tabId,h,now){
  if(!lkScope(c,h))return false;
  if(st.f[tabId])return true;
  const ts=st.u[tabId]||st.g;
  if(!ts)return true;
  if(c.lkRelock>0&&now-ts>c.lkRelock*60000)return true;
  return false;
}

/* ---- protected browser pages (chrome://extensions …): content scripts cannot run there, so the tab is redirected to gate.html ---- */
const lkGateBase=()=>chrome.runtime.getURL("gate.html");
const lkProtected=(c,url)=>c.lkPagesOn!==false&&!!url&&(c.lkPages||[]).some(p=>{p=String(p).trim().toLowerCase();return p&&url.toLowerCase().startsWith(p)});
const lkPageLocked=(st,c,tabId,now)=>{const ts=st.pg[tabId];if(!ts||st.f[tabId])return true;return c.lkRelock>0&&now-ts>c.lkRelock*60000};
const lkRedirecting=new Set();
function lkRedirect(tabId,url){
  if(lkRedirecting.has(tabId))return;lkRedirecting.add(tabId);setTimeout(()=>lkRedirecting.delete(tabId),1500);
  chrome.tabs.update(tabId,{url:lkGateBase()+"?to="+encodeURIComponent(url)}).catch(()=>{});
}
async function lkGuard(tabId,url){
  if(!url||tabId==null||tabId<0||url.startsWith(lkGateBase()))return;
  const {c,has}=await lkCfg();if(!has||!c.lkOn)return;
  const st=await lkGet();
  if(!lkProtected(c,url)){
    if(st.pg[tabId])await lkLock(async()=>{const s=await lkGet();delete s.pg[tabId];await lkPut(s)});
    return;
  }
  if(lkPageLocked(st,c,tabId,Date.now()))lkRedirect(tabId,url);
}
async function lkSweepPages(){for(const t of await chrome.tabs.query({}))lkGuard(t.id,t.url||t.pendingUrl)}
chrome.webNavigation.onBeforeNavigate.addListener(d=>{if(d.frameId===0)lkGuard(d.tabId,d.url)});
chrome.tabs.onUpdated.addListener((id,ch,tab)=>{const u=ch.url||(ch.status==="loading"?tab.pendingUrl:"");if(u)lkGuard(id,u)});
chrome.tabs.onCreated.addListener(t=>lkGuard(t.id,t.pendingUrl||t.url));

/* ---- passcode (PBKDF2-SHA256 + random salt; only the hash is stored) ---- */
const lkTE=new TextEncoder();
const lkHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
async function lkHash(code,saltHex,iter){
  const salt=Uint8Array.from(saltHex.match(/../g).map(h=>parseInt(h,16)));
  const km=await crypto.subtle.importKey("raw",lkTE.encode(code),"PBKDF2",false,["deriveBits"]);
  return lkHex(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:iter,hash:"SHA-256"},km,256));
}
async function lkVerify(code){
  const a=(await chrome.storage.local.get("lkAuth")).lkAuth;if(!a)return true;
  const h=await lkHash(String(code||""),a.salt,a.iter);
  let d=h.length^a.hash.length;for(let i=0;i<h.length;i++)d|=h.charCodeAt(i)^(a.hash.charCodeAt(i)||0);
  return d===0;
}
/* rate-limited check: after N wrong tries the lock-out grows 15s, 30s, 60s … (max 10 min) */
function lkAttempt(code,c){
  return lkLock(async()=>{
    const st=await lkGet(),now=Date.now(),max=c.lkAttempts||5;
    if(st.fail.until>now)return{ok:false,wait:Math.ceil((st.fail.until-now)/1000)};
    if(await lkVerify(code)){st.fail={n:0,until:0};await lkPut(st);return{ok:true}}
    st.fail.n++;
    const over=st.fail.n-max;
    if(over>=0)st.fail.until=now+Math.min(600,15*2**over)*1000;
    await lkPut(st);
    return{ok:false,left:Math.max(0,max-st.fail.n),wait:st.fail.until>now?Math.ceil((st.fail.until-now)/1000):0};
  });
}

/* ---- lock / unlock helpers ---- */
async function lkBroadcast(){for(const t of await chrome.tabs.query({}))chrome.tabs.sendMessage(t.id,{t:"lk-recheck"}).catch(()=>{})}
async function lkLockAll(){
  await lkLock(async()=>{const st=await lkGet();st.g=0;st.u={};st.f={};st.pg={};st.away={};await lkPut(st)});
  lkBroadcast();lkSweepPages();
}
async function lkForce(tabId){
  await lkLock(async()=>{const st=await lkGet();st.f[tabId]=1;delete st.pg[tabId];delete st.away[tabId];await lkPut(st)});
  chrome.tabs.sendMessage(tabId,{t:"lk-recheck"}).catch(()=>{});
  chrome.tabs.get(tabId).then(t=>lkGuard(tabId,t.url||t.pendingUrl)).catch(()=>{});
}
async function lkDepart(tabId){
  const {c,has}=await lkCfg();if(!has||!c.lkOn)return;
  const d=Math.max(0,c.lkDelay||0)*1000;
  await lkLock(async()=>{const st=await lkGet();st.away[tabId]=Date.now();await lkPut(st)});
  if(d===0)return lkForce(tabId);
  if(d<30000)setTimeout(async()=>{const st=await lkGet();if(st.away[tabId])lkForce(tabId)},d);   /* longer delays are handled by the 30s sweep */
}
async function lkArrive(tabId){
  const {c,has}=await lkCfg();if(!has||!c.lkOn)return;
  await lkLock(async()=>{
    const st=await lkGet(),a=st.away[tabId];
    if(a&&Date.now()-a>=Math.max(0,c.lkDelay||0)*1000)st.f[tabId]=1;
    delete st.away[tabId];await lkPut(st);
  });
  chrome.tabs.sendMessage(tabId,{t:"lk-recheck"}).catch(()=>{});
}

/* ---- events ---- */
chrome.tabs.onActivated.addListener(async({tabId,windowId})=>{
  const {c,has}=await lkCfg();if(!has||!c.lkOn)return;
  let prev;
  await lkLock(async()=>{const st=await lkGet();prev=st.act[windowId];st.act[windowId]=tabId;await lkPut(st)});
  if(c.lkSwitch&&prev!=null&&prev!==tabId)await lkDepart(prev);
  await lkArrive(tabId);
});
chrome.tabs.onRemoved.addListener(tabId=>lkLock(async()=>{
  const st=await lkGet();delete st.u[tabId];delete st.f[tabId];delete st.pg[tabId];delete st.away[tabId];
  for(const w in st.act)if(st.act[w]===tabId)delete st.act[w];
  await lkPut(st);
}));
chrome.windows.onFocusChanged.addListener(async wid=>{
  const {c,has}=await lkCfg();if(!has||!c.lkOn||!c.lkBlur)return;
  if(wid===chrome.windows.WINDOW_ID_NONE){
    await lkLock(async()=>{const st=await lkGet();st.blur=true;await lkPut(st)});
    for(const t of await chrome.tabs.query({active:true}))lkDepart(t.id);
  }else{
    let was=false;
    await lkLock(async()=>{const st=await lkGet();was=st.blur;st.blur=false;await lkPut(st)});
    if(was){const [t]=await chrome.tabs.query({active:true,windowId:wid});if(t)lkArrive(t.id)}
  }
});
chrome.idle.onStateChanged.addListener(async s=>{
  const {c,has}=await lkCfg();if(!has||!c.lkOn)return;
  if(s==="locked"||(s==="idle"&&c.lkIdleOn))lkLockAll();
});
async function lkIdleCfg(){
  const {c}=await lkCfg();
  if(c.lkIdleOn)try{chrome.idle.setDetectionInterval(Math.max(15,Math.round((c.lkIdle||5)*60)))}catch(e){}
}
chrome.alarms.create("lksweep",{periodInMinutes:0.5});
chrome.alarms.onAlarm.addListener(async a=>{
  if(a.name!=="lksweep")return;
  const {c,has}=await lkCfg();if(!has||!c.lkOn)return;
  const now=Date.now(),delay=Math.max(0,c.lkDelay||0)*1000,st=await lkGet();
  for(const t of await chrome.tabs.query({})){
    if(st.f[t.id])continue;
    const aw=st.away[t.id];
    if(aw&&now-aw>=delay){lkForce(t.id);continue}
    const ts=st.u[t.id]||st.g;
    if(c.lkRelock>0&&ts&&now-ts>c.lkRelock*60000&&lkScope(c,lkHost(t.url||"")))lkForce(t.id);
  }
  lkSweepPages();
});
chrome.runtime.onStartup.addListener(async()=>{
  const {c}=await lkCfg();
  if(!c.lkStart){await lkLock(async()=>{const st=await lkGet();st.g=Date.now();await lkPut(st)});lkBroadcast()}
  lkIdleCfg();lkSweepPages();
});
chrome.runtime.onInstalled.addListener(async()=>{
  await lkLock(async()=>{const st=await lkGet();if(!st.g)st.g=Date.now();await lkPut(st)});
  lkIdleCfg();
});
chrome.commands.onCommand.addListener(cmd=>{if(cmd==="lock-now")lkLockAll()});

/* Settings are protected too: while a passcode exists, Tab Lock options only change after "unlock settings" (10 min) */
chrome.storage.onChanged.addListener(async(ch,area)=>{
  if(area!=="local"||!ch.cfg)return;
  lkIdleCfg();
  const nv=ch.cfg.newValue;
  if(lkFixSig&&JSON.stringify(nv)===lkFixSig){lkFixSig="";return}
  const {has}=await lkCfg();if(!has)return;
  const st=await lkGet();if(st.opt>Date.now())return;
  const o={...LKDEF,...(ch.cfg.oldValue||{})},n={...LKDEF,...(nv||{})};
  if(!Object.keys(LKDEF).some(k=>JSON.stringify(o[k])!==JSON.stringify(n[k])))return;
  const fix={...(nv||{})};Object.keys(LKDEF).forEach(k=>{fix[k]=o[k]});
  lkFixSig=JSON.stringify(fix);
  await chrome.storage.local.set({cfg:fix});
});

/* ---- messages from content scripts / options page ---- */
async function lockMsg(m,sender){
  const tabId=sender&&sender.tab?sender.tab.id:null;
  switch(m.t){
    case"lk-check":{
      const {c,has}=await lkCfg();if(!has||tabId==null)return{locked:false};
      return{locked:lkIsLocked(await lkGet(),c,tabId,lkHost(sender.url||(sender.tab&&sender.tab.url)||""),Date.now())};
    }
    case"lk-try":{
      const {c,has}=await lkCfg();if(!has)return{ok:true};
      const r=await lkAttempt(m.code,c);
      if(r.ok)await lkLock(async()=>{const st=await lkGet(),now=Date.now();if(tabId!=null)st.u[tabId]=now;st.g=now;if(tabId!=null){delete st.f[tabId];delete st.away[tabId]}await lkPut(st)});
      return r;
    }
    case"lk-set":{
      const code=String(m.code||"");
      if(code.length<4)return{ok:false,err:"Passcode must be at least 4 characters"};
      const {c}=await lkCfg();
      if((await chrome.storage.local.get("lkAuth")).lkAuth){
        const r=await lkAttempt(m.old,c);
        if(!r.ok)return{ok:false,err:r.wait?"Too many attempts. Wait "+r.wait+"s":"Current passcode is wrong"};
      }
      const salt=lkHex(crypto.getRandomValues(new Uint8Array(16))),iter=200000;
      await chrome.storage.local.set({lkAuth:{salt,iter,hash:await lkHash(code,salt,iter)},lkHas:true});
      await lkLock(async()=>{const st=await lkGet(),now=Date.now();st.g=now;st.opt=now+10*60000;if(tabId!=null)st.u[tabId]=now;await lkPut(st)});
      return{ok:true};
    }
    case"lk-clear":{
      const {c}=await lkCfg();const r=await lkAttempt(m.code,c);
      if(!r.ok)return{ok:false,err:r.wait?"Too many attempts. Wait "+r.wait+"s":"Passcode is wrong"};
      await lkLock(async()=>{const st=await lkGet();st.opt=Date.now()+60000;await lkPut(st)});
      const cur=(await chrome.storage.local.get("cfg")).cfg||{};
      await chrome.storage.local.set({cfg:{...cur,lkOn:false}});
      await chrome.storage.local.remove(["lkAuth","lkHas"]);
      lkBroadcast();return{ok:true};
    }
    case"lk-optunlock":{
      const {c}=await lkCfg();const r=await lkAttempt(m.code,c);
      if(r.ok)await lkLock(async()=>{const st=await lkGet();st.opt=Date.now()+10*60000;await lkPut(st)});
      return r;
    }
    case"lk-gate-go":{
      const {c,has}=await lkCfg(),to=String(m.to||"");
      if(tabId==null||!lkProtected(c,to))return{ok:false,err:"This page is not protected"};
      const st=await lkGet(),now=Date.now();
      if(has&&c.lkOn&&!(st.u[tabId]&&now-st.u[tabId]<20000))return{ok:false,err:"Unlock first"};
      await lkLock(async()=>{const s2=await lkGet();s2.pg[tabId]=now;delete s2.f[tabId];await lkPut(s2)});
      await chrome.tabs.update(tabId,{url:to});return{ok:true};
    }
    case"lk-optstate":{const {has}=await lkCfg(),st=await lkGet();return{has,open:!has||st.opt>Date.now()}}
    case"lk-now":{
      const {has}=await lkCfg();if(!has)return{ok:false,err:"Set a passcode first"};
      await lkLockAll();return{ok:true};
    }
  }
}
