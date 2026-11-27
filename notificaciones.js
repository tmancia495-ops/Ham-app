const opcionesNotificaciones = [
  ['pedidos', 'pedido', 'Estado de pedidos', 'Recibe avisos sobre tu comida.'],
  ['promociones', 'promociones', 'Promociones', 'Descuentos y ofertas de Ham!.'],
  ['productos', 'productos', 'Nuevos productos', 'Descubre lo nuevo en la PEA.'],
  ['actualizaciones', 'actualizaciones', 'Actualizaciones de Ham!', 'Cambios importantes de la app.'],
  ['correos', 'correos', 'Correos', 'Recibe novedades en tu email.']
];

const pantallaNotificaciones = document.querySelector('.preferencias-notificaciones');
const errorPreferencias = document.querySelector('#error-preferencias');

for (const [clave, icono, titulo, descripcion] of opcionesNotificaciones) {
  const tarjeta = document.querySelector('#tarjeta-preferencia').content.firstElementChild.cloneNode(true);
  tarjeta.dataset.preferencia = clave;
  tarjeta.querySelector('img').src = './assets/notificaciones-' + icono + '.svg';
  tarjeta.querySelector('strong').textContent = titulo;
  const ayuda = tarjeta.querySelector('.texto-preferencia > span');
  ayuda.textContent = descripcion;
  ayuda.id = 'descripcion-' + clave;
  tarjeta.setAttribute('aria-label', titulo);
  tarjeta.setAttribute('aria-describedby', ayuda.id);
  tarjeta.addEventListener('click', () => {
    try {
      const activo = !permiteNotificacionHam(clave);
      guardarPreferenciaNotificacionHam(clave, activo);
      tarjeta.setAttribute('aria-checked', String(activo));
      errorPreferencias.textContent = '';
    } catch {
      errorPreferencias.textContent = 'No se pudo guardar la preferencia. Intenta de nuevo.';
    }
  });
  document.querySelector(clave === 'pedidos' ? '#preferencias-actividad' : '#preferencias-novedades').append(tarjeta);
}

function mostrarPreferenciasNotificaciones() {
  if (!perfilCuentaActiva()) {
    location.replace(rutaAccesoPerfil());
    return;
  }
  for (const tarjeta of pantallaNotificaciones.querySelectorAll('[data-preferencia]')) {
    tarjeta.setAttribute('aria-checked', String(permiteNotificacionHam(tarjeta.dataset.preferencia)));
  }
  pantallaNotificaciones.hidden = false;
  document.querySelector('[data-barra-ham]').hidden = false;
}

mostrarPreferenciasNotificaciones();
window.addEventListener('pageshow', (evento) => { if (evento.persisted) mostrarPreferenciasNotificaciones(); });
window.addEventListener('storage', (evento) => {
  if (evento.key === claveDatosCuenta(CLAVE_PREFERENCIAS_NOTIFICACIONES)) mostrarPreferenciasNotificaciones();
});
