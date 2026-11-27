const parametrosCarrito = new URLSearchParams(location.search);
const fichaOrigen = obtenerProducto(parametrosCarrito.get('negocio'), parametrosCarrito.get('producto'));
const volverCarrito = document.querySelector('#volver-carrito');
const contenidoCarrito = document.querySelector('#contenido-carrito');
const avisoCarrito = document.querySelector('#estado-carrito');
const lineasCarrito = document.querySelector('#lineas-carrito');
const controlesMetodo = [...document.querySelectorAll('[data-metodo]')];
const horaRetiro = document.querySelector('#hora-retiro');
const fechaRetiro = document.querySelector('#fecha-retiro');
const errorRetiro = document.querySelector('#error-retiro');
const continuarCarrito = document.querySelector('#continuar-carrito');
let pedidoActual;
let totalCarritoMostrado;
let subtotalCuponCarrito;
const seccionCuponCarrito = document.querySelector('#cupon-carrito');
const selectorCuponCarrito = document.querySelector('#elegir-cupon-carrito');
const aplicarCuponCarrito = document.querySelector('#aplicar-cupon-carrito');
const retirarCuponCarrito = document.querySelector('#retirar-cupon-carrito');
const avisoCuponCarrito = document.querySelector('#aviso-cupon-carrito');


function pintarCuponCarrito(subtotal) {
  subtotalCuponCarrito = subtotal;
  const guardados = cuponesGuardados();
  const disponibles = catalogoCupones().filter((cupon) => guardados.includes(cupon.id));
  const aplicado = pedidoActual.cuponId ? resolverCuponCarrito(pedidoActual.cuponId, pedidoActual, subtotal) : null;
  if (aplicado?.error) {
    const actualizado = { ...pedidoActual };
    delete actualizado.cuponId;
    delete actualizado.confirmacionId;
    guardarPedido(actualizado);
    pedidoActual = actualizado;
    avisoCuponCarrito.textContent = 'Se retiró el código. ' + aplicado.error;
  }
  const opcionInicial = new Option('Selecciona un código', '');
  opcionInicial.disabled = true;
  selectorCuponCarrito.replaceChildren(opcionInicial, ...disponibles.map((cupon) =>
    new Option(cupon.codigo + (cupon.demo ? ' · prueba' : ''), cupon.id)));
  selectorCuponCarrito.value = pedidoActual.cuponId || '';
  selectorCuponCarrito.disabled = disponibles.length === 0;
  aplicarCuponCarrito.disabled = !selectorCuponCarrito.value || selectorCuponCarrito.value === pedidoActual.cuponId;
  aplicarCuponCarrito.textContent = pedidoActual.cuponId ? 'Sustituir' : 'Aplicar';
  retirarCuponCarrito.hidden = !pedidoActual.cuponId;
  seccionCuponCarrito.hidden = !disponibles.length && !avisoCuponCarrito.textContent;
  const descuento = aplicado?.descuento || 0;
  document.querySelector('#fila-descuento-carrito').hidden = !descuento;
  document.querySelector('#etiqueta-descuento-carrito').textContent = aplicado?.cupon?.demo ? 'Descuento de prueba' : 'Descuento';
  document.querySelector('#descuento-carrito').textContent = '−' + precioPedido(descuento);
  return subtotal === null ? null : (aplicado?.total ?? subtotal);
}

selectorCuponCarrito.addEventListener('change', () => {
  aplicarCuponCarrito.disabled = !selectorCuponCarrito.value || selectorCuponCarrito.value === pedidoActual.cuponId;
});

aplicarCuponCarrito.addEventListener('click', () => {
  try {
    const id = selectorCuponCarrito.value;
    const resultado = resolverCuponCarrito(id, leerPedido(), subtotalCuponCarrito);
    if (resultado.error) { avisoCuponCarrito.textContent = resultado.error; return; }
    cambiarPedido((pedido) => { pedido.cuponId = id; });
  } catch {
    avisoCuponCarrito.textContent = 'No se pudo aplicar el código.';
  }
});

retirarCuponCarrito.addEventListener('click', () => {
  cambiarPedido((pedido) => { delete pedido.cuponId; });
  selectorCuponCarrito.focus();
});

