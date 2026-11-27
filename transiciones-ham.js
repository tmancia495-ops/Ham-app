const reducirMovimientoHam = matchMedia('(prefers-reduced-motion: reduce)');
const claveSentidoHam = 'ham.transicion-navegacion';
let enlaceAtrasHam;
let navegacionDocumentoHam;

function guardarSentidoDocumentoHam(destino, volver = true) {
  try {
    sessionStorage.setItem(claveSentidoHam, JSON.stringify({
      desde: location.href, hasta: destino, volver, fecha: Date.now()
    }));
  } catch { /* El navegador conserva la navegación. */ }
}

function navegarPantallaHam(url, { volver = false, reemplazar = false } = {}) {
  if (navegacionDocumentoHam) return;
  const destino = new URL(url, location.href).href;
  navegacionDocumentoHam = destino;
  enlaceAtrasHam = volver ? destino : undefined;
  if (volver) guardarSentidoDocumentoHam(destino);
  if (reemplazar) location.replace(destino);
  else location.assign(destino);
}

function entradaAnteriorCoincideHam(destino, parametros) {
  const navegacion = window.navigation;
  const anterior = navegacion?.entries()[navegacion.currentEntry?.index - 1]?.url;
  if (!anterior) return false;
  const prev = new URL(anterior);
  return prev.origin === destino.origin && prev.pathname === destino.pathname &&
    parametros.every((clave) => prev.searchParams.get(clave) === destino.searchParams.get(clave));
}

