const catalogo = document.querySelector('#restaurantes');
const plantilla = document.querySelector('#plantilla-restaurante');
const novedades = document.querySelector('#novedades');
const indicadores = document.querySelector('#indicadores');

for (const categoria of datosInicio.categorias) {
  const elemento = crearElemento('li');
  const imagen = crearElemento('img');
  imagenLocal(imagen, categoria.imagen);
  elemento.append(imagen, crearElemento('span', categoria.nombre));
  document.querySelector('#categorias').append(elemento);
}

const TIEMPO_NOVEDAD = 3000;
const DURACION_DESLIZAMIENTO = 360;
const botonesNovedad = datosInicio.novedades.map((novedad, indice) => {
  const diapositiva = crearTarjetaPromocional(novedad);
  novedades.append(diapositiva);

  const boton = crearElemento('button');
  boton.type = 'button';
  boton.setAttribute('aria-label', novedad.titulo.replace('\n', ' '));
  boton.addEventListener('click', () => moverNovedad(indice + 1));
  indicadores.append(boton);
  return boton;
});

const totalNovedades = botonesNovedad.length;
const originales = [...novedades.children];
for (const original of [originales.at(-1), originales[0]]) {
  const copia = original.cloneNode(true);
  copia.inert = true;
  copia.setAttribute('aria-hidden', 'true');
  if (original === originales.at(-1)) novedades.prepend(copia);
  else novedades.append(copia);
}

let pasoNovedad = 0;
let posicionNovedad = datosInicio.novedadInicial + 1;
let novedadActiva = -1;
let novedadesVisibles = false;
let novedadesPausadas = false;
let temporizadorNovedad;
let animacionNovedad;
let destinoNovedad;
let gestoNovedad;

function mostrarNovedadActiva(posicion) {
  const indice = (posicion - 1 + totalNovedades) % totalNovedades;
  if (indice === novedadActiva) return;
  novedadActiva = indice;
  botonesNovedad.forEach((boton, actual) => {
    boton.setAttribute('aria-current', String(actual === indice));
  });
}

function programarNovedad(espera = TIEMPO_NOVEDAD) {
  clearTimeout(temporizadorNovedad);
  if (!novedadesPausadas && novedadesVisibles && !document.hidden && !gestoNovedad && !animacionNovedad && !dialogoDirecciones.open) {
    temporizadorNovedad = setTimeout(() => moverNovedad(posicionNovedad + 1), espera);
  }
}

function detenerAnimacionNovedad() {
  cancelAnimationFrame(animacionNovedad);
  animacionNovedad = undefined;
}

function fijarNovedad(posicion, espera) {
  // La copia y su original ocupan la misma ventana al reubicar el carrusel.
  if (posicion === 0) posicion = totalNovedades;
  if (posicion === totalNovedades + 1) posicion = 1;
  posicionNovedad = posicion;
  novedades.scrollLeft = posicion * pasoNovedad;
  mostrarNovedadActiva(posicion);
  programarNovedad(espera);
}

function moverNovedad(posicion) {
  if (novedadesPausadas || !pasoNovedad) return;
  clearTimeout(temporizadorNovedad);
  detenerAnimacionNovedad();
  const origen = novedades.scrollLeft;
  const destino = posicion * pasoNovedad;
  destinoNovedad = posicion;
  if (Math.abs(destino - origen) < 1) {
    fijarNovedad(posicion);
    return;
  }

  const inicio = performance.now();
  function deslizar(ahora) {
    const progreso = Math.min(1, (ahora - inicio) / DURACION_DESLIZAMIENTO);
    novedades.scrollLeft = origen + (destino - origen) * (1 - (1 - progreso) ** 3);
    mostrarNovedadActiva(Math.round(novedades.scrollLeft / pasoNovedad));
    if (progreso < 1) {
      animacionNovedad = requestAnimationFrame(deslizar);
    } else {
      animacionNovedad = undefined;
      fijarNovedad(posicion, Math.max(0, TIEMPO_NOVEDAD - (ahora - inicio)));
    }
  }
  animacionNovedad = requestAnimationFrame(deslizar);
}

