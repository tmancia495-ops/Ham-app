// Agrega aquí las promociones oficiales. Montos y mínimos se expresan en centavos.
const CUPONES_OFICIALES = Object.freeze([]);

const CUPONES_EJEMPLO = Object.freeze([
  {
    id: 'ejemplo-ham10', codigo: 'HAM10', nombre: 'Descuento de muestra',
    descripcion: 'Esta promoción es ilustrativa\ny todavía no está activa.',
    tipo: 'porcentaje', valor: 10, estado: 'inactivo', ejemplo: true
  },
  {
    id: 'ejemplo-envio', nombre: 'Envío sin costo',
    descripcion: 'Cupón ilustrativo · sin activar',
    tipo: 'envio', estado: 'inactivo', ejemplo: true
  }
]);

// Estos códigos existen exclusivamente en las rutas abiertas con ?demo=1.
const CUPONES_PRUEBA = Object.freeze([
  {
    id: 'demo-ham10', codigo: 'DEMO-HAM10', nombre: '10 % de prueba',
    descripcion: 'Cupón ficticio para verificar porcentajes.',
    tipo: 'porcentaje', valor: 10, estado: 'activo', limiteUsos: 1, demo: true
  },
  {
    id: 'demo-fijo', codigo: 'DEMO-FIJO', nombre: 'Monto fijo de prueba',
    descripcion: 'Cupón ficticio para LOLOS, con compra mínima de $5.00.',
    tipo: 'monto', valor: 100, estado: 'activo',
    establecimientos: ['rest-001'], minimoCentavos: 500, demo: true
  },
  {
    id: 'demo-envio', codigo: 'DEMO-ENVIO', nombre: 'Envío de prueba',
    descripcion: 'Requiere una tarifa de entrega configurada.',
    tipo: 'envio', estado: 'activo', demo: true
  },
  {
    id: 'demo-vencido', codigo: 'DEMO-VENCIDO', nombre: 'Cupón vencido de prueba',
    descripcion: 'Cupón ficticio para verificar vencimientos.',
    tipo: 'monto', valor: 100, estado: 'activo', vence: '2000-01-01T00:00:00Z', demo: true
  }
]);
