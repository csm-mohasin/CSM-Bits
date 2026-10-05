/* Plays the video / GIF wallpaper inside an iframe (used on websites, where IndexedDB is not shared) */
(()=>{
  let cur="";
  async function paint(){
    const c=await loadCfg();
    if(c.type!=="media"||!c.mediaId){document.body.textContent="";cur="";return}
    if(cur===c.mediaId)return;cur=c.mediaId;
    let blob=null;try{blob=await mediaGet("wall")}catch(e){}
    document.body.textContent="";if(!blob)return;
    const v=c.mediaKind==="video",el=document.createElement(v?"video":"img");
    el.style.cssText="position:fixed;inset:0;width:100%;height:100%;object-fit:cover";
    if(v){el.muted=true;el.defaultMuted=true;el.loop=true;el.autoplay=true;el.playsInline=true}
    el.src=URL.createObjectURL(blob);document.body.appendChild(el);
    if(v){
      const pl=()=>document.hidden?el.pause():el.play().catch(()=>{});
      document.addEventListener("visibilitychange",pl);el.play().catch(()=>{});
    }
  }
  paint();
  chrome.storage.onChanged.addListener(ch=>{if(ch.cfg)paint()});
})();
