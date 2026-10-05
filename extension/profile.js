/* Profile card on the New Tab (portfolio-style hero) */
(()=>{
const $=id=>document.getElementById(id);
let C={...DEF},tw=null,key="",PH="";
const safe=u=>{try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:""}catch(e){return""}};
const list=s=>String(s||"").split(",").map(x=>x.trim()).filter(Boolean);
$("pfStamp").textContent="v"+chrome.runtime.getManifest().version;
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const ymd=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fmtT=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+"h "+m+"m":m+"m"};
function countUp(el,to){
  const from=+el.dataset.v||0;el.dataset.v=to;
  if(RM||from===to){el.textContent=to;return}
  const t0=performance.now();
  const f=t=>{const p=Math.min(1,(t-t0)/700);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)};
  requestAnimationFrame(f);
}
async function stats(){
  if(C.pfOn===false||C.pfStatsOn===false)return;
  const r=await chrome.storage.local.get(["tt","todos","clips","snaps"]);
  const day=(r.tt||{})[ymd()]||{};
  $("stT").textContent=fmtT(Object.values(day).reduce((a,b)=>a+b,0));
  countUp($("stK"),(r.todos||[]).filter(t=>!t.d).length);
  countUp($("stC"),(r.clips||[]).length);
  countUp($("stS"),(r.snaps||[]).length);
}
const initials=n=>String(n||"?").split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase()||"?";
function typer(roles){
  clearTimeout(tw);const el=$("pfTw");
  if(!roles.length){el.textContent="";return}
  if(matchMedia("(prefers-reduced-motion: reduce)").matches){el.textContent=roles[0];return}
  let i=0,j=0,del=false;
  const step=()=>{
    const w=roles[i%roles.length];
    j+=del?-1:1;el.textContent=w.slice(0,j);
    let d=del?35:75;
    if(!del&&j===w.length){del=true;d=1700}
    else if(del&&j===0){del=false;i++;d=350}
    tw=setTimeout(step,d);
  };
  step();
}
function render(){
  const on=C.pfOn!==false;
  document.body.classList.toggle("pf-off",!on);
  if(!on){clearTimeout(tw);key="";return}
  $("pf").classList.toggle("plain",C.pfNeon===false);
  document.body.classList.toggle("pf-fx",C.pfFx!==false&&!RM);
  $("pfVer").style.display=C.pfVerified===false?"none":"";
  $("pfAvail").style.display=C.pfAvail===false||!C.pfAvailTxt?"none":"";$("pfAvailTxt").textContent=C.pfAvailTxt||"";
  $("pfStats").style.display=C.pfStatsOn===false?"none":"";
  const mail=String(C.pfMail||"").trim(),cv=safe(C.pfCv);
  $("pfMail").style.display=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)?"":"none";if($("pfMail").style.display==="")$("pfMail").href="mailto:"+mail;
  $("pfCv").style.display=cv?"":"none";if(cv)$("pfCv").href=cv;
  stats();
  $("pfName").textContent=C.pfName||"";
  $("pfRole").textContent=C.pfRole||"";
  $("pfBio").textContent=C.pfBio||"";$("pfBio").style.display=C.pfBio?"":"none";
  $("pfLoc").textContent=C.pfLoc?"📍 "+C.pfLoc:"";
  const ch=$("pfChips");ch.innerHTML="";
  list(C.pfSkills).forEach(s=>{const e=document.createElement("span");e.textContent=s;ch.appendChild(e)});
  const site=safe(C.pfSite),git=safe(C.pfGit);
  $("pfSite").style.display=site?"":"none";if(site)$("pfSite").href=site;
  $("pfGit").style.display=git?"":"none";if(git)$("pfGit").href=git;
  $("pfInit").textContent=initials(C.pfName);
  const img=$("pfImg"),src=PH||safe(C.pfPhoto);
  img.onload=()=>{img.hidden=false;$("pfInit").style.display="none"};
  img.onerror=()=>{img.hidden=true;$("pfInit").style.display=""};
  if(src){if(img.getAttribute("src")!==src)img.src=src}else{img.removeAttribute("src");img.hidden=true;$("pfInit").style.display=""}
  const k=C.pfRoles;if(k!==key){key=k;typer(list(k))}
}
chrome.storage.onChanged.addListener(ch=>{
  if(ch.pfPhotoData){PH=ch.pfPhotoData.newValue||"";render()}
  if(ch.cfg){C={...DEF,...ch.cfg.newValue};render()}
  else if(ch.tt||ch.todos||ch.clips||ch.snaps)stats();
});
/* effects: cursor spotlight + photo tilt */
const pf=$("pf"),ph=document.querySelector(".pf-photo");
pf.addEventListener("mousemove",e=>{
  if(!document.body.classList.contains("pf-fx"))return;
  const r=pf.getBoundingClientRect();pf.style.setProperty("--mx",(e.clientX-r.left)+"px");pf.style.setProperty("--my",(e.clientY-r.top)+"px");
});
ph.addEventListener("mousemove",e=>{
  if(!document.body.classList.contains("pf-fx"))return;
  const r=ph.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  ph.style.transform="perspective(650px) rotateY("+(x*18)+"deg) rotateX("+(-y*18)+"deg) scale(1.03)";
});
ph.addEventListener("mouseleave",()=>{ph.style.transform=""});
chrome.storage.local.get("pfPhotoData").then(r=>{PH=r.pfPhotoData||"";return loadCfg()}).then(c=>{C=c;render()});

