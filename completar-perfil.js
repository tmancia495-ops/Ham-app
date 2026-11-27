const editarPerfilExistente = new URLSearchParams(location.search).get('editar') === '1';
const buscar = (id) => document.getElementById(id);
const formulario = buscar('formulario-perfil');
const nombre = buscar('nombre-perfil');
const dialogo = buscar('fotos');
const avatar = buscar('avatar');
const editar = buscar('editar-foto');
const fotoAvatar = buscar('avatar-foto');
const ultimaFoto = buscar('ultima-foto');
const archivo = buscar('archivo-foto');
const imagenGaleria = buscar('imagen-galeria');
const imagenCaptura = buscar('imagen-captura');
const video = buscar('video-camara');
const estadoCamara = buscar('estado-camara');
const disparador = buscar('capturar');
const girar = buscar('girar-camara');
const flash = buscar('flash');

const vistas = {
  panel: [dialogo.querySelector('.panel-foto'), buscar('titulo-fotos')],
  galeria: [dialogo.querySelector('.galeria'), buscar('titulo-galeria')],
  camara: [dialogo.querySelector('.camara'), buscar('titulo-camara')]
};

let botonOrigen;
let fotoConfirmada;
let fotoPendiente;
let operacionGaleria = 0;
let operacionCamara = 0;
let flujoCamara;
let orientacion = 'user';

try {
  nombre.value = sessionStorage.getItem('ham.nombreRegistro') || '';
} catch {
  // El perfil también se puede completar si el navegador bloquea el almacenamiento.
}

function mostrarVista(vista) {
  dialogo.dataset.vista = vista;
  for (const [clave, [seccion]] of Object.entries(vistas)) {
    seccion.hidden = clave !== vista;
  }
  const titulo = vistas[vista][1];
  dialogo.setAttribute('aria-labelledby', titulo.id);
  if (!dialogo.open) dialogo.showModal();
  titulo.focus();
}

function actualizarAvatar(url) {
  if (fotoConfirmada) URL.revokeObjectURL(fotoConfirmada);
  fotoConfirmada = url;
  for (const imagen of [fotoAvatar, ultimaFoto]) {
    if (url) imagen.src = url;
    else imagen.removeAttribute('src');
    imagen.hidden = !url;
  }
  buscar('avatar-usuario').hidden = Boolean(url);
  buscar('icono-ultima-foto').hidden = Boolean(url);
  const etiqueta = url ? 'Cambiar foto de perfil' : 'Añadir foto de perfil';
  editar.textContent = etiqueta;
  avatar.setAttribute('aria-label', etiqueta);
}

function descartarPendiente() {
  if (fotoPendiente) URL.revokeObjectURL(fotoPendiente);
  fotoPendiente = undefined;
  imagenGaleria.removeAttribute('src');
  imagenCaptura.removeAttribute('src');
}

function apagarCamara() {
  operacionCamara++;
  flujoCamara?.getTracks().forEach((pista) => pista.stop());
  flujoCamara = undefined;
  video.srcObject = null;
  disparador.disabled = true;
  girar.disabled = true;
  flash.disabled = true;
  flash.setAttribute('aria-pressed', 'false');
}

function cerrarFotos() {
  if (!dialogo.open) return;
  operacionGaleria++;
  apagarCamara();
  descartarPendiente();
  dialogo.close();
  botonOrigen?.focus();
}

function confirmarFoto() {
  if (!fotoPendiente) return;
  actualizarAvatar(fotoPendiente);
  fotoPendiente = undefined;
  cerrarFotos();
}

for (const boton of [avatar, editar]) {
  boton.addEventListener('click', () => {
    botonOrigen = boton;
    mostrarVista('panel');
  });
}

for (const boton of dialogo.querySelectorAll('[data-cerrar-fotos]')) {
  boton.addEventListener('click', cerrarFotos);
}

dialogo.addEventListener('cancel', (evento) => {
  evento.preventDefault();
  cerrarFotos();
});

dialogo.addEventListener('click', (evento) => {
  if (evento.target === dialogo && dialogo.dataset.vista === 'panel') cerrarFotos();
});

buscar('eliminar-foto').addEventListener('click', () => {
  actualizarAvatar();
  cerrarFotos();
});

function abrirGaleria() {
  apagarCamara();
  descartarPendiente();
  operacionGaleria++;
  archivo.value = '';
  buscar('error-galeria').textContent = '';
  buscar('muestra-galeria').hidden = true;
  buscar('seleccion-galeria').textContent = 'Ninguna foto seleccionada';
  buscar('usar-archivo').disabled = true;
  mostrarVista('galeria');
  archivo.click();
}

buscar('abrir-galeria').addEventListener('click', abrirGaleria);
buscar('galeria-camara').addEventListener('click', abrirGaleria);
buscar('elegir-archivo').addEventListener('click', () => {
  archivo.value = '';
  archivo.click();
});
buscar('usar-archivo').addEventListener('click', confirmarFoto);

