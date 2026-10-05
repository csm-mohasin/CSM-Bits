const $=id=>document.getElementById(id);
let page=null,S=null,wallImg=null,CFG=null;
const load=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src});
function rr(x,a,b,w,h,r){x.beginPath();x.roundRect(a,b,w,h,r)}
(async()=>{
 const r=await chrome.storage.local.get("shot");S=r.shot;CFG=await loadCfg();
 if(!S||!S.strips||!S.strips.length){$("st").textContent="No screenshots. Take one from the Side Panel or Ctrl+K.";return}
 const imgs=await Promise.all(S.strips.map(s=>load(s.img)));
 const k=imgs[0].naturalWidth/S.vw;
 page=document.createElement("canvas");page.width=imgs[0].naturalWidth;page.height=Math.round(S.H*k);
 const x=page.getContext("2d");
 imgs.forEach((im,i)=>x.drawImage(im,0,Math.round(S.strips[i].y*k)));
 const src=wallSrc(CFG);if(src){try{wallImg=await load(src)}catch(e){}}
 $("st").textContent=`${S.mode==="visible"?"🖼 This screen":"📸 Full page"} · ${S.title||""} — ${page.width}×${page.height}px`;
 ["bg","sc","pad","rad","shd","bar","frm"].forEach(id=>$(id).addEventListener("input",compose));
 compose();
})();
function compose(){
 if(!page)return;
 const pad=+$("pad").value,rad=+$("rad").value,shd=+$("shd").value,bar=$("bar").checked?46:0;
 const out=$("out"),w=page.width+pad*2,h=page.height+pad*2+bar;
 out.width=w;out.height=h;const x=out.getContext("2d");
 const ac=accentOf(CFG),bg=$("bg").value;
 if(bg==="wall"){
  if(wallImg){
   const s=Math.max(w/wallImg.width,h/wallImg.height),dw=wallImg.width*s,dh=wallImg.height*s;
   x.filter="blur(18px)";x.drawImage(wallImg,(w-dw)/2-30,(h-dh)/2-30,dw+60,dh+60);x.filter="none";
  }else{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,"#1a1a2e");g.addColorStop(1,"#0f3460");x.fillStyle=g;x.fillRect(0,0,w,h)}
 }else if(bg==="accent"){
  const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,ac);g.addColorStop(1,"#0c0f24");x.fillStyle=g;x.fillRect(0,0,w,h);
 }else if(bg==="solid"){x.fillStyle=$("sc").value;x.fillRect(0,0,w,h)}
 const cx=pad,cy=pad,cw=page.width,ch=page.height+bar;
 x.save();x.shadowColor="rgba(0,0,0,.55)";x.shadowBlur=shd;x.shadowOffsetY=shd/3;
 rr(x,cx,cy,cw,ch,rad);x.fillStyle="rgba(20,24,60,.85)";x.fill();x.restore();
 x.save();rr(x,cx,cy,cw,ch,rad);x.clip();
 if(bar){
  x.fillStyle="rgba(255,255,255,.1)";x.fillRect(cx,cy,cw,bar);
  ["#ff5f57","#febc2e","#28c840"].forEach((c,i)=>{x.fillStyle=c;x.beginPath();x.arc(cx+24+i*22,cy+bar/2,7,0,7);x.fill()});
  const bw=Math.min(cw-190,cw*.7),bx=cx+cw/2-bw/2+40;
  rr(x,bx,cy+9,bw,bar-18,(bar-18)/2);x.fillStyle="rgba(255,255,255,.14)";x.fill();
  x.fillStyle="rgba(255,255,255,.85)";x.font="600 15px system-ui,sans-serif";x.textBaseline="middle";
  let u=(S.url||"").replace(/^https?:\/\//,"");while(x.measureText(u).width>bw-30&&u.length>6)u=u.slice(0,-2);
  x.fillText(u,bx+16,cy+bar/2+1);
 }
 x.drawImage(page,cx,cy+bar);x.restore();
 if($("frm").checked){
  rr(x,cx+.5,cy+.5,cw-1,ch-1,rad);x.strokeStyle="rgba(255,255,255,.45)";x.lineWidth=1.5;x.stroke();
  x.save();rr(x,cx+1,cy+1,cw-2,ch-2,rad);x.clip();
  const g=x.createLinearGradient(0,cy,0,cy+60);g.addColorStop(0,"rgba(255,255,255,.18)");g.addColorStop(1,"rgba(255,255,255,0)");
  x.fillStyle=g;x.fillRect(cx,cy,cw,60);x.restore();
 }
}
const blob=()=>new Promise(r=>$("out").toBlob(r,"image/png"));
$("dl").onclick=async()=>{
 const a=document.createElement("a");a.href=URL.createObjectURL(await blob());
 let h="page";try{h=new URL(S.url).hostname}catch(e){}
 a.download=`glass-shot-${h}-${Date.now()}.png`;a.click();
};
$("cp").onclick=async()=>{
 try{await navigator.clipboard.write([new ClipboardItem({"image/png":await blob()})]);$("st").textContent="✅ Copied to clipboard"}
 catch(e){$("st").textContent="❌ Could not copy, please download"}
};
$("retake").onclick=async()=>{
 const tabs=await chrome.tabs.query({currentWindow:true,active:false});
 const t=S&&tabs.find(x=>x.url===S.url);
 if(t){await chrome.tabs.update(t.id,{active:true});setTimeout(()=>chrome.runtime.sendMessage({t:"shot",tabId:t.id,mode:S.mode||"full"}),500)}
 else $("st").textContent="Could not find the original tab, take it again directly from the page.";
};
