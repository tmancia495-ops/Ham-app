const pantallaSolicitudHam = document.querySelector('main');
const campoTiempoSolicitudHam = document.querySelector('#cronometro-solicitud');
const aprobarBotonHam = document.querySelector('#aprobar-solicitud');
const enlaceRolSolicitudHam = document.querySelector('#entrar-rol-solicitud');
const errorEstadoSolicitudHam = document.querySelector('#error-estado-solicitud');
let intervaloEstadoSolicitudHam;

const textosSolicitudHam = {
  courier: { etiqueta: 'REPARTIDOR', revision: 'repartir dentro de la UCA', titulo: '¡Ya puedes repartir!',
    detalle: 'Tu perfil de repartidor está activo.\n¡Es momento de comenzar!',
    siguiente: 'Explorá los pedidos disponibles y activá tu disponibilidad cuando quieras.',
    boton: 'Entrar a mi perfil de repartidor', destino: './inicio.html#perfil', nodos: ['934:1290', '934:1344'] },
  merchant: { etiqueta: 'NEGOCIO', revision: 'registrar tu negocio', titulo: '¡Tu negocio está aprobado!',
    detalle: 'Tu tienda está lista para comenzar.\n¡Hacé que te encuentren en Ham!',
    siguiente: 'Organizá tu catálogo, agregá productos y preparate para recibir pedidos.',
    boton: 'Entrar a mi tienda', destino: './inicio.html#tienda', nodos: ['934:1372', '934:1426'] }
};

function textoSolicitudHam(id, texto) {
  document.getElementById(id).textContent = texto;
}

function pintarTiempoSolicitudHam() {
  const { solicitud } = estadoRolesHam();
  if (!solicitud) return;
  const restante = tiempoRevisionHam(solicitud);
  const segundos = Math.ceil((restante ?? 0) / 1000);
  campoTiempoSolicitudHam.textContent = [Math.floor(segundos / 60), segundos % 60]
    .map((n) => String(n).padStart(2, '0')).join(':');
}

function pintarEstadoSolicitudHam() {
  clearInterval(intervaloEstadoSolicitudHam);
  const estado = estadoRolesHam();
  const textos = textosSolicitudHam[estado.tipo];
  const pendiente = estado.rol.endsWith('_pending');
  const aprobada = estado.rol === 'courier_active' || estado.rol === 'merchant';
  if (!textos || (!pendiente && !aprobada)) {
    location.replace(perfilCuentaActiva() ? './inicio.html#perfil' : rutaAccesoPerfil());
    return;
  }

  pantallaSolicitudHam.hidden = false;
  barraHam.hidden = aprobada;
  document.body.classList.toggle('solicitud-confirmada', aprobada);
  pantallaSolicitudHam.dataset.nodeId = textos.nodos[Number(aprobada)];
  document.querySelector('#revision-solicitud').hidden = aprobada;
  document.querySelector('#aprobada-solicitud').hidden = !aprobada;
  document.querySelector('#tipo-estado-solicitud').hidden = aprobada;
  document.querySelector('#volver-estado-solicitud').hidden = aprobada;
  aprobarBotonHam.hidden = aprobada;
  enlaceRolSolicitudHam.hidden = !aprobada;
  textoSolicitudHam('titulo-estado-solicitud', aprobada ? 'Solicitud aprobada' : 'Estado de solicitud');
  document.title = document.getElementById('titulo-estado-solicitud').textContent + ' · Ham!';
  textoSolicitudHam('saludo-estado-solicitud', aprobada ? '¡Bienvenido a Ham!' : '¡Ya falta poquito!');
  textoSolicitudHam('introduccion-estado-solicitud', aprobada ? 'Tu nuevo perfil está listo para comenzar.' : 'Estamos revisando los datos de tu solicitud.');
  textoSolicitudHam('insignia-estado-solicitud', aprobada ? '✓ APROBADA' : '◷ EN REVISIÓN');
  textoSolicitudHam('tipo-estado-solicitud', textos.etiqueta);
  textoSolicitudHam('mensaje-revision', 'Tu solicitud para ' + textos.revision + ' está en revisión.\nTe avisaremos cuando esté aprobada.');
  textoSolicitudHam('mensaje-aprobada', textos.titulo);
  textoSolicitudHam('detalle-aprobada', textos.detalle);
  textoSolicitudHam('detalle-siguiente-solicitud', textos.siguiente);
  enlaceRolSolicitudHam.textContent = textos.boton;
  enlaceRolSolicitudHam.href = textos.destino;
  if (pendiente) {
    pintarTiempoSolicitudHam();
    if (!document.hidden) intervaloEstadoSolicitudHam = setInterval(pintarTiempoSolicitudHam, 1000);
  }
}

function actualizarEstadoSolicitudHam() {
  const aprobada = !estadoRolesHam().rol.endsWith('_pending');
  if (aprobada === document.body.classList.contains('solicitud-confirmada')) return;
  clearInterval(intervaloEstadoSolicitudHam);
  transicionVistaHam('estado-solicitud', false, pintarEstadoSolicitudHam, 'cabecera-compartida');
}

aprobarBotonHam.addEventListener('click', async () => {
  aprobarBotonHam.disabled = true;
  errorEstadoSolicitudHam.hidden = true;
  try {
    await aprobarSolicitudHam('manual-demo');
  } catch (error) {
    errorEstadoSolicitudHam.textContent = error.message;
    errorEstadoSolicitudHam.hidden = false;
  } finally {
    aprobarBotonHam.disabled = false;
  }
});
enlaceRolSolicitudHam.addEventListener('click', async (evento) => {
  if (evento.button || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();
  const cuenta = perfilCuentaActiva()?.id;
  const destino = enlaceRolSolicitudHam.href;
  try {
    if (cuenta) await conBloqueoRolHam(cuenta, () => {
      const estado = estadoRolesHam(cuenta);
      if (perfilCuentaActiva()?.id === cuenta && ['merchant', 'courier_active'].includes(estado.rol)) {
        guardarEstadoSolicitudHam(cuenta, estado, { confirmacionVista: true });
      }
    });
  } catch {
    // La aprobación ya se guardó. El acceso al rol sigue disponible.
  }
  navegarPantallaHam(destino, { reemplazar: true });
});
document.addEventListener(EVENTO_ROL_HAM, actualizarEstadoSolicitudHam);
window.addEventListener('storage', (evento) => {
  if ([CLAVE_SOLICITUD_REPARTIDOR, CLAVE_SOLICITUDES_NEGOCIO].some((clave) => evento.key === claveDatosCuenta(clave))) actualizarEstadoSolicitudHam();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clearInterval(intervaloEstadoSolicitudHam);
  else pintarEstadoSolicitudHam();
});
window.addEventListener('pagehide', () => clearInterval(intervaloEstadoSolicitudHam));
window.addEventListener('pageshow', (evento) => { if (evento.persisted) pintarEstadoSolicitudHam(); });
pintarEstadoSolicitudHam();