'use strict';

/** Versión de esta página. Debe coincidir con VERSION_API de Codigo.gs. */
const VERSION_APP = '1.6';

/* =========================================================================
 *  ICONOS LINEALES
 * ========================================================================= */
const TRAZOS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  casa: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  salir: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M16 16l4-4-4-4"/><path d="M20 12H10"/>',
  auto: '<path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4a1 1 0 0 1-1 1h-1M5 18H4a1 1 0 0 1-1-1v-4h18"/><circle cx="7.5" cy="17.5" r="1.7"/><circle cx="16.5" cy="17.5" r="1.7"/><path d="M9.2 18h5.6"/>',
  piscina: '<path d="M8 15V5.5a2.5 2.5 0 0 1 5 0"/><path d="M15 15V5.5a2.5 2.5 0 0 1 5 0"/><path d="M8 8.5h7M8 12h7"/><path d="M2 19c1.7 0 1.7-1.2 3.3-1.2s1.7 1.2 3.4 1.2 1.6-1.2 3.3-1.2 1.7 1.2 3.3 1.2 1.7-1.2 3.4-1.2S20.3 19 22 19"/>',
  calendario: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  calendarioVacio: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M9.5 13.5l5 4M14.5 13.5l-5 4"/>',
  reloj: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alerta: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16h.01"/>',
  volver: '<path d="M15 5l-7 7 7 7"/>',
  izquierda: '<path d="M15 5l-7 7 7 7"/>',
  derecha: '<path d="M9 5l7 7-7 7"/>',
  candado: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  ojo: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ojoCerrado: '<path d="M3 3l18 18"/><path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  refrescar: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 20v-4h-4"/>'
};

function svg(nombre) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round">' + (TRAZOS[nombre] || TRAZOS.calendario) + '</svg>';
}
function icono(nombre, clase) {
  return '<span class="ico ' + (clase || '') + '" aria-hidden="true">' + svg(nombre) + '</span>';
}

/* =========================================================================
 *  ESTADO Y UTILIDADES
 * ========================================================================= */
const E = {
  token: null,
  usuario: null,
  timeoutMin: 5,
  nombreConjunto: '',
  logo: undefined,          // undefined = cargando, null = sin logo, string = data URI
  menu: [],
  grupos: [],
  calendario: null,
  agenda: [],
  agendaIndice: {},
  filtro: 'todas',
  pantalla: 'login',
  r: null                   // estado de la pantalla de reserva
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TEXTO_ESTADO = {
  OCUPADO: 'Reservado',
  PASADO: 'Ya pasó',
  ANTICIPACION: 'Menos de 24 h',
  BLOQUEADO: 'No disponible'
};

function textoEstado(estado, m) {
  if (estado === 'ANTICIPACION' && m) return 'Menos de ' + m.anticipacionHoras + ' h';
  return TEXTO_ESTADO[estado] || 'No disponible';
}

const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
const pad = n => String(n).padStart(2, '0');

function esc(v) {
  return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** "dd/MM/yyyy" o "yyyy-MM-dd" → {dia, mes (0-11), anio, semana (0-6)} */
function partesFecha(texto) {
  let d, m, a;
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) { a = +texto.slice(0, 4); m = +texto.slice(5, 7) - 1; d = +texto.slice(8, 10); }
  else { d = +texto.slice(0, 2); m = +texto.slice(3, 5) - 1; a = +texto.slice(6, 10); }
  return { dia: d, mes: m, anio: a, semana: new Date(Date.UTC(a, m, d)).getUTCDay() };
}
/** "sábado 5 de octubre" */
function fechaLarga(texto) {
  const p = partesFecha(texto);
  return DIAS[p.semana] + ' ' + p.dia + ' de ' + MESES[p.mes];
}
/** "sáb 5 oct" */
function fechaCorta(texto) {
  const p = partesFecha(texto);
  return DIAS_CORTOS[p.semana] + ' ' + p.dia + ' ' + MESES_CORTOS[p.mes];
}

/** "Casa 5 - Juan Pérez" → {nombre:"Juan Pérez", casa:5} */
function separarNombre(usuario) {
  const texto = (usuario && usuario.nombreMostrar) || '';
  const partes = texto.split(/\s+-\s+/);
  const nombre = partes.length > 1 ? partes.slice(1).join(' - ') : texto;
  return { nombre: nombre || texto, casa: usuario && usuario.casa };
}

/* ---------- Placa del vehículo ---------- */
/** Misma regla que el servidor: 5 a 8 letras y números, con ambos. Autos: PBA-1234. */
function normalizarPlaca(valor) {
  const t = String(valor || '').toUpperCase().replace(/[\s.\-]/g, '');
  if (!/^[A-Z0-9]{5,8}$/.test(t) || !/[A-Z]/.test(t) || !/[0-9]/.test(t)) return '';
  const auto = t.match(/^([A-Z]{3})([0-9]{3,4})$/);
  return auto ? auto[1] + '-' + auto[2] : t;
}
function clavePlaca() { return 'reservas:placa:' + ((E.usuario && E.usuario.usuario) || ''); }
function ultimaPlaca() {
  try { return localStorage.getItem(clavePlaca()) || ''; } catch (e) { return ''; }
}
function recordarPlaca(placa) {
  try { localStorage.setItem(clavePlaca(), placa); } catch (e) { /* sin almacenamiento local */ }
}

/* ---------- Llamadas al servidor (API de Apps Script) ---------- */
const API_URL = (window.CONFIG_APP && window.CONFIG_APP.API_URL || '').trim();
const API_CONFIGURADA = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(API_URL);

/**
 * Envía {accion, args} a doPost. Se usa text/plain para evitar la consulta
 * previa de CORS, y credentials:'omit' para que el navegador NO envíe las
 * cuentas de Google del usuario (eso es lo que evita el error de varias cuentas).
 */
async function api(nombre) {
  const args = Array.prototype.slice.call(arguments, 1);
  if (!API_CONFIGURADA) throw new Error('API_URL no configurada');
  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ accion: nombre, args: args }),
    credentials: 'omit',
    redirect: 'follow',
    cache: 'no-store'
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  const datos = await resp.json();
  return datos ? datos.resultado : null;
}

/**
 * Llama una función protegida (agrega el token). Devuelve:
 *  - la respuesta si ok,
 *  - { ok:false, ... } si falló (y muestra el aviso),
 *  - null si la sesión expiró (y vuelve al ingreso).
 */
