"""
Servicio de trámites: registro, consulta, actualización y priorización con ML.
Se conecta con Firestore y llama al modelo de Machine Learning para clasificar prioridad.
"""

from datetime import datetime
from backend.config.firebase_config import db
from ml_model.predict import predecir_prioridad


def registrar_tramite(datos: dict) -> dict:
    """
    Registra un nuevo trámite y le asigna automáticamente una prioridad
    usando el modelo de Machine Learning.
    """
    # Prepara características para el modelo ML
    features = {
        "tipo_tramite": datos["tipo_tramite"],
        "urgencia_declarada": datos.get("urgencia_declarada", "normal"),
        "documentos_completos": datos.get("documentos_completos", True),
    }

    # Predice la prioridad: "baja", "media" o "alta"
    prioridad = predecir_prioridad(features)

    tramite = {
        "tipo_tramite": datos["tipo_tramite"],
        "descripcion": datos["descripcion"],
        "ciudadano_id": datos["ciudadano_id"],
        "urgencia_declarada": datos.get("urgencia_declarada", "normal"),
        "documentos_completos": datos.get("documentos_completos", True),
        "prioridad": prioridad,
        "estado": "pendiente",
        "comentario": "",
        "fecha_registro": datetime.utcnow().isoformat(),
        "fecha_actualizacion": datetime.utcnow().isoformat(),
    }

    ref = db.collection("tramites").document()
    ref.set(tramite)

    # Crear notificación automática al ciudadano
    _crear_notificacion(
        ciudadano_id=datos["ciudadano_id"],
        tramite_id=ref.id,
        mensaje=f"Tu trámite '{datos['tipo_tramite']}' fue registrado con prioridad {prioridad.upper()}.",
        tipo="info",
    )

    return {"id": ref.id, "prioridad": prioridad, "mensaje": "Trámite registrado correctamente."}


def listar_tramites(ciudadano_id: str = None) -> list:
    """Lista todos los trámites. Si se pasa ciudadano_id, filtra por ciudadano."""
    query = db.collection("tramites")
    if ciudadano_id:
        query = query.where("ciudadano_id", "==", ciudadano_id)
    docs = query.stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def obtener_tramite(tramite_id: str) -> dict:
    """Obtiene un trámite por su ID."""
    doc = db.collection("tramites").document(tramite_id).get()
    if not doc.exists:
        raise ValueError("Trámite no encontrado.")
    return {"id": doc.id, **doc.to_dict()}


def actualizar_estado_tramite(tramite_id: str, estado: str, comentario: str = "") -> dict:
    """
    Actualiza el estado de un trámite y notifica al ciudadano.
    Estados válidos: pendiente, en_proceso, aprobado, rechazado.
    """
    estados_validos = ["pendiente", "en_proceso", "aprobado", "rechazado"]
    if estado not in estados_validos:
        raise ValueError(f"Estado inválido. Use: {estados_validos}")

    ref = db.collection("tramites").document(tramite_id)
    doc = ref.get()
    if not doc.exists:
        raise ValueError("Trámite no encontrado.")

    datos = doc.to_dict()
    ref.update({
        "estado": estado,
        "comentario": comentario,
        "fecha_actualizacion": datetime.utcnow().isoformat(),
    })

    # Notificar al ciudadano sobre el cambio de estado
    mensajes = {
        "en_proceso": "Tu trámite está siendo procesado por el personal municipal.",
        "aprobado": "¡Felicidades! Tu trámite fue APROBADO.",
        "rechazado": f"Tu trámite fue RECHAZADO. Motivo: {comentario}",
        "pendiente": "Tu trámite volvió a estado pendiente.",
    }
    _crear_notificacion(
        ciudadano_id=datos["ciudadano_id"],
        tramite_id=tramite_id,
        mensaje=mensajes.get(estado, f"Estado actualizado a: {estado}"),
        tipo="exito" if estado == "aprobado" else "alerta",
    )

    return {"mensaje": f"Trámite actualizado a '{estado}'."}


def _crear_notificacion(ciudadano_id: str, tramite_id: str, mensaje: str, tipo: str):
    """Crea una notificación interna en Firestore."""
    notif = {
        "ciudadano_id": ciudadano_id,
        "tramite_id": tramite_id,
        "mensaje": mensaje,
        "tipo": tipo,
        "leida": False,
        "fecha": datetime.utcnow().isoformat(),
    }
    db.collection("notificaciones").document().set(notif)


def obtener_notificaciones(ciudadano_id: str) -> list:
    """Obtiene todas las notificaciones de un ciudadano."""
    docs = db.collection("notificaciones") \
              .where("ciudadano_id", "==", ciudadano_id) \
              .stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def marcar_notificacion_leida(notif_id: str):
    """Marca una notificación como leída."""
    db.collection("notificaciones").document(notif_id).update({"leida": True})


def obtener_reportes() -> dict:
    """Genera estadísticas básicas para el panel administrador."""
    tramites = [doc.to_dict() for doc in db.collection("tramites").stream()]
    ciudadanos = list(db.collection("ciudadanos").stream())

    total = len(tramites)
    por_estado = {}
    por_prioridad = {}
    por_tipo = {}

    for t in tramites:
        estado = t.get("estado", "desconocido")
        prioridad = t.get("prioridad", "desconocida")
        tipo = t.get("tipo_tramite", "otro")

        por_estado[estado] = por_estado.get(estado, 0) + 1
        por_prioridad[prioridad] = por_prioridad.get(prioridad, 0) + 1
        por_tipo[tipo] = por_tipo.get(tipo, 0) + 1

    return {
        "total_tramites": total,
        "total_ciudadanos": len(ciudadanos),
        "por_estado": por_estado,
        "por_prioridad": por_prioridad,
        "por_tipo": por_tipo,
    }
