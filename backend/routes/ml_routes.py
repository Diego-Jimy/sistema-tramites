"""
Ruta para predicción directa del modelo ML.
Permite probar la priorización sin registrar un trámite.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ml_model.predict import predecir_prioridad

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


class PredictInput(BaseModel):
    tipo_tramite: str
    urgencia_declarada: str   # "normal" o "urgente"
    documentos_completos: bool


@router.post("/predecir")
def predecir(datos: PredictInput):
    """
    Predice la prioridad de un trámite: baja, media o alta.
    Útil para probar el modelo sin registrar el trámite.
    """
    try:
        features = datos.dict()
        prioridad = predecir_prioridad(features)
        return {"prioridad_predicha": prioridad}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
