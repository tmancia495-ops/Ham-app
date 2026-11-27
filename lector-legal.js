function montarDocumentoLegal(lector, id, retorno) {
  if (!Object.hasOwn(documentosLegales, id) || !contenidoDocumentosLegales[id]) return false;
  const documento = documentosLegales[id];
  lector.dataset.nodeId = documento.nodo;
  lector.dataset.documentoActual = id;
  lector.innerHTML = `
    <header class="cabecera-lector">
      <a id="volver-condiciones" aria-label="Volver"><img src="./assets/repartidor-volver-condiciones.svg" width="22" height="22" alt=""></a>
      <h1 tabindex="-1"></h1>
    </header>
    <div class="lectura-legal" tabindex="0" role="region">
      <article></article>
    </div>`;
  lector.querySelector('h1').textContent = documento.titulo;
  lector.querySelector('#volver-condiciones').href = retorno;
  lector.querySelector('.lectura-legal').setAttribute('aria-label', documento.titulo);
  lector.querySelector('article').innerHTML = contenidoDocumentosLegales[id];
  return true;
}

for (const lector of document.querySelectorAll('[data-documento-legal]')) {
  montarDocumentoLegal(lector, lector.dataset.documentoLegal, lector.dataset.retorno);
}
