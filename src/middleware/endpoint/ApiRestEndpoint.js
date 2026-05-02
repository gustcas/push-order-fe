const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3304/api';

export const AUTH_ENDPOINTS = { login: `${BASE_URL}/login` };

export const PRODUCTO_ENDPOINTS = {
  listar: `${BASE_URL}/productos`,
  crear: `${BASE_URL}/productos`,
  actualizar: (id) => `${BASE_URL}/productos/${id}`,
  eliminar: (id) => `${BASE_URL}/productos/${id}`,
  stockBajo: `${BASE_URL}/productos/stock-bajo`,
};

export const CATEGORIA_ENDPOINTS = {
  listar: `${BASE_URL}/categorias`,
  crear: `${BASE_URL}/categorias`,
  actualizar: (id) => `${BASE_URL}/categorias/${id}`,
  eliminar: (id) => `${BASE_URL}/categorias/${id}`,
};

export const CLIENTE_ENDPOINTS = {
  listar: `${BASE_URL}/clientes`,
  crear: `${BASE_URL}/clientes`,
  buscarCedula: (cedula) => `${BASE_URL}/clientes/cedula/${cedula}`,
  actualizar: (id) => `${BASE_URL}/clientes/${id}`,
  eliminar: (id) => `${BASE_URL}/clientes/${id}`,
};

export const ORDEN_ENDPOINTS = {
  listar: `${BASE_URL}/ordenes`,
  crear: `${BASE_URL}/ordenes`,
  buscar: (id) => `${BASE_URL}/ordenes/${id}`,
  cancelar: (id) => `${BASE_URL}/ordenes/${id}/cancelar`,
  metodosPago: `${BASE_URL}/metodosPago`,
  crearProducto: `${BASE_URL}/crearProducto`,
  listarProductos: `${BASE_URL}/allProducto`,
  crearOrdenCabecera: `${BASE_URL}/crearOrdenCabecera`,
  crearOrdenDetalle: `${BASE_URL}/crearOrdenDetalle`,
  listaOrden: `${BASE_URL}/listaOrden`,
  listaOrdenDetalle: `${BASE_URL}/listaOrdenDetalle/`,
};

export const CAJA_ENDPOINTS = {
  listar: `${BASE_URL}/caja`,
  activa: `${BASE_URL}/caja/activa`,
  abrir: `${BASE_URL}/caja/abrir`,
  cerrar: (id) => `${BASE_URL}/caja/${id}/cerrar`,
};

export const USUARIO_ENDPOINTS = {
  listar: `${BASE_URL}/usuarios`,
  perfil: `${BASE_URL}/usuarios/perfil`,
  crear: `${BASE_URL}/usuarios`,
  actualizar: (id) => `${BASE_URL}/usuarios/${id}`,
  password: (id) => `${BASE_URL}/usuarios/${id}/password`,
  configuracion: (id) => `${BASE_URL}/usuarios/${id}/configuracion`,
  desactivar: (id) => `${BASE_URL}/usuarios/${id}`,
  roles: `${BASE_URL}/roles`,
};

export const DASHBOARD_ENDPOINTS = { metricas: `${BASE_URL}/dashboard/metricas` };

export const REPORTE_ENDPOINTS = {
  ventas: `${BASE_URL}/reportes/ventas`,
  inventario: `${BASE_URL}/reportes/inventario`,
  movimientos: `${BASE_URL}/reportes/movimientos`,
};

export const INVENTARIO_ENDPOINTS = {
  movimientos: `${BASE_URL}/inventario/movimientos`,
  ajuste: `${BASE_URL}/inventario/ajuste`,
  entrada: `${BASE_URL}/inventario/entrada`,
};

export const SERVICIO_REST_AUTORIZACONES = {
  login: AUTH_ENDPOINTS.login,
  crearProducto: ORDEN_ENDPOINTS.crearProducto,
  listarProductos: ORDEN_ENDPOINTS.listarProductos,
  crearOrdenCabecera: ORDEN_ENDPOINTS.crearOrdenCabecera,
  crearOrdenDetalle: ORDEN_ENDPOINTS.crearOrdenDetalle,
  listaOrden: ORDEN_ENDPOINTS.listaOrden,
  listaOrdenDetalle: ORDEN_ENDPOINTS.listaOrdenDetalle,
};

export const ORDER_ENDPOINTS = ORDEN_ENDPOINTS;
