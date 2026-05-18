import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface FacturaDetalleAttributes {
  id: number;
  factura_id: number;
  producto_id: number;
  clave_sat?: string;
  clave_unidad_sat?: string;
  descripcion: string;
  cantidad: number;
  unidad_medida: string;
  precio_unitario: number;
  importe: number;
  descuento: number;
  impuesto_trasladado: number;
  impuesto_retenido: number;
  base_impuesto: number;
  tasa_cuota: number;
  tipo_factor: string;
  objeto_impuesto: string;
  created_at?: Date;
  updated_at?: Date;
}

class FacturaDetalle extends Model<FacturaDetalleAttributes> implements FacturaDetalleAttributes {
  public id!: number;
  public factura_id!: number;
  public producto_id!: number;
  public clave_sat!: string;
  public clave_unidad_sat!: string;
  public descripcion!: string;
  public cantidad!: number;
  public unidad_medida!: string;
  public precio_unitario!: number;
  public importe!: number;
  public descuento!: number;
  public impuesto_trasladado!: number;
  public impuesto_retenido!: number;
  public base_impuesto!: number;
  public tasa_cuota!: number;
  public tipo_factor!: string;
  public objeto_impuesto!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

FacturaDetalle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    factura_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'facturas', key: 'id' }
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'productos', key: 'id' }
    },
    clave_sat: {
      type: DataTypes.STRING(20),
      comment: 'Clave del producto/servicio del catálogo SAT'
    },
    clave_unidad_sat: {
      type: DataTypes.STRING(5),
      defaultValue: 'H87',
      comment: 'Pieza - H87'
    },
    descripcion: {
      type: DataTypes.STRING(1000),
      allowNull: false
    },
    cantidad: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false
    },
    unidad_medida: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'Pieza'
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false
    },
    importe: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    descuento: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuesto_trasladado: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuesto_retenido: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    base_impuesto: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    tasa_cuota: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.1600,
      comment: 'Tasa IVA 16%'
    },
    tipo_factor: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'Tasa'
    },
    objeto_impuesto: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: '02',
      comment: '02=Sí objeto de impuesto'
    }
  },
  {
    sequelize,
    modelName: 'FacturaDetalle',
    tableName: 'factura_detalles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default FacturaDetalle;
