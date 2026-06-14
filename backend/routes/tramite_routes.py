"""
Rutas para gestión de trámites municipales.
"""

from fastapi import APIRouter, HTTPException
from backend.models.schemas import TramiteRegistro, TramiteActualizacion
from backend.services.tramite_service import (
    registrar_tramite,
    listar_tramites,
    obtener_tramite,
    actualizar_estado_tramite,
    obtener_notificaciones,
    marcar_notificacion_leida,
    obtener_reportes,
)

router = APIRouter(prefix="/tramites", tags=["Trámites"])


@router.post("/")
def crear_tramite(datos: TramiteRegistro):
    """Registra un nuevo trámite y lo clasifica automáticamente con ML."""
    try:
        return registrar_tramite(datos.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def lista_tramites(ciudadano_id: str = None):
    """Lista trámites. El parámetro ciudadano_id filtra por ciudadano."""
    try:
        return listar_tramites(ciudadano_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reportes")
def reportes():
    """Retorna estadísticas para el panel administrador."""
    try:
        return obtener_reportes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{tramite_id}")
def consultar_tramite(tramite_id: str):
    """Consulta el estado y detalle de un trámite por su ID."""
    try:
        return obtener_tramite(tramite_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{tramite_id}/estado")
def actualizar_tramite(tramite_id: str, datos: TramiteActualizacion):
    """Actualiza el estado de un trámite (solo administradores)."""
    try:
        return actualizar_estado_tramite(tramite_id, datos.estado, datos.comentario)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notificaciones/{ciudadano_id}")
def notificaciones(ciudadano_id: str):
    """Lista todas las notificaciones de un ciudadano."""
    try:
        return obtener_notificaciones(ciudadano_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/notificaciones/{notif_id}/leer")
def leer_notificacion(notif_id: str):
    """Marca una notificación como leída."""
    try:
        marcar_notificacion_leida(notif_id)
        return {"mensaje": "Notificación marcada como leída."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
