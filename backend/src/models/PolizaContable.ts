import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PolizaContableAttributes {
  id: number;
  tipo: 'ingreso' | 'egreso' | 'diario';
  numero: number;
  fecha: Date;
  concepto: string;
  cuenta_id: number;
  debe: number;
  haber: number;
  referencia?: string;
  referencia_id?: number;
  referencia_tipo?: string;
  usuario_id: number;
  created_at?: Date;
  updated_at?: Date;
}

class PolizaContable extends Model<PolizaContableAttributes> implements PolizaContableAttributes {
  public id!: number;
  public tipo!: 'ingreso' | 'egreso' | 'diario';
  public numero!: number;
  public fecha!: Date;
  public concepto!: string;
  public cuenta_id!: number;
  public debe!: number;
  public haber!: number;
  public referencia!: string;
  public referencia_id!: number;
  public referencia_tipo!: string;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PolizaContable.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    tipo: {
      type: DataTypes.ENUM('ingreso', 'egreso', 'diario'),
      allowNull: false
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    concepto: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    cuenta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'cuentas_contables', key: 'id' }
    },
    debe: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    haber: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    referencia: DataTypes.STRING(50),
    referencia_id: DataTypes.INTEGER,
    referencia_tipo: DataTypes.STRING(50),
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'PolizaContable',
    tableName: 'polizas_contables',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['tipo', 'numero'] },
      { fields: ['fecha'] },
      { fields: ['cuenta_id'] }
    ]
  }
);

export default PolizaContable;