async function llamar(nombre, args, opciones) {
  const op = Object.assign({ carga: 'Procesando…', silencioso: false }, opciones || {});
  if (op.carga) mostrarCarga(op.carga);
  try {
    const r = await api.apply(null, [nombre, E.token].concat(args || []));
    if (r && r.sesionExpirada) { finSesionLocal(r.mensaje); return null; }
    reiniciarTemporizador();
    if (!r || !r.ok) {
      if (!op.silencioso) aviso((r && r.mensaje) || 'No se pudo completar la operación.', 'error');
      return r || { ok: false };
    }
    return r;
  } catch (err) {
    console.error(err);
    if (!op.silencioso) aviso('Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 'error');
    return { ok: false };
  } finally {
    if (op.carga) ocultarCarga();
  }
}

/* ---------- Temporizador de inactividad (espeja la expiración del servidor) ---------- */
let temporizador = null;
function reiniciarTemporizador() {
  clearTimeout(temporizador);
  if (!E.token) return;
  temporizador = setTimeout(() => {
    finSesionLocal('Tu sesión se cerró por inactividad. Ingresa de nuevo.');
  }, E.timeoutMin * 60 * 1000);
}

/* ---------- Carga, avisos, modal ---------- */
let cargasActivas = 0;
function mostrarCarga(texto) {
  cargasActivas++;
  $('#carga-texto').textContent = texto || 'Cargando…';
  $('#carga').hidden = false;
}
function ocultarCarga() {
  cargasActivas = Math.max(0, cargasActivas - 1);
  if (!cargasActivas) $('#carga').hidden = true;
}

function aviso(texto, tipo) {
  const t = tipo || 'info';
  const el = document.createElement('div');
  el.className = 'aviso ' + t;
  el.setAttribute('role', t === 'error' ? 'alert' : 'status');
  el.innerHTML = icono(t === 'exito' ? 'check' : 'alerta') + '<span>' + esc(texto) + '</span>';
  $('#avisos').appendChild(el);
  setTimeout(() => el.remove(), t === 'error' ? 6000 : 4000);
}

let accionModal = null;
let validarModal = null;   // si existe y devuelve false, el modal no se cierra al confirmar
/**
 * cfg: { titulo, cuerpo, confirmar, claseConfirmar, volver, alConfirmar, exito (bool), soloConfirmar (bool) }
 */
function abrirModal(cfg) {
  const caja = $('.modal-caja');
  caja.classList.toggle('centrado', !!cfg.exito);
  $('#modal-icono').hidden = !cfg.exito;
  $('#modal-icono').innerHTML = cfg.exito ? icono('check') : '';
  $('#modal-titulo').textContent = cfg.titulo;
  $('#modal-cuerpo').innerHTML = cfg.cuerpo || '';
  const btn = $('#modal-confirmar');
  btn.textContent = cfg.confirmar || 'Confirmar';
  btn.className = 'btn ' + (cfg.claseConfirmar || 'btn-primario');
  btn.disabled = false;
  $('#modal-cancelar').hidden = !!cfg.soloConfirmar;
  $('#modal-cancelar').textContent = cfg.volver || 'Volver';
  $('#modal-acciones').classList.toggle('una', !!cfg.soloConfirmar);
  accionModal = cfg.alConfirmar || (() => {});
  validarModal = cfg.validar || null;
  $('#modal').hidden = false;
  if (cfg.alAbrir) cfg.alAbrir(btn); else btn.focus();
}
function cerrarModal() {
  $('#modal').hidden = true;
  accionModal = null;
  validarModal = null;
}

/* ---------- Marca (logo o nombre del conjunto) ---------- */
function pintarMarca() {
  $$('[data-nombre-conjunto]').forEach(el => { el.textContent = E.nombreConjunto; });
  $$('[data-marca]').forEach(el => {
    if (E.logo === undefined) { el.innerHTML = ''; return; }
    if (E.logo) {
      el.innerHTML = '<img alt="' + esc(E.nombreConjunto || 'Logo del conjunto') + '">';
      const img = el.querySelector('img');
      img.onerror = () => { el.innerHTML = E.nombreConjunto ? '<div class="marca-texto">' + esc(E.nombreConjunto) + '</div>' : ''; };
      img.src = E.logo;
    } else if (el.classList.contains('marca-login')) {
      el.innerHTML = '<span class="emblema">' + icono('calendario') + '</span>'; // el nombre ya está en el título
    } else {
      el.innerHTML = E.nombreConjunto ? '<div class="marca-texto">' + esc(E.nombreConjunto) + '</div>' : '';
    }
  });
}

/* =========================================================================
 *  NAVEGACIÓN
 * ========================================================================= */
function mostrarPantalla(nombre) {
  E.pantalla = nombre;
  $('#pantalla-principal').hidden = nombre !== 'principal';
  $('#pantalla-reserva').hidden = nombre !== 'reserva';
  const visible = $('#pantalla-' + nombre);
  if (visible) {
    visible.classList.remove('entrando');
    void visible.offsetWidth;            // reinicia la animación
    visible.classList.add('entrando');
  }
  if (nombre !== 'reserva') actualizarBarraSeleccion();
  $$('.menu-item').forEach(b => b.classList.toggle('actual',
    b.dataset.pantalla === nombre || (b.dataset.pantalla === 'principal' && nombre === 'reserva')));
  window.scrollTo(0, 0);
}

/** Acciones de cada opción del menú (agregar aquí las pantallas de fases futuras). */
const ACCIONES_MENU = {
  principal: () => irPrincipal(true)
};

function irPrincipal(refrescar) {
  E.r = null;
  mostrarPantalla('principal');
  if (refrescar) refrescarAgenda();
}

function finSesionLocal(mensaje) {
  E.token = null;
  E.usuario = null;
  E.r = null;
  clearTimeout(temporizador);
  clearInterval(relojIntervalo);
  cerrarModal();
  cerrarMenu();
  actualizarBarraSeleccion();
  $('#shell').hidden = true;
  $('#pantalla-login').hidden = false;
  $('#login-password').value = '';
  mensajeLogin(mensaje || '', 'info');
  E.pantalla = 'login';
}

/* =========================================================================
 *  INGRESO
 * ========================================================================= */
function mensajeLogin(texto, tipo) {
  const el = $('#login-mensaje');
  el.textContent = texto || '';
  el.classList.toggle('info', tipo === 'info');
}

async function enviarLogin(ev) {
  ev.preventDefault();
  const usuario = $('#login-usuario').value.trim();
  const password = $('#login-password').value;
  mensajeLogin('');
  if (!usuario || !password) { mensajeLogin('Escribe tu usuario y tu contraseña.'); return; }

  const btn = $('#btn-login');
  btn.disabled = true;
  btn.textContent = 'Ingresando…';
  try {
    const r = await api('login', usuario, password);
    if (!r || !r.ok) { mensajeLogin((r && r.mensaje) || 'Usuario o contraseña incorrectos'); return; }
    E.token = r.token;
    E.usuario = r.usuario;
    E.timeoutMin = Number(r.timeoutMinutos) || 5;
    $('#login-password').value = '';
    await cargarPrincipal();
  } catch (err) {
    console.error(err);
    mensajeLogin('Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
}

/* =========================================================================
 *  PANTALLA PRINCIPAL
 * ========================================================================= */
async function cargarPrincipal() {
  const r = await llamar('getPrincipal', [], { carga: 'Cargando tu agenda…' });
  if (!r || !r.ok) return;
  E.usuario = r.usuario;
  E.menu = r.menu || [];
  E.grupos = r.grupos || [];
  E.calendario = r.calendario;
  E.timeoutMin = Number(r.timeoutMinutos) || E.timeoutMin;
  E.filtro = 'todas';

  const persona = separarNombre(E.usuario);
  $('#nombre-usuario').textContent = E.usuario.nombreMostrar;
  $('#avatar').textContent = persona.casa ? 'C' + persona.casa : '·';
  $('#saludo').textContent = 'Hola, ' + persona.nombre;
  cargarSubtitulo();

  renderMenu();
  renderAcciones();
  renderFiltros();
  E.agenda = r.agenda || [];
  renderAgenda();
  iniciarReloj();

  $('#pantalla-login').hidden = true;
  $('#shell').hidden = false;
  mostrarPantalla('principal');
}

function cargarSubtitulo() {
  const persona = separarNombre(E.usuario);
  $('#portada-sub').textContent = (persona.casa ? 'Casa ' + persona.casa : '') +
    (E.nombreConjunto ? (persona.casa ? ', ' : '') + E.nombreConjunto : '');
}

function renderMenu() {
  $('#menu-lista').innerHTML = E.menu.map(o =>
    '<button class="menu-item" role="menuitem" data-pantalla="' + esc(o.pantalla) + '">' +
      icono(o.icono) + '<span>' + esc(o.etiqueta) + '</span></button>').join('');
}
function abrirMenu() { $('#menu-lista').hidden = false; $('#btn-menu').setAttribute('aria-expanded', 'true'); }
function cerrarMenu() { $('#menu-lista').hidden = true; $('#btn-menu').setAttribute('aria-expanded', 'false'); }

function listaNatural(nombres) {
  if (nombres.length <= 1) return nombres.join('');
  return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
}

function renderAcciones() {
  const cont = $('#botones-grupo');
  if (!E.grupos.length) {
    cont.innerHTML = '<div class="vacio">' + icono('alerta') +
      '<strong>No hay espacios abiertos para reservar</strong><p>La administración los habilitará pronto.</p></div>';
    return;
  }
  cont.innerHTML = E.grupos.map(g => {
    const detalle = g.espacios.length > 1
      ? listaNatural(g.espacios.map(e => e.nombre))
      : listaNatural(g.modalidades.map(m => m.nombre.toLowerCase())).replace(/^./, c => c.toUpperCase());
    return '<button class="accion" data-grupo="' + esc(g.tipo) + '">' +
      '<span class="accion-icono">' + icono(g.icono) + '</span>' +
      '<span class="accion-texto"><strong>' + esc(g.etiqueta) + '</strong><span>' + esc(detalle) + '</span></span>' +
      '<span class="accion-flecha" aria-hidden="true">' + icono('derecha') + '</span>' +
    '</button>';
  }).join('');
}

function renderFiltros() {
  $$('.filtro').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filtro === E.filtro)));
}

