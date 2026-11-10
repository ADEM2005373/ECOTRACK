"""
Configuration centrale pour l'envoi d'emails ECOTRACK.
Stocke et charge automatiquement le mot de passe d'application de Adem Ouerhani.
"""

import os
from pathlib import Path

DEFAULT_EMAIL = "ouerhaniadem0805@gmail.com"
DEFAULT_APP_PWD = "pehnqpzdlwizslyr"

def get_smtp_credentials():
    sender = os.environ.get("GMAIL_USER") or DEFAULT_EMAIL
    pwd = os.environ.get("GMAIL_APP_PASSWORD")
    
    if not pwd:
        # Check .env file
        env_path = Path(__file__).resolve().parents[2] / ".env"
        if env_path.exists():
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GMAIL_APP_PASSWORD="):
                        pwd = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
    
    return sender, (pwd or DEFAULT_APP_PWD).replace(" ", "").strip()
