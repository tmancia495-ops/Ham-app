// Identificación local para el prototipo. Las contraseñas nunca se almacenan.
const CLAVE_CUENTA_ACTIVA = 'ham.cuenta-activa';
const CLAVE_SESION_RECORDADA = 'ham.sesion-recordada';
const CLAVE_REVISION_SESION = 'ham.revision-sesion';
const CLAVE_REVOCACION = 'ham.revocacion-sesion';
const CLAVE_PERFILES = 'ham.perfiles-locales';
const CUENTA_LEGADA = 'perfil-legado';

function correoCuenta(correo) {
  return correo.trim().toLocaleLowerCase('es');
}

function leerPerfilesCuenta() {
  return JSON.parse(localStorage.getItem(CLAVE_PERFILES) || '{}');
}

function guardarPerfilCuenta(cuenta, perfil) {
  const perfiles = leerPerfilesCuenta();
  perfiles[cuenta] = perfil;
  localStorage.setItem(CLAVE_PERFILES, JSON.stringify(perfiles));
}

function cuentaRegistrada(correo) {
  return Object.hasOwn(leerPerfilesCuenta(), correoCuenta(correo));
}

function revisionSesion(id) {
  return localStorage.getItem(claveDatosCuenta(CLAVE_REVOCACION, id));
}

function sesionRecordada() {
  try { return JSON.parse(localStorage.getItem(CLAVE_SESION_RECORDADA) || 'null'); }
  catch { return null; }
}

function guardarSesionPestana(id, revision = revisionSesion(id)) {
  if (revision === null) sessionStorage.removeItem(CLAVE_REVISION_SESION);
  else sessionStorage.setItem(CLAVE_REVISION_SESION, revision);
  sessionStorage.setItem(CLAVE_CUENTA_ACTIVA, id);
}

function perfilCuentaActiva() {
  try {
    const activa = sessionStorage.getItem(CLAVE_CUENTA_ACTIVA);
    const perfiles = leerPerfilesCuenta();
    if (activa !== null) {
      return activa && Object.hasOwn(perfiles, activa) &&
        sessionStorage.getItem(CLAVE_REVISION_SESION) === revisionSesion(activa)
        ? { id: activa, perfil: perfiles[activa] } : null;
    }

    const recordada = sesionRecordada();
    if (recordada?.id && Object.hasOwn(perfiles, recordada.id) && revisionSesion(recordada.id) === recordada.revision) {
      guardarSesionPestana(recordada.id, recordada.revision);
      return { id: recordada.id, perfil: perfiles[recordada.id] };
    }

    const anterior = sessionStorage.getItem('ham.perfil');
    if (!anterior || revisionSesion(CUENTA_LEGADA) !== null) return null;
    const perfil = JSON.parse(anterior);
    guardarPerfilCuenta(CUENTA_LEGADA, perfil);
    trasladarDatosCuenta(null, CUENTA_LEGADA);
    guardarSesionPestana(CUENTA_LEGADA);
    sessionStorage.removeItem('ham.perfil');
    return { id: CUENTA_LEGADA, perfil };
  } catch {
    return null;
  }
}

function iniciarCuentaLocal(correo, recordar = false) {
  const id = correoCuenta(correo);
  const anterior = perfilCuentaActiva();
  const perfiles = leerPerfilesCuenta();
  if (!Object.hasOwn(perfiles, id)) {
    if (anterior?.id !== CUENTA_LEGADA || !Object.hasOwn(perfiles, CUENTA_LEGADA)) return false;
    trasladarDatosCuenta(CUENTA_LEGADA, id);
    perfiles[id] = perfiles[CUENTA_LEGADA];
    delete perfiles[CUENTA_LEGADA];
    localStorage.setItem(CLAVE_PERFILES, JSON.stringify(perfiles));
  }
  const revision = revisionSesion(id);
  if (recordar) localStorage.setItem(CLAVE_SESION_RECORDADA, JSON.stringify({ id, revision }));
  else localStorage.removeItem(CLAVE_SESION_RECORDADA);
  guardarSesionPestana(id, revision);
  return true;
}

function cerrarCuentaLocal() {
  const cuenta = perfilCuentaActiva()?.id;
  if (cuenta) {
    const revision = Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16)).join('-');
    localStorage.setItem(claveDatosCuenta(CLAVE_REVOCACION, cuenta), revision);
    if (sesionRecordada()?.id === cuenta) localStorage.removeItem(CLAVE_SESION_RECORDADA);
  }
  sessionStorage.setItem(CLAVE_CUENTA_ACTIVA, '');
  for (const clave of [CLAVE_REVISION_SESION, 'ham.perfil', 'ham.correoRegistro', 'ham.nombreRegistro',
    'ham.aceptacionRegistro', 'ham.editorPerfilDestino', 'ham.retornoPerfil', 'ham.destinoNegocio']) {
    sessionStorage.removeItem(clave);
  }
}

