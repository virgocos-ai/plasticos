import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface CuentaContableAttributes {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'activo' | 'pasivo' | 'capital' | 'ingreso' | 'egreso';
    naturaleza: 'deudora' | 'acreedora';
  nivel: number;
  padre_id?: number;
  afectable: boolean;
  agrupador_sat?: string;
  descripcion_sat?: string;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class CuentaContable extends Model<CuentaContableAttributes> implements CuentaContableAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public tipo!: 'activo' | 'pasivo' | 'capital' | 'ingreso' | 'egreso';
  public naturaleza!: 'deudora' | 'acreedora';
  public nivel!: number;
  public padre_id!: number;
  public afectable!: boolean;
  public agrupador_sat!: string;
  public descripcion_sat!: string;
  public activo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CuentaContable.init(
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
      type: DataTypes.STRING(200),
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('activo', 'pasivo', 'capital', 'ingreso', 'egreso'),
      allowNull: false
    },
    naturaleza: {
      type: DataTypes.ENUM('deudora', 'acreedora'),
      allowNull: false
    },
    nivel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    padre_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'cuentas_contables', key: 'id' }
    },
    afectable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Si es true, permite movimientos contables'
    },
    agrupador_sat: {
      type: DataTypes.STRING(20),
      comment: 'Código del catálogo de cuentas SAT'
    },
    descripcion_sat: DataTypes.STRING(200),
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'CuentaContable',
    tableName: 'cuentas_contables',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default CuentaContable;
