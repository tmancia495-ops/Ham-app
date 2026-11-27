const CLAVE_PEDIDO = 'ham.carrito';

function obtenerProducto(negocioId, productoId) {
  if (!Object.hasOwn(datosNegocios, negocioId)) return null;
  const negocio = datosNegocios[negocioId];
  const producto = negocio.productos.find(({ id }) => id === productoId)
    || negocio.productosAnteriores?.find(({ id }) => id === productoId);
  return producto ? { negocio, producto } : null;
}

function leerPedido() {
  const guardado = leerDatoRecuperableCuenta(CLAVE_PEDIDO);
  const pedido = guardado ? JSON.parse(guardado) : { lineas: [], metodo: 'recoger', retiro: '' };
  const sinId = pedido.lineas.filter((linea) => !linea.id);
  if (sinId.length) {
    for (const linea of sinId) linea.id = crearIdLinea();
    guardarPedido(pedido);
  }
  return pedido;
}

function guardarPedido(pedido) {
  guardarDatoRecuperableCuenta(CLAVE_PEDIDO, JSON.stringify(pedido));
}

function agregarAlPedido(linea, metodo) {
  const pedido = leerPedido();
  const coincidencia = pedido.lineas.find((actual) => actual.negocio === linea.negocio
    && actual.producto === linea.producto
    && JSON.stringify(actual.extras) === JSON.stringify(linea.extras)
    && JSON.stringify(actual.reserva) === JSON.stringify(linea.reserva));
  if (metodo) pedido.metodo = metodo;
  aplicarReservaDeProducto(pedido, linea.reserva);
  delete pedido.confirmacionId;
  if (coincidencia) coincidencia.cantidad += linea.cantidad;
  else pedido.lineas.push({ ...linea, id: crearIdLinea() });
  guardarPedido(pedido);
}

function precioPedido(centavos) {
  return '$' + (centavos / 100).toFixed(2);
}

function rutaDetalle(negocio, producto, linea) {
  const parametros = new URLSearchParams({ negocio, producto });
  if (linea) parametros.set('linea', linea);
  return './producto.html?' + parametros;
}

function crearIdLinea() {
  return crypto.randomUUID?.()
    || Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16)).join('-');
}

function editarLineaPedido(id, cambios, metodo) {
  const pedido = leerPedido();
  const posicion = pedido.lineas.findIndex((linea) => linea.id === id &&
    linea.negocio === cambios.negocio && linea.producto === cambios.producto);
  if (posicion < 0) throw new Error('Este artículo ya no está en el carrito.');
  const anterior = pedido.lineas[posicion].reserva;
  pedido.lineas[posicion] = { ...cambios, id };
  pedido.metodo = metodo;
  aplicarReservaDeProducto(pedido, cambios.reserva, anterior);
  delete pedido.confirmacionId;
  guardarPedido(pedido);
}

function nombreExtraPedido(extra) {
  return typeof extra === 'string' ? extra : extra.nombre;
}

function calcularPrecioLinea(producto, linea) {
  if (!Number.isSafeInteger(producto?.precioCentavos) || producto.precioCentavos < 0
    || !Number.isSafeInteger(linea.cantidad) || linea.cantidad < 1) return null;

  let unitario = producto.precioCentavos;
  let pendiente = false;
  for (const nombre of linea.extras) {
    const extra = producto.extras.find((opcion) => nombreExtraPedido(opcion) === nombre);
    if (!Number.isSafeInteger(extra?.precioCentavos) || extra.precioCentavos < 0) {
      pendiente = true;
      continue;
    }
    unitario += extra.precioCentavos;
  }
  const subtotal = unitario * linea.cantidad;
  return Number.isSafeInteger(subtotal) ? { unitario, subtotal, pendiente } : null;
}

function fechaLocalPedido(fecha = new Date()) {
  const formato = (numero) => String(numero).padStart(2, '0');
  return fecha.getFullYear() + '-' + formato(fecha.getMonth() + 1) + '-' + formato(fecha.getDate());
}

function errorReservaPedido(fecha, hora, ahora = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return 'Selecciona una fecha de retiro.';
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const diaElegido = new Date(anio, mes - 1, dia);
  if (fechaLocalPedido(diaElegido) !== fecha || fecha < fechaLocalPedido(ahora)) {
    return 'Selecciona una fecha de retiro que no haya pasado.';
  }
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(hora || '')) return 'Selecciona una hora de retiro.';
  const [horas, minutos] = hora.split(':').map(Number);
  diaElegido.setHours(horas, minutos);
  if (diaElegido < ahora) return 'Selecciona una hora de retiro futura.';
  return '';
}

function aplicarReservaDeProducto(pedido, reserva, anterior) {
  if (pedido.metodo !== 'recoger' || reserva?.metodo !== 'recoger' || !reserva.fecha || !reserva.hora24) return;
  const coincideConArticulo = anterior?.fecha === pedido.fechaRetiro && anterior?.hora24 === pedido.retiro;
  if (!pedido.retiro || coincideConArticulo) {
    pedido.fechaRetiro = reserva.fecha;
    pedido.retiro = reserva.hora24;
  }
}