archivo.addEventListener('change', async () => {
  const elegido = archivo.files[0];
  if (!elegido) return;

  const intento = ++operacionGaleria;
  const error = buscar('error-galeria');
  const usar = buscar('usar-archivo');
  error.textContent = 'Cargando imagen…';
  usar.disabled = true;

  const url = URL.createObjectURL(elegido);
  const prueba = new Image();
  prueba.src = url;
  try {
    await prueba.decode();
    if (intento !== operacionGaleria) {
      URL.revokeObjectURL(url);
      return;
    }
    descartarPendiente();
    fotoPendiente = url;
    imagenGaleria.src = url;
    buscar('muestra-galeria').hidden = false;
    buscar('seleccion-galeria').textContent = '1 foto seleccionada';
    error.textContent = '';
  } catch {
    URL.revokeObjectURL(url);
    if (intento === operacionGaleria) {
      error.textContent = 'No se pudo abrir esa imagen. Elige otra, por ejemplo JPG o PNG.';
    }
  } finally {
    if (intento === operacionGaleria) usar.disabled = !fotoPendiente;
  }
});

function mostrarErrorCamara(mensaje) {
  apagarCamara();
  estadoCamara.textContent = mensaje;
  buscar('guias-camara').hidden = true;
  buscar('volver-camara').hidden = false;
}

async function iniciarCamara() {
  apagarCamara();
  descartarPendiente();
  const intento = operacionCamara;

  video.hidden = false;
  imagenCaptura.hidden = true;
  buscar('guias-camara').hidden = false;
  buscar('controles-camara').hidden = false;
  buscar('controles-captura').hidden = true;
  buscar('volver-camara').hidden = true;
  estadoCamara.textContent = 'Abriendo cámara…';

  if (!navigator.mediaDevices?.getUserMedia) {
    mostrarErrorCamara('La cámara no está disponible aquí. Puedes volver o elegir una imagen de Galería.');
    return;
  }

  try {
    const flujo = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: orientacion } },
      audio: false
    });
    if (intento !== operacionCamara) {
      flujo.getTracks().forEach((pista) => pista.stop());
      return;
    }

    flujoCamara = flujo;
    const pista = flujo.getVideoTracks()[0];
    pista.addEventListener('ended', () => {
      if (flujoCamara === flujo) mostrarErrorCamara('La cámara se desconectó. Puedes volver o usar Galería.');
    });
    video.srcObject = flujo;
    await video.play();
    if (intento !== operacionCamara) return;

    estadoCamara.textContent = 'FOTO';
    disparador.disabled = false;
    flash.disabled = !pista.getCapabilities?.().torch;
    if (navigator.mediaDevices.enumerateDevices) {
      const dispositivos = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      if (intento === operacionCamara) {
        girar.disabled = dispositivos.filter(({ kind }) => kind === 'videoinput').length < 2;
      }
    }
  } catch (error) {
    if (intento !== operacionCamara) return;
    const motivo = error.name === 'NotAllowedError' ? 'Permiso de cámara denegado.' : 'No se pudo abrir la cámara.';
    mostrarErrorCamara(motivo + ' Puedes volver o elegir una imagen de Galería.');
  }
}

buscar('abrir-camara').addEventListener('click', () => {
  mostrarVista('camara');
  iniciarCamara();
});

girar.addEventListener('click', () => {
  orientacion = orientacion === 'user' ? 'environment' : 'user';
  iniciarCamara();
});

flash.addEventListener('click', async () => {
  const pista = flujoCamara?.getVideoTracks()[0];
  if (!pista) return;
  const encender = flash.getAttribute('aria-pressed') !== 'true';
  try {
    await pista.applyConstraints({ advanced: [{ torch: encender }] });
    if (pista === flujoCamara?.getVideoTracks()[0]) flash.setAttribute('aria-pressed', String(encender));
  } catch {
    if (pista === flujoCamara?.getVideoTracks()[0]) estadoCamara.textContent = 'Linterna no disponible.';
  }
});

disparador.addEventListener('click', () => {
  if (!video.videoWidth || !video.videoHeight) return;
  disparador.disabled = true;
  const intento = operacionCamara;
  const canvas = document.createElement('canvas');
  const escala = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * escala);
  canvas.height = Math.round(video.videoHeight * escala);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    if (intento !== operacionCamara) return;
    if (!blob) {
      estadoCamara.textContent = 'No se pudo capturar la foto. Intenta de nuevo.';
      disparador.disabled = false;
      return;
    }
    apagarCamara();
    fotoPendiente = URL.createObjectURL(blob);
    imagenCaptura.src = fotoPendiente;
    imagenCaptura.hidden = false;
    video.hidden = true;
    buscar('guias-camara').hidden = true;
    buscar('controles-camara').hidden = true;
    buscar('controles-captura').hidden = false;
    estadoCamara.textContent = 'Revisa tu foto';
    buscar('usar-captura').focus();
  }, 'image/jpeg', 0.9);
});

