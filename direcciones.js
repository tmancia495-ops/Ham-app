const CLAVE_DIRECCIONES = 'ham.direcciones';
const CLAVE_DIRECCION_ACTIVA = 'ham.direccionActiva';

function leerDirecciones() {
  return JSON.parse(leerDatoRecuperableCuenta(CLAVE_DIRECCIONES) || '[]');
}

function direccionActiva() {
  try {
    const id = leerDatoRecuperableCuenta(CLAVE_DIRECCION_ACTIVA);
    return leerDirecciones().find((direccion) => direccion.id === id) || null;
  } catch {
    return null;
  }
}

function seleccionarDireccion(id) {
  if (!leerDirecciones().some((direccion) => direccion.id === id)) return false;
  guardarDatoRecuperableCuenta(CLAVE_DIRECCION_ACTIVA, id);
  document.dispatchEvent(new Event('ham:direccion-seleccionada'));
  actualizarControlesDireccion();
  return true;
}

const iconoDireccion = (nombre) => './assets/direccion-' + nombre + '.svg';

const dialogoDirecciones = document.createElement('dialog');
dialogoDirecciones.className = 'dialogo-direcciones';
dialogoDirecciones.innerHTML = `
  <section class="hoja-direcciones" data-node-id="469:82">
    <div class="barra-direcciones" aria-hidden="true"></div>
    <header>
      <h2 id="titulo-selector-direccion" tabindex="-1">Selecciona tu dirección</h2>
      <p>¿Dónde quieres recibir tu pedido?</p>
    </header>
    <h3>Direcciones guardadas</h3>
    <ul class="lista-direcciones"></ul>
    <p class="sin-direcciones" hidden>Aún no tienes direcciones guardadas.</p>
    <button class="fila-direccion agregar-direccion" type="button">
      <span class="icono-direccion"><img src="${iconoDireccion('mas')}" alt=""></span>
      <span>Agregar otra dirección</span>
      <img src="${iconoDireccion('flecha')}" alt="">
    </button>
    <button class="cancelar-direccion" type="button">Cancelar</button>
    <p class="estado-selector" role="status"></p>
  </section>
  <section class="vista-nueva-direccion" data-node-id="469:285" hidden>
    <header>
      <button class="volver-direcciones" type="button" aria-label="Volver">
        <img src="${iconoDireccion('volver')}" alt="">
      </button>
      <h2 id="titulo-nueva-direccion" tabindex="-1">Nueva dirección</h2>
    </header>
    <form class="formulario-direccion">
      <h3>Agrega un lugar de entrega</h3>
      <p>Especifica dónde podemos encontrarte.</p>
      <div class="campos-direccion">
        <label>Nombre del lugar
          <input name="nombre" placeholder="Ej. Mi salón, biblioteca, edificio..." required maxlength="100">
        </label>
        <label>Dirección
          <input name="detalle" placeholder="Edificio, nivel y ubicación" required maxlength="180">
        </label>
        <label>Indicaciones (opcional)
          <input name="indicaciones" placeholder="Punto de referencia para la entrega" maxlength="200">
        </label>
      </div>
      <section class="vista-previa-direccion" aria-labelledby="titulo-vista-direccion">
        <img src="${iconoDireccion('vista-pin')}" alt="">
        <div>
          <h4 id="titulo-vista-direccion">Tu dirección</h4>
          <strong data-previa-nombre hidden></strong>
          <p data-previa-detalle>Aquí aparecerá la dirección que agregues.</p>
          <p data-previa-indicaciones hidden></p>
        </div>
      </section>
      <button class="guardar-direccion" type="submit">Guardar dirección</button>
      <p class="estado-direccion" role="status"></p>
    </form>
  </section>
`;
document.body.append(dialogoDirecciones);

const hojaDirecciones = dialogoDirecciones.querySelector('.hoja-direcciones');
const vistaNuevaDireccion = dialogoDirecciones.querySelector('.vista-nueva-direccion');
const listaDirecciones = dialogoDirecciones.querySelector('.lista-direcciones');
const formularioDireccion = dialogoDirecciones.querySelector('.formulario-direccion');
const botonGuardarDireccion = formularioDireccion.querySelector('button[type="submit"]');
const estadoSelectorDireccion = dialogoDirecciones.querySelector('.estado-selector');
const estadoNuevaDireccion = formularioDireccion.querySelector('.estado-direccion');
const controlesDireccion = [...document.querySelectorAll('[data-direccion-entrega]')];
let origenDireccion;

