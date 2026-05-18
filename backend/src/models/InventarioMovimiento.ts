import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface InventarioMovimientoAttributes {
  id: number;
  tipo: 'entrada' | 'salida' | 'ajuste' | 'produccion' | 'venta' | 'compra' | 'merma' | 'traslado';
  producto_id?: number;
  material_id?: number;
  cantidad: number;
  costo_unitario?: number;
  costo_total?: number;
  referencia_id?: number;
  referencia_tipo?: string;
  almacen_origen?: string;
  almacen_destino?: string;
  motivo?: string;
  lote?: string;
  fecha_caducidad?: Date;
  usuario_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface InventarioMovimientoCreationAttributes extends Omit<InventarioMovimientoAttributes, 'id' | 'created_at' | 'updated_at'> {}

class InventarioMovimiento extends Model<InventarioMovimientoAttributes, InventarioMovimientoCreationAttributes> implements InventarioMovimientoAttributes {
  public id!: number;
  public tipo!: 'entrada' | 'salida' | 'ajuste' | 'produccion' | 'venta' | 'compra' | 'merma' | 'traslado';
  public producto_id!: number;
  public material_id!: number;
  public cantidad!: number;
  public costo_unitario!: number;
  public costo_total!: number;
  public referencia_id!: number;
  public referencia_tipo!: string;
  public almacen_origen!: string;
  public almacen_destino!: string;
  public motivo!: string;
  public lote!: string;
  public fecha_caducidad!: Date;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InventarioMovimiento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    tipo: {
      type: DataTypes.ENUM('entrada', 'salida', 'ajuste', 'produccion', 'venta', 'compra', 'merma', 'traslado'),
      allowNull: false
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'productos', key: 'id' }
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'materiales', key: 'id' }
    },
    cantidad: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false
    },
    costo_unitario: DataTypes.DECIMAL(12, 4),
    costo_total: DataTypes.DECIMAL(14, 2),
    referencia_id: DataTypes.INTEGER,
    referencia_tipo: DataTypes.STRING(50),
    almacen_origen: DataTypes.STRING(20),
    almacen_destino: DataTypes.STRING(20),
    motivo: DataTypes.STRING(200),
    lote: DataTypes.STRING(30),
    fecha_caducidad: DataTypes.DATEONLY,
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'InventarioMovimiento',
    tableName: 'inventario_movimientos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tipo'] },
      { fields: ['producto_id'] },
      { fields: ['material_id'] },
      { fields: ['created_at'] }
    ]
  }
);

export default InventarioMovimiento;
