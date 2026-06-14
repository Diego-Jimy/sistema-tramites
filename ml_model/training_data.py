"""
Datos de entrenamiento para el modelo de priorización de trámites.
Basados en patrones reales de municipalidades peruanas.

Características:
- tipo_tramite: tipo de trámite (codificado numéricamente)
- urgencia: 0=normal, 1=urgente
- docs_completos: 0=incompleto, 1=completo
- prioridad: 0=baja, 1=media, 2=alta (etiqueta de salida)
"""

# Cada registro: [tipo_tramite_cod, urgencia, docs_completos, prioridad]
# Tipos codificados: 0=licencia, 1=certificado, 2=permiso, 3=constancia, 4=partida, 5=otros

DATOS_ENTRENAMIENTO = [
    # Trámites de baja prioridad (prioridad=0)
    [3, 0, 1, 0],   # constancia, normal, docs completos
    [5, 0, 1, 0],   # otros, normal, docs completos
    [3, 0, 0, 0],   # constancia, normal, docs incompletos
    [5, 0, 0, 0],   # otros, normal, docs incompletos
    [1, 0, 0, 0],   # certificado, normal, incompleto
    [3, 0, 1, 0],
    [5, 0, 1, 0],
    [3, 0, 1, 0],
    [5, 0, 0, 0],
    [1, 0, 1, 0],

    # Trámites de prioridad media (prioridad=1)
    [1, 0, 1, 1],   # certificado, normal, completo
    [2, 0, 1, 1],   # permiso, normal, completo
    [0, 0, 1, 1],   # licencia, normal, completo
    [4, 0, 1, 1],   # partida, normal, completo
    [1, 1, 0, 1],   # certificado, urgente, incompleto
    [2, 0, 0, 1],   # permiso, normal, incompleto
    [0, 0, 0, 1],
    [1, 1, 0, 1],
    [2, 1, 0, 1],
    [4, 0, 1, 1],
    [0, 1, 0, 1],
    [1, 0, 1, 1],
    [2, 1, 0, 1],

    # Trámites de alta prioridad (prioridad=2)
    [0, 1, 1, 2],   # licencia, urgente, completo
    [2, 1, 1, 2],   # permiso, urgente, completo
    [4, 1, 1, 2],   # partida, urgente, completo
    [0, 1, 1, 2],
    [2, 1, 1, 2],
    [4, 1, 1, 2],
    [0, 1, 1, 2],
    [2, 1, 1, 2],
    [1, 1, 1, 2],   # certificado, urgente, completo
    [0, 1, 1, 2],
    [2, 1, 1, 2],
    [4, 1, 1, 2],
]

# Mapeo de tipo de trámite a código numérico
TIPO_TRAMITE_MAP = {
    "licencia": 0,
    "certificado": 1,
    "permiso": 2,
    "constancia": 3,
    "partida": 4,
    "otros": 5,
}

# Mapeo de código de prioridad a etiqueta
PRIORIDAD_LABELS = {0: "baja", 1: "media", 2: "alta"}
