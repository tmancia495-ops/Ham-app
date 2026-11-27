const contenidoInicio = document.querySelector('#contenido-inicio');
const contenidoBusqueda = document.querySelector('#contenido-busqueda');
const formularioBusqueda = document.querySelector('#formulario-busqueda');
const campoBusqueda = document.querySelector('#consulta-busqueda');
const resultadosBusqueda = document.querySelector('#resultados-busqueda');
const estadoBusqueda = document.querySelector('#estado-busqueda');
const limpiarBusqueda = document.querySelector('#limpiar-busqueda');
const volverBusqueda = document.querySelector('#volver-busqueda');
const enlaceInicio = document.querySelector('#ir-inicio');
const enlaceBuscar = document.querySelector('#ir-buscador');
const ventanaVisible = window.visualViewport;

const indiceBusqueda = [
  ...Object.entries(datosInicio.restaurantes).map(([id, negocio]) => ({
    ...negocio, id, tipo: 'establecimiento', ruta: rutaNegocio(id, 'buscar') || negocio.ruta
  })),
  ...datosInicio.novedades.filter(({ producto }) => producto).map((novedad) => ({
    ...novedad.producto,
    imagen: novedad.imagen,
    tipo: 'producto',
    establecimiento: datosInicio.restaurantes[novedad.producto.restauranteId]?.nombre
  }))
].map((ficha) => ({
  ...ficha,
  texto: normalizarBusqueda([ficha.nombre, datosNegocios[ficha.id]?.nombre, ...(ficha.etiquetas || [])].filter(Boolean).join(' '))
}));

