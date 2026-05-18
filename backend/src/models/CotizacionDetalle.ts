import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface CotizacionDetalleAttributes {
  id: number;
  cotizacion_id: number;
  producto_id: number;
  material_id?: number;
  cantidad: number;
  unidad_medida: string;
  precio_unitario: number;
  descuento: number;
  importe: number;
  notas?: string;
  tiempo_entrega?: string;
  created_at?: Date;
  updated_at?: Date;
}

class CotizacionDetalle extends Model<CotizacionDetalleAttributes> implements CotizacionDetalleAttributes {
  public id!: number;
  public cotizacion_id!: number;
  public producto_id!: number;
  public material_id!: number;
  public cantidad!: number;
  public unidad_medida!: string;
  public precio_unitario!: number;
  public descuento!: number;
  public importe!: number;
  public notas!: string;
  public tiempo_entrega!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CotizacionDetalle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    cotizacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    material_id: DataTypes.INTEGER,
    cantidad: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false
    },
    unidad_medida: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'H87'
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false
    },
    descuento: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    importe: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    notas: DataTypes.TEXT,
    tiempo_entrega: DataTypes.STRING(50)
  },
  {
    sequelize,
    modelName: 'CotizacionDetalle',
    tableName: 'cotizacion_detalles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default CotizacionDetalle;
