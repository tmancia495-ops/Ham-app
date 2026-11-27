const formularioRepartidor = document.querySelector('#solicitud-repartidor');
const datosSolicitud = document.querySelector('#datos-solicitud');
const confirmacionRepartidor = document.querySelector('.confirmacion-repartidor');
const enviarSolicitud = document.querySelector('#enviar-solicitud');
const controlesSolicitud = formularioRepartidor.elements;
const pantallaSolicitud = document.querySelector('.solicitud-repartidor');
const pantallaCondiciones = document.querySelector('.condiciones-repartidor');
let cuentaSolicitud;

for (const [id, nombre] of Object.entries(TRANSPORTES_REPARTIDOR)) {
  controlesSolicitud.transporte.add(new Option(nombre, id));
}

function mostrarSolicitudGuardada(solicitud) {
  if (![...controlesSolicitud.transporte.options].some(({ value }) => value === solicitud.transporte)) {
    controlesSolicitud.transporte.add(new Option(solicitud.nombreTransporte || solicitud.transporte, solicitud.transporte));
  }
  for (const campo of ['nombre', 'correo', 'telefono', 'transporte', 'disponibilidad']) {
    controlesSolicitud[campo].value = solicitud[campo];
  }
  pantallaSolicitud.querySelector('h1').textContent = 'Estado de mi solicitud';
  const estado = document.querySelector('#estado-solicitud strong');
  estado.textContent = { courier_active: 'Solicitud aprobada.', courier_rejected: 'Solicitud rechazada.' }[rolCuentaHam(solicitud.cuentaId)] || 'Solicitud en revisión.';
  datosSolicitud.disabled = true;
  enviarSolicitud.hidden = true;
  document.querySelector('#estado-solicitud').hidden = false;
}

function navegarCambiarVistaRepartidor() {
  transicionVistaHam(location.hash, !location.hash, cambiarVistaRepartidor);
}

function cambiarVistaRepartidor() {
  const condiciones = location.hash === '#condiciones';
  const vuelve = !pantallaCondiciones.hidden && !condiciones;
  pantallaSolicitud.hidden = condiciones;
  pantallaCondiciones.hidden = !condiciones;
  document.body.classList.toggle('viendo-condiciones', condiciones);
  document.title = condiciones ? 'Condiciones para repartidores · Ham!' : 'Quiero ser repartidor · Ham!';
  if (condiciones) pantallaCondiciones.querySelector('h1').focus({ preventScroll: true });
  else if (vuelve) document.querySelector('#abrir-condiciones').focus({ preventScroll: true });
}

document.querySelector('#abrir-condiciones').addEventListener('click', (evento) => {
  if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();
  history.pushState({ condicionesDesdeSolicitud: true }, '', '#condiciones');
  navegarCambiarVistaRepartidor();
});

document.querySelector('#volver-condiciones').addEventListener('click', (evento) => {
  evento.preventDefault();
  if (history.state?.condicionesDesdeSolicitud) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    navegarCambiarVistaRepartidor();
  }
});

window.addEventListener('hashchange', () => { if (cuentaSolicitud) navegarCambiarVistaRepartidor(); });
function prepararFormularioRol() {
  const activa = perfilCuentaActiva();
  if (!activa) { location.replace(rutaAccesoPerfil()); return; }
  if (cuentaSolicitud && cuentaSolicitud !== activa.id) { location.reload(); return; }
  if (!cuentaSolicitud) {
    controlesSolicitud.nombre.value = activa.perfil.nombre || '';
    controlesSolicitud.correo.value = activa.perfil.correo || (activa.id.includes('@') ? activa.id : '');
    controlesSolicitud.telefono.value = activa.perfil.contacto || '';
  }
  if (!['customer', 'courier_pending', 'courier_active', 'courier_rejected'].includes(rolCuentaHam(activa.id))) {
    location.replace('./inicio.html#perfil');
    return;
  }
  cuentaSolicitud = activa.id;
  try {
    const solicitud = recuperarSolicitud(activa.id);
    if (solicitud && rolCuentaHam(activa.id) !== 'courier_rejected') {
      location.replace('./estado-solicitud.html');
      return;
    }
    if (solicitud) mostrarSolicitudGuardada(solicitud);
  } catch {
    document.querySelector('#error-solicitud').textContent = 'No se pudo recuperar la solicitud guardada.';
  }
  cambiarVistaRepartidor();
}
prepararFormularioRol();
window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) prepararFormularioRol();
});

