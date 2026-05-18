import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RegimenFiscalAttributes {
  id: number;
  clave: string;
  descripcion: string;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface RegimenFiscalCreationAttributes extends Omit<RegimenFiscalAttributes, 'id' | 'created_at' | 'updated_at'> {}

class RegimenFiscal extends Model<RegimenFiscalAttributes, RegimenFiscalCreationAttributes> implements RegimenFiscalAttributes {
  public id!: number;
  public clave!: string;
  public descripcion!: string;
  public activo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RegimenFiscal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clave: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'regimenes_fiscales',
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  }
);

export default RegimenFiscal;
