
var ca=document.getElementById('c'),ctx=ca.getContext('2d'),pts=[];
function resize(){ca.width=window.innerWidth;ca.height=window.innerHeight}
resize();window.addEventListener('resize',resize);
for(var i=0;i<55;i++)pts.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:(Math.random()-0.5)*0.25,vy:(Math.random()-0.5)*0.25,r:Math.random()*1.2+0.4});
function draw(){
ctx.clearRect(0,0,ca.width,ca.height);
pts.forEach(function(p){
p.x+=p.vx;p.y+=p.vy;
if(p.x<0||p.x>ca.width)p.vx*=-1;
if(p.y<0||p.y>ca.height)p.vy*=-1;
ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
ctx.fillStyle='rgba(96,165,250,0.45)';ctx.fill();
});
for(var i=0;i<pts.length;i++){
for(var j=i+1;j<pts.length;j++){
var d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);
if(d<110){
ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);
ctx.strokeStyle='rgba(96,165,250,'+(0.12*(1-d/110))+')';
ctx.lineWidth=0.5;ctx.stroke();
}}}
requestAnimationFrame(draw);}
draw();

var tlHistory=JSON.parse(localStorage.getItem('tl_history')||'[]');
function saveHistory(claim,verdict,score){
tlHistory.unshift({claim:claim,verdict:verdict,score:score,time:new Date().toLocaleTimeString()});
if(tlHistory.length>5)tlHistory=tlHistory.slice(0,5);
localStorage.setItem('tl_history',JSON.stringify(tlHistory));
renderHistory();}
function renderHistory(){
var hs=document.getElementById('historySection');
var hl=document.getElementById('historyList');
if(tlHistory.length==0){hs.style.display='none';return;}
hs.style.display='block';hl.innerHTML='';
tlHistory.forEach(function(item){
var color=item.verdict.toLowerCase().includes('true')?'#4ade80':item.verdict.toLowerCase().includes('false')?'#f87171':'#fbbf24';
var bg=item.verdict.toLowerCase().includes('true')?'rgba(22,163,74,0.15)':item.verdict.toLowerCase().includes('false')?'rgba(220,38,38,0.15)':'rgba(217,119,6,0.15)';
hl.innerHTML+='<div class="history-item"><div class="history-claim">'+item.claim+'</div><div class="history-meta"><span class="history-verdict" style="background:'+bg+';color:'+color+'">'+item.verdict+'</span><span class="history-score">'+item.score+'%</span><span class="history-score">'+item.time+'</span></div></div>';
});}
var currentLang='en';
function setLang(lang){
currentLang=lang;
if(lang=='hi'){
document.getElementById('langHI').classList.add('active');
document.getElementById('langEN').classList.remove('active');
document.getElementById('claimLabel').textContent='अपना दावा या समाचार लिखें';
document.getElementById('claim').placeholder='उदाहरण: भारत ने T20 विश्व कप 2026 जीता...';
}else{
document.getElementById('langEN').classList.add('active');
document.getElementById('langHI').classList.remove('active');
document.getElementById('claimLabel').textContent='Your Claim or News';
document.getElementById('claim').placeholder='e.g. India won the T20 World Cup 2026...';
}}
function shareResult(){
var claim=document.getElementById('claim').value.trim();
var score=document.getElementById('sn').textContent;
var verdict=document.getElementById('vp').textContent;
var exp=document.getElementById('exp').textContent;
var text='TruthLens Fact Check - Claim: '+encodeURIComponent(claim)+' - Credibility: '+score+' - Verdict: '+verdict+' - Analysis: '+encodeURIComponent(exp);
window.open('https://wa.me/?text='+text,'_blank');}

