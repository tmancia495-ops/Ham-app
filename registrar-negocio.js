const VERSION_TERMINOS_NEGOCIO = documentosLegales.negocios.version;
const formularioNegocio = document.querySelector('.formulario-negocio');
const datosNegocio = document.querySelector('#datos-registro-negocio');
const controlesNegocio = formularioNegocio.elements;
const pantallaNegocio = document.querySelector('.solicitud-negocio');
const pantallaTerminosNegocio = document.querySelector('.condiciones-negocio');
const enlaceTerminosNegocio = document.querySelector('.enlace-terminos-negocio');
const botonRegistrarNegocio = document.querySelector('#solicitar-registro');
const mensajeRegistroNegocio = document.querySelector('#error-registro-negocio');
const confirmacionNegocio = document.querySelector('.confirmacion-repartidor');
const camposRegistroNegocio = ['nombre', 'encargado', 'correo', 'telefono', 'ubicacion', 'categoria', 'horario'];
let cuentaRegistroNegocio;

for (const [campo, opciones] of [['ubicacion', UBICACIONES_PEA], ['categoria', CATEGORIAS_REGISTRO_NEGOCIO]]) {
  for (const [id, nombre] of Object.entries(opciones)) controlesNegocio[campo].add(new Option(nombre, id));
}



function mostrarSolicitudNegocio(solicitud) {
  const { establecimiento, contacto, terminos } = solicitud;
  for (const [campo, opcion] of [['ubicacion', establecimiento.ubicacion], ['categoria', establecimiento.categoria]]) {
    const selector = controlesNegocio[campo];
    if (![...selector.options].some(({ value }) => value === opcion.id)) selector.add(new Option(opcion.nombre, opcion.id));
    selector.value = opcion.id;
    selector.selectedOptions[0].textContent = opcion.nombre;
  }
  controlesNegocio.nombre.value = establecimiento.nombre;
  controlesNegocio.horario.value = establecimiento.horario.general;
  for (const campo of ['encargado', 'correo', 'telefono']) controlesNegocio[campo].value = contacto[campo];
  for (const modalidad of controlesNegocio.modalidades) modalidad.checked = establecimiento.modalidades.includes(modalidad.value);
  controlesNegocio.aceptacion.checked = terminos.aceptados;
  datosNegocio.disabled = true;
  botonRegistrarNegocio.hidden = true;
  const aviso = document.querySelector('#estado-negocio');
  aviso.textContent = establecimiento.nombre + ' · Pendiente de revisión. Registro local de demostración.';
  aviso.hidden = false;
}

function navegarCambiarVistaNegocio() {
  transicionVistaHam(location.hash, !location.hash, cambiarVistaNegocio);
}

function cambiarVistaNegocio() {
  const leyendo = location.hash === '#condiciones';
  const vuelve = !pantallaTerminosNegocio.hidden && !leyendo;
  pantallaNegocio.hidden = leyendo;
  pantallaTerminosNegocio.hidden = !leyendo;
  document.body.classList.toggle('viendo-condiciones', leyendo);
  document.title = (leyendo ? 'Condiciones para negocios' : 'Registrar mi negocio') + ' · Ham!';
  if (leyendo) pantallaTerminosNegocio.querySelector('h1').focus({ preventScroll: true });
  else if (vuelve) enlaceTerminosNegocio.focus({ preventScroll: true });
}

enlaceTerminosNegocio.addEventListener('click', (evento) => {
  if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();
  history.pushState({ terminosDesdeRegistro: true }, '', '#condiciones');
  navegarCambiarVistaNegocio();
});

document.querySelector('#volver-condiciones').addEventListener('click', (evento) => {
  evento.preventDefault();
  if (history.state?.terminosDesdeRegistro) history.back();
  else {
    history.replaceState(null, '', location.pathname + location.search);
    navegarCambiarVistaNegocio();
  }
});

