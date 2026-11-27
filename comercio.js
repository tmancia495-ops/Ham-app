const vistaTiendaHam = document.querySelector('#vista-tienda-ham');
const formularioProductoTienda = document.querySelector('#form-producto-comercio');
const formularioPerfilTienda = document.querySelector('#form-perfil-comercio');
const categoriasProductoTienda = { paninis: 'Paninis', ...CATEGORIAS_REGISTRO_NEGOCIO };
const fotosEditorTienda = new WeakMap();
let editorTienda;

function ponerFotoComercio(contenedor, foto, inicial) {
  contenedor.replaceChildren();
  if (inicial && !foto) { contenedor.textContent = inicial; return; }
  const icono = new Image();
  icono.alt = '';
  if (foto) icono.className = 'foto-cargada';
  else { icono.width = 38; icono.height = 38; }
  icono.src = foto || './assets/comercio-foto.svg';
  contenedor.append(icono);
}

function verCatalogoTienda(comercio) {
  const { establecimiento: e, productos, solicitud } = comercio;
  ponerFotoComercio(document.querySelector('#avatar-tienda-ham'), e.foto, e.nombre.trim().charAt(0).toUpperCase());
  document.querySelector('#nombre-tienda-ham').textContent = e.nombre;
  document.querySelector('#descripcion-tienda-ham').textContent = e.descripcion || e.categoria.nombre;
  const modos = [e.modalidades.includes('delivery') ? 'Entrega' : '', e.modalidades.includes('takeout') ? 'Retiro' : ''].filter(Boolean).join(' y ');
  document.querySelector('#ubicacion-tienda-ham').textContent = [e.ubicacion.nombre, modos].filter(Boolean).join(' · ');
  document.querySelector('#estado-tienda-ham').textContent = { pendiente: 'Pendiente de revisión', aprobado: 'Aprobado', rechazado: 'Rechazado' }[solicitud.estado] || 'Pendiente de revisión';
  document.querySelector('#cantidad-tienda-ham').textContent = productos.length + (productos.length === 1 ? ' producto' : ' productos');
  document.querySelector('#vacio-tienda-ham').hidden = Boolean(productos.length);
  const lista = document.querySelector('#lista-tienda-ham');
  lista.replaceChildren();
  for (const producto of productos) {
    const ficha = document.querySelector('#plantilla-ficha-comercio').content.firstElementChild.cloneNode(true);
    ponerFotoComercio(ficha.querySelector('.foto-comercio'), producto.foto);
    ficha.querySelector('h4').textContent = producto.nombre;
    ficha.querySelector('p').textContent = producto.descripcion;
    ficha.querySelector('strong').textContent = '$' + (producto.precioCentavos / 100).toFixed(2);
    ficha.querySelector('.precio-comercio span').textContent = producto.disponible ? 'Disponible en borrador' : 'No disponible';
    ficha.querySelector('a').href = '#tienda/producto/' + encodeURIComponent(producto.id);
    lista.append(ficha);
  }
}

function llenarOpcionesComercio(campo, opciones, anterior) {
  campo.replaceChildren(new Option('Seleccionar', ''), ...Object.entries(opciones).map(([id, nombre]) => new Option(nombre, id)));
  if (anterior && !Object.hasOwn(opciones, anterior.id)) campo.add(new Option(anterior.nombre, anterior.id));
  campo.value = anterior?.id || '';
}

