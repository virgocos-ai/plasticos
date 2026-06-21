import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface TransportistaAttributes {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'propio' | 'tercero';
  tipo_vehiculo?: string;
  placa?: string;
  marca_vehiculo?: string;
  modelo_vehiculo?: string;
  anio_vehiculo?: number;
  capacidad_kg?: number;
  capacidad_m3?: number;
  licencia_numero?: string;
  licencia_tipo?: string;
  licencia_vencimiento?: Date;
  telefono?: string;
  email?: string;
  activo: boolean;
  observaciones?: string;
  created_at?: Date;
  updated_at?: Date;
}

class Transportista extends Model<TransportistaAttributes> implements TransportistaAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public tipo!: 'propio' | 'tercero';
  public tipo_vehiculo!: string;
  public placa!: string;
  public marca_vehiculo!: string;
  public modelo_vehiculo!: string;
  public anio_vehiculo!: number;
  public capacidad_kg!: number;
  public capacidad_m3!: number;
  public licencia_numero!: string;
  public licencia_tipo!: string;
  public licencia_vencimiento!: Date;
  public telefono!: string;
  public email!: string;
  public activo!: boolean;
  public observaciones!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Transportista.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    tipo: {
      type: DataTypes.ENUM('propio', 'tercero'),
      allowNull: false, defaultValue: 'propio'
    },
    tipo_vehiculo: DataTypes.STRING(50),
    placa: DataTypes.STRING(15),
    marca_vehiculo: DataTypes.STRING(50),
    modelo_vehiculo: DataTypes.STRING(50),
    anio_vehiculo: DataTypes.INTEGER,
    capacidad_kg: { type: DataTypes.DECIMAL(10, 2), comment: 'Capacidad de carga en kg' },
    capacidad_m3: { type: DataTypes.DECIMAL(8, 2), comment: 'Capacidad volumétrica en m³' },
    licencia_numero: DataTypes.STRING(30),
    licencia_tipo: DataTypes.STRING(10),
    licencia_vencimiento: DataTypes.DATEONLY,
    telefono: DataTypes.STRING(15),
    email: DataTypes.STRING(100),
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    observaciones: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'Transportista',
    tableName: 'transportistas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Transportista;
