import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface OrdenCompraAttributes {
  id: number;
  folio: string;
  fecha_orden: Date;
  fecha_entrega_esperada?: Date;
  proveedor_id: number;
  contacto?: string;
  email?: string;
  telefono?: string;
  subtotal: number;
  descuento: number;
  impuesto_trasladado: number;
  impuesto_retenido: number;
  total: number;
  moneda: 'MXN' | 'USD';
  tipo_cambio: number;
  condiciones_pago?: string;
  metodo_entrega?: string;
  direccion_entrega?: string;
  estado: 'borrador' | 'enviada' | 'parcial' | 'completada' | 'cancelada';
  observaciones?: string;
  usuario_id: number;
  created_at?: Date;
  updated_at?: Date;
}

class OrdenCompra extends Model<OrdenCompraAttributes> implements OrdenCompraAttributes {
  public id!: number;
  public folio!: string;
  public fecha_orden!: Date;
  public fecha_entrega_esperada!: Date;
  public proveedor_id!: number;
  public contacto!: string;
  public email!: string;
  public telefono!: string;
  public subtotal!: number;
  public descuento!: number;
  public impuesto_trasladado!: number;
  public impuesto_retenido!: number;
  public total!: number;
  public moneda!: 'MXN' | 'USD';
  public tipo_cambio!: number;
  public condiciones_pago!: string;
  public metodo_entrega!: string;
  public direccion_entrega!: string;
  public estado!: 'borrador' | 'enviada' | 'parcial' | 'completada' | 'cancelada';
  public observaciones!: string;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrdenCompra.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    folio: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    fecha_orden: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_entrega_esperada: DataTypes.DATEONLY,
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    contacto: DataTypes.STRING(100),
    email: DataTypes.STRING(100),
    telefono: DataTypes.STRING(15),
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    descuento: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuesto_trasladado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuesto_retenido: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    moneda: {
      type: DataTypes.ENUM('MXN', 'USD'),
      allowNull: false,
      defaultValue: 'MXN'
    },
    tipo_cambio: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1
    },
    condiciones_pago: DataTypes.STRING(100),
    metodo_entrega: DataTypes.STRING(100),
    direccion_entrega: DataTypes.TEXT,
    estado: {
      type: DataTypes.ENUM('borrador', 'enviada', 'parcial', 'completada', 'cancelada'),
      allowNull: false,
      defaultValue: 'borrador'
    },
    observaciones: DataTypes.TEXT,
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'OrdenCompra',
    tableName: 'ordenes_compra',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default OrdenCompra;
