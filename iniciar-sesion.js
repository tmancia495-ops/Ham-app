const formulario = document.querySelector('#formulario-acceso');
const contrasena = document.querySelector('#contrasena');
const mostrar = document.querySelector('#mostrar-contrasena');
const estado = document.querySelector('#estado-acceso');
const recuperar = document.querySelector('#recuperar');
const recordar = document.querySelector('#recordar-sesion');

function accederDesdeInicioSesion() {
  const destino = new URLSearchParams(location.search).get('destino');
  location.replace(Object.hasOwn(destinosCuentaHam, destino) ? destinosCuentaHam[destino] : './inicio.html');
}

function limpiarCamposAcceso() {
  formulario.reset();
  contrasena.type = 'password';
  mostrar.textContent = 'Mostrar';
  estado.textContent = '';
}

window.addEventListener('pagehide', limpiarCamposAcceso);
function recuperarAccesoRecordado() {
  if (document.documentElement.classList.contains('splash-activo') || pasoSolicitadoRecuperacion()) return;
  const cuenta = perfilCuentaActiva();
  if (cuenta?.id && cuenta.id === sesionRecordada()?.id) accederDesdeInicioSesion();
}
window.addEventListener('pageshow', () => {
  limpiarCamposAcceso();
  recuperarAccesoRecordado();
});
window.addEventListener('ham:fin-arranque', recuperarAccesoRecordado);

mostrar.addEventListener('click', () => {
  const visible = contrasena.type === 'password';
  contrasena.type = visible ? 'text' : 'password';
  mostrar.textContent = visible ? 'Ocultar' : 'Mostrar';
});

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const boton = formulario.querySelector('.enviar');
  if (boton.disabled) return;
  boton.disabled = true;
  try {
    const cuenta = correoCuenta(formulario.querySelector('input[type="email"]').value);
    if (cuenta === correoRecuperacionDemo) {
      if (!await validarClaveAccesoDemo(contrasena.value)) {
        estado.textContent = 'La contraseña de la cuenta DEMO es incorrecta.';
        return;
      }
      if (pasoSolicitadoRecuperacion()) return;
      if (!cuentaRegistrada(cuenta)) guardarPerfilCuenta(cuenta, { nombre: 'Cuenta DEMO' });
    }
    if (!iniciarCuentaLocal(cuenta, recordar.checked)) {
      estado.textContent = 'No hay un perfil local para este correo. Crea una cuenta para continuar.';
      return;
    }
    limpiarCamposAcceso();
    accederDesdeInicioSesion();
  } catch {
    estado.textContent = 'No se pudo abrir la sesión local en este navegador.';
  } finally {
    boton.disabled = false;
  }
});

formulario.addEventListener('input', () => {
  estado.textContent = '';
});


mostrar.hidden = false;
formulario.querySelector('.enviar').disabled = false;
recuperar.disabled = false;
