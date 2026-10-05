const $=id=>document.getElementById(id);
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const fmt=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${String(m).padStart(2,"0")}m`:m?`${m}m ${String(s%60).padStart(2,"0")}s`:`${s}s`};
const sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
let TT={},mode="day",sel=new Date();
const lastDays=(n,end=new Date())=>Array.from({length:n},(_,i)=>{const d=new Date(end);d.setDate(d.getDate()-(n-1-i));return d});
function merge(days){const m={};days.forEach(d=>{const t=TT[ymd(d)]||{};for(const h in t)m[h]=(m[h]||0)+t[h]});return m}
function kpi(l,v){return `<div class="glass kpi"><b>${v}</b><span>${l}</span></div>`}
function sites(m){
 const arr=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,15),tot=sum(m),mx=arr[0]?arr[0][1]:1;
 $("sites").innerHTML=arr.length?arr.map(([h,s])=>`<div class="site"><img src="${chrome.runtime.getURL("/_favicon/")}?pageUrl=${encodeURIComponent("https://"+h)}&size=32"><div class="n" title="${h}">${h}</div><div class="tr"><i style="width:${s/mx*100}%"></i></div><div class="t">${fmt(s)} · ${Math.round(s/tot*100)}%</div></div>`).join(""):'<p class="muted">No data yet. Browse for a while and check again.</p>';
}
function chart(days,title){
 $("ct").textContent=title;
 const vals=days.map(d=>sum(TT[ymd(d)])),mx=Math.max(...vals,1);
 $("chart").innerHTML=days.map((d,i)=>{
  const lb=days.length>10?(d.getDate()%5===0||i===0?d.getDate():""):d.toLocaleDateString("en-US",{weekday:"short"});
  return `<div class="col" title="${ymd(d)}: ${fmt(vals[i])}"><em>${days.length<=10&&vals[i]?fmt(vals[i]):""}</em><div class="bar" style="height:${vals[i]/mx*85}%"></div><small>${lb}</small></div>`;
 }).join("");
}
function render(){
 document.querySelectorAll(".tabs .btn[data-m]").forEach(b=>b.classList.toggle("on",b.dataset.m===mode));
 $("dsel").style.display=mode==="day"?"flex":"none";
 if(mode==="day"){
  const key=ymd(sel),t=TT[key]||{},y=new Date(sel);y.setDate(y.getDate()-1);
  const tot=sum(t),yt=sum(TT[ymd(y)]),diff=yt?Math.round((tot-yt)/yt*100):null;
  $("date").value=key;
  $("kpis").innerHTML=kpi("Total time",fmt(tot))+kpi("Number of sites",Object.keys(t).length)+kpi("Vs yesterday",diff===null?"—":(diff>=0?"▲ ":"▼ ")+Math.abs(diff)+"%")+kpi("Top sites",Object.entries(t).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—");
  chart(lastDays(7,sel),"Last 7 days (up to the selected day)");sites(t);
 }else{
  const n=mode==="week"?7:30,days=lastDays(n),prev=lastDays(n,new Date(days[0].getTime()-864e5));
  const m=merge(days),tot=sum(m),pt=sum(merge(prev)),diff=pt?Math.round((tot-pt)/pt*100):null;
  const act=days.filter(d=>sum(TT[ymd(d)])>0).length;
  $("kpis").innerHTML=kpi("Total time",fmt(tot))+kpi("Daily average",fmt(tot/n))+kpi("vs previous "+(n===7?"week":"30 days")+" ",diff===null?"—":(diff>=0?"▲ ":"▼ ")+Math.abs(diff)+"%")+kpi("Busiest day",(()=>{let b=null;days.forEach(d=>{const s=sum(TT[ymd(d)]);if(!b||s>b.s)b={s,d}});return b&&b.s?b.d.toLocaleDateString("en-US",{day:"numeric",month:"short"}):"—"})())+kpi("Active days",act+"/"+n);
  chart(days,n===7?"Weekly summary":"Monthly summary");sites(m);
 }
}
async function load(){TT=(await chrome.storage.local.get("tt")).tt||{};render()}
document.querySelectorAll(".tabs .btn[data-m]").forEach(b=>b.onclick=()=>{mode=b.dataset.m;render()});
$("prev").onclick=()=>{sel.setDate(sel.getDate()-1);render()};
$("next").onclick=()=>{if(ymd(sel)<ymd(new Date())){sel.setDate(sel.getDate()+1);render()}};
$("date").onchange=e=>{if(e.target.value){sel=new Date(e.target.value+"T12:00:00");render()}};
$("csv").onclick=()=>{
 let c="date,site,seconds\n";Object.keys(TT).sort().forEach(d=>{for(const h in TT[d])c+=`${d},${h},${Math.round(TT[d][h])}\n`});
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([c],{type:"text/csv"}));a.download="site-time.csv";a.click();
};
chrome.storage.onChanged.addListener(ch=>{if(ch.tt){TT=ch.tt.newValue||{};render()}});
load();