window.addEventListener('hashchange', () => { if (cuentaRegistroNegocio) navegarCambiarVistaNegocio(); });
function prepararFormularioRol() {
  const activa = perfilCuentaActiva();
  if (!activa) { location.replace(rutaAccesoPerfil()); return; }
  if (cuentaRegistroNegocio && activa.id !== cuentaRegistroNegocio) { location.reload(); return; }
  const rol = rolCuentaHam(activa.id);
  if (rol === 'merchant_pending') { location.replace('./estado-solicitud.html'); return; }
  if (!['customer', 'merchant'].includes(rol)) {
    location.replace('./inicio.html#perfil');
    return;
  }
  cuentaRegistroNegocio = activa.id;
  try {
    const solicitud = solicitudNegocioVigenteHam(activa.id);
    if (solicitud) mostrarSolicitudNegocio(solicitud);
  } catch {
    mensajeRegistroNegocio.textContent = 'No se pudo recuperar la solicitud guardada.';
  }
  cambiarVistaNegocio();
}
prepararFormularioRol();
window.addEventListener('pageshow', (evento) => {
  if (evento.persisted) prepararFormularioRol();
});

function obtenerDatosRegistroNegocio() {
  const datos = Object.fromEntries(camposRegistroNegocio.map((campo) => [campo, controlesNegocio[campo].value.trim()]));
  datos.telefono = datos.telefono.replace(/[\s-]/g, '');
  datos.modalidades = [...controlesNegocio.modalidades].filter((control) => control.checked).map(({ value }) => value);
  datos.aceptacion = controlesNegocio.aceptacion.checked;
  return datos;
}

function validarRegistroNegocio(datos) {
  const correoValido = Boolean(datos.correo) && controlesNegocio.correo.validity.valid;
  const errores = {
    nombre: datos.nombre ? '' : 'Escribe el nombre del negocio.',
    encargado: datos.encargado ? '' : 'Escribe el nombre del encargado.',
    correo: correoValido ? '' : 'Escribe un correo electrónico válido.',
    telefono: /^\d{8}$/.test(datos.telefono) ? '' : 'Escribe un número salvadoreño de ocho dígitos.',
    ubicacion: Object.hasOwn(UBICACIONES_PEA, datos.ubicacion) ? '' : 'Selecciona una ubicación en la PEA.',
    categoria: Object.hasOwn(CATEGORIAS_REGISTRO_NEGOCIO, datos.categoria) ? '' : 'Selecciona una categoría de comida.',
    horario: /^([01]\d|2[0-3]):[0-5]\d$/.test(datos.horario) ? '' : 'Selecciona una hora de atención.',
    modalidades: datos.modalidades.length ? '' : 'Selecciona al menos una modalidad.',
    aceptacion: datos.aceptacion ? '' : 'Acepta los términos para continuar.'
  };
  for (const [campo, mensaje] of Object.entries(errores)) {
    document.querySelector('#error-negocio-' + campo).textContent = mensaje;
    const control = controlesNegocio[campo];
    for (const elemento of campo === 'modalidades' ? control : [control]) {
      elemento.setAttribute('aria-invalid', String(Boolean(mensaje)));
    }
  }
  const primero = Object.keys(errores).find((campo) => errores[campo]);
  if (primero) (primero === 'modalidades' ? controlesNegocio.modalidades[0] : controlesNegocio[primero]).focus();
  return !primero;
}

