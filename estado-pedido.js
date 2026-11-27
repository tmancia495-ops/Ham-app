const parametrosSeguimiento = new URLSearchParams(location.search);
const idSeguimiento = parametrosSeguimiento.get('pedido');
const volverSeguimiento = document.querySelector('#volver-seguimiento');
const etapasRetiroVista = [
  { nombre: 'Recibido', titulo: '¡Pedido recibido!', resumen: 'Pedido registrado', detalle: 'Este pedido se guardó en el prototipo.', aviso: 'Tu pedido está registrado', ayuda: 'Aquí puedes consultar el seguimiento de prueba.', icono: 'recibo' },
  { nombre: 'Preparando', titulo: '¡Lo están preparando!', resumen: 'En preparación', etapa: 'preparación del producto', detalle: 'El pedido está en preparación en la simulación.', aviso: 'Tu pedido está en cocina', ayuda: 'Esta etapa es parte del seguimiento de prueba.', icono: 'chef' },
  { nombre: 'Listo', titulo: '¡Tu pedido está listo!', resumen: 'Listo para retirar', detalle: 'En la simulación ya puedes pasar por tu pedido.', aviso: 'Puedes recoger tu pedido', ayuda: 'Consulta el punto de retiro indicado abajo.', icono: 'reloj' },
  { nombre: 'Retirado', titulo: '¡Pedido retirado!', resumen: 'Retiro completado', detalle: 'El seguimiento de prueba ha finalizado.', aviso: 'El retiro está completo', ayuda: 'Puedes consultar el detalle de este pedido.', icono: 'recibo' }
];
const etapasEntregaVista = [
  { nombre: 'Pedido recibido', titulo: '¡Pedido recibido!', resumen: 'Recibido', detalle: 'Se registró el pedido para entrega.', aviso: 'Tu pedido está registrado', ayuda: 'Consulta el progreso desde esta pantalla.', icono: 'recibo' },
  { nombre: 'Preparando', titulo: '¡Lo están preparando!', resumen: 'En preparación', detalle: 'El pedido está en preparación.', aviso: 'Tu pedido está en cocina', ayuda: 'La recogida es el siguiente paso después de la asignación.', icono: 'chef' },
  { nombre: 'Repartidor asignado', titulo: 'Repartidor asignado', resumen: 'Repartidor asignado', detalle: 'La entrega ya tiene un repartidor asignado.', aviso: 'Asignación completada', ayuda: 'La información disponible aparece en la tarjeta del repartidor.', icono: 'transporte' },
  { nombre: 'Pedido recogido', titulo: '¡Pedido recogido!', resumen: 'Pedido recogido', detalle: 'El repartidor recogió el pedido en el local.', aviso: 'El pedido salió del local', ayuda: 'Puedes revisar la dirección de destino abajo.', icono: 'recibo' },
  { nombre: 'En camino', titulo: '¡Tu pedido va en camino!', resumen: 'En camino', detalle: 'El pedido se dirige a la dirección guardada.', aviso: 'Tu pedido está en ruta', ayuda: 'El trayecto aparecerá cuando haya ubicación autorizada.', icono: 'transporte' },
  { nombre: 'Entregado', titulo: '¡Pedido entregado!', resumen: 'Entrega completada', detalle: 'El seguimiento de la entrega ha terminado.', aviso: 'Entrega completada', ayuda: 'Puedes consultar el detalle de este pedido.', icono: 'recibo' }
];
const esDemostracion = parametrosSeguimiento.get('demo') === '1';

const bloquePedido = document.querySelector('#pedido-seguimiento');
const panelDetalle = document.querySelector('#detalle-pedido');
const etapasElemento = document.querySelector('#etapas-seguimiento');
let pedidoSeguimiento;

function imagenEtapa(nombre) {
  return nombre === 'transporte' ? './assets/carrito-entrega.svg' : './assets/pedido-' + nombre + '.svg';
}

function textoSeguimiento(id, texto) {
  document.getElementById(id).textContent = texto;
}

function vistaEtapas() {
  return pedidoSeguimiento.metodo === 'entrega' ? etapasEntregaVista : etapasRetiroVista;
}

function crearEtapas() {
  etapasElemento.replaceChildren();
  for (const { nombre } of vistaEtapas()) {
    const item = document.createElement('li');
    item.className = 'etapa-pedido';
    item.innerHTML = '<span class="etapa-barra" aria-hidden="true"></span><span class="etapa-icono" aria-hidden="true"><img alt=""><img alt="" hidden><span></span></span><strong></strong>';
    item.querySelector('strong').textContent = nombre;
    etapasElemento.append(item);
  }
}

