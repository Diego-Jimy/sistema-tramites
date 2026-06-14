/**
 * ciudadano.js — Lógica del panel del ciudadano.
 * Maneja trámites, notificaciones y consultas de estado.
 */

let sesion = null;
let tramitesCache = [];

window.addEventListener("DOMContentLoaded", () => {
  // Verificar sesión - Redirección absoluta a la raíz
  const raw = localStorage.getItem("sesion");
  if (!raw) { window.location.href = "/"; return; }
  sesion = JSON.parse(raw);

  // Redirigir admin al panel correcto
  if (sesion.rol === "admin") {
    window.location.href = "/pages/admin.html";
    return;
  }

  // Mostrar nombre en navbar y sidebar
  document.getElementById("nav-nombre").textContent = `${sesion.nombre} ${sesion.apellido}`;
  document.getElementById("sidebar-nombre").textContent = `${sesion.nombre} ${sesion.apellido}`;
  document.getElementById("sidebar-dni").textContent = `DNI: ${sesion.dni}`;

  // Cargar datos iniciales
  cargarMisTramites();
  cargarNotificaciones();
});

/* ── Navegación entre secciones ─────────────────────── */

function mostrarSeccion(nombre) {
  ["mis-tramites", "nuevo-tramite", "consultar"].forEach(s => {
    document.getElementById(`seccion-${s}`).classList.add("d-none");
  });
  document.getElementById(`seccion-${nombre}`).classList.remove("d-none");

  // Actualizar sidebar activo
  document.querySelectorAll(".list-group-item").forEach(el => el.classList.remove("active"));
  event.target.classList.add("active");
}

/* ── Mis Trámites ────────────────────────────────────── */

