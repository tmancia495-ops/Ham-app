const barraHam = document.querySelector('[data-barra-ham]');
const vistaBarraHam = barraHam.dataset.barraHam;
const enInicio = vistaBarraHam === 'inicio';
const enPerfil = vistaBarraHam === 'perfil';
const buscarInicialEnBarra = enInicio && location.hash === '#buscar';
const tiendaInicialEnBarra = enInicio && /^#tienda(?:\/|$)/.test(location.hash) && Boolean(comercioCuentaHam());
const perfilActivoEnBarra = (enInicio && location.hash === '#perfil') || enPerfil || ['favoritos', 'notificaciones', 'cupones', 'repartidor', 'registro-negocio', 'legal', 'ayuda', 'editor-perfil', 'estado-solicitud'].includes(vistaBarraHam);

function iconosPestanaHam(nombre) {
  const ruta = './assets/icons/navigation/' + nombre;
  return `<img class="icono-barra-ham icono-barra-inactivo" src="${ruta}-inactive.svg" alt="" width="21" height="21">
    <img class="icono-barra-ham icono-barra-activo" src="${ruta}-active.svg" alt="" width="21" height="21">`;
}

barraHam.innerHTML = `
  <a id="ir-inicio" class="pestana-inicio${perfilActivoEnBarra || buscarInicialEnBarra || tiendaInicialEnBarra ? '' : ' pestana-activa'}" href="./inicio.html" aria-label="Inicio"${enInicio && !buscarInicialEnBarra && !perfilActivoEnBarra && !tiendaInicialEnBarra ? ' aria-current="page"' : ''}>${iconosPestanaHam('home')}</a>
  <a id="ir-buscador" class="enlace-buscar${buscarInicialEnBarra ? ' pestana-activa' : ''}"${buscarInicialEnBarra ? ' aria-current="page"' : ''} href="${enInicio ? '#buscar' : './inicio.html#buscar'}" aria-label="Buscar">${iconosPestanaHam('search')}</a>
  <a id="ir-pedidos" href="./inicio.html#pedidos" aria-label="Pedidos" hidden>${iconosPestanaHam('orders')}</a>
  <a id="ir-ganancias" href="./inicio.html#ganancias" aria-label="Mis ganancias" hidden>${iconosPestanaHam('earnings')}</a>
  <a id="ir-tienda" class="pestana-tienda${tiendaInicialEnBarra ? ' pestana-activa' : ''}" href="./inicio.html#tienda" aria-label="Tienda"${tiendaInicialEnBarra ? ' aria-current="page"' : ''} hidden>${iconosPestanaHam('store')}</a>
  <a id="ir-perfil-usuario" class="pestana-perfil${perfilActivoEnBarra ? ' pestana-activa' : ''}" href="./perfil-usuario.html" aria-label="Perfil"${perfilActivoEnBarra ? ' aria-current="page"' : ''}>${iconosPestanaHam('profile')}</a>
`;

const enlacePerfilHam = barraHam.querySelector('#ir-perfil-usuario');
const enlaceTiendaHam = barraHam.querySelector('#ir-tienda');
const enlacePedidosHam = barraHam.querySelector('#ir-pedidos');
const enlaceGananciasHam = barraHam.querySelector('#ir-ganancias');

function sincronizarBarraComercioHam() {
  const comerciante = Boolean(comercioCuentaHam());
  barraHam.classList.toggle('barra-comercio', comerciante);
  const mantenerBusqueda = enInicio && location.hash === '#buscar' && document.body.classList.contains('en-busqueda');
  const repartidor = esRepartidorHam() && !mantenerBusqueda;
  barraHam.classList.toggle('barra-repartidor', repartidor);
  enlaceTiendaHam.hidden = !comerciante;
  barraHam.querySelector('#ir-buscador').hidden = repartidor;
  enlacePedidosHam.hidden = !repartidor;
  enlaceGananciasHam.hidden = !repartidor;
}

sincronizarBarraComercioHam();
document.addEventListener(EVENTO_COMERCIO_HAM, sincronizarBarraComercioHam);
document.addEventListener(EVENTO_ROL_HAM, sincronizarBarraComercioHam);
window.addEventListener('pageshow', sincronizarBarraComercioHam);
window.addEventListener('storage', (evento) => {
  if (!evento.key || evento.key.startsWith(CLAVE_SOLICITUDES_NEGOCIO + ':') ||
      evento.key.startsWith(CLAVE_SOLICITUD_REPARTIDOR + ':') || evento.key.startsWith(CLAVE_REVOCACION + ':')) sincronizarBarraComercioHam();
});
function prepararRutaPerfilHam() {
  const origen = enInicio && location.hash === '#buscar' ? 'buscar' : vistaBarraHam;
  const parametros = new URLSearchParams({ origen });
  if (origen === 'negocio') {
    const negocio = new URLSearchParams(location.search).get('negocio');
    if (negocio) parametros.set('negocio', negocio);
  }
  enlacePerfilHam.href = enInicio ? './inicio.html#perfil' : './inicio.html?' + parametros + '#perfil';
}

