function rutaNegocio(id, origen) {
  if (!Object.hasOwn(datosNegocios, id)) return undefined;
  return './perfil-negocio.html?' + new URLSearchParams({ negocio: id, origen });
}

function recordarOrigenNegocio(enlace) {
  try {
    sessionStorage.setItem('ham.destinoNegocio', enlace.href);
  } catch {
    // El enlace Volver también lleva a la vista de origen.
  }
}

function esActivacionNormal(evento) {
  return !evento.ctrlKey && !evento.metaKey && !evento.shiftKey && !evento.altKey;
}