function mostrarEtapa() {
  const indice = etapasPedido(pedidoSeguimiento.metodo).indexOf(pedidoSeguimiento.estado);
  const etapa = vistaEtapas()[indice];
  if (!etapa) return;

  textoSeguimiento('titulo-estado', etapa.titulo);
  textoSeguimiento('mensaje-estado', pedidoSeguimiento.metodo === 'entrega' && pedidoSeguimiento.simulado ? 'Simulación · ' + etapa.detalle : etapa.detalle);
  textoSeguimiento('etiqueta-estado', etapa.resumen);
  document.querySelector('#icono-estado').src = imagenEtapa(etapa.icono);
  textoSeguimiento('etapa-actual', 'Etapa actual: ' + (etapa.etapa || etapa.resumen.toLowerCase()));
  textoSeguimiento('aviso-etapa-titulo', etapa.aviso);
  textoSeguimiento('aviso-etapa-texto', etapa.ayuda);

  [...etapasElemento.children].forEach((elemento, paso) => {
    const avanzada = paso <= indice;
    const [fondo, simbolo] = elemento.querySelectorAll('img');
    fondo.src = avanzada ? './assets/direccion-circulo.svg' : imagenEtapa('pendiente');
    simbolo.hidden = !avanzada;
    simbolo.classList.toggle('icono-etapa-entrega', pedidoSeguimiento.metodo === 'entrega' && paso === indice && avanzada);
    if (avanzada) {
      const icono = paso === indice && pedidoSeguimiento.metodo === 'entrega'
        ? etapa.icono : (paso === 1 && indice === 1 ? 'chef-etapa' : 'check');
      simbolo.src = imagenEtapa(icono);
    }
    else simbolo.removeAttribute('src');
    elemento.querySelector('.etapa-icono span').textContent = avanzada ? '' : String(paso + 1);
    elemento.toggleAttribute('data-avanzada', avanzada);
    if (paso === indice) elemento.setAttribute('aria-current', 'step');
    else elemento.removeAttribute('aria-current');
  });
}

let datosEntregaActivos = {};
let seguimientoEntregaActivo;

function iniciarVistaEntrega() {
  seguimientoEntregaActivo?.desconectar();
  seguimientoEntregaActivo = undefined;
  datosEntregaActivos = pedidoSeguimiento.seguimientoEntrega || {};
  if (pedidoSeguimiento.metodo === 'entrega') {
    seguimientoEntregaActivo = crearSeguimientoEntrega(pedidoSeguimiento, (datos) => {
      datosEntregaActivos = { ...datosEntregaActivos, ...datos };
      mostrarDatosEntrega();
    });
  }
}

function mostrarDatosEntrega() {
  if (!seguimientoEntregaActivo) return;
  const etapa = etapasPedido('entrega').indexOf(pedidoSeguimiento.estado);
  const simulado = pedidoSeguimiento.simulado;
  const datos = datosEntregaActivos;
  const espera = document.querySelector('#tiempo-entrega');
  const hora = datos.llegadaEstimada ? new Date(datos.llegadaEstimada) : null;
  espera.textContent = !simulado && hora && hora > new Date()
    ? 'Llegada estimada · ' + new Intl.DateTimeFormat('es-SV', { hour: 'numeric', minute: '2-digit' }).format(hora)
    : 'Tiempo estimado pendiente';

  document.querySelector('#tarjeta-repartidor').hidden = etapa < 2;
  const repartidor = datos.repartidor;
  const nombre = simulado ? (esDemostracion ? 'Repartidor de ejemplo · Simulación' : '') : repartidor?.nombre;
  textoSeguimiento('nombre-repartidor', nombre || 'Información del repartidor pendiente.');
  const foto = document.querySelector('#foto-repartidor');
  foto.hidden = !(!simulado && repartidor?.foto);
  if (foto.hidden) foto.removeAttribute('src');
  else foto.src = repartidor.foto;
  const transporte = document.querySelector('#transporte-repartidor');
  transporte.hidden = !(!simulado && repartidor?.transporte);
  transporte.querySelector('span').textContent = transporte.hidden ? '' : repartidor.transporte;
  document.querySelector('#contactar-repartidor').hidden = !seguimientoEntregaActivo.puedeContactar(datos);

  const mostrarMapa = etapa === 4;
  document.querySelector('#tarjeta-trayecto').hidden = !mostrarMapa;
  const mapa = document.querySelector('#mapa-entrega');
  let mapaVisible = false;
  if (mostrarMapa) {
    mapa.hidden = false;
    mapaVisible = seguimientoEntregaActivo.representarMapa(mapa, datos);
  } else {
    seguimientoEntregaActivo.limpiarMapa();
  }
  mapa.hidden = !mapaVisible;
  const aviso = document.querySelector('#aviso-trayecto');
  aviso.hidden = mapaVisible;
  aviso.textContent = simulado ? 'Simulación · No hay ubicación GPS en tiempo real.' : 'Ubicación del repartidor pendiente.';
}