function prepararEditorTienda(comercio, tipo, producto) {
  const perfil = tipo === 'perfil';
  const datos = perfil ? comercio.establecimiento : producto;
  const form = perfil ? formularioPerfilTienda : formularioProductoTienda;
  const anterior = editoresPreparadosTienda.get(form);
  if (anterior?.comercio.cuentaId === comercio.cuentaId &&
      anterior.comercio.solicitud.id === comercio.solicitud.id && anterior.productoId === producto?.id) {
    anterior.comercio = comercio;
    editorTienda = anterior;
    return;
  }
  const c = form.elements;
  form.reset();
  form.querySelector('.mensaje-comercio').textContent = '';
  c.nombre.value = datos?.nombre || '';
  c.descripcion.value = datos?.descripcion || '';
  llenarOpcionesComercio(c.categoria, perfil ? CATEGORIAS_REGISTRO_NEGOCIO : categoriasProductoTienda, datos?.categoria);
  if (perfil) {
    llenarOpcionesComercio(c.ubicacion, UBICACIONES_PEA, datos.ubicacion);
    c.horario.value = datos.horario.general;
    c.delivery.checked = datos.modalidades.includes('delivery');
    c.takeout.checked = datos.modalidades.includes('takeout');
  } else {
    c.precio.value = producto ? (producto.precioCentavos / 100).toFixed(2) : '';
    c.disponible.checked = Boolean(producto?.disponible);
    c.extras.value = producto?.extras?.join('\n') || '';
    form.querySelector('.quitar-comercio').hidden = !producto;
    form.querySelector('button[type=submit]').textContent = producto ? 'Guardar cambios' : 'Guardar producto';
    document.querySelector('#titulo-producto-comercio').textContent = producto ? 'Editar producto' : 'Añadir producto';
    form.closest('section').dataset.nodeId = producto ? '857:916' : '857:981';
  }
  form.closest('section').querySelector('header p').textContent = comercio.establecimiento.nombre + ' · ' + (perfil ? 'Información del establecimiento' : producto ? 'Edita los detalles de tu menú' : 'Crea algo delicioso');
  form.querySelector('[data-titulo-foto]').textContent = perfil ? 'Imagen del negocio' : producto ? 'Fotografía actual' : 'Foto del producto';
  form.querySelector('[data-texto-subir]').textContent = datos?.foto ? 'Cambiar fotografía ›' : 'Subir fotografía +';
  fotosEditorTienda.set(form, datos?.foto || '');
  ponerFotoComercio(form.querySelector('[data-foto-editor]'), datos?.foto, perfil ? datos.nombre.trim().charAt(0).toUpperCase() : '');
  editorTienda = { comercio, tipo, productoId: producto?.id, form, scroll: 0 };
  editoresPreparadosTienda.set(form, editorTienda);
}

const editoresPreparadosTienda = new WeakMap();
let scrollCatalogoTienda = 0;
let vistaComercioActual;

function guardarScrollTiendaHam() {
  if (vistaTiendaHam.hidden) return;
  if (vistaComercioActual === 'catalogo') scrollCatalogoTienda = vistaTiendaHam.scrollTop;
  else if (editorTienda) editorTienda.scroll = vistaTiendaHam.scrollTop;
}

function pausarVistaTiendaHam() {
  guardarScrollTiendaHam();
  editorTienda = undefined;
}

function pintarTiendaHam(ruta) {
  const comercio = comercioCuentaHam();
  if (!comercio) return false;
  const [, tipo, id] = ruta.slice(1).split('/');
  const producto = tipo === 'producto' ? comercio.productos.find((p) => p.id === id) : null;
  const siguiente = tipo === 'perfil' ? 'perfil' : tipo === 'nuevo' || producto ? 'producto' : 'catalogo';
  guardarScrollTiendaHam();
  if (siguiente === 'catalogo') {
    if (ruta !== '#tienda') history.replaceState(history.state, '', '#tienda');
    editorTienda = undefined;
    verCatalogoTienda(comercio);
  } else prepararEditorTienda(comercio, siguiente, producto);
  for (const vista of vistaTiendaHam.querySelectorAll('[data-vista-comercio]')) vista.hidden = vista.dataset.vistaComercio !== siguiente;
  vistaComercioActual = siguiente;
  // La vista puede estar oculta al entrar desde otra pestaña.
  vistaTiendaHam.hidden = false;
  vistaTiendaHam.scrollTop = siguiente === 'catalogo' ? scrollCatalogoTienda : editorTienda.scroll;
  return true;
}

function navegarVistaTienda(ruta, reemplazar = false) {
  const estado = reemplazar ? history.state : { hamDesdeTienda: true };
  history[reemplazar ? 'replaceState' : 'pushState'](estado, '', ruta);
  navegarPestanaPrincipal();
}

function regresarCatalogoTienda() {
  if (history.state?.hamDesdeTienda) history.back();
  else navegarVistaTienda('#tienda', true);
}

vistaTiendaHam.addEventListener('click', (evento) => {
  const enlace = evento.target.closest('a[href^="#tienda"]');
  if (!enlace || !esActivacionNormal(evento)) return;
  evento.preventDefault();
  if (enlace.hash === '#tienda') regresarCatalogoTienda();
  else navegarVistaTienda(enlace.hash);
});

async function prepararFotoTienda(archivo) {
  if (!/^image\/(?:png|jpeg|webp|avif)$/.test(archivo.type) || archivo.size > 12 * 1024 * 1024) {
    throw new Error('Elige una imagen PNG, JPEG, WebP o AVIF de hasta 12 MB.');
  }
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = new Image();
    imagen.src = url;
    await imagen.decode();
    const escala = Math.min(1, 720 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
    lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    return lienzo.toDataURL('image/webp', .78);
  } finally {
    URL.revokeObjectURL(url);
  }
}

