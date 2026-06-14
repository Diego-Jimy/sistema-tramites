"""
Configuración de Firebase Firestore.
Lee las variables de entorno desde .env para conectarse al proyecto Firebase.
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

def init_firebase():
    """Inicializa Firebase usando las credenciales del archivo JSON o variables de entorno."""
    if not firebase_admin._apps:
        firebase_key_path = os.getenv("FIREBASE_KEY_PATH")
        if firebase_key_path and os.path.exists(firebase_key_path):
            cred = credentials.Certificate(firebase_key_path)
        else:
            # Construir credenciales desde variables de entorno individuales
            cred_dict = {
                "type": "service_account",
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
            cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)

    return firestore.client()

# Instancia global del cliente Firestore
db = init_firebase()