function nombreLinea({ producto }) {
  return [producto.categoria, producto.nombre].filter(Boolean).join(' ');
}

function horarioRetiro({ fecha, hora }) {
  const dia = fecha ? new Date(fecha + 'T12:00') : null;
  const fechaVisible = dia && !Number.isNaN(dia.getTime())
    ? new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short', year: 'numeric' }).format(dia)
    : fecha;
  return [fechaVisible, hora].filter(Boolean).join(' · ');
}

function rutaPerfilPedido(pedido) {
  const negocio = pedido && negocioDelPedido(pedido);
  return negocio ? './perfil-negocio.html?' + new URLSearchParams({ negocio }) : './inicio.html';
}

function pintarPedido() {
  const { id, metodo, entrega, retiro, lineas, totalCentavos, subtotalCentavos } = pedidoSeguimiento;
  const recoger = metodo === 'recoger';
  const nombres = [...new Set(lineas.map(({ negocio }) => negocio.nombre))].join(' · ');
  const cantidad = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  const concepto = recoger ? 'Retiro en el local' : 'Entrega a domicilio';
  const ubicacion = recoger
    ? retiro.puntos.map(({ nombre, direccion }) => [nombre, direccion].filter(Boolean).join(', ')).join(' · ') + ' · ' + horarioRetiro(retiro)
    : [entrega.nombre, entrega.detalle, entrega.indicaciones].filter(Boolean).join(' · ');

  document.body.dataset.metodo = metodo;
  textoSeguimiento('folio-estado', 'PEDIDO ' + folioPedido(id)
    + (recoger ? ' · TAKE OUT' : ' · ENTREGA') + (pedidoSeguimiento.simulado ? ' · SIMULACIÓN' : ''));
  document.querySelector('#opciones-seguimiento-entrega').hidden = recoger;
  mostrarEtapa();
  if (!recoger) mostrarDatosEntrega();
  textoSeguimiento('negocios-pedido', nombres);
  textoSeguimiento('importe-seguimiento', cantidad + (cantidad === 1 ? ' producto · ' : ' productos · ') + precioPedido(totalCentavos));
  document.querySelector('#foto-pedido').src = './assets/' + lineas[0].producto.imagen;
  textoSeguimiento('titulo-recepcion', recoger ? (retiro.puntos.length === 1 ? 'Retiro en ' + retiro.puntos[0].nombre : 'Puntos de retiro') : 'Dirección de entrega');
  textoSeguimiento('ubicacion-recepcion', ubicacion);
  textoSeguimiento('titulo-detalle-pedido', 'Detalle del pedido ' + folioPedido(id));
  textoSeguimiento('metodo-detalle', nombres + ' · ' + concepto);
  textoSeguimiento('ubicacion-detalle', ubicacion);
  textoSeguimiento('subtotal-detalle', precioPedido(subtotalCentavos));
  const descuento = pedidoSeguimiento.descuentoCentavos || 0;
  document.querySelector('#fila-descuento-detalle').hidden = !descuento;
  textoSeguimiento('etiqueta-descuento-detalle', pedidoSeguimiento.cupon?.demo ? 'Descuento de prueba' : 'Descuento');
  textoSeguimiento('descuento-detalle', '−' + precioPedido(descuento));
  textoSeguimiento('total-detalle', precioPedido(totalCentavos));
  const resumen = document.querySelector('#productos-seguimiento');
  const detalle = document.querySelector('#lineas-detalle-pedido');
  resumen.replaceChildren();
  detalle.replaceChildren();

  for (const linea of lineas) {
    const nombre = linea.cantidad + ' × ' + nombreLinea(linea);
    const item = document.createElement('li');
    item.textContent = nombre;
    resumen.append(item);
    const fila = document.createElement('li');
    const titulo = document.createElement('strong');
    titulo.textContent = nombre + ' · ' + precioPedido(linea.importeCentavos);
    const configuracion = document.createElement('p');
    const unitario = linea.precioUnitarioCentavos ?? linea.producto.precioCentavos;
    configuracion.textContent = [
      linea.cantidad > 1 && Number.isSafeInteger(unitario) ? precioPedido(unitario) + ' por unidad' : '',
      linea.extras.join(', ') || 'Sin extras', linea.reserva?.nombre, linea.reserva?.comentarios
    ].filter(Boolean).join(' · ');
    fila.append(titulo, configuracion);
    detalle.append(fila);
  }
  bloquePedido.hidden = false;
}

