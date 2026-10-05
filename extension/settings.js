const DEF={type:"preset",preset:0,url:"",data:"",wb:0,ga:12,gb:22,web:true,skip:[],
 accentMode:"auto",accent:"#7873f5",accentAuto:"",accentSig:"",
 pxOn:true,pxWeb:true,pxStr:18,pxSmooth:8,pxAuto:false,pxSpd:4,
 cuOn:true,cuWeb:true,cuStyle:"glow",cuSize:140,cuBlur:6,cuOpacity:45,cuSmooth:14,cuColorMode:"accent",cuColor:"#ffffff",cuHover:true,cuClick:true,cuHideNative:false,
 lkSize:64,lkShape:"rounded",lkLabels:true,lkFav:true,lkGap:18,
 tpOn:true,tpCopy:true,tpSearch:true,tpTranslate:true,tpNote:true,tpLang:"bn",tpEngine:"google",
 pOn:true,pKey:"k",pOverride:true,
 ttOn:true,ttIdle:60,
 histN:15,bmN:15,showHist:true,showBm:true,greet:true,userName:"",engine:"google",showTodo:true,showPomo:true,pomoWork:25,pomoBreak:5,
 tbOn:true,tbMode:"all",tbList:[],tbSkip:["google.com","localhost","127.0.0.1","claude.ai"],tbExtend:5,tbChip:true,
 pfOn:true,pfVerified:true,pfAvail:true,pfAvailTxt:"Open to opportunities",pfStatsOn:true,pfFx:true,pfMail:"",pfCv:"",pfNeon:true,pfName:"CSM Mohasin Alam",pfRole:"Frontend Developer & Designer",
 pfRoles:"Frontend Web Developer, UI/UX Designer, React.js Developer, Python Enthusiast",
 pfBio:"Passionate frontend web developer & designer from Magura, Bangladesh. I build responsive, user-friendly and interactive web apps with clean code and modern UI.",
 pfLoc:"Magura, Bangladesh",pfSkills:"HTML, CSS, JavaScript, React.js, Python",
 pfPhoto:"https://mohasin.bro.bd/3d/3.png",pfSite:"https://mohasin.bro.bd",pfGit:"https://github.com/csm-mohasin",
 bnOn:true,bnKey:"b",bnDigits:true,bnDari:true,bnPill:true,
 clipOn:true,clipMax:100,clipMaxLen:20000,snapMax:50,
 mediaWeb:false,mediaKind:"",mediaId:"",layGrid:true,
 lkOn:false,lkMode:"all",lkList:[],lkSkip:[],lkNewTab:true,lkSwitch:true,lkDelay:0,lkBlur:false,lkIdleOn:false,lkIdle:5,lkStart:true,lkRelock:0,lkAttempts:5,lkPagesOn:true,lkPages:["chrome://extensions"],
 slide:false,slideMode:"newtab",slideMin:30,slideIdx:0,slideAt:0};
const PRESETS=[
"linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)",
"linear-gradient(135deg,#ff6ec4,#7873f5)",
"linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
"linear-gradient(135deg,#ff9966,#ff5e62)",
"linear-gradient(135deg,#11998e,#38ef7d)",
"linear-gradient(135deg,#232526,#414345)",
"radial-gradient(circle at 20% 20%,#ff6ec4,transparent 40%),radial-gradient(circle at 80% 80%,#7873f5,transparent 45%),#0f1030"];
const PRESET_ACC=["#4f8cff","#c26bff","#3ec9d6","#ff7b6b","#35e08f","#9aa4b5","#b06bff"];
async function loadCfg(){const r=await chrome.storage.local.get("cfg");return{...DEF,...(r.cfg||{})}}
async function saveCfg(p){const c={...await loadCfg(),...p};await chrome.storage.local.set({cfg:c});return c}
const hexRgb=h=>{h=(h||"#7873f5").replace("#","");if(h.length===3)h=h.split("").map(x=>x+x).join("");const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255]};
const rgbHex=(r,g,b)=>"#"+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");
const mixHex=(h,t)=>{const a=hexRgb(h);return rgbHex(a[0]+(255-a[0])*t,a[1]+(255-a[1])*t,a[2]+(255-a[2])*t)};
function accentOf(c){return c.accentMode==="custom"?c.accent:(c.accentAuto||PRESET_ACC[c.preset]||"#7873f5")}
function wallCss(c){return (c.type==="image"||c.type==="media")&&c.data?`url(${c.data})`:c.type==="url"&&c.url?`url(${c.url})`:(PRESETS[c.preset]||PRESETS[0])}
function wallSrc(c){return (c.type==="image"||c.type==="media")&&c.data?c.data:c.type==="url"&&c.url?c.url:null}
function extractAccent(src){return new Promise(res=>{
 const im=new Image();im.crossOrigin="anonymous";
 im.onload=()=>{try{
  const c=document.createElement("canvas");c.width=c.height=48;const x=c.getContext("2d");x.drawImage(im,0,0,48,48);
  const d=x.getImageData(0,0,48,48).data,bins={};
  for(let i=0;i<d.length;i+=4){
   const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),v=mx,s=mx?(mx-mn)/mx:0;
   if(v<.2||s<.25)continue;
   let h=0;const df=mx-mn;
   if(df){h=mx===r?((g-b)/df)%6:mx===g?(b-r)/df+2:(r-g)/df+4;h*=60;if(h<0)h+=360}
   const k=Math.floor(h/20),w=s*v,o=bins[k]||(bins[k]={w:0,r:0,g:0,b:0});
   o.w+=w;o.r+=d[i]*w;o.g+=d[i+1]*w;o.b+=d[i+2]*w;
  }
  let best=null;for(const k in bins)if(!best||bins[k].w>best.w)best=bins[k];
  if(!best)return res(null);
  let R=best.r/best.w,G=best.g/best.w,B=best.b/best.w;
  const mx=Math.max(R,G,B);if(mx<200){const f=200/mx;R*=f;G*=f;B*=f}
  res(rgbHex(R,G,B));
 }catch(e){res(null)}};
 im.onerror=()=>res(null);im.src=src})}