buscar('repetir').addEventListener('click', iniciarCamara);
buscar('usar-captura').addEventListener('click', confirmarFoto);

async function prepararFotoLocal() {
  if (!fotoConfirmada) return null;
  if (fotoConfirmada.startsWith('data:')) return fotoConfirmada;

  await fotoAvatar.decode();
  const lado = Math.min(fotoAvatar.naturalWidth, fotoAvatar.naturalHeight);
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = Math.min(512, lado);
  const contexto = lienzo.getContext('2d');
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, lienzo.width, lienzo.height);
  contexto.drawImage(
    fotoAvatar, (fotoAvatar.naturalWidth - lado) / 2, (fotoAvatar.naturalHeight - lado) / 2,
    lado, lado, 0, 0, lienzo.width, lienzo.height
  );
  return lienzo.toDataURL('image/jpeg', 0.85);
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const boton = formulario.querySelector('[type="submit"]');
  const estado = buscar('estado-guardar-perfil');
  if (boton.disabled) return;
  boton.disabled = true;
  estado.hidden = true;
  cerrarFotos();

  try {
    const perfil = {
      nombre: nombre.value.trim(),
      contacto: buscar('contacto').value.trim(),
      direccion: buscar('direccion').value.trim(),
      foto: await prepararFotoLocal()
    };
    const cuenta = editarPerfilExistente ? perfilCuentaActiva()?.id : sessionStorage.getItem('ham.correoRegistro');
    if (!cuenta) {
      location.replace(rutaAccesoPerfil());
      return;
    }
    const aceptacionLegal = editarPerfilExistente ? perfilCuentaActiva()?.perfil.aceptacionLegal
      : JSON.parse(sessionStorage.getItem('ham.aceptacionRegistro') || 'null');
    if (aceptacionLegal) perfil.aceptacionLegal = aceptacionLegal;
    guardarPerfilCuenta(cuenta, perfil);
    if (!editarPerfilExistente) iniciarCuentaLocal(cuenta);
    sessionStorage.removeItem('ham.correoRegistro');
    sessionStorage.removeItem('ham.nombreRegistro');
    sessionStorage.removeItem('ham.aceptacionRegistro');
    if (editarPerfilExistente) regresarAlPerfilEditado();
    else window.location.assign(formulario.action);
  } catch {
    estado.textContent = 'No se pudo guardar el perfil en este navegador. Inténtalo de nuevo.';
    estado.hidden = false;
  } finally {
    boton.disabled = false;
  }
});

window.addEventListener('pagehide', cerrarFotos);

if (editarPerfilExistente) {
  formulario.querySelector('[type="submit"]').textContent = 'Guardar cambios';
  const contenidoEdicion = formulario.closest('main');
  const cabeceraEdicion = contenidoEdicion.querySelector('.bienvenida');
  const tituloEdicion = buscar('titulo-perfil');
  const regresarEdicion = buscar('cancelar-edicion-perfil');
  const descripcionEdicion = contenidoEdicion.querySelector('.introduccion');
  const flecha = document.createElement('img');
  flecha.src = './assets/cuenta-volver.svg';
  flecha.alt = '';
  regresarEdicion.replaceChildren(flecha);
  regresarEdicion.setAttribute('aria-label', 'Volver al Perfil');
  regresarEdicion.href = './inicio.html#perfil';
  regresarEdicion.hidden = false;
  tituloEdicion.textContent = 'Información personal';
  cabeceraEdicion.replaceChildren(regresarEdicion, tituloEdicion, descripcionEdicion);
  document.body.classList.add('pagina-inicio', 'pagina-editor-perfil', 'ham-cabecera-ilustrada');
  contenidoEdicion.classList.add('ham-contenido-cabecera');
  contenidoEdicion.querySelector('.tarjeta').removeAttribute('aria-labelledby');
  function mostrarEditorPerfil() {
    const cuenta = perfilCuentaActiva();
    if (!cuenta) {
      location.replace(rutaAccesoPerfil());
      return;
    }
    contenidoEdicion.hidden = false;
    barraHam.hidden = false;
    const { perfil } = cuenta;
    nombre.value = perfil.nombre || '';
    buscar('contacto').value = perfil.contacto || '';
    buscar('direccion').value = perfil.direccion || '';
    actualizarAvatar(perfil.foto || undefined);
  }
  contenidoEdicion.hidden = true;
  mostrarEditorPerfil();
  window.addEventListener('pageshow', (evento) => {
    if (evento.persisted && !perfilCuentaActiva()) location.replace(rutaAccesoPerfil());
  });
}

function regresarAlPerfilEditado() {
  navegarPantallaHam('./inicio.html#perfil', { volver: true, reemplazar: true });
}

if (editarPerfilExistente) {
  buscar('cancelar-edicion-perfil').addEventListener('click', (evento) => {
    if (evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    regresarAlPerfilEditado();
  });
}