function validarSolicitudRepartidor(datos) {
  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo) && controlesSolicitud.correo.validity.valid;
  let errorCorreo = '';
  if (!correoValido) {
    errorCorreo = 'Escribe un correo electrónico válido.';
  } else if (!datos.correo.toLowerCase().endsWith('@uca.edu.sv')) {
    errorCorreo = 'Para registrarte como repartidor necesitas un correo institucional @uca.edu.sv.';
  }
  const errores = {
    nombre: datos.nombre ? '' : 'Escribe tu nombre completo.',
    correo: errorCorreo,
    telefono: /^\d{8}$/.test(datos.telefono) ? '' : 'Escribe un número de teléfono de 8 dígitos.',
    transporte: Object.hasOwn(TRANSPORTES_REPARTIDOR, datos.transporte) ? '' : 'Elige un medio de transporte.',
    disponibilidad: datos.disponibilidad ? '' : 'Selecciona una disponibilidad.'
  };
  for (const [campo, mensaje] of Object.entries(errores)) {
    document.querySelector('#error-' + campo).textContent = mensaje;
    const control = controlesSolicitud[campo];
    if (campo === 'disponibilidad') {
      for (const radio of control) radio.setAttribute('aria-invalid', String(Boolean(mensaje)));
    } else control.setAttribute('aria-invalid', String(Boolean(mensaje)));
  }
  const primero = Object.keys(errores).find((campo) => errores[campo]);
  if (primero) (primero === 'disponibilidad' ? controlesSolicitud.disponibilidad[0] : controlesSolicitud[primero]).focus();
  return !primero;
}

function registrarSolicitudRepartidor(cuenta, datos) {
  if (perfilCuentaActiva()?.id !== cuenta) throw new Error('Cambió la cuenta activa.');
  const rol = rolCuentaHam(cuenta);
  if (!['customer', 'courier_pending', 'courier_active', 'courier_rejected'].includes(rol)) throw new Error('Esta cuenta no puede solicitar el rol de repartidor.');
  const anterior = recuperarSolicitud(cuenta);
  if (anterior) return { solicitud: anterior, nueva: false };
  const solicitud = {
    id: crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16)).join('-'),
    cuentaId: cuenta, creadaEn: new Date().toISOString(), estado: 'pending', submittedAt: Date.now(), approvedAt: null, approvalMethod: null,
    tipo: 'repartidor', origen: 'prototipo', nombreTransporte: TRANSPORTES_REPARTIDOR[datos.transporte], ...datos
  };
  const historial = leerSolicitudesRepartidor(cuenta);
  localStorage.setItem(claveDatosCuenta(CLAVE_SOLICITUD_REPARTIDOR, cuenta), JSON.stringify([...historial, solicitud]));
  return { solicitud, nueva: true };
}

formularioRepartidor.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (enviarSolicitud.disabled || enviarSolicitud.hidden) return;
  const datos = {
    nombre: controlesSolicitud.nombre.value.trim(),
    correo: controlesSolicitud.correo.value.trim(),
    telefono: controlesSolicitud.telefono.value.replace(/[\s-]/g, ''),
    transporte: controlesSolicitud.transporte.value,
    disponibilidad: controlesSolicitud.disponibilidad.value
  };
  if (!validarSolicitudRepartidor(datos)) return;
  enviarSolicitud.disabled = true;
  try {
    if (!cuentaSolicitud || perfilCuentaActiva()?.id !== cuentaSolicitud) { location.reload(); return; }
    const guardar = () => registrarSolicitudRepartidor(cuentaSolicitud, datos);
    const { solicitud } = await conBloqueoRolHam(cuentaSolicitud, guardar);
    mostrarSolicitudGuardada(solicitud);
    document.dispatchEvent(new Event(EVENTO_ROL_HAM));
    navegarPantallaHam('./estado-solicitud.html', { reemplazar: true });
  } catch {
    document.querySelector('#error-solicitud').textContent = 'No se pudo guardar la solicitud. Intenta de nuevo.';
  } finally {
    enviarSolicitud.disabled = false;
  }
});

confirmacionRepartidor.addEventListener('click', (evento) => {
  if (evento.target !== confirmacionRepartidor) return;
  const { top, bottom, left, right } = confirmacionRepartidor.getBoundingClientRect();
  if (evento.clientX < left || evento.clientX > right || evento.clientY < top || evento.clientY > bottom) confirmacionRepartidor.close();
});
confirmacionRepartidor.addEventListener('close', () => {
  if (confirmacionRepartidor.returnValue === 'entendido') location.replace('./perfil-usuario.html');
});

window.addEventListener('storage', (evento) => {
  if (!cuentaSolicitud || evento.key !== claveDatosCuenta(CLAVE_SOLICITUD_REPARTIDOR, cuentaSolicitud) || !evento.newValue) return;
  mostrarSolicitudGuardada(recuperarSolicitud(cuentaSolicitud));
});

window.visualViewport?.addEventListener('resize', () => {
  const activa = document.activeElement;
  const escribiendo = pantallaSolicitud.contains(activa) && activa.matches('input:not([type="radio"])');
  if (escribiendo) document.body.style.setProperty('--alto-repartidor', window.visualViewport.height + 'px');
  else document.body.style.removeProperty('--alto-repartidor');
});