function medirNovedades(realinear = false) {
  if (!novedades.clientWidth) return;
  // Restar ambas posiciones elimina la traslación que aplica la navegación al padre.
  const paso = novedades.children[1].getBoundingClientRect().left - novedades.children[0].getBoundingClientRect().left;
  if (paso <= 0 || (Math.abs(paso - pasoNovedad) < 0.01 && !realinear)) return;
  detenerAnimacionNovedad();
  pasoNovedad = paso;
  fijarNovedad(novedadActiva < 0 ? posicionNovedad : novedadActiva + 1);
}

function sincronizarNovedadesConInicio(activo, enTransicion) {
  const estabaPausado = novedadesPausadas;
  novedadesPausadas = !activo || enTransicion;
  if (novedadesPausadas && !estabaPausado) {
    clearTimeout(temporizadorNovedad);
    detenerAnimacionNovedad();
    if (gestoNovedad) {
      const { id } = gestoNovedad;
      gestoNovedad = undefined;
      novedades.classList.remove('arrastrando');
      if (novedades.hasPointerCapture(id)) novedades.releasePointerCapture(id);
    }
  }
  if (activo && estabaPausado) medirNovedades(true);
}

medirNovedades();
new ResizeObserver(() => medirNovedades()).observe(novedades);

new IntersectionObserver(([entrada]) => {
  novedadesVisibles = entrada.isIntersecting && entrada.intersectionRatio > 0;
  programarNovedad();
}, { root: document.querySelector('.inicio') }).observe(novedades);

document.addEventListener('visibilitychange', () => programarNovedad());

novedades.addEventListener('pointerdown', (evento) => {
  if (novedadesPausadas || !evento.isPrimary || evento.button !== 0 || gestoNovedad) return;
  clearTimeout(temporizadorNovedad);
  detenerAnimacionNovedad();
  gestoNovedad = {
    id: evento.pointerId,
    x: evento.clientX,
    y: evento.clientY,
    origen: novedades.scrollLeft,
    horizontal: false
  };
  novedades.setPointerCapture(evento.pointerId);
});

novedades.addEventListener('pointermove', (evento) => {
  const gesto = gestoNovedad;
  if (!gesto || gesto.id !== evento.pointerId) return;
  const dx = evento.clientX - gesto.x;
  if (!gesto.horizontal) {
    if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(evento.clientY - gesto.y)) return;
    gesto.horizontal = true;
    novedades.classList.add('arrastrando');
  }
  novedades.scrollLeft = gesto.origen - dx;
  mostrarNovedadActiva(Math.round(novedades.scrollLeft / pasoNovedad));
});

function terminarGestoNovedad(evento) {
  const gesto = gestoNovedad;
  if (!gesto || gesto.id !== evento.pointerId) return;
  gestoNovedad = undefined;
  novedades.classList.remove('arrastrando');
  const origen = Math.round(gesto.origen / pasoNovedad);
  let destino = Math.round(novedades.scrollLeft / pasoNovedad);
  const recorrido = gesto.origen - novedades.scrollLeft;
  if (evento.type === 'pointerup' && destino === origen && Math.abs(recorrido) >= 32) {
    destino -= Math.sign(recorrido);
  }
  moverNovedad(Math.max(0, Math.min(totalNovedades + 1, destino)));
}

for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  novedades.addEventListener(evento, terminarGestoNovedad);
}

novedades.addEventListener('keydown', (evento) => {
  if (gestoNovedad || !['ArrowLeft', 'ArrowRight'].includes(evento.key)) return;
  evento.preventDefault();
  const direccion = evento.key === 'ArrowRight' ? 1 : -1;
  moverNovedad(posicionNovedad + direccion);
});

