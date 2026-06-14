"""
Entrenamiento del modelo de clasificación de prioridad de trámites.
Usa RandomForestClassifier de Scikit-Learn y guarda el modelo en disco.
Ejecutar una vez antes de iniciar la API: python -m ml_model.train_model
"""

import os
import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from ml_model.training_data import DATOS_ENTRENAMIENTO, PRIORIDAD_LABELS

MODEL_PATH = os.path.join(os.path.dirname(__file__), "modelo_prioridad.pkl")


def entrenar_modelo():
    """Entrena el modelo RandomForest y lo guarda como archivo .pkl."""
    datos = np.array(DATOS_ENTRENAMIENTO)

    # Separar características (X) de etiquetas (y)
    X = datos[:, :3]   # tipo_tramite_cod, urgencia, docs_completos
    y = datos[:, 3]    # prioridad: 0, 1, 2

    # Dividir en entrenamiento y prueba (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Crear y entrenar el modelo
    modelo = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        random_state=42,
    )
    modelo.fit(X_train, y_train)

    # Evaluar el modelo
    y_pred = modelo.predict(X_test)
    print("\n=== Reporte de Clasificación ===")
    print(classification_report(
        y_test, y_pred,
        target_names=list(PRIORIDAD_LABELS.values())
    ))

    # Guardar el modelo en disco
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(modelo, f)

    print(f"\nModelo guardado en: {MODEL_PATH}")
    return modelo


if __name__ == "__main__":
    entrenar_modelo()
