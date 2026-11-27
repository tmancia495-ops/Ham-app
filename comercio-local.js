const CLAVE_SOLICITUDES_NEGOCIO = 'ham.solicitudes-negocio';
const CLAVE_BORRADORES_TIENDA = 'ham.borradores-tienda';
const EVENTO_COMERCIO_HAM = 'ham:comercio-actualizado';

const CLAVE_SOLICITUD_REPARTIDOR = 'ham.solicitud-repartidor';
const EVENTO_ROL_HAM = 'ham:rol-actualizado';
const DURACION_REVISION_HAM = 180000;
const ESTADOS_SOLICITUD_REPARTIDOR = Object.freeze({
  pendiente: 'courier_pending', pending: 'courier_pending',
  active: 'courier_active', approved: 'courier_active', aprobado: 'courier_active',
  rejected: 'courier_rejected', rechazado: 'courier_rejected'
});

function leerRegistroRolHam(clave, cuenta) {
  return cuenta ? JSON.parse(localStorage.getItem(claveDatosCuenta(clave, cuenta))?.trim() || 'null') : null;
}

function registroRolVacioHam(registro) {
  return registro == null || (typeof registro === 'object' && Object.keys(registro).length === 0);
}

function leerSolicitudesNegocio(cuenta) {
  const registro = leerRegistroRolHam(CLAVE_SOLICITUDES_NEGOCIO, cuenta);
  if (registroRolVacioHam(registro)) return [];
  const solicitudes = (Array.isArray(registro) ? registro : [registro]).filter((dato) => !registroRolVacioHam(dato));
  if (solicitudes.some((s) => s.cuentaId !== cuenta || s.tipo !== 'negocio' || !s.id || !s.establecimiento?.nombre)) {
    throw new Error('El registro del establecimiento está incompleto o corresponde a otra cuenta.');
  }
  return solicitudes;
}

function leerSolicitudesRepartidor(cuenta) {
  const registro = leerRegistroRolHam(CLAVE_SOLICITUD_REPARTIDOR, cuenta);
  if (registroRolVacioHam(registro)) return [];
  const solicitudes = Array.isArray(registro) ? registro : [registro];
  if (solicitudes.some((solicitud) => solicitud?.cuentaId !== cuenta || solicitud.tipo !== 'repartidor' || !solicitud.id)) {
    throw new Error('La solicitud de repartidor está incompleta o corresponde a otra cuenta.');
  }
  return solicitudes;
}

function recuperarSolicitud(cuenta) {
  return leerSolicitudesRepartidor(cuenta).find((solicitud) => solicitud.estado !== 'archived') || null;
}

function solicitudNegocioVigenteHam(cuenta) {
  return leerSolicitudesNegocio(cuenta).find((solicitud) => solicitud.estado !== 'archived');
}

function estadoRolesHam(cuenta = perfilCuentaActiva()?.id) {
  let negocio;
  let solicitud;
  try {
    negocio = solicitudNegocioVigenteHam(cuenta);
  } catch {
    return { rol: 'conflict', motivo: 'Hay datos de establecimiento que Ham! no puede leer o asociar con esta cuenta.' };
  }
  try {
    solicitud = recuperarSolicitud(cuenta);
  } catch {
    return { rol: 'conflict', motivo: 'Hay datos de una solicitud de repartidor que Ham! no puede leer o asociar con esta cuenta.' };
  }
  if (negocio && solicitud) return { rol: 'conflict', motivo: 'Esta cuenta tiene un establecimiento y una solicitud de repartidor.' };
  if (negocio) {
    if (['pending', 'pendiente'].includes(negocio.estado)) {
      return { rol: 'merchant_pending', solicitud: negocio, tipo: 'merchant' };
    }
    if (['approved', 'aprobado', 'active'].includes(negocio.estado)) {
      return { rol: 'merchant', solicitud: negocio, tipo: 'merchant' };
    }
    return { rol: 'conflict', motivo: 'La solicitud de negocio tiene un estado que Ham! no reconoce.' };
  }
  if (!solicitud) return { rol: 'customer' };
  if (!Object.hasOwn(ESTADOS_SOLICITUD_REPARTIDOR, solicitud.estado)) {
    return { rol: 'conflict', motivo: 'La solicitud de repartidor tiene un estado que Ham! no reconoce.' };
  }
  return { rol: ESTADOS_SOLICITUD_REPARTIDOR[solicitud.estado], solicitud, tipo: 'courier' };
}

function rolCuentaHam(cuenta) {
  return estadoRolesHam(cuenta).rol;
}

function esRepartidorHam() {
  return rolCuentaHam() === 'courier_active';
}

function conBloqueoRolHam(cuenta, guardar) {
  return navigator.locks ? navigator.locks.request(claveDatosCuenta('ham.rol', cuenta), guardar) : guardar();
}

function correoInstitucionalHam(correo) {
  return /^[^\s@]+@uca\.edu\.sv$/i.test(correo || '');
}

function tiempoRevisionHam(solicitud) {
  const envio = solicitud.submittedAt ?? Date.parse(solicitud.creadaEn);
  return Number.isFinite(envio) ? Math.max(0, envio + DURACION_REVISION_HAM - Date.now()) : null;
}