for (const form of [formularioProductoTienda, formularioPerfilTienda]) {
  const mensaje = form.querySelector('.mensaje-comercio');
  const boton = form.querySelector('button[type=submit]');
  let lecturaFoto = 0;
  form.elements.foto.addEventListener('change', async () => {
    const archivo = form.elements.foto.files[0];
    if (!archivo) return;
    const instancia = editorTienda;
    const lectura = ++lecturaFoto;
    boton.disabled = true;
    mensaje.textContent = '';
    try {
      const foto = await prepararFotoTienda(archivo);
      if (editorTienda !== instancia || lectura !== lecturaFoto) return;
      fotosEditorTienda.set(form, foto);
      ponerFotoComercio(form.querySelector('[data-foto-editor]'), foto);
    } catch (error) {
      if (editorTienda === instancia && lectura === lecturaFoto) mensaje.textContent = error.message;
    } finally {
      if (lectura === lecturaFoto) boton.disabled = false;
    }
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const editor = editorTienda;
    if (editor?.form !== form || boton.disabled) return;
    const c = form.elements;
    const nombre = c.nombre.value.trim();
    const descripcion = c.descripcion.value.trim();
    const categoria = { id: c.categoria.value, nombre: c.categoria.selectedOptions[0]?.textContent };
    if (!nombre || !categoria.id || (editor.tipo === 'producto' && !descripcion)) {
      mensaje.textContent = 'Completa el nombre, la categoría y los detalles requeridos.';
      return;
    }
    const datos = { nombre, descripcion, categoria, foto: fotosEditorTienda.get(form) };
    if (editor.tipo === 'perfil') {
      const modalidades = [c.delivery.checked ? 'delivery' : '', c.takeout.checked ? 'takeout' : ''].filter(Boolean);
      if (!modalidades.length) { mensaje.textContent = 'Selecciona al menos una modalidad.'; return; }
      datos.ubicacion = { id: c.ubicacion.value, nombre: c.ubicacion.selectedOptions[0].textContent };
      datos.horario = { ...editor.comercio.establecimiento.horario, general: c.horario.value };
      datos.modalidades = modalidades;
    } else {
      datos.precioCentavos = Math.round(c.precio.valueAsNumber * 100);
      datos.disponible = c.disponible.checked;
      datos.extras = c.extras.value.split('\n').map((linea) => linea.trim()).filter(Boolean);
      datos.id = editor.productoId || crypto.randomUUID();
    }
    boton.disabled = true;
    try {
      await editarComercioHam(editor.comercio, (actual) => {
        if (editor.tipo === 'perfil') return { ...actual.borrador, establecimiento: datos };
        if (editor.productoId && !actual.productos.some((p) => p.id === editor.productoId)) throw new Error('El producto ya no está en el catálogo.');
        const productos = editor.productoId ? actual.productos.map((p) => p.id === datos.id ? datos : p) : [...actual.productos, datos];
        return { ...actual.borrador, productos };
      });
      if (editoresPreparadosTienda.get(form) === editor) editoresPreparadosTienda.delete(form);
      if (editorTienda === editor && location.hash.startsWith('#tienda/')) regresarCatalogoTienda();
    } catch (error) {
      mensaje.textContent = error instanceof DOMException ? 'No se pudo guardar el borrador. Prueba con una imagen más pequeña.' : error.message;
    } finally { boton.disabled = false; }
  });
}

const dialogoEliminarTienda = document.querySelector('#confirmar-eliminar-comercio');
formularioProductoTienda.querySelector('.quitar-comercio').addEventListener('click', () => {
  dialogoEliminarTienda.returnValue = '';
  dialogoEliminarTienda.showModal();
});
dialogoEliminarTienda.addEventListener('close', async () => {
  const editor = editorTienda;
  if (dialogoEliminarTienda.returnValue !== 'eliminar' || !editor?.productoId) return;
  try {
    await editarComercioHam(editor.comercio, (actual) => ({
      ...actual.borrador, productos: actual.productos.filter((p) => p.id !== editor.productoId)
    }));
    if (editoresPreparadosTienda.get(editor.form) === editor) editoresPreparadosTienda.delete(editor.form);
    if (editor === editorTienda && location.hash.startsWith('#tienda/')) regresarCatalogoTienda();
  } catch {
    editor.form.querySelector('.mensaje-comercio').textContent = 'No se pudo eliminar el producto.';
  }
});
