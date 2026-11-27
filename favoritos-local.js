const CLAVE_FAVORITOS = 'ham.favoritos';

function leerEstadoFavoritos(cuenta, estricto = false) {
  const favoritos = { establecimiento: [], producto: [] };
  if (!cuenta) return favoritos;
  try {
    const almacenado = localStorage.getItem(claveDatosCuenta(CLAVE_FAVORITOS, cuenta.id));
    const estado = JSON.parse(almacenado?.trim() || 'null');
    if (estado === null) return favoritos;
    if (typeof estado !== 'object' || Array.isArray(estado)) throw new Error('Formato de favoritos desconocido.');

    for (const tipo of Object.keys(favoritos)) {
      const claves = estado[tipo] ?? [];
      const instancias = estado.instancias ?? [];
      if (!Array.isArray(claves) || !Array.isArray(instancias)) throw new Error('Formato de favoritos desconocido.');
      // Las selecciones antiguas por tarjeta pasan a pertenecer al elemento.
      favoritos[tipo] = [...new Set([
        ...claves,
        ...instancias.filter((instancia) => instancia?.tipo === tipo).map(({ clave }) => clave)
      ].filter((clave) => typeof clave === 'string' && clave))];
    }
    return favoritos;
  } catch (error) {
    if (estricto) throw error;
    return { establecimiento: [], producto: [] };
  }
}

function leerFavoritos() {
  return leerEstadoFavoritos(perfilCuentaActiva());
}

function claveFavorito(tipo, id, negocio) {
  return tipo === 'producto' ? negocio + ':' + id : id;
}

function pintarCorazon(boton, estado) {
  const { tipoFavorito: tipo, claveFavorito: clave } = boton.dataset;
  const valor = String(estado[tipo].includes(clave));
  if (boton.getAttribute('aria-pressed') !== valor) boton.setAttribute('aria-pressed', valor);
}

function pintarCorazones(estado = leerFavoritos(), favorito) {
  const selector = favorito
    ? `.boton-favorito[data-tipo-favorito="${CSS.escape(favorito.tipo)}"][data-clave-favorito="${CSS.escape(favorito.clave)}"]`
    : '.boton-favorito';
  document.querySelectorAll(selector).forEach((boton) => pintarCorazon(boton, estado));
}

function crearCorazon(tipo, id, nombre, negocio, clave = claveFavorito(tipo, id, negocio)) {
  const boton = document.createElement('button');
  boton.className = 'boton-favorito';
  boton.type = 'button';
  boton.dataset.tipoFavorito = tipo;
  boton.dataset.claveFavorito = clave;
  boton.setAttribute('aria-label', 'Favorito: ' + nombre);
  pintarCorazon(boton, leerFavoritos());

  const icono = document.createElement('span');
  icono.setAttribute('aria-hidden', 'true');
  boton.append(icono);
  boton.addEventListener('click', (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    const cuenta = perfilCuentaActiva();
    if (!cuenta) {
      location.assign(rutaAccesoPerfil());
      return;
    }
    const llave = claveDatosCuenta(CLAVE_FAVORITOS, cuenta.id);
    let estado;
    try {
      estado = leerEstadoFavoritos(cuenta, true);
      const elementos = new Set(estado[tipo]);
      if (!elementos.delete(clave)) elementos.add(clave);
      estado[tipo] = [...elementos];
      localStorage.setItem(llave, JSON.stringify(estado));
    } catch {
      boton.title = 'No se pudo guardar el favorito en este navegador.';
      return;
    }

    pintarCorazones(estado, { tipo, clave });
    boton.removeAttribute('title');
    document.dispatchEvent(new CustomEvent('ham:favoritos', { detail: { tipo, clave } }));
    icono.getAnimations?.().forEach((animacion) => animacion.cancel());
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      icono.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], {
        duration: 220, easing: 'ease-out'
      });
    }
  });
  return boton;
}

window.addEventListener('pageshow', () => pintarCorazones());
window.addEventListener('storage', (evento) => {
  if (evento.key !== null && evento.key !== claveDatosCuenta(CLAVE_FAVORITOS)) return;
  pintarCorazones();
  document.dispatchEvent(new Event('ham:favoritos'));
});
