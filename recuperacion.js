const vistasRecuperacion = [...document.querySelectorAll('[data-paso-recuperacion]')];
const accesoRecuperacion = document.querySelector('#acceso-ham');
const correoRecuperacion = document.querySelector('#correo-recuperacion');
const enviarRecuperacion = document.querySelector('#form-recuperar');
const verificarRecuperacion = document.querySelector('#form-verificar');
const restablecerRecuperacion = document.querySelector('#form-restablecer');
const casillasRecuperacion = [...document.querySelectorAll('.casillas-otp input')];
const botonReenvio = document.querySelector('#reenviar-recuperacion');
const claveNuevaRecuperacion = document.querySelector('#clave-nueva');
const confirmarNuevaRecuperacion = document.querySelector('#confirmar-clave-nueva');
const ordenRecuperacion = ['', 'recuperar', 'verificar', 'restablecer'];
let vistaRecuperacionActual = '';
let relojReenvio;
let confirmacionRecuperacion = '';

function pasoSolicitadoRecuperacion() {
  const paso = location.hash.slice(1);
  return ordenRecuperacion.includes(paso) ? paso : '';
}

function limpiarClavesRecuperacion() {
  restablecerRecuperacion.reset();
  for (const boton of restablecerRecuperacion.querySelectorAll('[data-mostrar-clave]')) {
    document.getElementById(boton.getAttribute('aria-controls')).type = 'password';
    boton.setAttribute('aria-pressed', 'false');
    boton.textContent = 'Mostrar';
  }
  for (const error of restablecerRecuperacion.querySelectorAll('.error-recuperacion')) error.textContent = '';
}

function limpiarCodigoRecuperacion() {
  casillasRecuperacion.forEach((casilla) => { casilla.value = ''; });
  document.querySelector('#error-verificar').textContent = '';
}

function limpiarRecuperacion() {
  solicitudDemo = undefined;
  limpiarClavesRecuperacion();
  limpiarCodigoRecuperacion();
  enviarRecuperacion.reset();
  document.querySelector('#error-recuperar').textContent = '';
}

function actualizarReenvio() {
  const segundos = Math.max(0, Math.ceil(((solicitudDemo?.reenviarEn ?? 0) - Date.now()) / 1000));
  botonReenvio.disabled = segundos > 0;
  botonReenvio.textContent = segundos ? 'Reenviar código (' + segundos + ' s)' : 'Reenviar código';
}

function pintarRecuperacion(paso) {
  if (vistaRecuperacionActual === 'restablecer' && paso !== 'restablecer') limpiarClavesRecuperacion();
  if (!paso) limpiarRecuperacion();
  accesoRecuperacion.hidden = Boolean(paso);
  for (const vista of vistasRecuperacion) vista.hidden = vista.dataset.pasoRecuperacion !== paso;
  clearInterval(relojReenvio);
  if (paso === 'verificar') {
    document.querySelector('#codigo-demo-visible').textContent = solicitudDemo.codigo
      ? 'DEMO · Código: ' + solicitudDemo.codigo + '. No se envió correo.'
      : 'Código verificado para la cuenta de prueba.';
    actualizarReenvio();
    relojReenvio = setInterval(actualizarReenvio, 1000);
  }
  vistaRecuperacionActual = paso;
  const activa = document.querySelector('main:not([hidden])');
  if (paso) activa.querySelector('h1').focus({ preventScroll: true });
  else {
    if (confirmacionRecuperacion) document.querySelector('#estado-acceso').textContent = confirmacionRecuperacion;
    confirmacionRecuperacion = '';
    document.querySelector('#recuperar').focus({ preventScroll: true });
  }
}

