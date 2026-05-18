import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface ProveedorAttributes {
  id: number;
  rfc: string;
  razon_social: string;
  nombre_comercial?: string;
  codigo_postal: string;
  calle?: string;
  numero_exterior?: string;
  numero_interior?: string;
  colonia?: string;
  municipio?: string;
  estado?: string;
  pais: string;
  regimen_fiscal: string;
  email?: string;
  telefono?: string;
  contacto?: string;
  dias_entrega: number;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class Proveedor extends Model<ProveedorAttributes> implements ProveedorAttributes {
  public id!: number;
  public rfc!: string;
  public razon_social!: string;
  public nombre_comercial!: string;
  public codigo_postal!: string;
  public calle!: string;
  public numero_exterior!: string;
  public numero_interior!: string;
  public colonia!: string;
  public municipio!: string;
  public estado!: string;
  public pais!: string;
  public regimen_fiscal!: string;
  public email!: string;
  public telefono!: string;
  public contacto!: string;
  public dias_entrega!: number;
  public activo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Proveedor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    rfc: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true
    },
    razon_social: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    nombre_comercial: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    codigo_postal: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    calle: DataTypes.STRING(100),
    numero_exterior: DataTypes.STRING(20),
    numero_interior: DataTypes.STRING(20),
    colonia: DataTypes.STRING(100),
    municipio: DataTypes.STRING(100),
    estado: DataTypes.STRING(50),
    pais: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'MEX'
    },
    regimen_fiscal: {
      type: DataTypes.STRING(3),
      allowNull: false,
      comment: 'Clave SAT del régimen fiscal'
    },
    email: {
      type: DataTypes.STRING(100),
      validate: { isEmail: true }
    },
    telefono: DataTypes.STRING(20),
    contacto: DataTypes.STRING(100),
    dias_entrega: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 7
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Proveedor',
    tableName: 'proveedores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Proveedor;