async function refrescarAgenda() {
  const lista = $('#agenda');
  const boton = $('#btn-refrescar');
  lista.classList.add('cargando');
  boton.classList.add('girando');
  const r = await llamar('getAgenda', [], { carga: null });
  lista.classList.remove('cargando');
  boton.classList.remove('girando');
  if (r && r.ok) {
    E.calendario = r.calendario || E.calendario;
    E.agenda = r.agenda || [];
    renderAgenda();
  }
}

/** Clave ordenable "yyyyMMddHHmm" a partir de "dd/MM/yyyy" y "HH:mm". */
function claveFecha(fecha, hora) {
  return fecha.slice(6, 10) + fecha.slice(3, 5) + fecha.slice(0, 2) + hora.replace(':', '');
}

/* ---------- Reloj y estado en vivo de cada espacio ---------- */
const FORMATO_AHORA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});
/** Hora actual en Ecuador: {clave:"yyyyMMddHHmm", fecha:"yyyy-MM-dd", hora:"HH:mm"} */
function ahoraEcuador() {
  const p = {};
  FORMATO_AHORA.formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  return { clave: p.year + p.month + p.day + p.hour + p.minute, fecha: p.year + '-' + p.month + '-' + p.day, hora: p.hour + ':' + p.minute };
}

function renderAhora() {
  if (!E.usuario) return;
  const ahora = ahoraEcuador();
  $('#reloj').textContent = fechaLarga(ahora.fecha).replace(/^./, c => c.toUpperCase()) + ', ' + ahora.hora;

  const hoy = ahora.fecha.replace(/-/g, '');
  const cont = $('#estado-espacios');
  const tarjetas = [];
  E.grupos.forEach(g => g.espacios.forEach(esp => {
    const grupoAgenda = E.agenda.find(a => a.idEspacio === esp.id);
    const reservas = grupoAgenda ? grupoAgenda.reservas : [];
    const actual = reservas.find(r => claveFecha(r.fechaInicio, r.horaInicio) <= ahora.clave && ahora.clave < claveFecha(r.fechaFin, r.horaFin));
    const siguiente = reservas
      .filter(r => claveFecha(r.fechaInicio, r.horaInicio) > ahora.clave && claveFecha(r.fechaInicio, r.horaInicio).slice(0, 8) === hoy)
      .sort((a, b) => claveFecha(a.fechaInicio, a.horaInicio) < claveFecha(b.fechaInicio, b.horaInicio) ? -1 : 1)[0];
    let estado, detalle;
    if (actual) {
      estado = 'ocupado';
      const otroDia = claveFecha(actual.fechaFin, actual.horaFin).slice(0, 8) !== hoy;
      detalle = 'Ocupado hasta ' + (otroDia ? fechaCorta(actual.fechaFin) + ', ' : 'las ') + actual.horaFin;
    } else if (siguiente) {
      estado = 'libre';
      detalle = 'Libre hasta las ' + siguiente.horaInicio;
    } else {
      estado = 'libre';
      detalle = 'Libre el resto del día';
    }
    tarjetas.push('<button class="estado-espacio ' + estado + '" data-ir-grupo="' + esc(g.tipo) + '" data-ir-espacio="' + esc(esp.id) + '">' +
      '<span class="estado-icono">' + icono(g.icono) + '</span>' +
      '<span class="estado-texto"><strong>' + esc(esp.nombre) + '</strong><span>' + esc(detalle) + '</span></span>' +
      '<span class="estado-punto" aria-hidden="true"></span>' +
    '</button>');
  }));
  cont.innerHTML = tarjetas.join('');
}