async function cargarMisTramites() {
  const contenedor = document.getElementById("tabla-tramites");
  contenedor.innerHTML = `<div class="text-center py-5">
    <div class="spinner-border text-primary" role="status"></div>
    <p class="mt-2 text-muted">Cargando trámites...</p></div>`;

  try {
    tramitesCache = await apiListarTramites(sesion.id);

    if (tramitesCache.length === 0) {
      contenedor.innerHTML = `
        <div class="text-center py-5 text-muted">
          <i class="bi bi-inbox display-4"></i>
          <p class="mt-2">No tienes trámites registrados todavía.</p>
          <button class="btn btn-primary" onclick="mostrarSeccion('nuevo-tramite')">
            <i class="bi bi-plus-circle me-1"></i>Registrar mi primer trámite
          </button>
        </div>`;
      return;
    }

    contenedor.innerHTML = tramitesCache.map(t => tarjetaTramite(t)).join("");
  } catch (err) {
    contenedor.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

/** Genera HTML de tarjeta de trámite */
function tarjetaTramite(t) {
  const fecha = t.fecha_registro ? t.fecha_registro.substring(0, 10) : "-";
  return `
    <div class="card tramite-card prioridad-${t.prioridad} shadow-sm fade-in-up">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div>
            <h6 class="fw-bold mb-1 text-capitalize">${t.tipo_tramite}</h6>
            <small class="text-muted">${t.descripcion.substring(0, 80)}${t.descripcion.length > 80 ? "..." : ""}</small>
            <div class="mt-1">
              <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${fecha}</small>
              <small class="text-muted ms-3"><i class="bi bi-hash me-1"></i>${t.id.substring(0,8)}...</small>
            </div>
          </div>
          <div class="text-end">
            <span class="badge badge-${t.prioridad} me-1">
              <i class="bi bi-cpu me-1"></i>${t.prioridad.toUpperCase()}
            </span>
            <span class="badge badge-${t.estado}">
              ${estadoIcono(t.estado)} ${t.estado.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>
        ${t.comentario ? `<div class="mt-2 p-2 bg-light rounded"><small><strong>Comentario:</strong> ${t.comentario}</small></div>` : ""}
        <div class="mt-2">
          <button class="btn btn-outline-secondary btn-sm" onclick="copiarID('${t.id}')">
            <i class="bi bi-clipboard me-1"></i>Copiar ID
          </button>
        </div>
      </div>
    </div>`;
}

function estadoIcono(estado) {
  const iconos = { pendiente: "⏳", en_proceso: "🔄", aprobado: "✅", rechazado: "❌" };
  return iconos[estado] || "•";
}

function copiarID(id) {
  navigator.clipboard.writeText(id);
  mostrarToast("ID copiado al portapapeles.");
}

/* ── Nuevo Trámite ───────────────────────────────────── */

async function estimarPrioridad() {
  const tipo    = document.getElementById("tipo-tramite").value;
  const urgencia = document.getElementById("urgencia").value;
  const docs    = document.getElementById("docs-completos").checked;

  if (!tipo) {
    mostrarAlertaTramite("Selecciona un tipo de trámite primero.", "warning");
    return;
  }

  try {
    const resp = await apiPredecirPrioridad(tipo, urgencia, docs);
    const prioridad = resp.prioridad_predicha;
    const preview = document.getElementById("preview-prioridad");
    const etiqueta = document.getElementById("etiqueta-prioridad");

    etiqueta.textContent = prioridad.toUpperCase();
    etiqueta.className = `ms-2 badge fs-6 badge-${prioridad}`;
    preview.style.display = "block";
  } catch (err) {
    mostrarAlertaTramite("Error al estimar: " + err.message, "danger");
  }
}

async function registrarTramite() {
  const tipo        = document.getElementById("tipo-tramite").value;
  const urgencia    = document.getElementById("urgencia").value;
  const descripcion = document.getElementById("descripcion").value.trim();
  const docs        = document.getElementById("docs-completos").checked;

  if (!tipo || !descripcion) {
    mostrarAlertaTramite("Completa todos los campos.", "danger");
    return;
  }

  try {
    const resp = await apiRegistrarTramite({
      tipo_tramite: tipo,
      descripcion,
      ciudadano_id: sesion.id,
      urgencia_declarada: urgencia,
      documentos_completos: docs,
    });

    mostrarAlertaTramite(`✅ Trámite creado. ID: ${resp.id}`, "success");
    document.getElementById("tipo-tramite").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("preview-prioridad").style.display = "none";

    setTimeout(() => { mostrarSeccion("mis-tramites"); cargarMisTramites(); }, 1500);
    cargarNotificaciones();
  } catch (err) {
    mostrarAlertaTramite("Error: " + err.message, "danger");
  }
}

function mostrarAlertaTramite(html, tipo) {
  const el = document.getElementById("alerta-tramite");
  el.innerHTML = html;
  el.className = `alert alert-${tipo}`;
  el.classList.remove("d-none");
  setTimeout(() => el.classList.add("d-none"), 5000);
}

/* ── Consultar Estado ────────────────────────────────── */

async function consultarTramite() {
  const id = document.getElementById("tramite-id-consulta").value.trim();
  if (!id) return;

  const contenedor = document.getElementById("resultado-consulta");
  contenedor.innerHTML = `<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>`;

  try {
    const t = await apiObtenerTramite(id);
    const progreso = { pendiente: 25, en_proceso: 60, aprobado: 100, rechazado: 100 };
    const colorBarra = t.estado === "rechazado" ? "bg-danger" : "bg-success";

    contenedor.innerHTML = `
      <div class="estado-card bg-white border shadow-sm fade-in-up">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h6 class="fw-bold mb-0 text-capitalize">${t.tipo_tramite}</h6>
            <small class="text-muted">ID: ${t.id}</small>
          </div>
          <span class="badge badge-${t.prioridad} fs-6">
            <i class="bi bi-cpu me-1"></i>${t.prioridad.toUpperCase()}
          </span>
        </div>
        <p class="mb-2 text-muted">${t.descripcion}</p>
        <div class="progress mb-3"><div class="progress-bar ${colorBarra}" style="width:${progreso[t.estado] || 0}%"></div></div>
        <div class="d-flex gap-3 flex-wrap">
          <span><strong>Estado:</strong> <span class="badge badge-${t.estado}">${estadoIcono(t.estado)} ${t.estado.replace("_"," ").toUpperCase()}</span></span>
        </div>
      </div>`;
  } catch (err) {
    contenedor.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
}

/* ── Notificaciones ──────────────────────────────────── */

async function cargarNotificaciones() {
  try {
    const notifs = await apiNotificaciones(sesion.id);
    const noLeidas = notifs.filter(n => !n.leida);
    const badge = document.getElementById("badge-notif");
    badge.textContent = noLeidas.length;
    noLeidas.length > 0 ? badge.classList.remove("d-none") : badge.classList.add("d-none");

    const lista = document.getElementById("lista-notificaciones");
    if (notifs.length === 0) lista.innerHTML = `<p class="text-center text-muted py-3 mb-0">Sin notificaciones</p>`;
    else lista.innerHTML = notifs.sort((a,b)=>b.fecha>a.fecha?1:-1).map(n => `
      <div class="notif-item ${!n.leida ? "no-leida" : ""}" id="notif-${n.id}">
        <div class="d-flex justify-content-between">
          <span>${iconoNotif(n.tipo)} ${n.mensaje}</span>
          ${!n.leida ? `<button class="btn btn-link btn-sm p-0 ms-2" onclick="leerNotif('${n.id}')"><i class="bi bi-check2"></i></button>` : ""}
        </div>
      </div>`).join("");
  } catch (err) { console.error(err); }
}

function iconoNotif(tipo) {
  const iconos = { info: "ℹ️", alerta: "⚠️", exito: "✅", error: "❌" };
  return iconos[tipo] || "🔔";
}

function toggleNotificaciones() {
  const panel = document.getElementById("panel-notificaciones");
  panel.classList.toggle("d-none");
  if (!panel.classList.contains("d-none")) cargarNotificaciones();
}

async function leerNotif(id) {
  try { await apiMarcarLeida(id); cargarNotificaciones(); } catch (err) { console.error(err); }
}

/* ── Utilidades ──────────────────────────────────────── */

function mostrarToast(msg) {
  const t = document.createElement("div");
  t.className = "position-fixed bottom-0 end-0 m-3 alert alert-dark fade-in-up";
  t.style.zIndex = 9999; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
}

function cerrarSesion() {
  localStorage.removeItem("sesion");
  window.location.href = "/";
}