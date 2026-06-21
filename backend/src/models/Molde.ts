import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface MoldeAttributes {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  producto_id?: number;
  numero_cavidades: number;
  material_molde?: string;
  numero_serie?: string;
  fecha_fabricacion?: Date;
  proveedor_molde?: string;
  vida_util_disparos: number;
  disparos_actuales: number;
  disparos_ultimo_mantenimiento: number;
  maquina_id?: number;
  estado: 'disponible' | 'en_maquina' | 'mantenimiento' | 'baja';
  ubicacion?: string;
  tiempo_cambio_min?: number;
  peso_kg?: number;
  dimensiones?: string;
  observaciones?: string;
  created_at?: Date;
  updated_at?: Date;
}

class Molde extends Model<MoldeAttributes> implements MoldeAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public descripcion!: string;
  public producto_id!: number;
  public numero_cavidades!: number;
  public material_molde!: string;
  public numero_serie!: string;
  public fecha_fabricacion!: Date;
  public proveedor_molde!: string;
  public vida_util_disparos!: number;
  public disparos_actuales!: number;
  public disparos_ultimo_mantenimiento!: number;
  public maquina_id!: number;
  public estado!: 'disponible' | 'en_maquina' | 'mantenimiento' | 'baja';
  public ubicacion!: string;
  public tiempo_cambio_min!: number;
  public peso_kg!: number;
  public dimensiones!: string;
  public observaciones!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Molde.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    descripcion: DataTypes.TEXT,
    producto_id: { type: DataTypes.INTEGER, allowNull: true },
    numero_cavidades: {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 1,
      comment: 'Número de cavidades del molde'
    },
    material_molde: {
      type: DataTypes.STRING(50),
      comment: 'Material del molde: acero P20, H13, aluminio, etc.'
    },
    numero_serie: DataTypes.STRING(50),
    fecha_fabricacion: DataTypes.DATEONLY,
    proveedor_molde: DataTypes.STRING(150),
    vida_util_disparos: {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 500000,
      comment: 'Número máximo de disparos antes de mantenimiento mayor'
    },
    disparos_actuales: {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
      comment: 'Contador actual de disparos (shots)'
    },
    disparos_ultimo_mantenimiento: {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0,
      comment: 'En qué disparo se realizó el último mantenimiento'
    },
    maquina_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'Máquina donde está montado actualmente' },
    estado: {
      type: DataTypes.ENUM('disponible', 'en_maquina', 'mantenimiento', 'baja'),
      allowNull: false, defaultValue: 'disponible'
    },
    ubicacion: { type: DataTypes.STRING(100), comment: 'Ubicación física (rack, almacén de moldes)' },
    tiempo_cambio_min: { type: DataTypes.INTEGER, comment: 'Tiempo promedio de cambio de molde en minutos' },
    peso_kg: DataTypes.DECIMAL(8, 2),
    dimensiones: { type: DataTypes.STRING(50), comment: 'LxAxH en mm' },
    observaciones: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'Molde',
    tableName: 'moldes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Molde;