for (const panel of [panelDetalle]) {
  panel.addEventListener('click', (evento) => {
    if (evento.target !== panel) return;
    const caja = panel.getBoundingClientRect();
    if (evento.clientX < caja.left || evento.clientX > caja.right ||
      evento.clientY < caja.top || evento.clientY > caja.bottom) panel.close();
  });
}

document.querySelector('#abrir-detalle-pedido').addEventListener('click', () => panelDetalle.showModal());
panelDetalle.querySelector('[data-cerrar-panel]').addEventListener('click', () => panelDetalle.close());

const avisoEstadoPedido = document.querySelector('#aviso-estado-pedido');
let tiempoAvisoEstadoPedido;

function mostrarAvisoEstadoPedido() {
  const aviso = tomarAvisoPedidoHam(idSeguimiento);
  if (!aviso) return;
  clearTimeout(tiempoAvisoEstadoPedido);
  avisoEstadoPedido.textContent = aviso;
  tiempoAvisoEstadoPedido = setTimeout(() => { avisoEstadoPedido.textContent = ''; }, 5000);
}

conectarRegresoHam(volverSeguimiento, ['negocio']);

function prepararSeguimiento() {
  if (!perfilCuentaActiva()) return;
  try {
    pedidoSeguimiento = obtenerPedidoConfirmado(idSeguimiento);
    volverSeguimiento.href = rutaPerfilPedido(pedidoSeguimiento);
    if (!pedidoSeguimiento) throw new Error('Pedido no disponible');
    crearEtapas();
    iniciarVistaEntrega();
    pintarPedido();
    mostrarAvisoEstadoPedido();
  } catch {
    bloquePedido.hidden = true;
    document.querySelector('#pedido-no-disponible').hidden = false;
  }
}

prepararSeguimiento();
window.addEventListener('pageshow', (evento) => { if (evento.persisted) prepararSeguimiento(); });

// Sólo se registra en el modo de demostración, fuera de la interfaz de Figma.
if (esDemostracion) {
  window.hamDemoPedido = Object.freeze({
    avanzar() {
      if (!pedidoSeguimiento) return null;
      const nuevo = avanzarEtapaPedido(pedidoSeguimiento.id, pedidoSeguimiento.estado);
      if (nuevo) {
        pedidoSeguimiento = nuevo;
        mostrarEtapa();
        mostrarAvisoEstadoPedido();
        if (pedidoSeguimiento.metodo === "entrega") mostrarDatosEntrega();
      }
      return pedidoSeguimiento.estado;
    }
  });
}

document.querySelector('#contactar-repartidor').addEventListener('click', () => {
  if (seguimientoEntregaActivo?.puedeContactar(datosEntregaActivos)) seguimientoEntregaActivo.contactar();
});
window.addEventListener('pagehide', () => seguimientoEntregaActivo?.desconectar());
window.addEventListener('storage', (evento) => {
  if (evento.key === claveDatosCuenta(CLAVE_AVISOS_PEDIDO) && pedidoSeguimiento) mostrarAvisoEstadoPedido();
  if (evento.key !== claveDatosCuenta(CLAVE_HISTORIAL_PEDIDOS) || !pedidoSeguimiento) return;
  const actualizado = obtenerPedidoConfirmado(idSeguimiento);
  if (!actualizado || actualizado.estado === pedidoSeguimiento.estado) return;
  pedidoSeguimiento = actualizado;
  mostrarEtapa();
  if (actualizado.metodo === 'entrega') mostrarDatosEntrega();
});
