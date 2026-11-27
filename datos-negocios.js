// Conserva los IDs cuando cambien los nombres o las imágenes.
const extrasLolos = ['Aguacate', 'Cebolla caramelizada', 'Extra de queso'];

function productoLolos(id, nombre, precioCentavos, descripcion, archivo, nodo, fotoCard, fotoDetalle) {
  return {
    id, negocioId: 'rest-001', nombre, descripcion, precioCentavos,
    precio: '$' + (precioCentavos / 100).toFixed(2),
    ruta: './producto.html', categoria: 'Panini', extras: extrasLolos, disponible: true,
    imagen: 'lolos/' + archivo + '-card.png',
    imagenDetalle: 'lolos/' + archivo + '-detalle.png',
    nodo, fotoCard, fotoDetalle, valoracion: 4
  };
}
const extrasSweetPlace = ['Aguacate', 'Queso', 'Jamón'];

function productoSweetPlace(archivo, nombre, descripcion, precioCentavos, nodo, conExtras, fotoCard, fotoDetalle, imagenCard) {
  return {
    id: 'sweet-' + archivo, negocioId: 'rest-002', nombre, descripcion, precioCentavos,
    nombreCarrito: ['Croissant', 'Sweetie soda'].includes(nombre) ? nombre + ' · ' + descripcion : nombre,
    precio: '$' + (precioCentavos / 100).toFixed(2),
    ruta: './producto.html', categoria: 'Panini', extras: conExtras ? extrasSweetPlace : [], disponible: true,
    imagen: 'sweet-place/' + archivo + (imagenCard ? '-detalle.png' : '-card.png'),
    imagenCard,
    imagenDetalle: 'sweet-place/' + archivo + '-detalle.png',
    nodo, fotoCard, fotoDetalle, valoracion: 4
  };
}

function productoFrutiLove(archivo, nombre, precioCentavos, descripcion, nodo, fotoCard, fotoDetalle, categoria = '') {
  return {
    id: 'fruti-' + archivo, negocioId: 'rest-004', nombre, nombreCarrito: nombre, descripcion, precioCentavos,
    precio: '$' + (precioCentavos / 100).toFixed(2),
    ruta: './producto.html', categoria, extras: [], disponible: true,
    imagen: 'fruti-love/' + archivo + '-card.png',
    imagenDetalle: 'fruti-love/' + archivo + '-detalle.png',
    nodo, fotoCard, fotoDetalle, valoracion: 4
  };
}

function productoElChory(archivo, nombre, precioCentavos, descripcion, nodo, fotoCard, fotoDetalle) {
  return {
    id: 'chory-' + archivo, negocioId: 'rest-005', nombre, descripcion, precioCentavos,
    precio: '$' + (precioCentavos / 100).toFixed(2),
    ruta: './producto.html', categoria: '', extras: [], disponible: true,
    imagen: 'el-chory/' + archivo + '-card.png',
    imagenDetalle: 'el-chory/' + archivo + '-detalle.png',
    nodo, fotoCard, fotoDetalle, valoracion: 4
  };
}

