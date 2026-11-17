#!/usr/bin/env python3
"""
ECOTRACK V2 - Alerte Rejet SCRUM-48 (Hiba Dhouib)
"""

import sys
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid

sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from email_config import get_smtp_credentials

SENDER_NAME = "Adem Ouerhani (Lead Developer & Scrum Master)"
SENDER_EMAIL, STORED_APP_PWD = get_smtp_credentials()

HIBA_EMAIL = "hibadhouib6@gmail.com"
SUBJECT = "[ECOTRACK V2] 🚨 Rejet Code Review SCRUM-48 : Tentative de mise en revue avec 0% de code & Guide de correction"

BODY = """Bonjour Hiba,

En tant que Lead Developer et Scrum Master sur ECOTRACK V2, j'ai procédé à la revue de code officielle du ticket SCRUM-48 qui a été placé dans la colonne "Revue en cours" sur Jira.

============================================================
1. DÉCISION OFFICIELLE DU SCRUM MASTER : REJET IMMÉDIAT ❌
============================================================
Ticket : SCRUM-48 (ECO-22 | [AI] Microservice IA FastAPI — Classification Automatique des Photos d'Incidents)
Statut : RÉTROGRADÉ DE "Revue en cours" ➔ "À FAIRE" (To Do)
Lien Jira : https://ouerhaniadem0805.atlassian.net/browse/SCRUM-48

============================================================
2. CONSTAT D'AUDIT LIGNE PAR LIGNE DANS 'services/ai-vision/' 🔍
============================================================
L'audit approfondi du microservice IA révèle que le code attendu est TOTALEMENT ABSENT :
- 'services/ai-vision/main.py' ne contient que la sonde basique 'GET /health'.
- Aucune route 'POST /api/v1/vision/classify' n'est déclarée.
- Aucun modèle de Vision (MobileNetV3 / PyTorch) n'est instancié.
- Aucun traitement d'image n'est effectué.
- Aucun commit n'a été poussé sur GitHub.

⚠️ RAPPEL DE GOUVERNANCE STRICT :
Il est formellement interdit de déplacer un ticket vers "Revue en cours" ou "Terminé" sans avoir codé, testé et poussé le code correspondant sur GitHub.

============================================================
3. GUIDE PÉDAGOGIQUE PAS-À-PAS POUR CODER LA SOLUTION 🛠️
============================================================
Voici exactement les étapes que tu dois réaliser sur ta machine :

1. Positionne-toi sur ta branche :
   git checkout develop
   git pull origin develop
   git checkout -b feature/ECO-22-hiba-ai-fastapi

2. Crée la route d'inférence dans 'services/ai-vision/main.py' (ou dans un router 'routers/classify.py') :
   - Importe PyTorch, torchvision et PIL :
     from PIL import Image
     import io
     import torchvision.transforms as transforms
     import torchvision.models as models

   - Charge un modèle MobileNetV3 léger :
     model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
     model.eval()

   - Définis les transformations 224x224 conformes à notre Media Service :
     preprocess = transforms.Compose([
         transforms.Resize((224, 224)),
         transforms.ToTensor(),
         transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
     ])

   - Implémente la route officielle :
     @app.post("/api/v1/vision/classify")
     async def classify_incident_photo(file: UploadFile = File(...)):
         image_bytes = await file.read()
         image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
         tensor = preprocess(image).unsqueeze(0)
         
         with torch.no_grad():
             outputs = model(tensor)
             probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
             confidence, predicted_idx = torch.max(probabilities, 0)
         
         # Mapping vers les catégories CDCF V2 EcoTrack
         CATEGORIES = ["DEPOT_SAUVAGE", "ENCOMBRANTS", "DECHETS_VERTS", "GRAVATS_CHANTIER"]
         category = CATEGORIES[predicted_idx.item() % len(CATEGORIES)]
         
         return {
             "category": category,
             "confidence": round(float(confidence.item()), 4),
             "model": "mobilenet_v3_small",
             "is_confident": bool(confidence.item() >= 0.65)
         }

3. Teste en local sur ton poste :
   curl -X POST http://localhost:8000/api/v1/vision/classify -F "file=@photo_test.jpg"

4. Commite avec ta signature Git :
   git config user.name "Hiba Dhouib"
   git config user.email "hibadhouib6@gmail.com"
   git add .
   git commit -m "feat(ai-vision): implement POST /api/v1/vision/classify route with MobileNetV3"
   git push -u origin feature/ECO-22-hiba-ai-fastapi

5. Sur Jira : Déplace alors ton ticket de "À faire" -> "En cours" -> "Revue en cours".

Je compte sur ton sérieux pour livrer ce composant essentiel sous 24 heures.

Cordialement,
Adem Ouerhani
Lead Developer & Scrum Master — ECOTRACK V2
"""

def send():
    app_pwd = STORED_APP_PWD.replace(" ", "").strip()
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SENDER_EMAIL, app_pwd)
        
        msg = MIMEMultipart()
        msg["From"] = f"{SENDER_NAME} <{SENDER_EMAIL}>"
        msg["To"] = HIBA_EMAIL
        msg["Subject"] = SUBJECT
        msg["Date"] = formatdate(localtime=True)
        msg["Message-ID"] = make_msgid(domain="ecotrack.local")
        msg.attach(MIMEText(BODY, "plain", "utf-8"))
        
        server.sendmail(SENDER_EMAIL, [HIBA_EMAIL], msg.as_string())
        server.quit()
        print(f"[OK] Alerte de rejet SCRUM-48 envoyée avec succès à {HIBA_EMAIL} !")
    except Exception as e:
        print(f"[ERREUR] Échec de l'envoi : {e}")

if __name__ == '__main__':
    send()