async function refreshAccent(){
 const c=await loadCfg();if(c.accentMode!=="auto")return;
 const sig=[c.type,c.preset,c.data?c.data.length:0,c.url,c.mediaId].join("|");
 if(c.accentSig===sig)return;
 const src=wallSrc(c),hex=src?await extractAccent(src):null;
 await saveCfg({accentSig:sig,accentAuto:hex||PRESET_ACC[c.preset]||""});
}
function applyCfg(c){
 let w=document.getElementById("gbg");
 if(!w){w=document.createElement("div");w.id="gbg";document.body.prepend(w)}
 w.style.backgroundImage=wallCss(c);
 applyMedia(w,c);
 const s=document.documentElement.style,ac=accentOf(c);
 s.setProperty("--wb",c.wb+"px");s.setProperty("--ga",c.ga/100);s.setProperty("--gb",c.gb+"px");
 s.setProperty("--accent",ac);s.setProperty("--accent-l",mixHex(ac,.5));
}

/* ---------- video / GIF wallpaper (blob kept in IndexedDB; cfg only stores a small poster frame) ---------- */
function mdb(){return new Promise((res,rej)=>{const r=indexedDB.open("glassMedia",1);r.onupgradeneeded=()=>r.result.createObjectStore("m");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function mediaPut(k,blob){const d=await mdb();return new Promise((res,rej)=>{const t=d.transaction("m","readwrite");t.objectStore("m").put(blob,k);t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
async function mediaGet(k){const d=await mdb();return new Promise((res,rej)=>{const q=d.transaction("m").objectStore("m").get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)})}
function vidPoster(blob){return new Promise(res=>{
 const v=document.createElement("video"),u=URL.createObjectURL(blob);v.muted=true;v.preload="auto";v.src=u;
 const done=x=>{URL.revokeObjectURL(u);res(x)};
 v.onloadeddata=()=>{v.currentTime=Math.min(.5,(v.duration||1)/2)};
 v.onseeked=()=>{try{const k=Math.min(1,1280/v.videoWidth),c=document.createElement("canvas");c.width=v.videoWidth*k;c.height=v.videoHeight*k;c.getContext("2d").drawImage(v,0,0,c.width,c.height);done(c.toDataURL("image/jpeg",.8))}catch(e){done("")}};
 v.onerror=()=>done("");setTimeout(()=>done(""),15000)})}
function gifPoster(blob){return new Promise(res=>{
 const im=new Image(),u=URL.createObjectURL(blob);
 im.onload=()=>{try{const k=Math.min(1,1280/im.width),c=document.createElement("canvas");c.width=im.width*k;c.height=im.height*k;c.getContext("2d").drawImage(im,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",.8))}catch(e){res("")}URL.revokeObjectURL(u)};
 im.onerror=()=>{URL.revokeObjectURL(u);res("")};im.src=u})}
async function uploadWall(f){
 const isV=/^video\//.test(f.type)||/\.(mp4|webm|m4v|mov)$/i.test(f.name),isG=f.type==="image/gif"||/\.gif$/i.test(f.name);
 if(!isV&&!isG)throw new Error("Please choose a GIF, MP4 or WebM file");
 if(f.size>400*1048576)throw new Error("File is too large (max 400 MB)");
 const poster=isV?await vidPoster(f):await gifPoster(f);
 if(!poster)throw new Error(isV?"Chrome cannot play this video (use H.264 MP4 or WebM)":"Could not read this GIF");
 await mediaPut("wall",f);
 return saveCfg({type:"media",mediaKind:isV?"video":"gif",mediaId:String(Date.now()),data:poster});
}
let _mTok=0,_mUrl="";
async function applyMedia(w,c){
 const tok=++_mTok,want=c.type==="media"&&c.mediaId;
 let el=w.querySelector(".gmedia");
 if(!want){el&&el.remove();return}
 if(el&&el.dataset.sig===c.mediaId)return;
 let blob=null;try{blob=await mediaGet("wall")}catch(e){}
 if(tok!==_mTok)return;
 w.querySelectorAll(".gmedia").forEach(x=>x.remove());
 if(!blob)return;
 if(_mUrl)URL.revokeObjectURL(_mUrl);_mUrl=URL.createObjectURL(blob);
 const v=c.mediaKind==="video";
 el=document.createElement(v?"video":"img");el.className="gmedia";el.dataset.sig=c.mediaId;
 if(v){el.muted=true;el.defaultMuted=true;el.loop=true;el.autoplay=true;el.playsInline=true}
 el.style.cssText="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none";
 el.src=_mUrl;w.appendChild(el);if(v)el.play().catch(()=>{});
}
