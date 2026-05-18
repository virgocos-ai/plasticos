import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface OperadorAttributes {
  id: number;
  codigo: string;
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  rfc?: string;
  curp?: string;
  telefono?: string;
  email?: string;
  fecha_ingreso?: Date;
  turno: 'matutino' | 'vespertino' | 'nocturno' | 'mixto';
  especialidad?: string;
  certificaciones?: string;
  estado: 'activo' | 'inactivo' | 'vacaciones';
  observaciones?: string;
  created_at?: Date;
  updated_at?: Date;
}

class Operador extends Model<OperadorAttributes> implements OperadorAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public apellido_paterno!: string;
  public apellido_materno!: string;
  public rfc!: string;
  public curp!: string;
  public telefono!: string;
  public email!: string;
  public fecha_ingreso!: Date;
  public turno!: 'matutino' | 'vespertino' | 'nocturno' | 'mixto';
  public especialidad!: string;
  public certificaciones!: string;
  public estado!: 'activo' | 'inactivo' | 'vacaciones';
  public observaciones!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Operador.init(
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
    apellido_paterno: DataTypes.STRING(50),
    apellido_materno: DataTypes.STRING(50),
    rfc: {
      type: DataTypes.STRING(13),
      validate: {
        len: { args: [12, 13], msg: 'RFC debe tener 12 o 13 caracteres' }
      }
    },
    curp: {
      type: DataTypes.STRING(18),
      validate: {
        len: { args: [18, 18], msg: 'CURP debe tener 18 caracteres' }
      }
    },
    telefono: DataTypes.STRING(15),
    email: {
      type: DataTypes.STRING(100),
      validate: {
        isEmail: true
      }
    },
    fecha_ingreso: DataTypes.DATEONLY,
    turno: {
      type: DataTypes.ENUM('matutino', 'vespertino', 'nocturno', 'mixto'),
      allowNull: false,
      defaultValue: 'matutino'
    },
    especialidad: DataTypes.STRING(100),
    certificaciones: DataTypes.TEXT,
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo', 'vacaciones'),
      allowNull: false,
      defaultValue: 'activo'
    },
    observaciones: DataTypes.TEXT
  },
  {
    sequelize,
    modelName: 'Operador',
    tableName: 'operadores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Operador;
