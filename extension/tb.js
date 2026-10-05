/* Time Budget popup + countdown chip (content script) */
(()=>{
if(window.__glassTb||!/^https?:$/.test(location.protocol))return;window.__glassTb=1;
const host=location.hostname.replace(/^www\./,"");
let C={...DEF},ov=null,chip=null,until=0,unl=false,tick=null,dueSent=false;
const send=m=>new Promise(r=>{try{chrome.runtime.sendMessage(m,x=>{void chrome.runtime.lastError;r(x)})}catch(e){r(null)}});
const fmt=ms=>{const s=Math.max(0,Math.round(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return(h?h+":"+String(m).padStart(2,"0"):m)+":"+String(s%60).padStart(2,"0")};
const CSS=`
#tbo{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(5,8,25,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);pointer-events:auto;font:15px system-ui,"Noto Sans Bengali",sans-serif;color:#fff}
#tbo.on{display:flex}
#tbb{width:min(460px,92vw);padding:26px;border-radius:26px;background:rgba(22,26,64,.55);backdrop-filter:blur(32px) saturate(180%);-webkit-backdrop-filter:blur(32px) saturate(180%);border:1px solid rgba(255,255,255,.32);box-shadow:0 24px 70px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.35);animation:tp .2s ease-out}
@keyframes tp{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
#tbb h2{font-size:20px;font-weight:600;margin:0 0 6px}
#tbb p{margin:0 0 16px;opacity:.8;line-height:1.5;font-size:14px}
.hn{font-weight:600;color:var(--ac,#b5b2ff)}
.g{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:12px}
.o{padding:12px 4px;text-align:center;border-radius:14px;cursor:pointer;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);transition:.15s;font-size:15px;user-select:none}
.o:hover{background:rgba(255,255,255,.26);transform:translateY(-2px)}
.o.u{grid-column:span 2;background:rgba(120,115,245,.35)}
.c{display:flex;gap:8px;margin-top:4px}
.c input{all:unset;box-sizing:border-box;flex:1;min-width:0;padding:11px 14px;border-radius:14px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);font-size:15px;color:#fff}
.c input::placeholder{color:rgba(255,255,255,.5)}
.c input:focus{border-color:#b5b2ff}
.bt{padding:11px 18px;border-radius:14px;cursor:pointer;background:var(--ac,#7873f5);border:0;color:#fff;font:600 14px system-ui,"Noto Sans Bengali",sans-serif}
.bt.gh{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3);font-weight:400}
.ft{display:flex;justify-content:space-between;gap:10px;margin-top:16px;font-size:12px}
.ft a{color:#fff;opacity:.6;cursor:pointer;text-decoration:underline}.ft a:hover{opacity:1}
#tbc{position:fixed;right:16px;bottom:16px;padding:7px 14px;border-radius:20px;font:600 13px system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#fff;pointer-events:auto;cursor:default;user-select:none;background:rgba(22,26,64,.5);backdrop-filter:blur(16px) saturate(170%);-webkit-backdrop-filter:blur(16px) saturate(170%);border:1px solid rgba(255,255,255,.3);box-shadow:0 6px 18px rgba(0,0,0,.3);display:none}
#tbc.low{background:rgba(220,70,70,.55)}`;
function build(){
  if(ov)return;
  glassStyle("tb-style",CSS);
  ov=document.createElement("div");ov.id="tbo";
  glassRoot().appendChild(ov);
  ["keydown","keyup","keypress"].forEach(ev=>ov.addEventListener(ev,e=>e.stopPropagation()));
  chip=document.createElement("div");chip.id="tbc";glassRoot().appendChild(chip);
}
const accent=()=>{try{return accentOf(C)}catch(e){return"#7873f5"}};
function pick(kind,mins){
  send({t:"tb-set",host,min:mins,unl:mins===0}).then(r=>{if(r&&r.ok)apply(r)});
}
function customRow(label){
  return `<div class="c"><input id="cm" type="number" min="1" max="1440" placeholder="Custom time (minutes)"><button class="bt" id="cg">${label}</button></div>`;
}
function wire(){
  ov.querySelectorAll(".o").forEach(b=>b.onclick=()=>pick("x",+b.dataset.m));
  const cm=ov.querySelector("#cm"),cg=ov.querySelector("#cg");
  const go=()=>{const v=Math.round(+cm.value);if(v>=1&&v<=1440)pick("x",v);else{cm.style.borderColor="#ff7b7b"}};
  cg.onclick=go;cm.onkeydown=e=>{if(e.key==="Enter")go()};
}
function showChoose(){
  build();ov.style.setProperty("--ac",accent());
  ov.innerHTML=`<div id="tbb"><h2>⏳ Time Budget</h2><p>How long do you want to use <span class="hn">${host}</span> for?</p>
  <div class="g">${[2,5,10,15,20,30].map(m=>`<div class="o" data-m="${m}">${m} min</div>`).join("")}<div class="o u" data-m="0">∞ Unlimited (all day)</div></div>
  ${customRow("Start")}
  <div class="ft"><a id="nk">Do not ask again on this site</a><a id="cl">Close tab</a></div></div>`;
  wire();
  ov.querySelector("#nk").onclick=()=>{send({t:"tb-never",host});hide()};
  ov.querySelector("#cl").onclick=()=>send({t:"tb-close",host});
  ov.classList.add("on");
}
function showExpired(){
  build();ov.style.setProperty("--ac",accent());
  const e=Math.max(1,C.tbExtend||5);
  ov.innerHTML=`<div id="tbb"><h2>⏰ Time is up!</h2><p><span class="hn">${host}</span> — your allotted time is up. Take more time, or close the tab?</p>
  <div class="g"><div class="o" data-m="${e}">+${e} min</div><div class="o" data-m="${e*2}">+${e*2} min</div><div class="o" data-m="${e*3}">+${e*3} min</div><div class="o" data-m="0">∞</div></div>
  ${customRow("Add")}
  <div class="ft"><span></span><button class="bt gh" id="cl">Close tab</button></div></div>`;
  wire();
  ov.querySelector("#cl").onclick=()=>send({t:"tb-close",host});
  ov.classList.add("on");
}
function hide(){ov&&ov.classList.remove("on")}
function apply(r){
  hide();until=r.until||0;unl=!!r.unl;dueSent=false;startChip();
}
function startChip(){
  clearInterval(tick);build();
  if(unl||!until||C.tbChip===false){chip.style.display=unl&&C.tbChip!==false?"block":"none";if(unl)chip.textContent="∞ "+host;return}
  const upd=()=>{
    const left=until-Date.now();
    if(left<=0){
      chip.style.display="none";clearInterval(tick);
      if(!dueSent){dueSent=true;send({t:"tb-due",host}).then(r=>{if(r&&r.mode==="expired")showExpired()})}
      return;
    }
    chip.style.display="block";chip.textContent="⏳ "+fmt(left);chip.className=left<60000?"low":"";
  };
  upd();tick=setInterval(upd,1000);
}
chrome.runtime.onMessage.addListener(m=>{
  if(!m)return;
  if(m.t==="tb-expired"){clearInterval(tick);build();chip.style.display="none";showExpired()}
  else if(m.t==="tb-extended")apply(m);
  else if(m.t==="tb-reset"){hide();until=0;unl=false;clearInterval(tick);chip&&(chip.style.display="none")}
});
async function init(){
  C=await loadCfg();
  if(C.tbOn===false)return;
  if(!document.documentElement)return;
  const r=await send({t:"tb-check",host});
  if(!r)return;
  if(r.mode==="choose")showChoose();
  else if(r.mode==="expired"){showExpired()}
  else if(r.mode==="active"){until=r.until||0;unl=!!r.unl;startChip()}
}
chrome.storage.onChanged.addListener(ch=>{if(ch.cfg){C={...DEF,...ch.cfg.newValue};if(C.tbOn===false){hide();clearInterval(tick);chip&&(chip.style.display="none")}else if(ov)ov.style.setProperty("--ac",accent())}});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
