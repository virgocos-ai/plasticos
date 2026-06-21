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
import Molde from './Molde';
import RecetaInyeccion from './RecetaInyeccion';
import MantenimientoRegistro from './MantenimientoRegistro';
import Transportista from './Transportista';
import Envio from './Envio';
import EnvioDetalle from './EnvioDetalle';

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

// Producto - Material principal
Producto.belongsTo(Material, { foreignKey: 'material_principal_id', as: 'materialPrincipal' });
Material.hasMany(Producto, { foreignKey: 'material_principal_id', as: 'productos' });

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

// Cliente - OrdenProduccion
Cliente.hasMany(OrdenProduccion, { foreignKey: 'cliente_id', as: 'ordenesProduccion' });
OrdenProduccion.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

// Maquina - OrdenProduccion
Maquina.hasMany(OrdenProduccion, { foreignKey: 'maquina_id', as: 'ordenesMaquina' });
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

// ── Moldes ──────────────────────────────────────────────────────────────────
Producto.hasMany(Molde, { foreignKey: 'producto_id', as: 'moldes' });
Molde.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Maquina.hasMany(Molde, { foreignKey: 'maquina_id', as: 'moldesMontados' });
Molde.belongsTo(Maquina, { foreignKey: 'maquina_id', as: 'maquina' });

// ── Recetas de Inyección ─────────────────────────────────────────────────────
Producto.hasMany(RecetaInyeccion, { foreignKey: 'producto_id', as: 'recetas' });
RecetaInyeccion.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Material.hasMany(RecetaInyeccion, { foreignKey: 'material_id', as: 'recetas' });
RecetaInyeccion.belongsTo(Material, { foreignKey: 'material_id', as: 'material' });

Molde.hasMany(RecetaInyeccion, { foreignKey: 'molde_id', as: 'recetas' });
RecetaInyeccion.belongsTo(Molde, { foreignKey: 'molde_id', as: 'molde' });

Maquina.hasMany(RecetaInyeccion, { foreignKey: 'maquina_id', as: 'recetas' });
RecetaInyeccion.belongsTo(Maquina, { foreignKey: 'maquina_id', as: 'maquina' });

// ── Logística ────────────────────────────────────────────────────────────────
Cliente.hasMany(Envio, { foreignKey: 'cliente_id', as: 'envios' });
Envio.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });

Transportista.hasMany(Envio, { foreignKey: 'transportista_id', as: 'envios' });
Envio.belongsTo(Transportista, { foreignKey: 'transportista_id', as: 'transportista' });

Factura.hasMany(Envio, { foreignKey: 'factura_id', as: 'envios' });
Envio.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

Envio.hasMany(EnvioDetalle, { foreignKey: 'envio_id', as: 'detalles' });
EnvioDetalle.belongsTo(Envio, { foreignKey: 'envio_id', as: 'envio' });

Producto.hasMany(EnvioDetalle, { foreignKey: 'producto_id', as: 'enviosDetalle' });
EnvioDetalle.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Lote.hasMany(EnvioDetalle, { foreignKey: 'lote_id', as: 'enviosDetalle' });
EnvioDetalle.belongsTo(Lote, { foreignKey: 'lote_id', as: 'lote' });

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
  InspeccionCalidad,
  Molde,
  RecetaInyeccion,
  MantenimientoRegistro,
  Transportista,
  Envio,
  EnvioDetalle,
};
