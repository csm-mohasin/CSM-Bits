const $=id=>document.getElementById(id);
const toast=m=>{const t=$("toast");t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(()=>t.style.display="none",2200)};
(async()=>{
 const sec=$("box");

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
 
 document.getElementById('ver').textContent='v'+chrome.runtime.getManifest().version;
})();
