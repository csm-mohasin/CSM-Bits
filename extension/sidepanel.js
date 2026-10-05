const $=id=>document.getElementById(id);
const item=(t,u)=>{const a=document.createElement("a");a.className="item";a.href=u;a.target="_blank";a.textContent=(t||u).slice(0,45);return a.outerHTML};
function loadLists(c){
 $("bmBox").style.display=c.showBm?"":"none";$("hsBox").style.display=c.showHist?"":"none";
 chrome.bookmarks.getRecent(c.bmN,l=>$("bm").innerHTML=l.filter(b=>b.url).map(b=>item(b.title,b.url)).join(""));
 chrome.history.search({text:"",maxResults:c.histN,startTime:0},l=>$("hs").innerHTML=l.map(h=>item(h.title,h.url)).join(""));
}
let lastN="";
async function lists(){const c=await loadCfg(),k=[c.bmN,c.histN,c.showBm,c.showHist].join();if(k!==lastN){lastN=k;loadLists(c)}}

/* sessions */
async function sessions(){
 const s=(await chrome.storage.local.get("sessions")).sessions||[],box=$("sList");box.innerHTML="";
 if(!s.length){box.innerHTML='<p class="small" style="margin-top:6px">No saved sessions</p>';return}
 s.forEach((x,i)=>{
  const r=document.createElement("div");r.className="tr";
  const sp=document.createElement("span");sp.textContent=`${x.name} · ${x.urls.length} items`;sp.title=new Date(x.ts).toLocaleString("en-US");
  const go=document.createElement("b");go.textContent="▶";go.title="Open in new window";
  go.onclick=e=>{e.stopPropagation();chrome.windows.create({url:x.urls.map(u=>u.url)})};
  const del=document.createElement("b");del.textContent="🗑";
  del.onclick=async e=>{e.stopPropagation();s.splice(i,1);await chrome.storage.local.set({sessions:s});sessions()};
  r.onclick=()=>go.onclick(new Event("c"));
  r.append(sp,go,del);box.appendChild(r);
 });
}
$("sSave").onclick=async()=>{
 const w=await chrome.windows.getLastFocused(),tabs=await chrome.tabs.query({windowId:w.id});
 const urls=tabs.filter(t=>/^https?:/.test(t.url||"")).map(t=>({title:t.title,url:t.url}));
 if(!urls.length)return;
 const s=(await chrome.storage.local.get("sessions")).sessions||[];
 s.unshift({id:Date.now(),name:$("sName").value.trim()||new Date().toLocaleString("en-US"),ts:Date.now(),urls});
 await chrome.storage.local.set({sessions:s.slice(0,30)});$("sName").value="";sessions();
};

let H="";
async function curTab(){const [t]=await chrome.tabs.query({active:true,lastFocusedWindow:true});return t}
async function refresh(){
 const t=await curTab();
 try{H=new URL(t.url).hostname}catch(e){H=""}
 const c=await loadCfg(),off=c.skip.includes(H);
 $("host").textContent="🌐 "+(H||"—");
 $("site").textContent=off?"Glass on this site: Off (click to enable)":"Glass on this site: On (click to disable)";
 if(document.activeElement!==$("note")){
  const n=((await chrome.storage.local.get("notes")).notes||{})[H]||"";
  $("note").value=n;$("note").disabled=!H;
 }
}
$("site").onclick=async()=>{if(!H)return;const c=await loadCfg();await saveCfg({skip:c.skip.includes(H)?c.skip.filter(x=>x!==H):[...c.skip,H]});refresh()};

/* notes */
let nt=null;
$("note").oninput=()=>{
 $("nst").textContent="…";clearTimeout(nt);
 nt=setTimeout(async()=>{
  if(!H)return;const r=await chrome.storage.local.get("notes"),n=r.notes||{};
  if($("note").value.trim())n[H]=$("note").value;else delete n[H];
  await chrome.storage.local.set({notes:n});$("nst").textContent="✓ Save";
 },300);
};

