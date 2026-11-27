const parametrosProducto = new URLSearchParams(location.search);
const fichaDetalle = obtenerProducto(parametrosProducto.get('negocio'), parametrosProducto.get('producto'));
const idLineaEditada = parametrosProducto.get('linea');
const destinoCarritoDetalle = new URL('./carrito.html', location.href);
const desdeInicioTop = parametrosProducto.get('origen') === 'top';
const origenCarritoDetalle = obtenerProducto(parametrosProducto.get('origenNegocio'), parametrosProducto.get('origenProducto'));
if (origenCarritoDetalle) {
  destinoCarritoDetalle.searchParams.set('negocio', origenCarritoDetalle.negocio.id);
  destinoCarritoDetalle.searchParams.set('producto', origenCarritoDetalle.producto.id);
}
let lineaEditada;
if (idLineaEditada && fichaDetalle) {
  try {
    lineaEditada = leerPedido().lineas.find((linea) => linea.id === idLineaEditada
      && linea.negocio === fichaDetalle.negocio.id && linea.producto === fichaDetalle.producto.id);
  } catch {
    // El aviso de edición aparece si no se puede recuperar la línea.
  }
}
const formularioDetalle = document.querySelector('#formulario-producto');
const estadoDetalle = document.querySelector('#estado-producto');
const campoCantidad = document.querySelector('#cantidad-producto');
const extraOpciones = document.querySelector('#extras-producto');
const botonMenos = document.querySelector('#menos-producto');
const botonMas = document.querySelector('#mas-producto');
const anadir = document.querySelector('#anadir-producto');
let cantidadDetalle = 1;
let metodoDetalle = 'recoger';
const metodosDetalle = [...document.querySelectorAll('.selector-metodo-producto [data-metodo]')];
const entregaDetalle = document.querySelector('#direccion-producto');
const reservaDetalle = document.querySelector('.reserva-producto');
const nombreDetalle = document.querySelector('#nombre-reserva');
const comentariosDetalle = document.querySelector('#comentarios-reserva');
const horaDetalle = document.querySelector('#hora-reserva');
const minutosDetalle = document.querySelector('#minuto-reserva');
const periodoDetalle = document.querySelector('#periodo-reserva');
const reservaGuardada = lineaEditada?.reserva;
const horariosDetalle = {
  entrega: reservaGuardada?.horarios?.entrega || '01:00 AM',
  recoger: reservaGuardada?.horarios?.recoger || (reservaGuardada?.metodo !== 'entrega' && reservaGuardada?.hora) || '01:00 AM'
};
if (reservaGuardada?.metodo === 'entrega' && reservaGuardada.hora) {
  horariosDetalle.entrega = reservaGuardada.hora;
}

function horaVisibleDetalle() {
  return horaDetalle.value + ':' + minutosDetalle.value + ' ' + periodoDetalle.value;
}

function pintarHoraDetalle() {
  const hora = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(horariosDetalle[metodoDetalle]);
  if (!hora) return;
  horaDetalle.value = hora[1];
  minutosDetalle.value = hora[2];
  periodoDetalle.value = hora[3];
}

function pintarMetodoDetalle() {
  const entrega = metodoDetalle === 'entrega';
  entregaDetalle.hidden = !entrega;
  document.querySelector('#etiqueta-hora-producto').textContent = entrega
    ? 'Hora para recibir' : 'Hora para recoger';
  pintarHoraDetalle();
  metodosDetalle.forEach((boton) => {
    boton.setAttribute('aria-pressed', String(boton.dataset.metodo === metodoDetalle));
  });
}

for (const boton of metodosDetalle) {
  boton.addEventListener('click', () => {
    if (metodoDetalle === boton.dataset.metodo) return;
    horariosDetalle[metodoDetalle] = horaVisibleDetalle();
    metodoDetalle = boton.dataset.metodo;
    pintarMetodoDetalle();
    if (fichaDetalle?.producto.precioCentavos != null) estadoDetalle.textContent = '';
    if (idLineaEditada) return;
    try {
      const pedido = leerPedido();
      pedido.metodo = metodoDetalle;
      guardarPedido(pedido);
    } catch {
      estadoDetalle.textContent = 'No se pudo guardar el método de entrega.';
    }
  });
}

function opcionesHora(id, cantidad, primero) {
  const selector = document.getElementById(id);
  for (let i = primero; i < primero + cantidad; i++) {
    const texto = String(i).padStart(2, '0');
    selector.add(new Option(texto, texto));
  }
}

