"""
Módulo de predicción: carga el modelo entrenado y clasifica la prioridad de un trámite.
Si el modelo no existe, lo entrena automáticamente antes de predecir.
"""

import os
import pickle
import numpy as np

from ml_model.training_data import TIPO_TRAMITE_MAP, PRIORIDAD_LABELS

MODEL_PATH = os.path.join(os.path.dirname(__file__), "modelo_prioridad.pkl")


def _cargar_modelo():
    """Carga el modelo desde disco. Si no existe, lo entrena primero."""
    if not os.path.exists(MODEL_PATH):
        print("Modelo no encontrado. Entrenando automáticamente...")
        from ml_model.train_model import entrenar_modelo
        return entrenar_modelo()

    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


# Cargar el modelo al importar el módulo
_modelo = _cargar_modelo()


def predecir_prioridad(features: dict) -> str:
    """
    Predice la prioridad de un trámite basándose en sus características.

    Parámetros:
        features (dict): {
            "tipo_tramite": str (ej. "licencia"),
            "urgencia_declarada": str ("normal" o "urgente"),
            "documentos_completos": bool
        }

    Retorna:
        str: "baja", "media" o "alta"
    """
    # Codificar tipo de trámite (si no está en el mapa, usar 5=otros)
    tipo_cod = TIPO_TRAMITE_MAP.get(features["tipo_tramite"].lower(), 5)

    # Codificar urgencia
    urgencia_cod = 1 if features.get("urgencia_declarada", "normal") == "urgente" else 0

    # Codificar documentos completos
    docs_cod = 1 if features.get("documentos_completos", True) else 0

    # Crear vector de entrada
    X = np.array([[tipo_cod, urgencia_cod, docs_cod]])

    # Predecir y convertir a etiqueta
    pred_codigo = int(_modelo.predict(X)[0])
    return PRIORIDAD_LABELS.get(pred_codigo, "media")