function guardarSolicitudNegocio(cuenta, datos) {
  if (perfilCuentaActiva()?.id !== cuenta) throw new Error('Cambió la cuenta activa.');
  if (!['customer', 'merchant'].includes(rolCuentaHam(cuenta))) {
    throw new Error('Esta cuenta no puede registrar un establecimiento.');
  }
  const solicitudes = leerSolicitudesNegocio(cuenta);
  const vigente = solicitudes.find((solicitud) => solicitud.estado !== 'archived');
  if (vigente) return { solicitud: vigente, nueva: false };
  const fecha = new Date().toISOString();
  const solicitud = {
    id: crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16).padStart(8, '0')).join('-'),
    cuentaId: cuenta, tipo: 'negocio', origen: 'prototipo', creadaEn: fecha, estado: 'pending', submittedAt: Date.now(), approvedAt: null, approvalMethod: null,
    establecimiento: {
      nombre: datos.nombre,
      ubicacion: { id: datos.ubicacion, nombre: UBICACIONES_PEA[datos.ubicacion] },
      categoria: { id: datos.categoria, nombre: CATEGORIAS_REGISTRO_NEGOCIO[datos.categoria] },
      horario: { general: datos.horario },
      modalidades: datos.modalidades
    },
    contacto: { encargado: datos.encargado, correo: datos.correo, telefono: datos.telefono },
    terminos: { aceptados: true, version: VERSION_TERMINOS_NEGOCIO, fechaAceptacion: fecha },
    revision: { autorizacionMenores: 'por-verificar-si-corresponde' }
  };
  localStorage.setItem(claveDatosCuenta(CLAVE_SOLICITUDES_NEGOCIO, cuenta), JSON.stringify([...solicitudes, solicitud]));
  return { solicitud, nueva: true };
}

formularioNegocio.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (botonRegistrarNegocio.disabled || botonRegistrarNegocio.hidden) return;
  const datos = obtenerDatosRegistroNegocio();
  if (!validarRegistroNegocio(datos)) return;
  const cuenta = cuentaRegistroNegocio;
  botonRegistrarNegocio.disabled = true;
  mensajeRegistroNegocio.textContent = '';
  try {
    if (!cuenta || perfilCuentaActiva()?.id !== cuenta) { location.reload(); return; }
    const guardar = () => {
      if (perfilCuentaActiva()?.id !== cuenta) throw new Error('La cuenta activa cambió.');
      return guardarSolicitudNegocio(cuenta, datos);
    };
    const { solicitud, nueva } = await conBloqueoRolHam(cuenta, guardar);
    mostrarSolicitudNegocio(solicitud);
    if (nueva || solicitud.estado === 'pending') {
      document.dispatchEvent(new Event(EVENTO_ROL_HAM));
      navegarPantallaHam('./estado-solicitud.html', { reemplazar: true });
    }
  } catch {
    mensajeRegistroNegocio.textContent = 'No se pudo guardar la solicitud. Intenta de nuevo.';
  } finally {
    botonRegistrarNegocio.disabled = false;
  }
});

confirmacionNegocio.addEventListener('click', (evento) => {
  if (evento.target !== confirmacionNegocio) return;
  const { top, bottom, left, right } = confirmacionNegocio.getBoundingClientRect();
  if (evento.clientX < left || evento.clientX > right || evento.clientY < top || evento.clientY > bottom) confirmacionNegocio.close();
});
confirmacionNegocio.addEventListener('close', () => {
  if (confirmacionNegocio.returnValue === 'entendido') navegarPantallaHam('./inicio.html#tienda', { reemplazar: true });
});

window.addEventListener('storage', (evento) => {
  if (!cuentaRegistroNegocio || evento.key !== claveDatosCuenta(CLAVE_SOLICITUDES_NEGOCIO, cuentaRegistroNegocio) || !evento.newValue) return;
  const solicitud = solicitudNegocioVigenteHam(cuentaRegistroNegocio);
  if (solicitud) mostrarSolicitudNegocio(solicitud);
});

window.visualViewport?.addEventListener('resize', () => {
  const activo = document.activeElement;
  const escribiendo = pantallaNegocio.contains(activo) && activo.matches('input:not([type="checkbox"])');
  if (escribiendo) document.body.style.setProperty('--alto-repartidor', window.visualViewport.height + 'px');
  else document.body.style.removeProperty('--alto-repartidor');
});
