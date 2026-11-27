const mainPerfil = document.querySelector('.perfil-usuario');
const navPerfil = document.querySelector('[data-barra-ham]');
const volverPerfil = document.querySelector('#volver-perfil');
const dialogoSalida = document.querySelector('#confirmar-salida-perfil');
const dialogoSeccion = document.querySelector('#aviso-seccion-perfil');

const secciones = [
  ['MI CUENTA', [
    ['Información personal', 'personal', './completar-perfil.html?editar=1'],
    ['Favoritos', 'favoritos', './favoritos.html', '340:610'],
    ['Notificaciones', 'notificaciones', './notificaciones.html', '340:661'],
    ['Códigos de descuento', 'cupon', './codigos-descuento.html', '390:452']
  ]],
  ['FORMA PARTE DE HAM!', [
    ['Quiero ser repartidor', 'repartidor', './repartidor.html', '399:286'],
    ['Registrar mi negocio', 'negocio', './registrar-negocio.html', '401:217'],
    ['Mi tienda', 'negocio', './inicio.html#tienda'],
    ['Ver estado de mi solicitud', 'repartidor', './estado-solicitud.html']
  ]],
  ['INFORMACIÓN', [
    ['Información de Ham!', 'informacion', './informacion-legal.html', '401:253'],
    ['Ayuda', 'ayuda', './centro-ayuda.html', '401:295']
  ]]
];

function filaPerfil(titulo, icono, ruta, abrir) {
  const control = document.createElement(ruta ? 'a' : 'button');
  control.className = 'fila-perfil';
  if (ruta) control.href = ruta;
  else {
    control.type = 'button';
    control.setAttribute('aria-haspopup', 'dialog');
    control.addEventListener('click', abrir);
  }
  const imagen = document.createElement('img');
  imagen.src = icono === 'salir' ? './assets/cuenta-salir.svg' : './assets/icons/profile/' + icono + '.svg';
  imagen.alt = '';
  const texto = document.createElement('span');
  texto.textContent = titulo;
  const flecha = document.createElement('img');
  flecha.src = './assets/cuenta-' + (icono === 'salir' ? 'flecha-salir' : 'flecha') + '.svg';
  flecha.alt = '';
  control.append(imagen, texto, flecha);
  return control;
}

const contenedorSecciones = document.querySelector('#secciones-perfil');
for (const [titulo, opciones] of secciones) {
  const seccion = document.createElement('section');
  seccion.className = 'grupo-perfil';
  const nombre = document.createElement('h2');
  nombre.textContent = titulo;
  const lista = document.createElement('ul');
  for (const [etiqueta, icono, ruta, nodo] of opciones) {
    const fila = document.createElement('li');
    const control = filaPerfil(etiqueta, icono, ruta, () => {
      document.querySelector('#titulo-aviso-perfil').textContent = etiqueta;
      document.querySelector('#texto-aviso-perfil').textContent = 'Esta sección está pendiente de desarrollo.';
      dialogoSeccion.showModal();
    });
    if (nodo) control.dataset.figmaDestino = nodo;
    fila.append(control);
    lista.append(fila);
  }
  seccion.append(nombre, lista);
  contenedorSecciones.append(seccion);
}

function actualizarOpcionesPerfilHam() {
  const { rol, motivo, tipo, solicitud } = estadoRolesHam();
  const grupo = contenedorSecciones.querySelectorAll('.grupo-perfil')[1];
  const [repartidor, registrarNegocio, tienda, seguimiento] = grupo.querySelectorAll('li');
  const pendiente = rol.endsWith('_pending');
  seguimiento.hidden = !pendiente && rol !== 'courier_active';
  const enlaceSeguimiento = seguimiento.querySelector('a');
  enlaceSeguimiento.href = rol === 'courier_active' && solicitud.confirmacionVista ? '#perfil' : './estado-solicitud.html';
  enlaceSeguimiento.querySelector('span').textContent = pendiente ? 'Ver estado de mi solicitud' : 'Mi perfil de repartidor';
  enlaceSeguimiento.querySelector('img').src = './assets/icons/profile/' + (tipo === 'merchant' ? 'negocio' : 'repartidor') + '.svg';
  const descripcion = seguimiento.querySelector('small') || document.createElement('small');
  descripcion.hidden = !pendiente;
  descripcion.textContent = (tipo === 'merchant' ? 'Negocio' : 'Repartidor') + ' · En revisión';
  if (!descripcion.parentNode) seguimiento.append(descripcion);
  tienda.querySelector('a').href = solicitud?.estado === 'approved' && !solicitud.confirmacionVista
    ? './estado-solicitud.html' : './inicio.html#tienda';
  const aviso = grupo.querySelector('.aviso-rol-perfil') || document.createElement('p');
  aviso.className = 'aviso-rol-perfil';
  aviso.textContent = motivo ? motivo + ' Contacta a Ayuda para revisar los registros antes de elegir un rol.' : '';
  aviso.hidden = !motivo;
  if (!aviso.parentNode) grupo.append(aviso);
  repartidor.hidden = registrarNegocio.hidden = rol !== 'customer';
  tienda.hidden = rol !== 'merchant';
  dejarNegocioPerfilHam.hidden = rol !== 'merchant';
}

