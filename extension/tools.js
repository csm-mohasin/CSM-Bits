const $=id=>document.getElementById(id);
let last="";
const msg=(t,ok)=>{$("msg").textContent=t;$("msg").className=ok?"ok":"er"};
const esc=s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function hl(js){
 return esc(js).replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,m=>{
  let c="n";if(/^"/.test(m))c=/:$/.test(m)?"k":"s";else if(/true|false/.test(m))c="b";else if(/null/.test(m))c="z";
  return `<span class="${c}">${m}</span>`});
}
function sortKeys(v){if(Array.isArray(v))return v.map(sortKeys);if(v&&typeof v==="object")return Object.keys(v).sort().reduce((o,k)=>(o[k]=sortKeys(v[k]),o),{});return v}
function parse(){
 const t=$("inp").value.trim();
 if(!t){msg("Input is empty",0);return null}
 try{return JSON.parse(t)}catch(e){
  let m=e.message,pos=(m.match(/position (\d+)/)||[])[1];
  if(pos!==undefined){const before=t.slice(0,+pos).split("\n");m+=` (line ${before.length}, column ${before[before.length-1].length+1})`}
  msg("❌ is wrong JSON: "+m,0);return null}
}
function show(txt){last=txt;$("out").innerHTML=hl(txt)}
const indent=()=>{const v=$("ind").value;return v==="t"?"\t":+v};
$("fmt").onclick=()=>{const v=parse();if(v===null&&$("inp").value.trim()!=="null")return;show(JSON.stringify(v,null,indent()));msg("✅ Valid JSON, formatted",1)};
$("min").onclick=()=>{const v=parse();if(v===null&&$("inp").value.trim()!=="null")return;show(JSON.stringify(v));msg("✅ Minify Done ("+last.length+" chars)",1)};
$("sort").onclick=()=>{const v=parse();if(v===null)return;show(JSON.stringify(sortKeys(v),null,indent()));msg("✅ Keys sorted",1)};
$("paste").onclick=async()=>{try{$("inp").value=await navigator.clipboard.readText();$("fmt").click()}catch(e){msg("Could not read clipboard, press Ctrl+V",0)}};
$("copy").onclick=async()=>{if(!last)return;await navigator.clipboard.writeText(last);msg("✅ Copied",1)};
$("clr").onclick=()=>{$("inp").value="";$("out").innerHTML="";last="";msg("",1)};
$("inp").addEventListener("input",()=>{const t=$("inp").value.trim();if(!t){msg("",1);return}try{JSON.parse(t);msg("✅ Valid JSON",1)}catch(e){msg("⚠ Still invalid JSON",0)}});
