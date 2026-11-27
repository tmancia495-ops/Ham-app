function crearElemento(etiqueta, texto) {
  const elemento = document.createElement(etiqueta);
  if (texto) elemento.textContent = texto;
  return elemento;
}

function imagenLocal(imagen, archivo) {
  imagen.src = './assets/' + archivo;
  imagen.alt = '';
}

function crearTarjetaPromocional(novedad, { informativa = false } = {}) {
  const diapositiva = crearElemento('article');
  diapositiva.className = 'novedad ' + novedad.estilo;
  const imagen = crearElemento('img');
  imagenLocal(imagen, novedad.imagen);
  const arte = crearElemento('div');
  arte.className = 'arte-novedad';
  arte.append(imagen);
  if (novedad.estilo === 'latte') {
    const segundoVaso = imagen.cloneNode();
    segundoVaso.className = 'segundo-vaso';
    arte.append(segundoVaso);
  }

  const comprar = crearElemento(informativa ? 'button' : 'span', 'Comprar →');
  comprar.className = 'comprar';
  if (informativa) {
    comprar.type = 'button';
    comprar.disabled = true;
  }
  diapositiva.append(crearElemento('h2', novedad.titulo), arte, crearElemento('p', novedad.texto), comprar);
  if (novedad.precio) {
    const descripcion = crearElemento('p', novedad.descripcion);
    descripcion.className = 'descripcion-papas';
    diapositiva.append(descripcion);
    const precio = crearElemento('strong', novedad.precio);
    precio.className = 'precio-novedad';
    diapositiva.append(precio, crearElemento('small', novedad.restaurante));
  }
  return diapositiva;
}
