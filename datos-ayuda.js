const temasAyuda = [
  { id: 'pedidos', nombre: 'Mis pedidos', icono: '▣' },
  { id: 'pagos', nombre: 'Pagos', icono: '$' },
  { id: 'cuenta', nombre: 'Mi cuenta', icono: '●' },
  { id: 'soporte', nombre: 'Soporte', icono: '?' }
];

const preguntasAyuda = [
  {
    id: 'estado-pedido', categoria: 'pedidos', destacada: true,
    pregunta: '¿Dónde está mi pedido?', resumen: 'Consulta el estado de tu compra.',
    respuesta: 'Consulta Seguimiento del pedido para ver el progreso de una compra confirmada. También puedes abrir un pedido desde el historial del Carrito.',
    pedidos: true
  },
  {
    id: 'hora-retiro', categoria: 'pedidos', destacada: true,
    pregunta: '¿Puedo cambiar la hora de retiro?', resumen: 'Revisa la disponibilidad de tu local.',
    respuesta: 'Puedes elegir la hora de retiro en el Carrito antes de confirmar. Para consultar un cambio después de confirmar, habla directamente con el establecimiento. Ham! todavía no permite editar una reserva confirmada.'
  },
  {
    id: 'pagar', categoria: 'pagos',
    pregunta: '¿Cómo pago mi pedido?',
    respuesta: 'Ham! no procesa pagos en línea. El cobro se realiza directamente según el método que acuerdes con el establecimiento y, cuando corresponda, con el repartidor.'
  },
  {
    id: 'cobros', categoria: 'pagos',
    pregunta: '¿Qué hago si hay un cobro incorrecto o quiero una devolución?',
    respuesta: 'Consulta directamente con quien recibió el pago. Las compras se acuerdan con terceros y Ham! no gestiona devoluciones de cobros que no realizó. Consulta la política para conocer el alcance.',
    enlace: { texto: 'Ver Cancelaciones y reembolsos', ruta: './informacion-legal.html#cancelaciones' }
  },
  {
    id: 'crear-cuenta', categoria: 'cuenta',
    pregunta: '¿Cómo creo una cuenta?',
    respuesta: 'En Iniciar sesión, toca Regístrate. Escribe tu nombre y correo, elige una contraseña de al menos ocho caracteres y acepta los términos y la política de privacidad. Después podrás completar tu perfil.',
    enlace: { texto: 'Ir a Crear cuenta', ruta: './crear-cuenta.html' }
  },
  {
    id: 'editar-perfil', categoria: 'cuenta',
    pregunta: '¿Cómo edito mi información personal?',
    respuesta: 'En Perfil, abre Información personal. Puedes actualizar tu nombre, número de contacto y dirección. Guarda los cambios para verlos al regresar.',
    enlace: { texto: 'Ir a Perfil', ruta: './perfil-usuario.html' }
  },
  {
    id: 'foto', categoria: 'cuenta',
    pregunta: '¿Cómo cambio mi fotografía de perfil?',
    respuesta: 'Abre Información personal en Perfil y toca el avatar. Puedes elegir una imagen de Galería, tomar una foto si tu dispositivo lo permite o eliminar la actual. Confirma la imagen y guarda el perfil.',
    enlace: { texto: 'Ir a Perfil', ruta: './perfil-usuario.html' }
  },
  {
    id: 'favoritos', categoria: 'cuenta',
    pregunta: '¿Dónde encuentro mis favoritos?',
    respuesta: 'En Perfil, abre Favoritos para ver los establecimientos y productos que marcaste con el corazón.',
    enlace: { texto: 'Abrir Favoritos', ruta: './favoritos.html' }
  },
  {
    id: 'notificaciones', categoria: 'cuenta',
    pregunta: '¿Cómo cambio mis preferencias de notificaciones?',
    respuesta: 'Abre Notificaciones desde Perfil y ajusta cada interruptor. Si desactivas los avisos de pedidos, puedes seguir consultando el progreso en Seguimiento.',
    enlace: { texto: 'Abrir Notificaciones', ruta: './notificaciones.html' }
  },
  {
    id: 'cupones', categoria: 'cuenta',
    pregunta: '¿Dónde consulto mis códigos de descuento?',
    respuesta: 'En Perfil, abre Códigos de descuento. Si tienes un código disponible, puedes guardarlo y luego seleccionarlo en el Carrito. Los cupones señalados como ejemplos son ilustrativos.',
    enlace: { texto: 'Ver Códigos de descuento', ruta: './codigos-descuento.html' }
  },
  {
    id: 'cerrar-sesion', categoria: 'cuenta',
    pregunta: '¿Cómo cierro sesión?',
    respuesta: 'Al final de Perfil, toca Cerrar sesión y confirma. Puedes volver a iniciar sesión cuando quieras.',
    enlace: { texto: 'Ir a Perfil', ruta: './perfil-usuario.html' }
  },
  {
    id: 'problema-pedido', categoria: 'soporte',
    pregunta: '¿Qué hago si tuve un problema con mi pedido?',
    respuesta: 'Consulta con el establecimiento si el problema se relaciona con la preparación, el retiro o el cobro. Si necesitas orientación sobre el uso de Ham!, puedes escribirnos e incluir el número del pedido.',
    enlace: { texto: 'Ver opciones de contacto', ruta: '#contacto-ayuda' }
  },
  {
    id: 'problema-tecnico', categoria: 'soporte',
    pregunta: '¿Cómo reporto un problema técnico o una duda?',
    respuesta: 'Escríbenos y describe la pantalla donde ocurrió, qué estabas intentando hacer y qué apareció. Puedes indicar el navegador o el modelo de tu dispositivo.',
    enlace: { texto: 'Ver opciones de contacto', ruta: '#contacto-ayuda' }
  }
];
