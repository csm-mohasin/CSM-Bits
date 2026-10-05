importScripts("sync.js","bg-extra.js","lock-bg.js");
chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true}).catch(()=>{});

/* ---------- Site Time Tracker ---------- */
const ymd=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
let q=Promise.resolve();
const enqueue=()=>{q=q.then(tick).catch(()=>{})};
async function tick(){
  tbSweep().catch(()=>{});
  const now=Date.now();
  const s=await chrome.storage.local.get(["ttLast","ttHost","cfg"]);
  const cfg=s.cfg||{},on=cfg.ttOn!==false;
  const delta=Math.min((now-(s.ttLast||now))/1000,120);
  const upd={ttLast:now};
  if(on&&s.ttHost&&delta>0){
    const {tt={}}=await chrome.storage.local.get("tt");
    const d=ymd();tt[d]=tt[d]||{};tt[d][s.ttHost]=(tt[d][s.ttHost]||0)+delta;
    const keys=Object.keys(tt).sort();
    while(keys.length>120)delete tt[keys.shift()];
    upd.tt=tt;
  }
  let host="";
  if(on){
    try{
      const idle=await chrome.idle.queryState(Math.max(15,cfg.ttIdle||60));
      if(idle==="active"){
        const w=await chrome.windows.getLastFocused();
        if(w.focused){
          const [t]=await chrome.tabs.query({active:true,windowId:w.id});
          if(t&&/^https?:/.test(t.url||""))host=new URL(t.url).hostname.replace(/^www\./,"");
        }
      }
    }catch(e){}
  }
  upd.ttHost=host;
  await chrome.storage.local.set(upd);
}
chrome.alarms.create("tt",{periodInMinutes:0.5});
chrome.alarms.onAlarm.addListener(a=>{if(a.name==="tt")enqueue()});
chrome.tabs.onActivated.addListener(enqueue);
chrome.tabs.onUpdated.addListener((id,ch)=>{if(ch.url||ch.status==="complete")enqueue()});
chrome.windows.onFocusChanged.addListener(enqueue);
chrome.idle.onStateChanged.addListener(enqueue);
chrome.runtime.onInstalled.addListener(enqueue);
chrome.runtime.onStartup.addListener(enqueue);

/* ---------- Palette search ---------- */
async function query(qs){
  qs=(qs||"").toLowerCase().trim();
  const tabs=(await chrome.tabs.query({})).filter(t=>!qs||(t.title||"").toLowerCase().includes(qs)||(t.url||"").toLowerCase().includes(qs))
    .slice(0,8).map(t=>({id:t.id,w:t.windowId,title:t.title,url:t.url}));
  let bm=[],hs=[];
  if(qs){
    bm=(await chrome.bookmarks.search(qs)).filter(b=>b.url).slice(0,6).map(b=>({title:b.title,url:b.url}));
    hs=(await chrome.history.search({text:qs,maxResults:6})).map(h=>({title:h.title,url:h.url}));
  }
  return {tabs,bm,hs};
}

/* ---------- Tab tools ---------- */
const COLORS=["blue","red","yellow","green","pink","purple","cyan","orange","grey"];
async function groupDomains(){
  const w=await chrome.windows.getLastFocused();
  const tabs=await chrome.tabs.query({windowId:w.id});
  const by={};
  for(const t of tabs){if(!/^https?:/.test(t.url||""))continue;const h=new URL(t.url).hostname.replace(/^www\./,"");(by[h]=by[h]||[]).push(t.id)}
  let i=0;
  for(const h in by){
    if(by[h].length<2)continue;
    const g=await chrome.tabs.group({tabIds:by[h],createProperties:{windowId:w.id}});
    await chrome.tabGroups.update(g,{title:h,color:COLORS[i++%COLORS.length]});
  }
}
async function closeDupes(){
  const tabs=await chrome.tabs.query({}),seen=new Set(),rm=[];
  for(const t of tabs.sort((a,b)=>(b.active-a.active))){
    if(!t.url||/^chrome/.test(t.url))continue;
    if(seen.has(t.url))rm.push(t.id);else seen.add(t.url);
  }
  if(rm.length)await chrome.tabs.remove(rm);
  return rm.length;
}