function conectarRegresoHam(enlace, parametros = []) {
  enlace.addEventListener("click", (evento) => {
    if (evento.defaultPrevented || evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    const destino = new URL(enlace.href);
    evento.preventDefault();
    if (navegacionDocumentoHam) return;
    if (entradaAnteriorCoincideHam(destino, parametros)) {
      navegacionDocumentoHam = destino.href;
      history.back();
    } else navegarPantallaHam(destino, { volver: true });
  });
}

window.addEventListener("pageshow", () => { navegacionDocumentoHam = undefined; });
let transicionInternaHam;
let claveVistaHam;

function transicionVistaHam(clave, retroceso, actualizar, tipo) {
  if (!document.startViewTransition || reducirMovimientoHam.matches) {
    transicionInternaHam?.skipTransition();
    transicionInternaHam = undefined;
    actualizar();
    return;
  }
  if (transicionInternaHam && claveVistaHam === clave) return;
  transicionInternaHam?.skipTransition();
  claveVistaHam = clave;
  let transicion;
  transicion = document.startViewTransition(() => {
    if (transicionInternaHam === transicion) actualizar();
  });
  transicionInternaHam = transicion;
  if (retroceso) transicion.types?.add('retroceso');
  if (tipo) transicion.types?.add(tipo);
  // Una navegación de documento puede omitir la transición de vista en curso.
  transicion.ready.catch(() => {});
  transicion.finished.catch(() => {}).finally(() => {
    if (transicionInternaHam === transicion) transicionInternaHam = undefined;
  });
}

function retrocesoHistorialHam(activacion) {
  return activacion?.navigationType === 'traverse' &&
    activacion.from && activacion.entry && activacion.entry.index < activacion.from.index;
}

document.addEventListener('click', (evento) => {
  enlaceAtrasHam = undefined;
  if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
  const enlace = evento.target.closest('a[href]');
  if (!enlace || !/^Volver\b/i.test(enlace.getAttribute('aria-label') || enlace.textContent.trim()) && !enlace.id.startsWith('volver-')) return;
  enlaceAtrasHam = enlace.href;
}, true);

document.addEventListener("DOMContentLoaded", () => {
  for (const enlace of document.querySelectorAll("[data-regreso-cabecera]")) {
    enlace.addEventListener("click", (evento) => {
      if (evento.defaultPrevented || evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
      evento.preventDefault();
      navegarPantallaHam(enlace.href, { volver: true, reemplazar: true });
    });
  }
});

function esSecundariaPerfilHam(url) {
  const archivo = url.pathname.split('/').pop();
  if (archivo === 'completar-perfil.html') return url.searchParams.get('editar') === '1';
  return ['favoritos.html', 'notificaciones.html', 'codigos-descuento.html',
    'informacion-legal.html', 'centro-ayuda.html', 'estado-solicitud.html'].includes(archivo);
}

function compartenCabeceraHam(desde, hasta) {
  if (!desde || !hasta) return false;
  const ruta = (url) => {
    const destino = new URL(url);
    const archivo = destino.pathname.split('/').pop();
    if (archivo === 'inicio.html' && destino.hash === '#perfil') return 'perfil';
    if (esSecundariaPerfilHam(destino) && !(archivo === 'informacion-legal.html' && destino.hash)) return 'secundaria';
    return '';
  };
  const par = [ruta(desde), ruta(hasta)];
  return par.includes('perfil') && par.includes('secundaria');
}

function aplicarTransicionCatalogoHam(transicion, desde, hasta) {
  if (!desde || !hasta) return;
  const identificar = (url) => {
    const ruta = new URL(url);
    const pagina = ruta.pathname.split('/').pop();
    if (pagina === 'inicio.html' && (!ruta.hash || ruta.hash === '#buscar')) return 'inicio';
    if (!['rest-001', 'rest-002', 'rest-004', 'rest-005'].includes(ruta.searchParams.get('negocio'))) return '';
    return pagina === 'perfil-negocio.html' ? 'catalogo' : pagina === 'producto.html' ? 'producto' : '';
  };
  const origen = identificar(desde);
  const destino = identificar(hasta);
  if (origen && destino && origen !== destino) {
    transicion.types?.add('catalogo-negocio');
    if (origen === 'producto' || destino === 'inicio') transicion.types?.add('retroceso');
  }
}

function aplicarSalidaPerfilHam(transicion, desde, hasta) {
  if (!desde || !hasta || !esSecundariaPerfilHam(new URL(desde))) return;
  const destino = new URL(hasta);
  if (!destino.pathname.endsWith('/inicio.html') || !['', '#buscar', '#perfil'].includes(destino.hash)) return;
  transicion.types?.add('retroceso');
  if (!compartenCabeceraHam(desde, hasta)) transicion.types?.add('salida-perfil');
}

function tipoTransicionRegistroHam(desde, hasta) {
  if (!desde || !hasta) return '';
  const origen = new URL(desde);
  const destino = new URL(hasta);
  const esPerfil = (url) => url.pathname.endsWith('/inicio.html') && url.hash === '#perfil';
  if (esPerfil(origen) && destino.pathname.endsWith('/repartidor.html') && !destino.hash &&
      typeof esRepartidorHam === 'function' && !esRepartidorHam()) return 'cortina-repartidor';
  if (esPerfil(destino) && /\/(repartidor|registrar-negocio)\.html$/.test(origen.pathname)) return 'regreso-formulario-rol';
  return '';
}

function aplicarTipoRegistroHam(transicion, desde, hasta) {
  const tipo = tipoTransicionRegistroHam(desde, hasta);
  if (!tipo) return;
  transicion.types?.add(tipo);
  if (tipo === 'regreso-formulario-rol') transicion.types?.add('retroceso');
}

window.addEventListener('pageswap', (evento) => {
  const transicion = evento.viewTransition;
  const activacion = evento.activation;
  const destino = activacion?.entry?.url;
  const recorridoHistorial = activacion?.navigationType === 'traverse';
  const volver = recorridoHistorial ? retrocesoHistorialHam(activacion) : destino === enlaceAtrasHam;
  if (destino && (recorridoHistorial || volver)) guardarSentidoDocumentoHam(destino, volver);
  if (!transicion) return;
  if (reducirMovimientoHam.matches || document.body.hidden ||
      (destino && new URL(destino).pathname.endsWith('/iniciar-sesion.html') && !location.pathname.endsWith('/index.html'))) {
    transicion.skipTransition();
    return;
  }
  if (volver) transicion.types?.add('retroceso');
  aplicarTipoRegistroHam(transicion, location.href, destino);
  aplicarSalidaPerfilHam(transicion, location.href, destino);
  aplicarTransicionCatalogoHam(transicion, location.href, destino);
  if (document.body.classList.contains('ham-cabecera-ilustrada') && compartenCabeceraHam(location.href, destino)) {
    transicion.types?.add('cabecera-compartida');
  }
});

window.addEventListener('pagereveal', (evento) => {
  let intencion;
  try {
    intencion = JSON.parse(sessionStorage.getItem(claveSentidoHam) || 'null');
    sessionStorage.removeItem(claveSentidoHam);
  } catch { /* El historial sigue indicando el sentido de Atrás. */ }

  const transicion = evento.viewTransition;
  if (!transicion) return;
  if (reducirMovimientoHam.matches) {
    transicion.skipTransition();
    return;
  }
  const activacion = window.navigation?.activation;
  const coincideIntencion = intencion?.hasta === location.href && (!activacion?.from || intencion.desde === activacion.from.url) &&
    Date.now() - intencion.fecha < 5000;
  const volver = coincideIntencion ? intencion.volver : retrocesoHistorialHam(activacion);
  if (volver) transicion.types?.add('retroceso');
  else transicion.types?.delete('retroceso');
  const origen = coincideIntencion ? intencion.desde : activacion?.from?.url;
  aplicarTipoRegistroHam(transicion, origen, location.href);
  aplicarSalidaPerfilHam(transicion, origen, location.href);
  aplicarTransicionCatalogoHam(transicion, origen, location.href);
  if (document.body.classList.contains('ham-cabecera-ilustrada') &&
      compartenCabeceraHam(activacion?.from?.url || intencion?.desde, location.href)) {
    transicion.types?.add('cabecera-compartida');
  }
});

async function transicionArranqueHam(logo, acceso, mostrarAcceso) {
  if (!reducirMovimientoHam.matches && typeof logo.animate === 'function') {
    const estilos = getComputedStyle(document.documentElement);
    const curva = estilos.getPropertyValue('--curva-transicion-ham').trim();
    const salida = logo.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: parseFloat(estilos.getPropertyValue('--duracion-salida-splash')),
      easing: curva, fill: 'forwards'
    });
    await salida.finished.catch(() => {});
    mostrarAcceso();
    salida.cancel();
    const entrada = acceso.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: parseFloat(estilos.getPropertyValue('--duracion-entrada-acceso')),
      easing: curva
    });
    await entrada.finished.catch(() => {});
  } else {
    mostrarAcceso();
  }
}