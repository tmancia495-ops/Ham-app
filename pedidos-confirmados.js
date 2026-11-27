const CLAVE_HISTORIAL_PEDIDOS = 'ham.pedidos-confirmados';
const ETAPAS_RETIRO = Object.freeze(['recibido', 'preparando', 'listo', 'retirado']);
const ETAPAS_ENTREGA = Object.freeze(['recibido', 'preparando', 'repartidor-asignado', 'pedido-recogido', 'en-camino', 'entregado']);

function etapasPedido(metodo) {
  if (metodo === 'recoger') return ETAPAS_RETIRO;
  if (metodo === 'entrega') return ETAPAS_ENTREGA;
  return [];
}

function restaurarEstadoPedido(pedido) {
  const estado = etapasPedido(pedido.metodo).includes(pedido.estado) ? pedido.estado : 'recibido';
  return {
    ...pedido, estado, simulado: pedido.simulado ?? true,
    historialEstados: pedido.historialEstados || [
      { estado, fecha: pedido.actualizadoEn || pedido.creadoEn }
    ]
  };
}

function leerPedidosConfirmados() {
  const pedidos = JSON.parse(localStorage.getItem(claveDatosCuenta(CLAVE_HISTORIAL_PEDIDOS)) || '[]');
  const anteriores = sessionStorage.getItem(claveDatosCuenta(CLAVE_HISTORIAL_PEDIDOS));
  if (anteriores) {
    const ids = new Set(pedidos.map(({ id }) => id));
    pedidos.push(...JSON.parse(anteriores).filter(({ id }) => !ids.has(id)));
    guardarPedidosConfirmados(pedidos.map(restaurarEstadoPedido));
    sessionStorage.removeItem(claveDatosCuenta(CLAVE_HISTORIAL_PEDIDOS));
  }
  return pedidos.map(restaurarEstadoPedido);
}

function guardarPedidosConfirmados(pedidos) {
  localStorage.setItem(claveDatosCuenta(CLAVE_HISTORIAL_PEDIDOS), JSON.stringify(pedidos));
}

function tienePedidosActivosDelRolHam(cuenta, { tipo, solicitud }) {
  const prefijo = CLAVE_HISTORIAL_PEDIDOS + ':';
  const finales = ['retirado', 'entregado', 'cancelado', 'completado'];
  for (const almacen of [localStorage, sessionStorage]) {
    for (let i = 0; i < almacen.length; i++) {
      const llave = almacen.key(i);
      if (!llave?.startsWith(prefijo)) continue;
      const pedidos = JSON.parse(almacen.getItem(llave) || '[]');
      if (pedidos.some((pedido) => {
        if (pedido?.simulado !== false || finales.includes(pedido.estado)) return false;
        if (tipo === 'merchant') {
          return pedido.negocioId === solicitud.id || pedido.lineas?.some((linea) =>
            linea.negocio?.id === solicitud.id || linea.negocio === solicitud.id);
        }
        const asignado = pedido.seguimientoEntrega?.repartidor;
        return pedido.metodo === 'entrega' && [pedido.repartidorId, asignado?.cuentaId, asignado?.id, asignado].includes(cuenta);
      })) return true;
    }
  }
  return false;
}

function obtenerPedidoConfirmado(id) {
  return leerPedidosConfirmados().find((pedido) => pedido.id === id) || null;
}

function rutaSeguimiento(id) {
  return './estado-pedido.html?' + new URLSearchParams({ pedido: id });
}

function negocioDelPedido(pedido) {
  return pedido.negocioId || pedido.lineas.find((linea) => linea.negocio?.id)?.negocio.id;
}

function folioPedido(id) {
  return '#' + id.split('-')[0].toUpperCase();
}