let relojIntervalo = null;
function iniciarReloj() {
  clearInterval(relojIntervalo);
  renderAhora();
  relojIntervalo = setInterval(() => { if (E.usuario && E.pantalla === 'principal') renderAhora(); }, 30000);
}

/** Muestra en la portada la próxima reserva del usuario conectado. */
function renderProxima() {
  const mias = [];
  E.agenda.forEach(g => g.reservas.forEach(r => { if (r.esPropia) mias.push(r); }));
  mias.sort((a, b) => claveFecha(a.fechaInicio, a.horaInicio) < claveFecha(b.fechaInicio, b.horaInicio) ? -1 : 1);
  const r = mias[0];
  const cont = $('#proxima');
  if (!r) {
    cont.innerHTML = '<span class="ico-redondo">' + icono('calendario') + '</span><span>No tienes reservas próximas</span>';
    return;
  }
  const cuando = r.enCurso ? 'en curso hasta las ' + r.horaFin : fechaCorta(r.fechaInicio) + ', ' + r.horaInicio;
  cont.innerHTML = '<span class="ico-redondo">' + icono('check') + '</span>' +
    '<span>' + (r.enCurso ? 'Ahora' : 'Tu próxima reserva') + ': <strong>' + esc(r.nombreEspacio) + ', ' + esc(cuando) + '</strong>' +
    (mias.length > 1 ? ' (+' + (mias.length - 1) + ')' : '') + '</span>';
}

function renderAgenda() {
  renderProxima();
  renderAhora();
  E.agendaIndice = {};
  const cont = $('#agenda');
  const soloMias = E.filtro === 'mias';
  const grupos = E.agenda
    .map(g => Object.assign({}, g, { reservas: g.reservas.filter(r => !soloMias || r.esPropia) }))
    .filter(g => g.reservas.length);

  if (!grupos.length) {
    cont.innerHTML = '<div class="vacio">' + icono('calendarioVacio') +
      (soloMias
        ? '<strong>No tienes reservas vigentes</strong><p>Usa los botones de arriba para reservar un espacio.</p>'
        : '<strong>No existen reservas vigentes</strong><p>Todos los espacios están libres por ahora.</p>') +
      '</div>';
    return;
  }

  cont.innerHTML = grupos.map(g => {
    g.reservas.forEach(r => { E.agendaIndice[r.idReserva] = r; });
    const n = g.reservas.length;
    return '<section class="grupo">' +
      '<h3 class="grupo-titulo"><span class="grupo-icono">' + icono(g.icono) + '</span>' + esc(g.nombreEspacio) +
        '<span class="grupo-cuenta">' + n + (n === 1 ? ' reserva' : ' reservas') + '</span></h3>' +
      '<div class="grupo-lista">' + g.reservas.map((r, i) => tarjetaReserva(r).replace('<article ', '<article style="--i:' + Math.min(i, 8) + '" ')).join('') + '</div>' +
    '</section>';
  }).join('');
}

function tarjetaReserva(r) {
  const p = partesFecha(r.fechaInicio);
  const talon =
    '<div class="ticket-talon" aria-hidden="true">' +
      '<span class="dia-semana">' + DIAS_CORTOS[p.semana] + '</span>' +
      '<span class="dia-num">' + p.dia + '</span>' +
      '<span class="dia-mes">' + MESES_CORTOS[p.mes] + '</span>' +
    '</div>';

  const hora = esc(r.horaInicio) + ' a ' + esc(r.horaFin) +
    (r.mismoDia ? '' : '<small>día siguiente</small>');

  const detalle = r.mismoDia
    ? '<div class="ticket-linea"><span>Fecha:</span> ' + esc(r.fechaInicio) + '</div>' +
      '<div class="ticket-linea"><span>Horario:</span> ' + esc(r.horaInicio) + ' a ' + esc(r.horaFin) + '</div>'
    : '<div class="ticket-linea"><span>Horario:</span> Desde ' + esc(r.fechaInicio) + ' ' + esc(r.horaInicio) +
      ' hasta ' + esc(r.fechaFin) + ' ' + esc(r.horaFin) + '</div>';

  const etiquetas =
    (r.esPropia ? '<span class="etiqueta mia">' + icono('check') + 'Tu reserva</span>' : '') +
    (r.enCurso ? '<span class="etiqueta curso">En curso</span>' : '') +
    (r.modalidad ? '<span class="etiqueta tipo">' + esc(r.modalidad) + '</span>' : '');

  return '<article class="ticket' + (r.esPropia ? ' propia' : '') + '" aria-label="' +
      esc(r.nombreEspacio + ', ' + fechaLarga(r.fechaInicio) + ', ' + r.horaInicio + ' a ' + r.horaFin) + '">' +
    talon +
    '<div class="ticket-cuerpo">' +
      '<div class="ticket-espacio">' + esc(r.nombreEspacio) + '</div>' +
      '<div class="ticket-hora">' + hora + '</div>' +
      '<div class="ticket-linea"><span>Reservado por:</span> ' + esc(r.nombreMostrar) + '</div>' +
      detalle +
      (r.placa ? '<div class="ticket-linea"><span>Placa:</span> <b class="placa-chip">' + esc(r.placa) + '</b></div>' : '') +
      '<div class="ticket-pie"><div class="ticket-etiquetas">' + etiquetas + '</div>' +
        (r.cancelable ? '<button class="btn-cancelar" data-cancelar="' + esc(r.idReserva) + '">Cancelar</button>' : '') +
      '</div>' +
    '</div>' +
  '</article>';
}

function pedirCancelacion(id) {
  const r = E.agendaIndice[id];
  if (!r) return;
  const horario = r.mismoDia
    ? esc(r.horaInicio) + ' a ' + esc(r.horaFin)
    : esc(r.horaInicio) + ' a ' + esc(r.horaFin) + ' del ' + esc(r.fechaFin);
  abrirModal({
    titulo: '¿Cancelar esta reserva?',
    cuerpo: '<dl class="resumen">' +
      '<div><dt>Espacio</dt><dd>' + esc(r.nombreEspacio) + '</dd></div>' +
      '<div><dt>Fecha</dt><dd>' + esc(fechaLarga(r.fechaInicio)) + '</dd></div>' +
      '<div><dt>Horario</dt><dd>' + horario + '</dd></div>' +
      '</dl><p class="modal-nota">El horario quedará libre para los demás residentes.</p>',
    confirmar: 'Cancelar reserva',
    claseConfirmar: 'btn-peligro',
    volver: 'Mantenerla',
    alConfirmar: async () => {
      const res = await llamar('cancelarReserva', [id], { carga: 'Cancelando…' });
      if (res && res.ok) aviso('Reserva cancelada', 'exito');
      if (res) refrescarAgenda();
    }
  });
}

/* =========================================================================
 *  PANTALLA DE RESERVA (genérica por tipo de espacio)
 * ========================================================================= */