function cambiarCantidadDetalle(cambio) {
  cantidadDetalle = Math.max(1, cantidadDetalle + cambio);
  campoCantidad.value = cantidadDetalle;
  botonMenos.disabled = cantidadDetalle === 1;
}

if (fichaDetalle && (!idLineaEditada || lineaEditada)) {
  const { negocio, producto } = fichaDetalle;
  document.querySelector('#favorito-producto').append(
    crearCorazon('producto', producto.id, producto.nombre, negocio.id)
  );
  document.title = producto.nombre + ' · Ham!';
  document.querySelector('#local-producto').textContent = negocio.nombre;
  if (['rest-004', 'rest-005'].includes(negocio.id)) {
    document.querySelector('.selector-metodo-producto [data-metodo="recoger"]').lastChild.textContent = 'Recoger';
  }
  document.querySelector('#volver-producto').href = idLineaEditada ? destinoCarritoDetalle.href : desdeInicioTop ? './inicio.html' : rutaNegocioDetalle(negocio.id);
  document.querySelector('#nombre-producto').textContent = producto.nombre;
  const categoria = document.querySelector('#categoria-producto');
  categoria.textContent = producto.categoria;
  categoria.hidden = !producto.categoria;
  document.querySelector('#descripcion-detalle').textContent = producto.descripcionDetalle || producto.descripcion;
  document.querySelector('#precio-detalle').textContent = producto.precio;
  const foto = document.querySelector('#foto-detalle');
  foto.src = './assets/' + (producto.imagenDetalle || producto.imagen);
  foto.classList.toggle('foto-tradicional', Boolean(producto.imagenDetalle && !producto.fotoDetalle));
  if (producto.fotoDetalle) {
    const [ancho, alto, centro, arriba, imagenAncho = 100, imagenAlto = 100, izquierda = 0, imagenArriba = 0] = producto.fotoDetalle;
    const marco = foto.parentElement;
    marco.classList.add('foto-detalle-catalogo');
    for (const [variable, valor] of Object.entries({
      ancho: ancho / 370 * 100 + '%', alto: alto + 'px', centro: centro + 'px', arriba: arriba + 'px',
      'imagen-ancho': imagenAncho + '%', 'imagen-alto': imagenAlto + '%',
      'imagen-izquierda': izquierda + '%', 'imagen-arriba': imagenArriba + '%'
    })) marco.style.setProperty('--detalle-' + variable, valor);
    const pantalla = formularioDetalle.closest('main');
    pantalla.dataset.nodeId = producto.nodo;
    pantalla.dataset.negocioId = negocio.id;
  }
  document.querySelector('#estrellas-producto').hidden = !producto.valoracion;

  document.querySelector('#grupo-extras').hidden = !producto.extras.length;
  for (const extra of producto.extras) {
    const etiqueta = document.createElement('label');
    const casilla = document.createElement('input');
    casilla.type = 'checkbox';
    casilla.value = nombreExtraPedido(extra);
    casilla.checked = lineaEditada?.extras.includes(casilla.value) || false;
    const texto = document.createElement('span');
    texto.textContent = casilla.value;
    etiqueta.append(casilla, texto);
    extraOpciones.append(etiqueta);
  }

  opcionesHora('hora-reserva', 12, 1);
  opcionesHora('minuto-reserva', 60, 0);
  if (lineaEditada) {
    cantidadDetalle = lineaEditada.cantidad;
    cambiarCantidadDetalle(0);
    anadir.textContent = 'Guardar cambios';
    nombreDetalle.value = reservaGuardada?.nombre || '';
    comentariosDetalle.value = reservaGuardada?.comentarios || '';
  }
  formularioDetalle.hidden = false;
  if (producto.precioCentavos == null) {
    anadir.disabled = true;
    estadoDetalle.textContent = 'Combo es un adicional de ' + producto.precio + '. Falta definir a qué producto se aplica.';
  }

  botonMenos.addEventListener('click', () => cambiarCantidadDetalle(-1));
  botonMas.addEventListener('click', () => cambiarCantidadDetalle(1));
  formularioDetalle.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (anadir.disabled) return;
    if (!perfilCuentaActiva()) { location.assign('./iniciar-sesion.html'); return; }
    const nombre = nombreDetalle.value.trim();
    if (!nombre) {
      estadoDetalle.textContent = 'Escribe tu nombre para continuar.';
      nombreDetalle.focus();
      return;
    }

    const fecha = reservaGuardada?.metodo === metodoDetalle && reservaGuardada.fecha >= fechaLocalPedido()
      ? reservaGuardada.fecha : fechaLocalPedido();
    const hora24 = String(Number(horaDetalle.value) % 12 + (periodoDetalle.value === 'PM' ? 12 : 0)).padStart(2, '0')
      + ':' + minutosDetalle.value;
    const errorHora = errorReservaPedido(fecha, hora24);
    if (errorHora) {
      estadoDetalle.textContent = 'Elige una hora futura para la fecha ' + fecha + '.';
      horaDetalle.focus();
      return;
    }

    const direccion = metodoDetalle === 'entrega' ? direccionActiva() : null;
    if (metodoDetalle === 'entrega' && !direccion) {
      estadoDetalle.textContent = 'Selecciona una dirección para continuar con Entrega.';
      abrirDirecciones(entregaDetalle.querySelector('button'));
      return;
    }

    anadir.disabled = true;
    horariosDetalle[metodoDetalle] = horaVisibleDetalle();
    const reserva = {
      metodo: metodoDetalle, nombre, fecha, hora: horariosDetalle[metodoDetalle], hora24,
      comentarios: comentariosDetalle.value.trim(), horarios: { ...horariosDetalle }
    };

    try {
      const cambios = {
        negocio: negocio.id, producto: producto.id, cantidad: cantidadDetalle,
        extras: [...extraOpciones.querySelectorAll(':checked')].map(({ value }) => value), reserva, direccion
      };
      if (lineaEditada) {
        editarLineaPedido(idLineaEditada, cambios, metodoDetalle);
        navegarPantallaHam(destinoCarritoDetalle, { volver: true, reemplazar: true });
        return;
      }
      agregarAlPedido(cambios, metodoDetalle);
      navegarPantallaHam('./carrito.html?' + new URLSearchParams({ negocio: negocio.id, producto: producto.id, ...(desdeInicioTop && { origen: 'top' }) }));
    } catch (error) {
      estadoDetalle.textContent = error instanceof DOMException ? 'No se pudo guardar el pedido. Inténtalo de nuevo.' : error.message;
      anadir.disabled = false;
    }
  });
} else {
  const aviso = document.querySelector('#producto-ausente');
  aviso.hidden = false;
  if (idLineaEditada) {
    aviso.textContent = 'Este artículo ya no está en el carrito.';
    document.querySelector('#volver-producto').href = destinoCarritoDetalle.href;
  }
}

