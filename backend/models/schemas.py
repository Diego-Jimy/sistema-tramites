"""
Modelos Pydantic para validación de datos en la API.
Define la estructura de ciudadanos, administradores, trámites y notificaciones.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CiudadanoRegistro(BaseModel):
    nombre: str
    apellido: str
    dni: str
    email: EmailStr
    telefono: str
    password: str


class CiudadanoLogin(BaseModel):
    dni: str
    password: str


class TramiteRegistro(BaseModel):
    tipo_tramite: str          # Ej: "licencia", "certificado", "permiso"
    descripcion: str
    ciudadano_id: str
    urgencia_declarada: Optional[str] = "normal"  # "normal", "urgente"
    documentos_completos: Optional[bool] = True


class TramiteActualizacion(BaseModel):
    estado: str               # "pendiente", "en_proceso", "aprobado", "rechazado"
    comentario: Optional[str] = ""


class NotificacionCreate(BaseModel):
    ciudadano_id: str
    tramite_id: str
    mensaje: str
    tipo: str = "info"        # "info", "alerta", "exito", "error"


class AdminLogin(BaseModel):
    """Modelo para la autenticación del Administrador."""
    email: EmailStr
    password: str