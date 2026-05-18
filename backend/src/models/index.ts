import sequelize from '../config/database';
import Usuario from './Usuario';
import Cliente from './Cliente';
import Proveedor from './Proveedor';
import Producto from './Producto';
import Material from './Material';
import OrdenProduccion from './OrdenProduccion';
import OrdenProduccionDetalle from './OrdenProduccionDetalle';
import Factura from './Factura';
import FacturaDetalle from './FacturaDetalle';
import InventarioMovimiento from './InventarioMovimiento';
import CuentaContable from './CuentaContable';
import PolizaContable from './PolizaContable';
import RegimenFiscal from './RegimenFiscal';
import Almacen from './Almacen';
import Lote from './Lote';
import Configuracion from './Configuracion';
import Maquina from './Maquina';
import Operador from './Operador';
import Cotizacion from './Cotizacion';
import CotizacionDetalle from './CotizacionDetalle';
import OrdenCompra from './OrdenCompra';
import OrdenCompraDetalle from './OrdenCompraDetalle';
import InspeccionCalidad from './InspeccionCalidad';

// Asociaciones
// Usuario - Ordenes de producción
Usuario.hasMany(OrdenProduccion, { foreignKey: 'usuario_id', as: 'ordenesProduccion' });
OrdenProduccion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Cliente - Facturas
Cliente.hasMany(Factura, { foreignKey: 'cliente_id', as: 'facturas' });
Factura.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

// Proveedor - Materiales
Proveedor.hasMany(Material, { foreignKey: 'proveedor_preferido_id', as: 'materiales' });
Material.belongsTo(Proveedor, { foreignKey: 'proveedor_preferido_id', as: 'proveedorPreferido' });

// Producto - FacturaDetalle
Producto.hasMany(FacturaDetalle, { foreignKey: 'producto_id', as: 'facturaDetalles' });
FacturaDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Factura - FacturaDetalle
Factura.hasMany(FacturaDetalle, { foreignKey: 'factura_id', as: 'detalles' });
FacturaDetalle.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

// OrdenProduccion - OrdenProduccionDetalle
OrdenProduccion.hasMany(OrdenProduccionDetalle, { foreignKey: 'orden_id', as: 'detalles' });
OrdenProduccionDetalle.belongsTo(OrdenProduccion, { foreignKey: 'orden_id', as: 'orden' });

// Producto - OrdenProduccionDetalle
Producto.hasMany(OrdenProduccionDetalle, { foreignKey: 'producto_id', as: 'ordenesProduccion' });
OrdenProduccionDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Material - OrdenProduccionDetalle (materia prima usada)
Material.hasMany(OrdenProduccionDetalle, { foreignKey: 'material_id', as: 'ordenesProduccionMaterial' });
OrdenProduccionDetalle.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });

// Producto - InventarioMovimiento
Producto.hasMany(InventarioMovimiento, { foreignKey: 'producto_id', as: 'movimientos' });
InventarioMovimiento.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Material - InventarioMovimiento
Material.hasMany(InventarioMovimiento, { foreignKey: 'material_id', as: 'movimientosMaterial' });
InventarioMovimiento.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });

// CuentaContable - PolizaContable
CuentaContable.hasMany(PolizaContable, { foreignKey: 'cuenta_id', as: 'polizas' });
PolizaContable.belongsTo(CuentaContable, { foreignKey: 'cuenta_id', as: 'cuenta' });

// Almacen - Lotes
Almacen.hasMany(Lote, { foreignKey: 'almacen_id', as: 'lotes' });
Lote.belongsTo(Almacen, { foreignKey: 'almacen_id', as: 'almacen' });

// Producto - Lotes
Producto.hasMany(Lote, { foreignKey: 'producto_id', as: 'lotesProducto' });
Lote.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Material - Lotes
Material.hasMany(Lote, { foreignKey: 'material_id', as: 'lotesMaterial' });
Lote.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });

// Proveedor - Lotes
Proveedor.hasMany(Lote, { foreignKey: 'proveedor_id', as: 'lotesProveedor' });
Lote.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

// OrdenProduccion - Lotes
OrdenProduccion.hasMany(Lote, { foreignKey: 'orden_produccion_id', as: 'lotesProduccion' });
Lote.belongsTo(OrdenProduccion, { foreignKey: 'orden_produccion_id', as: 'ordenProduccion' });