if (fichaOrigen) {
  const retorno = new URL(rutaDetalle(fichaOrigen.negocio.id, fichaOrigen.producto.id), location.href);
  if (parametrosCarrito.get('origen') === 'top') retorno.searchParams.set('origen', 'top');
  volverCarrito.href = retorno.href;
}

function encabezadoLocal(negocio, cantidad) {
  const bloque = document.createElement('header');
  bloque.className = 'resumen-local';
  const insignia = document.createElement('div');
  const circulo = document.createElement('img');
  circulo.src = './assets/carrito-local.svg';
  circulo.alt = '';
  const inicial = document.createElement('span');
  inicial.textContent = negocio.nombre[0];
  insignia.append(circulo, inicial);
  const texto = document.createElement('section');
  const nombre = document.createElement('h2');
  nombre.textContent = negocio.nombre;
  const total = document.createElement('p');
  total.textContent = cantidad + (cantidad === 1 ? ' producto en tu pedido' : ' productos en tu pedido');
  texto.append(nombre, total);
  bloque.append(insignia, texto);
  return bloque;
}

function renderizarCarrito() {
  const grupos = new Map();
  let total = 0;
  let preciosPendientes = false;
  lineasCarrito.replaceChildren();

  pedidoActual.lineas.forEach((linea) => {
    const ficha = obtenerProducto(linea.negocio, linea.producto);
    if (!ficha) {
      preciosPendientes = true;
      const fila = document.createElement('p');
      fila.className = 'linea-no-disponible';
      fila.textContent = 'Un artículo del carrito ya no está disponible. ';
      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.textContent = 'Eliminar';
      quitar.addEventListener('click', () => eliminarLinea(linea.id));
      fila.append(quitar);
      lineasCarrito.append(fila);
      return;
    }
    const { negocio, producto } = ficha;
    const fila = document.querySelector('#fila-carrito').content.firstElementChild.cloneNode(true);
    fila.dataset.linea = linea.id;
    const destino = new URL(rutaDetalle(negocio.id, producto.id, linea.id), location.href);
    if (fichaOrigen) {
      destino.searchParams.set('origenNegocio', fichaOrigen.negocio.id);
      destino.searchParams.set('origenProducto', fichaOrigen.producto.id);
    }
    const quitar = fila.querySelector('.quitar-carrito');
    quitar.setAttribute('aria-label', 'Eliminar ' + producto.nombre);
    quitar.addEventListener('click', () => eliminarLinea(linea.id));
    const foto = fila.querySelector('.foto-carrito');
    foto.href = destino;
    foto.setAttribute('aria-label', producto.nombre);
    foto.querySelector('img').src = './assets/' + producto.imagen;
    const nombre = fila.querySelector('.nombre-carrito');
    nombre.textContent = producto.nombreCarrito || [producto.categoria, producto.nombre].filter(Boolean).join(' ');
    nombre.href = destino;
    fila.querySelector('.extras-carrito').textContent = linea.extras.join(', ') || 'Sin extras';
    if (linea.reserva) {
      const reserva = fila.querySelector('.reserva-carrito');
      const { nombre, hora, fecha, comentarios, metodo } = linea.reserva;
      const horario = hora && metodo
        ? (metodo === 'entrega' ? 'Recepción solicitada: ' : 'Hora de recogida elegida: ') + [fecha, hora].filter(Boolean).join(' ')
        : hora;
      reserva.textContent = [nombre, horario, comentarios].filter(Boolean).join(' · ');
      reserva.hidden = false;
    }
    fila.querySelector('output').value = linea.cantidad;
    const precio = calcularPrecioLinea(producto, linea);
    const precioPendiente = !precio || precio.pendiente;
    preciosPendientes ||= precioPendiente;
    const unitario = fila.querySelector('.precio-unitario-carrito');
    unitario.hidden = !precio || (!precioPendiente && linea.cantidad === 1);
    unitario.textContent = precio ? precioPedido(precio.unitario) + (precioPendiente ? ' conocidos por unidad' : ' por unidad') : '';
    const importe = precio?.subtotal ?? 0;
    fila.querySelector('.precio-carrito').textContent = precioPendiente ? 'Precio pendiente' : precioPedido(importe);
    fila.querySelectorAll('[data-cambio]').forEach((boton) => {
      if (boton.dataset.cambio === '-1' && linea.cantidad === 1) {
        boton.setAttribute('aria-label', 'Eliminar ' + producto.nombre);
      }
      boton.addEventListener('click', () => actualizarCantidad(linea.id, Number(boton.dataset.cambio)));
    });
    total += importe;
    if (!grupos.has(negocio.id)) grupos.set(negocio.id, { negocio, cantidad: 0, filas: [] });
    const grupo = grupos.get(negocio.id);
    grupo.cantidad += linea.cantidad;
    grupo.filas.push(fila);
  });

  for (const { negocio, cantidad, filas } of grupos.values()) {
    lineasCarrito.append(encabezadoLocal(negocio, cantidad), ...filas);
  }

  const hayArticulos = pedidoActual.lineas.length > 0;
  if (hayArticulos) {
    history.replaceState({ ...history.state, hamLineasCarrito: pedidoActual.lineas.map(({ id }) => id) }, '');
  }
  totalCarritoMostrado = pintarCuponCarrito(preciosPendientes ? null : total);
  document.querySelector('#etiqueta-subtotal').textContent = preciosPendientes ? 'Subtotal conocido' : 'Subtotal';
  document.querySelector('#precios-pendientes').hidden = !preciosPendientes;
  contenidoCarrito.hidden = !hayArticulos;
  document.querySelector('#carrito-vacio').hidden = hayArticulos;
  document.querySelector('#subtotal-carrito').textContent = precioPedido(total);
  document.querySelector('#total-carrito').textContent = preciosPendientes ? 'Pendiente' : precioPedido(totalCarritoMostrado);
  continuarCarrito.textContent = 'Continuar · ' + (preciosPendientes ? 'Importe pendiente' : precioPedido(totalCarritoMostrado));
  document.querySelector('#retiro-carrito').hidden = pedidoActual.metodo !== 'recoger';
  document.querySelector('#direccion-carrito').hidden = pedidoActual.metodo !== 'entrega';
  controlesMetodo.forEach((boton) => boton.setAttribute('aria-pressed', String(boton.dataset.metodo === pedidoActual.metodo)));
  const hoy = fechaLocalPedido();
  fechaRetiro.min = hoy;
  fechaRetiro.value = pedidoActual.fechaRetiro || hoy;
  horaRetiro.value = pedidoActual.retiro || '';
  const fecha = new Date(fechaRetiro.value + 'T12:00');
  const texto = new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'short' }).format(fecha);
  document.querySelector('#fecha-retiro-visible').textContent = fechaRetiro.value === hoy ? 'Hoy · ' + texto : texto;
}

