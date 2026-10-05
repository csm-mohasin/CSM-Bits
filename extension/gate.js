(()=>{
  const $=id=>document.getElementById(id);
  const to=new URLSearchParams(location.search).get("to")||"";
  $("to").textContent=to;
  let waitT=null;
  $("f").onsubmit=async e=>{
    e.preventDefault();
    const code=$("pc").value;if(!code){$("er").textContent="Enter your passcode";return}
    $("go").disabled=true;$("er").textContent="";
    let r=null;try{r=await chrome.runtime.sendMessage({t:"lk-try",code})}catch(x){}
    $("pc").value="";
    if(r&&r.ok){
      const g=await chrome.runtime.sendMessage({t:"lk-gate-go",to}).catch(()=>null);
      if(g&&g.ok)return;
      $("er").textContent=(g&&g.err)||"Could not open the page";$("go").disabled=false;return;
    }
    if(!r){$("er").textContent="Could not reach the extension. Try again.";$("go").disabled=false;return}
    if(r.wait){
      let w=r.wait;clearTimeout(waitT);
      const tick=()=>{if(w<=0){$("er").textContent="";$("go").disabled=false;$("pc").focus();return}$("er").textContent="Too many attempts. Try again in "+w+"s";w--;waitT=setTimeout(tick,1000)};
      tick();
    }else{
      $("er").textContent="Wrong passcode"+(r.left!=null?" ("+r.left+" attempt"+(r.left===1?"":"s")+" left)":"");
      $("go").disabled=false;$("pc").focus();
    }
  };
})();
