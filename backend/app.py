import os,json,requests
from flask import Flask,request,jsonify,send_from_directory
from source_routing import SOURCE_ROUTING
from flask_cors import CORS
app=Flask(__name__)
CORS(app)

GROQ_KEY=os.environ.get("GROQ_KEY","")
GNEWS_KEY=os.environ.get("GNEWS_KEY","")
NEWSDATA_KEY=os.environ.get("NEWSDATA_KEY","")

FRONTEND=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','frontend')

@app.route("/")
def home():
    return send_from_directory(FRONTEND,'truthlens.html')

@app.route("/login")
def login():
    return send_from_directory(FRONTEND,'login.html')

@app.route("/app.js")
def js():
    return send_from_directory(FRONTEND,'app.js')

@app.route("/news",methods=["POST"])
def get_news():
    data=request.get_json()
    claim=data.get("claim","")
    yr=2026
    q=claim+" "+str(yr)
    articles=[]
    try:
        r=requests.get("https://gnews.io/api/v4/search",params={"q":q,"lang":"en","max":3,"apikey":GNEWS_KEY},timeout=8)
        if r.json().get("articles"):
            for a in r.json()["articles"]:
                articles.append({"title":a["title"],"source":a["source"]["name"],"url":a.get("url","")})
    except:pass
    try:
        r=requests.get("https://newsdata.io/api/1/news",params={"q":q,"language":"en","prioritydomain":"top","apikey":NEWSDATA_KEY},timeout=8)
        if r.json().get("results"):
            for a in r.json()["results"][:3]:
                articles.append({"title":a["title"],"source":a["source_id"],"url":a.get("link","")})
    except:pass
    seen={}
    unique=[]
    for a in articles:
        if a["title"] not in seen:
            seen[a["title"]]=True
            unique.append(a)
    return jsonify({"articles":unique[:5]})

@app.route("/check",methods=["POST"])
def check_claim():
    data=request.get_json()
    claim=data.get("claim","")
    articles=data.get("articles",[])
    def get_domain(url):
        try:
            from urllib.parse import urlparse
            return urlparse(url).netloc.replace("www.","")
        except:return ""
    if len(articles)==0:
        return jsonify({"truth_score":0,"verdict":"Unverifiable","bias":"Neutral","explanation":"TruthLens could not find any verified sources covering this claim at this time. This may be because the claim is too recent, too localised, or not covered by our verified source network. Please check reliable sources directly.","category":"General","claim_type":"unverifiable","sources":[]})
    ctx="Today is April 2026. RCB won IPL 2025. India won Champions Trophy 2025. India won T20 WC 2026. Donald Trump is US President 2026. FIRST check if this claim is satire or parody (exaggerated, absurd, joke, meme). If satire, return claim_type=satire immediately. Otherwise classify claim_type as verifiable_fact, opinion, or too_vague. Then classify into EXACTLY ONE category from: Cricket, Football, Other Sports, Indian National Politics, State Politics, International Politics, Elections, Bollywood, South Cinema, Music, Ott & Web Series, Health & Medicine, Covid & Epidemics, Science & Space, Environment & Climate, Indian Economy, Business & Corporates, Cryptocurrency & Finance, Jobs & Employment, Religion & Communal, Caste & Reservation, Viral Social Media Claims, Gender & Society, Ai & Technology, Cybercrime & Scams, General. Reply ONLY with raw JSON, no markdown, no code blocks. Use integer 0-100 for credibility_score. verdict must be exactly one of: True, False, Misleading, Unverifiable. JSON keys: credibility_score, verdict, bias, explanation, category, claim_type. Claim: "+claim
    if articles:
        ctx+=" NEWS: "
        for i,a in enumerate(articles):
            ctx+=str(i+1)+". "+a["title"]+" ("+a["source"]+"). "
    try:
        r=requests.post("https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization":"Bearer "+GROQ_KEY,"Content-Type":"application/json"},
            json={"model":"llama-3.3-70b-versatile","temperature":0.3,"max_tokens":200,
                "messages":[{"role":"user","content":ctx}]},timeout=10)
        rj=r.json()
        content=rj["choices"][0]["message"]["content"].strip()
        if "```" in content:
            content=content.split("```")[1]
            if content.startswith("json"):content=content[4:]
        s=content.index("{");e=content.rindex("}")
        content=content[s:e+1]
        content=content.replace(': True',':"True"').replace(': False',':"False"').replace(': Neutral',':"Neutral"').replace(': Left',':"Left"').replace(': Right',':"Right"')
        result=json.loads(content)
        result["truth_score"]=int(result.get("credibility_score",55))
        claim_type=result.get("claim_type","verifiable_fact").strip().lower()
        if claim_type=="opinion":
            return jsonify({"truth_score":0,"verdict":"Unverifiable","bias":"Neutral","explanation":"This is a subjective claim or opinion. TruthLens only verifies factual claims.","category":result.get("category","General"),"claim_type":claim_type})
        if claim_type=="too_vague":
            return jsonify({"truth_score":0,"verdict":"Unverifiable","bias":"Neutral","explanation":"This claim is too vague to verify. Please provide more specific details.","category":result.get("category","General"),"claim_type":claim_type})
        if claim_type=="satire":
            return jsonify({"truth_score":0,"verdict":"Unverifiable","bias":"Neutral","explanation":"This claim appears to be satire or parody. TruthLens only verifies factual claims.","category":result.get("category","General"),"claim_type":claim_type})
        category=result.get("category","General").strip().title()
        allowed=SOURCE_ROUTING.get(category,SOURCE_ROUTING["General"])
        filtered=[a for a in articles if any(d in a.get("url","") for d in allowed)]
        if len(filtered)==0:filtered=articles
        result["category"]=category
        result["claim_type"]=claim_type
        result["filtered_sources"]=len(filtered)
        return jsonify(result)
    except Exception as ex:
        return jsonify({"truth_score":50,"verdict":"Not enough evidence","bias":"Unknown","explanation":"Could not analyze claim.","sources":[]})

@app.route("/health")
def health():
    return jsonify({"status":"ok"})

if __name__=="__main__":
    app.run(host="0.0.0.0",port=int(os.environ.get("PORT",5000)),debug=False)
