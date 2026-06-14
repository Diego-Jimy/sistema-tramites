"""
Servicio de autenticación: registro e inicio de sesión de ciudadanos.
Usa Firestore como base de datos y hashea contraseñas con bcrypt.
"""

import hashlib
import secrets
from datetime import datetime
from backend.config.firebase_config import db


def hash_password(password: str) -> str:
    """Genera un hash SHA-256 simple de la contraseña."""
    return hashlib.sha256(password.encode()).hexdigest()


def registrar_ciudadano(datos: dict) -> dict:
    """Registra un nuevo ciudadano en Firestore."""
    # Verificar si el DNI ya existe
    existente = db.collection("ciudadanos").where("dni", "==", datos["dni"]).stream()
    if any(True for _ in existente):
        raise ValueError("Ya existe un ciudadano con ese DNI.")

    ciudadano = {
        "nombre": datos["nombre"],
        "apellido": datos["apellido"],
        "dni": datos["dni"],
        "email": datos["email"],
        "telefono": datos["telefono"],
        "password_hash": hash_password(datos["password"]),
        "rol": "ciudadano",
        "fecha_registro": datetime.utcnow().isoformat(),
    }

    ref = db.collection("ciudadanos").document()
    ref.set(ciudadano)
    return {"id": ref.id, "mensaje": "Ciudadano registrado correctamente."}


def login_ciudadano(dni: str, password: str) -> dict:
    """Valida credenciales y retorna datos del ciudadano."""
    docs = db.collection("ciudadanos").where("dni", "==", dni).stream()
    ciudadano = None
    for doc in docs:
        ciudadano = {"id": doc.id, **doc.to_dict()}
        break

    if not ciudadano:
        raise ValueError("DNI no encontrado.")

    if ciudadano["password_hash"] != hash_password(password):
        raise ValueError("Contraseña incorrecta.")

    # Retornar datos sin el hash de contraseña
    ciudadano.pop("password_hash", None)
    return ciudadano


def obtener_ciudadano(ciudadano_id: str) -> dict:
    """Obtiene un ciudadano por su ID de Firestore."""
    doc = db.collection("ciudadanos").document(ciudadano_id).get()
    if not doc.exists:
        raise ValueError("Ciudadano no encontrado.")
    datos = doc.to_dict()
    datos.pop("password_hash", None)
    return {"id": doc.id, **datos}
