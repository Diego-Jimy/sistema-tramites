/**
 * admin.js — Gestión de reportes, trámites y estados del administrador.
 */

let todosLosTramites = [];
let tramiteSeleccionadoId = null;

window.addEventListener("DOMContentLoaded", () => {
  // Verificar sesión y rol
  const raw = localStorage.getItem("sesion");
  if (!raw) { window.location.href = "/"; return; }
  const sesion = JSON.parse(raw);
  
  if (sesion.rol !== "admin") {
    window.location.href = "/pages/ciudadano.html";
    return;
  }

  cargarReportes();
});

/* ── Navegación ──────────────────────────────────────── */

function mostrarSeccionAdmin(nombre) {
  ["reportes", "todos-tramites", "gestionar"].forEach(s => {
    document.getElementById(`seccion-admin-${s}`).classList.add("d-none");
  });
  document.getElementById(`seccion-admin-${nombre}`).classList.remove("d-none");

  document.querySelectorAll(".list-group-item").forEach(el => el.classList.remove("active"));
  event.target.classList.add("active");

  if (nombre === "todos-tramites") cargarTodosLosTramites();
  if (nombre === "reportes") cargarReportes();
}

/* ── Reportes ────────────────────────────────────────── */

async function cargarReportes() {
  try {
    const r = await apiReportes();

    document.getElementById("stat-total").textContent      = r.total_tramites;
    document.getElementById("stat-ciudadanos").textContent = r.total_ciudadanos;
    document.getElementById("stat-pendientes").textContent = r.por_estado?.pendiente || 0;
    document.getElementById("stat-alta").textContent       = r.por_prioridad?.alta || 0;

    renderTablaDistribucion("tabla-por-estado", r.por_estado, coloresEstado);
    renderTablaDistribucion("tabla-por-prioridad", r.por_prioridad, coloresPrioridad);
    renderTablaDistribucion("tabla-por-tipo", r.por_tipo, () => "bg-info");
  } catch (err) {
    console.error("Error al cargar reportes:", err);
  }
}

