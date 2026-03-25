open('backend/app.py','w').write("""
import os, json
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

app = Flask(__name__)
CORS(app)
openai.api_key = os.environ.get("OPENAI_API_KEY")

@app.route("/check", methods=["POST"])
def check_claim():
    data = request.get_json()
    claim = data["claim"].strip()
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.2,
        max_tokens=600,
        messages=[
            {"role":"system","content":"You are a fact-checker. Reply ONLY in JSON with keys: truth_score (0-100), verdict (True/False/Misleading/Not enough evidence), explanation, sources (list)."},
            {"role":"user","content":"Fact-check: "+claim}
        ]
    )
    result = json.loads(response.choices[0].message.content.strip())
    return jsonify(result)

@app.route("/health")
def health():
    return jsonify({"status":"ok"})

app.run(host="127.0.0.1", port=5000, debug=True)
""")
print("Done!")