const datosNegocios = {
  'rest-001': {
    id: 'rest-001',
    nombre: 'LOLO´S',
    direccion: 'MQH7+G2F, C. del Cantábrico',
    imagen: 'inicio-lolos.png',
    promocion: { nombre: 'Fries', imagen: 'negocio-lolos-fries.png' },
    nodoCatalogo: '964:1294',
    productos: [
      productoLolos('lolos-07', 'Burguernini', 575, 'Es la combinación perfecta entre lo monchoso de la hamburguesa', 'burguernini', '964:1399', [187.97, 131.3, -54.51, -15.74], [291, 248, 8.5, 41, 204.61, 160.08, -60.21, -31.85]),
      productoLolos('lolos-red-line', 'Red Line', 650, "Pan brioche, carne Lolo's style, queso americano, aguacate y jalapeño", 'red-line', '964:1445', [179.26, 125.21, -39.19, -17.04], [311, 233, 1.5, 41, 191.96, 170.84, -45.66, -44.22]),
      productoLolos('lolos-03', 'All Star', 350, 'Pan ciabatta, jamón ahumado, salami, queso Monterey Jack y queso americano', 'all-star', '964:1491', [143.16, 100, -21.57, -.01], [450, 300, 2, -3]),
      productoLolos('lolos-04', 'Fit', 350, 'Pan ciabata, jamón ahumado de pavo, queso Monterey Jack y aguacate', 'fit', '964:1537', [143.16, 100, -25.64, .04], [466, 311, 0, 11]),
      productoLolos('lolos-05', 'MVP', 350, 'Pan ciabatta, pulled pork y queso Monterey Jack y aguacate', 'mvp', '964:1583', [143.16, 100, -21.06, .12], [406, 271, -2, 24]),
      productoLolos('lolos-06', 'Golden Pollo', 400, 'Pan ciabatta, pollo a la plancha y queso Monterey Jack', 'golden-pollo', '964:1629', [100, 100, 0, 0], [411, 274, -.5, 28])
    ],
    productosAnteriores: [
      { id: 'lolos-01', ruta: './producto.html', precioCentavos: 175, categoria: 'Panini', extras: ['Aguacate', 'Cebolla caramelizada', 'Extra de queso'], imagenDetalle: 'producto-tradicional.png', valoracion: 4, descripcionDetalle: 'Delicioso panini de pan ciabata y queso americano', nombre: 'Tradicional', precio: '$1.75', descripcion: 'Pan ciabatta y queso americano', imagen: 'lolos-tradicional.png', recorte: '-15.64%' },
      { id: 'lolos-02', ruta: './producto.html', precioCentavos: 225, categoria: 'Panini', extras: [], nombre: 'Clásico', precio: '$2.25', descripcion: 'Pan ciabatta, jamón ahumado y queso americano', imagen: 'lolos-clasico.png' },
      { id: 'lolos-08', ruta: './producto.html', precioCentavos: 400, categoria: 'Panini', extras: [], nombre: 'Full Set', precio: '$4.00', descripcion: 'Pan ciabatta, jamón ahumado y queso americano', imagen: 'lolos-full-set.png' },
      { id: 'lolos-09', ruta: './producto.html', precioCentavos: null, categoria: '', extras: [], nombre: 'Combo', precio: '+ $1', descripcion: 'Pan ciabatta, jamón ahumado, salami, queso Monterey Jack y queso americano', imagen: 'lolos-combo.png', recorte: '-15.64%' }
    ]
  },
  'rest-002': {
    id: 'rest-002',
    nombre: 'Sweet Place',
    promocionInicio: 'latte',
    direccion: 'MQH7+G2F, C. del Cantábrico',
    direccionCompleta: 'MQH7+G2F, C. del Cantábrico',
    imagen: 'inicio-sweet.png',
    nodoCatalogo: '1018:1681',
    productos: [
      productoSweetPlace('croissant-pavo', 'Croissant', 'Huevo y jamón de pavo', 225, '1018:1785', true, [100, 100, 0, 0], [510, 340, 7, 16]),
      productoSweetPlace('bagel', 'Bagel', 'Huevo y jamón de pavo', 250, '1018:1830', true, [100, 100, 0, 0], [327, 223, -6.5, 46, 185.72, 181.48, -40.51, -50.26]),
      productoSweetPlace('muffin', 'Muffin', 'Huevo y jamón de pavo', 250, '1018:1875', true, [100, 100, 0, 0], [298, 222, 2, 42, 170.18, 152.18, -43.27, -24.32]),
      productoSweetPlace('croissant-fresa', 'Croissant', 'Nutalla y fresa', 350, '1018:1920', false, [158.05, 110.4, -29.02, .14], [351, 262, 13.5, 53, 178.57, 159.44, -38.96, -24.65]),
      productoSweetPlace('ciabatta', 'Ciabatta', 'Huevo y jamón de pavo', 225, '1018:1960', true, [142.81, 99.76, -21.41, -.03], [335, 191, 6.5, 87, 151.17, 177.21, -24.4, -57.21]),
      productoSweetPlace('panini-porky', 'Panini', 'Porky chipotle', 350, '1018:2005', true, [154.67, 108.04, -16.41, .32], [452, 301, 30, -3]),
      productoSweetPlace('sweetie-soda-maracuya', 'Sweetie soda', 'Soda sabor maracuyá', 175, '1022:1681', false, [100, 157.12, .36, -18.67], [275, 276, 28.5, 9, 100.86, 150.67, -.85, -15.64], 'Foto 3_sweetplace.jpg'),
      productoSweetPlace('sweetie-soda-fresa', 'Sweetie soda', 'Soda sabor fresa', 175, '1022:1721', false, [100, 157.12, .36, -18.67], [273, 272, 5.5, 13, 100, 150.38, 0, -15.38], 'Foto 3_sweetplace-1.jpg'),
      productoSweetPlace('sweetie-soda', 'Sweetie soda', 'Soda sabor mora', 175, '1018:2050', false, [100, 157.12, .36, -18.67], [269, 268, -.5, 11, 100, 150.31, 0, -14.27])
    ]
  },
  'rest-004': {
    id: 'rest-004',
    nombre: 'Fruti Love',
    nombreInicio: 'Fruit Love',
    direccion: 'MQH7+G2F, C. del Cantábrico',
    direccionCompleta: 'MQH7+G2F, C. del Cantábrico',
    imagen: 'WhatsApp Image 2026-11-26 at 4.56.02 PM.jpeg',
    nodoCatalogo: '987:4319',
    productos: [
      productoFrutiLove('sandwich', 'Sandwich', 125, 'Pan de molde relleno de jamón y queso derretido.', '987:4441', [100, 100, 0, 0], [325, 235, 14.5, 54, 131.62, 121.51, -21.79, -13.12], 'Panini'),
      productoFrutiLove('ciabatta-jamon-queso', 'Ciabatta', 250, 'Pan artesanal tipo ciabatta relleno de jamón y queso.', '987:4487', [100, 100, 0, 0], [359, 281, 10.5, 25, 155.84, 132.61, -29.87, -14.37], 'Panini'),
      productoFrutiLove('vaso-frutero', 'Vaso frutero', 150, 'Vaso personal con variedad de fruta fresca de temporada.', '987:4533', [100, 100, 0, 0], [254, 272, 7, 15, 197.24, 122.7, -48.07, -12.89]),
      productoFrutiLove('croissant', 'Croissant', 250, 'Pan croissant hojaldrado relleno de nutella y fresas.', '987:4579', [158.05, 110.4, -29.02, 0.14], [351, 262, 13.5, 53, 178.57, 159.44, -38.96, -24.65]),
      productoFrutiLove('ciabatta-eleccion', 'Ciabatta', 225, 'Pan ciabatta relleno a elección de pechuga de pollo, carne o salami.', '987:4625', [142.81, 99.76, -21.41, -0.03], [335, 191, 6.5, 87, 151.17, 177.21, -24.4, -57.21], 'Panini'),
      productoFrutiLove('bagel', 'Bagel', 350, 'Pan bagel artesanal preparado con ingredientes seleccionados.', '987:4671', [154.67, 108.04, -27.13, 0.46], [315, 244, -0.5, 47, 196.26, 168.38, -49.85, -38.24]),
      productoFrutiLove('frutero-premium', 'Frutero premium', 200, 'Porción de frutas seleccionadas con topping.', '987:4717', [151.25, 105.65, -29.96, 0.51], [230, 297, 7, -3, 257.14, 132.65, -74.15, -19.48]),
      productoFrutiLove('fruiti-fresas', 'Fruiti fresas', 300, 'Vaso de 10 oz con fresas picadas bañadas en crema dulce.', '987:4762', [152.21, 106.32, -42.77, 0.15], [237, 338, 3.5, -43, 237.58, 111.18, -66.58, -4.97])
    ]
  },
  'rest-005': {
    id: 'rest-005',
    nombre: 'El Chory',
    direccion: 'MQH7+G2F, C. del Cantábrico',
    direccionCompleta: 'MQH7+G2F, C. del Cantábrico',
    imagen: 'WhatsApp Image 2026-11-26 at 5.03.33 PM.jpeg',
    nodoCatalogo: '1016:5167',
    productos: [
      productoElChory('burrito', 'Burrito', 350, 'Un burrito lleno de sabor para cualquier antojo', '1016:5289', [100, 100, 0, 0], [353, 168, -0.5, 110, 123.18, 172.33, -11.16, -30.76]),
      productoElChory('combo-1', 'Combo 1', 400, 'Combina Burrito + Papas', '1016:5334', [143.22, 100, -21.61, 0], [405, 270, 1.5, 1]),
      productoElChory('choripan-arg', 'Choripan arg', 350, 'El clásico argentino con el toque de El Chory', '1016:5379', [100, 100, 0, 0], [385, 257, -0.5, 21]),
      productoElChory('coca-cola', 'Coca-Cola', 100, 'El clásico refresco para acompañar tu comida', '1016:5424', [158.05, 110.4, -29.02, -5.01], [155, 262, -0.5, 2, 286.96, 112.89, -97.61, -6.88]),
      productoElChory('frozen', 'Frozen', 225, 'Una bebida helada, dulce y refrescante', '1016:5469', [142.81, 99.76, -21.41, -0.03], [471, 314, 16.5, -20]),
      productoElChory('sprite', 'Sprite', 100, 'Refresco cítrico para acompañar tu antojo', '1016:5514', [154.67, 108.04, -24.41, 0.32], [168, 322, 0, -20, 287.31, 100, -91.27, 0]),
      productoElChory('te-lipton', 'Té Lipton', 125, 'Té frío y refrescante para acompañar tu comida', '1016:5559', [143.22, 100, -26.22, 0], [125, 302, 6.5, -3, 363.2, 100, -132.51, 0])
    ]
  }
};