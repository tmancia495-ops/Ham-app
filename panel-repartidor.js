const panelRepartidor = document.querySelector('#panel-repartidor');

const pedidosEjemploRepartidor = [
  { id: '024', comercio: 'LOLO’S', destino: 'CEDiTEC · Nivel 2', cantidad: '2 productos', total: '$4.00' },
  { id: '025', comercio: 'Sweet Place', destino: 'Edificio A · Planta baja', cantidad: '1 producto' }
];
const etapasEjemploRepartidor = ['detalle', 'recogida', 'en-camino', 'entregado'];

function esSecundariaPanelRepartidor(ruta = '') {
  return ruta.includes('/') || ruta === '#jornada-pausada';
}

function esRetrocesoRepartidor(desde, hasta) {
  if (hasta === '#jornada-activa' && jornadaPausadaRepartidor) return true;
  const nivel = (ruta) => {
    const etapa = etapasEjemploRepartidor.indexOf(ruta.split('/')[2]);
    return etapa >= 0 ? etapa + 1 : esSecundariaPanelRepartidor(ruta) ? 1 : 0;
  };
  return nivel(hasta) < nivel(desde);
}

function enlaceRepartidor(ruta, texto, clase = 'accion-panel-repartidor') {
  return '<a class="' + clase + '" href="' + ruta + '">' + texto + '</a>';
}

function vistaRepartidor(titulo, bajada, etiqueta, contenido) {
  return '<header class="cabecera-panel-repartidor"><p>HAM! · REPARTIDORES</p><h1>' + titulo +
    '</h1><p>' + bajada + '</p><small>' + etiqueta + '</small></header>' +
    '<div class="cuerpo-panel-repartidor"><p class="estado-panel-repartidor" role="status"></p>' + contenido + '</div>';
}

function tarjetaPedidoRepartidor(pedido) {
  return '<article class="pedido-panel-repartidor"><span class="insignia-panel-repartidor">Nuevo pedido</span><h3>' +
    pedido.comercio + '</h3><p>Pedido #' + pedido.id + '</p><p class="destino-panel-repartidor"><img src="./assets/repartidor-destino.svg" alt=""> ' +
    pedido.destino + '</p><p>Retiro: Peatonal UCA</p><footer><strong>' + pedido.cantidad +
    '</strong><small>Pedido de ejemplo</small></footer>' +
    enlaceRepartidor('#pedidos/' + pedido.id + '/detalle', 'Ver detalle ›') + '</article>';
}

function inicioPanelRepartidor(pausado) {
  const estado = '<section class="bloque-panel-repartidor"><strong>Estado del repartidor</strong>' +
    '<div class="jornada-panel-repartidor"><strong>' + (pausado ? 'No disponible' : 'Disponible para pedidos de ejemplo') + '</strong>' +
    '<a class="interruptor-panel-repartidor" href="' + (pausado ? '#jornada-activa' : '#jornada-pausada') +
    '" role="switch" aria-label="Disponibilidad de ejemplo" aria-checked="' + !pausado + '"></a></div>' +
    '<p>' + (pausado ? 'Activá tu jornada para explorar los pedidos de ejemplo.' : 'Podés pausar cuando lo necesités.') + '</p></section>';
  const pedidos = pausado
    ? '<h2>Tu jornada está pausada</h2><p>No recibirás solicitudes hasta activarte.</p>'
    : '<h2>Pedidos cerca de vos</h2><p>Nuevas solicitudes de los negocios de la UCA</p>' +
      tarjetaPedidoRepartidor(pedidosEjemploRepartidor[0]) + enlaceRepartidor('#pedidos', 'Ver todos los pedidos ›');
  return vistaRepartidor('¡A repartir!', 'Ponete disponible para recibir pedidos.', 'Tu jornada',
    estado + pedidos + '<h2>Consejos para tu ruta</h2><section class="bloque-panel-repartidor"><strong>Confirmá cada retiro y entrega</strong><p>Así el cliente sabrá dónde va su pedido.</p></section>');
}

function pedidosPanelRepartidor() {
  return vistaRepartidor('Pedidos disponibles', 'Elegí un pedido para comenzar.', 'Solicitudes nuevas',
    '<div class="filtros-panel-repartidor" aria-label="Filtrar pedidos de ejemplo">' +
    ['Todos', 'Cerca de mí', 'Entrega'].map((filtro, i) => '<button type="button" data-filtro-repartidor="' +
      i + '" aria-pressed="' + (i === 0) + '">' + filtro + '</button>').join('') +
    '</div><h2>Pedidos por tomar</h2><p>Disponibles mientras tu estado esté activo.</p><div data-pedidos-ejemplo>' +
    pedidosEjemploRepartidor.map(tarjetaPedidoRepartidor).join('') +
    '</div><p>Los pedidos aparecen aquí cuando son asignables.</p>');
}

