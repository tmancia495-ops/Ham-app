const registro = document.querySelector('#formulario-registro');
const nombre = registro.querySelector('#nombre');
const correo = registro.querySelector('#correo');
const contrasena = registro.querySelector('#contrasena');
const mostrarContrasenaRegistro = registro.querySelector('#mostrar-contrasena');

function indicarVisibilidadContrasenaRegistro(visible) {
  contrasena.type = visible ? 'text' : 'password';
  mostrarContrasenaRegistro.textContent = visible ? 'Ocultar' : 'Mostrar';
  mostrarContrasenaRegistro.setAttribute('aria-pressed', String(visible));
}

mostrarContrasenaRegistro.addEventListener('click', () => {
  indicarVisibilidadContrasenaRegistro(contrasena.type === 'password');
});
mostrarContrasenaRegistro.hidden = false;
window.addEventListener('pagehide', () => indicarVisibilidadContrasenaRegistro(false));
const terminos = registro.querySelector('#aceptar-terminos');
const estado = registro.querySelector('#estado-registro');

function validarNombre() {
  const valor = nombre.value.trim();
  if (!valor) return 'Escribe tu nombre completo.';
  if (!/\p{L}/u.test(valor) || /\p{N}/u.test(valor)) {
    return 'Escribe un nombre válido, sin números.';
  }
  return '';
}

function validarCorreo() {
  if (correo.validity.valueMissing) return 'Escribe tu correo electrónico.';
  if (correo.validity.typeMismatch) return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  return '';
}

function validarContrasena() {
  if (!contrasena.value) return 'Escribe una contraseña.';
  if (Array.from(contrasena.value).length < contrasena.minLength) {
    return 'Usa al menos 8 caracteres.';
  }
  return '';
}

const validaciones = new Map([
  [nombre, validarNombre],
  [correo, validarCorreo],
  [contrasena, validarContrasena],
  [terminos, () => terminos.checked ? '' : 'Acepta los términos y la política de privacidad para continuar.']
]);

function validarCampo(campo) {
  const mensaje = validaciones.get(campo)();
  const error = document.getElementById(campo.getAttribute('aria-describedby'));
  error.textContent = mensaje;
  if (mensaje) {
    campo.setAttribute('aria-invalid', 'true');
  } else {
    campo.removeAttribute('aria-invalid');
  }
  return !mensaje;
}

registro.addEventListener('submit', (evento) => {
  evento.preventDefault();
  estado.textContent = '';
  let primerCampoInvalido;

  for (const campo of validaciones.keys()) {
    if (!validarCampo(campo)) primerCampoInvalido ??= campo;
  }

  if (primerCampoInvalido) {
    primerCampoInvalido.focus();
    return;
  }

  try {
    if (cuentaRegistrada(correo.value)) {
      correo.setAttribute('aria-invalid', 'true');
      document.querySelector('#error-correo').textContent = 'Ya hay un perfil local para este correo. Inicia sesión.';
      correo.focus();
      return;
    }
    sessionStorage.setItem('ham.correoRegistro', correoCuenta(correo.value));
    sessionStorage.setItem('ham.nombreRegistro', nombre.value.trim());
    sessionStorage.setItem('ham.aceptacionRegistro', JSON.stringify({
      fechaAceptacion: new Date().toISOString(),
      terminos: documentosLegales.terminos.version,
      privacidad: documentosLegales.privacidad.version
    }));
  } catch {
    estado.textContent = 'No se pudo preparar el registro en este navegador.';
    return;
  }
  registro.reset();
  window.location.assign('./completar-perfil.html');
});

for (const campo of validaciones.keys()) {
  const evento = campo === terminos ? 'change' : 'input';
  campo.addEventListener(evento, () => {
    estado.textContent = '';
    if (campo.hasAttribute('aria-invalid')) validarCampo(campo);
  });
}

registro.querySelector('.enviar').disabled = false;

const vistaRegistroLegal = document.querySelector('main.crear-cuenta');
const lectorRegistro = document.querySelector('.lector-legal');
const barraRegistroLegal = document.querySelector('.barra-legal');
let enlaceRegistroActivo;

function navegarMostrarLegalRegistro() {
  transicionVistaHam(location.hash, !location.hash, mostrarLegalRegistro);
}

function mostrarLegalRegistro() {
  const id = location.hash.slice(1);
  const abierto = id === 'terminos' || id === 'privacidad';
  vistaRegistroLegal.hidden = abierto;
  lectorRegistro.hidden = !abierto;
  barraRegistroLegal.hidden = !abierto;
  document.body.classList.toggle('pagina-inicio', abierto);
  document.title = (abierto ? documentosLegales[id].titulo : 'Crea tu cuenta') + ' · Ham!';
  if (abierto) {
    montarDocumentoLegal(lectorRegistro, id, './crear-cuenta.html');
    lectorRegistro.querySelector('h1').focus({ preventScroll: true });
  } else {
    enlaceRegistroActivo?.focus({ preventScroll: true });
  }
}

for (const enlace of registro.querySelectorAll('[data-legal-registro]')) {
  enlace.addEventListener('click', (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    enlaceRegistroActivo = enlace;
    history.pushState({ legalDesdeRegistro: true }, '', enlace.hash);
    navegarMostrarLegalRegistro();
  });
}
lectorRegistro.addEventListener('click', (evento) => {
  if (!evento.target.closest('#volver-condiciones') || !history.state?.legalDesdeRegistro) return;
  evento.preventDefault();
  history.back();
});
window.addEventListener('hashchange', navegarMostrarLegalRegistro);
mostrarLegalRegistro();