function activarArrastreDeFila(fila) {
  let impedirClic = false;

  fila.addEventListener('pointerdown', (evento) => {
    impedirClic = false;
    if (evento.pointerType !== 'mouse' || evento.button !== 0 || evento.target.closest('.boton-favorito')) return;
    evento.preventDefault();
    const x = evento.clientX;
    const origen = fila.scrollLeft;
    const id = evento.pointerId;
    const sesion = new AbortController();
    const opciones = { signal: sesion.signal };

    window.addEventListener('pointermove', (movimiento) => {
      if (movimiento.pointerId !== id) return;
      if (!(movimiento.buttons & 1)) {
        terminar(movimiento);
        return;
      }
      const distancia = movimiento.clientX - x;
      if (!impedirClic && Math.abs(distancia) < 6) return;
      impedirClic = true;
      fila.classList.add('arrastrando');
      fila.scrollLeft = origen - distancia;
    }, opciones);

    function terminar(fin) {
      if (fin.pointerId !== id) return;
      sesion.abort();
      fila.classList.remove('arrastrando');
    }

    window.addEventListener('pointerup', terminar, opciones);
    window.addEventListener('pointercancel', terminar, opciones);
  });

  fila.addEventListener('click', (evento) => {
    if (evento.target.closest('.boton-favorito') || !impedirClic || !evento.detail) return;
    evento.preventDefault();
    evento.stopPropagation();
    impedirClic = false;
  }, true);
}

function crearTarjeta(ficha, fila) {
  const negocio = datosInicio.restaurantes[ficha.id];
  const base = plantilla.content.firstElementChild.cloneNode(true);
  const tarjeta = document.createElement('a');
  tarjeta.className = base.className;
  tarjeta.href = './perfil-negocio.html?' + new URLSearchParams({ negocio: ficha.id, origen: 'inicio' });
  tarjeta.append(...base.childNodes);
  tarjeta.dataset.restauranteId = ficha.id;
  const imagen = tarjeta.querySelector('.imagen-restaurante');
  imagenLocal(imagen, negocio.imagen);
  const recorte = crearElemento('div');
  recorte.className = 'recorte-establecimiento';
  imagen.before(recorte);
  recorte.append(imagen);
  tarjeta.querySelector('h3').textContent = negocio.nombre;
  tarjeta.querySelector('.promocion-restaurante').textContent = datosInicio.entrega;
  for (const etiqueta of negocio.etiquetas) {
    tarjeta.querySelector('.etiquetas').append(crearElemento('li', etiqueta));
  }
  return envolverTarjetaInicio(tarjeta, ficha, fila, negocio.nombre);
}

function crearTarjetaTop(ficha) {
  const negocio = datosNegocios[ficha.negocioId];
  const producto = negocio.productos.find(({ id }) => id === ficha.id);
  const tarjeta = crearElemento('a');
  tarjeta.className = 'tarjeta-top restaurante';
  tarjeta.href = producto.ruta + '?' + new URLSearchParams({ negocio: negocio.id, producto: producto.id, origen: 'top' });
  tarjeta.dataset.productoId = producto.id;
  const foto = crearElemento('div');
  foto.className = 'foto-restaurante';
  const recorte = crearElemento('div');
  recorte.className = 'recorte-top';
  const imagen = crearElemento('img');
  imagenLocal(imagen, producto.imagenCard || producto.imagen);
  if (producto.id !== 'sweet-sweetie-soda-fresa' && producto.fotoCard) {
    const [ancho, alto, izquierda, arriba] = producto.fotoCard;
    Object.assign(imagen.style, { width: ancho + '%', height: alto + '%', left: izquierda + '%', top: arriba + '%' });
  }
  recorte.append(imagen);
  foto.append(recorte, crearElemento('small', negocio.nombre));
  const descripcion = crearElemento('p', producto.descripcion);
  const precio = crearElemento('strong', producto.precio);
  tarjeta.append(foto, crearElemento('h3', producto.nombre), descripcion, precio);
  return tarjeta;
}

