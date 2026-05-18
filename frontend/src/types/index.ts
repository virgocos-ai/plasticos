export interface Cliente {
  id: number;
  rfc: string;
  razon_social: string;
  nombre_comercial?: string;
  codigo_postal: string;
  calle?: string;
  numero_exterior?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  regimen_fiscal: string;
  uso_cfdi: string;
  email?: string;
  telefono?: string;
  limite_credito: number;
  dias_credito: number;
  activo: boolean;
}

export interface Proveedor {
  id: number;
  rfc: string;
  razon_social: string;
  nombre_comercial?: string;
  codigo_postal: string;
  regimen_fiscal: string;
  email?: string;
  telefono?: string;
  dias_entrega: number;
  activo: boolean;
}

export interface Material {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'resina' | 'masterbatch' | 'aditivo' | 'empaque' | 'otro';
  marca?: string;
  color?: string;
  stock_actual_kg: number;
  stock_minimo_kg: number;
  costo_por_kg: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'producto_terminado' | 'subensamble' | 'pieza';
  peso_gr?: number;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

export interface OrdenProduccion {
  id: number;
  folio: string;
  fecha_orden: string;
  fecha_entrega?: string;
  cliente?: Cliente;
  estado: 'pendiente' | 'en_produccion' | 'completada' | 'cancelada';
  maquina_asignada?: string;
  turno: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface Factura {
  id: number;
  serie: string;
  folio: number;
  uuid?: string;
  fecha_emision: string;
  cliente: Cliente;
  total: number;
  estado: 'borrador' | 'timbrada' | 'cancelada';
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador' | 'contador' | 'almacen';
}

export interface DashboardData {
  ventas: {
    ventas_totales: number;
    total_facturas: number;
  };
  ordenes_produccion: Array<{ estado: string; total: number }>;
  inventario: {
    total_productos: number;
    total_materiales: number;
    productos_bajos: number;
    materiales_bajos: number;
  };
  clientes: {
    total_clientes: number;
  };
}