conectarRegresoHam(document.querySelector('#volver-producto'), ['negocio']);

function rutaNegocioDetalle(id) {
  const parametros = new URLSearchParams({ negocio: id });
  const origen = new URLSearchParams(location.search).get('origen');
  if (origen) parametros.set('origen', origen);
  return './perfil-negocio.html?' + parametros;
}

reservaDetalle.addEventListener('input', () => {
  horariosDetalle[metodoDetalle] = horaVisibleDetalle();
  if (fichaDetalle?.producto.precioCentavos != null) estadoDetalle.textContent = '';
});

document.addEventListener('ham:direccion-seleccionada', () => {
  if (estadoDetalle.textContent === 'Selecciona una dirección para continuar con Entrega.') {
    estadoDetalle.textContent = '';
  }
});

window.addEventListener('pageshow', () => {
  try {
    const guardado = reservaGuardada?.metodo || leerPedido().metodo;
    metodoDetalle = guardado === 'entrega' ? 'entrega' : 'recoger';
  } catch {
    metodoDetalle = 'recoger';
  }
  pintarMetodoDetalle();
  if (fichaDetalle?.producto.precioCentavos != null) anadir.disabled = false;
});

if (window.visualViewport) {
  const vistaEdicion = window.visualViewport;
  function ajustarTecladoEdicion() {
    const campo = document.activeElement;
    const editando = reservaDetalle.contains(campo) && campo.matches('input');
    const fondoMarco = document.body.getBoundingClientRect().bottom;
    const espacio = editando && vistaEdicion.scale <= 1.05
      ? Math.max(0, fondoMarco - vistaEdicion.height - vistaEdicion.offsetTop) : 0;
    document.body.style.setProperty('--teclado-edicion', espacio + 'px');
    if (espacio) campo.scrollIntoView({ block: 'nearest' });
  }
  vistaEdicion.addEventListener('resize', ajustarTecladoEdicion);
  reservaDetalle.addEventListener('focusin', ajustarTecladoEdicion);
  reservaDetalle.addEventListener('focusout', () => {
    requestAnimationFrame(ajustarTecladoEdicion);
  });
}