function sincronizarRecuperacion(animar = true) {
  let paso = pasoSolicitadoRecuperacion();
  const permitido = paso === 'restablecer' && !autorizacionDemoValida()
    ? solicitudDemo ? 'verificar' : 'recuperar'
    : paso === 'verificar' && !solicitudDemo ? 'recuperar' : paso;
  if (paso !== permitido) {
    paso = permitido;
    history.replaceState(null, '', '#' + paso);
  }
  if (paso === vistaRecuperacionActual) {
    if (transicionInternaHam && claveVistaHam !== 'recuperacion:' + paso) {
      transicionInternaHam.skipTransition();
      transicionInternaHam = undefined;
    }
    return;
  }
  // La autorización se pierde al salir, incluso si Atrás se pulsa de nuevo antes del siguiente render.
  if (!paso) limpiarRecuperacion();
  if (!animar) pintarRecuperacion(paso);
  else transicionVistaHam('recuperacion:' + paso,
    ordenRecuperacion.indexOf(paso) < ordenRecuperacion.indexOf(vistaRecuperacionActual), () => pintarRecuperacion(paso));
}

function irPasoRecuperacion(paso, sustituir = false) {
  const ruta = location.pathname + location.search + (paso ? '#' + paso : '');
  history[sustituir ? 'replaceState' : 'pushState']({ desdeRecuperacion: Boolean(paso) }, '', ruta);
  sincronizarRecuperacion();
}

document.querySelector('#recuperar').addEventListener('click', () => irPasoRecuperacion('recuperar'));
for (const control of document.querySelectorAll('[data-volver-recuperacion]')) {
  control.addEventListener('click', () => {
    const anterior = ordenRecuperacion[ordenRecuperacion.indexOf(vistaRecuperacionActual) - 1];
    if (history.state?.desdeRecuperacion) history.back();
    else irPasoRecuperacion(anterior, true);
  });
}
for (const enlace of document.querySelectorAll('.salir-recuperacion')) {
  enlace.addEventListener('click', (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    irPasoRecuperacion('', true);
  });
}

function mostrarErrorRecuperacion(id, mensaje, campo) {
  document.getElementById(id).textContent = mensaje;
  if (mensaje) campo?.focus();
}

enviarRecuperacion.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  correoRecuperacion.value = correoRecuperacion.value.trim();
  const valor = correoRecuperacion.value;
  if (!valor || !correoRecuperacion.validity.valid) {
    mostrarErrorRecuperacion('error-recuperar', valor ? 'Escribe un correo válido.' : 'Escribe tu correo electrónico.', correoRecuperacion);
    return;
  }
  const boton = evento.submitter || enviarRecuperacion.querySelector('button[type="submit"]');
  if (boton.disabled) return;
  boton.disabled = true;
  boton.textContent = 'Procesando…';
  mostrarErrorRecuperacion('error-recuperar', '');
  try {
    await new Promise(requestAnimationFrame);
    if (pasoSolicitadoRecuperacion() !== 'recuperar') return;
    if (!solicitudDemo || correoCuenta(valor) !== solicitudDemo.correo ||
        (!autorizacionDemoValida() && Date.now() >= solicitudDemo.reenviarEn)) iniciarSolicitudDemo(valor);
    limpiarCodigoRecuperacion();
    irPasoRecuperacion('verificar');
  } catch (error) {
    mostrarErrorRecuperacion('error-recuperar', error.message, correoRecuperacion);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Enviar código';
  }
});

function distribuirCodigoRecuperacion(texto, indice) {
  const digitos = texto.replace(/\D/g, '').slice(0, 6);
  if (!digitos) return;
  const inicio = digitos.length === 6 ? 0 : indice;
  const disponibles = [...digitos].slice(0, 6 - inicio);
  disponibles.forEach((digito, i) => { casillasRecuperacion[inicio + i].value = digito; });
  casillasRecuperacion[Math.min(5, inicio + disponibles.length)].focus();
  mostrarErrorRecuperacion('error-verificar', '');
}