function renderTablaDistribucion(elementId, datos, colorFn) {
  const el = document.getElementById(elementId);
  if (!datos || Object.keys(datos).length === 0) {
    el.innerHTML = `<p class="text-muted text-center py-3">Sin datos</p>`;
    return;
  }

  const total = Object.values(datos).reduce((a, b) => a + b, 0);
  el.innerHTML = Object.entries(datos).map(([clave, valor]) => {
    const pct = Math.round((valor / total) * 100);
    const color = colorFn(clave);
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span class="text-capitalize fw-semibold">${clave.replace("_"," ")}</span>
          <span class="badge bg-secondary">${valor}</span>
        </div>
        <div class="progress" style="height:10px">
          <div class="progress-bar ${color}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join("");
}

function coloresEstado(e) { return { pendiente: "bg-secondary", en_proceso: "bg-info", aprobado: "bg-success", rechazado: "bg-danger" }[e] || "bg-primary"; }
function coloresPrioridad(p) { return { alta: "bg-danger", media: "bg-warning", baja: "bg-success" }[p] || "bg-primary"; }

/* ── Todos los Trámites ──────────────────────────────── */

async function cargarTodosLosTramites() {
  const contenedor = document.getElementById("tabla-admin-tramites");
  contenedor.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>`;

  try {
    todosLosTramites = await apiListarTramites();
    renderTablaAdmin(todosLosTramites);
  } catch (err) {
    contenedor.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

function filtrarTramites() {
  const estado = document.getElementById("filtro-estado").value;
  const prioridad = document.getElementById("filtro-prioridad").value;

  let filtrados = todosLosTramites;
  if (estado) filtrados = filtrados.filter(t => t.estado === estado);
  if (prioridad) filtrados = filtrados.filter(t => t.prioridad === prioridad);

  renderTablaAdmin(filtrados);
}

function renderTablaAdmin(tramites) {
  const contenedor = document.getElementById("tabla-admin-tramites");

  if (tramites.length === 0) {
    contenedor.innerHTML = `<div class="text-center py-5 text-muted">No hay trámites con esos filtros.</div>`;
    return;
  }

  contenedor.innerHTML = `
    <div class="table-responsive">
      <table class="table tabla-admin table-hover align-middle">
        <thead class="table-dark">
          <tr>
            <th>ID</th><th>Tipo</th><th class="col-ocultar-movil">Ciudadano ID</th>
            <th>Prioridad</th><th>Estado</th><th class="col-ocultar-movil">Fecha</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${tramites.map(t => `
            <tr>
              <td><small>${t.id.substring(0,8)}...</small></td>
              <td class="text-capitalize">${t.tipo_tramite}</td>
              <td class="col-ocultar-movil"><small>${t.ciudadano_id.substring(0,8)}...</small></td>
              <td><span class="badge badge-${t.prioridad}">${t.prioridad.toUpperCase()}</span></td>
              <td><span class="badge badge-${t.estado}">${t.estado.replace("_"," ").toUpperCase()}</span></td>
              <td class="col-ocultar-movil"><small>${t.fecha_registro ? t.fecha_registro.substring(0,10) : "-"}</small></td>
              <td>
                <button class="btn btn-outline-primary btn-sm me-1" onclick="verDetalleTramite('${t.id}')"><i class="bi bi-eye"></i></button>
                <button class="btn btn-outline-warning btn-sm" onclick="irAGestionarDesde('${t.id}')"><i class="bi bi-pencil"></i></button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}

/* ── Detalle de Trámite ──────────────────────────────── */

async function verDetalleTramite(id) {
  tramiteSeleccionadoId = id;
  try {
    const t = await apiObtenerTramite(id);
    document.getElementById("modal-body-detalle").innerHTML = `
      <div class="row g-3">
        <div class="col-md-6"><strong>Tipo:</strong> ${t.tipo_tramite}</div>
        <div class="col-md-6"><strong>Prioridad:</strong> ${t.prioridad.toUpperCase()}</div>
        <div class="col-12"><strong>Descripción:</strong><p class="text-muted">${t.descripcion}</p></div>
        ${t.comentario ? `<div class="col-12 alert alert-warning"><strong>Comentario:</strong> ${t.comentario}</div>` : ""}
      </div>`;
    new bootstrap.Modal(document.getElementById("modalDetalleTramite")).show();
  } catch (err) { alert("Error: " + err.message); }
}

function irAGestionarDesde(id) {
  mostrarSeccionAdmin("gestionar");
  document.getElementById("admin-tramite-id").value = id;
  buscarTramiteAdmin();
}

/* ── Gestionar Estado ────────────────────────────────── */

async function buscarTramiteAdmin() {
  const id = document.getElementById("admin-tramite-id").value.trim();
  if (!id) return;
  try {
    const t = await apiObtenerTramite(id);
    document.getElementById("info-tramite-admin").innerHTML = `Tramite: ${t.tipo_tramite} | Estado: ${t.estado}`;
    document.getElementById("nuevo-estado").value = t.estado;
    document.getElementById("detalle-tramite-admin").classList.remove("d-none");
  } catch (err) { mostrarAlertaAdmin(err.message, "danger"); }
}

async function actualizarEstadoAdmin() {
  const id = document.getElementById("admin-tramite-id").value.trim();
  const estado = document.getElementById("nuevo-estado").value;
  const comentario = document.getElementById("comentario-admin").value.trim();
  try {
    await apiActualizarEstado(id, estado, comentario);
    mostrarAlertaAdmin("✅ Trámite actualizado.", "success");
    document.getElementById("detalle-tramite-admin").classList.add("d-none");
  } catch (err) { mostrarAlertaAdmin(err.message, "danger"); }
}

function mostrarAlertaAdmin(msg, tipo) {
  const el = document.getElementById("alerta-admin");
  el.textContent = msg; el.className = `alert alert-${tipo}`; el.classList.remove("d-none");
  setTimeout(() => el.classList.add("d-none"), 5000);
}

/* ── Sesión ──────────────────────────────────────────── */

function cerrarSesionAdmin() {
  localStorage.removeItem("sesion");
  // Redirección absoluta a la raíz
  window.location.href = "/";
}