const textosDejarRolHam = {
  courier: {
    opcion: 'Dejar de ser repartidor', titulo: '¿Dejar de ser repartidor?',
    texto: 'Tu perfil de repartidor se desactivará y regresarás a tu cuenta normal de Ham!. Podrás seguir explorando y realizando pedidos.',
    confirmar: 'Sí, dejar de ser repartidor', rol: 'courier_active'
  },
  merchant: {
    opcion: 'Dejar mi negocio', titulo: '¿Dejar tu negocio?',
    texto: 'Tu perfil de negocio se desactivará y regresarás a tu cuenta normal de Ham!. Tu tienda dejará de estar disponible para recibir nuevos pedidos.',
    confirmar: 'Sí, dejar mi negocio', rol: 'merchant'
  }
};
const dialogoDejarRolHam = document.querySelector('#confirmar-dejar-rol');
const confirmarDejarRolHam = document.querySelector('#aceptar-dejar-rol');
const cancelarDejarRolHam = document.querySelector('#cancelar-dejar-rol');
const errorDejarRolHam = document.querySelector('#error-dejar-rol');
let contextoDejarRolHam;

function crearOpcionDejarRolHam(tipo) {
  const textos = textosDejarRolHam[tipo];
  const boton = filaPerfil(textos.opcion, 'salir', null, () => {
    const cuenta = perfilCuentaActiva()?.id;
    const estado = estadoRolesHam(cuenta);
    if (estado.rol !== textos.rol || dialogoDejarRolHam.open) return;
    contextoDejarRolHam = { cuenta, id: estado.solicitud.id, boton };
    dialogoDejarRolHam.querySelector('h2').textContent = textos.titulo;
    dialogoDejarRolHam.querySelector('#texto-dejar-rol').textContent = textos.texto;
    confirmarDejarRolHam.textContent = textos.confirmar;
    errorDejarRolHam.hidden = true;
    dialogoDejarRolHam.showModal();
  });
  boton.classList.add('opcion-dejar-rol');
  return boton;
}

async function cerrarModalDejarRolHam() {
  if (!dialogoDejarRolHam.open || dialogoDejarRolHam.hasAttribute('data-cancelando')) return;
  dialogoDejarRolHam.dataset.cancelando = '';
  if (!reducirMovimientoHam.matches && dialogoDejarRolHam.animate) {
    const animacion = dialogoDejarRolHam.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
    await animacion.finished.catch(() => {});
    dialogoDejarRolHam.close();
    animacion.cancel();
  } else dialogoDejarRolHam.close();
  delete dialogoDejarRolHam.dataset.cancelando;
}

cancelarDejarRolHam.addEventListener('click', async () => {
  if (confirmarDejarRolHam.disabled || dialogoDejarRolHam.hasAttribute('data-cancelando')) return;
  await cerrarModalDejarRolHam();
  contextoDejarRolHam?.boton.focus({ preventScroll: true });
});
dialogoDejarRolHam.addEventListener('cancel', (evento) => {
  evento.preventDefault();
  cancelarDejarRolHam.click();
});
confirmarDejarRolHam.addEventListener('click', async () => {
  if (confirmarDejarRolHam.disabled || dialogoDejarRolHam.hasAttribute('data-cancelando') || !contextoDejarRolHam) return;
  confirmarDejarRolHam.disabled = cancelarDejarRolHam.disabled = true;
  errorDejarRolHam.hidden = true;
  try {
    await dejarRolHam(contextoDejarRolHam.cuenta, contextoDejarRolHam.id);
    await cerrarModalDejarRolHam();
    contextoDejarRolHam = undefined;
    transicionVistaHam('dejar-rol', true, () => {
      if (location.hash !== '#perfil') history.replaceState(history.state, '', '#perfil');
      pintarPestanaPrincipal();
      document.dispatchEvent(new Event(EVENTO_ROL_HAM));
      document.querySelector('#secciones-perfil .fila-perfil')?.focus({ preventScroll: true });
    }, 'paneles-compartidos');
  } catch (error) {
    errorDejarRolHam.textContent = error.message;
    errorDejarRolHam.hidden = false;
  } finally {
    confirmarDejarRolHam.disabled = cancelarDejarRolHam.disabled = false;
  }
});