function rutaAccesoPerfil() {
  return './iniciar-sesion.html?destino=perfil';
}

const destinosCuentaHam = Object.freeze({
  perfil: './perfil-usuario.html',
  favoritos: './favoritos.html',
  carrito: './carrito.html'
});

function claveDatosCuenta(clave, cuenta = perfilCuentaActiva()?.id) {
  return cuenta ? clave + ':' + encodeURIComponent(cuenta) : clave;
}

// Migra al leer los datos de una cuenta guardados por versiones anteriores en la pestaña.
function leerDatoRecuperableCuenta(clave) {
  const cuenta = perfilCuentaActiva()?.id;
  if (!cuenta) return null;
  const llave = claveDatosCuenta(clave, cuenta);
  const persistente = localStorage.getItem(llave);
  if (persistente !== null) return persistente;
  const anterior = sessionStorage.getItem(llave);
  if (anterior !== null) {
    localStorage.setItem(llave, anterior);
    sessionStorage.removeItem(llave);
  }
  return anterior;
}

function guardarDatoRecuperableCuenta(clave, valor) {
  const cuenta = perfilCuentaActiva()?.id;
  if (!cuenta) throw new Error('Inicia sesión para guardar tus datos.');
  const llave = claveDatosCuenta(clave, cuenta);
  localStorage.setItem(llave, valor);
  sessionStorage.removeItem(llave);
}

function trasladarDatosCuenta(origen, destino) {
  const recuperables = ['ham.carrito', 'ham.direcciones', 'ham.direccionActiva', 'ham.pedidos-confirmados'];
  const persistentes = [...recuperables, 'ham.favoritos', 'ham.preferencias-notificaciones', 'ham.avisos-pedido',
    'ham.cupones-guardados', 'ham.solicitud-repartidor', 'ham.solicitudes-negocio', 'ham.borradores-tienda'];
  for (const [almacen, claves] of [[sessionStorage, recuperables], [localStorage, persistentes]]) {
    for (const clave of claves) {
      const anterior = claveDatosCuenta(clave, origen);
      const nueva = claveDatosCuenta(clave, destino);
      const datos = almacen.getItem(anterior);
      if (datos !== null && almacen.getItem(nueva) === null) {
        almacen.setItem(nueva, datos);
        almacen.removeItem(anterior);
      }
    }
  }
}

const paginaCuentaHam = location.pathname.split('/').at(-1);
const parametrosCuentaHam = new URLSearchParams(location.search);
const requiereCuentaHam = ['perfil-usuario.html', 'favoritos.html', 'notificaciones.html', 'codigos-descuento.html',
  'repartidor.html', 'registrar-negocio.html', 'carrito.html', 'estado-pedido.html'].includes(paginaCuentaHam) ||
  (paginaCuentaHam === 'completar-perfil.html' && parametrosCuentaHam.get('editar') === '1') ||
  (paginaCuentaHam === 'producto.html' && parametrosCuentaHam.has('linea'));
const cuentaInicialHam = perfilCuentaActiva()?.id;

function comprobarAccesoHam() {
  const actual = perfilCuentaActiva()?.id;
  if (requiereCuentaHam && !actual) {
    document.body.hidden = true;
    location.replace(paginaCuentaHam === 'carrito.html' ? './iniciar-sesion.html?destino=carrito' : rutaAccesoPerfil());
  } else if (cuentaInicialHam !== actual && (requiereCuentaHam || ['inicio.html', 'producto.html', 'centro-ayuda.html'].includes(paginaCuentaHam))) {
    document.body.hidden = true;
    location.reload();
  } else if (requiereCuentaHam) {
    document.body.hidden = false;
  }
}

if (requiereCuentaHam) {
  comprobarAccesoHam();
  window.addEventListener('pagehide', () => { document.body.hidden = true; });
}
window.addEventListener('pageshow', comprobarAccesoHam);
window.addEventListener('storage', (evento) => {
  if (evento.key === null || evento.key === CLAVE_SESION_RECORDADA ||
    evento.key === claveDatosCuenta(CLAVE_REVOCACION, cuentaInicialHam ?? null)) comprobarAccesoHam();
});