/* ---------- Full page screenshot ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function shot(tabId,mode){
  const tab=await chrome.tabs.get(tabId);
  const ex=(func,args=[])=>chrome.scripting.executeScript({target:{tabId},func,args}).then(r=>r[0].result);
  const m=await ex(()=>{
    document.documentElement.dataset.gsb=document.documentElement.style.scrollBehavior||"";
    document.documentElement.style.scrollBehavior="auto";
    return {H:Math.max(document.documentElement.scrollHeight,document.body?document.body.scrollHeight:0),vh:innerHeight,vw:innerWidth,dpr:devicePixelRatio,y:scrollY,title:document.title,url:location.href};
  });
  if(mode==="visible"){
    await ex(()=>{const st=document.createElement("style");st.id="__gshotv";st.textContent="glass-fx-host{visibility:hidden !important}";document.documentElement.appendChild(st)});
    await sleep(250);
    const img=await chrome.tabs.captureVisibleTab(tab.windowId,{format:"png"});
    await ex(()=>{document.getElementById("__gshotv")?.remove();document.documentElement.style.scrollBehavior=document.documentElement.dataset.gsb||""});
    await chrome.storage.local.set({shot:{strips:[{y:0,img}],vw:m.vw,H:m.vh,dpr:m.dpr,title:m.title,url:m.url,ts:Date.now(),mode:"visible"}});
    await chrome.tabs.create({url:chrome.runtime.getURL("shot.html")});
    return;
  }
  const H=Math.min(m.H,12000),strips=[];
  // Some sites (e.g. Google) turn the header fixed/sticky when scrolling, so hide it again before every strip
  const hideFn=()=>{
    document.querySelectorAll("*").forEach(el=>{
      const p=getComputedStyle(el).position;
      if((p==="fixed"||p==="sticky"||el.tagName==="GLASS-FX-HOST"||el.hasAttribute("data-glass-bar"))&&el.tagName!=="GLASS-FX-WALL")el.setAttribute("data-gsv","1");
    });
    if(!document.getElementById("__gshot")){
      const st=document.createElement("style");st.id="__gshot";
      st.textContent="[data-gsv],[data-gsv] *{visibility:hidden !important;opacity:0 !important}";
      document.documentElement.appendChild(st);
    }
  };
  await ex(h=>{
    const st=document.createElement("style");st.id="__gshotw";
    st.textContent=`glass-fx-wall{position:absolute !important;top:0 !important;left:0 !important;right:auto !important;bottom:auto !important;width:100% !important;height:${h}px !important;transform:none !important}`;
    document.documentElement.appendChild(st);
  },[m.H]);
  await sleep(250);
  for(let y=0;y<H;y+=m.vh){
    const ay=await ex(async yy=>{scrollTo(0,yy);await new Promise(r=>setTimeout(r,300));return scrollY},[y]);
    if(strips.length>0){await ex(hideFn);await sleep(150)}
    await sleep(620);
    const img=await chrome.tabs.captureVisibleTab(tab.windowId,{format:"jpeg",quality:92});
    strips.push({y:ay,img});
    if(ay+m.vh>=m.H)break;
  }
  await ex(y=>{document.querySelectorAll("[data-gsv]").forEach(el=>el.removeAttribute("data-gsv"));document.getElementById("__gshot")?.remove();document.getElementById("__gshotw")?.remove();document.documentElement.style.scrollBehavior=document.documentElement.dataset.gsb||"";scrollTo(0,y)},[m.y]);
  await chrome.storage.local.set({shot:{strips,vw:m.vw,H,dpr:m.dpr,title:m.title,url:m.url,ts:Date.now(),mode:"full"}});
  await chrome.tabs.create({url:chrome.runtime.getURL("shot.html")});
}

/* ---------- Messages ---------- */
chrome.runtime.onMessage.addListener((m,sender,send)=>{
  (async()=>{
    switch(m.t){
      case "q": send(await query(m.q));break;
      case "open":
        if(sender.tab&&!m.newTab)await chrome.tabs.update(sender.tab.id,{url:m.url});
        else await chrome.tabs.create({url:m.url});
        send({ok:1});break;
      case "switch": await chrome.tabs.update(m.id,{active:true});await chrome.windows.update(m.w,{focused:true});send({ok:1});break;
      case "group": await groupDomains();send({ok:1});break;
      case "dupes": send({n:await closeDupes()});break;
      case "sp": try{await chrome.sidePanel.open({tabId:sender.tab.id})}catch(e){}send({ok:1});break;
      case "shot": {
        let id=m.tabId||(sender.tab&&sender.tab.id);
        if(!id){const w=await chrome.windows.getLastFocused();const [t]=await chrome.tabs.query({active:true,windowId:w.id});id=t.id}
        await shot(id,m.mode);send({ok:1});break;
      }
      default: { const h=await extraMsg(m,sender); send(h===undefined?{}:h) }
    }
  })().catch(e=>send({err:String(e)}));
  return true;
});