/* ---------- Edit profile modal ---------- */
const TXT=[["pName","pfName"],["pRole","pfRole"],["pRoles","pfRoles"],["pBio","pfBio"],["pLoc","pfLoc"],["pSkills","pfSkills"],["pPhoto","pfPhoto"],["pSite","pfSite"],["pGit","pfGit"],["pMail","pfMail"],["pCv","pfCv"],["pAvTxt","pfAvailTxt"]];
const CHK=[["pVer","pfVerified"],["pAv","pfAvail"],["pSt","pfStatsOn"],["pFx","pfFx"],["pNeon","pfNeon"]];
const URLS=["pPhoto","pSite","pGit","pCv"];
let pend;/* undefined = unchanged, "" = remove, dataURL = new */
function fileToSquare(f,size=512){
  return new Promise((res,rej)=>{
    const im=new Image(),u=URL.createObjectURL(f);
    im.onload=()=>{const s=Math.min(im.width,im.height),c=document.createElement("canvas");c.width=c.height=Math.min(size,s);
      c.getContext("2d").drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL("image/jpeg",.9))};
    im.onerror=()=>rej(new Error("Could not read image"));im.src=u;
  });
}
function peShow(){
  const src=pend!==undefined?pend:(PH||safe($("pPhoto").value.trim()));
  const im=$("peImg");
  $("peInit").textContent=initials($("pName").value);
  if(src){im.onload=()=>{im.hidden=false;$("peInit").style.display="none"};im.onerror=()=>{im.hidden=true;$("peInit").style.display=""};im.src=src}
  else{im.hidden=true;im.removeAttribute("src");$("peInit").style.display=""}
  $("peRm").style.display=(pend!==undefined?pend:PH)?"":"none";
}
function peOpen(){
  pend=undefined;$("peErr").textContent="";
  TXT.forEach(([e,k])=>$(e).value=C[k]??"");
  CHK.forEach(([e,k])=>$(e).checked=C[k]!==false);
  peShow();$("pemodal").classList.add("open");$("pName").focus();
}
const peClose=()=>$("pemodal").classList.remove("open");
$("pfEdit").onclick=peOpen;
$("peCancel").onclick=peClose;
$("pemodal").onmousedown=e=>{if(e.target===$("pemodal"))peClose()};
$("pemodal").addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Escape")peClose()});
$("pePick").onclick=()=>$("peFile").click();
$("peFile").onchange=async e=>{
  const f=e.target.files[0];e.target.value="";if(!f)return;
  try{pend=await fileToSquare(f);$("peErr").textContent="";peShow()}catch(x){$("peErr").textContent="❌ "+x.message}
};
$("peRm").onclick=()=>{pend="";peShow()};
$("pPhoto").addEventListener("input",peShow);$("pName").addEventListener("input",()=>{$("peInit").textContent=initials($("pName").value)});
$("peReset").onclick=async()=>{
  if(!confirm("Reset all Profile info to defaults (the local image will also be removed). Are you sure?"))return;
  const p={};Object.keys(DEF).filter(k=>k.startsWith("pf")&&k!=="pfOn").forEach(k=>p[k]=DEF[k]);
  await chrome.storage.local.remove("pfPhotoData");await saveCfg(p);peClose();
};
$("peSave").onclick=async()=>{
  const p={};
  for(const [e,k] of TXT){p[k]=$(e).value.trim()}
  if(!p.pfName){$("peErr").textContent="Name cannot be empty";$("pName").focus();return}
  for(const e of URLS){const v=$(e).value.trim();if(v&&!safe(v)){$("peErr").textContent="Link must start with https:// or http://";$(e).focus();return}}
  if(p.pfMail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.pfMail)){$("peErr").textContent="Invalid email";$("pMail").focus();return}
  CHK.forEach(([e,k])=>p[k]=$(e).checked);
  if(pend!==undefined){if(pend)await chrome.storage.local.set({pfPhotoData:pend});else await chrome.storage.local.remove("pfPhotoData")}
  await saveCfg(p);peClose();
};
})();
