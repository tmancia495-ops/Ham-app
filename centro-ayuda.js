const consultaAyuda = document.querySelector('#consulta-ayuda');
const listaPreguntasAyuda = document.querySelector('#lista-preguntas-ayuda');
const temasContenedorAyuda = document.querySelector('#opciones-temas-ayuda');
const botonTodasAyuda = document.querySelector('#todas-preguntas-ayuda');
const dialogoContactoAyuda = document.querySelector('.dialogo-ayuda');
const correoSoporteAyuda = document.querySelector('#correo-soporte-ayuda');
const estadoCopiaAyuda = document.querySelector('#estado-copia-ayuda');
let categoriaAyuda = '';
let verTodasAyuda = false;

function normalizarAyuda(texto) {
  return texto.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').trim();
}

function enlaceAyuda(texto, ruta) {
  const enlace = document.createElement('a');
  enlace.href = ruta;
  enlace.textContent = texto;
  return enlace;
}

function mostrarContactoAyuda() {
  estadoCopiaAyuda.textContent = '';
  dialogoContactoAyuda.showModal();
}

function agregarSeguimientosAyuda(contenedor) {
  contenedor.replaceChildren();
  const cuenta = perfilCuentaActiva();
  let pedidos = [];
  try {
    if (cuenta) pedidos = leerPedidosConfirmados().filter((pedido) =>
      typeof pedido.id === 'string' && pedido.id && etapasPedido(pedido.metodo).length &&
      pedido.lineas?.length && (pedido.metodo === 'recoger' ? Array.isArray(pedido.retiro?.puntos) : pedido.entrega));
  } catch {
    const aviso = document.createElement('p');
    aviso.textContent = 'No se pudieron cargar tus pedidos. Puedes volver a Inicio o consultar el Carrito.';
    contenedor.append(aviso, enlaceAyuda('Volver a Inicio', './inicio.html'));
    return;
  }
  const activo = (pedido) => pedido.estado !== etapasPedido(pedido.metodo).at(-1);
  const activos = pedidos.filter(activo).reverse();
  const anteriores = pedidos.filter((pedido) => !activo(pedido)).reverse();
  if (!activos.length) {
    const aviso = document.createElement('p');
    aviso.textContent = cuenta ? 'No tienes pedidos activos en esta cuenta.' : 'Inicia sesión para ver los pedidos guardados en tu cuenta.';
    contenedor.append(aviso, enlaceAyuda('Volver a Inicio', './inicio.html'));
  }
  for (const [titulo, grupo] of [['Pedidos activos', activos], ['Pedidos anteriores', anteriores]]) {
    if (!grupo.length) continue;
    const texto = document.createElement('p');
    texto.textContent = titulo;
    const lista = document.createElement('ul');
    for (const pedido of grupo) {
      const fila = document.createElement('li');
      const negocio = pedido.lineas[0]?.negocio?.nombre;
      const nombre = ['Pedido ' + folioPedido(pedido.id), negocio, pedido.simulado ? 'Simulación' : ''].filter(Boolean).join(' · ');
      fila.append(enlaceAyuda(nombre, rutaSeguimiento(pedido.id)));
      lista.append(fila);
    }
    contenedor.append(texto, lista);
  }
}