for (const [indice, casilla] of casillasRecuperacion.entries()) {
  casilla.addEventListener('focus', () => casilla.select());
  casilla.addEventListener('input', () => {
    const valor = casilla.value;
    casilla.value = '';
    distribuirCodigoRecuperacion(valor, indice);
  });
  casilla.addEventListener('paste', (evento) => {
    evento.preventDefault();
    distribuirCodigoRecuperacion(evento.clipboardData.getData('text'), indice);
  });
  casilla.addEventListener('keydown', (evento) => {
    const destino = evento.key === 'ArrowLeft' ? indice - 1 : evento.key === 'ArrowRight' ? indice + 1
      : evento.key === 'Backspace' && !casilla.value ? indice - 1 : indice;
    if (destino !== indice && casillasRecuperacion[destino]) {
      evento.preventDefault();
      if (evento.key === 'Backspace') casillasRecuperacion[destino].value = '';
      casillasRecuperacion[destino].focus();
    }
  });
}

botonReenvio.addEventListener('click', () => {
  try {
    iniciarSolicitudDemo(solicitudDemo.correo);
    limpiarCodigoRecuperacion();
    document.querySelector('#codigo-demo-visible').textContent = 'Nuevo código DEMO: ' + solicitudDemo.codigo + '. No se envió correo.';
    actualizarReenvio();
  } catch (error) {
    mostrarErrorRecuperacion('error-verificar', error.message);
  }
});

verificarRecuperacion.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (pasoSolicitadoRecuperacion() !== 'verificar') return;
  if (autorizacionDemoValida()) { irPasoRecuperacion('restablecer'); return; }
  const codigo = casillasRecuperacion.map((casilla) => casilla.value).join('');
  const incompleta = casillasRecuperacion.find((casilla) => !casilla.value);
  if (incompleta) { mostrarErrorRecuperacion('error-verificar', 'Introduce los seis dígitos.', incompleta); return; }
  try {
    verificarCodigoDemo(codigo);
    limpiarCodigoRecuperacion();
    irPasoRecuperacion('restablecer');
  } catch (error) {
    mostrarErrorRecuperacion('error-verificar', error.message, casillasRecuperacion[0]);
  }
});

for (const boton of restablecerRecuperacion.querySelectorAll('[data-mostrar-clave]')) {
  boton.addEventListener('click', () => {
    const campo = document.getElementById(boton.getAttribute('aria-controls'));
    const ver = campo.type === 'password';
    campo.type = ver ? 'text' : 'password';
    boton.textContent = ver ? 'Ocultar' : 'Mostrar';
    boton.setAttribute('aria-pressed', String(ver));
  });
}

restablecerRecuperacion.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (pasoSolicitadoRecuperacion() !== 'restablecer') return;
  if (!autorizacionDemoValida()) {
    irPasoRecuperacion('verificar', true);
    mostrarErrorRecuperacion('error-verificar', 'La autorización expiró. Solicita otro código.');
    return;
  }
  const clave = claveNuevaRecuperacion.value;
  const errorClave = !clave ? 'Escribe la nueva contraseña.' : [...clave].length < 8 ? 'Usa al menos 8 caracteres.' : '';
  const errorConfirmacion = confirmarNuevaRecuperacion.value !== clave || !confirmarNuevaRecuperacion.value
    ? 'Las contraseñas deben coincidir.' : '';
  mostrarErrorRecuperacion('error-clave-nueva', errorClave);
  mostrarErrorRecuperacion('error-confirmar-clave-nueva', errorConfirmacion);
  if (errorClave || errorConfirmacion) { (errorClave ? claveNuevaRecuperacion : confirmarNuevaRecuperacion).focus(); return; }
  const boton = restablecerRecuperacion.querySelector('button[type="submit"]');
  if (boton.disabled) return;
  boton.disabled = true;
  boton.textContent = 'Guardando…';
  try {
    finalizarRecuperacionDemo();
    limpiarRecuperacion();
    confirmacionRecuperacion = 'Demostración completada. La contraseña de tu cuenta no cambió.';
    irPasoRecuperacion('', true);
  } catch (error) {
    mostrarErrorRecuperacion('error-restablecer', error.message);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Restablecer contraseña';
  }
});

window.addEventListener('hashchange', sincronizarRecuperacion);
window.addEventListener('pagehide', () => { clearInterval(relojReenvio); limpiarRecuperacion(); });
window.addEventListener('pageshow', () => sincronizarRecuperacion(false));
sincronizarRecuperacion(false);