function abrirGrupo(tipo, opciones) {
  const g = E.grupos.find(x => x.tipo === tipo);
  if (!g) return;
  const min = E.calendario.fechaMinima;
  E.r = {
    grupo: g,
    espacioId: g.espacios.length === 1 ? g.espacios[0].id : null,
    modalidadId: g.modalidades[0].id,
    fecha: null,
    hora: null,
    duracion: null,
    disp: null,
    cargando: false,
    solicitud: 0,
    vista: { anio: Number(min.slice(0, 4)), mes: Number(min.slice(5, 7)) - 1 }
  };
  if (opciones && opciones.espacioId) E.r.espacioId = opciones.espacioId;
  const primera = g.modalidades[0];
  const minPrimera = primera.fechaMinima || min;
  if (primera.soloHoy) E.r.fecha = E.calendario.hoy;
  const ref = E.r.fecha || minPrimera;
  E.r.vista = { anio: Number(ref.slice(0, 4)), mes: Number(ref.slice(5, 7)) - 1 };
  $('#reserva-titulo').textContent = g.titulo;
  renderReserva();
  mostrarPantalla('reserva');
  if (E.r.espacioId && E.r.fecha) cargarDisponibilidad();
}

/** Numera solo los pasos que el usuario realmente debe completar. */
function numerosDePasos() {
  const g = E.r.grupo;
  let n = 0;
  return {
    espacio: g.espacios.length > 1 ? ++n : 0,
    modalidad: g.modalidades.length > 1 ? ++n : 0,
    fecha: ++n,
    horario: ++n
  };
}
function marcaPaso(numero, hecho) {
  return '<span class="paso-num' + (hecho ? ' hecho' : '') + '" aria-hidden="true">' +
    (hecho ? icono('check') : numero) + '</span>';
}

function renderReserva() {
  renderEspacios();
  renderModalidades();
  renderCalendario();
  renderOpciones();
  const hayEspacio = !!E.r.espacioId;
  $('#paso-modalidad').hidden = !hayEspacio;
  $('#paso-fecha').hidden = !hayEspacio;
  $('#paso-horario').hidden = !hayEspacio || !E.r.fecha;
  actualizarBarraSeleccion();
}

function espacioActual() {
  return E.r.grupo.espacios.find(e => e.id === E.r.espacioId);
}

function renderEspacios() {
  const g = E.r.grupo;
  const cont = $('#paso-espacio');
  if (g.espacios.length === 1) {
    const e = g.espacios[0];
    cont.innerHTML = '<div class="espacio-unico"><span class="grupo-icono">' + icono(g.icono) + '</span>' +
      '<span><strong>' + esc(e.nombre) + '</strong>' + (e.descripcion ? '<br>' + esc(e.descripcion) : '') + '</span></div>';
    return;
  }
  const n = numerosDePasos();
  cont.innerHTML = '<h3 class="paso-titulo">' + marcaPaso(n.espacio, !!E.r.espacioId) + 'Elige el espacio</h3>' +
    '<div class="espacios">' + g.espacios.map(e =>
      '<button class="opcion-tarjeta" data-espacio="' + esc(e.id) + '" aria-pressed="' + (e.id === E.r.espacioId) + '">' +
        '<span class="marca-check">' + icono('check') + '</span>' +
        icono(g.icono) + '<strong>' + esc(e.nombre) + '</strong>' +
        (e.descripcion ? '<small>' + esc(e.descripcion) + '</small>' : '') +
      '</button>').join('') +
    '</div>';
}

function textoDuraciones(m) {
  const d = m.duraciones || [m.duracionHoras];
  return d.length > 1 ? d[0] + ' a ' + d[d.length - 1] + ' h' : d[0] + ' h';
}

/** Fechas que permite la modalidad elegida (yyyy-MM-dd). */
function rangoFechas() {
  const m = modalidadActual();
  return {
    min: m.fechaMinima || (m.requiereAnticipacion === false ? E.calendario.hoy : E.calendario.fechaMinima),
    max: m.soloHoy ? E.calendario.hoy : null
  };
}

function renderModalidades() {
  const mods = E.r.grupo.modalidades;
  const actual = mods.find(m => m.id === E.r.modalidadId);
  const cont = $('#paso-modalidad');
  if (mods.length === 1) {
    cont.innerHTML = '<p class="ayuda" style="margin:0">' + icono('reloj') + ' ' + esc(actual.descripcion) + '</p>';
    cont.querySelector('.ico').style.cssText = 'width:18px;height:18px;vertical-align:-4px;color:var(--azul)';
    return;
  }
  const n = numerosDePasos();
  cont.innerHTML = '<h3 class="paso-titulo">' + marcaPaso(n.modalidad, !!E.r.fecha) + '¿Por cuánto tiempo?</h3>' +
    '<div class="modalidades" role="group" aria-label="Modalidad">' + mods.map(m =>
      '<button class="opcion-tarjeta modalidad" data-modalidad="' + esc(m.id) + '" aria-pressed="' + (m.id === E.r.modalidadId) + '">' +
        '<span class="duracion">' + textoDuraciones(m) + '</span>' +
        '<strong>' + esc(m.nombre) + '</strong>' +
        '<small>' + (m.soloHoy ? 'Solo hoy' : m.anticipacionHoras ? 'Con ' + m.anticipacionHoras + ' h de anticipación' : 'Desde hoy') + '</small>' +
      '</button>').join('') +
    '</div><p class="modalidad-desc">' + esc(actual.descripcion) + '</p>';
}