function cambiarPedido(cambio) {
  try {
    const candidato = leerPedido();
    cambio(candidato);
    delete candidato.confirmacionId;
    guardarPedido(candidato);
    pedidoActual = candidato;
    avisoCarrito.textContent = '';
    avisoCuponCarrito.textContent = '';
    renderizarCarrito();
  } catch {
    avisoCarrito.textContent = 'No se pudieron guardar los cambios.';
  }
}

function eliminarLinea(id) {
  cambiarPedido((pedido) => { pedido.lineas = pedido.lineas.filter((linea) => linea.id !== id); });
  if (!pedidoActual.lineas.length) document.querySelector('#carrito-vacio a').focus({ preventScroll: true });
}

function actualizarCantidad(id, cambio) {
  cambiarPedido((pedido) => {
    const linea = pedido.lineas.find((actual) => actual.id === id);
    if (!linea) return;
    const siguiente = linea.cantidad + cambio;
    if (siguiente <= 0) pedido.lineas = pedido.lineas.filter((actual) => actual.id !== id);
    else linea.cantidad = siguiente;
  });
  const fila = [...lineasCarrito.querySelectorAll('[data-linea]')].find((actual) => actual.dataset.linea === id);
  if (fila) fila.querySelector('[data-cambio="' + cambio + '"]').focus({ preventScroll: true });
  else if (!pedidoActual.lineas.length) document.querySelector('#carrito-vacio a').focus({ preventScroll: true });
}

controlesMetodo.forEach((boton) => boton.addEventListener('click', () => {
  errorRetiro.textContent = '';
  cambiarPedido((pedido) => { pedido.metodo = boton.dataset.metodo; });
}));

fechaRetiro.addEventListener('click', () => {
  try { fechaRetiro.showPicker?.(); } catch { /* El navegador ofrece el control nativo. */ }
});