function dibujarDirecciones() {
  listaDirecciones.replaceChildren();
  estadoSelectorDireccion.textContent = '';
  let guardadas = [];
  try {
    guardadas = leerDirecciones();
  } catch {
    estadoSelectorDireccion.textContent = 'No se pudieron leer las direcciones guardadas.';
  }

  const activa = direccionActiva()?.id;
  for (const direccion of guardadas) {
    const item = document.createElement('li');
    const opcion = document.createElement('button');
    opcion.className = 'fila-direccion opcion-direccion';
    opcion.type = 'button';
    opcion.dataset.direccionId = direccion.id;
    opcion.setAttribute('aria-pressed', String(activa === direccion.id));
    opcion.innerHTML = `
      <span class="icono-direccion"><img src="${iconoDireccion('pin')}" alt=""></span>
      <span class="texto-direccion"><strong></strong><span></span></span>
      <span class="marca-direccion" aria-hidden="true">
        <img src="${iconoDireccion('circulo')}" alt=""><img src="${iconoDireccion('check')}" alt="">
      </span>`;
    opcion.querySelector('strong').textContent = direccion.nombre;
    opcion.querySelector('.texto-direccion > span').textContent = direccion.detalle;
    opcion.addEventListener('click', () => {
      try {
        if (seleccionarDireccion(direccion.id)) cerrarDirecciones();
      } catch {
        estadoSelectorDireccion.textContent = 'No se pudo seleccionar la dirección.';
      }
    });
    item.append(opcion);
    listaDirecciones.append(item);
  }
  dialogoDirecciones.querySelector('.sin-direcciones').hidden = Boolean(guardadas.length);
}

function cambiarVistaDireccion(nueva) {
  dialogoDirecciones.dataset.vista = nueva ? 'nueva' : 'selector';
  hojaDirecciones.hidden = nueva;
  vistaNuevaDireccion.hidden = !nueva;
  const id = nueva ? 'titulo-nueva-direccion' : 'titulo-selector-direccion';
  dialogoDirecciones.setAttribute('aria-labelledby', id);
  ajustarPanelDireccion();
  if (dialogoDirecciones.open) document.getElementById(id).focus({ preventScroll: true });
}

function abrirDirecciones(origen) {
  if (!perfilCuentaActiva()) { location.assign('./iniciar-sesion.html'); return; }
  if (dialogoDirecciones.open) return;
  origenDireccion = origen;
  dibujarDirecciones();
  cambiarVistaDireccion(false);
  dialogoDirecciones.showModal();
  document.querySelector('#titulo-selector-direccion').focus({ preventScroll: true });
}

function cerrarDirecciones() {
  if (!dialogoDirecciones.open || dialogoDirecciones.dataset.cerrando) return;
  if (formularioDireccion.contains(document.activeElement)) document.activeElement.blur();
  dialogoDirecciones.dataset.cerrando = 'true';
  const demora = reducirMovimientoHam.matches ? 0
    : parseFloat(getComputedStyle(dialogoDirecciones).getPropertyValue('--duracion-transicion-ham'));
  window.setTimeout(() => {
    dialogoDirecciones.close();
    delete dialogoDirecciones.dataset.cerrando;
    origenDireccion?.focus({ preventScroll: true });
  }, demora);
}

function actualizarControlesDireccion() {
  const actual = direccionActiva();
  for (const control of controlesDireccion) {
    control.querySelector('strong').textContent = actual?.nombre || 'Seleccionar dirección';
    const detalle = control.querySelector('[data-detalle-direccion]');
    detalle.textContent = actual?.detalle || '';
    detalle.hidden = !actual;
  }
}

for (const control of controlesDireccion) {
  const boton = document.createElement('button');
  boton.className = 'control-direccion-entrega';
  boton.type = 'button';
  boton.setAttribute('aria-haspopup', 'dialog');
  boton.innerHTML = `
    <img src="${iconoDireccion('vista-pin')}" alt="">
    <span><strong>Seleccionar dirección</strong><span data-detalle-direccion hidden></span></span>
    <img src="${iconoDireccion('flecha')}" alt="">`;
  boton.addEventListener('click', () => abrirDirecciones(boton));
  control.append(boton);
}