function renderCalendario() {
  const n = numerosDePasos();
  $('#fecha-titulo').innerHTML = marcaPaso(n.fecha, !!E.r.fecha) + 'Elige la fecha';

  const m = modalidadActual();
  $('#ayuda-anticipacion').textContent = m.soloHoy
    ? 'Esta modalidad es solo para hoy.'
    : m.anticipacionHoras
      ? 'Se reserva con al menos ' + m.anticipacionHoras + ' horas de anticipación. Los días no disponibles aparecen en gris.'
      : 'Puedes reservar desde hoy mismo. Los días no disponibles aparecen en gris.';

  const v = E.r.vista;
  const rango = rangoFechas();
  const min = rango.min;
  const max = rango.max;
  const hoy = E.calendario.hoy;
  const minAnioMes = Number(min.slice(0, 4)) * 12 + Number(min.slice(5, 7)) - 1;
  const puedeRetroceder = v.anio * 12 + v.mes > minAnioMes;
  const puedeAvanzar = !max || v.anio * 12 + v.mes < Number(max.slice(0, 4)) * 12 + Number(max.slice(5, 7)) - 1;

  const primero = new Date(Date.UTC(v.anio, v.mes, 1));
  const diasMes = new Date(Date.UTC(v.anio, v.mes + 1, 0)).getUTCDate();
  const desfase = (primero.getUTCDay() + 6) % 7; // la semana inicia en lunes

  let celdas = DIAS_SEMANA.map(d => '<div class="cal-dia-semana" aria-hidden="true">' + d + '</div>').join('');
  for (let i = 0; i < desfase; i++) celdas += '<div></div>';
  for (let d = 1; d <= diasMes; d++) {
    const ymd = v.anio + '-' + pad(v.mes + 1) + '-' + pad(d);
    const deshabilitado = ymd < min || (max && ymd > max);
    celdas += '<button class="cal-dia' + (ymd === hoy ? ' hoy' : '') + '" data-fecha="' + ymd + '"' +
      ' aria-label="' + esc(fechaLarga(ymd)) + (ymd === hoy ? ', hoy' : '') + '"' +
      ' aria-pressed="' + (ymd === E.r.fecha) + '"' + (deshabilitado ? ' disabled' : '') + '>' + d + '</button>';
  }

  $('#calendario').innerHTML =
    '<div class="cal-cabecera">' +
      '<button class="cal-nav" data-mes="-1" aria-label="Mes anterior"' + (puedeRetroceder ? '' : ' disabled') + '>' + icono('izquierda') + '</button>' +
      '<span class="cal-mes" aria-live="polite">' + MESES[v.mes] + ' ' + v.anio + '</span>' +
      '<button class="cal-nav" data-mes="1" aria-label="Mes siguiente"' + (puedeAvanzar ? '' : ' disabled') + '>' + icono('derecha') + '</button>' +
    '</div>' +
    '<div class="cal-grid">' + celdas + '</div>';
}

function cambiarMes(delta) {
  const total = E.r.vista.anio * 12 + E.r.vista.mes + delta;
  E.r.vista = { anio: Math.floor(total / 12), mes: total % 12 };
  renderCalendario();
}