for (const control of [fechaRetiro, horaRetiro]) {
  control.addEventListener('change', () => {
    const fecha = fechaRetiro.value;
    const hora = horaRetiro.value;
    const error = errorReservaPedido(fecha, hora);
    cambiarPedido((pedido) => {
      pedido.fechaRetiro = fecha >= fechaLocalPedido() ? fecha : fechaLocalPedido();
      pedido.retiro = error ? '' : hora;
    });
    errorRetiro.textContent = error;
  });
}

function pintarHistorialCarrito() {
  const historial = document.querySelector('#historial-carrito');
  const lista = historial.querySelector('ul');
  const confirmados = leerPedidosConfirmados();
  historial.hidden = confirmados.length === 0;
  lista.replaceChildren();
  for (const pedido of [...confirmados].reverse()) {
    const elemento = document.createElement('li');
    const enlace = document.createElement('a');
    const fecha = new Intl.DateTimeFormat('es-SV', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(pedido.creadoEn));
    enlace.href = rutaSeguimiento(pedido.id);
    enlace.textContent = folioPedido(pedido.id) + ' · ' + fecha + ' · ' + precioPedido(pedido.totalCentavos);
    elemento.append(enlace);
    lista.append(elemento);
  }
}

continuarCarrito.addEventListener('click', async () => {
  if (continuarCarrito.disabled || !pedidoActual) return;
  const direccion = direccionActiva();
  if (pedidoActual.metodo === 'entrega' && !direccion) {
    abrirDirecciones(document.querySelector('#direccion-carrito button'));
    return;
  }

  if (totalCarritoMostrado === null) {
    avisoCarrito.textContent = 'Revisa los artículos o extras con precio pendiente.';
    document.querySelector('#precios-pendientes').scrollIntoView({ block: 'center' });
    return;
  }
  if (pedidoActual.metodo === 'recoger') {
    const error = errorReservaPedido(fechaRetiro.value, horaRetiro.value);
    if (error) {
      errorRetiro.textContent = error;
      (error.includes('fecha') ? fechaRetiro : horaRetiro).focus();
      return;
    }
  }
  continuarCarrito.disabled = true;
  try {
    const totalVisto = totalCarritoMostrado;
    const cuponVisto = pedidoActual.cuponId;
    const confirmar = () => confirmarPedidoLocal(direccion, totalVisto, cuponVisto);
    const confirmado = navigator.locks
      ? await navigator.locks.request(claveDatosCuenta(CLAVE_HISTORIAL_PEDIDOS), confirmar)
      : confirmar();
    navegarPantallaHam(rutaSeguimiento(confirmado.id), { reemplazar: true });
  } catch (error) {
    pedidoActual = leerPedido();
    renderizarCarrito();
    avisoCarrito.textContent = error instanceof DOMException ? 'No se pudo guardar el pedido. Inténtalo de nuevo.' : error.message;
    if (pedidoActual.metodo === 'recoger' && !pedidoActual.retiro) horaRetiro.focus();
    continuarCarrito.disabled = false;
  }
});

conectarRegresoHam(volverCarrito, ['negocio', 'producto']);

function prepararCarrito(retorno) {
  if (!perfilCuentaActiva()) return;
  try {
    pedidoActual = leerPedido();

    const lineasAnteriores = history.state?.hamLineasCarrito;
    if (retorno && !pedidoActual.lineas.length && lineasAnteriores?.length) {
      const confirmado = leerPedidosConfirmados().find((pedido) =>
        pedido.lineas.some(({ lineaId }) => lineasAnteriores.includes(lineaId))
      );
      if (confirmado) {
        const negocio = negocioDelPedido(confirmado);
        navegarPantallaHam(negocio ? './perfil-negocio.html?' + new URLSearchParams({ negocio }) : './inicio.html', { volver: true, reemplazar: true });
        return;
      }
    }
    continuarCarrito.disabled = false;
    renderizarCarrito();
    pintarHistorialCarrito();
  } catch {
    avisoCarrito.textContent = 'No se pudo leer el carrito local.';
  }
}

prepararCarrito(performance.getEntriesByType('navigation')[0]?.type === 'back_forward');
window.addEventListener('pageshow', (evento) => { if (evento.persisted) prepararCarrito(true); });