const tarjetasAyuda = preguntasAyuda.map((pregunta) => {
  const tarjeta = document.querySelector('#plantilla-pregunta-ayuda').content.firstElementChild.cloneNode(true);
  const boton = tarjeta.querySelector('button');
  const respuesta = tarjeta.querySelector('.respuesta-ayuda');
  tarjeta.dataset.pregunta = pregunta.id;
  respuesta.id = 'respuesta-ayuda-' + pregunta.id;
  boton.setAttribute('aria-controls', respuesta.id);
  boton.querySelector('strong').textContent = pregunta.pregunta;
  const resumen = boton.querySelector('small');
  resumen.textContent = pregunta.resumen || '';
  resumen.hidden = !pregunta.resumen;
  respuesta.querySelector('p').textContent = pregunta.respuesta;
  if (pregunta.enlace) {
    const enlace = enlaceAyuda(pregunta.enlace.texto, pregunta.enlace.ruta);
    if (pregunta.enlace.ruta === '#contacto-ayuda') {
      enlace.setAttribute('aria-haspopup', 'dialog');
      enlace.addEventListener('click', (evento) => {
        evento.preventDefault();
        mostrarContactoAyuda();
      });
    }
    respuesta.querySelector('.enlaces-ayuda').append(enlace);
  }
  boton.addEventListener('click', () => {
    const abierto = boton.getAttribute('aria-expanded') === 'true';
    if (!abierto && pregunta.pedidos) agregarSeguimientosAyuda(respuesta.querySelector('.enlaces-ayuda'));
    boton.setAttribute('aria-expanded', String(!abierto));
    respuesta.inert = abierto;
  });
  listaPreguntasAyuda.append(tarjeta);
  return { tarjeta, pregunta, texto: normalizarAyuda([pregunta.pregunta, pregunta.respuesta, pregunta.resumen].join(' ')) };
});

function filtrarPreguntasAyuda() {
  const palabras = normalizarAyuda(consultaAyuda.value).split(/\s+/).filter(Boolean);
  let visibles = 0;
  for (const { tarjeta, pregunta, texto } of tarjetasAyuda) {
    const temaCorrecto = !categoriaAyuda || pregunta.categoria === categoriaAyuda;
    const mostrar = (verTodasAyuda || categoriaAyuda || palabras.length || pregunta.destacada) &&
      temaCorrecto && palabras.every((palabra) => texto.includes(palabra));
    tarjeta.hidden = !mostrar;
    if (mostrar) visibles += 1;
  }
  document.querySelector('#sin-resultados-ayuda').hidden = visibles > 0;
  for (const boton of temasContenedorAyuda.querySelectorAll('button')) {
    boton.setAttribute('aria-pressed', String(boton.dataset.tema === categoriaAyuda));
  }
  botonTodasAyuda.hidden = verTodasAyuda && !categoriaAyuda && !palabras.length;
}

for (const { id, nombre, icono } of temasAyuda) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.dataset.tema = id;
  boton.setAttribute('aria-controls', listaPreguntasAyuda.id);
  const figura = document.createElement('span');
  figura.className = 'icono-tema-ayuda';
  figura.setAttribute('aria-hidden', 'true');
  figura.textContent = icono;
  boton.append(figura, nombre);
  boton.addEventListener('click', () => {
    categoriaAyuda = categoriaAyuda === id ? '' : id;
    if (!categoriaAyuda) verTodasAyuda = true;
    filtrarPreguntasAyuda();
  });
  temasContenedorAyuda.append(boton);
}

consultaAyuda.addEventListener('input', () => {
  verTodasAyuda = true;
  filtrarPreguntasAyuda();
});
botonTodasAyuda.addEventListener('click', () => {
  categoriaAyuda = '';
  consultaAyuda.value = '';
  verTodasAyuda = true;
  filtrarPreguntasAyuda();
  const primera = listaPreguntasAyuda.querySelector('article:not([hidden]) button');
  primera?.focus({ preventScroll: true });
});
document.querySelector('#contacto-ayuda').addEventListener('click', mostrarContactoAyuda);
document.querySelector('#copiar-correo-ayuda').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(correoSoporteAyuda.value);
    estadoCopiaAyuda.textContent = 'Correo copiado.';
  } catch {
    correoSoporteAyuda.focus();
    correoSoporteAyuda.select();
    estadoCopiaAyuda.textContent = 'Seleccionamos el correo para que puedas copiarlo.';
  }
});

window.addEventListener('pageshow', () => {
  const enlaces = document.querySelector('[data-pregunta="estado-pedido"] .enlaces-ayuda');
  if (enlaces?.hasChildNodes()) agregarSeguimientosAyuda(enlaces);
});
window.visualViewport?.addEventListener('resize', () => {
  if (document.activeElement === consultaAyuda) document.body.style.setProperty('--alto-ayuda', window.visualViewport.height + 'px');
  else document.body.style.removeProperty('--alto-ayuda');
});
filtrarPreguntasAyuda();
