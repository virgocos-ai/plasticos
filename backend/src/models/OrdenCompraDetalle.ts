import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface OrdenCompraDetalleAttributes {
  id: number;
  orden_compra_id: number;
  material_id: number;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  unidad_medida: string;
  precio_unitario: number;
  descuento: number;
  importe: number;
  fecha_entrega?: Date;
  notas?: string;
  estado: 'pendiente' | 'parcial' | 'completado';
  created_at?: Date;
  updated_at?: Date;
}

class OrdenCompraDetalle extends Model<OrdenCompraDetalleAttributes> implements OrdenCompraDetalleAttributes {
  public id!: number;
  public orden_compra_id!: number;
  public material_id!: number;
  public cantidad_solicitada!: number;
  public cantidad_recibida!: number;
  public unidad_medida!: string;
  public precio_unitario!: number;
  public descuento!: number;
  public importe!: number;
  public fecha_entrega!: Date;
  public notas!: string;
  public estado!: 'pendiente' | 'parcial' | 'completado';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrdenCompraDetalle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orden_compra_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad_solicitada: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false
    },
    cantidad_recibida: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0
    },
    unidad_medida: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'KGM'
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
    fecha_entrega: DataTypes.DATEONLY,
    notas: DataTypes.TEXT,
    estado: {
      type: DataTypes.ENUM('pendiente', 'parcial', 'completado'),
      allowNull: false,
      defaultValue: 'pendiente'
    }
  },
  {
    sequelize,
    modelName: 'OrdenCompraDetalle',
    tableName: 'ordenes_compra_detalle',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default OrdenCompraDetalle;
