/**
 * api.js — Funciones centralizadas para llamar al backend FastAPI.
 * Configurado para conectarse al backend en producción alojado en Render.
 */

// URL del backend en Render (reemplaza 'sistema-tramites-yau' si decides usar otro nombre en el Paso 3)
const API_BASE = "https://sistema-tramites-yau.onrender.com/api";

/**
 * Realiza una petición HTTP genérica al backend.
 * @param {string} endpoint - Ruta relativa (ej. "/tramites/")
 * @param {string} method   - Método HTTP: GET, POST, PUT
 * @param {object} body     - Cuerpo de la solicitud (para POST/PUT)
 * @returns {Promise<object>} - Respuesta JSON del backend
 */
async function llamarAPI(endpoint, method = "GET", body = null) {
  const opciones = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opciones.body = JSON.stringify(body);

  const respuesta = await fetch(API_BASE + endpoint, opciones);
  const datos = await respuesta.json();

  if (!respuesta.ok) {
    // El backend retorna { detail: "..." } en errores
    throw new Error(datos.detail || "Error desconocido en la API.");
  }
  return datos;
}

/* ── Autenticación ─────────────────────────────────────── */

async function apiRegistrar(datos) {
  return llamarAPI("/auth/registro", "POST", datos);
}

async function apiLogin(dni, password) {
  return llamarAPI("/auth/login", "POST", { dni, password });
}

/* ── Trámites ──────────────────────────────────────────── */

async function apiRegistrarTramite(datos) {
  return llamarAPI("/tramites/", "POST", datos);
}

async function apiListarTramites(ciudadanoId = null) {
  const qs = ciudadanoId ? `?ciudadano_id=${ciudadanoId}` : "";
  return llamarAPI(`/tramites/${qs}`);
}

async function apiObtenerTramite(tramiteId) {
  return llamarAPI(`/tramites/${tramiteId}`);
}

async function apiActualizarEstado(tramiteId, estado, comentario = "") {
  return llamarAPI(`/tramites/${tramiteId}/estado`, "PUT", { estado, comentario });
}

/* ── Notificaciones ────────────────────────────────────── */

async function apiNotificaciones(ciudadanoId) {
  return llamarAPI(`/tramites/notificaciones/${ciudadanoId}`);
}

async function apiMarcarLeida(notifId) {
  return llamarAPI(`/tramites/notificaciones/${notifId}/leer`, "PUT");
}

/* ── Machine Learning ──────────────────────────────────── */

async function apiPredecirPrioridad(tipo, urgencia, docsCompletos) {
  return llamarAPI("/ml/predecir", "POST", {
    tipo_tramite: tipo,
    urgencia_declarada: urgencia,
    documentos_completos: docsCompletos,
  });
}

/* ── Reportes ──────────────────────────────────────────── */

async function apiReportes() {
  return llamarAPI("/tramites/reportes");
}