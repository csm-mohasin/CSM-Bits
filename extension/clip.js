/* Clipboard capture (content script): saves text the user copies/cuts */
(()=>{
if(window.__glassClip||!/^https?:$/.test(location.protocol))return;window.__glassClip=1;
let C={...DEF};loadCfg().then(c=>C=c);
chrome.storage.onChanged.addListener(ch=>{if(ch.cfg)C={...DEF,...ch.cfg.newValue}});
function selText(){
  let a=document.activeElement;while(a&&a.shadowRoot&&a.shadowRoot.activeElement)a=a.shadowRoot.activeElement;
  if(a&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA")){
    if(a.type==="password")return"";
    try{const s=a.value.substring(a.selectionStart,a.selectionEnd);if(s)return s}catch(e){}
  }
  return (getSelection()||"").toString();
}
function grab(){
  if(C.clipOn===false)return;
  const t=selText();
  if(!t||!t.trim()||t.length>(C.clipMaxLen||20000))return;
  try{chrome.runtime.sendMessage({t:"clip",text:t,url:location.href,title:document.title},()=>void chrome.runtime.lastError)}catch(e){}
}
document.addEventListener("copy",grab,true);
document.addEventListener("cut",grab,true);
chrome.runtime.onMessage.addListener(m=>{
  if(!m||m.t!=="toast")return;
  glassStyle("toast-style","#gt{position:fixed;left:50%;top:22px;transform:translateX(-50%);padding:10px 20px;border-radius:16px;font:14px system-ui,'Noto Sans Bengali',sans-serif;color:#fff;background:rgba(22,26,64,.6);backdrop-filter:blur(20px) saturate(170%);-webkit-backdrop-filter:blur(20px) saturate(170%);border:1px solid rgba(255,255,255,.35);box-shadow:0 10px 30px rgba(0,0,0,.4)}");
  const d=document.createElement("div");d.id="gt";d.textContent=m.text;glassRoot().appendChild(d);
  d.animate([{opacity:0,transform:"translate(-50%,-10px)"},{opacity:1,transform:"translate(-50%,0)"}],{duration:200,fill:"forwards"});
  setTimeout(()=>d.animate([{opacity:1},{opacity:0}],{duration:300,fill:"forwards"}).onfinish=()=>d.remove(),2200);
});
})();