/* tab manager */
async function renderTabs(){
 const q=$("tq").value.toLowerCase().trim();
 const all=await chrome.tabs.query({}),cw=await chrome.windows.getLastFocused();
 const wins={};
 all.filter(t=>!q||(t.title||"").toLowerCase().includes(q)||(t.url||"").toLowerCase().includes(q)).forEach(t=>(wins[t.windowId]=wins[t.windowId]||[]).push(t));
 const groups={};
 try{(await chrome.tabGroups.query({})).forEach(g=>groups[g.id]=g)}catch(e){}
 $("tcount").textContent=all.length+" tabs";
 const box=$("tabs");box.innerHTML="";
 Object.keys(wins).sort((a,b)=>(+b===cw.id)-(+a===cw.id)).forEach((w,wi)=>{
  const hd=document.createElement("div");hd.className="win";hd.textContent=(+w===cw.id?"Current window":"Window "+(wi+1))+" · "+wins[w].length;box.appendChild(hd);
  let lastG=null;
  wins[w].forEach(t=>{
   if(t.groupId>0&&t.groupId!==lastG&&groups[t.groupId]){
    const g=groups[t.groupId],gh=document.createElement("div");gh.className="win";gh.textContent="▸ "+(g.title||"Group");gh.style.color=g.color==="grey"?"#bbb":g.color;box.appendChild(gh);
   }
   lastG=t.groupId;
   const r=document.createElement("div");r.className="tr"+(t.active&&+w===cw.id?" act":"");
   const im=document.createElement("img");im.src=chrome.runtime.getURL("/_favicon/")+"?pageUrl="+encodeURIComponent(t.url||"")+"&size=32";im.onerror=()=>im.style.visibility="hidden";
   const sp=document.createElement("span");sp.textContent=t.title||t.url;sp.title=t.url;
   const x=document.createElement("b");x.textContent="✕";
   x.onclick=e=>{e.stopPropagation();chrome.tabs.remove(t.id)};
   r.onclick=()=>{chrome.tabs.update(t.id,{active:true});chrome.windows.update(t.windowId,{focused:true})};
   r.append(im,sp,x);box.appendChild(r);
  });
 });
}
$("tq").oninput=renderTabs;
$("grp").onclick=async()=>{await chrome.runtime.sendMessage({t:"group"});renderTabs()};
$("dup").onclick=async()=>{const r=await chrome.runtime.sendMessage({t:"dupes"});$("tcount").textContent=(r&&r.n||0)+" duplicates closed";setTimeout(renderTabs,600)};
$("ungrp").onclick=async()=>{const w=await chrome.windows.getLastFocused(),ts=await chrome.tabs.query({windowId:w.id});const ids=ts.filter(t=>t.groupId>0).map(t=>t.id);if(ids.length)await chrome.tabs.ungroup(ids);renderTabs()};
$("shot").onclick=async()=>{const t=await curTab();chrome.runtime.sendMessage({t:"shot",tabId:t.id,mode:"full"})};
$("shotv").onclick=async()=>{const t=await curTab();chrome.runtime.sendMessage({t:"shot",tabId:t.id,mode:"visible"})};
let rt=null;const later=()=>{clearTimeout(rt);rt=setTimeout(()=>{renderTabs();refresh()},200)};
["onCreated","onRemoved","onUpdated","onMoved","onActivated","onAttached","onDetached"].forEach(k=>chrome.tabs[k].addListener(later));
try{chrome.tabGroups.onUpdated.addListener(later)}catch(e){}
chrome.storage.onChanged.addListener(ch=>{if(ch.cfg){refresh();lists()}if(ch.notes)refresh();if(ch.sessions)sessions()});
refresh();renderTabs();lists();sessions();

$("snap").onclick=async()=>{const t=await curTab();if(!t)return;const r=await chrome.runtime.sendMessage({t:"snap",tabId:t.id});$("snap").textContent=r&&r.ok?"✅ saved":"❌ "+(r&&r.err||"Failed");setTimeout(()=>$("snap").textContent="📷 Snapshot",1800)};

/* ---- Firebase quick setup ---- */
(async()=>{
 $("ver").textContent="v"+chrome.runtime.getManifest().version;
 const FB=(await chrome.storage.local.get("fb")).fb||{};
 $("fbK").value=FB.apiKey||"";$("fbP").value=FB.projectId||"";$("fbW").value=FB.pass||"";
 const show=st=>{const e=$("fbS");if(!st){e.textContent=FB.on?"":"Not enabled yet";return}
  e.style.color=st.ok?"#8dffb0":"#ff9d9d";e.textContent=st.off?"Close":st.ok?"✅ Sync OK · ↑"+st.up+" ↓"+st.down:"❌ "+st.err};
 show((await chrome.storage.local.get("fbStatus")).fbStatus);
 chrome.storage.onChanged.addListener(c=>{if(c.fbStatus)show(c.fbStatus.newValue)});
 $("fbGo").onclick=async()=>{
  const k=$("fbK").value.trim(),p=$("fbP").value.trim();
  if(!k||!p){$("fbS").style.color="#ff9d9d";$("fbS").textContent="API Key and Project ID are both required";return}
  const f={...FB,apiKey:k,projectId:p,pass:$("fbW").value,on:true};Object.assign(FB,f);
  await chrome.storage.local.set({fb:f});$("fbS").style.color="";$("fbS").textContent="Syncing…";
  show(await chrome.runtime.sendMessage({t:"sync"}));
 };
})();