function seleccionarFecha(ymd) {
  E.r.fecha = ymd;
  E.r.hora = null;
  E.r.duracion = null;
  renderCalendario();
  renderModalidades();
  $('#paso-horario').hidden = false;
  actualizarBarraSeleccion();
  cargarDisponibilidad();
  if (window.innerWidth < 960) {
    setTimeout(() => $('#paso-horario').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

async function cargarDisponibilidad() {
  if (!E.r || !E.r.espacioId || !E.r.fecha) return;
  const solicitud = ++E.r.solicitud;
  E.r.cargando = true;
  E.r.disp = null;
  renderOpciones();
  const r = await llamar('getDisponibilidad', [E.r.espacioId, E.r.fecha], { carga: null });
  if (!E.r || solicitud !== E.r.solicitud) return; // respuesta obsoleta
  E.r.cargando = false;
  if (r && r.ok) {
    E.r.disp = r;
    if (r.calendario) E.calendario = r.calendario;
  }
  renderOpciones();
}

function modalidadActual() {
  return E.r.grupo.modalidades.find(m => m.id === E.r.modalidadId);
}
function modalidadDisponible() {
  return E.r.disp ? E.r.disp.modalidades.find(m => m.id === E.r.modalidadId) : null;
}
/** Devuelve {o: hora de inicio, d: duración} si la elección está completa. */
function opcionSeleccionada() {
  const m = modalidadDisponible();
  if (!m || E.r.hora === null) return null;
  const o = m.opciones.find(x => x.hora === E.r.hora && x.disponible);
  const d = o && o.duraciones.find(x => x.horas === E.r.duracion && x.disponible);
  return o && d ? { o: o, d: d } : null;
}

function renderOpciones() {
  const cont = $('#opciones');
  const n = numerosDePasos();
  const presentacion = modalidadActual().presentacion;
  $('#horario-titulo').innerHTML = marcaPaso(n.horario, !!opcionSeleccionada()) +
    (presentacion === 'BLOQUES' ? 'Elige el horario' : 'Elige la hora de inicio');
  $('#horario-fecha').textContent = E.r.fecha ? fechaLarga(E.r.fecha).replace(/^./, c => c.toUpperCase()) : '';

  if (!E.r.fecha) { cont.innerHTML = ''; return; }
  if (E.r.cargando) {
    cont.innerHTML = '<div class="horarios esqueleto-horarios" aria-label="Consultando horarios libres">' +
      '<span></span><span></span><span></span><span></span><span></span><span></span></div>';
    return;
  }
  const m = modalidadDisponible();
  if (!m) {
    cont.innerHTML = '<div class="vacio">' + icono('alerta') +
      '<strong>No se pudieron cargar los horarios</strong><p>Toca la fecha otra vez para reintentar.</p></div>';
    return;
  }

  const aviso = m.aviso ? '<div class="aviso-linea">' + icono('alerta') + '<span>' + esc(m.aviso) + '</span></div>' : '';
  if (!m.opciones.length) { cont.innerHTML = aviso; return; }

  const leyenda = '<div class="leyenda"><span><i class="punto libre"></i>Disponible</span>' +
    '<span><i class="punto ocupado"></i>No disponible</span></div>';
  const variasDuraciones = (m.duraciones || []).length > 1;

  const botones = m.opciones.map(o => {
    let principal, secundario;
    if (m.presentacion === 'BLOQUES') {
      principal = o.horaInicio + ' – ' + o.horaFin;
      secundario = o.disponible ? 'Disponible' : textoEstado(o.estado, m);
    } else if (variasDuraciones) {
      principal = o.horaInicio;
      const libres = o.duraciones.filter(d => d.disponible).map(d => d.horas);
      secundario = o.disponible ? 'Hasta ' + Math.max.apply(null, libres) + ' h' : textoEstado(o.estado, m);
    } else {
      principal = o.horaInicio;
      secundario = o.disponible ? 'hasta ' + fechaCorta(o.fechaFin).replace(/^\S+ /, '') + ', ' + o.horaFin : textoEstado(o.estado, m);
    }
    const elegido = o.disponible && o.hora === E.r.hora;
    return '<button class="horario" data-hora="' + o.hora + '"' + (o.disponible ? '' : ' disabled') +
      ' aria-pressed="' + elegido + '" aria-label="' + esc(principal + ', ' + secundario) + '">' +
      '<span class="marca-check">' + icono('check') + '</span>' +
      '<strong>' + esc(principal) + '</strong><small>' + esc(secundario) + '</small></button>';
  }).join('');

  const ninguno = !m.opciones.some(o => o.disponible);
  const elegida = m.opciones.find(o => o.hora === E.r.hora && o.disponible);
  let selectorHoras = '';
  if (variasDuraciones && elegida) {
    selectorHoras = '<div class="duraciones"><h4 class="duraciones-titulo">¿Cuántas horas desde las ' + esc(elegida.horaInicio) + '?</h4>' +
      '<div class="horarios">' + elegida.duraciones.map(d =>
        '<button class="horario" data-duracion="' + d.horas + '"' + (d.disponible ? '' : ' disabled') +
          ' aria-pressed="' + (d.disponible && d.horas === E.r.duracion) + '">' +
          '<span class="marca-check">' + icono('check') + '</span>' +
          '<strong>' + d.horas + (d.horas === 1 ? ' hora' : ' horas') + '</strong>' +
          '<small>' + (d.disponible ? 'hasta las ' + esc(d.horaFin) : esc(textoEstado(d.estado, m))) + '</small></button>').join('') +
      '</div></div>';
  }
  cont.innerHTML = aviso + leyenda +
    '<div class="horarios' + (m.presentacion === 'HORAS' ? ' horas' : '') + '">' + botones + '</div>' +
    selectorHoras +
    (ninguno && !m.aviso ? '<div class="vacio">' + icono('calendarioVacio') +
      '<strong>No quedan horarios libres este día</strong><p>Elige otra fecha en el calendario.</p></div>' : '');
}

function seleccionarHora(hora) {
  E.r.hora = E.r.hora === hora ? null : hora;
  E.r.duracion = null;
  const m = modalidadDisponible();
  const o = m && m.opciones.find(x => x.hora === E.r.hora);
  if (o) {
    const libres = o.duraciones.filter(d => d.disponible);
    if (libres.length) E.r.duracion = libres[0].horas; // se preselecciona la más corta
  }
  renderOpciones();
  actualizarBarraSeleccion();
  const selector = $('.duraciones');
  if (selector && window.innerWidth < 960) selector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function seleccionarDuracion(horas) {
  E.r.duracion = horas;
  renderOpciones();
  actualizarBarraSeleccion();
}

function actualizarBarraSeleccion() {
  const barra = $('#barra-seleccion');
  const sel = E.r && E.pantalla === 'reserva' ? opcionSeleccionada() : null;
  barra.hidden = !sel;
  $('#contenido').classList.toggle('con-barra', !!sel);
  if (!sel) return;
  const o = sel.o;
  const m = modalidadDisponible();
  $('#sel-titulo').textContent = espacioActual().nombre + ', ' + o.horaInicio + ' a ' + sel.d.horaFin;
  $('#sel-detalle').textContent = fechaLarga(o.fechaInicio) + ', ' + m.nombre.toLowerCase();
}

function abrirResumen() {
  const sel = opcionSeleccionada();
  if (!sel) return;
  const o = sel.o;
  const d = sel.d;
  const m = modalidadDisponible();
  const esp = espacioActual();
  const pidePlaca = !!E.r.grupo.requierePlaca;
  abrirModal({
    titulo: pidePlaca ? 'Placa y confirmación' : 'Confirma tu reserva',
    cuerpo: '<dl class="resumen">' +
      '<div><dt>Espacio</dt><dd>' + esc(esp.nombre) + '</dd></div>' +
      '<div><dt>Modalidad</dt><dd>' + esc(m.nombre) + '</dd></div>' +
      '<div><dt>Inicio</dt><dd>' + esc(o.fechaInicio) + ' ' + esc(o.horaInicio) + '</dd></div>' +
      '<div><dt>Fin</dt><dd>' + esc(d.fechaFin) + ' ' + esc(d.horaFin) + '</dd></div>' +
      '<div><dt>Duración</dt><dd>' + d.horas + (d.horas === 1 ? ' hora' : ' horas') + '</dd></div>' +
      '</dl>' + (pidePlaca ? campoPlacaHtml() : '') +
      '<p class="modal-nota">Quedará a nombre de ' + esc(E.usuario.nombreMostrar) + ' y visible en la agenda para todos.</p>',
    confirmar: 'Confirmar reserva',
    claseConfirmar: 'btn-exito',
    alConfirmar: () => confirmarReserva(o.hora, d.horas, pidePlaca ? normalizarPlaca($('#placa').value) : ''),
    validar: pidePlaca ? () => {
      const ok = !!normalizarPlaca($('#placa').value);
      if (!ok) { mostrarErrorPlaca(); $('#placa').focus(); }
      return ok;
    } : null,
    alAbrir: pidePlaca ? btn => prepararCampoPlaca(btn) : null
  });
}

function campoPlacaHtml() {
  return '<div class="campo-placa">' +
    '<label class="campo-label" for="placa">Placa del vehículo <span class="obligatorio">obligatoria</span></label>' +
    '<div class="campo campo-placa-input">' + icono('auto') +
      '<input id="placa" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" ' +
      'maxlength="10" placeholder="Ej. PBA-1234" aria-describedby="placa-ayuda" required>' +
    '</div>' +
    '<p id="placa-ayuda" class="placa-ayuda">Escribe la placa del vehículo que ocupará el parqueadero.</p>' +
  '</div>';
}

function mostrarErrorPlaca() {
  const ayuda = $('#placa-ayuda');
  ayuda.textContent = 'Revisa la placa: usa de 5 a 8 letras y números, por ejemplo PBA-1234.';
  ayuda.className = 'placa-ayuda error';
  $('.campo-placa-input').classList.add('invalido');
}

/** Valida la placa mientras se escribe y habilita el botón solo cuando es válida. */
function prepararCampoPlaca(btn) {
  const input = $('#placa');
  const ayuda = $('#placa-ayuda');
  const caja = $('.campo-placa-input');
  const actualizar = () => {
    input.value = input.value.toUpperCase();
    const placa = normalizarPlaca(input.value);
    btn.disabled = !placa;
    caja.classList.remove('invalido');
    caja.classList.toggle('valido', !!placa);
    ayuda.className = 'placa-ayuda' + (placa ? ' ok' : '');
    ayuda.textContent = placa
      ? 'Se guardará como ' + placa + '.'
      : 'Escribe la placa del vehículo que ocupará el parqueadero.';
  };
  input.value = ultimaPlaca();
  input.addEventListener('input', actualizar);
  input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); btn.click(); } });
  actualizar();
  setTimeout(() => { input.focus(); input.select(); }, 60);
}

async function confirmarReserva(hora, duracion, placa) {
  if (placa) recordarPlaca(placa);
  const r = await llamar('crearReserva', [E.r.espacioId, E.r.modalidadId, E.r.fecha, hora, duracion, placa],
    { carga: 'Guardando tu reserva…' });
  if (!r) return;                         // sesión expirada
  if (r.ok) {
    const res = r.reserva;
    abrirModal({
      exito: true,
      titulo: 'Reserva confirmada',
      cuerpo: '<dl class="resumen">' +
        '<div><dt>Espacio</dt><dd>' + esc(res.nombreEspacio) + '</dd></div>' +
        '<div><dt>Inicio</dt><dd>' + esc(res.inicio) + '</dd></div>' +
        '<div><dt>Fin</dt><dd>' + esc(res.fin) + '</dd></div>' +
        (res.placa ? '<div><dt>Placa</dt><dd>' + esc(res.placa) + '</dd></div>' : '') +
        '</dl><p class="modal-nota">Si ya no la necesitas, puedes cancelarla desde la agenda.</p>',
      confirmar: 'Ver la agenda',
      claseConfirmar: 'btn-primario',
      soloConfirmar: true,
      alConfirmar: () => irPrincipal(true)
    });
  } else {
    E.r.hora = null;
    E.r.duracion = null;
    actualizarBarraSeleccion();
    cargarDisponibilidad();               // el horario pudo ser tomado por otra persona
  }
}

