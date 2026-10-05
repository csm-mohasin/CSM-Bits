/* Tab Lock (content script + New Tab page): hides the page behind a passcode screen when the background says this tab is locked */
(()=>{
  if(window.__glassLock)return;window.__glassLock=1;
  const EXT=location.protocol==="chrome-extension:";
  if(EXT&&!/\/newtab\.html$/.test(location.pathname))return;
  if(!EXT&&!/^(https?|file):$/.test(location.protocol))return;
  const host=EXT?"newtab":location.hostname.replace(/^www\./,"");
  const LD={lkOn:false,lkMode:"all",lkList:[],lkSkip:[],lkNewTab:true};
  const mh=(l,h)=>(l||[]).some(x=>{x=String(x).trim().replace(/^www\./,"").toLowerCase();return x&&(h===x||h.endsWith("."+x))});
  const inScope=c=>{if(!c.lkOn)return false;if(host==="newtab")return c.lkNewTab!==false;if(mh(c.lkSkip,host))return false;return c.lkMode==="list"?mh(c.lkList,host):true};
  let locked=false,hostEl=null,hideEl=null,seq=0;

  function hide(){
    if(hideEl&&hideEl.isConnected)return;
    hideEl=document.createElement("style");hideEl.id="__glass_lockhide";
    hideEl.textContent="html{visibility:hidden !important;background:#0c0f24 !important}glass-lock-host{visibility:visible !important}";
    document.documentElement.appendChild(hideEl);
  }
  function reveal(){hideEl&&hideEl.remove();hideEl=null;if(hostEl){hostEl.remove();hostEl=null}locked=false}

  function build(){
    if(hostEl&&hostEl.isConnected)return;
    hostEl=document.createElement("glass-lock-host");
    hostEl.style.cssText="all:initial;position:fixed;inset:0;z-index:2147483647;display:block;visibility:visible";
    const r=hostEl.attachShadow({mode:"open"});
    r.innerHTML=`<style>
*{box-sizing:border-box;font-family:system-ui,"Noto Sans Bengali",sans-serif}
.bk{position:fixed;inset:0;display:grid;place-items:center;color:#fff;background:radial-gradient(circle at 30% 20%,rgba(120,115,245,.35),transparent 55%),rgba(10,14,36,.97);backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px)}
.cd{width:min(340px,88vw);padding:30px 26px;text-align:center;border-radius:24px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.28);box-shadow:0 20px 60px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.35)}
.ic{font-size:42px}h2{font-weight:500;font-size:1.25rem;margin:8px 0 4px}p{opacity:.7;font-size:.88rem;margin-bottom:16px}
input{width:100%;padding:13px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.32);background:rgba(255,255,255,.12);color:#fff;font-size:1.05rem;text-align:center;letter-spacing:.2em;outline:0}
input:focus{border-color:#b5b2ff}
button{margin-top:12px;width:100%;padding:12px;border-radius:14px;border:0;background:#7873f5;color:#fff;font-size:.95rem;cursor:pointer}
button:disabled{opacity:.5;cursor:not-allowed}
.er{min-height:1.3em;margin-top:10px;font-size:.82rem;color:#ff9d9d}.sm{margin-top:8px;font-size:.75rem;opacity:.5}
</style><div class="bk"><div class="cd"><div class="ic">🔒</div><h2>Locked</h2><p>Enter your passcode to continue</p><input id="pc" type="password" autocomplete="off" spellcheck="false" placeholder="Passcode"><div class="er" id="er"></div><button id="go">Unlock</button><div class="sm" id="sm"></div></div></div>`;
    r.getElementById("sm").textContent=EXT?"New Tab":host;
    const inp=r.getElementById("pc"),er=r.getElementById("er"),go=r.getElementById("go");
    let busy=false,waitT=null;
    const submit=async()=>{
      if(busy||go.disabled)return;
      const code=inp.value;if(!code){er.textContent="Enter your passcode";return}
      busy=true;go.disabled=true;er.textContent="";
      let res=null;try{res=await chrome.runtime.sendMessage({t:"lk-try",code})}catch(e){}
      busy=false;inp.value="";
      if(res&&res.ok){reveal();return}
      if(!res){er.textContent="Could not reach the extension. Try again.";go.disabled=false;return}
      if(res.wait){
        let w=res.wait;clearTimeout(waitT);
        const tick=()=>{if(w<=0){er.textContent="";go.disabled=false;inp.focus();return}er.textContent="Too many attempts. Try again in "+w+"s";w--;waitT=setTimeout(tick,1000)};
        tick();
      }else{
        er.textContent="Wrong passcode"+(res.left!=null?" ("+res.left+" attempt"+(res.left===1?"":"s")+" left)":"");
        go.disabled=false;inp.focus();
      }
    };
    go.onclick=submit;r._submit=submit;
    document.documentElement.appendChild(hostEl);
    setTimeout(()=>inp.focus(),30);
  }

  /* keep keystrokes typed into the passcode box away from the page's own listeners, and block page shortcuts while locked */
  const swallow=e=>{
    if(!locked)return;
    const p=e.composedPath?e.composedPath()[0]:e.target;
    const mine=hostEl&&p&&p.getRootNode&&p.getRootNode()===hostEl.shadowRoot;
    if(mine){
      if(e.type==="keydown"&&e.key==="Enter"){e.preventDefault();hostEl.shadowRoot._submit&&hostEl.shadowRoot._submit()}
      e.stopImmediatePropagation();return;
    }
    if(/^key/.test(e.type)){e.stopImmediatePropagation();e.preventDefault()}
  };
  ["keydown","keyup","keypress","beforeinput","paste","cut","copy"].forEach(t=>window.addEventListener(t,swallow,true));

  async function check(){
    const my=++seq;let r=null;
    try{r=await chrome.runtime.sendMessage({t:"lk-check"})}catch(e){}
    if(my!==seq)return;
    if(r&&r.locked){locked=true;hide();build()}
    else if(locked||hideEl)reveal();
  }
  async function recheck(first){
    let s;try{s=await chrome.storage.local.get(["cfg","lkHas"])}catch(e){return}
    const c={...LD,...(s.cfg||{})};
    if(!s.lkHas||!inScope(c)){seq++;reveal();return}
    if(first)hide();
    await check();
  }
  recheck(true);
  setTimeout(()=>{if(!locked&&hideEl){seq++;reveal()}},6000);   /* fail-open if the background never answers */
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)recheck(false)});
  try{
    chrome.runtime.onMessage.addListener(m=>{if(m&&m.t==="lk-recheck")recheck(false)});
    chrome.storage.onChanged.addListener(ch=>{if(ch.cfg||ch.lkHas)recheck(false)});
  }catch(e){}
})();
