# Sistema de Trámites Municipales con ML
**Municipalidad Provincial de Yau** — Taller de ML · SENATI

Gestión automatizada de trámites con priorización inteligente usando Machine Learning (RandomForest + Scikit-Learn), backend FastAPI y base de datos Firebase Firestore.

---

## Estructura del Proyecto

```
municipalidad-yau/
├── backend/
│   ├── config/firebase_config.py   # Conexión Firestore
│   ├── models/schemas.py           # Modelos Pydantic
│   ├── routes/                     # Endpoints FastAPI
│   └── services/                   # Lógica de negocio
├── frontend/
│   ├── index.html                  # Landing / Login
│   ├── pages/ciudadano.html        # Panel ciudadano
│   ├── pages/admin.html            # Panel administrador
│   ├── css/styles.css
│   └── js/                         # api.js, auth.js, ciudadano.js, admin.js
├── ml_model/
│   ├── training_data.py            # Datos de entrenamiento
│   ├── train_model.py              # Script de entrenamiento
│   └── predict.py                  # Módulo de predicción
├── main.py                         # Entrada FastAPI
├── requirements.txt
├── .env.example
└── .gitignore
```

---

## Instalación y Ejecución

### 1. Clonar y crear entorno virtual
```bash
git clone https://github.com/tu-usuario/municipalidad-yau.git
cd municipalidad-yau
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configurar Firebase
1. Ve a [Firebase Console](https://console.firebase.google.com/) → tu proyecto → Configuración → Cuentas de servicio
2. Genera una nueva clave privada y descárgala como `firebase-key.json`
3. Coloca `firebase-key.json` en la raíz del proyecto
4. Copia `.env.example` a `.env` y ajusta `FIREBASE_KEY_PATH=firebase-key.json`

### 3. Entrenar el modelo ML
```bash
python -m ml_model.train_model
```
Esto genera `ml_model/modelo_prioridad.pkl` con el modelo entrenado.

### 4. Ejecutar la API
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Abrir el sistema
- **Frontend:** http://localhost:8000
- **Docs API:** http://localhost:8000/docs
- **Admin demo:** clic en "Acceso Administrador" en el login

---

## Prueba Rápida del Sistema

### Registrar ciudadano
```bash
curl -X POST http://localhost:8000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"Perez","dni":"12345678","email":"juan@yau.pe","telefono":"987654321","password":"123456"}'
```

### Predecir prioridad ML
```bash
curl -X POST http://localhost:8000/api/ml/predecir \
  -H "Content-Type: application/json" \
  -d '{"tipo_tramite":"licencia","urgencia_declarada":"urgente","documentos_completos":true}'
```

---

## Tecnologías
| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, Bootstrap 5, JavaScript |
| Backend | Python 3.11+, FastAPI |
| Base de datos | Firebase Firestore |
| Machine Learning | Scikit-Learn, RandomForest |
| Deploy local | Uvicorn |