function normalizarBusqueda(texto) {
  return texto.toLocaleLowerCase('es').replace(/[\u0027\u2019\u00B4]/gu, '')
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function crearResultado(ficha) {
  const item = document.createElement('li');
  const tarjeta = document.createElement(ficha.ruta ? 'a' : 'article');
  tarjeta.className = 'resultado-busqueda';
  tarjeta.dataset.resultadoId = ficha.id;
  tarjeta.dataset.tipo = ficha.tipo;
  if (ficha.ruta) tarjeta.href = ficha.ruta;
  if (ficha.tipo === 'establecimiento' && rutaNegocio(ficha.id, 'buscar')) {
    tarjeta.addEventListener('pointerdown', (evento) => {
      if (document.activeElement === campoBusqueda) evento.preventDefault();
    });
    tarjeta.addEventListener('click', (evento) => {
      if (!esActivacionNormal(evento)) return;
      evento.preventDefault();
      const abrir = () => {
        history.replaceState({ ...history.state, hamConsultaNegocio: campoBusqueda.value }, '');
        recordarOrigenNegocio(tarjeta);
        location.assign(tarjeta.href);
      };

      if (history.state?.hamEditando || retirandoEdicion) {
        window.addEventListener('popstate', abrir, { once: true });
        campoBusqueda.blur();
      } else {
        abrir();
      }
    });
  }

  const foto = document.createElement('div');
  foto.className = 'resultado-foto';
  if (ficha.imagen) {
    const imagen = document.createElement('img');
    imagen.src = './assets/' + ficha.imagen;
    imagen.alt = '';
    if (ficha.recorte) imagen.dataset.recorte = ficha.recorte;
    foto.append(imagen);
  }

  const nombre = document.createElement('h3');
  nombre.textContent = ficha.nombre;
  const detalle = document.createElement('p');
  detalle.textContent = ficha.establecimiento || ficha.etiquetas.join(' · ');
  tarjeta.append(foto, nombre, detalle);
  item.append(tarjeta);
  if (ficha.tipo === 'establecimiento') {
    const corazon = crearCorazon('establecimiento', ficha.id, ficha.nombre);
    corazon.addEventListener('pointerdown', (evento) => {
      if (document.activeElement === campoBusqueda) evento.preventDefault();
    });
    item.append(corazon);
  }
  return item;
}

function buscarCoincidencias() {
  const consulta = normalizarBusqueda(campoBusqueda.value);
  const terminos = consulta ? consulta.split(' ') : [];
  const coincidencias = terminos.length
    ? indiceBusqueda.filter(({ texto }) => terminos.every((termino) => texto.includes(termino)))
    : [];

  limpiarBusqueda.hidden = !campoBusqueda.value;
  resultadosBusqueda.replaceChildren(...coincidencias.map(crearResultado));
  const sinCoincidencias = terminos.length && !coincidencias.length;
  estadoBusqueda.classList.toggle('sin-coincidencias', Boolean(sinCoincidencias));
  estadoBusqueda.textContent = sinCoincidencias ? 'No encontramos resultados'
    : coincidencias.length ? `${coincidencias.length} resultados` : '';
}

let mostrandoBusqueda = false;
let entradaBusqueda;
let retirandoEdicion = false;
let tecladoVisible = false;
let animacionesInicioBusqueda;

function aplicarRutaBusqueda() {
  const mostrar = location.hash === '#buscar';
  const conservarFoco = mostrar && history.state?.hamEditando;
  retirandoEdicion = false;
  if (!conservarFoco && document.activeElement === campoBusqueda) campoBusqueda.blur();
  if (mostrar === mostrandoBusqueda) return;

  mostrandoBusqueda = mostrar;
  document.body.classList.toggle('en-busqueda', mostrar);
  if (mostrar) document.querySelector('#titulo-busqueda').focus({ preventScroll: true });
  else if (pestanaPrincipalHam() === 'inicio') entradaBusqueda?.focus({ preventScroll: true });
}

function mostrarContenidosHam(pestana, conservarSaliente = false) {
  if (pestana !== 'inicio') sincronizarNovedadesConInicio(false, conservarSaliente);
  for (const [nombre, contenido] of [['inicio', contenidoInicio], ['buscar', contenidoBusqueda]]) {
    const activo = nombre === pestana;
    contenido.hidden = !activo && !conservarSaliente;
    contenido.inert = !activo;
  }
  if (pestana === 'inicio') sincronizarNovedadesConInicio(true, conservarSaliente);
}

function animarInicioBusqueda(pestana, retroceso) {
  transicionInternaHam?.skipTransition();
  transicionInternaHam = undefined;
  const capas = [contenidoInicio, contenidoBusqueda];
  const anteriores = animacionesInicioBusqueda;
  const posiciones = anteriores && capas.map((capa) => getComputedStyle(capa).transform);
  anteriores?.forEach((animacion) => animacion.cancel());
  animacionesInicioBusqueda = undefined;

  const animar = !reducirMovimientoHam.matches && typeof contenidoInicio.animate === 'function';
  document.body.classList.toggle('transicion-contenido-inicio', animar);
  pintarPestanaPrincipal(animar);
  if (!animar) return;

  const lado = retroceso ? 100 : -100;
  const animaciones = capas.map((capa, indice) => {
    const activa = capa === (pestana === 'inicio' ? contenidoInicio : contenidoBusqueda);
    return capa.animate([
      { transform: posiciones?.[indice] ?? `translateX(${activa ? -lado : 0}%)` },
      { transform: `translateX(${activa ? 0 : lado}%)` }
    ], { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
  });
  animacionesInicioBusqueda = animaciones;
  Promise.all(animaciones.map((animacion) => animacion.finished)).then(() => {
    if (animacionesInicioBusqueda !== animaciones) return;
    mostrarContenidosHam(pestana);
    animacionesInicioBusqueda = undefined;
    animaciones.forEach((animacion) => animacion.cancel());
  }, () => {});
}

function pestanaPrincipalHam() {
  if (/^#pedidos(?:\/|$)/.test(location.hash)) return 'pedidos';
  if (/^#ganancias(?:\/|$)/.test(location.hash)) return 'ganancias';
  if (location.hash === '#jornada-pausada') return 'inicio';
  if (/^#tienda(?:\/|$)/.test(location.hash)) return 'tienda';
  return location.hash === '#perfil' ? 'perfil' : location.hash === '#buscar' ? 'buscar' : 'inicio';
}

const enlacesPrincipalesHam = { inicio: enlaceInicio, buscar: enlaceBuscar, tienda: enlaceTiendaHam,
  pedidos: enlacePedidosHam, ganancias: enlaceGananciasHam, perfil: enlacePerfilHam };
let pestanaVisibleHam;
const ordenPestanasHam = Object.freeze({ inicio: 0, buscar: 1, pedidos: 1, tienda: 2, ganancias: 2, perfil: 3 });
let rutaTiendaVisibleHam;
let rutaPrincipalVisibleHam;

function rutaTiendaPermitidaHam() {
  const pestana = pestanaPrincipalHam();
  const rutaReparto = pestana === 'pedidos' || pestana === 'ganancias' || location.hash === '#jornada-pausada';
  if ((rutaReparto && !esRepartidorHam()) || (esRepartidorHam() && pestana === 'buscar')) {
    history.replaceState(null, '', location.pathname + location.search);
    return true;
  }
  if (pestana !== 'tienda' || comercioCuentaHam()) return true;
  if (!perfilCuentaActiva()) {
    location.replace(rutaAccesoPerfil());
    return false;
  }
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}

function pintarPestanaPrincipal(conservarSaliente = false) {
  if (!rutaTiendaPermitidaHam()) return;
  const pestana = pestanaPrincipalHam();
  if (pestana === 'tienda' && !pintarTiendaHam(location.hash)) return;
  if (pestana !== 'tienda') pausarVistaTiendaHam();
  vistaTiendaHam.hidden = pestana !== 'tienda';
  rutaTiendaVisibleHam = pestana === 'tienda' ? location.hash : '';
  const reparto = esRepartidorHam();
  document.body.classList.toggle('cuenta-repartidor', reparto);
  if (pestana === 'perfil' && !reparto && !cargarPerfilUsuario()) return;
  mostrarContenidosHam(reparto ? '' : pestana, conservarSaliente);
  pintarPanelRepartidor(reparto);
  aplicarRutaBusqueda();
  mainPerfil.hidden = reparto || pestana !== 'perfil';
  document.body.classList.toggle('pagina-perfil', !reparto && pestana === 'perfil');
  document.body.classList.toggle('ham-cabecera-ilustrada', reparto || pestana === 'tienda' || pestana === 'perfil');
  sincronizarBarraComercioHam();
  seleccionarPestanaHam(enlacesPrincipalesHam[pestana].id);
  document.title = reparto ? panelRepartidor.querySelector('h1').textContent + ' · Ham!' : (pestana === 'perfil' ? 'Perfil' : pestana === 'buscar' ? 'Búsqueda' : pestana === 'tienda' ? vistaTiendaHam.querySelector('section:not([hidden]) h1').textContent : 'Inicio provisional') + ' · Ham!';
  pestanaVisibleHam = pestana;
  rutaPrincipalVisibleHam = location.hash;

}

function navegarPestanaPrincipal() {
  if (!rutaTiendaPermitidaHam()) return;
  const pestana = pestanaPrincipalHam();
  const reparto = esRepartidorHam();
  const clave = reparto || pestana === 'tienda' ? 'pestana:' + location.hash : 'pestana:' + pestana;
  if (pestana === pestanaVisibleHam && (reparto ? location.hash === rutaPrincipalVisibleHam
    : pestana !== 'tienda' || location.hash === rutaTiendaVisibleHam)) {
    if (transicionInternaHam && claveVistaHam !== clave) {
      transicionInternaHam.skipTransition();
      transicionInternaHam = undefined;
    }
    if (pestana === 'buscar') aplicarRutaBusqueda();
    return;
  }
  const cabeceraCompartida = document.body.classList.contains('ham-cabecera-ilustrada')
    && (reparto || pestana === 'tienda' || pestana === 'perfil');
  const saleDeSecundaria = pestana !== pestanaVisibleHam && (
    (reparto && esSecundariaPanelRepartidor(rutaPrincipalVisibleHam)) ||
    (pestanaVisibleHam === 'tienda' && rutaTiendaVisibleHam.startsWith('#tienda/')));
  const retroceso = saleDeSecundaria || (reparto && pestana === pestanaVisibleHam
    ? esRetrocesoRepartidor(rutaPrincipalVisibleHam, location.hash)
    : pestana === 'tienda' && pestanaVisibleHam === 'tienda'
      ? location.hash === '#tienda' : ordenPestanasHam[pestana] < ordenPestanasHam[pestanaVisibleHam]);
  const soloContenido = (pestanaVisibleHam === 'inicio' && pestana === 'buscar')
    || (pestanaVisibleHam === 'buscar' && pestana === 'inicio');
  if (soloContenido) {
    animarInicioBusqueda(pestana, retroceso);
    return;
  }
  if (animacionesInicioBusqueda) {
    mostrarContenidosHam(pestanaVisibleHam);
    animacionesInicioBusqueda.forEach((animacion) => animacion.cancel());
    animacionesInicioBusqueda = undefined;
  }
  transicionVistaHam(clave, retroceso, () => {
    document.body.classList.remove('transicion-contenido-inicio');
    pintarPestanaPrincipal();
  }, cabeceraCompartida ? 'paneles-compartidos' : pestanaVisibleHam === 'tienda' ? 'salida-perfil' : 'pestanas');
}

function irPestanaPrincipal(destino) {
  const origen = pestanaPrincipalHam();
  if (origen === destino) {
    if (esRepartidorHam() && !document.body.classList.contains('cuenta-repartidor')) {
      pintarPestanaPrincipal();
      return;
    }
    if (destino === 'tienda' && location.hash !== '#tienda') regresarCatalogoTienda();
    const raiz = destino === 'inicio' ? '' : '#' + destino;
    if (!esRepartidorHam() || location.hash === raiz) return;
  }
  if (destino === 'perfil' && !perfilCuentaActiva()) {
    location.assign(rutaAccesoPerfil());
    return;
  }
  const editando = history.state?.hamEditando;
  const ruta = './inicio.html' + (destino === 'inicio' ? '' : '#' + destino);
  const estadoRuta = {
    hamDesdePestana: origen,
    hamDesdeInicio: origen === 'inicio' && destino === 'buscar'
  };
  if (editando) history.replaceState(estadoRuta, '', ruta);
  else history.pushState(estadoRuta, '', ruta);
  if (document.activeElement === campoBusqueda) campoBusqueda.blur();
  navegarPestanaPrincipal();
}

function abrirBusqueda(evento) {
  if (!esActivacionNormal(evento)) return;
  evento.preventDefault();
  entradaBusqueda = evento.currentTarget;
  irPestanaPrincipal('buscar');
}

function volverDeBusqueda(evento) {
  if (!mostrandoBusqueda || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();

  if (document.activeElement === campoBusqueda) {
    campoBusqueda.blur();
  } else if (!retirandoEdicion) {
    if (history.state?.hamDesdeInicio) history.back();
    else {
      history.replaceState(null, '', location.pathname + location.search);
      navegarPestanaPrincipal();
    }
  }
}

function adaptarAlTeclado() {
  if (!ventanaVisible) return;
  const diferencia = document.documentElement.clientHeight - ventanaVisible.height;
  const visible = ventanaVisible.scale <= 1.05 && diferencia > 110;
  if (tecladoVisible && !visible && document.activeElement === campoBusqueda) campoBusqueda.blur();
  const editando = document.activeElement === campoBusqueda;
  tecladoVisible = editando && visible;
  const fondoMarco = document.body.getBoundingClientRect().bottom;
  const fondoVisible = ventanaVisible.offsetTop + ventanaVisible.height;
  const inset = editando && ventanaVisible.scale <= 1.05 ? Math.max(0, fondoMarco - fondoVisible) : 0;
  document.body.style.setProperty('--inset-teclado', inset + 'px');
}

document.querySelector('#abrir-busqueda').addEventListener('click', abrirBusqueda);
enlaceBuscar.addEventListener('click', abrirBusqueda);
for (const control of [volverBusqueda, enlaceInicio]) {
  control.addEventListener('pointerdown', (evento) => {
    if (mostrandoBusqueda && document.activeElement === campoBusqueda) evento.preventDefault();
  });
}

volverBusqueda.addEventListener('click', volverDeBusqueda);
for (const destino of ['inicio', 'tienda', 'pedidos', 'ganancias', 'perfil']) {
  if (destino === 'tienda') enlaceTiendaHam.addEventListener('pointerdown', (evento) => {
    if (document.activeElement === campoBusqueda) evento.preventDefault();
  });
  enlacesPrincipalesHam[destino].addEventListener('click', (evento) => {
    if (!esActivacionNormal(evento)) return;
    evento.preventDefault();
    irPestanaPrincipal(destino);
  });
}

campoBusqueda.addEventListener('focus', () => {
  if (!history.state?.hamEditando && !retirandoEdicion) {
    history.pushState({ ...history.state, hamEditando: true }, '', '#buscar');
  }
  adaptarAlTeclado();
});

campoBusqueda.addEventListener('blur', () => {
  adaptarAlTeclado();
  if (history.state?.hamEditando && !retirandoEdicion) {
    retirandoEdicion = true;
    history.back();
  }
});

document.addEventListener('click', (evento) => {
  if (document.activeElement === campoBusqueda && !formularioBusqueda.contains(evento.target)
    && !evento.target.closest('#volver-busqueda, #ir-inicio, .boton-favorito')) campoBusqueda.blur();
});

campoBusqueda.addEventListener('input', buscarCoincidencias);
campoBusqueda.addEventListener('keydown', (evento) => {
  if (evento.key !== 'Escape') return;
  evento.preventDefault();
  campoBusqueda.blur();
});

formularioBusqueda.addEventListener('click', (evento) => {
  if (evento.target === formularioBusqueda || evento.target.tagName === 'IMG') campoBusqueda.focus();
});

formularioBusqueda.addEventListener('submit', (evento) => {
  evento.preventDefault();
  campoBusqueda.blur();
});

limpiarBusqueda.addEventListener('pointerdown', (evento) => evento.preventDefault());
limpiarBusqueda.addEventListener('click', () => {
  campoBusqueda.value = '';
  buscarCoincidencias();
  campoBusqueda.focus();
});

document.addEventListener(EVENTO_ROL_HAM, () => {
  if (!mainPerfil.hidden) actualizarOpcionesPerfilHam();
});
window.addEventListener('storage', (evento) => {
  if (!evento.key || evento.key.startsWith(CLAVE_SOLICITUD_REPARTIDOR + ':') ||
    evento.key.startsWith(CLAVE_SOLICITUDES_NEGOCIO + ':')) {
    if (!mainPerfil.hidden) actualizarOpcionesPerfilHam();
    if (!esRepartidorHam() && document.body.classList.contains('cuenta-repartidor')) pintarPestanaPrincipal();
  }
});
window.addEventListener('pageshow', () => {
  if (document.body.classList.contains('cuenta-repartidor') !== esRepartidorHam()) pintarPestanaPrincipal();
});
window.addEventListener('popstate', navegarPestanaPrincipal);
window.addEventListener('hashchange', navegarPestanaPrincipal);
ventanaVisible?.addEventListener('resize', adaptarAlTeclado);
ventanaVisible?.addEventListener('scroll', adaptarAlTeclado);

// Un marcador de edición restaurado por el navegador no debe reabrir el teclado.
if (history.state?.hamEditando) history.replaceState({ ...history.state, hamEditando: false }, '');
if (location.hash === '#buscar' && typeof history.state?.hamConsultaNegocio === 'string') {
  campoBusqueda.value = history.state.hamConsultaNegocio;
  buscarCoincidencias();
}
pintarPestanaPrincipal();