function detallePanelRepartidor(pedido, etapa) {
  const ruta = '#pedidos/' + pedido.id + '/';
  const recorrido = '<section class="bloque-panel-repartidor"><strong>Recoger</strong><p>' + pedido.comercio +
    ' · Peatonal UCA</p><strong>Entregar</strong><p>' + pedido.destino + '</p></section>';
  const paso = (titulo, bajada, etiqueta, contenido) => vistaRepartidor(titulo, bajada,
    'Pedido #' + pedido.id + ' · ' + etiqueta, '<p><strong>Pedido de ejemplo</strong></p>' + contenido);
  if (etapa === 'recogida') return paso('¡Pedido aceptado!', 'Tu siguiente parada: ' + pedido.comercio + '.', 'En preparación',
    '<h2>Punto de recogida</h2>' + recorrido + '<h2>Seguimiento de la entrega</h2><ol><li>Pedido aceptado</li><li>Recoger en ' +
    pedido.comercio + '</li><li>Entregar al cliente</li></ol>' + enlaceRepartidor(ruta + 'en-camino', 'Confirmar recogida de ejemplo'));
  if (etapa === 'en-camino') return paso('¡Pedido recogido!', 'Llevá el pedido al punto acordado.', 'En camino',
    '<h2>Destino de entrega</h2>' + recorrido + '<h2>Etapa actual</h2><p>En camino a entregar</p>' +
    enlaceRepartidor(ruta + 'entregado', 'Confirmar entrega de ejemplo'));
  if (etapa === 'entregado') return paso('¡Entrega completada!', '¡Gracias por repartir con Ham!', 'Entregado',
    '<section class="bloque-panel-repartidor"><strong>¡Bien hecho!</strong><p>Terminaste el recorrido de ejemplo.</p></section><h2>Resumen del pedido</h2>' +
    recorrido + enlaceRepartidor('#pedidos', 'Buscar otro pedido'));
  return paso('Detalle del pedido', 'Revisá el recorrido antes de aceptarlo.', 'Disponible',
    '<h2>' + pedido.comercio + '</h2><p>' + pedido.cantidad + '</p><h2>Recorrido del pedido</h2>' + recorrido +
    (pedido.total ? '<h2>Resumen</h2><p>Total de alimentos: ' + pedido.total + '</p>' : '') +
    enlaceRepartidor(ruta + 'recogida', 'Ver recogida de ejemplo') + enlaceRepartidor('#pedidos', 'Volver a pedidos', 'enlace-panel-repartidor'));
}

function gananciasPanelRepartidor(historial) {
  const ejemplo = '<article class="pedido-panel-repartidor"><strong>Pedido #024</strong><p>LOLO’S → CEDiTEC · Nivel 2</p><p>Entregado · Ejemplo</p></article>';
  if (historial) return vistaRepartidor('Historial', 'Revisá las entregas completadas.', 'Actividad registrada',
    '<h2>Entregas</h2>' + ejemplo + '<p>Solo para visualizar el prototipo.</p>' +
    enlaceRepartidor('#ganancias', 'Volver a Mis ganancias', 'enlace-panel-repartidor'));
  return vistaRepartidor('Mis ganancias', 'Consultá tu actividad de repartidor.', 'Resumen personal',
    '<section class="bloque-panel-repartidor"><strong>Registro de ganancias</strong><h3>Por configurar</h3><p>Aún no hay una tarifa por entrega definida para este prototipo.</p><strong>Sin pagos automáticos en Ham!</strong></section>' +
    '<h2>Mi actividad</h2><div class="actividad-panel-repartidor"><p><strong>1</strong> Entrega de ejemplo</p><p><strong>0</strong> Pedidos en curso</p></div>' +
    ejemplo + enlaceRepartidor('#ganancias/historial', 'Ver historial de entregas ›'));
}

