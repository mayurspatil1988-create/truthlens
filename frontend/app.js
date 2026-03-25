async function checkClaim(){
var claim=document.getElementById("claim").value.trim();
if(!claim){alert("Please enter a claim!");return;}
document.getElementById("loading").style.display="block";
document.getElementById("results").style.display="none";
try{
var r=await fetch("http://127.0.0.1:5000/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({claim:claim})});
var d=await r.json();
document.getElementById("loading").style.display="none";
var score=parseInt(d.truth_score)||50;
document.getElementById("sn").textContent=score+"%";
var verdict=String(d.verdict||"Unknown");
var vp=document.getElementById("vp");
vp.textContent=verdict;
if(verdict.toLowerCase().includes("true")){vp.style.background="rgba(22,163,74,0.15)";vp.style.color="#4ade80";document.getElementById("sn").style.color="#4ade80";}
else if(verdict.toLowerCase().includes("false")){vp.style.background="rgba(220,38,38,0.15)";vp.style.color="#f87171";document.getElementById("sn").style.color="#f87171";}
else if(verdict.toLowerCase().includes("misleading")){vp.style.background="rgba(217,119,6,0.15)";vp.style.color="#fbbf24";document.getElementById("sn").style.color="#fbbf24";}
else{vp.style.background="rgba(100,116,139,0.15)";vp.style.color="#94a3b8";document.getElementById("sn").style.color="#94a3b8";}
var bf=document.getElementById("bf");
setTimeout(function(){bf.style.width=score+"%";bf.style.background=score>=70?"linear-gradient(90deg,#16a34a,#4ade80)":score>=40?"linear-gradient(90deg,#d97706,#fbbf24)":"linear-gradient(90deg,#dc2626,#f87171)";},100);
document.getElementById("exp").textContent=d.explanation||"No explanation.";
var sl=document.getElementById("srclist");
sl.innerHTML="";
if(d.sources&&d.sources.length>0){d.sources.forEach(function(s){sl.innerHTML+="<div class='src-item'><div class='src-dot'></div><span>"+s+"</span></div>";});document.getElementById("srcrow").style.display="flex";}
else{document.getElementById("srcrow").style.display="none";}
document.getElementById("results").style.display="block";
}catch(e){document.getElementById("loading").style.display="none";alert("Error: "+e.message);}
}
function resetForm(){
document.getElementById("results").style.display="none";
document.getElementById("claim").value="";
document.getElementById("cc").textContent="0";
document.getElementById("bf").style.width="0%";
}