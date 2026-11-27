const parametrosNegocio = new URLSearchParams(location.search);
const idNegocio = parametrosNegocio.get('negocio');
const negocioActual = Object.hasOwn(datosNegocios, idNegocio) ? datosNegocios[idNegocio] : undefined;
const tituloNegocio = document.querySelector('#titulo-negocio');
const volverNegocio = document.querySelector('#volver-negocio');
const avisoNegocio = document.querySelector('#aviso-negocio');
const desdeBuscar = parametrosNegocio.get('origen') === 'buscar';

volverNegocio.href = desdeBuscar ? './inicio.html#buscar' : './inicio.html';
if (parametrosNegocio.get('origen') === 'favoritos') volverNegocio.href = './favoritos.html';
const fichaFavoritaNegocio = negocioActual || fichaEstablecimientoInicio(idNegocio);
if (fichaFavoritaNegocio) {
  document.querySelector('#favorito-negocio').append(
    crearCorazon('establecimiento', idNegocio, fichaFavoritaNegocio.nombre)
  );
}

let regresoPorHistorial = false;
try {
  regresoPorHistorial = sessionStorage.getItem('ham.destinoNegocio') === location.href;
  if (regresoPorHistorial) sessionStorage.removeItem('ham.destinoNegocio');
} catch {
  // Volver conserva el destino por medio del enlace.
}

if (regresoPorHistorial && history.length > 1) {
  volverNegocio.addEventListener('click', (evento) => {
    if (!esActivacionNormal(evento)) return;
    evento.preventDefault();
    history.back();
  });
}

conectarRegresoHam(volverNegocio, ['origen']);

function elegirProducto(producto) {
  const plantilla = document.querySelector('#plantilla-producto');
  const item = plantilla.content.firstElementChild.cloneNode(true);
  const estructura = item.firstElementChild;
  // Cuando exista el detalle, añade ruta a la ficha del producto en datos-negocios.js.
  const control = document.createElement(producto.ruta ? 'a' : 'button');
  control.className = estructura.className;
  control.dataset.productoId = producto.id;
  control.append(...estructura.childNodes);
  estructura.replaceWith(control);

  const imagen = control.querySelector('img');
  imagen.src = './assets/' + (producto.imagenCard || producto.imagen);
  imagen.style.setProperty('--recorte-foto', producto.recorte || '.34%');
  if (producto.fotoCard) {
    const [ancho, alto, izquierda, arriba] = producto.fotoCard;
    imagen.classList.add('foto-card-catalogo');
    imagen.style.setProperty('--foto-ancho', ancho + '%');
    imagen.style.setProperty('--foto-alto', alto + '%');
    imagen.style.setProperty('--foto-izquierda', izquierda + '%');
    imagen.style.setProperty('--recorte-foto', arriba + '%');
  }
  control.querySelector('small').textContent = negocioActual.nombre;
  control.querySelector('strong').textContent = producto.nombre;
  control.querySelector('.descripcion-producto').textContent = producto.descripcion;
  control.querySelector('.precio-producto').textContent = producto.precio;

  if (producto.ruta) {
    const destino = new URL(producto.ruta, location.href);
    destino.searchParams.set('negocio', negocioActual.id);
    destino.searchParams.set('producto', producto.id);
    if (parametrosNegocio.has('origen')) destino.searchParams.set('origen', parametrosNegocio.get('origen'));
    control.href = destino.href;
    control.addEventListener('click', (evento) => {
      if (!esActivacionNormal(evento)) return;
      history.replaceState({ ...history.state, hamScrollCatalogo: tituloNegocio.closest('main').scrollTop }, '');
    });
  } else {
    control.type = 'button';
    control.addEventListener('click', () => {
      avisoNegocio.textContent = producto.nombre + ' · ' + producto.precio + '. Detalle pendiente.';
    });
  }
  item.append(crearCorazon('producto', producto.id, producto.nombre, negocioActual.id));
  return item;
}

if (negocioActual) {
  if (negocioActual.nodoCatalogo) tituloNegocio.closest('main').dataset.nodeId = negocioActual.nodoCatalogo;
  tituloNegocio.textContent = negocioActual.nombre;
  document.title = negocioActual.nombre + ' · Ham!';
  tituloNegocio.closest('main').dataset.negocioId = negocioActual.id;
  document.querySelector('#direccion-negocio').textContent = negocioActual.direccionCompleta || negocioActual.nombre + ', ' + negocioActual.direccion;
  const promocion = document.querySelector('.promocion-negocio');
  // Una copia anterior del HTML puede conservar el indicador decorativo.
  promocion.querySelectorAll('.indicadores-negocio, img[src$="/negocio-indicadores.svg"]')
    .forEach((indicador) => indicador.remove());
  promocion.hidden = !negocioActual.promocion;
  if (negocioActual.promocion) {
    document.querySelector('#marca-promocion').textContent = negocioActual.nombre;
    document.querySelector('#nombre-promocion').textContent = negocioActual.promocion.nombre;
    document.querySelector('#imagen-promocion').src = './assets/' + negocioActual.promocion.imagen;
  }
  const promocionInicio = datosInicio.novedades.find(({ estilo }) => estilo === negocioActual.promocionInicio);
  const menu = document.querySelector('#menu-negocio');
  if (promocionInicio) {
    const banner = crearTarjetaPromocional({ ...promocionInicio, titulo: 'ICED LATTE\n2×1' }, { informativa: true });
    banner.classList.add('promocion-estatica');
    menu.before(banner);
  }
  menu.append(...negocioActual.productos.map(elegirProducto));
  document.querySelector('#contenido-negocio').hidden = false;
  const scrollGuardado = history.state?.hamScrollCatalogo;
  if (Number.isFinite(scrollGuardado)) tituloNegocio.closest('main').scrollTop = scrollGuardado;

  document.querySelector('#comprar-promocion').addEventListener('click', () => {
    avisoNegocio.textContent = 'La compra de esta promoción está pendiente.';
  });
} else {
  const aviso = document.querySelector('#negocio-no-disponible');
  aviso.hidden = false;
  if (fichaFavoritaNegocio) {
    tituloNegocio.textContent = fichaFavoritaNegocio.nombre;
    document.title = fichaFavoritaNegocio.nombre + ' · Ham!';
    const foto = document.createElement('img');
    foto.className = 'foto-negocio-provisional';
    foto.src = './assets/' + fichaFavoritaNegocio.imagen;
    foto.alt = '';
    aviso.before(foto);
    aviso.textContent = fichaFavoritaNegocio.categoria + '. El menú de este establecimiento está pendiente.';
  }
}