// Usuario - Lotes
Usuario.hasMany(Lote, { foreignKey: 'usuario_id', as: 'lotes' });
Lote.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Maquina - OrdenProduccion
Maquina.hasMany(OrdenProduccion, { foreignKey: 'maquina_id', as: 'ordenesProduccion' });
OrdenProduccion.belongsTo(Maquina, { foreignKey: 'maquina_id', as: 'maquina' });

// Operador - OrdenProduccion
Operador.hasMany(OrdenProduccion, { foreignKey: 'operador_id', as: 'ordenesProduccion' });
OrdenProduccion.belongsTo(Operador, { foreignKey: 'operador_id', as: 'operador' });

// Cliente - Cotizacion
Cliente.hasMany(Cotizacion, { foreignKey: 'cliente_id', as: 'cotizaciones' });
Cotizacion.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

// Cotizacion - CotizacionDetalle
Cotizacion.hasMany(CotizacionDetalle, { foreignKey: 'cotizacion_id', as: 'detalles' });
CotizacionDetalle.belongsTo(Cotizacion, { foreignKey: 'cotizacion_id', as: 'cotizacion' });

// Producto - CotizacionDetalle
Producto.hasMany(CotizacionDetalle, { foreignKey: 'producto_id', as: 'cotizacionesDetalle' });
CotizacionDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Material - CotizacionDetalle
Material.hasMany(CotizacionDetalle, { foreignKey: 'material_id', as: 'cotizacionesMaterial' });
CotizacionDetalle.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });

// Cotizacion - OrdenProduccion (cuando se convierte)
Cotizacion.hasOne(OrdenProduccion, { foreignKey: 'cotizacion_id', as: 'ordenProduccion' });
OrdenProduccion.belongsTo(Cotizacion, { foreignKey: 'cotizacion_id', as: 'cotizacion' });

// Proveedor - OrdenCompra
Proveedor.hasMany(OrdenCompra, { foreignKey: 'proveedor_id', as: 'ordenesCompra' });
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

// OrdenCompra - OrdenCompraDetalle
OrdenCompra.hasMany(OrdenCompraDetalle, { foreignKey: 'orden_compra_id', as: 'detalles' });
OrdenCompraDetalle.belongsTo(OrdenCompra, { foreignKey: 'orden_compra_id', as: 'ordenCompra' });

// Material - OrdenCompraDetalle
Material.hasMany(OrdenCompraDetalle, { foreignKey: 'material_id', as: 'ordenesCompraDetalle' });
OrdenCompraDetalle.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });

// Producto - InspeccionCalidad
Producto.hasMany(InspeccionCalidad, { foreignKey: 'producto_id', as: 'inspecciones' });
InspeccionCalidad.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// OrdenProduccion - InspeccionCalidad
OrdenProduccion.hasMany(InspeccionCalidad, { foreignKey: 'orden_produccion_id', as: 'inspecciones' });
InspeccionCalidad.belongsTo(OrdenProduccion, { foreignKey: 'orden_produccion_id', as: 'ordenProduccion' });

// Lote - InspeccionCalidad
Lote.hasMany(InspeccionCalidad, { foreignKey: 'lote_id', as: 'inspecciones' });
InspeccionCalidad.belongsTo(Lote, { foreignKey: 'lote_id', as: 'lote' });

// Usuario - InspeccionCalidad (como inspector)
Usuario.hasMany(InspeccionCalidad, { foreignKey: 'inspector_id', as: 'inspeccionesRealizadas' });
InspeccionCalidad.belongsTo(Usuario, { foreignKey: 'inspector_id', as: 'inspector' });

export {
  sequelize,
  Usuario,
  Cliente,
  Proveedor,
  Producto,
  Material,
  OrdenProduccion,
  OrdenProduccionDetalle,
  Factura,
  FacturaDetalle,
  InventarioMovimiento,
  CuentaContable,
  PolizaContable,
  RegimenFiscal,
  Almacen,
  Configuracion,
  Lote,
  Maquina,
  Operador,
  Cotizacion,
  CotizacionDetalle,
  OrdenCompra,
  OrdenCompraDetalle,
  InspeccionCalidad
};
