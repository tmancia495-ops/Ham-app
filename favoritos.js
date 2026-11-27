const vistaFavoritos = document.querySelector('.pagina-favoritos main');
const navFavoritos = document.querySelector('[data-barra-ham]');
const listaFavoritos = document.querySelector('#lista-favoritos');
const panelFavoritos = document.querySelector('#panel-favoritos');
const tabsFavoritos = [...document.querySelectorAll('[role="tab"]')];
let tipoFavoritoActivo = 'establecimiento';

function favoritoDesdeClave(tipo, clave) {
  const tarjetaInicio = fichaTarjetaFavoritaInicio(clave);
  if (tarjetaInicio) return tarjetaInicio;
  if (tipo === 'establecimiento') {

    const negocio = datosNegocios[clave];
    const ficha = fichaEstablecimientoInicio(clave);
    if (ficha) return { ...ficha, imagen: ficha.imagen || negocio?.imagen };
    if (negocio?.id === clave) return { ...negocio, categoria: negocio.categoria || '' };
    return null;
  }
  const [negocioId, id] = clave.split(':');
  const ficha = obtenerProducto(negocioId, id);
  if (!ficha) return null;
  const precio = ficha.producto.precioCentavos == null ? ficha.producto.precio : precioPedido(ficha.producto.precioCentavos);
  return { ...ficha.producto, id, negocio: negocioId, categoria: [ficha.negocio.nombre, precio].filter(Boolean).join(' · ') };
}

function tarjetaFavorita(tipo, ficha) {
  const tarjeta = document.createElement('li');
  tarjeta.className = 'tarjeta-favorito';
  const enlace = document.createElement('a');
  if (tipo === 'establecimiento') {
    enlace.href = './perfil-negocio.html?' + new URLSearchParams({ negocio: ficha.negocioId || ficha.id, origen: 'favoritos' });
    enlace.addEventListener('click', (evento) => {
      if (esActivacionNormal(evento)) recordarOrigenNegocio(enlace);
    });
  } else enlace.href = rutaDetalle(ficha.negocio, ficha.id);
  const foto = document.createElement('img');
  if (ficha.imagen) foto.src = './assets/' + ficha.imagen;
  foto.alt = '';
  if (ficha.recorte) foto.dataset.recorte = ficha.recorte;
  const nombre = document.createElement('strong');
  nombre.textContent = ficha.nombre;
  const detalle = document.createElement('p');
  detalle.textContent = ficha.categoria;
  enlace.append(foto, nombre, detalle);
  tarjeta.append(enlace, crearCorazon(tipo, ficha.id, ficha.nombre, ficha.negocio, ficha.claveTarjeta));
  return tarjeta;
}

function pintarFavoritos() {
  if (!perfilCuentaActiva()) {
    vistaFavoritos.hidden = true;
    navFavoritos.hidden = true;
    location.replace('./iniciar-sesion.html?destino=favoritos');
    return;
  }

  const productos = tipoFavoritoActivo === 'producto';
  const guardados = leerFavoritos()[tipoFavoritoActivo];
  const fichas = guardados.map((clave) => favoritoDesdeClave(tipoFavoritoActivo, clave)).filter(Boolean);
  document.querySelector('#titulo-favoritos').textContent = productos ? 'Productos guardados' : 'Lugares guardados';
  document.querySelector('#contador-favoritos').textContent = fichas.length + (fichas.length === 1 ? ' favorito' : ' favoritos');
  const vacio = document.querySelector('#vacio-favoritos');
  vacio.hidden = Boolean(fichas.length);
  vacio.textContent = 'Todavía no tienes ' + (productos ? 'productos' : 'establecimientos') + ' favoritos.';
  listaFavoritos.replaceChildren(...fichas.map((ficha) => tarjetaFavorita(tipoFavoritoActivo, ficha)));

  const explorar = document.createElement('li');
  explorar.className = 'tarjeta-favorito explorar-favoritos';
  explorar.innerHTML = '<a href="./inicio.html"><span class="explorar-icono-favoritos" aria-hidden="true"><img src="./assets/favoritos-circulo-crema.svg" alt=""><img src="./assets/favoritos-buscar.svg" alt=""></span><strong>¿Algo nuevo?</strong><p>Explora más lugares</p></a>';
  listaFavoritos.append(explorar);
  vistaFavoritos.hidden = false;
  navFavoritos.hidden = false;
}

function activarTabFavoritos(tab) {
  tipoFavoritoActivo = tab.dataset.tipo;
  for (const opcion of tabsFavoritos) {
    opcion.setAttribute('aria-selected', String(opcion === tab));
    opcion.tabIndex = opcion === tab ? 0 : -1;
  }
  panelFavoritos.setAttribute('aria-labelledby', tab.id);
  pintarFavoritos();
}

tabsFavoritos.forEach((tab) => {
  tab.addEventListener('click', () => activarTabFavoritos(tab));
  tab.addEventListener('keydown', (evento) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evento.key)) return;
    evento.preventDefault();
    const destino = evento.key === 'Home' ? tabsFavoritos[0]
      : evento.key === 'End' ? tabsFavoritos.at(-1) : tabsFavoritos.find((opcion) => opcion !== tab);
    activarTabFavoritos(destino);
    destino.focus();
  });
});

document.addEventListener('ham:favoritos', (evento) => {
  const devolverFoco = evento.detail && listaFavoritos.contains(document.activeElement);
  pintarFavoritos();
  if (devolverFoco) (listaFavoritos.querySelector('.boton-favorito') || listaFavoritos.querySelector('a')).focus();
});
pintarFavoritos();
window.addEventListener('pageshow', (evento) => { if (evento.persisted) pintarFavoritos(); });
