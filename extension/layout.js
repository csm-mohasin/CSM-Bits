/* Drag-and-drop widget layout for the New Tab page */
(()=>{
  const $=id=>document.getElementById(id);
  const W=[["pf","Profile card"],["clockCard","Clock"],["sf","Search bar"],["links","Quick links"],["todoBox","To-do"],["pomoBox","Pomodoro"],["bmBox","Bookmarks"],["hsBox","History"]];
  let L={},edit=false,grid=true,bar=null,mo=null,raf=0;
  const els=()=>W.map(([id,name])=>[id,name,$(id)]).filter(x=>x[2]);
  const save=()=>chrome.storage.local.set({layout:L});
  const btn=(txt,fn,cls)=>{const b=document.createElement("button");b.className="btn sm "+(cls||"");b.type="button";b.textContent=txt;b.onclick=fn;return b};

  function apply(){
    for(const [id,,el] of els()){
      const p=L[id]||{};
      el.classList.add("lay-w");
      el.style.translate=(p.x||p.y)?`${p.x||0}px ${p.y||0}px`:"";
      el.classList.toggle("lay-hidden",!!p.hide);
    }
    if(bar)drawBar();
  }
  function drawBar(){
    bar.textContent="";
    const t=document.createElement("span");t.textContent="✥ Drag widgets to arrange them · hold Alt for free movement";
    bar.append(t);
    els().filter(([id])=>L[id]&&L[id].hide).forEach(([id,name])=>bar.append(btn("＋ "+name,()=>{delete L[id].hide;save();apply()})));
    bar.append(btn("↺ Reset",async()=>{L={};await save();apply()}),btn("✓ Done",()=>setEdit(false),"pri"));
  }
  function addOv(){
    for(const [id,name,el] of els()){
      if(el.querySelector(":scope>.lay-ov"))continue;
      if(getComputedStyle(el).position==="static")el.style.position="relative";
      const ov=document.createElement("div");ov.className="lay-ov";
      const b=document.createElement("b");b.textContent="✥ "+name;
      const x=document.createElement("i");x.textContent="✕";x.title="Hide this widget";
      x.onpointerdown=e=>e.stopPropagation();
      x.onclick=e=>{e.stopPropagation();L[id]={...(L[id]||{}),hide:true};save();apply()};
      ov.append(b,x);el.appendChild(ov);
      ov.onpointerdown=e=>start(e,id,el,ov);
    }
  }
  function start(e,id,el,ov){
    if(e.button!==0)return;e.preventDefault();
    const p=L[id]||{},ox=p.x||0,oy=p.y||0,sx=e.clientX,sy=e.clientY;
    ov.setPointerCapture(e.pointerId);ov.classList.add("drag");
    const mv=ev=>{
      let x=ox+ev.clientX-sx,y=oy+ev.clientY-sy;
      if(grid&&!ev.altKey){x=Math.round(x/10)*10;y=Math.round(y/10)*10}
      L[id]={...(L[id]||{}),x,y};el.style.translate=`${x}px ${y}px`;
    };
    const up=()=>{["pointermove","pointerup","pointercancel"].forEach((n,i)=>ov.removeEventListener(n,[mv,up,up][i]));ov.classList.remove("drag");save()};
    ov.addEventListener("pointermove",mv);ov.addEventListener("pointerup",up);ov.addEventListener("pointercancel",up);
  }
  function setEdit(v){
    edit=v;document.body.classList.toggle("lay-edit",v);
    if(v){
      bar=document.createElement("div");bar.id="layBar";bar.className="glass";document.body.appendChild(bar);
      apply();addOv();
      mo=new MutationObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(edit)addOv()})});
      mo.observe(document.querySelector("main")||document.body,{childList:true,subtree:true});
    }else{
      mo&&mo.disconnect();mo=null;
      document.querySelectorAll(".lay-ov").forEach(o=>o.remove());
      bar&&bar.remove();bar=null;
    }
  }
  const lb=$("layBtn");if(lb)lb.onclick=()=>setEdit(!edit);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&edit)setEdit(false)});
  chrome.storage.local.get(["layout","cfg"]).then(r=>{L=r.layout||{};grid=(r.cfg||{}).layGrid!==false;apply();if(location.hash==="#layout")setEdit(true)});
  chrome.storage.onChanged.addListener(ch=>{
    if(ch.layout){L=ch.layout.newValue||{};apply()}
    if(ch.cfg)grid=(ch.cfg.newValue||{}).layGrid!==false;
  });
})();
