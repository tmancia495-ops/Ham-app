// El proveedor autorizado puede incorporar datos reales sin cambiar el seguimiento ni el carrito.
// suscribir(pedidoId, recibir) → cancelar. montarMapa(elemento) → { actualizar(datos), destruir() }.
function crearSeguimientoEntrega(pedido, actualizar) {
  const proveedor = window.hamProveedorSeguimientoEntrega;
  let cancelar;
  let mapa;
  let activo = true;

  if (!pedido.simulado && typeof proveedor?.suscribir === 'function') {
    cancelar = proveedor.suscribir(pedido.id, (datos) => {
      if (activo && datos?.pedidoId === pedido.id) actualizar(datos);
    });
  }

  function limpiarMapa() {
    mapa?.destruir();
    mapa = undefined;
  }

  return {
    representarMapa(elemento, datos) {
      const valida = (punto) => Number.isFinite(punto?.lat) && Math.abs(punto.lat) <= 90
        && Number.isFinite(punto?.lng) && Math.abs(punto.lng) <= 180;
      if (pedido.simulado || datos.ubicacion?.autorizada !== true ||
        !valida(datos.ubicacion) || !valida(datos.destino) || typeof proveedor?.montarMapa !== 'function') {
        limpiarMapa();
        return false;
      }
      mapa ??= proveedor.montarMapa(elemento);
      mapa.actualizar({ ubicacion: datos.ubicacion, destino: datos.destino, ruta: datos.ruta });
      return true;
    },
    limpiarMapa,
    puedeContactar(datos) {
      return !pedido.simulado && datos.repartidor?.contactoHabilitado === true
        && typeof proveedor?.contactar === 'function';
    },
    contactar() { proveedor?.contactar?.(pedido.id); },
    desconectar() {
      activo = false;
      if (typeof cancelar === 'function') cancelar();
      limpiarMapa();
    }
  };
}
