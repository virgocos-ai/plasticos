import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ConfiguracionAttributes {
  id: number;
  clave: string;
  valor: string;
  descripcion?: string;
  grupo: string;
  editable: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface ConfiguracionCreationAttributes extends Optional<ConfiguracionAttributes, 'id'> {}

class Configuracion extends Model<ConfiguracionAttributes, ConfiguracionCreationAttributes> implements ConfiguracionAttributes {
  public id!: number;
  public clave!: string;
  public valor!: string;
  public descripcion!: string;
  public grupo!: string;
  public editable!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Configuracion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    clave: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    valor: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    descripcion: {
      type: DataTypes.STRING(255),
    },
    grupo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'general',
    },
    editable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Configuracion',
    tableName: 'configuraciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Configuracion;
export { ConfiguracionAttributes };
