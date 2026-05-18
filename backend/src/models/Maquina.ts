import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface MaquinaAttributes {
  id: number;
  codigo: string;
  nombre: string;
  modelo?: string;
  marca?: string;
  capacidad_ton?: number;
  anio_fabricacion?: number;
  numero_serie?: string;
  ubicacion?: string;
  estado: 'activa' | 'mantenimiento' | 'inactiva';
  ultimo_mantenimiento?: Date;
  proximo_mantenimiento?: Date;
  observaciones?: string;
  created_at?: Date;
  updated_at?: Date;
}

class Maquina extends Model<MaquinaAttributes> implements MaquinaAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public modelo!: string;
  public marca!: string;
  public capacidad_ton!: number;
  public anio_fabricacion!: number;
  public numero_serie!: string;
  public ubicacion!: string;
  public estado!: 'activa' | 'mantenimiento' | 'inactiva';
  public ultimo_mantenimiento!: Date;
  public proximo_mantenimiento!: Date;
  public observaciones!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Maquina.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    modelo: DataTypes.STRING(50),
    marca: DataTypes.STRING(50),
    capacidad_ton: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Capacidad de cierre en toneladas'
    },
    anio_fabricacion: DataTypes.INTEGER,
    numero_serie: DataTypes.STRING(50),
    ubicacion: DataTypes.STRING(100),
    estado: {
      type: DataTypes.ENUM('activa', 'mantenimiento', 'inactiva'),
      allowNull: false,
      defaultValue: 'activa'
    },
    ultimo_mantenimiento: DataTypes.DATEONLY,
    proximo_mantenimiento: DataTypes.DATEONLY,
    observaciones: DataTypes.TEXT
  },
  {
    sequelize,
    modelName: 'Maquina',
    tableName: 'maquinas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Maquina;