function confirmarPedidoLocal(direccion, totalVisto, cuponVisto) {
  const carrito = leerPedido();
  const historial = leerPedidosConfirmados();
  const yaGuardado = historial.find((pedido) => pedido.id === carrito.confirmacionId);
  if (yaGuardado) {
    vaciarCarritoConfirmado(carrito);
    return yaGuardado;
  }

  if (!carrito.lineas.length) throw new Error('Añade al menos un producto para continuar.');
  if (carrito.metodo !== 'recoger' && carrito.metodo !== 'entrega') {
    throw new Error('Elige un método de recepción.');
  }
  if (carrito.metodo === 'entrega') {
    if (!direccion) throw new Error('Selecciona una dirección de entrega.');
  }
  if (carrito.metodo === 'recoger') {
    const error = errorReservaPedido(carrito.fechaRetiro, carrito.retiro);
    if (error) throw new Error(error);
  }

  const lineas = carrito.lineas.map((linea) => {
    const ficha = obtenerProducto(linea.negocio, linea.producto);
    if (!ficha || !Number.isSafeInteger(ficha.producto.precioCentavos) ||
      !Number.isSafeInteger(linea.cantidad) || linea.cantidad < 1) {
      throw new Error('Revisa los productos disponibles en el carrito.');
    }
    const { negocio, producto } = ficha;
    const precio = calcularPrecioLinea(producto, linea);
    if (!precio || precio.pendiente) throw new Error('Hay artículos o extras con precio pendiente.');
    return {
      lineaId: linea.id,
      producto: {
        id: producto.id, nombre: producto.nombre, categoria: producto.categoria,
        imagen: producto.imagen, precioCentavos: producto.precioCentavos
      },
      negocio: { id: negocio.id, nombre: negocio.nombre, direccion: negocio.direccion },
      cantidad: linea.cantidad,
      extras: [...linea.extras],
      reserva: linea.reserva ? { ...linea.reserva } : null,
      precioUnitarioCentavos: precio.unitario,
      importeCentavos: precio.subtotal
    };
  });
  const subtotal = lineas.reduce((suma, linea) => suma + linea.importeCentavos, 0);
  if (carrito.cuponId !== cuponVisto) throw new Error('El código aplicado cambió. Revisa el carrito.');
  const aplicacion = carrito.cuponId ? resolverCuponCarrito(carrito.cuponId, carrito, subtotal, historial) : null;
  if (aplicacion?.error) throw new Error(aplicacion.error);
  const total = aplicacion?.total ?? subtotal;
  if (!Number.isSafeInteger(total) || total !== totalVisto) {
    throw new Error('El total cambió. Revisa el carrito antes de confirmar.');
  }

  const hoy = new Date();
  const id = carrito.confirmacionId || crypto.randomUUID?.()
    || Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16).padStart(8, '0')).join('-');
  const puntosRetiro = [...new Map(lineas.map(({ negocio }) => [negocio.id, negocio])).values()];
  const pedido = {
    id, negocioId: puntosRetiro[0].id, creadoEn: hoy.toISOString(),
    estado: etapasPedido(carrito.metodo)[0],
    simulado: true,
    historialEstados: [{ estado: etapasPedido(carrito.metodo)[0], fecha: hoy.toISOString() }],
    seguimientoEntrega: carrito.metodo === 'entrega' ? {
      repartidor: null, ubicacion: null, destino: null, llegadaEstimada: null
    } : null,
    metodo: carrito.metodo,
    entrega: carrito.metodo === 'entrega' ? { ...direccion } : null,
    retiro: carrito.metodo === 'recoger' ? { fecha: carrito.fechaRetiro, hora: carrito.retiro, puntos: puntosRetiro } : null,
    lineas,
    subtotalCentavos: subtotal,
    ...(aplicacion ? {
      descuentoCentavos: aplicacion.descuento,
      cupon: { id: aplicacion.cupon.id, codigo: aplicacion.cupon.codigo, demo: Boolean(aplicacion.cupon.demo) }
    } : {}),
    totalCentavos: total
  };

  guardarPedido({ ...carrito, confirmacionId: id });
  guardarPedidosConfirmados([...historial, pedido]);
  registrarAvisoPedidoHam(pedido);
  vaciarCarritoConfirmado(carrito);
  return pedido;
}

function vaciarCarritoConfirmado(carrito) {
  try {
    guardarPedido({ lineas: [], metodo: carrito.metodo, retiro: '' });
  } catch {
    // Se conserva el identificador para reconocer un reintento del mismo carrito.
  }
}

function avanzarEtapaPedido(id, estadoEsperado) {
  const pedidos = leerPedidosConfirmados();
  const pedido = pedidos.find((actual) => actual.id === id);
  if (!pedido || !pedido.simulado || pedido.estado !== estadoEsperado) return null;
  const etapas = etapasPedido(pedido.metodo);
  const actual = etapas.indexOf(pedido.estado);
  if (actual < 0 || actual === etapas.length - 1) return null;
  pedido.estado = etapas[actual + 1];
  pedido.actualizadoEn = new Date().toISOString();
  pedido.historialEstados.push({ estado: pedido.estado, fecha: pedido.actualizadoEn, origen: 'demo' });
  guardarPedidosConfirmados(pedidos);
  registrarAvisoPedidoHam(pedido);
  return pedido;
}
