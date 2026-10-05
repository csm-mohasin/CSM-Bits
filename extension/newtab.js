const $=id=>document.getElementById(id);
let C={...DEF};
const ymdN=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fmt=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${m}m`:m?`${m}m`:`${s}s`};

/* ---------- clock & greeting ---------- */
function tick(){
 const d=new Date(),h=d.getHours();
 $("time").textContent=d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
 $("date").textContent=d.toLocaleDateString("en-US",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
 const g=h<5?"Good night":h<12?"Good morning":h<16?"Good afternoon":h<18?"Good afternoon":"Good evening";
 const nm=C.userName||(C.pfOn?(String(C.pfName||"").split(" ")[1]||""):"");
 $("greet").textContent=C.greet?g+(nm?", "+nm:""):"";
 if($("pfTime")){$("pfTime").textContent=$("time").textContent;$("pfDate").textContent=$("date").textContent;$("pfGreet").textContent=$("greet").textContent}
}
setInterval(tick,1000);
chrome.storage.local.get("tt").then(r=>{const t=(r.tt||{})[ymdN()]||{};$("today").textContent=$("pfToday").textContent="⏱ Today: "+fmt(Object.values(t).reduce((a,b)=>a+b,0))});

/* ---------- history / bookmarks ---------- */
const item=(t,u)=>{const a=document.createElement("a");a.className="item";a.href=u;a.textContent=(t||u).slice(0,60);return a.outerHTML};
function loadLists(){
 chrome.bookmarks.getRecent(C.bmN,l=>$("bm").innerHTML=l.filter(b=>b.url).map(b=>item(b.title,b.url)).join(""));
 chrome.history.search({text:"",maxResults:C.histN,startTime:0},l=>$("hs").innerHTML=l.map(h=>item(h.title,h.url)).join(""));
}
function ui(){
 $("bmBox").style.display=C.showBm?"":"none";$("hsBox").style.display=C.showHist?"":"none";
 $("lists").classList.toggle("one",!(C.showBm&&C.showHist));$("lists").style.display=(C.showBm||C.showHist)?"":"none";
 $("todoBox").style.display=C.showTodo?"":"none";$("pomoBox").style.display=C.showPomo?"":"none";
 $("wg").style.display=(C.showTodo||C.showPomo)?"":"none";$("wg").style.gridTemplateColumns=(C.showTodo&&C.showPomo)?"1fr 1fr":"1fr";
 $("eng").value=C.engine;$("lockBtn").style.display=C.lkOn?"":"none";tick();
}

/* ---------- search with bangs ---------- */
const ENG={google:"https://www.google.com/search?q=",bing:"https://www.bing.com/search?q=",duck:"https://duckduckgo.com/?q=",youtube:"https://www.youtube.com/results?search_query=",github:"https://github.com/search?q="};
const BANGS={yt:ENG.youtube,gh:ENG.github,g:ENG.google,b:ENG.bing,ddg:ENG.duck,w:"https://en.wikipedia.org/w/index.php?search=",maps:"https://www.google.com/maps/search/",tr:"https://translate.google.com/?sl=auto&tl=bn&op=translate&text="};
$("sf").onsubmit=e=>{
 e.preventDefault();const q=$("q").value.trim();if(!q)return;
 if(/^https?:\/\/\S+$/i.test(q)){location.href=q;return}
 if(/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(q)){location.href="https://"+q;return}
 const m=q.match(/^(\w+)\s+(.+)/);
 if(m&&BANGS[m[1].toLowerCase()]){location.href=BANGS[m[1].toLowerCase()]+encodeURIComponent(m[2]);return}
 location.href=(ENG[C.engine]||ENG.google)+encodeURIComponent(q);
};
$("eng").onchange=e=>saveCfg({engine:e.target.value});

/* ---------- wallpaper quick panel ---------- */
$("gear").onclick=()=>$("panel").classList.toggle("open");
$("lockBtn").onclick=async()=>{const r=await chrome.runtime.sendMessage({t:"lk-now"});if(r&&r.err)alert(r.err)};
PRESETS.forEach((g,i)=>{const s=document.createElement("span");s.style.background=g;s.onclick=()=>saveCfg({type:"preset",preset:i});$("presets").appendChild(s)});
$("pick").onclick=()=>$("file").click();
$("file").onchange=e=>{
 const f=e.target.files[0];if(!f)return;
 if(/^video\//.test(f.type)||f.type==="image/gif"||/\.(gif|mp4|webm)$/i.test(f.name)){uploadWall(f).catch(err=>alert(err.message));e.target.value="";return}
 const img=new Image();img.onload=()=>{
  const k=Math.min(1,2560/img.width),c=document.createElement("canvas");
  c.width=img.width*k;c.height=img.height*k;c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  saveCfg({type:"image",data:c.toDataURL("image/jpeg",.88)});
 };img.src=URL.createObjectURL(f);
};
$("setUrl").onclick=()=>{const u=$("url").value.trim();if(u)saveCfg({type:"url",url:u})};
const sl=[["wb","wbv","px"],["ga","gav","%"],["gb","gbv","px"]];
const syncSliders=()=>sl.forEach(([k,v,u])=>{$(k).value=C[k];$(v).textContent=C[k]+u});
sl.forEach(([k,v,u])=>$(k).oninput=e=>{$(v).textContent=e.target.value+u;saveCfg({[k]:+e.target.value})});

/* ---------- wallpaper slideshow ---------- */
async function slideTick(onLoad){
 const c=await loadCfg();if(!c.slide)return;
 const walls=(await chrome.storage.local.get("walls")).walls||[];if(walls.length<2)return;
 const due=(c.slideMode==="newtab"&&onLoad)||(c.slideMode==="timed"&&Date.now()-c.slideAt>c.slideMin*60000);
 if(!due)return;
 const idx=(c.slideIdx+1)%walls.length;
 await saveCfg({type:"image",data:walls[idx].data,slideIdx:idx,slideAt:Date.now()});
}
setInterval(()=>slideTick(false),60000);

/* ---------- To-do ---------- */
let todos=[];
async function loadTodos(){todos=(await chrome.storage.local.get("todos")).todos||[];renderTodos()}
const saveTodos=()=>chrome.storage.local.set({todos});
function renderTodos(){
 const box=$("tdl");box.innerHTML="";
 if(!todos.length)box.innerHTML='<p style="opacity:.55;font-size:.85rem">No tasks 🎉</p>';
 todos.forEach((t,i)=>{
  const r=document.createElement("div");r.className="td"+(t.d?" done":"");
  const c=document.createElement("input");c.type="checkbox";c.checked=!!t.d;c.onchange=()=>{t.d=c.checked;saveTodos();renderTodos()};
  const s=document.createElement("span");s.textContent=t.t;
  const x=document.createElement("b");x.textContent="✕";x.onclick=()=>{todos.splice(i,1);saveTodos();renderTodos()};
  r.append(c,s,x);box.appendChild(r);
 });
}
$("tdi").onkeydown=e=>{if(e.key==="Enter"&&e.target.value.trim()){todos.unshift({t:e.target.value.trim(),d:false});e.target.value="";saveTodos();renderTodos()}e.stopPropagation()};

/* ---------- Pomodoro ---------- */
const P={mode:"work",left:25*60,run:false,iv:null};
function pShow(){
 $("pm").textContent=String(Math.floor(P.left/60)).padStart(2,"0")+":"+String(P.left%60).padStart(2,"0");
 $("pml").textContent=P.mode==="work"?"🎯 Focus":"☕ Break";
 $("pgo").textContent=P.run?"⏸ Pause":"▶ Start";
}
function pReset(m){P.mode=m||P.mode;P.left=(P.mode==="work"?C.pomoWork:C.pomoBreak)*60;pShow()}
function beep(){try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.15;o.start();setTimeout(()=>{o.stop();a.close()},500)}catch(e){}}
$("pgo").onclick=()=>{
 P.run=!P.run;clearInterval(P.iv);
 if(P.run)P.iv=setInterval(()=>{P.left--;if(P.left<=0){beep();pReset(P.mode==="work"?"break":"work")}pShow();document.title=P.run?$("pm").textContent+" · New Tab":"New Tab"},1000);
 else document.title="New Tab";
 pShow();
};
$("prs").onclick=()=>pReset();
$("psk").onclick=()=>pReset(P.mode==="work"?"break":"work");

/* ---------- App drawer (Quick Links + folders + drag) ---------- */
let links=[],dragId=null,mergeT=null,lastMove=0,ctxCtx=null,editId=null,openFold=null;
const favUrl=u=>chrome.runtime.getURL("/_favicon/")+"?pageUrl="+encodeURIComponent(u)+"&size=64";
function find(id,arr=links,parent=null){
 for(const n of arr){
  if(n.id===id)return{n,arr,parent};
  if(n.folder){const r=find(id,n.items,n);if(r)return r}
 }
 return null;
}
const saveLinks=()=>chrome.storage.local.set({links});
function iconEl(l){
 if(l.icon){const s=document.createElement("span");s.textContent=l.icon;return s}
 const letter=()=>{const s=document.createElement("span");s.textContent=(l.name||"?")[0].toUpperCase();return s};
 if(C.lkFav){const im=document.createElement("img");im.src=favUrl(l.url);im.draggable=false;im.onerror=()=>im.replaceWith(letter());return im}
 return letter();
}
function tile(n){
 const d=document.createElement("div");d.className="lk";d.dataset.id=n.id;d.draggable=true;
 const ic=document.createElement("div");ic.className="ic";
 if(n.folder){ic.classList.add("fold");(n.items||[]).slice(0,4).forEach(it=>{const m=document.createElement("div");m.className="mini";m.appendChild(iconEl(it));ic.appendChild(m)});if(!n.items.length)ic.textContent="📁"}
 else ic.appendChild(iconEl(n));
 const nm=document.createElement("div");nm.className="nm";nm.textContent=n.name;
 d.append(ic,nm);
 d.onclick=e=>{if(n.folder)showFolder(n);else if(e.ctrlKey||e.metaKey)window.open(n.url,"_blank");else location.href=n.url};
 d.onauxclick=e=>{if(e.button===1&&!n.folder){e.preventDefault();window.open(n.url,"_blank")}};
 d.oncontextmenu=e=>{e.preventDefault();showCtx(e,n)};
 return d;
}
function renderLinks(){
 const box=$("links");
 box.className=`shape-${C.lkShape} ${C.lkLabels?"":"hide-nm"}`;
 box.style.setProperty("--lk-size",C.lkSize+"px");box.style.setProperty("--lk-gap",C.lkGap+"px");
 box.innerHTML="";links.forEach(n=>box.appendChild(tile(n)));
 const add=document.createElement("div");add.className="lk add";add.innerHTML='<div class="ic">＋</div><div class="nm">Add</div>';
 add.onclick=()=>openModal(null);box.appendChild(add);
 if(openFold){const f=find(openFold.id);if(f)fillFolder(f.n);else $("fmodal").classList.remove("open")}
}
async function loadLinks(){
 const r=await chrome.storage.local.get("links");
 if(!r.links){links=[{id:1,name:"YouTube",url:"https://youtube.com"},{id:2,name:"GitHub",url:"https://github.com"},{id:3,name:"Gmail",url:"https://mail.google.com"},{id:4,name:"Facebook",url:"https://facebook.com"}];await saveLinks()}
 else links=r.links;
 renderLinks();
}
/* FLIP animation for live reorder */
function flip(fn){
 const box=$("links"),els=[...box.querySelectorAll(".lk")],first=new Map(els.map(e=>[e,e.getBoundingClientRect()]));
 fn();
 els.forEach(e=>{
  const a=first.get(e),b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;
  if(dx||dy)e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:"none"}],{duration:200,easing:"ease-out"});
 });
}
const clearMerge=()=>{$("links").querySelectorAll(".merge").forEach(e=>e.classList.remove("merge"));mergeT=null};
(()=>{
 const box=$("links");
 box.addEventListener("dragstart",e=>{
  const t=e.target.closest(".lk");if(!t||t.classList.contains("add")){e.preventDefault();return}
  dragId=+t.dataset.id;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(dragId));
  setTimeout(()=>t.classList.add("dragging"),0);
 });
 box.addEventListener("dragover",e=>{
  if(dragId==null)return;e.preventDefault();e.dataTransfer.dropEffect="move";
  const t=e.target.closest(".lk:not(.add)");clearMerge();
  if(!t||+t.dataset.id===dragId)return;
  const r=t.getBoundingClientRect(),rx=(e.clientX-r.left)/r.width;
  if(rx>.3&&rx<.7){t.classList.add("merge");mergeT=+t.dataset.id;return}
  if(performance.now()-lastMove<120)return;
  const dragEl=box.querySelector(`.lk[data-id="${dragId}"]`);if(!dragEl)return;
  const ref=rx<=.3?t:t.nextElementSibling;
  if(ref!==dragEl&&dragEl.nextElementSibling!==ref){lastMove=performance.now();flip(()=>box.insertBefore(dragEl,ref))}
 });
 box.addEventListener("drop",async e=>{
  e.preventDefault();if(dragId==null)return;
  const id=dragId,tgt=mergeT;clearMerge();dragId=null;
  if(tgt!=null)await mergeInto(id,tgt);
  else{
   const ids=[...box.querySelectorAll(".lk:not(.add)")].map(el=>+el.dataset.id);
   links=ids.map(i=>links.find(l=>l.id===i)).filter(Boolean);await saveLinks();
  }
  renderLinks();
 });
 box.addEventListener("dragend",()=>{clearMerge();dragId=null;renderLinks()});
})();
async function mergeInto(srcId,tgtId){
 const si=links.findIndex(l=>l.id===srcId),ti=links.findIndex(l=>l.id===tgtId);
 if(si<0||ti<0||si===ti)return;
 const src=links[si],tgt=links[ti];
 if(tgt.folder){
  if(src.folder)tgt.items.push(...src.items);else tgt.items.push(src);
  links.splice(si,1);
 }else if(src.folder){
  src.items.push(tgt);links.splice(ti,1);
 }else{
  links[ti]={id:Date.now(),name:"Folder",folder:true,items:[tgt,src]};links.splice(si,1);
 }
 await saveLinks();
}
/* folder popup */
function fillFolder(f){
 $("fName").value=f.name;const box=$("fl");box.innerHTML="";
 f.items.forEach(it=>{
  const t=tile(it);t.draggable=false;t.style.width="calc("+C.lkSize+"px + 24px)";
  t.querySelector(".ic").style.cssText=`width:${C.lkSize}px;height:${C.lkSize}px`;
  t.oncontextmenu=e=>{e.preventDefault();showCtx(e,it,f)};
  box.appendChild(t);
 });
 if(!f.items.length)box.innerHTML='<p style="opacity:.6">Folder is empty</p>';
}
function showFolder(f){openFold=f;fillFolder(f);$("fmodal").classList.add("open")}
$("fName").onchange=async()=>{if(!openFold)return;const f=find(openFold.id);if(f){f.n.name=$("fName").value.trim()||"Folder";await saveLinks();renderLinks()}};
const closeFold=()=>{openFold=null;$("fmodal").classList.remove("open")};
$("fClose").onclick=closeFold;
$("fmodal").onmousedown=e=>{if(e.target===$("fmodal"))closeFold()};
/* context menu */
function showCtx(e,n,folder){
 const m=$("ctx");m.innerHTML="";
 const add=(t,fn)=>{const d=document.createElement("div");d.textContent=t;d.onclick=async()=>{m.style.display="none";await fn()};m.appendChild(d)};
 if(n.folder){
  add("📂 Open",()=>showFolder(n));
  add("✏ Rename",()=>openModal(n.id));
  add("💥 Ungroup folder",async()=>{const i=links.findIndex(l=>l.id===n.id);links.splice(i,1,...n.items);await saveLinks();renderLinks()});
 }else{
  add("↗ Open in new tab",()=>window.open(n.url,"_blank"));
  add("✏ x",()=>openModal(n.id));
  if(folder)add("⬅ Move out of folder",async()=>{const i=folder.items.findIndex(x=>x.id===n.id);folder.items.splice(i,1);links.push(n);if(!folder.items.length)links=links.filter(l=>l.id!==folder.id);await saveLinks();renderLinks()});
 }
 add("🗑 Delete",async()=>{const r=find(n.id);if(r){r.arr.splice(r.arr.indexOf(r.n),1);await saveLinks();renderLinks()}});
 m.style.display="block";
 m.style.left=Math.min(e.clientX,innerWidth-210)+"px";m.style.top=Math.min(e.clientY,innerHeight-m.offsetHeight-10)+"px";
}
addEventListener("click",()=>$("ctx").style.display="none");
addEventListener("keydown",e=>{if(e.key==="Escape"){$("ctx").style.display="none";$("modal").classList.remove("open");closeFold()}});
/* add / edit modal */
function openModal(id){
 editId=id;const r=id!=null?find(id):null,l=r?r.n:{name:"",url:"",icon:""};
 $("mt").textContent=id==null?"New link":(l.folder?"Folder name":"Edit link");
 $("mName").value=l.name;$("mUrl").value=l.url||"";$("mIcon").value=l.icon||"";
 $("mUrl").style.display=$("mIcon").style.display=l.folder?"none":"";
 $("modal").classList.add("open");$("mName").focus();
}
$("mCancel").onclick=()=>$("modal").classList.remove("open");
$("mSave").onclick=async()=>{
 const r=editId!=null?find(editId):null;
 if(r&&r.n.folder){r.n.name=$("mName").value.trim()||"Folder"}
 else{
  let url=$("mUrl").value.trim();if(!url)return;
  if(!/^[a-z]+:\/\//i.test(url))url="https://"+url;
  const o={name:$("mName").value.trim()||new URL(url).hostname.replace(/^www\./,""),url,icon:$("mIcon").value.trim()};
  if(r)Object.assign(r.n,o);else links.push({id:Date.now(),...o});
 }
 await saveLinks();$("modal").classList.remove("open");renderLinks();
};
[$("mName"),$("mUrl"),$("mIcon")].forEach(i=>i.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter")$("mSave").click()}));

/* ---------- init ---------- */
chrome.storage.onChanged.addListener(ch=>{
 if(ch.cfg){
  const o=C;C={...DEF,...ch.cfg.newValue};syncSliders();ui();
  if(o.histN!==C.histN||o.bmN!==C.bmN)loadLists();
  if(!P.run&&(o.pomoWork!==C.pomoWork||o.pomoBreak!==C.pomoBreak))pReset();
  if(dragId==null)renderLinks();
 }
 if(ch.links&&dragId==null){links=ch.links.newValue||[];renderLinks()}
 if(ch.todos){todos=ch.todos.newValue||[];renderTodos()}
});
(async()=>{
 C=await loadCfg();syncSliders();ui();tick();pReset("work");
 loadLists();loadLinks();loadTodos();slideTick(true);
})();
