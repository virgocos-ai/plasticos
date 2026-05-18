import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface UsuarioAttributes {
  id: number;
  nombre: string;
  email: string;
  password: string;
  rol: 'admin' | 'operador' | 'contador' | 'almacen';
  activo: boolean;
  ultimo_acceso?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface UsuarioCreationAttributes extends Omit<UsuarioAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public id!: number;
  public nombre!: string;
  public email!: string;
  public password!: string;
  public rol!: 'admin' | 'operador' | 'contador' | 'almacen';
  public activo!: boolean;
  public ultimo_acceso!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol: {
      type: DataTypes.ENUM('admin', 'operador', 'contador', 'almacen'),
      allowNull: false,
      defaultValue: 'operador'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Usuario;