function perfilPanelRepartidor() {
  return vistaRepartidor('Mi perfil', 'Administrá tu disponibilidad y tus datos.', 'Cuenta de repartidor',
    '<section class="perfil-panel-repartidor"><span class="avatar-comercio" data-inicial-repartidor></span><div><h3 data-nombre-repartidor>Mi perfil</h3>' +
    enlaceRepartidor('./estado-solicitud.html', 'Estado de mi solicitud ›') + '</div></section>' +
    '<h2>Estado de actividad</h2><section class="bloque-panel-repartidor"><strong>Interfaz de demostración</strong><p>Los pedidos reales aún no están disponibles.</p></section>' +
    '<h2>Configuración</h2><p>Medio de transporte y disponibilidad en tu solicitud.</p>' +
    enlaceRepartidor('./centro-ayuda.html', 'Centro de ayuda ›', 'enlace-panel-repartidor') +
    '<button class="accion-panel-repartidor" type="button" data-salir-repartidor>Cerrar sesión</button>');
}

let cuentaPanelRepartidor;
let rutaPanelRepartidor;
let jornadaPausadaRepartidor = false;
let filtroPanelRepartidor = '0';
const scrollPanelRepartidor = new Map();

function pintarPanelRepartidor(mostrar) {
  const cuenta = perfilCuentaActiva()?.id;
  if (cuenta !== cuentaPanelRepartidor) {
    cuentaPanelRepartidor = cuenta;
    rutaPanelRepartidor = undefined;
    jornadaPausadaRepartidor = false;
    filtroPanelRepartidor = '0';
    scrollPanelRepartidor.clear();
  }
  if (!panelRepartidor.hidden && rutaPanelRepartidor !== undefined) {
    scrollPanelRepartidor.set(rutaPanelRepartidor, panelRepartidor.scrollTop);
  }
  panelRepartidor.hidden = !mostrar;
  if (!mostrar) return;
  const ruta = location.hash;
  const [, numero, etapa] = ruta.split('/');
  const pedido = pedidosEjemploRepartidor.find(({ id }) => id === numero);
  const rol = rolCuentaHam();
  if (ruta === '#perfil') panelRepartidor.innerHTML = perfilPanelRepartidor();
  else if (ruta.startsWith('#ganancias')) panelRepartidor.innerHTML = gananciasPanelRepartidor(ruta === '#ganancias/historial');
  else if (ruta.startsWith('#pedidos')) panelRepartidor.innerHTML = pedido && etapasEjemploRepartidor.includes(etapa)
    ? detallePanelRepartidor(pedido, etapa) : pedidosPanelRepartidor();
  else {
    if (ruta === '#jornada-pausada') jornadaPausadaRepartidor = true;
    if (ruta === '#jornada-activa') jornadaPausadaRepartidor = false;
    panelRepartidor.innerHTML = inicioPanelRepartidor(jornadaPausadaRepartidor);
  }
  if (panelRepartidor.querySelector('[data-pedidos-ejemplo]')) aplicarFiltroPanelRepartidor();
  const estado = { courier_active: 'Solicitud aprobada', courier_rejected: 'Solicitud rechazada' }[rol] || 'Solicitud en revisión';
  panelRepartidor.querySelector('.estado-panel-repartidor').textContent = estado + ' · DEMO';
  if (ruta === '#perfil') {
    const nombre = perfilCuentaActiva()?.perfil.nombre?.trim() || 'Mi perfil';
    panelRepartidor.querySelector('[data-nombre-repartidor]').textContent = nombre;
    panelRepartidor.querySelector('[data-inicial-repartidor]').textContent = Array.from(nombre)[0].toUpperCase();
    if (esRepartidorHam()) panelRepartidor.querySelector('[data-salir-repartidor]').before(crearOpcionDejarRolHam('courier'));
  }
  rutaPanelRepartidor = ruta;
  panelRepartidor.scrollTop = scrollPanelRepartidor.get(ruta) || 0;
}

function aplicarFiltroPanelRepartidor() {
  for (const boton of panelRepartidor.querySelectorAll('[data-filtro-repartidor]')) {
    boton.setAttribute('aria-pressed', String(boton.dataset.filtroRepartidor === filtroPanelRepartidor));
  }
  const pedidos = filtroPanelRepartidor === '1' ? pedidosEjemploRepartidor.slice(0, 1) : pedidosEjemploRepartidor;
  panelRepartidor.querySelector('[data-pedidos-ejemplo]').innerHTML = pedidos.map(tarjetaPedidoRepartidor).join('');
}

panelRepartidor.addEventListener('click', (evento) => {
  const filtro = evento.target.closest('[data-filtro-repartidor]');
  if (filtro) {
    filtroPanelRepartidor = filtro.dataset.filtroRepartidor;
    aplicarFiltroPanelRepartidor();
  }
  if (evento.target.closest('[data-salir-repartidor]')) dialogoSalida.showModal();
});