const formularioCupon = document.querySelector('#formulario-cupon');
const codigoCupon = document.querySelector('#codigo-cupon');
const mensajeCupon = document.querySelector('#mensaje-cupon');
const listaCupones = document.querySelector('#lista-cupones');
const dialogoCupon = document.querySelector('.dialogo-cupon');

function mostrarMensajeCupon(mensaje, error = false) {
  mensajeCupon.textContent = mensaje;
  codigoCupon.setAttribute('aria-invalid', String(error));
}

function mostrarCupones() {
  const guardados = cuponesGuardados();
  const pedidos = leerPedidosConfirmados();
  listaCupones.replaceChildren();
  for (const cupon of catalogoCupones()) {
    const guardado = guardados.includes(cupon.id);
    if (!cupon.ejemplo && !guardado && !(cupon.publico && !errorCupon(cupon, pedidos))) continue;
    const tarjeta = document.querySelector('#plantilla-cupon').content.firstElementChild.cloneNode(true);
    const envio = cupon.tipo === 'envio';
    tarjeta.classList.toggle('envio', envio);
    const beneficio = tarjeta.querySelector('.beneficio-cupon');
    const estado = cupon.ejemplo ? 'EJEMPLO' : cupon.demo ? 'PRUEBA' : errorCupon(cupon, pedidos) ? 'NO DISPONIBLE' : 'ACTIVO';
    if (envio) {
      const icono = new Image(34, 34);
      icono.src = './assets/cupon-envio.svg';
      icono.alt = cupon.ejemplo ? '' : 'Envío sin costo';
      beneficio.replaceChildren(icono);
    } else {
      beneficio.querySelector('strong').textContent = cupon.tipo === 'porcentaje' ? cupon.valor + '%' : '$' + (cupon.valor / 100).toFixed(2);
      beneficio.querySelector('span').textContent = estado;
    }
    tarjeta.querySelector('h3').textContent = cupon.nombre;
    tarjeta.querySelector('.texto-cupon > p').textContent = cupon.descripcion;
    tarjeta.querySelector('.etiqueta-cupon').textContent = cupon.codigo || estado;
    if (cupon.vence && !cupon.ejemplo) {
      const vigencia = tarjeta.querySelector('.vigencia-cupon');
      vigencia.textContent = 'Vencimiento: ' + new Date(cupon.vence).toLocaleDateString('es-SV');
      vigencia.hidden = false;
    }
    const detalle = tarjeta.querySelector('.detalle-cupon');
    detalle.hidden = !cupon.ejemplo || !cupon.codigo;
    detalle.addEventListener('click', () => {
      dialogoCupon.querySelector('h2').textContent = cupon.codigo;
      dialogoCupon.querySelector('p').textContent = errorCupon(cupon, pedidos);
      dialogoCupon.showModal();
    });
    const accion = tarjeta.querySelector('.accion-cupon');
    if (!cupon.ejemplo && cupon.codigo && !errorCupon(cupon, pedidos)) {
      accion.hidden = false;
      accion.textContent = 'Copiar';
      accion.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(cupon.codigo);
          mostrarMensajeCupon('Código copiado.');
        } catch {
          codigoCupon.value = cupon.codigo;
          codigoCupon.focus();
          codigoCupon.select();
          mostrarMensajeCupon('Código seleccionado para copiar.');
        }
      });
    }
    listaCupones.append(tarjeta);
  }
}

codigoCupon.addEventListener('input', () => mostrarMensajeCupon(''));

formularioCupon.addEventListener('submit', (evento) => {
  evento.preventDefault();
  if (!codigoCupon.value.trim()) {
    mostrarMensajeCupon('Escribe un código de descuento.', true);
    codigoCupon.focus();
    return;
  }
  try {
    const cuenta = perfilCuentaActiva()?.id;
    if (!cuenta) { location.replace(rutaAccesoPerfil()); return; }
    const cupon = buscarCupon(codigoCupon.value);
    const error = errorCupon(cupon, leerPedidosConfirmados());
    if (error) { mostrarMensajeCupon(error, true); return; }
    const nuevo = guardarCupon(cupon, cuenta);
    formularioCupon.reset();
    mostrarMensajeCupon(nuevo ? 'Código guardado en tu cuenta.' : 'Este código ya está guardado en tu cuenta.');
    mostrarCupones();
  } catch {
    mostrarMensajeCupon('No se pudo guardar el código. Intenta de nuevo.', true);
  }
});

function mostrarPantallaCupones() {
  if (!perfilCuentaActiva()) { location.replace(rutaAccesoPerfil()); return; }
  document.querySelector('main').hidden = false;
  document.querySelector('[data-barra-ham]').hidden = false;
  mostrarCupones();
}
mostrarPantallaCupones();
window.addEventListener('pageshow', (evento) => { if (evento.persisted) mostrarPantallaCupones(); });
