"""
Rutas de autenticación: ciudadanos y administradores.
"""

from fastapi import APIRouter, HTTPException, status
from backend.models.schemas import CiudadanoRegistro, CiudadanoLogin, AdminLogin
from backend.services.auth_service import registrar_ciudadano, login_ciudadano
from backend.config.firebase_config import db

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/registro")
def registro(datos: CiudadanoRegistro):
    """Registra un nuevo ciudadano."""
    try:
        resultado = registrar_ciudadano(datos.dict())
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/login")
def login(datos: CiudadanoLogin):
    """Inicia sesión de ciudadano."""
    try:
        ciudadano = login_ciudadano(datos.dni, datos.password)
        return {"mensaje": "Sesión iniciada.", "ciudadano": ciudadano}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/login-admin")
def login_admin(datos: AdminLogin):
    """Inicia sesión del administrador usando el correo como ID de documento."""
    try:
        # Busca el documento directamente por el ID (correo)
        admin_ref = db.collection("administradores").document(datos.email).get()
        
        if not admin_ref.exists:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="El usuario administrador no está registrado."
            )
            
        admin_data = admin_ref.to_dict()
        
        # Valida el rol de administrador
        if admin_data.get("rol") != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado. No tienes permisos de administrador."
            )
            
        # Valida la contraseña
        if admin_data.get("password") != datos.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Contraseña incorrecta."
            )
            
        # Retorna la estructura que requiere auth.js
        return {
            "token": "token-seguro-sesion-admin-yau-2026",
            "user": {
                "nombre": admin_data.get("nombre", "Supervisor Yau"),
                "email": datos.email
            }
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el servidor: {str(e)}"
        )