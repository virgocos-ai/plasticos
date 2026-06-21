import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface EnvioDetalleAttributes {
  id: number;
  envio_id: number;
  producto_id: number;
  lote_id?: number;
  cantidad: number;
  peso_kg?: number;
  observaciones?: string;
  created_at?: Date;
  updated_at?: Date;
}

class EnvioDetalle extends Model<EnvioDetalleAttributes> implements EnvioDetalleAttributes {
  public id!: number;
  public envio_id!: number;
  public producto_id!: number;
  public lote_id!: number;
  public cantidad!: number;
  public peso_kg!: number;
  public observaciones!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EnvioDetalle.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    envio_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    lote_id: DataTypes.INTEGER,
    cantidad: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    peso_kg: DataTypes.DECIMAL(10, 3),
    observaciones: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'EnvioDetalle',
    tableName: 'envios_detalle',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default EnvioDetalle;
