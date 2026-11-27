const CLAVE_PREFERENCIAS_NOTIFICACIONES = 'ham.preferencias-notificaciones';
const CLAVE_AVISOS_PEDIDO = 'ham.avisos-pedido';
const PREDETERMINADAS_NOTIFICACIONES = Object.freeze({
  pedidos: true, promociones: false, productos: false, actualizaciones: true, correos: false
});
const TEXTOS_AVISO_PEDIDO = Object.freeze({
  recibido: 'Pedido recibido.', preparando: 'Preparando.', listo: 'Listo para recoger.',
  retirado: 'Retirado.', 'repartidor-asignado': 'Repartidor asignado.',
  'pedido-recogido': 'Pedido recogido.', 'en-camino': 'En camino.', entregado: 'Entregado.'
});

function leerPreferenciasNotificacionesHam(cuenta) {
  try {
    return JSON.parse(localStorage.getItem(claveDatosCuenta(CLAVE_PREFERENCIAS_NOTIFICACIONES, cuenta))) || {};
  } catch {
    return {};
  }
}

function permiteNotificacionHam(categoria, cuenta = perfilCuentaActiva()?.id) {
  if (!cuenta || !Object.hasOwn(PREDETERMINADAS_NOTIFICACIONES, categoria)) return false;
  const valor = leerPreferenciasNotificacionesHam(cuenta)[categoria];
  return typeof valor === 'boolean' ? valor : PREDETERMINADAS_NOTIFICACIONES[categoria];
}

function guardarPreferenciaNotificacionHam(categoria, activo) {
  const cuenta = perfilCuentaActiva()?.id;
  if (!cuenta || !Object.hasOwn(PREDETERMINADAS_NOTIFICACIONES, categoria)) throw new Error('Preferencia no disponible');
  const preferencias = leerPreferenciasNotificacionesHam(cuenta);
  localStorage.setItem(claveDatosCuenta(CLAVE_PREFERENCIAS_NOTIFICACIONES, cuenta),
    JSON.stringify({ ...preferencias, [categoria]: activo }));
}

function registrarAvisoPedidoHam(pedido) {
  // Un fallo al generar el aviso opcional no interrumpe el seguimiento.
  try {
    const cuenta = perfilCuentaActiva()?.id;
    if (!pedido.simulado || !permiteNotificacionHam('pedidos', cuenta)) return;
    const clave = claveDatosCuenta(CLAVE_AVISOS_PEDIDO, cuenta);
    const avisos = JSON.parse(localStorage.getItem(clave) || '{}');
    avisos[pedido.id] = 'Aviso de prueba · ' + TEXTOS_AVISO_PEDIDO[pedido.estado];
    localStorage.setItem(clave, JSON.stringify(avisos));
  } catch {
    // El pedido ya se guardó.
  }
}

function tomarAvisoPedidoHam(id) {
  try {
    const cuenta = perfilCuentaActiva()?.id;
    if (!cuenta) return '';
    const clave = claveDatosCuenta(CLAVE_AVISOS_PEDIDO, cuenta);
    const avisos = JSON.parse(localStorage.getItem(clave) || '{}');
    if (!Object.hasOwn(avisos, id)) return '';
    const texto = avisos[id];
    delete avisos[id];
    localStorage.setItem(clave, JSON.stringify(avisos));
    return permiteNotificacionHam('pedidos', cuenta) ? texto : '';
  } catch {
    return '';
  }
}