function ajustarPanelDireccion() {
  const viewport = window.visualViewport;
  const fondo = document.body.getBoundingClientRect().bottom;
  const teclado = dialogoDirecciones.dataset.vista === 'nueva' && viewport && viewport.scale <= 1.05
    ? Math.max(0, fondo - viewport.height - viewport.offsetTop) : 0;
  dialogoDirecciones.style.setProperty('--teclado-direccion', teclado + 'px');
}

function actualizarVistaDireccion() {
  for (const nombre of ['nombre', 'detalle', 'indicaciones']) {
    const campo = formularioDireccion.elements[nombre];
    const salida = formularioDireccion.querySelector('[data-previa-' + nombre + ']');
    const valor = campo.value.trim();
    salida.textContent = valor || (nombre === 'detalle' ? 'Aquí aparecerá la dirección que agregues.' : '');
    salida.hidden = nombre !== 'detalle' && !valor;
  }
}

dialogoDirecciones.querySelector('.agregar-direccion').addEventListener('click', () => {
  formularioDireccion.reset();
  for (const campo of formularioDireccion.querySelectorAll('input')) campo.setCustomValidity('');
  estadoNuevaDireccion.textContent = '';
  botonGuardarDireccion.disabled = false;
  actualizarVistaDireccion();
  cambiarVistaDireccion(true);
  vistaNuevaDireccion.scrollTop = 0;
});

dialogoDirecciones.querySelector('.cancelar-direccion').addEventListener('click', cerrarDirecciones);
dialogoDirecciones.querySelector('.volver-direcciones').addEventListener('click', () => cambiarVistaDireccion(false));
dialogoDirecciones.addEventListener('cancel', (evento) => {
  evento.preventDefault();
  if (dialogoDirecciones.dataset.vista === 'nueva') cambiarVistaDireccion(false);
  else cerrarDirecciones();
});
dialogoDirecciones.addEventListener('click', (evento) => {
  if (evento.target !== dialogoDirecciones || dialogoDirecciones.dataset.vista !== 'selector') return;
  const marco = dialogoDirecciones.getBoundingClientRect();
  if (evento.clientY < marco.top || evento.clientY > marco.bottom
    || evento.clientX < marco.left || evento.clientX > marco.right) cerrarDirecciones();
});

formularioDireccion.addEventListener('input', (evento) => {
  evento.target.setCustomValidity('');
  actualizarVistaDireccion();
});

formularioDireccion.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (botonGuardarDireccion.disabled) return;
  const nombre = formularioDireccion.elements.nombre.value.trim();
  const detalle = formularioDireccion.elements.detalle.value.trim();
  const indicaciones = formularioDireccion.elements.indicaciones.value.trim();

  if (!nombre || !detalle) {
    const campo = formularioDireccion.elements[!nombre ? 'nombre' : 'detalle'];
    campo.setCustomValidity(!nombre ? 'Escribe el nombre del lugar.' : 'Escribe la dirección.');
    campo.reportValidity();
    return;
  }

  botonGuardarDireccion.disabled = true;
  try {
    const direcciones = leerDirecciones();
    const existente = direcciones.find((actual) => actual.nombre === nombre && actual.detalle === detalle
      && actual.indicaciones === indicaciones);
    const direccion = existente || { id: crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'), nombre, detalle, indicaciones };
    if (!existente) {
      guardarDatoRecuperableCuenta(CLAVE_DIRECCIONES, JSON.stringify([...direcciones, direccion]));
    }
    seleccionarDireccion(direccion.id);
    cerrarDirecciones();
  } catch {
    estadoNuevaDireccion.textContent = 'No se pudo guardar la dirección. Inténtalo de nuevo.';
    botonGuardarDireccion.disabled = false;
  }
});

window.visualViewport?.addEventListener('resize', ajustarPanelDireccion);
window.visualViewport?.addEventListener('scroll', ajustarPanelDireccion);
window.addEventListener('pageshow', actualizarControlesDireccion);
actualizarControlesDireccion();
