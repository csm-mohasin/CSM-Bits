(()=>{
  if(window.__glassPal)return;window.__glassPal=1;
  const EXT=location.protocol==="chrome-extension:";
  let C={...DEF},ov=null,inp=null,res=null,ft=null,items=[],sel=0,mode="cmd",timer=null,seq=0,noteHost="",openState=false;
  loadCfg().then(c=>C=c);
  chrome.storage.onChanged.addListener(ch=>{if(ch.cfg)C={...DEF,...ch.cfg.newValue}});
  const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const send=m=>new Promise(r=>{try{chrome.runtime.sendMessage(m,x=>{void chrome.runtime.lastError;r(x)})}catch(e){r(null)}});
  const O=p=>chrome.runtime.getURL(p);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const editable=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

  addEventListener("keydown",e=>{
    if(!C.pOn)return;
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()===(C.pKey||"k").toLowerCase()){
      if(!C.pOverride&&editable(e.target))return;
      e.preventDefault();e.stopImmediatePropagation();toggle();
    }
  },true);
  try{chrome.runtime.onMessage.addListener(m=>{if(m&&m.t==="palette")toggle()})}catch(e){}

  function calc(s){
    const clean=s.replace(/\s+/g,"");
    const t=clean.match(/\d*\.?\d+|[()+\-*/%^]/g);
    if(!t||t.join("")!==clean||!/[+\-*/%^]/.test(clean))return null;
    let p=0;const peek=()=>t[p];
    function prim(){const x=t[p++];if(x==="("){const v=add();p++;return v}if(x==="-")return -prim();if(x==="+")return prim();return parseFloat(x)}
    function pow(){let b=prim();while(peek()==="^"){p++;b=Math.pow(b,prim())}return b}
    function mul(){let v=pow();while(peek()==="*"||peek()==="/"||peek()==="%"){const o=t[p++],r=pow();v=o==="*"?v*r:o==="/"?v/r:v%r}return v}
    function add(){let v=mul();while(peek()==="+"||peek()==="-"){const o=t[p++],r=mul();v=o==="+"?v+r:v-r}return v}
    try{const v=add();return isFinite(v)&&p>=t.length?v:null}catch(e){return null}
  }
  const toggleCfg=k=>async()=>{const c=await loadCfg();saveCfg({[k]:!c[k]})};
  function cmds(){
    const host=location.hostname;
    return [
      {i:"🎛",t:"CSM Bits Studio — All settings",k:"settings studio customize Settings",run:()=>send({t:"open",url:O("options.html"),newTab:true})},
      {i:"📊",t:"Site Time Tracker — Screen time",k:"stats time tracker screen time summary",run:()=>send({t:"open",url:O("stats.html"),newTab:true})},
      {i:"🧰",t:"JSON Formatter",k:"json format minify validate",run:()=>send({t:"open",url:O("tools.html"),newTab:true})},
      {i:"📸",t:"Full page screenshot (with glass frame)",k:"screenshot capture full page",run:async()=>{close();await sleep(350);send({t:"shot",mode:"full"})},keep:1},
      {i:"🖼",t:"Screenshot of this screen only (single)",k:"screenshot visible single screen viewport",run:async()=>{close();await sleep(350);send({t:"shot",mode:"visible"})},keep:1},
      {i:"📋",t:"Clipboard History",k:"clipboard history copy paste clipboard",run:()=>send({t:"open",url:O("hub.html#clip"),newTab:true})},
      {i:"🗂",t:"Page Snapshots x",k:"snapshot snapshots saved pages hub",run:()=>send({t:"open",url:O("hub.html#snap"),newTab:true})},
      {i:"📷",t:"Take a Snapshot of this page (Alt+Shift+S)",k:"snapshot take save page capture",run:async()=>{close();await sleep(350);send({t:"snap"})},keep:1},
      {i:"⏳",t:"Time Budget Settings",k:"time budget limit timer time",run:()=>send({t:"open",url:O("options.html#tb"),newTab:true})},
      {i:"🇧🇩",t:"Bangla Phonetic typing on/off (Alt+B)",k:"bangla phonetic typing avro Bengali (বাংলা)",run:async()=>{const r=await chrome.storage.local.get("bnActive");chrome.storage.local.set({bnActive:!r.bnActive})}},
      {i:"🔥",t:"Firebase Sync Settings",k:"firebase sync backup cloud",run:()=>send({t:"open",url:O("firebase.html"),newTab:true})},
      {i:"📝",t:`Site Quick Note (${host||"local"})`,k:"note notes quick",run:()=>noteMode(),keep:1},
      {i:"🪟",t:"Toggle Glass theme on this site",k:"toggle glass site theme",run:async()=>{const c=await loadCfg();saveCfg({skip:c.skip.includes(host)?c.skip.filter(x=>x!==host):[...c.skip,host]})}},
      {i:"✨",t:"Cursor effect On/Off",k:"cursor glow toggle",run:toggleCfg("cuOn")},
      {i:"🌊",t:"Parallax wallpaper On/Off",k:"parallax toggle",run:toggleCfg("pxOn")},
      {i:"💬",t:"Selection popup On/Off",k:"selection popup toggle",run:toggleCfg("tpOn")},
      {i:"🔒",t:"Lock all tabs now (Alt+Shift+L)",k:"lock tab passcode privacy secure",run:()=>send({t:"lk-now"})},
      {i:"🗂",t:"Tabs: group by domain",k:"tab group domain",run:()=>send({t:"group"})},
      {i:"🧹",t:"Tabs: close duplicates",k:"tab duplicate close",run:()=>send({t:"dupes"})},
      {i:"📑",t:"Open side panel (Tab Manager)",k:"side panel tab manager",run:()=>send({t:"sp"})},
      {i:"💾",t:"Settings Export / Import",k:"export import backup",run:()=>send({t:"open",url:O("options.html#backup"),newTab:true})}
    ];
  }

  function build(){
    const r=glassRoot();
    glassStyle("pal-style",`
#pov{position:fixed;inset:0;display:none;justify-content:center;align-items:flex-start;padding-top:13vh;background:rgba(5,8,25,.45);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);pointer-events:auto;font:15px system-ui,"Noto Sans Bengali",sans-serif;color:#fff}
#pov.on{display:flex}
#pbox{width:min(680px,92vw);max-height:68vh;display:flex;flex-direction:column;border-radius:22px;background:rgba(22,26,64,.55);backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);border:1px solid rgba(255,255,255,.3);box-shadow:0 20px 60px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.3);overflow:hidden;animation:pp .16s ease-out}
@keyframes pp{from{opacity:0;transform:translateY(-10px) scale(.98)}to{opacity:1;transform:none}}
#pin{all:unset;box-sizing:border-box;width:100%;padding:18px 22px;font:17px system-ui,"Noto Sans Bengali",sans-serif;color:#fff;border-bottom:1px solid rgba(255,255,255,.18)}
#pin::placeholder{color:rgba(255,255,255,.5)}
#pres{overflow:auto;padding:8px}
.r{display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:12px;cursor:pointer}
.r.s{background:color-mix(in srgb,var(--ac) 38%,transparent)}
.r:hover{background:rgba(255,255,255,.1)}
.ic{width:26px;height:26px;display:grid;place-items:center;font-size:18px;flex:none}
.ic img{width:20px;height:20px;border-radius:5px}
.tx{flex:1;min-width:0}
.t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.u{font-size:12px;opacity:.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g{font-size:11px;padding:2px 8px;border-radius:20px;background:rgba(255,255,255,.14);opacity:.85;flex:none}
#pft{padding:8px 16px;font-size:12px;opacity:.55;border-top:1px solid rgba(255,255,255,.12)}
#pnote{all:unset;box-sizing:border-box;display:block;width:100%;min-height:200px;padding:16px 22px;font:15px/1.6 system-ui,"Noto Sans Bengali",sans-serif;color:#fff;white-space:pre-wrap}`);
    ov=document.createElement("div");ov.id="pov";
    ov.innerHTML=`<div id="pbox"><input id="pin" placeholder="Commands, tabs, bookmarks, history, calculator… (Esc to close)" autocomplete="off" spellcheck="false"><div id="pres"></div><div id="pft"></div></div>`;
    r.appendChild(ov);
    inp=ov.querySelector("#pin");res=ov.querySelector("#pres");ft=ov.querySelector("#pft");
    ov.addEventListener("mousedown",e=>{if(e.target===ov)close()});
    ["keydown","keyup","keypress"].forEach(ev=>ov.addEventListener(ev,e=>e.stopPropagation()));
    inp.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>gather(inp.value),70)});
    inp.addEventListener("keydown",e=>{
      if(e.key==="Escape"){close();e.preventDefault()}
      else if(e.key==="ArrowDown"){move(1);e.preventDefault()}
      else if(e.key==="ArrowUp"){move(-1);e.preventDefault()}
      else if(e.key==="Enter"){run(sel,e);e.preventDefault()}
    });
    res.addEventListener("click",e=>{const row=e.target.closest(".r");if(row)run(+row.dataset.i,e)});
  }
  function toggle(){openState?close():open()}
  async function open(){
    if(!ov)build();
    const c=await loadCfg();C=c;
    ov.style.setProperty("--ac",accentOf(C));
    mode="cmd";ov.classList.add("on");openState=true;
    inp.style.display="block";inp.value="";res.innerHTML="";
    ft.textContent="↑↓ navigate · Enter open · Ctrl+Enter new tab · Esc close";
    gather("");setTimeout(()=>inp.focus(),30);
  }
  function close(){if(ov)ov.classList.remove("on");openState=false;mode="cmd"}
  function move(d){if(!items.length)return;sel=(sel+d+items.length)%items.length;paint();res.querySelector(".r.s")?.scrollIntoView({block:"nearest"})}
  function icon(it){
    if(it.fav){return `<img src="${esc(O("/_favicon/")+"?pageUrl="+encodeURIComponent(it.fav)+"&size=32")}">`}
    return esc(it.i||"•");
  }
  function paint(){
    res.innerHTML=items.map((it,i)=>`<div class="r${i===sel?" s":""}" data-i="${i}"><div class="ic">${icon(it)}</div><div class="tx"><div class="t">${esc(it.t)}</div>${it.u?`<div class="u">${esc(it.u)}</div>`:""}</div>${it.g?`<span class="g">${esc(it.g)}</span>`:""}</div>`).join("")||`<div class="r"><div class="tx"><div class="t" style="opacity:.6">Nothing found</div></div></div>`;
    res.querySelectorAll("img").forEach(im=>im.addEventListener("error",()=>im.replaceWith("🌐")));
  }
  async function gather(q){
    const my=++seq;q=(q||"").trim();const ql=q.toLowerCase();
    const out=[];
    const cv=q?calc(q):null;
    if(cv!==null)out.push({i:"🧮",t:`${q} = ${+cv.toFixed(8)}`,u:"Press Enter to copy",g:"Calculator",act:async()=>{try{await navigator.clipboard.writeText(String(+cv.toFixed(8)))}catch(e){}}});
    cmds().filter(c=>!ql||(c.t+" "+c.k).toLowerCase().includes(ql)).slice(0,ql?6:13).forEach(c=>out.push({i:c.i,t:c.t,g:"Command",act:c.run,keep:c.keep}));
    const L=((await chrome.storage.local.get("links")).links||[]).flatMap(l=>l.folder?(l.items||[]):[l]);
    L.filter(l=>!ql||(l.name+" "+l.url).toLowerCase().includes(ql)).slice(0,4).forEach(l=>out.push({fav:l.url,t:l.name,u:l.url,g:"Link",url:l.url}));
    const d=await send({t:"q",q});
    if(my!==seq)return;
    if(d){
      d.tabs.slice(0,ql?8:6).forEach(x=>out.push({fav:x.url,t:x.title||x.url,u:x.url,g:"Tab",tab:x}));
      d.bm.forEach(x=>out.push({fav:x.url,t:x.title||x.url,u:x.url,g:"Bookmark",url:x.url}));
      d.hs.forEach(x=>out.push({fav:x.url,t:x.title||x.url,u:x.url,g:"History",url:x.url}));
    }
    if(q)out.push({i:"🔎",t:`Search on Google: ${q}`,g:"Web",url:"https://www.google.com/search?q="+encodeURIComponent(q)});
    items=out;sel=0;paint();
  }
  async function run(i,e){
    const it=items[i];if(!it)return;
    const nt=e&&(e.ctrlKey||e.metaKey);
    if(it.act){await it.act();if(!it.keep)close();return}
    if(it.tab){close();send({t:"switch",id:it.tab.id,w:it.tab.w});return}
    if(it.url){close();send({t:"open",url:it.url,newTab:!!nt})}
  }
  async function noteMode(){
    mode="note";noteHost=location.hostname||"local";
    inp.style.display="none";
    const n=((await chrome.storage.local.get("notes")).notes||{})[noteHost]||"";
    res.innerHTML=`<textarea id="pnote" placeholder="${esc(noteHost)} — write a note… (auto-saves)"></textarea>`;
    const ta=res.querySelector("#pnote");ta.value=n;ta.focus();
    ft.textContent=`📝 ${noteHost} — auto-saves · Esc to close`;
    let tm=null;
    ta.addEventListener("input",()=>{clearTimeout(tm);tm=setTimeout(async()=>{
      const r=await chrome.storage.local.get("notes"),nn=r.notes||{};
      if(ta.value.trim())nn[noteHost]=ta.value;else delete nn[noteHost];
      chrome.storage.local.set({notes:nn});
    },250)});
    ta.addEventListener("keydown",e=>{if(e.key==="Escape"){close();e.preventDefault()}});
  }
})();
