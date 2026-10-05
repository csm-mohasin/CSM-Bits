/* Time Budget, Clipboard history, Page snapshot, Sync messages (service worker) */
const TBK="tbState";
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return""}};
const dayStr=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
let tbq=Promise.resolve();
const tbLock=fn=>{const p=tbq.then(fn);tbq=p.catch(()=>{});return p};
const getCfg=async()=>({tbOn:true,tbMode:"all",tbList:[],tbSkip:[],tbExtend:5,clipOn:true,clipMax:100,snapMax:50,...((await chrome.storage.local.get("cfg")).cfg||{})});
const matchHost=(list,h)=>(list||[]).some(x=>{x=String(x).trim().replace(/^www\./,"").toLowerCase();return x&&(h===x||h.endsWith("."+x))});
function tbAllowed(c,h){
  if(c.tbOn===false||!h)return false;
  if(matchHost(c.tbSkip,h))return false;
  if(c.tbMode==="list")return matchHost(c.tbList,h);
  return true;
}
const tbAll=async()=>(await chrome.storage.local.get(TBK))[TBK]||{};
const tbSave=s=>chrome.storage.local.set({[TBK]:s});
async function tabsOfHost(h){return(await chrome.tabs.query({})).filter(t=>hostOf(t.url||"")===h)}
async function broadcast(h,msg){for(const t of await tabsOfHost(h))chrome.tabs.sendMessage(t.id,msg).catch(()=>{})}

async function tbCheck(h){
  const c=await getCfg();if(!tbAllowed(c,h))return{mode:"none"};
  return tbLock(async()=>{
    const all=await tbAll(),st=all[h],now=Date.now();
    if(st){
      if(st.unl){if(st.day===dayStart())return{mode:"active",unl:true};}
      else if(st.expired){
        if(now-(st.expiredAt||0)<10*60000)return{mode:"expired"};
      }else if(st.until>now)return{mode:"active",until:st.until};
      else if(st.until){st.expired=true;st.expiredAt=now;await tbSave(all);return{mode:"expired"}}
      delete all[h];await tbSave(all);
    }
    return{mode:"choose"};
  });
}
const dayStart=dayStr;
async function tbSet(h,min,unl){
  const r=await tbLock(async()=>{
    const all=await tbAll(),now=Date.now();
    let st;
    if(unl)st={unl:true,day:dayStr(),until:0,expired:false};
    else st={until:now+Math.max(1,min)*60000,expired:false,unl:false,day:dayStr()};
    all[h]=st;await tbSave(all);
    await chrome.alarms.clear("tb:"+h);
    if(!unl)chrome.alarms.create("tb:"+h,{when:st.until});
    return{ok:1,until:st.until,unl:!!st.unl};
  });
  broadcast(h,{t:"tb-extended",until:r.until,unl:r.unl});
  chrome.notifications.clear("tb:"+h);
  return r;
}
async function tbExpire(h){
  const c=await getCfg();
  const hasTabs=await tbLock(async()=>{
    const all=await tbAll(),st=all[h],now=Date.now();
    if(!st||st.unl||st.expired&&now-st.expiredAt<60000&&st.notified)return null;
    if(!st.until||st.until>now+1500)return null;
    st.expired=true;st.expiredAt=now;
    const tabs=await tabsOfHost(h);
    if(!tabs.length){delete all[h];await tbSave(all);return null}
    st.notified=true;await tbSave(all);return tabs;
  });
  if(!hasTabs)return;
  for(const t of hasTabs)chrome.tabs.sendMessage(t.id,{t:"tb-expired"}).catch(()=>{});
  let seen=false;
  try{
    const w=await chrome.windows.getLastFocused();
    if(w.focused){const [a]=await chrome.tabs.query({active:true,windowId:w.id});if(a&&hostOf(a.url||"")===h)seen=true}
  }catch(e){}
  if(!seen){
    const e=Math.max(1,c.tbExtend||5);
    chrome.notifications.create("tb:"+h,{type:"basic",iconUrl:"icon128.png",title:"⏰ Time is up — "+h,message:"The time allotted for this site is over. Take more time?",priority:2,requireInteraction:true,buttons:[{title:"+"+e+" min"},{title:"Go to site"}]});
  }
}
async function tbSweep(){
  const all=await tbAll(),now=Date.now();let dirty=false;
  for(const h in all){
    const st=all[h];
    if(st.unl&&st.day!==dayStr()){delete all[h];dirty=true;continue}
    if(!st.unl&&st.until&&!st.expired&&st.until<=now){tbExpire(h)}
    else if(st.expired&&now-(st.expiredAt||0)>30*60000){delete all[h];dirty=true}
    else if(!st.unl&&st.until>now)chrome.alarms.get("tb:"+h).then(a=>{if(!a)chrome.alarms.create("tb:"+h,{when:st.until})});
  }
  if(dirty)await tbSave(all);
}
chrome.alarms.onAlarm.addListener(a=>{if(a.name.startsWith("tb:"))tbExpire(a.name.slice(3))});
async function focusHost(h){
  const [t]=await tabsOfHost(h);if(!t)return;
  await chrome.tabs.update(t.id,{active:true});await chrome.windows.update(t.windowId,{focused:true});
}
chrome.notifications.onButtonClicked.addListener(async(id,i)=>{
  if(!id.startsWith("tb:"))return;const h=id.slice(3);
  if(i===0){const c=await getCfg();await tbSet(h,Math.max(1,c.tbExtend||5),false)}
  else await focusHost(h);
  chrome.notifications.clear(id);
});
chrome.notifications.onClicked.addListener(async id=>{if(id.startsWith("tb:")){await focusHost(id.slice(3));chrome.notifications.clear(id)}});

