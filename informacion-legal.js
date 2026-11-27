const indiceLegal = document.querySelector('.indice-legal');
const lectorLegal = document.querySelector('.lector-legal');
let enlaceLegalActivo;

function navegarMostrarRutaLegal() {
  transicionVistaHam(location.hash, !location.hash, mostrarRutaLegal);
}

function mostrarRutaLegal() {
  const id = location.hash.slice(1);
  const abierto = Object.hasOwn(documentosLegales, id);
  document.body.classList.toggle('ham-cabecera-ilustrada', !abierto);
  indiceLegal.hidden = abierto;
  lectorLegal.hidden = !abierto;
  if (abierto) {
    if (lectorLegal.dataset.documentoActual !== id) montarDocumentoLegal(lectorLegal, id, './informacion-legal.html');
    lectorLegal.querySelector('.lectura-legal').scrollTop = 0;
    lectorLegal.querySelector('h1').focus({ preventScroll: true });
  } else if (enlaceLegalActivo) {
    enlaceLegalActivo.focus({ preventScroll: true });
  }
  document.title = (abierto ? documentosLegales[id].titulo : 'Información legal') + ' · Ham!';
}

indiceLegal.querySelector('ol').addEventListener('click', (evento) => {
  const enlace = evento.target.closest('a');
  if (!enlace || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();
  enlaceLegalActivo = enlace;
  history.pushState({ documentoDesdeIndice: true }, '', enlace.hash);
  navegarMostrarRutaLegal();
});

lectorLegal.addEventListener('click', (evento) => {
  if (!evento.target.closest('#volver-condiciones') || !history.state?.documentoDesdeIndice ||
    evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return;
  evento.preventDefault();
  history.back();
});

window.addEventListener('hashchange', navegarMostrarRutaLegal);
mostrarRutaLegal();
