/* Firebase (Firestore REST) auto-sync — runs inside the service worker.
   MV3 forbids remote code, so we talk to Firestore through its REST API (no SDK needed). */
const SYNC_URG=["cfg","links","notes","clips","snaps","tomb","pfPhotoData","layout"],SYNC_ALL=[...SYNC_URG,"tt"];
let syncQ=Promise.resolve(),syncTimer=null;const lastApplied={};
const lget=k=>chrome.storage.local.get(k);
async function lset(o){for(const k in o)lastApplied[k]=JSON.stringify(o[k]);await chrome.storage.local.set(o)}
const b64=u=>{let s="";for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)};
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const J=JSON.stringify,byteLen=s=>new TextEncoder().encode(s).length;
let kc={pass:"",key:null};
async function aesKey(p){
  if(kc.pass===p&&kc.key)return kc.key;
  const km=await crypto.subtle.importKey("raw",new TextEncoder().encode(p),"PBKDF2",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:new TextEncoder().encode("glass-sync-v1"),iterations:120000,hash:"SHA-256"},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
  kc={pass:p,key};return key;
}
async function enc(f,obj){
  const js=J(obj);if(!f.pass)return js;
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await aesKey(f.pass),new TextEncoder().encode(js)));
  const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);return"enc1:"+b64(all);
}
async function dec(f,s){
  if(s.startsWith("enc1:")){
    if(!f.pass)throw new Error("This data is encrypted with a Passphrase — enter the same Sync passphrase in Settings");
    const a=unb64(s.slice(5));
    try{return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:a.slice(0,12)},await aesKey(f.pass),a.slice(12))))}
    catch(e){throw new Error("Sync passphrase is wrong")}
  }
  return JSON.parse(s);
}
const docUrl=(f,id,q)=>`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(f.projectId)}/databases/(default)/documents/${encodeURIComponent(f.col||"glassSync")}${id?"/"+encodeURIComponent(id):""}?key=${encodeURIComponent(f.apiKey)}${q||""}`;
async function fsReq(url,method,body){
  const r=await fetch(url,{method,headers:body?{"Content-Type":"application/json"}:undefined,body:body?J(body):undefined});
  if(!r.ok){let m="";try{m=(await r.json()).error.message}catch(e){}
    const hint=r.status===403?" (Allow read/write in Firestore Rules, and check that the Firestore API is enabled)":r.status===400?" (API key / Project ID OK?)":"";
    const e=new Error(`Firebase ${r.status}: ${m||r.statusText}${hint}`);e.status=r.status;throw e}
  return r.status===204?{}:r.json();
}
async function listRemote(f){
  const out={};let tok="";
  do{
    const j=await fsReq(docUrl(f,"",`&pageSize=300&mask.fieldPaths=ts${tok?"&pageToken="+encodeURIComponent(tok):""}`),"GET");
    for(const d of j.documents||[])out[decodeURIComponent(d.name.split("/").pop())]={ts:+(d.fields&&d.fields.ts?d.fields.ts.integerValue:0)};
    tok=j.nextPageToken||"";
  }while(tok);
  return out;
}
async function getP(f,id){const j=await fsReq(docUrl(f,id),"GET");return dec(f,j.fields.p.stringValue)}
async function putP(f,id,ts,payload){
  if(byteLen(payload)>1000000)throw new Error("Data too large ("+id+")");
  await fsReq(docUrl(f,id),"PATCH",{fields:{ts:{integerValue:String(ts)},p:{stringValue:payload}}});
}
const delRemote=(f,id)=>fsReq(docUrl(f,id),"DELETE").catch(()=>{});
function stripCfg(c){
  const x={...c};delete x.slideIdx;delete x.slideAt;delete x.accentSig;delete x.accentAuto;
  if(x.type==="image"||x.type==="media"){delete x.type;delete x.data;delete x.mediaId;delete x.mediaKind}   /* Wallpaper image is device-local, large */
  return x;
}
async function packClips(f,l){
  l=l.slice();
  while(l.length){const p=await enc(f,l);if(byteLen(p)<900000)return p;l=l.slice(0,Math.floor(l.length*.8))}
  return enc(f,[]);
}
const mergeObj2=(a,b)=>{const o={};for(const x of [a||{},b||{}])for(const d in x){o[d]=o[d]||{};for(const h in x[d])o[d][h]=Math.max(o[d][h]||0,x[d][h])}return o};