if (enPerfil) {
  enlacePerfilHam.addEventListener('click', (evento) => {
    if (!evento.ctrlKey && !evento.metaKey && !evento.shiftKey && !evento.altKey) evento.preventDefault();
  });
} else {
  prepararRutaPerfilHam();
  window.addEventListener('hashchange', prepararRutaPerfilHam);
  enlacePerfilHam.addEventListener('pointerdown', (evento) => {
    if (document.activeElement?.id === 'consulta-busqueda') evento.preventDefault();
    prepararRutaPerfilHam();
  });
  enlacePerfilHam.addEventListener('click', (evento) => {
    if (enInicio) return;
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    prepararRutaPerfilHam();
    const abrir = () => {
      try { sessionStorage.setItem('ham.retornoPerfil', enlacePerfilHam.href); } catch { /* Se mantiene el enlace Volver. */ }
    };
    abrir();
  });
}

function seleccionarPestanaHam(id) {
  for (const enlace of barraHam.querySelectorAll('a')) {
    const activa = enlace.id === id;
    enlace.classList.toggle('pestana-activa', activa);
    if (activa) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }

}

const indicadorBarraHam = document.createElement('span');
indicadorBarraHam.className = 'indicador-barra-ham';
indicadorBarraHam.setAttribute('aria-hidden', 'true');
barraHam.prepend(indicadorBarraHam);

const claveIndicadorBarraHam = 'ham.posicion-barra';
let posicionBarraHam;
let anchoBarraHam;
let origenBarraHam;
let cuadroBarraHam;

function actualizarIndicadorBarraHam() {
  const activa = barraHam.querySelector('.pestana-activa:not([hidden])');
  const marco = barraHam.getBoundingClientRect();
  if (!activa || !marco.width) return;
  const pestaña = activa.getBoundingClientRect();
  const destino = pestaña.left + pestaña.width / 2 - marco.left - indicadorBarraHam.offsetWidth / 2;
  if (destino === posicionBarraHam && marco.width === anchoBarraHam && !origenBarraHam) return;
  cancelAnimationFrame(cuadroBarraHam);

  const cambiar = (posicion) => {
    indicadorBarraHam.style.transform = 'translateX(' + posicion + 'px)';
  };
  if (origenBarraHam) {
    const origen = origenBarraHam.centro * marco.width - indicadorBarraHam.offsetWidth / 2;
    origenBarraHam = undefined;
    indicadorBarraHam.classList.remove('indicador-en-movimiento');
    cambiar(origen);
    indicadorBarraHam.getBoundingClientRect();
    indicadorBarraHam.classList.add('indicador-en-movimiento');
    cuadroBarraHam = requestAnimationFrame(() => cambiar(destino));
  } else if (posicionBarraHam === undefined || marco.width !== anchoBarraHam) {
    indicadorBarraHam.classList.remove('indicador-en-movimiento');
    cambiar(destino);
    indicadorBarraHam.getBoundingClientRect();
    indicadorBarraHam.classList.add('indicador-en-movimiento');
  } else {
    cambiar(destino);
  }
  posicionBarraHam = destino;
  anchoBarraHam = marco.width;
}

new MutationObserver(actualizarIndicadorBarraHam).observe(barraHam, {
  subtree: true, attributes: true, attributeFilter: ['class', 'hidden']
});
new ResizeObserver(actualizarIndicadorBarraHam).observe(barraHam);

window.addEventListener('pagehide', () => {
  if (!anchoBarraHam || barraHam.hidden) return;
  try {
    const transformacion = getComputedStyle(indicadorBarraHam).transform;
    const x = transformacion === 'none' ? posicionBarraHam : new DOMMatrixReadOnly(transformacion).m41;
    sessionStorage.setItem(claveIndicadorBarraHam, JSON.stringify({
      centro: (x + indicadorBarraHam.offsetWidth / 2) / anchoBarraHam,
      fecha: Date.now()
    }));
  } catch { /* La barra puede iniciarse directamente en su pestaña. */ }
}, { capture: true });

function recuperarIndicadorBarraHam() {
  try {
    const anterior = JSON.parse(sessionStorage.getItem(claveIndicadorBarraHam) || 'null');
    sessionStorage.removeItem(claveIndicadorBarraHam);
    if (anterior && Number.isFinite(anterior.centro) && Date.now() - anterior.fecha < 10000) origenBarraHam = anterior;
  } catch { /* La barra puede iniciarse directamente en su pestaña. */ }
  actualizarIndicadorBarraHam();
}

recuperarIndicadorBarraHam();
window.addEventListener('pageshow', recuperarIndicadorBarraHam);

if (!enInicio && !enPerfil) {
  barraHam.addEventListener('click', (evento) => {
    const enlace = evento.target.closest('a');
    if (!enlace || evento.defaultPrevented || evento.button !== 0 ||
        evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    if (esSecundariaPerfilHam(new URL(location.href)) &&
        ['ir-inicio', 'ir-buscador', 'ir-perfil-usuario'].includes(enlace.id)) {
      evento.preventDefault();
      navegarPantallaHam(enlace.href, { volver: true });
      return;
    }
    if (!barraHam.matches('.barra-comercio, .barra-repartidor')) return;
    const pestanas = [...barraHam.querySelectorAll('a:not([hidden])')];
    const activa = pestanas.findIndex((pestana) => pestana.classList.contains('pestana-activa'));
    if (activa < 0 || pestanas.indexOf(enlace) >= activa) return;
    evento.preventDefault();
    navegarPantallaHam(enlace.href, { volver: true });
  });
}