const $=id=>document.getElementById(id);
const toast=m=>{const t=$("toast");t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",2200)};
const ENGINES=[["google","Google"],["bing","Bing"],["duck","DuckDuckGo"],["youtube","YouTube"]];
const LANGS=[["bn","Bengali (বাংলা)"],["en","English"],["hi","हिन्दी"],["ar","العربية"],["ur","اردو"],["es","Español"],["fr","Français"],["de","Deutsch"],["ja","日本語"],["zh-CN","中文"]];
const SECTIONS=[
 {id:"wall",t:"🖼 Wallpaper and Glass",f:[["wb","Wallpaper blur","range",0,30,"px"],["mediaWeb","Play video / GIF wallpaper on websites too (uses more CPU)","check"],["ga","Glass opacity","range",2,50,"%"],["gb","Glass blur","range",0,50,"px"]],extra:"wall"},
 {id:"accent",t:"🎨 Accent Color (Dominant Color Sync)",f:[["accentMode","Mode","select",[["auto","Extract automatically from wallpaper"],["custom","Pick manually"]]],["accent","Custom color","color"]],extra:"accent"},
 {id:"px",t:"🌊 Parallax Wallpaper",f:[["pxOn","Enabled","check"],["pxWeb","Also works on websites","check"],["pxStr","Movement amount","range",0,60,"px"],["pxSmooth","Smoothness (higher = faster)","range",1,30,""],["pxAuto","Auto drift (moves slowly even without the mouse)","check"],["pxSpd","Drift speed","range",1,20,""]]},
 {id:"cu",t:"✨ Cursor Glow / Glass Cursor",f:[["cuOn","Enabled","check"],["cuWeb","Also works on websites","check"],["cuStyle","Style","select",[["glow","Glow (light)"],["glass","Glass Ball"],["ring","Ring + Dot"],["dot","Dot only"]]],["cuSize","Size","range",20,320,"px"],["cuBlur","Blur","range",0,30,"px"],["cuOpacity","Brightness","range",5,100,"%"],["cuSmooth","Follow speed","range",2,40,""],["cuColorMode","Color","select",[["accent","Accent Color"],["custom","Custom color"]]],["cuColor","Custom color","color"],["cuHover","Grow on hover over links","check"],["cuClick","Click ripple","check"],["cuHideNative","Hide the real mouse cursor","check"]]},
 {id:"lk",t:"🔗 Quick Links (New Tab)",f:[["lkSize","Icon size","range",36,120,"px"],["lkShape","Shape","select",[["rounded","Rounded corners"],["circle","Circle"],["square","Square"]]],["lkLabels","Show names","check"],["lkFav","Site icon (favicon)","check"],["lkGap","Gap","range",6,40,"px"]]},
 {id:"slide",t:"🎞 Wallpaper Gallery and Slideshow",f:[["slide","Slideshow Enabled","check"],["slideMode","When to change","select",[["newtab","On every new tab"],["timed","At fixed intervals"]]],["slideMin","Time (minutes)","range",1,240,"m"]],extra:"gallery"},
 {id:"home",t:"🏠 New Tab Home",f:[["greet","Greeting message","check"],["userName","Your name","text"],["engine","Default search engine","select",[["google","Google"],["bing","Bing"],["duck","DuckDuckGo"],["youtube","YouTube"],["github","GitHub"]]],["showTodo","To-do widget","check"],["showPomo","Pomodoro widget","check"],["pomoWork","Pomodoro work time","range",5,90,"m"],["pomoBreak","Pomodoro Break","range",1,30,"m"]]},
 {id:"hist",t:"📜 History and Bookmarks",f:[["showHist","History Show","check"],["histN","History items to show","range",5,100," items"],["showBm","Bookmarks Show","check"],["bmN","Bookmarks items to show","range",5,100," items"]],note:"New Tab and Side Panel both use this. The extension cannot change how long Chrome keeps History; it only controls how many items are shown."},
 {id:"web",t:"🪟 Website Glass Theme",f:[["web","Glass theme on all sites","check"]],extra:"web"},
 {id:"tp",t:"💬 Text Selection Popup",f:[["tpOn","Enabled","check"],["tpCopy","Copy button","check"],["tpSearch","Search button","check"],["tpTranslate","Translate button","check"],["tpNote","Note button","check"],["tpEngine","Search engine","select",ENGINES],["tpLang","Translation language","select",LANGS]]},
 {id:"p",t:"⌨ Command Palette",f:[["pOn","Enabled","check"],["pKey","Shortcut: Ctrl + ","key"],["pOverride","Also override the site shortcuts and inputs","check"]],note:"chrome:// pages, Web Store and the PDF viewer do not run extension scripts, so the palette will not open there."},
 {id:"tt",t:"⏱ Site Time Tracker",f:[["ttOn","Enable time tracking","check"],["ttIdle","Idle detection time","range",15,300,"s"]],extra:"tt"},
 {id:"pf",t:"👤 Profile Card (New Tab)",f:[["pfOn","Show Profile Card on New Tab","check"],["pfNeon","Neon (Cyan/Purple) theme — turn off to use Accent color","check"],["pfFx","Effects (rotating border, spotlight, tilt, aurora background)","check"],["pfVerified","Show ✓ Verified badge next to name","check"],["pfAvail","Show status pill","check"],["pfAvailTxt","Status text","text"],["pfStatsOn","Stats strip (time today, tasks left, Clipboard, Snapshots)","check"],["pfMail","Email (for the Email button)","text"],["pfCv","CV Link (https://…)","text"],["pfName","Name","text"],["pfRole","Badge line (above name)","text"],["pfRoles","Typewriter roles (comma-separated)","text"],["pfBio","Short intro","area"],["pfSkills","Skill chips (comma-separated)","text"],["pfLoc","Location","text"],["pfPhoto","Image link (https://…)","text"],["pfSite","Portfolio Link","text"],["pfGit","GitHub Link","text"]],extra:"pf",note:"Leave the image link empty, or if it fails to load, your initials are shown. All info is also backed up with Firebase Sync."},
 {id:"tb",t:"⏳ Time Budget",f:[["tbOn","Enabled","check"],["tbMode","Which sites to ask on","select",[["all","All sites"],["list","Only sites in the list below"]]],["tbExtend","Default extra time when time is up","range",1,60,"m"],["tbChip","Show countdown in page corner","check"]],extra:"tb2",note:"A glass popup appears when a site loads (2/5/10/15/20/30 minutes, Unlimited or custom). It appears again when time runs out; if you are on another tab you get a notification."},
 {id:"bn",t:"🇧🇩 Bangla Phonetic Typing",f:[["bnOn","Enabled","check"],["bnKey","Toggle shortcut: Alt + ","key"],["bnDigits","Digits in Bangla (১২৩)","check"],["bnDari","Pressing dot (.) types dari (।)","check"],["bnPill","Small indicator in text fields (বাং/EN)","check"]],extra:"bn"},
 {id:"clip",t:"📋 Clipboard History",f:[["clipOn","Auto-save copied text","check"],["clipMax","How many to keep","range",10,300," items"],["clipMaxLen","Maximum length (characters)","range",500,50000,""]],extra:"clip"},
 {id:"snap",t:"📸 Page Snapshot",f:[["snapMax","Number of Snapshots to keep","range",5,100," items"]],extra:"snap"},
 {id:"layout",t:"✥ Widget Layout",f:[["layGrid","Snap to 10px grid while dragging","check"]],extra:"layout"},
 {id:"lock",t:"🔒 Tab Lock",f:[["lkOn","Enable Tab Lock","check"],["lkNewTab","Lock the New Tab page","check"],["lkMode","Which sites to lock","select",[["all","All sites"],["list","Only sites in the list below"]]],["lkSwitch","Lock when switching to another tab","check"],["lkDelay","…after being away for (0 = instantly)","range",0,300,"s"],["lkBlur","Lock when the browser window loses focus","check"],["lkIdleOn","Lock when the computer is idle or the screen locks","check"],["lkIdle","Idle time before locking","range",1,60,"min"],["lkStart","Lock after the browser is closed and reopened","check"],["lkRelock","Auto-relock timeout after unlocking (0 = never)","range",0,240,"min"],["lkAttempts","Wrong attempts before lock-out","range",3,10,""],["lkPagesOn","Also lock browser pages listed below (works even when typed directly)","check"]],extra:"lock"},
 {id:"fb",t:"🔥 Firebase Sync and Auto Backup",f:[],extra:"fb"},
 {id:"backup",t:"💾 Backup — Export / Import",extra:"backup",f:[]}
];
(async()=>{
 const app=$("app");let C=await loadCfg();
 const nav=document.createElement("div");nav.style.cssText="position:sticky;top:8px;z-index:5;display:flex;flex-wrap:wrap;gap:6px;padding:10px;margin-bottom:16px;border-radius:18px";nav.className="glass";
 SECTIONS.forEach(S=>{const b=document.createElement("button");b.className="btn sm"+(S.id==="fb"?" pri":"");b.textContent=S.t.replace(/\s*\(.*$/,"");b.onclick=()=>{const t=document.getElementById("s-"+S.id);t&&t.scrollIntoView({behavior:"smooth",block:"start"})};nav.appendChild(b)});
 app.appendChild(nav);
 chrome.storage.onChanged.addListener(ch=>{if(ch.cfg){C={...DEF,...ch.cfg.newValue};const s=$("accSw");if(s)s.style.background=accentOf(C)}});
 for(const S of SECTIONS){
  const sec=document.createElement("section");sec.className="glass sec";sec.id="s-"+S.id;app.appendChild(sec);
  sec.innerHTML=`<h2>${S.t}</h2>`;
  if(S.extra==="wall")wallUI(sec);
  for(const [k,label,type,a,b,u] of S.f){
   const row=document.createElement("div");row.className="f"+(type==="check"?" chk":"");
   const lb=document.createElement("label");lb.textContent=label;row.appendChild(lb);
   let el,vv=null;
   if(type==="range"){
    el=document.createElement("input");el.type="range";el.min=a;el.max=b;el.value=C[k];
    vv=document.createElement("div");vv.className="v";vv.textContent=C[k]+u;
    el.oninput=()=>{vv.textContent=el.value+u;saveCfg({[k]:+el.value})};
   }else if(type==="check"){
    el=document.createElement("input");el.type="checkbox";el.checked=!!C[k];
    el.onchange=()=>saveCfg({[k]:el.checked});
   }else if(type==="select"){
    el=document.createElement("select");el.className="inp";
    a.forEach(([v,l])=>{const o=document.createElement("option");o.value=v;o.textContent=l;el.appendChild(o)});
    el.value=C[k];el.onchange=()=>{const p={[k]:el.value};if(k==="accentMode")p.accentSig="";saveCfg(p)};
   }else if(type==="color"){
    el=document.createElement("input");el.type="color";el.value=C[k];el.oninput=()=>saveCfg({[k]:el.value});
   }else if(type==="text"){
    el=document.createElement("input");el.className="inp";el.value=C[k]||"";el.onchange=()=>saveCfg({[k]:el.value.trim()});
   }else if(type==="area"){
    el=document.createElement("textarea");el.className="inp";el.style.minHeight="84px";el.value=C[k]||"";el.onchange=()=>saveCfg({[k]:el.value.trim()});
   }else if(type==="key"){
    el=document.createElement("input");el.className="inp";el.maxLength=1;el.value=C[k];el.style.width="70px";
    el.oninput=()=>{if(el.value)saveCfg({[k]:el.value.toLowerCase()})};
   }
   row.appendChild(el);if(vv)row.appendChild(vv);sec.appendChild(row);
  }
  if(S.note){const p=document.createElement("p");p.style.cssText="opacity:.65;font-size:.8rem;margin-top:8px";p.textContent=S.note;sec.appendChild(p)}
  if(S.extra==="accent")accentUI(sec);
  if(S.extra==="gallery")galleryUI(sec);
  if(S.extra==="web")webUI(sec);
  if(S.extra==="tt")ttUI(sec);
  if(S.extra==="pf")pfUI(sec);
  if(S.extra==="tb2")tbUI(sec);
  if(S.extra==="bn")bnUI(sec);
  if(S.extra==="clip")clipUI(sec);
  if(S.extra==="snap")snapUI(sec);
  if(S.extra==="fb")fbUI(sec);
  if(S.extra==="layout")layoutUI(sec);
  if(S.extra==="lock")lockUI(sec);
  if(S.extra==="backup")backupUI(sec);
 }
 if(location.hash)$("s-"+location.hash.slice(1))?.scrollIntoView();

 async function pfUI(sec){
  const r=document.createElement("div");r.className="row";r.style.cssText="justify-content:flex-start;align-items:center;margin-bottom:10px";
  r.innerHTML='<div id="pfPrev" style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.12) center/cover;border:2px solid rgba(255,255,255,.35)"></div><input type="file" id="pfFile" accept="image/*" hidden><button class="btn" id="pfPick">📁 Upload local image</button><button class="btn" id="pfRm">🗑 Remove local image</button><a class="btn pri" href="newtab.html">✏ Edit full Profile on New Tab</a>';
  sec.insertBefore(r,sec.children[1]||null);
  const prev=async()=>{const x=(await chrome.storage.local.get("pfPhotoData")).pfPhotoData||(await loadCfg()).pfPhoto||"";r.querySelector("#pfPrev").style.backgroundImage=x?`url("${x}")`:"none";r.querySelector("#pfRm").style.display=(await chrome.storage.local.get("pfPhotoData")).pfPhotoData?"":"none"};
  prev();chrome.storage.onChanged.addListener(c=>{if(c.pfPhotoData||c.cfg)prev()});
  r.querySelector("#pfPick").onclick=()=>r.querySelector("#pfFile").click();
  r.querySelector("#pfFile").onchange=e=>{
   const f=e.target.files[0];e.target.value="";if(!f)return;
   const im=new Image(),u=URL.createObjectURL(f);
   im.onload=async()=>{const s=Math.min(im.width,im.height),c=document.createElement("canvas");c.width=c.height=Math.min(512,s);c.getContext("2d").drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,c.width,c.height);URL.revokeObjectURL(u);await chrome.storage.local.set({pfPhotoData:c.toDataURL("image/jpeg",.9)});toast("Image set")};
   im.onerror=()=>toast("❌ Could not read image");im.src=u;
  };
  r.querySelector("#pfRm").onclick=async()=>{await chrome.storage.local.remove("pfPhotoData");toast("Local image removed")};
 }

 function layoutUI(sec){
  const r=document.createElement("div");r.className="row";
  r.innerHTML='<a class="btn pri" href="newtab.html#layout">✥ Edit layout on New Tab</a><button class="btn" id="layRst">↺ Reset layout</button>';
  const n=document.createElement("p");n.style.cssText="opacity:.65;font-size:.8rem;margin-top:8px";
  n.textContent="Click ✥ on the New Tab page (or the button above), then drag any widget. Use ✕ to hide a widget and ＋ to bring it back. Hold Alt for free movement.";
  sec.append(r,n);r.querySelector("#layRst").onclick=async()=>{await chrome.storage.local.remove("layout");toast("Layout reset")};
 }
 async function lockUI(sec){
  const note=document.createElement("p");note.style.cssText="opacity:.65;font-size:.8rem;margin:8px 0";
  note.textContent="Tab Lock covers pages with a passcode screen. It deters casual snooping; it is not a replacement for an OS login. The passcode is stored only as a salted hash and is never synced.";
  sec.appendChild(note);
  linesBox(sec,"Locked sites (only used in 'Only sites in the list below' mode, one domain per line, e.g. mail.google.com):","lkList");
  linesBox(sec,"Never lock these sites:","lkSkip");
  {const l=document.createElement("label");l.style.cssText="display:block;margin:12px 0 6px;font-size:.9rem";l.textContent="Protected browser pages (one per line, e.g. chrome://extensions or chrome://settings):";
   const t=document.createElement("textarea");t.className="inp";t.value=(C.lkPages||[]).join("\n");
   t.onchange=()=>saveCfg({lkPages:t.value.split("\n").map(x=>x.trim()).filter(x=>/^[a-z-]+:\/\//i.test(x))});sec.append(l,t)}
  const box=document.createElement("div");box.style.cssText="margin-top:14px;display:grid;gap:8px;max-width:360px";sec.appendChild(box);
  const msg=document.createElement("div");msg.style.cssText="font-size:.82rem;min-height:1.2em";
  const mk=ph=>{const i=document.createElement("input");i.type="password";i.className="inp";i.placeholder=ph;i.autocomplete="new-password";return i};
  const say=(t,ok)=>{msg.textContent=t;msg.style.color=ok?"#8dffb0":"#ff9d9d"};
  async function draw(){
   box.textContent="";const st=await chrome.runtime.sendMessage({t:"lk-optstate"})||{};
   if(st.has&&!st.open){
    const p=mk("Passcode to edit Tab Lock settings"),b=document.createElement("button");b.className="btn";b.textContent="🔓 Unlock settings (10 min)";
    b.onclick=async()=>{const r=await chrome.runtime.sendMessage({t:"lk-optunlock",code:p.value});if(r&&r.ok){say("Settings unlocked for 10 minutes",1);draw()}else say(r&&r.wait?"Too many attempts. Wait "+r.wait+"s":"Wrong passcode")};
    box.append(p,b,msg);return;
   }
   const old=st.has?mk("Current passcode"):null,nw=mk(st.has?"New passcode (min 4 characters)":"Choose a passcode (min 4 characters)"),cf=mk("Repeat passcode");
   const sv=document.createElement("button");sv.className="btn pri";sv.textContent=st.has?"Change passcode":"Set passcode";
   sv.onclick=async()=>{
    if(nw.value!==cf.value)return say("Passcodes do not match");
    const r=await chrome.runtime.sendMessage({t:"lk-set",old:old?old.value:"",code:nw.value});
    if(r&&r.ok){say("Passcode saved. Now turn on 'Enable Tab Lock' above.",1);draw()}else say(r&&r.err||"Failed");
   };
   box.append(...(old?[old]:[]),nw,cf,sv);
   if(st.has){
    const lk=document.createElement("button");lk.className="btn";lk.textContent="🔒 Lock all tabs now (Alt+Shift+L)";
    lk.onclick=async()=>{const r=await chrome.runtime.sendMessage({t:"lk-now"});say(r&&r.ok?"All tabs locked":"Failed",r&&r.ok)};
    const rm=document.createElement("button");rm.className="btn";rm.textContent="🗑 Remove passcode & turn off";
    rm.onclick=async()=>{const p=prompt("Enter your current passcode to remove it");if(p==null)return;const r=await chrome.runtime.sendMessage({t:"lk-clear",code:p});if(r&&r.ok){say("Tab Lock removed",1);draw()}else say(r&&r.err||"Failed")};
    box.append(lk,rm);
   }
   box.appendChild(msg);
  }
  draw();
 }
 function linesBox(sec,label,key){
  const l=document.createElement("label");l.style.cssText="display:block;margin:12px 0 6px;font-size:.9rem";l.textContent=label;
  const t=document.createElement("textarea");t.className="inp";t.value=(C[key]||[]).join("\n");
  t.onchange=()=>saveCfg({[key]:t.value.split("\n").map(x=>x.trim().replace(/^https?:\/\//,"").replace(/^www\./,"").replace(/\/.*$/,"")).filter(Boolean)});
  sec.append(l,t);
 }
 function tbUI(sec){
  linesBox(sec,"Listed sites (works only in 'Listed sites' mode — one domain per line, e.g. youtube.com):","tbList");
  linesBox(sec,"Sites that should never ask:","tbSkip");
  const r=document.createElement("div");r.className="row";
  r.innerHTML='<button class="btn" id="tbRst">♻ Reset running Time Budgets for all sites</button>';sec.appendChild(r);
  r.querySelector("#tbRst").onclick=async()=>{await chrome.storage.local.remove("tbState");toast("Reset — will ask again after page reload")};
 }
 function bnUI(sec){
  const d=document.createElement("div");d.style.cssText="margin-top:12px;font-size:.88rem;line-height:1.75;opacity:.9";
  d.innerHTML=`<b>How to use:</b> click any text field and press <b>Alt + B</b> (বাং ↔ EN). Then type Bangla pronunciation in English letters — <code>ami</code> → আমি, <code>bangla</code> → বাংলা, <code>bhalo</code> → ভালো.<br>
  <b>A few rules (Avro style):</b> <code>O</code>=ও/ো (<code>tOmake</code>→তোমাকে), <code>T Th D Dh N</code>=ট ঠ ড ঢ ণ, <code>S Sh</code>=শ ষ, <code>R</code>=ড়, <code>ng</code>=ং, <code>Ng</code>=ঙ, <code>^</code>=ঁ, <code>:</code>=ঃ, <code>t\`</code>=ৎ, <code>rri</code>=ঋ, <code>,,</code>=hasanta (to build conjuncts by hand), <code>kkh</code>=ক্ষ, <code>gg</code>=জ্ঞ. Ra/Ya/Ba-phala are automatic: <code>prem</code>→প্রেম, <code>bidyut</code>→বিদ্যুৎ.<br>
  <span style="opacity:.7">It does not work in password / email / number fields (by design). Backspace steps back one character at a time.</span>`;
  sec.appendChild(d);
  const t=document.createElement("input");t.className="inp";t.placeholder="Type here to test (press Alt+B to turn Bangla on)";t.style.marginTop="12px";sec.appendChild(t);
 }
 async function clipUI(sec){
  const r=document.createElement("div");r.className="row";
  r.innerHTML='<a class="btn pri" href="hub.html#clip">📋 View Clipboard History</a><button class="btn" id="cClr">🗑 Clear all</button>';
  const n=document.createElement("p");n.style.cssText="opacity:.65;font-size:.8rem;margin-top:8px";
  n.textContent="⚠ Everything you copy (even from a password manager, if it is a web page) may be saved. Copies from password fields are not saved. If Firebase sync is on, encrypt with a Passphrase below.";
  sec.append(r,n);
  r.querySelector("#cClr").onclick=async()=>{if(confirm("Delete all Clipboard History (from all devices too). Are you sure?")){
   const cl=(await chrome.storage.local.get(["clips","tomb"]));const tomb=cl.tomb||{},now=Date.now();(cl.clips||[]).forEach(c=>tomb[c.id]=now);
   await chrome.storage.local.set({clips:[],tomb});toast("Deleted")}};
 }
 function snapUI(sec){
  const r=document.createElement("div");r.className="row";
  r.innerHTML='<a class="btn pri" href="hub.html#snap">📸 View Snapshots</a><button class="btn" id="sNow">Take snapshot now</button>';
  const n=document.createElement("p");n.style.cssText="opacity:.65;font-size:.8rem;margin-top:8px";
  n.textContent="Snapshot = a small image of the page + text + link + scroll position. Shortcut: Alt+Shift+S (change at chrome://extensions/shortcuts). You can also take one from the Command Palette (Ctrl+K) and the Side Panel.";
  sec.append(r,n);
  r.querySelector("#sNow").onclick=async()=>{const [t]=await chrome.tabs.query({active:true,lastFocusedWindow:true,url:["http://*/*","https://*/*"]});if(!t)return toast("Switch to another tab first");const x=await chrome.runtime.sendMessage({t:"snap",tabId:t.id});toast(x&&x.ok?"Snapshot saved":"❌ "+(x&&x.err||"Failed"))};
 }
 async function fbUI(sec){
  const FB=(await chrome.storage.local.get("fb")).fb||{};
  const sv=p=>{Object.assign(FB,p);chrome.storage.local.set({fb:FB})};
  sec.insertAdjacentHTML("beforeend",`
  <p style="opacity:.75;font-size:.88rem;line-height:1.6;margin-bottom:12px">Enter your Firebase API key here and all your settings, Quick Links, notes, Clipboard History, Snapshots and Time Tracker data will be backed up automatically. On a new device, just add this extension and enter the same API key (and the Passphrase, if you set one) to restore everything.</p>
  <div class="f chk"><label>Firebase Sync Enabled</label><input type="checkbox" id="fbOn"></div>
  <label style="display:block;margin:10px 0 6px;font-size:.9rem">Paste your firebaseConfig (easy way — it picks out apiKey and projectId for you):</label>
  <textarea class="inp" id="fbPaste" placeholder='const firebaseConfig = { apiKey: "AIza...", projectId: "my-app", ... };'></textarea>
  <div class="f" style="grid-template-columns:230px 1fr"><label>API Key</label><input class="inp" id="fbKey" autocomplete="off" spellcheck="false"></div>
  <div class="f" style="grid-template-columns:230px 1fr"><label>Project ID</label><input class="inp" id="fbPid" autocomplete="off" spellcheck="false"></div>
  <div class="f" style="grid-template-columns:230px 1fr"><label>Collection Name</label><input class="inp" id="fbCol" placeholder="glassSync" autocomplete="off"></div>
  <div class="f" style="grid-template-columns:230px 1fr"><label>Sync Passphrase (optional, encryption)</label><input class="inp" id="fbPass" type="password" autocomplete="new-password" placeholder="If set, your data is encrypted with AES-256"></div>
  <div class="row"><button class="btn" id="fbTest">🔌 Test connection</button><button class="btn pri" id="fbSync">🔄 Sync now</button></div>
  <p id="fbSt" style="margin-top:10px;font-size:.85rem;min-height:1.3em"></p>
  <details style="margin-top:12px;font-size:.85rem;opacity:.9"><summary style="cursor:pointer">📖 Firebase Setup (one-time task)</summary>
  <ol style="margin:10px 0 0 20px;line-height:1.8">
   <li>console.firebase.google.com → Create a project → Build → <b>Firestore Database</b> → Create database.</li>
   <li>Project settings → Your apps → Web app (&lt;/&gt;) Add → <code>apiKey</code> and <code>projectId</code> — copy them.</li>
   <li>Firestore → <b>Rules</b> tab, paste the following and click Publish:<pre style="white-space:pre-wrap;background:rgba(0,0,0,.3);padding:10px;border-radius:10px;margin-top:6px">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /glassSync/{doc} {
      allow read, write: if true;
    }
  }
}</pre></li>
   <li><b style="color:#ffd27d">Warning:</b> With these rules, anyone who has the API key + Project ID can read your data. So set a <b>Sync Passphrase</b> — your data then stays encrypted and is unreadable even if the key leaks. (If you forget the Passphrase, the data cannot be recovered.)</li>
   <li>Wallpaper images are not synced (device-local, large files). Firebase Free (Spark) plan easily handles this usage.</li>
  </ol></details>`);
  const $s=id=>sec.querySelector("#"+id);
  $s("fbOn").checked=!!FB.on;$s("fbKey").value=FB.apiKey||"";$s("fbPid").value=FB.projectId||"";$s("fbCol").value=FB.col||"";$s("fbPass").value=FB.pass||"";
  $s("fbOn").onchange=e=>{sv({on:e.target.checked});if(e.target.checked)chrome.runtime.sendMessage({t:"sync"})};
  $s("fbKey").onchange=e=>sv({apiKey:e.target.value.trim()});
  $s("fbPid").onchange=e=>sv({projectId:e.target.value.trim()});
  $s("fbCol").onchange=e=>sv({col:e.target.value.trim().replace(/[^\w-]/g,"")||""});
  $s("fbPass").onchange=e=>sv({pass:e.target.value});
  $s("fbPaste").oninput=e=>{
   const v=e.target.value,k=v.match(/apiKey["']?\s*[:=]\s*["']([^"']+)/),p=v.match(/projectId["']?\s*[:=]\s*["']([^"']+)/);
   if(k){$s("fbKey").value=k[1];sv({apiKey:k[1]})}if(p){$s("fbPid").value=p[1];sv({projectId:p[1]})}
   if(k&&p)toast("apiKey and projectId found");
  };
  const show=st=>{
   const el=$s("fbSt");if(!st){el.textContent="";return}
   if(st.off){el.textContent="Sync is off or no key provided.";return}
   el.style.color=st.ok?"#8dffb0":"#ff9d9d";
   el.textContent=(st.ok?"✅ Last Sync: ":"❌ Failed ("+new Date(st.ts).toLocaleTimeString("en-US")+"): ")+(st.ok?new Date(st.ts).toLocaleString("en-US")+` · ↑${st.up} ↓${st.down}`:st.err);
  };
  show((await chrome.storage.local.get("fbStatus")).fbStatus);
  chrome.storage.onChanged.addListener(ch=>{if(ch.fbStatus)show(ch.fbStatus.newValue)});
  $s("fbTest").onclick=async()=>{
   $s("fbSt").style.color="";$s("fbSt").textContent="Testing…";
   const r=await chrome.runtime.sendMessage({t:"sync-test",fb:{...FB,apiKey:$s("fbKey").value.trim(),projectId:$s("fbPid").value.trim(),col:$s("fbCol").value.trim()}});
   $s("fbSt").style.color=r&&r.ok?"#8dffb0":"#ff9d9d";$s("fbSt").textContent=r&&r.ok?"✅ Connection OK":"❌ "+(r&&r.err||"Failed");
  };
  $s("fbSync").onclick=async()=>{
   if(!FB.on){FB.on=true;$s("fbOn").checked=true;await chrome.storage.local.set({fb:FB})}
   $s("fbSt").style.color="";$s("fbSt").textContent="Syncing…";
   const r=await chrome.runtime.sendMessage({t:"sync"});show(r);
  };
 }

 async function galleryUI(sec){
  const box=document.createElement("div");box.className="gal";
  const r=document.createElement("div");r.className="row";
  r.innerHTML='<input type="file" id="gf" accept="image/*" multiple hidden><button class="btn" id="gadd">➕ Add images (multiple)</button><span class="muted" style="opacity:.6;font-size:.8rem">Max 12 · click to set</span>';
  sec.append(box,r);
  async function paint(){
   const walls=(await chrome.storage.local.get("walls")).walls||[];box.innerHTML="";
   walls.forEach((w,i)=>{
    const t=document.createElement("div");t.className="th";t.style.backgroundImage=`url(${w.data})`;
    t.onclick=()=>{saveCfg({type:"image",data:w.data,slideIdx:i});toast("Wallpaper set")};
    const x=document.createElement("b");x.textContent="✕";
    x.onclick=async e=>{e.stopPropagation();walls.splice(i,1);await chrome.storage.local.set({walls});paint()};
    t.appendChild(x);box.appendChild(t);
   });
   if(!walls.length)box.innerHTML='<p style="opacity:.6;font-size:.85rem">Gallery is empty. Add images; you need at least 2 for Slideshow.</p>';
  }
  r.querySelector("#gadd").onclick=()=>r.querySelector("#gf").click();
  r.querySelector("#gf").onchange=async e=>{
   const walls=(await chrome.storage.local.get("walls")).walls||[];
   for(const f of e.target.files){
    if(walls.length>=12)break;
    const img=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.src=URL.createObjectURL(f)});
    const k=Math.min(1,1920/img.width),c=document.createElement("canvas");c.width=img.width*k;c.height=img.height*k;c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    walls.push({id:Date.now()+Math.random(),data:c.toDataURL("image/jpeg",.8)});
   }
   await chrome.storage.local.set({walls});paint();toast("Gallery updated");
  };
  paint();
 }
 function wallUI(sec){
  const p=document.createElement("div");p.className="presets";
  PRESETS.forEach((g,i)=>{const s=document.createElement("span");s.style.background=g;s.onclick=()=>saveCfg({type:"preset",preset:i});p.appendChild(s)});
  sec.appendChild(p);
  const r=document.createElement("div");r.className="row";
  r.innerHTML=`<input type="file" id="wf" accept="image/*,video/*,.gif" hidden><button class="btn" id="wpick">📁 Upload image / GIF / video</button><input class="inp" id="wurl" placeholder="Image link https://…" style="flex:1;min-width:200px"><button class="btn" id="wset">Set</button>`;
  sec.appendChild(r);
  r.querySelector("#wpick").onclick=()=>r.querySelector("#wf").click();
  r.querySelector("#wf").onchange=e=>{
   const f=e.target.files[0];if(!f)return;
    if(/^video\//.test(f.type)||f.type==="image/gif"||/\.(gif|mp4|webm)$/i.test(f.name)){toast("Processing…");uploadWall(f).then(()=>toast("Wallpaper changed")).catch(err=>toast("❌ "+err.message));e.target.value="";return}
    const img=new Image();
   img.onload=()=>{const k=Math.min(1,2560/img.width),c=document.createElement("canvas");c.width=img.width*k;c.height=img.height*k;c.getContext("2d").drawImage(img,0,0,c.width,c.height);saveCfg({type:"image",data:c.toDataURL("image/jpeg",.88)});toast("Wallpaper changed")};
   img.src=URL.createObjectURL(f);
  };
  r.querySelector("#wset").onclick=()=>{const u=r.querySelector("#wurl").value.trim();if(u){saveCfg({type:"url",url:u});toast("Link set")}};
 }
 function accentUI(sec){
  const r=document.createElement("div");r.className="row";
  r.innerHTML=`<span>Current Accent:</span><span class="sw" id="accSw"></span><button class="btn" id="accRe">🔄 Re-extract from Wallpaper</button>`;
  sec.appendChild(r);$("accSw").style.background=accentOf(C);
  $("accRe").onclick=async()=>{await saveCfg({accentMode:"auto",accentSig:""});toast("Re-extracting color…")};
 }
 function webUI(sec){
  const l=document.createElement("label");l.style.cssText="display:block;margin:12px 0 6px;font-size:.9rem";l.textContent="Sites where Glass should be off (one domain per line):";
  const t=document.createElement("textarea");t.className="inp";t.value=C.skip.join("\n");
  t.onchange=()=>saveCfg({skip:t.value.split("\n").map(x=>x.trim()).filter(Boolean)});
  sec.append(l,t);
 }
 function ttUI(sec){
  const r=document.createElement("div");r.className="row";
  r.innerHTML=`<a class="btn" href="stats.html">📊 View stats</a><button class="btn" id="ttClr">🗑 Delete all-time data</button>`;
  sec.appendChild(r);
  $("ttClr").onclick=async()=>{if(confirm("All Time Tracker data will be deleted. Are you sure?")){await chrome.storage.local.remove(["tt","ttHost","ttLast"]);toast("Deleted")}};
 }
 function backupUI(sec){
  sec.insertAdjacentHTML("beforeend",`
  <p style="opacity:.75;margin-bottom:10px;font-size:.9rem">All settings and Quick Links are always included. Choose the optional parts below:</p>
  <label style="display:block;margin:6px 0"><input type="checkbox" id="bNotes" checked> Site notes</label>
  <label style="display:block;margin:6px 0"><input type="checkbox" id="bTT"> Time Tracker Data</label>
  <label style="display:block;margin:6px 0"><input type="checkbox" id="bClip" checked> Clipboard History and Snapshots</label>
  <div class="row"><button class="btn pri" id="bExp">⬇ Export (JSON)</button><input type="file" id="bFile" accept=".json,application/json" hidden><button class="btn" id="bImp">⬆ Import (JSON)</button><button class="btn" id="bRst">♻ Reset all</button></div>`);
  $("bExp").onclick=async()=>{
   const all=await chrome.storage.local.get(null);
   const out={_glass:3,date:new Date().toISOString(),cfg:all.cfg||{},links:all.links||[]};
   if($("bNotes").checked)out.notes=all.notes||{};
   if($("bTT").checked)out.tt=all.tt||{};
   if($("bClip").checked){out.clips=all.clips||[];out.snaps=all.snaps||[]}
   const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,2)],{type:"application/json"}));
   a.download="glass-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();toast("Export Done");
  };
  $("bImp").onclick=()=>$("bFile").click();
  $("bFile").onchange=async e=>{
   try{
    const j=JSON.parse(await e.target.files[0].text());if(!j._glass)throw 0;
    const set={};for(const k of ["cfg","links","notes","tt","clips","snaps"])if(j[k]!==undefined)set[k]=j[k];
    await chrome.storage.local.set(set);toast("Import successful! Reloading page…");setTimeout(()=>location.reload(),900);
   }catch(err){toast("❌ Invalid file")}
  };
  $("bRst").onclick=async()=>{if(confirm("All settings will be reset to defaults (notes and links are kept). Are you sure?")){await chrome.storage.local.remove("cfg");location.reload()}};
 }
})();