async function doSync(reason){
  const {fb:f={}}=await lget("fb");
  if(!f.on||!f.apiKey||!f.projectId)return{ok:false,off:true};
  const st={ts:Date.now(),ok:true,err:"",up:0,down:0,reason};
  try{
    const rem=await listRemote(f);
    const L=await lget([...SYNC_ALL,"syncMeta"]);const meta=L.syncMeta||{};const now=Date.now();
    /* --- last-write-wins keys --- */
    for(const k of ["cfg","links","notes","pfPhotoData","layout"]){
      const lv=L[k],r=rem[k],lts=meta[k]||0;
      if(r&&r.ts>lts){
        const val=await getP(f,k);
        const merged=k==="cfg"?{...(lv||{}),...val}:val;
        if(J(merged)!==J(lv)){await lset({[k]:merged});L[k]=merged;st.down++}
        meta[k]=r.ts;
      }else if(lv!==undefined&&(!r||lts>r.ts)){
        const ts=lts||now;
        await putP(f,k,ts,await enc(f,k==="cfg"?stripCfg(lv):lv));meta[k]=ts;st.up++;
      }
    }
    /* --- union-merge docs --- */
    async function union(key,mergeFn,pack){
      const r=rem[key],lv=L[key];
      const dirty=(meta[key]||0)>(meta["pushed_"+key]||0),stale=r&&r.ts!==meta["seen_"+key];
      const nonEmpty=lv!==undefined&&(Array.isArray(lv)?lv.length:Object.keys(lv).length);
      if(!dirty&&!stale&&(r||!nonEmpty))return L[key];
      const rv=stale?await getP(f,key):null;
      const m=mergeFn(lv,rv);
      const emp=Array.isArray(m)?[]:{};
      if(J(m)!==J(lv===undefined?emp:lv)){await lset({[key]:m});L[key]=m;st.down++}
      const mNon=Array.isArray(m)?m.length:Object.keys(m).length;
      if(dirty||(stale&&J(m)!==J(rv))||(!r&&mNon)){
        const ts=Date.now();await putP(f,key,ts,await pack(m));meta["seen_"+key]=ts;meta["pushed_"+key]=Math.max(meta[key]||0,ts);st.up++;
      }else meta["seen_"+key]=r?r.ts:0;
      return m;
    }
    const packPlain=m=>enc(f,m);
    const mergeTomb=(a,b)=>{const o={...(a||{})};for(const id in (b||{}))o[id]=Math.max(o[id]||0,b[id]);const cut=now-60*864e5;for(const id in o)if(o[id]<cut)delete o[id];return o};
    let tomb=await union("tomb",mergeTomb,packPlain)||{};
    /* --- snapshots (one doc each) --- */
    let local=(L.snaps||[]).filter(s=>!(tomb[s.id]&&tomb[s.id]>=s.ts));
    for(const rid of Object.keys(rem).filter(k=>k.startsWith("snap_"))){
      const id=rid.slice(5);
      if(tomb[id]&&tomb[id]>=rem[rid].ts){await delRemote(f,rid);delete rem[rid];continue}
      if(!local.find(s=>s.id===id)){local.push(await getP(f,rid));st.down++}
    }
    const cfgNow=L.cfg||{},snapMax=cfgNow.snapMax||50;
    local.sort((a,b)=>b.ts-a.ts);
    let addTomb=false;
    while(local.length>snapMax){const s=local.pop();tomb[s.id]=now;addTomb=true;if(rem["snap_"+s.id])await delRemote(f,"snap_"+s.id);delete rem["snap_"+s.id]}
    for(const s of local)if(!rem["snap_"+s.id]){await putP(f,"snap_"+s.id,s.ts,await enc(f,s));st.up++}
    if(J(local)!==J(L.snaps||[])){await lset({snaps:local});L.snaps=local}
    if(addTomb){await lset({tomb});L.tomb=tomb;meta.tomb=Date.now();await union("tomb",mergeTomb,packPlain)}
    /* --- clipboard history --- */
    const maxClip=cfgNow.clipMax||100;
    const mergeClips=(a,b)=>{
      const mp={};
      for(const c of [...(a||[]),...(b||[])]){
        const t=tomb[c.id],mu=c.mu||c.ts;if(t&&mu<=t)continue;
        const e=mp[c.id];if(!e||mu>(e.mu||e.ts))mp[c.id]={...c};
      }
      const all=Object.values(mp).sort((x,y)=>y.ts-x.ts||(x.id<y.id?-1:1));
      const pins=all.filter(c=>c.pin),rest=all.filter(c=>!c.pin).slice(0,maxClip);
      return[...pins,...rest].sort((x,y)=>y.ts-x.ts||(x.id<y.id?-1:1));
    };
    await union("clips",mergeClips,l=>packClips(f,l));
    /* --- time tracker --- */
    await union("tt",mergeObj2,packPlain);
    /* --- save meta safely --- */
    const cur=(await lget("syncMeta")).syncMeta||{};
    for(const k in meta)if(!(cur[k]>meta[k]))cur[k]=meta[k];
    await chrome.storage.local.set({syncMeta:cur});
  }catch(e){st.ok=false;st.err=String(e.message||e)}
  await chrome.storage.local.set({fbStatus:st});
  return st;
}
function runSync(reason){const p=syncQ.then(()=>doSync(reason));syncQ=p.catch(()=>{});return p}
const scheduleSync=ms=>{clearTimeout(syncTimer);syncTimer=setTimeout(()=>runSync("auto"),ms)};
async function testConn(f){
  try{await listRemote(f);return{ok:true}}catch(e){return{ok:false,err:String(e.message||e)}}
}
chrome.storage.onChanged.addListener(async(ch,area)=>{
  if(area!=="local")return;
  const keys=Object.keys(ch).filter(k=>SYNC_ALL.includes(k)&&J(ch[k].newValue)!==lastApplied[k]);
  if(!keys.length)return;
  const m=(await lget("syncMeta")).syncMeta||{},now=Date.now();
  keys.forEach(k=>m[k]=now);
  await chrome.storage.local.set({syncMeta:m});
  if(keys.some(k=>k!=="tt"))scheduleSync(3000);
});
chrome.alarms.get("fbsync").then(a=>{if(!a)chrome.alarms.create("fbsync",{periodInMinutes:5})});
chrome.alarms.onAlarm.addListener(a=>{if(a.name==="fbsync")runSync("alarm")});
chrome.runtime.onStartup.addListener(()=>runSync("startup"));
chrome.runtime.onInstalled.addListener(()=>runSync("installed"));
