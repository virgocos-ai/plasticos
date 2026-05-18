import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface ClienteAttributes {
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
  uso_cfdi: string;
  email?: string;
  telefono?: string;
  contacto?: string;
  limite_credito: number;
  dias_credito: number;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class Cliente extends Model<ClienteAttributes> implements ClienteAttributes {
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
  public uso_cfdi!: string;
  public email!: string;
  public telefono!: string;
  public contacto!: string;
  public limite_credito!: number;
  public dias_credito!: number;
  public activo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Cliente.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    rfc: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true,
      validate: {
        len: [12, 13]
      }
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
      allowNull: false,
      validate: {
        len: [5, 5]
      }
    },
    calle: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    numero_exterior: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    numero_interior: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    colonia: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    municipio: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pais: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'MEX'
    },
    regimen_fiscal: {
      type: DataTypes.STRING(3),
      allowNull: false,
      comment: 'Clave del régimen fiscal del SAT'
    },
    uso_cfdi: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'G03',
      comment: 'Uso CFDI por defecto: G03 - Gastos en general'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    contacto: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    limite_credito: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    dias_credito: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Cliente',
    tableName: 'clientes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Cliente;
