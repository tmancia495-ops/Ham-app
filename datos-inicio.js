// Agrega ruta a cada ficha cuando exista su página individual.
// Contenido provisional. Conserva los IDs al cambiar nombres, fotos o etiquetas.
const datosInicio = {
  categorias: [
    { nombre: 'Hamburguesas', imagen: 'inicio-hamburguesas.svg' },
    { nombre: 'Bebidas frias', imagen: 'inicio-bebidas.svg' },
    { nombre: 'Comida china', imagen: 'inicio-china.svg' },
    { nombre: 'Comida fit', imagen: 'inicio-fit.svg' }
  ],
  novedades: [
    { estilo: 'nuevo', titulo: 'NUEVO EN\nEL MENÚ', imagen: 'inicio-novedad.png', texto: 'Un corte pensado para los que de verdad traen hambre. ¡Solo en El Rinconcito Universitario!' },
    { estilo: 'latte', titulo: 'ICED LATTE\n2x1', imagen: 'inicio-latte.png', producto: { id: 'prod-001', nombre: 'Iced Latte', etiquetas: ['Bebidas frías'], restauranteId: 'rest-002' }, texto: '¡Compra uno y llévate el segundo gratis! Válido hoy en Sweet Place.' },
    { estilo: 'papas', titulo: 'AÑADE UN\nANTOJO MÁS', imagen: 'inicio-papas.png', producto: { id: 'prod-002', nombre: 'Orden de papas', etiquetas: ['Papas'], restauranteId: 'rest-001' }, texto: 'Por tan solo', precio: '$1.50', descripcion: 'añades una orden de papas.', restaurante: 'LOLO´S' }
  ],
  novedadInicial: 1,
  restaurantes: {
    'rest-001': { nombre: datosNegocios['rest-001'].nombre, imagen: datosNegocios['rest-001'].imagen, categoriaFavoritos: 'Paninis y hamburguesas', etiquetas: ['Paninis', 'Hamburguesas', 'Papas'] },
    'rest-002': { nombre: 'Sweet Place', imagen: 'inicio-sweet.png', categoriaFavoritos: 'Bebidas y antojos', etiquetas: ['Paninis', 'Bebidas frías', 'Antojos'] },
    'rest-004': { nombre: datosNegocios['rest-004'].nombreInicio, imagen: datosNegocios['rest-004'].imagen, etiquetas: ['Paninis', 'Fruta', 'Crepas'] },
    'rest-005': { nombre: datosNegocios['rest-005'].nombre, imagen: datosNegocios['rest-005'].imagen, etiquetas: ['Chorys', 'Hot Dogs'] },
    'rest-003': { nombre: 'El Rinconcito', imagen: 'inicio-rinconcito.png', recorte: 'centro', categoriaFavoritos: 'Tacos y burritos', etiquetas: ['Paninis', 'Tacos', 'Burritos'] }
  },
  entrega: 'Delivery gratis hasta 20/03/2027',
  filas: []
};

function repetirTarjetas(tarjetas) {
  return Array.from({ length: 9 }, (_, indice) => {
    const vuelta = Math.floor(indice / tarjetas.length);
    const tarjeta = tarjetas[indice % tarjetas.length];
    return vuelta ? { ...tarjeta, colocacion: tarjeta.colocacion + '-' + vuelta } : tarjeta;
  });
}

const tarjetasPopulares = repetirTarjetas([
  { colocacion: 'lolos-destacado', id: 'rest-001' },
  { colocacion: 'sweet-place', id: 'rest-002' },
  { colocacion: 'fruit-love', id: 'rest-004' },
  { colocacion: 'el-chory', id: 'rest-005' }
]);
// Conserva la clave del segundo LOLO’S para los favoritos guardados.
tarjetasPopulares[4].colocacion = 'lolos-adicional';
const tarjetasTop = repetirTarjetas([
  { colocacion: 'all-star', id: 'lolos-03', negocioId: 'rest-001' },
  { colocacion: 'croissant-fresa', id: 'sweet-croissant-fresa', negocioId: 'rest-002' },
  { colocacion: 'red-line', id: 'lolos-red-line', negocioId: 'rest-001' },
  { colocacion: 'sweetie-fresa', id: 'sweet-sweetie-soda-fresa', negocioId: 'rest-002' }
]);

datosInicio.filas = [
  { id: 'populares-a', titulo: 'Los más populares', tarjetas: tarjetasPopulares },
  { id: 'top-a', titulo: 'Productos TOP', tarjetas: tarjetasTop, productos: true },
  { id: 'populares-b', titulo: 'Los más populares', tarjetas: tarjetasPopulares },
  { id: 'top-b', titulo: 'Productos TOP', tarjetas: tarjetasTop, productos: true }
];

function claveTarjetaInicio(filaId, colocacion) {
  return 'tarjeta:' + filaId + ':' + colocacion;
}

function fichaTarjetaFavoritaInicio(clave) {
  if (typeof clave !== 'string') return null;
  const [prefijo, filaId, colocacion, ...resto] = clave.split(':');
  if (prefijo !== 'tarjeta' || resto.length) return null;

  const fila = datosInicio.filas.find(({ id }) => id === filaId);
  const tarjeta = fila?.tarjetas.find((elemento) => elemento.colocacion === colocacion);
  if (tarjeta?.negocioId) {
    const negocio = datosNegocios[tarjeta.negocioId];
    const producto = negocio.productos.find(({ id }) => id === tarjeta.id);
    return {
      ...producto, id: producto.id, claveTarjeta: clave, negocio: negocio.id,
      imagen: producto.imagenCard || producto.imagen, categoria: negocio.nombre + ' · ' + producto.precio
    };
  }

  const legado = ['casera-a', 'casera-b', 'populares-a', 'populares-b'].includes(filaId)
    ? { 'lolos-destacado': 'rest-001', 'sweet-place': 'rest-002', rinconcito: 'rest-003', 'lolos-adicional': 'rest-001' }[colocacion]
    : undefined;
  const negocio = fichaEstablecimientoInicio(tarjeta?.id || legado);
  return negocio ? { ...negocio, id: clave, negocioId: negocio.id, categoria: (fila?.titulo || 'Comida casera') + ' · ' + negocio.categoria } : null;
}

function fichaEstablecimientoInicio(id) {
  if (!Object.hasOwn(datosInicio.restaurantes, id)) return null;
  const datos = datosInicio.restaurantes[id];
  return {
    id, nombre: datos.nombre, imagen: datos.imagen, recorte: datos.recorte,
    categoria: datos.categoriaFavoritos || datos.etiquetas.join(' · ')
  };
}