function guardarEstadoSolicitudHam(cuenta, estado, cambios) {
  const solicitud = { ...estado.solicitud, ...cambios };
  if (estado.tipo === 'courier') {
    const registros = leerSolicitudesRepartidor(cuenta).map((registro) => registro.id === solicitud.id ? solicitud : registro);
    localStorage.setItem(claveDatosCuenta(CLAVE_SOLICITUD_REPARTIDOR, cuenta), JSON.stringify(registros));
  } else {
    const registros = leerSolicitudesNegocio(cuenta).map((registro) => registro.id === solicitud.id ? solicitud : registro);
    localStorage.setItem(claveDatosCuenta(CLAVE_SOLICITUDES_NEGOCIO, cuenta), JSON.stringify(registros));
  }
}

async function dejarRolHam(cuenta, solicitudId) {
  return conBloqueoRolHam(cuenta, () => {
    if (perfilCuentaActiva()?.id !== cuenta) throw new Error('La cuenta activa cambió.');
    const estado = estadoRolesHam(cuenta);
    if (!['merchant', 'courier_active'].includes(estado.rol) || estado.solicitud?.id !== solicitudId) {
      throw new Error('Este rol ya no está activo.');
    }
    if (tienePedidosActivosDelRolHam(cuenta, estado)) {
      throw new Error(estado.tipo === 'courier'
        ? 'Tienes una entrega en curso. Complétala antes de dejar de ser repartidor.'
        : 'Tu negocio tiene pedidos pendientes. Complétalos antes de desactivar tu tienda.');
    }
    guardarEstadoSolicitudHam(cuenta, estado, {
      estado: 'archived', estadoAnterior: estado.solicitud.estado, leftAt: Date.now()
    });
  });
}

async function aprobarSolicitudHam(metodo, solicitudId = estadoRolesHam().solicitud?.id) {
  const cuenta = perfilCuentaActiva()?.id;
  if (!cuenta || !['timer', 'manual-demo'].includes(metodo)) return false;
  const aprobada = await conBloqueoRolHam(cuenta, () => {
    if (perfilCuentaActiva()?.id !== cuenta) return false;
    const estado = estadoRolesHam(cuenta);
    if (!estado.rol.endsWith('_pending') || estado.solicitud.id !== solicitudId) return false;
    if (estado.tipo === 'courier' && !correoInstitucionalHam(estado.solicitud.correo)) {
      if (metodo === 'timer') return false;
      throw new Error('La solicitud requiere un correo institucional válido.');
    }
    if (metodo === 'timer' && tiempoRevisionHam(estado.solicitud) !== 0) return false;
    guardarEstadoSolicitudHam(cuenta, estado, { estado: 'approved', approvedAt: Date.now(), approvalMethod: metodo });
    return true;
  });
  if (aprobada) document.dispatchEvent(new Event(EVENTO_ROL_HAM));
  return aprobada;
}

let temporizadorRevisionHam;
function programarRevisionHam() {
  clearTimeout(temporizadorRevisionHam);
  const estado = estadoRolesHam();
  if (!estado.rol.endsWith('_pending') || (estado.tipo === 'courier' && !correoInstitucionalHam(estado.solicitud.correo))) return;
  const tiempo = tiempoRevisionHam(estado.solicitud);
  if (tiempo === null) return;
  temporizadorRevisionHam = setTimeout(() => {
    aprobarSolicitudHam('timer', estado.solicitud.id).then((aprobada) => {
      if (!aprobada && tiempoRevisionHam(estado.solicitud) > 0) programarRevisionHam();
    }).catch(() => {});
  }, tiempo);
}

document.addEventListener(EVENTO_ROL_HAM, programarRevisionHam);
window.addEventListener('pageshow', programarRevisionHam);
document.addEventListener('visibilitychange', () => { if (!document.hidden) programarRevisionHam(); });
window.addEventListener('storage', (evento) => {
  if (!evento.key || [CLAVE_SOLICITUD_REPARTIDOR, CLAVE_SOLICITUDES_NEGOCIO].some((clave) =>
    evento.key === claveDatosCuenta(clave))) programarRevisionHam();
});

function comercioCuentaHam() {
  const cuentaId = perfilCuentaActiva()?.id;
  if (rolCuentaHam(cuentaId) !== 'merchant') return null;
  try {
    const solicitud = solicitudNegocioVigenteHam(cuentaId);
    if (!solicitud) return null;
    const clave = claveDatosCuenta(CLAVE_BORRADORES_TIENDA, cuentaId);
    const borradores = JSON.parse(localStorage.getItem(clave) || '{}');
    const borrador = borradores[solicitud.id] || {};
    return { cuentaId, solicitud, clave, borradores, borrador,
      establecimiento: { ...solicitud.establecimiento, ...borrador.establecimiento },
      productos: borrador.productos || [] };
  } catch {
    return null;
  }
}

async function editarComercioHam(contexto, actualizar) {
  const guardar = () => {
    const actual = comercioCuentaHam();
    if (!actual || actual.cuentaId !== contexto.cuentaId || actual.solicitud.id !== contexto.solicitud.id) {
      throw new Error('Vuelve a abrir la tienda de la cuenta activa.');
    }
    const borrador = actualizar(actual);
    localStorage.setItem(actual.clave, JSON.stringify({ ...actual.borradores, [actual.solicitud.id]: borrador }));
  };
  await conBloqueoRolHam(contexto.cuentaId, guardar);
}