function parseRSS(text){
var items=[];
var matches=text.match(/<item[^>]*>([\s\S]*?)<[/]item>/gi)||[];
matches.slice(0,3).forEach(function(item){
var t1=item.match(/CDATA[(](.*?)[)][)]/);
var t2=item.match(/<title>(.*?)<[/]title>/);
var title=(t1&&t1[1])||(t2&&t2[1])||'';
var source=(item.match(/<source[^>]*>(.*?)<[/]source>/i)||[])[1]||'News';
if(title)items.push({title:title.trim(),source:source.trim()});
});
return items;}
function fetchT(url,t){
return Promise.race([
fetch(url).catch(function(){return null;}),
new Promise(function(r){setTimeout(function(){r(null);},t||4000);})
]);}

function analyze(){
var claim=document.getElementById('claim').value.trim();
if(!claim){alert('Please enter a claim!');return;}
document.getElementById('loading').style.display='block';
document.getElementById('results').style.display='none';
document.getElementById('newsSection').style.display='none';
document.getElementById('loadingText').textContent='Racing 10 news sources...';
var yr=new Date().getFullYear();
var q=encodeURIComponent(claim+' '+yr);
var sources=[
{url:'https://gnews.io/api/v4/search?q='+q+'&lang=en&max=3&apikey='+GNEWS_KEY,type:'gnews'},
{url:'https://newsdata.io/api/1/news?q='+q+'&language=en&prioritydomain=top&apikey='+NEWSDATA_KEY,type:'newsdata'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://news.google.com/rss/search?q='+q+'&hl=en-IN&gl=IN'),type:'rss'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://feeds.feedburner.com/ndtvnews-top-stories'),type:'rss'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://timesofindia.indiatimes.com/rssfeedstopstories.cms'),type:'rss'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml'),type:'rss'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://indiatoday.intoday.in/rss/1206514'),type:'rss'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://www.thehindu.com/news/national/feeder/default.rss'),type:'rss'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://feeds.bbci.co.uk/news/rss.xml'),type:'rss'},
{url:'https://api.allorigins.win/get?url='+encodeURIComponent('https://feeds.reuters.com/reuters/INtopNews'),type:'rss'}
];
var allArticles=[];
var completed=0;
var promises=sources.map(function(src){
return fetchT(src.url,4000).then(function(r){
if(!r)return[];
return r.json().then(function(data){
var articles=[];
if(src.type=='gnews'&&data.articles){
data.articles.forEach(function(a){articles.push({title:a.title,source:a.source.name});});}
else if(src.type=='newsdata'&&data.results){
data.results.slice(0,3).forEach(function(a){articles.push({title:a.title,source:a.source_id});});}
else if(src.type=='rss'&&data.contents){
var words=claim.toLowerCase().split(' ').filter(function(w){return w.length>3;});
parseRSS(data.contents).forEach(function(a){
var t=a.title.toLowerCase();
var relevant=words.some(function(w){return t.includes(w);});
if(relevant)articles.push(a);
});}
completed++;
document.getElementById('loadingText').textContent='Got '+completed+'/10 sources...';
return articles;
}).catch(function(){return[];});
}).catch(function(){return[];});
});
Promise.all(promises).then(function(results){
results.forEach(function(arr){arr.forEach(function(a){allArticles.push(a);});});
var seen={};
allArticles=allArticles.filter(function(a){
if(!a.title||seen[a.title])return false;
seen[a.title]=true;return true;});
var top5=allArticles.slice(0,5);
if(top5.length>0){
var nl=document.getElementById('newsList');
nl.innerHTML='';
top5.forEach(function(a){
nl.innerHTML+='<div class="news-card"><div class="news-source">'+a.source.toUpperCase()+'</div><div class="news-title">'+a.title+'</div></div>';
});
document.getElementById('newsSection').style.display='block';}
document.getElementById('loadingText').textContent='AI analyzing...';
var ctx2='Today is March 2026. RCB won IPL 2025. India won Champions Trophy 2025. India won T20 WC 2026. Donald Trump is US President 2026. Reply ONLY with JSON: {"credibility_score":75,"verdict":"True","bias":"Neutral","explanation":"10 word reason"}. Claim: '+claim;
if(top5.length>0){ctx2+=' NEWS: ';top5.forEach(function(a,i){ctx2+=(i+1)+'. '+a.title+' ('+a.source+'). ';});}
fetch('https://api.groq.com/openai/v1/chat/completions',{
method:'POST',
headers:{'Authorization':'Bearer '+GROQ_KEY,'Content-Type':'application/json'},
body:JSON.stringify({model:'llama-3.3-70b-versatile',temperature:0.3,max_tokens:200,messages:[{role:'user',content:ctx2}]})
}).then(function(r){return r.json();})
.then(function(gj){
var content=gj.choices[0].message.content.trim();
if(content.includes('`'+'`'+'`')){content=content.split('`'+'`'+'`')[1];if(content.startsWith('json'))content=content.slice(4);}
var s=content.indexOf('{');var e=content.lastIndexOf('}');content=content.slice(s,e+1);
content=content.replace(/: *True/g,':"True"').replace(/: *False/g,':"False"').replace(/: *Neutral/g,':"Neutral"').replace(/: *Left/g,':"Left"').replace(/: *Right/g,':"Right"');
try{var d=JSON.parse(content);}catch(err){var d={credibility_score:55,verdict:'Not enough evidence',bias:'Unknown',explanation:content.slice(0,80)};}
var score=parseInt(d.credibility_score)||55;
document.getElementById('sn').textContent=score+'%';
var verdict=String(d.verdict||'Unknown');
var vp=document.getElementById('vp');
vp.textContent=verdict;
if(verdict.toLowerCase().includes('true')){vp.style.background='rgba(22,163,74,0.15)';vp.style.color='#4ade80';document.getElementById('sn').style.color='#4ade80';}
else if(verdict.toLowerCase().includes('false')){vp.style.background='rgba(220,38,38,0.15)';vp.style.color='#f87171';document.getElementById('sn').style.color='#f87171';}
else if(verdict.toLowerCase().includes('misleading')){vp.style.background='rgba(217,119,6,0.15)';vp.style.color='#fbbf24';document.getElementById('sn').style.color='#fbbf24';}
else{vp.style.background='rgba(100,116,139,0.15)';vp.style.color='#94a3b8';document.getElementById('sn').style.color='#94a3b8';}
setTimeout(function(){var bf=document.getElementById('bf');bf.style.width=score+'%';bf.style.background=score>=70?'linear-gradient(90deg,#16a34a,#4ade80)':score>=40?'linear-gradient(90deg,#d97706,#fbbf24)':'linear-gradient(90deg,#dc2626,#f87171)';},100);
document.getElementById('bp').textContent='Bias: '+String(d.bias||'Unknown');
document.getElementById('exp').textContent=d.explanation||'No explanation.';
document.getElementById('loading').style.display='none';
document.getElementById('results').style.display='block';
saveHistory(claim,verdict,score);
setTimeout(function(){
var btn=document.getElementById('resetBtn');
btn.style.transition='all 0.5s';
btn.style.border='1px solid rgba(96,165,250,0.6)';
btn.style.color='rgba(96,165,250,0.9)';
btn.style.background='rgba(96,165,250,0.08)';
btn.style.boxShadow='0 0 16px rgba(96,165,250,0.25)';
},2000);
}).catch(function(e){
document.getElementById('loading').style.display='none';
alert('Error: '+e.message);});
});}
function resetForm(){
document.getElementById('results').style.display='none';
document.getElementById('newsSection').style.display='none';
document.getElementById('claim').value='';
document.getElementById('cc').textContent='0';
document.getElementById('bf').style.width='0%';
var btn=document.getElementById('resetBtn');
btn.style.border='1px solid rgba(255,255,255,0.07)';
btn.style.color='rgba(255,255,255,0.3)';
btn.style.background='transparent';
btn.style.boxShadow='none';}
window.onload=function(){
renderHistory();
document.getElementById('claim').addEventListener('input',function(){
document.getElementById('cc').textContent=this.value.length;});};
</script>