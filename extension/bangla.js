/* Bangla Phonetic (Avro-style) — live typing engine */
(()=>{
if(window.__glassBn)return;window.__glassBn=1;
const CONS={"kkh":"ক্ষ","ksh":"ক্ষ","GG":"জ্ঞ","TT":"ট্ট","Th":"ঠ","DD":"ড্ড","Dh":"ঢ","NG":"ঞ","Ng":"ঙ","Sh":"ষ","Rh":"ঢ়","kh":"খ","gh":"ঘ","chh":"ছ","ch":"চ","jh":"ঝ","tt":"ত্ত","th":"থ","dh":"ধ","ph":"ফ","bh":"ভ","sh":"শ","gg":"জ্ঞ","rr":"র্","k":"ক","g":"গ","G":"গ","T":"ট","D":"ড","N":"ণ","B":"ব","c":"চ","j":"জ","t":"ত","d":"দ","n":"ন","p":"প","f":"ফ","b":"ব","v":"ভ","m":"ম","z":"য","r":"র","l":"ল","S":"শ","s":"স","h":"হ","R":"ড়","y":"য়","Y":"য়","q":"ক","x":"ক্স"};
const VOW=[["rri","ঋ","ৃ"],["oi","ঐ","ৈ"],["ou","ঔ","ৌ"],["aa","আ","া"],["ii","ঈ","ী"],["uu","ঊ","ূ"],["ee","ঈ","ী"],["oo","উ","ু"],["a","আ","া"],["A","আ","া"],["i","ই","ি"],["I","ঈ","ী"],["u","উ","ু"],["U","ঊ","ূ"],["e","এ","ে"],["o","ও","ো"],["O","ও","ো"],["w","ও","ো"]];
const CK=Object.keys(CONS).sort((a,b)=>b.length-a.length);
const DIG="০১২৩৪৫৬৭৮৯";
function conv(s,digits){
  let out="",i=0,afterC=false;
  while(i<s.length){
    const rest=s.slice(i);
    if(rest.startsWith(",,")){out+="্";i+=2;afterC=false;continue}
    if(rest[0]==="`"){out=out.endsWith("ত")?out.slice(0,-1)+"ৎ":out+"`";i++;afterC=false;continue}
    if(rest[0]==="^"){out+="ঁ";i++;afterC=false;continue}
    if(rest[0]===":"){out+="ঃ";i++;afterC=false;continue}
    if(rest[0]==="$"){out+="৳";i++;afterC=false;continue}
    if(/[0-9]/.test(rest[0])){out+=digits?DIG[+rest[0]]:rest[0];i++;afterC=false;continue}
    if(rest.startsWith("ng")){out+=(afterC?"্":"")+"ং";afterC=false;i+=2;continue}
    let vf=null,mc=null;
    for(const v of VOW){if(rest.startsWith(v[0])){vf=v;break}}
    for(const k of CK){if(rest.startsWith(k)){mc=k;break}}
    if(vf&&mc){if(vf[0].length>mc.length)mc=null;else vf=null}
    if(vf){out+=afterC?vf[2]:vf[1];afterC=false;i+=vf[0].length;continue}
    if(mc){if(afterC)out+="্";out+=CONS[mc];afterC=true;i+=mc.length;continue}
    out+=rest[0];i++;afterC=false;
  }
  return out;
}
window.__glassBnConv=conv;

let C={},active=false,pill=null,buf="",outLen=0,lastEl=null,lastPos=-1;
loadCfg().then(c=>{C=c});
chrome.storage.local.get("bnActive").then(r=>{active=!!r.bnActive});
chrome.storage.onChanged.addListener(ch=>{
  if(ch.cfg)C={...DEF,...ch.cfg.newValue};
  if(ch.bnActive){active=!!ch.bnActive.newValue;paint()}
});
const BADTYPE=/^(password|email|url|number|tel|date|datetime-local|time|month|week|color|range|file|checkbox|radio|button|submit)$/i;
function deepActive(){let a=document.activeElement;while(a&&a.shadowRoot&&a.shadowRoot.activeElement)a=a.shadowRoot.activeElement;return a}
function okEl(el){
  if(!el)return false;
  if(el.tagName==="TEXTAREA")return true;
  if(el.tagName==="INPUT")return !BADTYPE.test(el.type||"text");
  return !!el.isContentEditable;
}
const isInp=el=>el.tagName==="INPUT"||el.tagName==="TEXTAREA";
function reset(){buf="";outLen=0;lastEl=null;lastPos=-1}
function caret(el){
  if(isInp(el))return el.selectionStart===el.selectionEnd?el.selectionStart:-1;
  const s=getSelection();return s.rangeCount&&s.isCollapsed?s.anchorOffset:-1;
}
function replace(el,n,text){
  if(isInp(el)){
    const p=el.selectionStart;
    el.setSelectionRange(p-n,p);
    if(!document.execCommand("insertText",false,text)){
      el.setRangeText(text,p-n,p,"end");el.dispatchEvent(new InputEvent("input",{bubbles:true,data:text,inputType:"insertText"}));
    }
    lastPos=el.selectionStart;return true;
  }
  const s=getSelection();if(!s.rangeCount)return false;
  const r=s.getRangeAt(0);
  if(n>0){
    const nd=r.startContainer,off=r.startOffset;
    if(nd.nodeType!==3||off<n){return false}
    const nr=document.createRange();nr.setStart(nd,off-n);nr.setEnd(nd,off);
    s.removeAllRanges();s.addRange(nr);
  }
  document.execCommand("insertText",false,text);
  lastPos=caret(el);return true;
}
function feed(el,ch){
  const here=caret(el);
  if(el!==lastEl||here!==lastPos||here<0)reset();
  const nb=buf+ch,out=conv(nb,C.bnDigits!==false);
  if(!replace(el,outLen,out)){reset();const o=conv(ch,C.bnDigits!==false);replace(el,0,o);buf=ch;outLen=o.length;lastEl=el;return}
  buf=nb;outLen=out.length;lastEl=el;
}
addEventListener("keydown",e=>{
  if(!C.bnOn&&C.bnOn!==undefined)return;
  if(e.isComposing||e.defaultPrevented)return;
  const k=(C.bnKey||"b").toLowerCase();
  if(e.altKey&&!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()===k){
    e.preventDefault();e.stopImmediatePropagation();
    chrome.storage.local.set({bnActive:!active});return;
  }
  if(!active||e.ctrlKey||e.metaKey||e.altKey)return;
  const el=deepActive();if(!okEl(el))return;
  if(e.key==="Backspace"){
    if(buf&&el===lastEl&&caret(el)===lastPos){
      e.preventDefault();
      buf=buf.slice(0,-1);const out=buf?conv(buf,C.bnDigits!==false):"";
      replace(el,outLen,out);outLen=out.length;if(!buf)reset();
    }
    return;
  }
  if(e.key.length!==1){reset();return}
  if(e.key===" "||e.key==="\n"){reset();return}
  if(e.key==="."&&C.bnDari!==false){e.preventDefault();reset();document.execCommand("insertText",false,"।");return}
  if(/[0-9]/.test(e.key)&&!buf&&C.bnDigits!==false){e.preventDefault();reset();document.execCommand("insertText",false,DIG[+e.key]);return}
  if(/[A-Za-z0-9`^:$]/.test(e.key)||(e.key===","&&buf&&!buf.endsWith(","))||(e.key===","&&buf.endsWith(",")&&!buf.endsWith(",,"))){
    e.preventDefault();feed(el,e.key);return;
  }
  reset();
},true);
addEventListener("mousedown",reset,true);
addEventListener("blur",reset,true);
addEventListener("keyup",e=>{if(/^(Arrow|Home|End|Page)/.test(e.key))reset()},true);

/* ---- indicator pill ---- */
function paint(){
  const el=deepActive();
  const show=okEl(el)&&C.bnOn!==false&&C.bnPill!==false;
  if(!show){pill&&(pill.style.display="none");return}
  if(!pill){
    glassStyle("bn-style",`#bnp{position:fixed;left:16px;bottom:16px;padding:7px 14px;border-radius:20px;font:600 13px system-ui,"Noto Sans Bengali",sans-serif;color:#fff;cursor:pointer;pointer-events:auto;user-select:none;background:rgba(22,26,64,.55);backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);border:1px solid rgba(255,255,255,.35);box-shadow:0 6px 20px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35)}#bnp.bn{background:rgba(60,170,110,.6)}`);
    pill=document.createElement("div");pill.id="bnp";
    pill.onmousedown=e=>{e.preventDefault();chrome.storage.local.set({bnActive:!active})};
    glassRoot().appendChild(pill);
  }
  pill.style.display="block";pill.className=active?"bn":"";
  pill.textContent=active?"বাং · Alt+"+(C.bnKey||"b").toUpperCase():"EN · Alt+"+(C.bnKey||"b").toUpperCase();
}
document.addEventListener("focusin",paint,true);
document.addEventListener("focusout",()=>setTimeout(paint,50),true);
})();