function envolverTarjetaInicio(tarjeta, ficha, fila, nombre) {
  tarjeta.draggable = false;
  tarjeta.addEventListener('click', (evento) => {
    if (!esActivacionNormal(evento)) return;
    const filas = [...catalogo.querySelectorAll('.carrusel-restaurantes')];
    history.replaceState({
      ...history.state, hamScrollInicio: document.querySelector('#contenido-inicio').scrollTop,
      hamScrollFilasInicio: filas.map((carrusel) => carrusel.scrollLeft)
    }, '');
    if (!fila.productos) recordarOrigenNegocio(tarjeta);
  });

  const soporte = document.createElement('div');
  soporte.className = 'soporte-favorito-inicio';
  if (!fila.productos) soporte.dataset.restauranteId = ficha.id;
  const idTarjeta = claveTarjetaInicio(fila.id, ficha.colocacion);
  soporte.dataset.tarjetaId = idTarjeta;
  const corazon = crearCorazon(fila.productos ? 'producto' : 'establecimiento', ficha.id, nombre, ficha.negocioId, idTarjeta);
  corazon.setAttribute('aria-label', 'Favorito: ' + nombre + ' en ' + fila.titulo);
  corazon.addEventListener('pointerdown', (evento) => {
    // Evita que al tocar un corazón parcialmente visible el foco desplace la fila.
    evento.preventDefault();
  });
  soporte.append(tarjeta, corazon);
  return soporte;
}

function renderizarRestaurantes() {
  catalogo.replaceChildren();

  for (const fila of datosInicio.filas) {
    if (!fila.tarjetas.length) continue;

    const seccion = crearElemento('section');
    const carrusel = crearElemento('div');
    carrusel.className = 'carrusel-restaurantes';
    carrusel.tabIndex = 0;
    carrusel.setAttribute('role', 'region');
    carrusel.setAttribute('aria-label', fila.titulo);
    carrusel.append(...fila.tarjetas.map((ficha) => {
      if (!fila.productos) return crearTarjeta(ficha, fila);
      const tarjeta = crearTarjetaTop(ficha);
      return envolverTarjetaInicio(tarjeta, ficha, fila, tarjeta.querySelector('h3').textContent);
    }));
    activarArrastreDeFila(carrusel);
    seccion.append(crearElemento('h2', fila.titulo), carrusel);
    catalogo.append(seccion);
  }

  if (!catalogo.childElementCount) catalogo.append(crearElemento('p', 'No se encontraron restaurantes.'));
}

renderizarRestaurantes();
if (Number.isFinite(history.state?.hamScrollInicio)) {
  document.querySelector('#contenido-inicio').scrollTop = history.state.hamScrollInicio;
  catalogo.querySelectorAll('.carrusel-restaurantes').forEach((fila, indice) => {
    fila.scrollLeft = history.state.hamScrollFilasInicio?.[indice] || 0;
  });
}

const ubicacionInicio = document.querySelector('#ubicacion-inicio');
let novedadPausadaPorDireccion;

function actualizarUbicacionInicio() {
  const direccion = direccionActiva();
  const etiqueta = direccion
    ? 'Dirección seleccionada: ' + direccion.nombre + ', ' + direccion.detalle + '. Cambiar dirección'
    : 'Seleccionar dirección';
  ubicacionInicio.setAttribute('aria-label', etiqueta);
  ubicacionInicio.title = etiqueta;
}

ubicacionInicio.addEventListener('click', () => {
  if (dialogoDirecciones.open) return;
  clearTimeout(temporizadorNovedad);
  novedadPausadaPorDireccion = animacionNovedad ? destinoNovedad : undefined;
  detenerAnimacionNovedad();
  abrirDirecciones(ubicacionInicio);
});

dialogoDirecciones.addEventListener('close', () => {
  if (novedadPausadaPorDireccion !== undefined) {
    moverNovedad(novedadPausadaPorDireccion);
    novedadPausadaPorDireccion = undefined;
  } else {
    programarNovedad();
  }
});

document.addEventListener('ham:direccion-seleccionada', actualizarUbicacionInicio);
window.addEventListener('pageshow', actualizarUbicacionInicio);
actualizarUbicacionInicio();
