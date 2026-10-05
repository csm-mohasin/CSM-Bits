(async()=>{
  if(location.protocol==="chrome-extension:")return;
  const st=document.createElement("style");st.id="__glass_style";
  let on=false,timer=null;
  const SKIP=/^(IMG|VIDEO|CANVAS|SVG|PATH|PICTURE|IFRAME|SCRIPT|STYLE|HTML|BODY|GLASS-FX-HOST|GLASS-FX-WALL)$/;
  const whiteG=/rgba?\(\s*2[3-5]\d\s*,\s*2[3-5]\d\s*,\s*2[3-5]\d|#fff|white/i;
  const isWG=v=>v&&v.includes("gradient")&&whiteG.test(v);
  const ATTRS=["data-glass-bar","data-glass-nograd","data-glass-light","data-glass-pl","data-glass-box","data-glass-skip","data-glass-fg","data-glass-text","data-glass-seen","data-glass-solid"];
  function lum(c){const m=c&&c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);return m?{l:(+m[1]+ +m[2]+ +m[3])/3,a:m[4]===undefined?1:+m[4]}:null}
  function light(c){const q=lum(c);if(!q)return false;const m=c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);return q.a>=.5&&+m[1]>=225&&+m[2]>=225&&+m[3]>=225}

  function syncWallMedia(c){
    const wall=document.querySelector("glass-fx-wall");if(!wall)return;
    let f=wall.querySelector("iframe");
    if(!(c.type==="media"&&c.mediaId&&c.mediaWeb)){f&&f.remove();return}
    if(f&&f.dataset.sig===c.mediaId)return;
    f&&f.remove();
    f=document.createElement("iframe");f.dataset.sig=c.mediaId;f.tabIndex=-1;f.setAttribute("aria-hidden","true");
    f.src=chrome.runtime.getURL("wall.html");
    f.style.cssText="position:absolute !important;inset:0 !important;width:100% !important;height:100% !important;border:0 !important;background:transparent !important;pointer-events:none !important;display:block !important";
    wall.appendChild(f);
  }
  async function run(){
    const c=await loadCfg();
    const off=!c.web||c.skip.includes(location.hostname);
    if(off){st.remove();document.querySelector("glass-fx-wall")?.remove();setOn(false);return}
    const ac=accentOf(c),[ar,ag,ab]=hexRgb(ac),acL=mixHex(ac,.5);
    st.textContent=`
html{background:#0c0f24 !important;color-scheme:dark !important;min-height:100%}
glass-fx-wall{display:block;position:fixed;inset:-40px;z-index:-2;pointer-events:none;background:${wallCss(c)} center/cover no-repeat;filter:blur(${c.wb}px);will-change:transform}
html::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:rgba(10,15,40,.55);backdrop-filter:blur(${Math.max(6-c.wb,0)}px)}
body,div,section,main,header,footer,nav,aside,article,form,ul,ol,li,table,thead,tbody,tfoot,tr,td,th,fieldset,dialog,details,summary,blockquote,pre,code{background-color:transparent !important;border-color:rgba(255,255,255,.18) !important}
body,p,span,li,td,th,label,h1,h2,h3,h4,h5,h6,div,dd,dt,small,strong,em,b,i,pre,code{color:#eef0ff !important}
a,a *{color:${acL} !important}
input,select{background:rgba(255,255,255,.12) !important;color:#fff !important;border:1px solid rgba(255,255,255,.3) !important;border-radius:14px !important;backdrop-filter:blur(12px)}
textarea{background:transparent !important;border:0 !important;box-shadow:none !important;backdrop-filter:none !important;border-radius:0 !important}
[data-glass-fg]{color:#fff !important}
[data-glass-text]{background:rgba(255,255,255,.12) !important;border:1px solid rgba(255,255,255,.3) !important;border-radius:14px !important}
input::placeholder,textarea::placeholder{color:rgba(255,255,255,.55) !important}
button{background:rgba(255,255,255,.16) !important;color:#fff !important;border:1px solid rgba(255,255,255,.3) !important;border-radius:12px !important;backdrop-filter:blur(12px)}
header,nav,aside,dialog,[role=dialog],[role=menu],[role=listbox]{background:rgba(255,255,255,var(--ga,.1)) !important;backdrop-filter:blur(${c.gb}px) saturate(160%) !important}
::selection{background:rgba(${ar},${ag},${ab},.5) !important}
::-webkit-scrollbar-thumb{background:rgba(${ar},${ag},${ab},.55) !important;border-radius:10px;border:2px solid transparent;background-clip:padding-box}
[contenteditable],[contenteditable] *{background:transparent !important;backdrop-filter:none !important;box-shadow:none !important;border-radius:0 !important}
[contenteditable]{caret-color:#fff !important}
[contenteditable]::before{color:rgba(255,255,255,.55) !important}
[data-glass-light]{background-color:rgba(255,255,255,.12) !important}
[data-glass-pl]::before,[data-glass-pl]::after{background-color:transparent !important}
[data-glass-solid]{background-color:rgba(255,255,255,.07) !important;border-color:rgba(255,255,255,.2) !important}
[data-glass-solid=blur]{backdrop-filter:blur(22px) saturate(160%) !important;-webkit-backdrop-filter:blur(22px) saturate(160%) !important}
hr{border-color:rgba(255,255,255,.2) !important}
[data-glass-box]{background:rgba(18,22,56,.55) !important;backdrop-filter:blur(26px) saturate(170%) !important;-webkit-backdrop-filter:blur(26px) saturate(170%) !important;border:1px solid rgba(${ar},${ag},${ab},.5) !important;box-shadow:0 8px 32px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.3) !important}
[data-glass-nograd],[data-glass-nograd]::before,[data-glass-nograd]::after{background-image:none !important}
[data-glass-bar]{background:rgba(14,18,48,.42) !important;backdrop-filter:blur(28px) saturate(170%) !important;-webkit-backdrop-filter:blur(28px) saturate(170%) !important;box-shadow:0 6px 24px rgba(0,0,0,.35) !important;border-bottom:1px solid rgba(255,255,255,.2) !important}
`;
    (document.head||document.documentElement).appendChild(st);
    if(!document.querySelector("glass-fx-wall"))document.documentElement.appendChild(document.createElement("glass-fx-wall"));
    syncWallMedia(c);
    setOn(true);
  }

  function scan(){
    if(!on||!document.body)return;
    const vh=innerHeight,vw=innerWidth;
    for(const tb of document.body.querySelectorAll('textarea,[contenteditable]:not([contenteditable="false"]),input[type=text],input[type=search],input:not([type])')){
      if(tb.hasAttribute("data-glass-seen"))continue;
      tb.setAttribute("data-glass-seen","");
      let p=tb.parentElement,i=0,box=null;
      while(p&&p!==document.body&&i<7){
        if(parseFloat(getComputedStyle(p).borderTopLeftRadius)>=14&&p.getBoundingClientRect().width>150){box=p;break}
        p=p.parentElement;i++;
      }
      if(box){
        box.setAttribute("data-glass-box","");
        for(let q=box;q&&q!==document.body;q=q.parentElement){
          const ps=getComputedStyle(q).position;
          if(ps==="fixed"||ps==="sticky")q.setAttribute("data-glass-skip","");
        }
      }
      if(tb.tagName==="TEXTAREA"){
        const c=lum(getComputedStyle(tb).color);
        if(c&&c.a>.1&&c.l<140){tb.setAttribute("data-glass-fg","");if(!box)tb.setAttribute("data-glass-text","")}
      }
    }
    for(const el of document.body.querySelectorAll("*")){
      if(SKIP.test(el.tagName.toUpperCase()))continue;
      if(el.closest("[contenteditable],textarea"))continue;
      const cs=getComputedStyle(el);
      const pb=getComputedStyle(el,"::before"),pa=getComputedStyle(el,"::after");
      let rr=null;const R=()=>rr||(rr=el.getBoundingClientRect());
      const wide=()=>{const q=R();return q.width>=vw*.5&&q.height>=8};
      const grad=v=>v&&v.includes("gradient")&&!v.includes("url(");
      const mk=()=>{if(!el.hasAttribute("data-glass-solid"))el.setAttribute("data-glass-solid",R().height<=400?"blur":"")};
      if(!el.hasAttribute("data-glass-nograd")){
        if(isWG(cs.backgroundImage)||isWG(pb.backgroundImage)||isWG(pa.backgroundImage))el.setAttribute("data-glass-nograd","");
        else{
          const clipText=(cs.webkitBackgroundClip||cs.backgroundClip)==="text";
          if(!clipText&&(grad(cs.backgroundImage)||grad(pb.backgroundImage)||grad(pa.backgroundImage))&&wide()){el.setAttribute("data-glass-nograd","");mk()}
        }
      }
      if(!el.hasAttribute("data-glass-light")&&light(cs.backgroundColor))el.setAttribute("data-glass-light","");
      const o=lum(cs.backgroundColor);
      if(o&&o.a>=.5&&cs.backgroundImage==="none"&&wide())mk();
      if(!el.hasAttribute("data-glass-pl")){
        for(const p of [pb,pa]){
          const q=lum(p.backgroundColor);
          if(p.content!=="none"&&q&&q.a>=.5&&p.backgroundImage==="none"){el.setAttribute("data-glass-pl","");if(wide())mk();break}
        }
      }
      if(el.hasAttribute("data-glass-skip")){el.removeAttribute("data-glass-bar");continue}
      if(el.hasAttribute("data-glass-bar"))continue;
      if(cs.position!=="fixed"&&cs.position!=="sticky")continue;
      const r=R();
      if(r.height<24||r.width<120)continue;
      if(r.height>vh*.6&&r.width>vw*.6)continue;
      if(cs.display==="none"||cs.visibility==="hidden")continue;
      el.setAttribute("data-glass-bar","");
    }
  }
  const later=()=>{clearTimeout(timer);timer=setTimeout(scan,400)};
  function setOn(v){
    on=v;
    if(v)scan();
    else document.querySelectorAll(ATTRS.map(k=>"["+k+"]").join(",")).forEach(e=>ATTRS.forEach(k=>e.removeAttribute(k)));
  }
  addEventListener("scroll",later,{passive:true});
  addEventListener("load",later);
  new MutationObserver(later).observe(document.documentElement,{childList:true,subtree:true});
  run();
  chrome.storage.onChanged.addListener(ch=>{if(ch.cfg)run()});
})();
