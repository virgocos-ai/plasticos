import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface AlmacenAttributes {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'principal' | 'secundario' | 'cuarentena' | 'merma' | 'transito';
  ubicacion: string;
  responsable?: string;
  telefono?: string;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface AlmacenCreationAttributes extends Omit<AlmacenAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Almacen extends Model<AlmacenAttributes, AlmacenCreationAttributes> implements AlmacenAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public tipo!: 'principal' | 'secundario' | 'cuarentena' | 'merma' | 'transito';
  public ubicacion!: string;
  public responsable?: string;
  public telefono?: string;
  public activo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Almacen.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('principal', 'secundario', 'cuarentena', 'merma', 'transito'),
      allowNull: false,
      defaultValue: 'principal',
    },
    ubicacion: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    responsable: {
      type: DataTypes.STRING(100),
    },
    telefono: {
      type: DataTypes.STRING(20),
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'almacenes',
    timestamps: true,
    underscored: true,
  }
);

export default Almacen;
