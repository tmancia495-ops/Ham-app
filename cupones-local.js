const CLAVE_CUPONES_GUARDADOS = 'ham.cupones-guardados';
const modoCuponesDemo = new URLSearchParams(location.search).get('demo') === '1';

function catalogoCupones() {
  return [...CUPONES_EJEMPLO, ...CUPONES_OFICIALES, ...(modoCuponesDemo ? CUPONES_PRUEBA : [])];
}

function buscarCupon(codigo) {
  const normalizado = codigo.trim().toUpperCase();
  return catalogoCupones().find((cupon) => cupon.codigo?.trim().toUpperCase() === normalizado);
}

function cuponesGuardados(cuenta = perfilCuentaActiva()?.id) {
  if (!cuenta) return [];
  return JSON.parse(localStorage.getItem(claveDatosCuenta(CLAVE_CUPONES_GUARDADOS, cuenta)) || '[]');
}

function guardarCupon(cupon, cuenta) {
  const guardados = cuponesGuardados(cuenta);
  if (guardados.includes(cupon.id)) return false;
  localStorage.setItem(claveDatosCuenta(CLAVE_CUPONES_GUARDADOS, cuenta), JSON.stringify([...guardados, cupon.id]));
  return true;
}

function errorCupon(cupon, pedidos, ahora = Date.now()) {
  if (!cupon) return 'No encontramos ese código de descuento.';
  if (cupon.ejemplo) return 'Este código es de demostración y todavía no puede utilizarse.';
  if (cupon.estado === 'vencido' || (cupon.vence && ahora >= Date.parse(cupon.vence))) return 'Este código venció.';
  if (cupon.estado !== 'activo' || (cupon.inicio && ahora < Date.parse(cupon.inicio))) return 'Este código aún no está activo.';
  if (cupon.limiteUsos != null && pedidos.filter((pedido) => pedido.cupon?.id === cupon.id).length >= cupon.limiteUsos) {
    return 'Ya utilizaste este código el máximo de veces permitido.';
  }
  return '';
}

function calcularCuponPedido(cupon, pedidos, pedido, subtotal, tarifaEntrega = null) {
  const error = errorCupon(cupon, pedidos);
  if (error) return { error };
  if (!pedido.lineas.length || !Number.isSafeInteger(subtotal) || subtotal < 0) {
    return { error: 'Revisa los productos y sus precios antes de aplicar el código.' };
  }
  if (cupon.establecimientos?.length && pedido.lineas.some(({ negocio }) => !cupon.establecimientos.includes(negocio))) {
    return { error: 'Hay establecimientos en el pedido que no participan en esta promoción.' };
  }
  if (subtotal < (cupon.minimoCentavos ?? 0)) {
    return { error: 'La compra mínima para este código es ' + precioPedido(cupon.minimoCentavos) + '.' };
  }
  const envioValido = pedido.metodo === 'entrega' && Number.isSafeInteger(tarifaEntrega) && tarifaEntrega > 0;
  let descuento;
  if (cupon.tipo === 'envio') {
    if (!envioValido) return { error: 'El código requiere un pedido de Entrega con una tarifa de envío disponible.' };
    descuento = tarifaEntrega;
  } else if (cupon.tipo === 'porcentaje' && Number.isFinite(cupon.valor) && cupon.valor > 0 && cupon.valor <= 100) {
    descuento = Math.round(subtotal * (cupon.valor / 100));
  } else if (cupon.tipo === 'monto' && Number.isSafeInteger(cupon.valor) && cupon.valor > 0) {
    descuento = Math.min(cupon.valor, subtotal);
  }
  if (!Number.isSafeInteger(descuento) || descuento <= 0) return { error: 'Este código no ofrece un descuento aplicable.' };
  return { descuento, total: subtotal + (envioValido ? tarifaEntrega : 0) - descuento };
}

function resolverCuponCarrito(id, pedido, subtotal, historial = leerPedidosConfirmados()) {
  const guardados = cuponesGuardados();
  const cupon = catalogoCupones().find((actual) => actual.id === id && guardados.includes(id));
  return { cupon, ...calcularCuponPedido(cupon, historial, pedido, subtotal) };
}
