const $=id=>document.getElementById(id);
const toast=m=>{const t=$("toast");t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",2000)};
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return""}};
const ago=ts=>{const s=(Date.now()-ts)/1000;if(s<60)return"just now";if(s<3600)return Math.floor(s/60)+" min ago";if(s<86400)return Math.floor(s/3600)+" hr ago";return new Date(ts).toLocaleDateString("en-US")};
const el=(tag,props={},...kids)=>{const e=document.createElement(tag);Object.assign(e,props);kids.forEach(k=>e.append(k));return e};
let CL=[],SN=[];
function tab(w){
  $("pClip").style.display=w==="clip"?"":"none";$("pSnap").style.display=w==="snap"?"":"none";
  $("tClip").classList.toggle("on",w==="clip");$("tSnap").classList.toggle("on",w==="snap");
  history.replaceState(null,"","#"+w);
}
$("tClip").onclick=()=>tab("clip");$("tSnap").onclick=()=>tab("snap");
tab(location.hash==="#snap"?"snap":"clip");

async function delIds(ids){
  const {tomb={}}=await chrome.storage.local.get("tomb"),now=Date.now();
  ids.forEach(i=>tomb[i]=now);await chrome.storage.local.set({tomb});
}
async function copyTxt(t){try{await navigator.clipboard.writeText(t);toast("Copied")}catch(e){toast("Could not copy")}}

function drawClips(){
  const q=$("cq").value.trim().toLowerCase(),box=$("clist");box.innerHTML="";
  const list=CL.filter(c=>!q||c.text.toLowerCase().includes(q)||(c.url||"").toLowerCase().includes(q));
  $("cc").textContent=list.length+" items";
  if(!list.length){box.append(el("div",{className:"empty",textContent:CL.length?"Nothing found":"No clips saved yet. Select text on any web page and copy it (Ctrl+C) to see it here."}));return}
  for(const c of list.slice(0,300)){
    const pre=el("pre",{textContent:c.text,title:"Click to see all"});
    const card=el("div",{className:"glass clip"},pre);
    pre.onclick=()=>card.classList.toggle("open");
    const meta=el("div",{className:"meta"});
    meta.append(el("span",{textContent:ago(c.ts)+" · "+c.text.length+" chars"}));
    if(c.url)meta.append(el("a",{href:c.url,target:"_blank",textContent:hostOf(c.url)||c.url,title:c.title||c.url}));
    meta.append(el("span",{className:"sp"}));
    const b1=el("button",{className:"btn sm",textContent:"📄 Copy"});b1.onclick=()=>copyTxt(c.text);
    const b2=el("button",{className:"btn sm"+(c.pin?" pin":""),textContent:c.pin?"📌 Pinned":"📌 Pin"});
    b2.onclick=async()=>{const {clips=[]}=await chrome.storage.local.get("clips");const x=clips.find(y=>y.id===c.id);if(x){x.pin=!x.pin;x.mu=Date.now();await chrome.storage.local.set({clips})}};
    const b3=el("button",{className:"btn sm",textContent:"🗑"});
    b3.onclick=async()=>{const {clips=[]}=await chrome.storage.local.get("clips");await chrome.storage.local.set({clips:clips.filter(y=>y.id!==c.id)});await delIds([c.id])};
    meta.append(b1,b2,b3);card.append(meta);box.append(card);
  }
}
function drawSnaps(){
  const q=$("sq").value.trim().toLowerCase(),box=$("slist");box.innerHTML="";
  const list=SN.filter(s=>!q||(s.title+" "+s.url+" "+s.text).toLowerCase().includes(q));
  $("sc").textContent=list.length+" items";
  if(!list.length){box.append(el("div",{className:"empty",style:"grid-column:1/-1",textContent:SN.length?"Nothing found":"No snapshots yet. Press Alt+Shift+S or use the button above."}));return}
  for(const s of list){
    const c=el("div",{className:"glass sc"},el("img",{src:s.thumb,loading:"lazy"}),el("div",{className:"t"},el("b",{textContent:s.title}),el("small",{textContent:hostOf(s.url)+" · "+ago(s.ts)})));
    c.onclick=()=>openSnap(s);box.append(c);
  }
}
function openSnap(s){
  const mb=$("mb");mb.innerHTML="";
  const row=el("div",{style:"display:flex;gap:8px;flex-wrap:wrap"});
  const go=el("button",{className:"btn pri",textContent:"🔗 Open page"});go.onclick=()=>chrome.tabs.create({url:s.url});
  const cp=el("button",{className:"btn",textContent:"📄 Copy text"});cp.onclick=()=>copyTxt(s.text||"");
  const cu=el("button",{className:"btn",textContent:"🔗 Copy link"});cu.onclick=()=>copyTxt(s.url);
  const dl=el("button",{className:"btn",textContent:"🗑 Delete"});
  dl.onclick=async()=>{if(!confirm("Delete this snapshot (from all devices too)?"))return;const {snaps=[]}=await chrome.storage.local.get("snaps");await chrome.storage.local.set({snaps:snaps.filter(x=>x.id!==s.id)});await delIds([s.id]);$("modal").classList.remove("open")};
  const cl=el("button",{className:"btn",textContent:"✕ Close"});cl.onclick=()=>$("modal").classList.remove("open");
  row.append(go,cp,cu,dl,cl);
  mb.append(el("h3",{textContent:s.title,style:"font-weight:500"}),el("div",{textContent:s.url+" · "+new Date(s.ts).toLocaleString("en-US"),style:"opacity:.65;font-size:.8rem;word-break:break-all"}),el("img",{src:s.thumb}));
  if(s.sel)mb.append(el("div",{textContent:"Selected text:",style:"opacity:.7;font-size:.82rem"}),el("pre",{textContent:s.sel}));
  mb.append(el("div",{textContent:"Saved page text:",style:"opacity:.7;font-size:.82rem"}),el("pre",{textContent:s.text||"(no text)"}),row);
  $("modal").classList.add("open");
}
$("modal").onmousedown=e=>{if(e.target===$("modal"))$("modal").classList.remove("open")};
$("cq").oninput=drawClips;$("sq").oninput=drawSnaps;
$("cClr").onclick=async()=>{
  if(!confirm("Delete all clipboard items except pinned ones (from all devices too). Are you sure?"))return;
  const {clips=[]}=await chrome.storage.local.get("clips");
  await delIds(clips.filter(c=>!c.pin).map(c=>c.id));
  await chrome.storage.local.set({clips:clips.filter(c=>c.pin)});
};
$("sNow").onclick=async()=>{
  const [t]=await chrome.tabs.query({active:true,lastFocusedWindow:true,url:["http://*/*","https://*/*"]});
  if(!t)return toast("Switch to another web page tab first");
  toast("Taking snapshot…");const r=await chrome.runtime.sendMessage({t:"snap",tabId:t.id});
  toast(r&&r.ok?"Snapshot saved":"❌ "+(r&&r.err||"Failed"));
};
async function load(){const r=await chrome.storage.local.get(["clips","snaps"]);CL=r.clips||[];SN=r.snaps||[];drawClips();drawSnaps()}
chrome.storage.onChanged.addListener(ch=>{
  if(ch.clips||ch.snaps)load();
  if(ch.fbStatus)syncSt(ch.fbStatus.newValue);
});
function syncSt(st){$("syncSt").textContent=!st||st.off?"":st.ok?"🔥 Sync OK · "+new Date(st.ts).toLocaleTimeString("en-US"):"⚠ Sync problem — check Sync Settings"}
load();chrome.storage.local.get("fbStatus").then(r=>syncSt(r.fbStatus));
