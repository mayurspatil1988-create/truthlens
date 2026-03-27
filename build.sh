#!/bin/bash
echo "Creating firebase-config.js..."
cat > frontend/firebase-config.js << JSEOF
var firebaseConfig = {
  apiKey: "${FIREBASE_API_KEY}",
  authDomain: "truthlens-e1bee.firebaseapp.com",
  projectId: "truthlens-e1bee",
  appId: "1:217767982737:web:6e88d22ef22b045de43130"
};
JSEOF
echo "Done!"
pip install -r requirements.txt