const dejarNegocioPerfilHam = crearOpcionDejarRolHam('merchant');
dejarNegocioPerfilHam.hidden = true;
contenedorSecciones.append(dejarNegocioPerfilHam);
const salirPerfil = filaPerfil('Cerrar sesión', 'salir', null, () => dialogoSalida.showModal());
salirPerfil.classList.add('salir-perfil');
contenedorSecciones.append(salirPerfil);
const cancelarCierre = document.querySelector('#cancelar-cierre');
const confirmarCierre = document.querySelector('#confirmar-cierre');
const mensajeCierre = document.createElement('p');
mensajeCierre.className = 'mensaje-cierre';
mensajeCierre.setAttribute('role', 'status');
dialogoSalida.append(mensajeCierre);
let cerrandoSesion = false;

function cancelarSalidaPerfil() {
  if (cerrandoSesion || dialogoSalida.dataset.cancelando) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dialogoSalida.close();
    return;
  }
  dialogoSalida.dataset.cancelando = 'true';
  setTimeout(() => {
    dialogoSalida.close();
    delete dialogoSalida.dataset.cancelando;
  }, 160);
}

cancelarCierre.addEventListener('click', cancelarSalidaPerfil);
dialogoSalida.addEventListener('cancel', (evento) => {
  evento.preventDefault();
  cancelarSalidaPerfil();
});
dialogoSalida.addEventListener('close', () => {
  if (!cerrandoSesion && !mainPerfil.hidden) salirPerfil.focus({ preventScroll: true });
});
document.querySelector('#volver-aviso-perfil').addEventListener('click', () => dialogoSeccion.close());
confirmarCierre.addEventListener('click', () => {
  if (cerrandoSesion || dialogoSalida.dataset.cancelando) return;
  cerrandoSesion = true;
  confirmarCierre.disabled = true;
  cancelarCierre.disabled = true;
  mainPerfil.hidden = true;
  navPerfil.hidden = true;
  try {
    cerrarCuentaLocal();
    document.querySelector('#nombre-usuario').textContent = '';
    document.querySelector('#foto-usuario').removeAttribute('src');
    dialogoSalida.close();
    location.replace('./iniciar-sesion.html');
  } catch {
    cerrandoSesion = false;
    confirmarCierre.disabled = false;
    cancelarCierre.disabled = false;
    if (!perfilCuentaActiva()) {
      dialogoSalida.close();
      location.replace('./iniciar-sesion.html');
      return;
    }
    cargarPerfilUsuario();
    mensajeCierre.textContent = 'No se pudo cerrar la sesión. Intenta de nuevo.';
  }
});

function prepararRegresoPerfil() {
  const parametros = new URLSearchParams(location.search);
  const origen = history.state?.hamDesdePestana || parametros.get('origen');
  const negocio = parametros.get('negocio');
  volverPerfil.href = origen === 'negocio' && negocio
    ? './perfil-negocio.html?' + new URLSearchParams({ negocio })
    : origen === 'buscar' ? './inicio.html#buscar' : origen === 'tienda' ? './inicio.html#tienda' : './inicio.html';
}

volverPerfil.addEventListener('click', (evento) => {
  if (!esActivacionNormal(evento)) return;
  if (history.state?.hamDesdePestana) {
    evento.preventDefault();
    history.back();
    return;
  }
  try {
    const anterior = new URL('./perfil-usuario.html' + location.search, location.href).href;
    const retorno = sessionStorage.getItem('ham.retornoPerfil');
    if (retorno === anterior || retorno === location.href) {
      evento.preventDefault();
      history.back();
      return;
    }
  } catch { /* El enlace explícito sigue disponible. */ }
  if (!new URL(volverPerfil.href).pathname.endsWith('/inicio.html')) return;
  evento.preventDefault();
  irPestanaPrincipal(new URL(volverPerfil.href).hash.slice(1) || 'inicio');
});

function cargarPerfilUsuario() {
  if (location.hash !== '#perfil' || esRepartidorHam()) return false;
  const cuenta = perfilCuentaActiva();
  if (!cuenta) {
    mainPerfil.hidden = true;
    navPerfil.hidden = true;
    if (dialogoSalida.open) dialogoSalida.close();
    if (dialogoSeccion.open) dialogoSeccion.close();
    location.replace(rutaAccesoPerfil());
    return false;
  }

  const primerNombre = cuenta.perfil.nombre?.trim().split(/\s+/)[0];
  document.querySelector('#nombre-usuario').textContent = primerNombre ? '¡Hola, ' + primerNombre + '!' : '¡Hola!';
  const imagen = document.querySelector('#foto-usuario');
  imagen.hidden = !cuenta.perfil.foto;
  if (cuenta.perfil.foto) imagen.src = cuenta.perfil.foto;
  else imagen.removeAttribute('src');
  document.querySelector('#avatar-perfil').hidden = !imagen.hidden;
  prepararRegresoPerfil();
  actualizarOpcionesPerfilHam();
  mainPerfil.hidden = false;
  navPerfil.hidden = false;
  return true;
}

window.addEventListener('pageshow', cargarPerfilUsuario);
window.addEventListener('storage', (evento) => {
  if (evento.key === CLAVE_PERFILES) cargarPerfilUsuario();
});
