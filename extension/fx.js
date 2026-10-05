function glassRoot(){
  let h=document.querySelector("glass-fx-host");
  if(!h){
    h=document.createElement("glass-fx-host");
    h.style.cssText="all:initial;position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;display:block";
    h.attachShadow({mode:"open"});
    document.documentElement.appendChild(h);
  }
  return h.shadowRoot;
}
function glassStyle(id,css){
  const r=glassRoot();let s=r.getElementById?r.getElementById(id):r.querySelector("#"+id);
  if(!s){s=document.createElement("style");s.id=id;r.appendChild(s)}
  s.textContent=css;
}
(()=>{
  if(window.__glassFx)return;window.__glassFx=1;
  const EXT=location.protocol==="chrome-extension:";
  let C={...DEF},cur=null,dot=null,running=false,t0=performance.now(),cRGB=[255,255,255],pop=null,hadPx=false;
  const S={mx:-300,my:-300,x:-300,y:-300,s:1,ts:1,px:0,py:0,tx:0,ty:0};
  const cursorOn=()=>C.cuOn&&(EXT||C.cuWeb);
  const pxOn=()=>C.pxOn&&(EXT||C.pxWeb);
  const wallEl=()=>document.getElementById("gbg")||document.querySelector("glass-fx-wall");

  /* ---------- Cursor ---------- */
  function buildCursor(){
    const r=glassRoot();
    const [R,G,B]=cRGB=hexRgb(C.cuColorMode==="custom"?C.cuColor:accentOf(C));
    const op=C.cuOpacity/100,Z=C.cuSize,bl=C.cuBlur;
    let blob="display:none";
    if(C.cuStyle==="glow")blob=`width:${Z}px;height:${Z}px;background:radial-gradient(circle,rgba(${R},${G},${B},${op}) 0%,rgba(${R},${G},${B},0) 68%);filter:blur(${bl}px)`;
    else if(C.cuStyle==="ring")blob=`width:${Z/3}px;height:${Z/3}px;border:2px solid rgba(${R},${G},${B},${Math.min(1,op+.4)})`;
    else if(C.cuStyle==="glass")blob=`width:${Z/2}px;height:${Z/2}px;background:rgba(255,255,255,.1);backdrop-filter:blur(${bl+6}px) saturate(180%);-webkit-backdrop-filter:blur(${bl+6}px) saturate(180%);border:1px solid rgba(255,255,255,.45);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 6px 24px rgba(0,0,0,.25),0 0 22px rgba(${R},${G},${B},${op})`;
    const dsz=C.cuStyle==="dot"?Math.max(8,Z/8):6;
    const dotCss=(C.cuStyle==="ring"||C.cuStyle==="dot")?`width:${dsz}px;height:${dsz}px;background:rgba(${R},${G},${B},.95);box-shadow:0 0 12px rgba(${R},${G},${B},.8)`:"display:none";
    glassStyle("fx-cursor",`.cb,.cd{position:fixed;left:0;top:0;border-radius:50%;pointer-events:none;will-change:transform;transform:translate3d(-300px,-300px,0)}.cb{${blob}}.cd{${dotCss}}`);
    if(!cur){cur=document.createElement("div");cur.className="cb";dot=document.createElement("div");dot.className="cd";r.appendChild(cur);r.appendChild(dot)}
    let nc=document.getElementById("__glass_nocursor");
    if(C.cuHideNative){if(!nc){nc=document.createElement("style");nc.id="__glass_nocursor";nc.textContent="*{cursor:none !important}";document.documentElement.appendChild(nc)}}
    else nc?.remove();
  }
  function removeCursor(){
    cur?.remove();dot?.remove();cur=dot=null;
    glassRoot().getElementById?.("fx-cursor")?.remove();
    document.getElementById("__glass_nocursor")?.remove();
  }
  addEventListener("pointermove",e=>{
    if(e.pointerType==="touch")return;
    S.mx=e.clientX;S.my=e.clientY;S.tx=(e.clientX/innerWidth-.5)*2;S.ty=(e.clientY/innerHeight-.5)*2;
    if(C.cuHover){const t=e.target;S.ts=(t&&t.closest&&t.closest("a,button,input,textarea,select,summary,label,[role=button]"))?1.5:1}
  },{passive:true,capture:true});
  addEventListener("pointerdown",e=>{
    if(!cursorOn()||!C.cuClick||e.pointerType==="touch")return;
    const d=document.createElement("div"),sz=Math.max(24,C.cuSize/3);
    d.style.cssText=`position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:${sz}px;height:${sz}px;border-radius:50%;border:2px solid rgba(${cRGB[0]},${cRGB[1]},${cRGB[2]},.85);pointer-events:none`;
    glassRoot().appendChild(d);
    d.animate([{transform:"translate(-50%,-50%) scale(.3)",opacity:.9},{transform:"translate(-50%,-50%) scale(2.2)",opacity:0}],{duration:520,easing:"ease-out"}).onfinish=()=>d.remove();
  },true);

  /* ---------- Loop (cursor + parallax) ---------- */
  function loop(){
    if(!running)return;
    if(cur){
      const k=Math.min(1,Math.max(.04,C.cuSmooth/60));
      S.x+=(S.mx-S.x)*k;S.y+=(S.my-S.y)*k;S.s+=(S.ts-S.s)*.18;
      cur.style.transform=`translate3d(${S.x}px,${S.y}px,0) translate(-50%,-50%) scale(${S.s})`;
      dot.style.transform=`translate3d(${S.mx}px,${S.my}px,0) translate(-50%,-50%)`;
    }
    const w=wallEl();
    if(w&&pxOn()){
      const t=(performance.now()-t0)/1000;
      let ax=S.tx,ay=S.ty;
      if(C.pxAuto){ax+=Math.sin(t*C.pxSpd*.15)*.8;ay+=Math.cos(t*C.pxSpd*.12)*.8}
      const k=Math.min(1,C.pxSmooth/100+.01);
      S.px+=(ax-S.px)*k;S.py+=(ay-S.py)*k;
      w.style.transform=`translate3d(${-S.px*C.pxStr}px,${-S.py*C.pxStr}px,0) scale(${1+C.pxStr/250})`;
      hadPx=true;
    }else if(w&&hadPx){w.style.transform="";hadPx=false}
    requestAnimationFrame(loop);
  }
  function sync(){
    if(cursorOn())buildCursor();else removeCursor();
    const need=cursorOn()||pxOn();
    if(need&&!running){running=true;requestAnimationFrame(loop)}
    if(!need){running=false;const w=wallEl();if(w)w.style.transform=""}
  }

  /* ---------- Selection popup ---------- */
  const ENG={google:"https://www.google.com/search?q=",bing:"https://www.bing.com/search?q=",duck:"https://duckduckgo.com/?q=",youtube:"https://www.youtube.com/results?search_query="};
  const send=m=>{try{chrome.runtime.sendMessage(m,()=>void chrome.runtime.lastError)}catch(e){}};
  function hidePop(){pop?.remove();pop=null}
  async function copy(t){try{await navigator.clipboard.writeText(t)}catch(e){const a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();document.execCommand("copy");a.remove()}}
  async function addNote(t){const r=await chrome.storage.local.get("notes"),n=r.notes||{},h=location.hostname||"local";n[h]=(n[h]?n[h]+"\n":"")+"• "+t;await chrome.storage.local.set({notes:n})}
  function showPop(txt,rect){
    hidePop();
    const ac=accentOf(C);
    glassStyle("fx-pop",`.pop{position:fixed;display:flex;gap:2px;padding:5px;border-radius:14px;background:rgba(20,24,60,.6);backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);border:1px solid rgba(255,255,255,.3);box-shadow:0 8px 28px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.25);pointer-events:auto;font:13px system-ui,sans-serif;color:#fff;animation:pi .15s ease-out}@keyframes pi{from{opacity:0;transform:translateY(6px) scale(.96)}to{opacity:1;transform:none}}.pop button{all:unset;cursor:pointer;padding:6px 10px;border-radius:9px;color:#fff;font:13px system-ui,sans-serif;white-space:nowrap}.pop button:hover{background:${ac}66}`);
    pop=document.createElement("div");pop.className="pop";
    const acts=[];
    if(C.tpCopy)acts.push(["📋","Copy",()=>copy(txt)]);
    if(C.tpSearch)acts.push(["🔍","Search",()=>send({t:"open",url:(ENG[C.tpEngine]||ENG.google)+encodeURIComponent(txt),newTab:true})]);
    if(C.tpTranslate)acts.push(["🌐","Translate",()=>send({t:"open",url:`https://translate.google.com/?sl=auto&tl=${C.tpLang}&text=${encodeURIComponent(txt)}&op=translate`,newTab:true})]);
    if(C.tpNote)acts.push(["📝","Note",()=>addNote(txt)]);
    if(!acts.length)return;
    for(const [ic,lb,fn] of acts){
      const b=document.createElement("button");b.textContent=ic+" "+lb;
      b.onmousedown=e=>e.preventDefault();
      b.onclick=async()=>{await fn();b.textContent="✓ Done";setTimeout(hidePop,700)};
      pop.appendChild(b);
    }
    glassRoot().appendChild(pop);
    const w=pop.offsetWidth||200;
    let top=rect.top-48;if(top<8)top=rect.bottom+10;
    const left=Math.max(8,Math.min(innerWidth-w-8,rect.left+rect.width/2-w/2));
    pop.style.top=top+"px";pop.style.left=left+"px";
  }
  document.addEventListener("mouseup",e=>{
    setTimeout(()=>{
      if(!C.tpOn)return;
      if(e.composedPath().some(n=>n.tagName==="GLASS-FX-HOST"))return;
      const sel=getSelection();
      const txt=sel?sel.toString().trim():"";
      if(!txt||txt.length>3000||!sel.rangeCount){hidePop();return}
      showPop(txt,sel.getRangeAt(0).getBoundingClientRect());
    },15);
  },true);
  document.addEventListener("mousedown",e=>{if(!e.composedPath().some(n=>n.tagName==="GLASS-FX-HOST"))hidePop()},true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")hidePop()},true);
  addEventListener("scroll",hidePop,{passive:true});

  /* ---------- init ---------- */
  loadCfg().then(c=>{C=c;sync()});
  chrome.storage.onChanged.addListener(ch=>{if(ch.cfg){C={...DEF,...ch.cfg.newValue};sync()}});
})();