/* ---------- Clipboard history ---------- */
const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)+s.length.toString(36)};
async function addClip(m){
  const c=await getCfg();if(c.clipOn===false)return;
  const text=String(m.text||"");if(!text.trim())return;
  const now=Date.now(),id="c_"+fnv(text);
  let list=(await chrome.storage.local.get("clips")).clips||[];
  const old=list.find(x=>x.id===id);
  list=list.filter(x=>x.id!==id);
  list.unshift({id,ts:now,mu:now,text,url:m.url||"",title:(m.title||"").slice(0,120),pin:old?old.pin:false});
  const pins=list.filter(x=>x.pin),rest=list.filter(x=>!x.pin).slice(0,c.clipMax||100);
  await chrome.storage.local.set({clips:[...pins,...rest].sort((a,b)=>b.ts-a.ts)});
}

/* ---------- Page snapshot ---------- */
async function snapshot(tabId){
  const tab=await chrome.tabs.get(tabId);
  if(!/^https?:/.test(tab.url||""))return{err:"Snapshots can only be taken on regular web pages"};
  const [res]=await chrome.scripting.executeScript({target:{tabId},func:()=>{
    const st=document.createElement("style");st.id="__gsnap";st.textContent="glass-fx-host{visibility:hidden !important}";document.documentElement.appendChild(st);
    return{text:(document.body?document.body.innerText:"").replace(/\n{3,}/g,"\n\n").slice(0,20000),title:document.title,url:location.href,scrollY:Math.round(scrollY),sel:(getSelection()||"").toString().slice(0,2000)};
  }});
  await new Promise(r=>setTimeout(r,200));
  let shot;
  try{shot=await chrome.tabs.captureVisibleTab(tab.windowId,{format:"jpeg",quality:80})}
  finally{chrome.scripting.executeScript({target:{tabId},func:()=>document.getElementById("__gsnap")?.remove()}).catch(()=>{})}
  const bmp=await createImageBitmap(await(await fetch(shot)).blob());
  const w=Math.min(640,bmp.width),h=Math.round(bmp.height*w/bmp.width);
  const oc=new OffscreenCanvas(w,h);oc.getContext("2d").drawImage(bmp,0,0,w,h);
  const blob=await oc.convertToBlob({type:"image/jpeg",quality:.62});
  const u8=new Uint8Array(await blob.arrayBuffer());let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));
  const d=res.result,now=Date.now();
  const snap={id:now.toString(36)+Math.random().toString(36).slice(2,6),ts:now,url:d.url,title:d.title||d.url,text:d.text,sel:d.sel,scrollY:d.scrollY,thumb:"data:image/jpeg;base64,"+btoa(s)};
  const c=await getCfg();
  let list=(await chrome.storage.local.get("snaps")).snaps||[];
  list.unshift(snap);list=list.slice(0,c.snapMax||50);
  await chrome.storage.local.set({snaps:list});
  chrome.tabs.sendMessage(tabId,{t:"toast",text:"📸 Snapshot saved"}).catch(()=>{});
  return{ok:1,id:snap.id};
}
async function activeTabId(sender){
  if(sender&&sender.tab)return sender.tab.id;
  const w=await chrome.windows.getLastFocused({windowTypes:["normal"]});
  const [t]=await chrome.tabs.query({active:true,windowId:w.id});return t&&t.id;
}
chrome.commands.onCommand.addListener(async cmd=>{
  if(cmd==="take-snapshot"){const id=await activeTabId();if(id)snapshot(id).catch(()=>{})}
});

/* ---------- message router (called from background.js default case) ---------- */
async function extraMsg(m,sender){
  if(m.t&&m.t.startsWith("lk-"))return lockMsg(m,sender);
  switch(m.t){
    case"tb-check":return tbCheck(m.host);
    case"tb-set":return tbSet(m.host,m.min,m.unl);
    case"tb-due":{await tbExpire(m.host);const st=(await tbAll())[m.host];return{mode:st&&st.expired?"expired":"active"}}
    case"tb-never":{
      const c=(await chrome.storage.local.get("cfg")).cfg||{};
      const skip=Array.from(new Set([...(c.tbSkip||[]),m.host]));
      await chrome.storage.local.set({cfg:{...c,tbSkip:skip}});
      await tbLock(async()=>{const a=await tbAll();delete a[m.host];await tbSave(a)});return{ok:1};
    }
    case"tb-close":{
      await tbLock(async()=>{const a=await tbAll();delete a[m.host];await tbSave(a)});
      chrome.alarms.clear("tb:"+m.host);
      for(const t of await tabsOfHost(m.host))if(!sender.tab||t.id!==sender.tab.id)chrome.tabs.sendMessage(t.id,{t:"tb-reset"}).catch(()=>{});
      if(sender.tab)chrome.tabs.remove(sender.tab.id);return{ok:1};
    }
    case"clip":await addClip(m);return{ok:1};
    case"snap":{try{return await snapshot(m.tabId||await activeTabId(sender))}catch(e){return{err:String(e.message||e)}}}
    case"sync":return runSync("manual");
    case"sync-test":return testConn(m.fb);
  }
}
chrome.alarms.get("tt").then(()=>{});
