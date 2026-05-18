import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface LoteAttributes {
  id: number;
  numero_lote: string;
  tipo: 'producto' | 'material';
  producto_id?: number;
  material_id?: number;
  almacen_id: number;
  cantidad_inicial: number;
  cantidad_actual: number;
  unidad_medida: string;
  fecha_produccion?: Date;
  fecha_caducidad?: Date;
  fecha_entrada: Date;
  orden_produccion_id?: number;
  proveedor_id?: number;
  numero_factura_proveedor?: string;
  estado: 'activo' | 'cuarentena' | 'bloqueado' | 'agotado' | 'caducado';
  temperatura_almacenamiento?: string;
  humedad_almacenamiento?: string;
  observaciones?: string;
  certificado_calidad?: string;
  usuario_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface LoteCreationAttributes extends Omit<LoteAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Lote extends Model<LoteAttributes, LoteCreationAttributes> implements LoteAttributes {
  public id!: number;
  public numero_lote!: string;
  public tipo!: 'producto' | 'material';
  public producto_id?: number;
  public material_id?: number;
  public almacen_id!: number;
  public cantidad_inicial!: number;
  public cantidad_actual!: number;
  public unidad_medida!: string;
  public fecha_produccion?: Date;
  public fecha_caducidad?: Date;
  public fecha_entrada!: Date;
  public orden_produccion_id?: number;
  public proveedor_id?: number;
  public numero_factura_proveedor?: string;
  public estado!: 'activo' | 'cuarentena' | 'bloqueado' | 'agotado' | 'caducado';
  public temperatura_almacenamiento?: string;
  public humedad_almacenamiento?: string;
  public observaciones?: string;
  public certificado_calidad?: string;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly producto?: any;
  public readonly material?: any;
  public readonly almacen?: any;
  public readonly proveedor?: any;
}

Lote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero_lote: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    tipo: {
      type: DataTypes.ENUM('producto', 'material'),
      allowNull: false,
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    almacen_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad_inicial: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },
    cantidad_actual: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
    },
    unidad_medida: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    fecha_produccion: {
      type: DataTypes.DATE,
    },
    fecha_caducidad: {
      type: DataTypes.DATE,
    },
    fecha_entrada: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    orden_produccion_id: {
      type: DataTypes.INTEGER,
    },
    proveedor_id: {
      type: DataTypes.INTEGER,
    },
    numero_factura_proveedor: {
      type: DataTypes.STRING(50),
    },
    estado: {
      type: DataTypes.ENUM('activo', 'cuarentena', 'bloqueado', 'agotado', 'caducado'),
      defaultValue: 'activo',
    },
    temperatura_almacenamiento: {
      type: DataTypes.STRING(20),
    },
    humedad_almacenamiento: {
      type: DataTypes.STRING(20),
    },
    observaciones: {
      type: DataTypes.TEXT,
    },
    certificado_calidad: {
      type: DataTypes.STRING(255),
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'lotes',
    timestamps: true,
    underscored: true,
  }
);

export default Lote;
