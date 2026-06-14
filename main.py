"""
Punto de entrada principal de la API FastAPI.
Registra todas las rutas y configura CORS para el frontend.
Los archivos estáticos (css/, js/, pages/, index.html) están en la raíz del proyecto.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.routes.auth_routes import router as auth_router
from backend.routes.tramite_routes import router as tramite_router
from backend.routes.ml_routes import router as ml_router

app = FastAPI(
    title="Sistema de Trámites - Municipalidad Provincial de Yau",
    description="API para gestión automatizada de trámites municipales con Machine Learning.",
    version="1.0.0",
)

# Permitir solicitudes desde el frontend (cualquier origen en desarrollo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas de la API
app.include_router(auth_router, prefix="/api")
app.include_router(tramite_router, prefix="/api")
app.include_router(ml_router, prefix="/api")

# Raíz del proyecto
ROOT = os.path.dirname(__file__)

# Montar carpetas estáticas desde la raíz
app.mount("/css",   StaticFiles(directory=os.path.join(ROOT, "css")),   name="css")
app.mount("/js",    StaticFiles(directory=os.path.join(ROOT, "js")),    name="js")
app.mount("/pages", StaticFiles(directory=os.path.join(ROOT, "pages")), name="pages")

@app.get("/")
def root():
    """Sirve el index.html principal."""
    return FileResponse(os.path.join(ROOT, "index.html"))

@app.get("/index.html")
def index_html():
    """Redirección explícita para asegurar carga desde la raíz."""
    return FileResponse(os.path.join(ROOT, "index.html"))

@app.get("/health")
def health():
    """Endpoint de verificación de salud de la API."""
    return {"estado": "ok", "sistema": "Municipalidad Provincial de Yau"}

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    """
    Captura cualquier ruta desconocida y redirige al index.html 
    para permitir la navegación del frontend.
    """
    return FileResponse(os.path.join(ROOT, "index.html"))