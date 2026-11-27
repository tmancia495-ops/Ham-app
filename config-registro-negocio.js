// Sustituye estas opciones de prueba por los puntos oficiales de la PEA.
const UBICACIONES_PEA = Object.freeze({
  'puesto-a': 'Puesto A (provisional)',
  'puesto-b': 'Puesto B (provisional)',
  'puesto-c': 'Puesto C (provisional)'
});

// El nombre del archivo de cada ícono sirve como referencia estable del catálogo.
const CATEGORIAS_REGISTRO_NEGOCIO = Object.freeze({
  'comida-rapida': 'Comida rápida',
  ...Object.fromEntries(datosInicio.categorias.map(({ imagen, nombre }) => [imagen.replace(/\.svg$/, ''), nombre]))
});

