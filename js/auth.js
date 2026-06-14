/**
 * auth.js — Gestión de registro, login y sesión.
 */

// Verifica sesión activa al cargar la página
window.addEventListener("DOMContentLoaded", () => {
  const sesion = obtenerSesion();
  if (sesion) {
    redirigirSegunRol(sesion.rol);
  }
});

// Controla la apertura y cierre de modales
function mostrarModal(tipo) {
  ["modalLogin", "modalRegistro", "modalAdmin"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const instancia = bootstrap.Modal.getInstance(el);
      if (instancia) instancia.hide();
    }
  });

  let modalId = "modalLogin";
  if (tipo === "registro") modalId = "modalRegistro";
  if (tipo === "admin") modalId = "modalAdmin";

  const targetEl = document.getElementById(modalId);
  if (targetEl) {
    new bootstrap.Modal(targetEl).show();
  }
}

// Registra un nuevo ciudadano
async function registrarCiudadano(event) {
  if (event) event.preventDefault();

  const datos = {
    nombre:   document.getElementById("reg-nombre").value.trim(),
    apellido: document.getElementById("reg-apellido").value.trim(),
    dni:      document.getElementById("reg-dni").value.trim(),
    telefono: document.getElementById("reg-telefono").value.trim(),
    email:    document.getElementById("reg-email").value.trim(),
    password: document.getElementById("reg-password").value,
  };

  if (!datos.nombre || !datos.apellido || !datos.dni || !datos.email || !datos.password) {
    mostrarAlerta("registro-alerta", "Completa todos los campos.", "danger");
    return;
  }
  if (datos.dni.length !== 8 || isNaN(datos.dni)) {
    mostrarAlerta("registro-alerta", "El DNI debe tener 8 dígitos.", "danger");
    return;
  }
  if (datos.password.length < 6) {
    mostrarAlerta("registro-alerta", "Contraseña muy corta (mín. 6 caracteres).", "danger");
    return;
  }

  try {
    await apiRegistrar(datos);
    mostrarAlerta("registro-alerta", "¡Cuenta creada! Inicia sesión.", "success");
    ["reg-nombre","reg-apellido","reg-dni","reg-telefono","reg-email","reg-password"]
      .forEach(id => document.getElementById(id).value = "");
  } catch (err) {
    mostrarAlerta("registro-alerta", err.message, "danger");
  }
}

// Inicia sesión de ciudadano
async function iniciarSesion(event) {
  if (event) event.preventDefault();

  const dni      = document.getElementById("login-dni").value.trim();
  const password = document.getElementById("login-password").value;

  if (!dni || !password) {
    mostrarAlerta("login-alerta", "Ingresa DNI y contraseña.", "danger");
    return;
  }

  try {
    const resp = await apiLogin(dni, password);
    guardarSesion(resp.ciudadano);
    redirigirSegunRol(resp.ciudadano.rol);
  } catch (err) {
    mostrarAlerta("login-alerta", err.message, "danger");
  }
}

// Inicia sesión de administrador conectando con el backend
async function loginAdministrador(event) {
  if (event) event.preventDefault();

  const email    = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  if (!email || !password) {
    mostrarAlerta("admin-alerta", "Ingresa correo y contraseña.", "danger");
    return;
  }

  try {
    // CORRECCIÓN: Ahora usa API_BASE que se adapta automáticamente a Local o Render
    const response = await fetch(API_BASE + "/auth/login-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      const adminSesion = {
        id: data.user.email,
        nombre: data.user.nombre,
        email: data.user.email,
        rol: "admin",
        token: data.token
      };
      guardarSesion(adminSesion);
      redirigirSegunRol("admin");
    } else {
      mostrarAlerta("admin-alerta", data.detail || "Credenciales incorrectas.", "danger");
    }
  } catch (err) {
    console.error(err);
    mostrarAlerta("admin-alerta", "Error de conexión con el servidor.", "danger");
  }
}

// Guarda la sesión en localStorage
function guardarSesion(usuario) {
  localStorage.setItem("sesion", JSON.stringify(usuario));
}

// Obtiene la sesión guardada
function obtenerSesion() {
  const raw = localStorage.getItem("sesion");
  return raw ? JSON.parse(raw) : null;
}

// Cierra la sesión activa
function cerrarSesion() {
  localStorage.removeItem("sesion");
  window.location.href = "/index.html";
}

// Redirige al panel correspondiente
function redirigirSegunRol(rol) {
  if (rol === "admin") {
    window.location.href = "/pages/admin.html";
  } else {
    window.location.href = "/pages/ciudadano.html";
  }
}

// Muestra mensajes de alerta en los modales
function mostrarAlerta(elementId, mensaje, tipo) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert-${tipo}`;
  el.textContent = mensaje;
  el.classList.remove("d-none");
  setTimeout(() => el.classList.add("d-none"), 4000);
}