function cambiarModalidad(id) {
  E.r.modalidadId = id;
  E.r.hora = null;
  E.r.duracion = null;
  const m = modalidadActual();
  const rango = rangoFechas();
  const anterior = E.r.fecha;
  if (m.soloHoy) {
    E.r.fecha = E.calendario.hoy;                 // la única fecha posible
  } else if (E.r.fecha && E.r.fecha < rango.min) {
    E.r.fecha = null;
    E.r.disp = null;
  }
  const ref = E.r.fecha || rango.min;
  E.r.vista = { anio: Number(ref.slice(0, 4)), mes: Number(ref.slice(5, 7)) - 1 };
  renderReserva();
  if (E.r.fecha && E.r.fecha !== anterior) cargarDisponibilidad();
}

/* =========================================================================
 *  EVENTOS
 * ========================================================================= */
function enlazarEventos() {
  $('#form-login').addEventListener('submit', enviarLogin);

  $('#btn-ver-pass').addEventListener('click', () => {
    const input = $('#login-password');
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    $('#btn-ver-pass').innerHTML = icono(visible ? 'ojo' : 'ojoCerrado');
    $('#btn-ver-pass').setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
  });

  $('#btn-menu').addEventListener('click', ev => {
    ev.stopPropagation();
    if ($('#menu-lista').hidden) abrirMenu(); else cerrarMenu();
  });
  $('#menu-lista').addEventListener('click', ev => {
    const item = ev.target.closest('[data-pantalla]');
    if (!item) return;
    cerrarMenu();
    const accion = ACCIONES_MENU[item.dataset.pantalla];
    if (accion) accion();
  });
  document.addEventListener('click', ev => {
    if (!ev.target.closest('.barra-menu')) cerrarMenu();
  });

  $('#btn-cerrar').addEventListener('click', () => {
    const token = E.token;
    finSesionLocal('');
    if (token) api('logout', token).catch(() => {});
  });

  $('#btn-refrescar').addEventListener('click', refrescarAgenda);

  $$('.filtro').forEach(b => b.addEventListener('click', () => {
    E.filtro = b.dataset.filtro;
    renderFiltros();
    renderAgenda();
  }));

  $('#estado-espacios').addEventListener('click', ev => {
    const b = ev.target.closest('[data-ir-grupo]');
    if (b) abrirGrupo(b.dataset.irGrupo, { espacioId: b.dataset.irEspacio });
  });

  $('#botones-grupo').addEventListener('click', ev => {
    const b = ev.target.closest('[data-grupo]');
    if (b) abrirGrupo(b.dataset.grupo);
  });

  $('#agenda').addEventListener('click', ev => {
    const b = ev.target.closest('[data-cancelar]');
    if (b) pedirCancelacion(b.dataset.cancelar);
  });

  $('#btn-volver').addEventListener('click', () => irPrincipal(true));

  $('#paso-espacio').addEventListener('click', ev => {
    const b = ev.target.closest('[data-espacio]');
    if (!b || b.dataset.espacio === E.r.espacioId) return;
    E.r.espacioId = b.dataset.espacio;
    E.r.hora = null;
    E.r.duracion = null;
    renderReserva();
    if (E.r.fecha) cargarDisponibilidad();
  });

  $('#paso-modalidad').addEventListener('click', ev => {
    const b = ev.target.closest('[data-modalidad]');
    if (!b) return;
    cambiarModalidad(b.dataset.modalidad);
  });

  $('#calendario').addEventListener('click', ev => {
    const nav = ev.target.closest('[data-mes]');
    if (nav && !nav.disabled) { cambiarMes(Number(nav.dataset.mes)); return; }
    const dia = ev.target.closest('[data-fecha]');
    if (dia && !dia.disabled) seleccionarFecha(dia.dataset.fecha);
  });

  $('#opciones').addEventListener('click', ev => {
    const dur = ev.target.closest('[data-duracion]');
    if (dur) { if (!dur.disabled) seleccionarDuracion(Number(dur.dataset.duracion)); return; }
    const b = ev.target.closest('[data-hora]');
    if (b && !b.disabled) seleccionarHora(Number(b.dataset.hora));
  });

  $('#btn-revisar').addEventListener('click', abrirResumen);

  $$('[data-cerrar-modal]').forEach(el => el.addEventListener('click', cerrarModal));
  $('#modal-confirmar').addEventListener('click', async () => {
    const accion = accionModal;
    if (!accion) return;
    if (validarModal && !validarModal()) return;
    $('#modal-confirmar').disabled = true;
    cerrarModal();
    await accion();
  });

  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { cerrarModal(); cerrarMenu(); }
  });
}

/* =========================================================================
 *  INICIO
 * ========================================================================= */
/** Muestra la versión y avisa si el servidor (Apps Script) quedó con una versión anterior. */
function mostrarVersion(versionServidor) {
  const el = $('#version');
  if (versionServidor === VERSION_APP) {
    el.textContent = 'Versión ' + VERSION_APP;
    el.classList.remove('alerta');
  } else {
    el.textContent = 'Aviso para la administración: la página es la versión ' + VERSION_APP +
      ' pero el servidor tiene la ' + (versionServidor || 'anterior') +
      '. Publica la nueva versión en Apps Script (Gestionar implementaciones → Nueva versión).';
    el.classList.add('alerta');
  }
}

function iniciar() {
  $$('[data-ico]').forEach(el => { el.innerHTML = svg(el.dataset.ico); el.setAttribute('aria-hidden', 'true'); });
  enlazarEventos();
  pintarMarca();

  if (!API_CONFIGURADA) {
    mensajeLogin('Falta configurar la dirección del servidor en config.js.');
    $('#btn-login').disabled = true;
    E.logo = null;
    pintarMarca();
    return;
  }

  api('getConfigPublica')
    .then(r => {
      if (r && r.ok) {
        mostrarVersion(r.version);
        E.nombreConjunto = r.nombreConjunto;
        document.title = 'Reservas · ' + r.nombreConjunto;
        pintarMarca();
        if (E.usuario) cargarSubtitulo();
      }
    })
    .catch(() => {});

  api('getLogo')
    .then(uri => { E.logo = uri || null; pintarMarca(); })
    .catch(() => { E.logo = null; pintarMarca(); });

  $('#login-usuario').focus();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
