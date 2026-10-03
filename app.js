'use strict';

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
  agendaIndice: {},
  pantalla: 'login',
  r: null                   // estado de la pantalla de reserva
};

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TEXTO_ESTADO = {
  OCUPADO: 'Reservado',
  PASADO: 'No disponible',
  ANTICIPACION: 'Menos de 24 h'
};

const $ = (sel, ctx) => (ctx || document).querySelector(sel);
const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
const pad = n => String(n).padStart(2, '0');

function esc(v) {
  return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
 *  - null si la sesión expiró (y vuelve al login).
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
    if (!op.silencioso) aviso('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 'error');
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
    finSesionLocal('Tu sesión expiró por inactividad. Ingresa nuevamente.');
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
function abrirModal(cfg) {
  $('#modal-titulo').textContent = cfg.titulo;
  $('#modal-cuerpo').innerHTML = cfg.cuerpo;
  const btn = $('#modal-confirmar');
  btn.textContent = cfg.confirmar || 'Confirmar';
  btn.className = 'btn ' + (cfg.claseConfirmar || 'btn-exito');
  btn.disabled = false;
  $('#modal-cancelar').textContent = cfg.volver || 'Volver';
  accionModal = cfg.alConfirmar;
  $('#modal').hidden = false;
  btn.focus();
}
function cerrarModal() {
  $('#modal').hidden = true;
  accionModal = null;
}

/* ---------- Marca (logo o nombre del conjunto) ---------- */
function pintarMarca() {
  $$('[data-nombre-conjunto]').forEach(el => { el.textContent = E.nombreConjunto; });
  $$('[data-marca]').forEach(el => {
    if (E.logo === undefined) { el.innerHTML = ''; return; }
    if (E.logo) {
      el.innerHTML = '<img alt="' + esc(E.nombreConjunto || 'Logo') + '">';
      const img = el.querySelector('img');
      img.onerror = () => { el.innerHTML = '<div class="marca-texto">' + esc(E.nombreConjunto) + '</div>'; };
      img.src = E.logo;
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
  $$('.menu-item').forEach(b => b.classList.toggle('actual', b.dataset.pantalla === nombre ||
    (b.dataset.pantalla === 'principal' && nombre === 'reserva')));
  window.scrollTo(0, 0);
}

/** Acciones de cada opción del menú (agregar aquí las pantallas de fases futuras). */
const ACCIONES_MENU = {
  principal: () => irPrincipal(true)
};

function irPrincipal(refrescar) {
  mostrarPantalla('principal');
  if (refrescar) refrescarAgenda();
}

function finSesionLocal(mensaje) {
  E.token = null;
  E.usuario = null;
  clearTimeout(temporizador);
  cerrarModal();
  cerrarMenu();
  $('#shell').hidden = true;
  $('#pantalla-login').hidden = false;
  $('#login-password').value = '';
  mensajeLogin(mensaje || '', 'info');
  E.pantalla = 'login';
}

/* =========================================================================
 *  LOGIN
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
  if (!usuario || !password) { mensajeLogin('Ingresa tu usuario y tu contraseña.'); return; }

  const btn = $('#btn-login');
  btn.disabled = true;
  btn.textContent = 'Verificando…';
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
    mensajeLogin('No hay conexión con el servidor. Inténtalo de nuevo.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
}

/* =========================================================================
 *  PANTALLA PRINCIPAL
 * ========================================================================= */
async function cargarPrincipal() {
  const r = await llamar('getPrincipal', [], { carga: 'Cargando…' });
  if (!r || !r.ok) return;
  E.usuario = r.usuario;
  E.menu = r.menu || [];
  E.grupos = r.grupos || [];
  E.calendario = r.calendario;
  E.timeoutMin = Number(r.timeoutMinutos) || E.timeoutMin;

  $('#nombre-usuario').textContent = E.usuario.nombreMostrar;
  renderMenu();
  renderBotonesGrupo();
  renderAgenda(r.agenda || []);

  $('#pantalla-login').hidden = true;
  $('#shell').hidden = false;
  mostrarPantalla('principal');
}

function renderMenu() {
  $('#menu-lista').innerHTML = E.menu.map(o =>
    '<button class="menu-item" role="menuitem" data-pantalla="' + esc(o.pantalla) + '">' +
      icono(o.icono) + '<span>' + esc(o.etiqueta) + '</span></button>').join('');
}
function abrirMenu() { $('#menu-lista').hidden = false; $('#btn-menu').setAttribute('aria-expanded', 'true'); }
function cerrarMenu() { $('#menu-lista').hidden = true; $('#btn-menu').setAttribute('aria-expanded', 'false'); }

function renderBotonesGrupo() {
  const cont = $('#botones-grupo');
  if (!E.grupos.length) {
    cont.innerHTML = '<p class="vacio">No hay espacios habilitados para reservar.</p>';
    return;
  }
  cont.innerHTML = E.grupos.map(g =>
    '<button class="btn-grande" data-grupo="' + esc(g.tipo) + '">' + icono(g.icono, 'ico-xl') +
      '<span>' + esc(g.etiqueta) + '</span></button>').join('');
}

async function refrescarAgenda() {
  const lista = $('#agenda');
  lista.classList.add('cargando');
  const r = await llamar('getAgenda', [], { carga: null });
  lista.classList.remove('cargando');
  if (r && r.ok) {
    E.calendario = r.calendario || E.calendario;
    renderAgenda(r.agenda || []);
  }
}

function renderAgenda(agenda) {
  E.agendaIndice = {};
  const cont = $('#agenda');
  if (!agenda.length) {
    cont.innerHTML = '<p class="vacio">No existen reservas vigentes</p>';
    return;
  }
  cont.innerHTML = agenda.map(g => {
    g.reservas.forEach(r => { E.agendaIndice[r.idReserva] = r; });
    return '<div class="agenda-grupo">' +
      '<h3 class="agenda-grupo-titulo">' + icono(g.icono) + esc(g.nombreEspacio) + '</h3>' +
      g.reservas.map(tarjetaReserva).join('') +
    '</div>';
  }).join('');
}

function tarjetaReserva(r) {
  const lado = r.mismoDia
    ? '<strong>' + esc(r.horaInicio) + '</strong><span>a ' + esc(r.horaFin) + '</span>'
    : '<strong>' + esc(r.horaInicio) + '</strong><span>hasta ' + esc(r.fechaFin.slice(0, 5)) + ' ' + esc(r.horaFin) + '</span>';

  const horario = r.mismoDia
    ? '<div class="ticket-linea"><b>Fecha:</b> ' + esc(r.fechaInicio) + '</div>' +
      '<div class="ticket-linea"><b>Horario:</b> ' + esc(r.horaInicio) + ' a ' + esc(r.horaFin) + '</div>'
    : '<div class="ticket-linea"><b>Horario:</b> Desde ' + esc(r.fechaInicio) + ' ' + esc(r.horaInicio) +
      ' hasta ' + esc(r.fechaFin) + ' ' + esc(r.horaFin) + '</div>';

  const chips = (r.enCurso ? '<span class="chip">En curso</span>' : '') +
    (r.esPropia ? '<span class="chip azul">Tu reserva</span>' : '');

  return '<article class="ticket' + (r.esPropia ? ' propia' : '') + '">' +
    '<div class="ticket-hora">' + lado + '</div>' +
    '<div class="ticket-cuerpo">' +
      '<div class="ticket-espacio">' + esc(r.nombreEspacio) + chips + '</div>' +
      '<div class="ticket-linea"><b>Reservado por:</b> ' + esc(r.nombreMostrar) + '</div>' +
      horario +
      (r.modalidad ? '<div class="ticket-modalidad">' + esc(r.modalidad) + '</div>' : '') +
      (r.cancelable ? '<button class="btn-cancelar" data-cancelar="' + esc(r.idReserva) + '">Cancelar</button>' : '') +
    '</div>' +
  '</article>';
}

function pedirCancelacion(id) {
  const r = E.agendaIndice[id];
  if (!r) return;
  const cuando = r.mismoDia
    ? esc(r.fechaInicio) + ', ' + esc(r.horaInicio) + ' a ' + esc(r.horaFin)
    : 'Desde ' + esc(r.fechaInicio) + ' ' + esc(r.horaInicio) + ' hasta ' + esc(r.fechaFin) + ' ' + esc(r.horaFin);
  abrirModal({
    titulo: 'Cancelar reserva',
    cuerpo: '<dl class="resumen">' +
      '<div><dt>Espacio</dt><dd>' + esc(r.nombreEspacio) + '</dd></div>' +
      '<div><dt>Horario</dt><dd>' + cuando + '</dd></div>' +
      '</dl><p class="modal-nota">El horario quedará libre para otros residentes.</p>',
    confirmar: 'Cancelar reserva',
    claseConfirmar: 'btn-peligro',
    volver: 'Mantener',
    alConfirmar: async () => {
      const res = await llamar('cancelarReserva', [id], { carga: 'Cancelando…' });
      if (res && res.ok) aviso(res.mensaje || 'Reserva cancelada', 'exito');
      if (res) refrescarAgenda();
    }
  });
}

/* =========================================================================
 *  PANTALLA DE RESERVA (genérica por tipo de espacio)
 * ========================================================================= */
function abrirGrupo(tipo) {
  const g = E.grupos.find(x => x.tipo === tipo);
  if (!g) return;
  const min = E.calendario.fechaMinima;
  E.r = {
    grupo: g,
    espacioId: g.espacios.length === 1 ? g.espacios[0].id : null,
    modalidadId: g.modalidades[0].id,
    fecha: null,
    disp: null,
    cargando: false,
    solicitud: 0,
    vista: { anio: Number(min.slice(0, 4)), mes: Number(min.slice(5, 7)) - 1 }
  };
  $('#reserva-titulo').textContent = g.titulo;
  $('#ayuda-anticipacion').textContent = 'Reserva con al menos ' + E.calendario.anticipacionHoras +
    ' horas de anticipación.';
  renderReserva();
  mostrarPantalla('reserva');
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
}

function espacioActual() {
  return E.r.grupo.espacios.find(e => e.id === E.r.espacioId);
}

function renderEspacios() {
  const g = E.r.grupo;
  const cont = $('#paso-espacio');
  if (g.espacios.length === 1) {
    const e = g.espacios[0];
    cont.innerHTML = '<div class="espacio-unico">' + icono(g.icono) +
      '<span><strong>' + esc(e.nombre) + '</strong>' + (e.descripcion ? ' · ' + esc(e.descripcion) : '') + '</span></div>';
    return;
  }
  cont.innerHTML = '<h3 class="paso-titulo">' + icono(g.icono) + 'Elige el espacio</h3>' +
    '<div class="espacios">' + g.espacios.map(e =>
      '<button class="btn-espacio" data-espacio="' + esc(e.id) + '" aria-pressed="' + (e.id === E.r.espacioId) + '">' +
        icono(g.icono) + '<strong>' + esc(e.nombre) + '</strong>' +
        (e.descripcion ? '<small>' + esc(e.descripcion) + '</small>' : '') +
      '</button>').join('') +
    '</div>';
}

function renderModalidades() {
  const mods = E.r.grupo.modalidades;
  const actual = mods.find(m => m.id === E.r.modalidadId);
  const cont = $('#paso-modalidad');
  if (mods.length === 1) {
    cont.innerHTML = '<h3 class="paso-titulo">' + icono('reloj') + esc(actual.nombre) + '</h3>' +
      '<p class="ayuda">' + esc(actual.descripcion) + '</p>';
    return;
  }
  cont.innerHTML = '<h3 class="paso-titulo">' + icono('reloj') + 'Modalidad</h3>' +
    '<div class="segmentos" role="group" aria-label="Modalidad">' + mods.map(m =>
      '<button class="segmento" data-modalidad="' + esc(m.id) + '" aria-pressed="' + (m.id === E.r.modalidadId) + '">' +
        esc(m.nombre) + '</button>').join('') +
    '</div><p class="segmento-desc">' + esc(actual.descripcion) + '</p>';
}

function renderCalendario() {
  const v = E.r.vista;
  const min = E.calendario.fechaMinima;
  const hoy = E.calendario.hoy;
  const minAnioMes = Number(min.slice(0, 4)) * 12 + Number(min.slice(5, 7)) - 1;
  const puedeRetroceder = v.anio * 12 + v.mes > minAnioMes;

  const primero = new Date(Date.UTC(v.anio, v.mes, 1));
  const diasMes = new Date(Date.UTC(v.anio, v.mes + 1, 0)).getUTCDate();
  const desfase = (primero.getUTCDay() + 6) % 7; // semana inicia en lunes

  let celdas = DIAS_SEMANA.map(d => '<div class="cal-dia-semana" aria-hidden="true">' + d + '</div>').join('');
  for (let i = 0; i < desfase; i++) celdas += '<div></div>';
  for (let d = 1; d <= diasMes; d++) {
    const ymd = v.anio + '-' + pad(v.mes + 1) + '-' + pad(d);
    const deshabilitado = ymd < min;
    const clases = 'cal-dia' + (ymd === hoy ? ' hoy' : '');
    celdas += '<button class="' + clases + '" data-fecha="' + ymd + '"' +
      ' aria-label="' + d + ' de ' + MESES[v.mes] + ' de ' + v.anio + '"' +
      ' aria-pressed="' + (ymd === E.r.fecha) + '"' + (deshabilitado ? ' disabled' : '') + '>' + d + '</button>';
  }

  $('#calendario').innerHTML =
    '<div class="cal-cabecera">' +
      '<button class="cal-nav" data-mes="-1" aria-label="Mes anterior"' + (puedeRetroceder ? '' : ' disabled') + '>' + icono('izquierda') + '</button>' +
      '<span class="cal-mes">' + MESES[v.mes] + ' ' + v.anio + '</span>' +
      '<button class="cal-nav" data-mes="1" aria-label="Mes siguiente">' + icono('derecha') + '</button>' +
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
  renderCalendario();
  $('#paso-horario').hidden = false;
  cargarDisponibilidad();
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

function modalidadDisponible() {
  return E.r.disp ? E.r.disp.modalidades.find(m => m.id === E.r.modalidadId) : null;
}

function renderOpciones() {
  const cont = $('#opciones');
  const titulo = $('#horario-titulo');
  if (!E.r.fecha) { cont.innerHTML = ''; return; }
  if (E.r.cargando) {
    cont.innerHTML = '<div class="cargando-linea"><div class="spinner"></div>Consultando disponibilidad…</div>';
    return;
  }
  const m = modalidadDisponible();
  if (!m) {
    cont.innerHTML = '<p class="vacio">No se pudo cargar la disponibilidad. Elige la fecha otra vez.</p>';
    return;
  }
  titulo.innerHTML = icono('reloj') +
    (m.presentacion === 'BLOQUES' ? 'Bloques del ' : 'Hora de inicio · ') + esc(E.r.disp.fechaTexto);

  const botones = m.opciones.map(o => {
    let principal, secundario;
    if (m.presentacion === 'BLOQUES') {
      principal = o.horaInicio + ' – ' + o.horaFin;
      secundario = o.disponible ? 'Disponible' : TEXTO_ESTADO[o.estado];
    } else {
      principal = o.horaInicio;
      secundario = o.disponible ? 'hasta ' + o.fechaFinCorta + ' ' + o.horaFin : TEXTO_ESTADO[o.estado];
    }
    return '<button class="opcion" data-hora="' + o.hora + '"' + (o.disponible ? '' : ' disabled') +
      ' aria-label="' + esc(principal + ', ' + secundario) + '">' +
      '<strong>' + esc(principal) + '</strong><small>' + esc(secundario) + '</small></button>';
  }).join('');

  const ninguno = !m.opciones.some(o => o.disponible);
  cont.innerHTML = '<div class="grid-opciones' + (m.presentacion === 'HORAS' ? ' horas' : '') + '">' + botones + '</div>' +
    (ninguno ? '<p class="vacio">No hay horarios disponibles en esta fecha. Prueba con otro día.</p>' : '');
}

function abrirResumen(hora) {
  const m = modalidadDisponible();
  const o = m && m.opciones.find(x => x.hora === hora);
  if (!o || !o.disponible) return;
  const esp = espacioActual();
  abrirModal({
    titulo: 'Confirma tu reserva',
    cuerpo: '<dl class="resumen">' +
      '<div><dt>Espacio</dt><dd>' + esc(esp.nombre) + '</dd></div>' +
      '<div><dt>Modalidad</dt><dd>' + esc(m.nombre) + '</dd></div>' +
      '<div><dt>Inicio</dt><dd>' + esc(o.fechaInicio) + ' ' + esc(o.horaInicio) + '</dd></div>' +
      '<div><dt>Fin</dt><dd>' + esc(o.fechaFin) + ' ' + esc(o.horaFin) + '</dd></div>' +
      '<div><dt>Duración</dt><dd>' + m.duracionHoras + ' horas</dd></div>' +
      '</dl>',
    confirmar: 'Confirmar reserva',
    claseConfirmar: 'btn-exito',
    alConfirmar: () => confirmarReserva(hora)
  });
}

async function confirmarReserva(hora) {
  const r = await llamar('crearReserva', [E.r.espacioId, E.r.modalidadId, E.r.fecha, hora],
    { carga: 'Registrando reserva…' });
  if (!r) return;                         // sesión expirada
  if (r.ok) {
    aviso('Reserva confirmada: ' + r.reserva.nombreEspacio + ', ' + r.reserva.inicio, 'exito');
    irPrincipal(true);
  } else {
    cargarDisponibilidad();               // el horario pudo ser tomado por otra persona
  }
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
    renderReserva();
    if (E.r.fecha) cargarDisponibilidad();
  });

  $('#paso-modalidad').addEventListener('click', ev => {
    const b = ev.target.closest('[data-modalidad]');
    if (!b) return;
    E.r.modalidadId = b.dataset.modalidad;
    renderModalidades();
    renderOpciones();
  });

  $('#calendario').addEventListener('click', ev => {
    const nav = ev.target.closest('[data-mes]');
    if (nav && !nav.disabled) { cambiarMes(Number(nav.dataset.mes)); return; }
    const dia = ev.target.closest('[data-fecha]');
    if (dia && !dia.disabled) seleccionarFecha(dia.dataset.fecha);
  });

  $('#opciones').addEventListener('click', ev => {
    const b = ev.target.closest('[data-hora]');
    if (b && !b.disabled) abrirResumen(Number(b.dataset.hora));
  });

  $$('[data-cerrar-modal]').forEach(el => el.addEventListener('click', cerrarModal));
  $('#modal-confirmar').addEventListener('click', async () => {
    const accion = accionModal;
    if (!accion) return;
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
        E.nombreConjunto = r.nombreConjunto;
        document.title = 'Reservas · ' + r.nombreConjunto;
        pintarMarca();
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
