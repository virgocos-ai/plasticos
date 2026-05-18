import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface CotizacionAttributes {
  id: number;
  folio: string;
  fecha_cotizacion: Date;
  fecha_vencimiento?: Date;
  cliente_id: number;
  contacto?: string;
  email_contacto?: string;
  telefono_contacto?: string;
  subtotal: number;
  descuento: number;
  impuesto_trasladado: number;
  impuesto_retenido: number;
  total: number;
  moneda: 'MXN' | 'USD';
  tipo_cambio: number;
  condiciones_pago?: string;
  tiempo_entrega?: string;
  validez?: string;
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada' | 'convertida';
  observaciones?: string;
  usuario_id: number;
  fecha_conversion?: Date;
  orden_produccion_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

class Cotizacion extends Model<CotizacionAttributes> implements CotizacionAttributes {
  public id!: number;
  public folio!: string;
  public fecha_cotizacion!: Date;
  public fecha_vencimiento!: Date;
  public cliente_id!: number;
  public contacto!: string;
  public email_contacto!: string;
  public telefono_contacto!: string;
  public subtotal!: number;
  public descuento!: number;
  public impuesto_trasladado!: number;
  public impuesto_retenido!: number;
  public total!: number;
  public moneda!: 'MXN' | 'USD';
  public tipo_cambio!: number;
  public condiciones_pago!: string;
  public tiempo_entrega!: string;
  public validez!: string;
  public estado!: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'expirada' | 'convertida';
  public observaciones!: string;
  public usuario_id!: number;
  public fecha_conversion!: Date;
  public orden_produccion_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Cotizacion.init(
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
    fecha_cotizacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_vencimiento: DataTypes.DATEONLY,
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    contacto: DataTypes.STRING(100),
    email_contacto: DataTypes.STRING(100),
    telefono_contacto: DataTypes.STRING(15),
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
    tiempo_entrega: DataTypes.STRING(100),
    validez: {
      type: DataTypes.STRING(50),
      defaultValue: '30 días'
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'enviada', 'aceptada', 'rechazada', 'expirada', 'convertida'),
      allowNull: false,
      defaultValue: 'borrador'
    },
    observaciones: DataTypes.TEXT,
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha_conversion: DataTypes.DATEONLY,
    orden_produccion_id: DataTypes.INTEGER
  },
  {
    sequelize,
    modelName: 'Cotizacion',
    tableName: 'cotizaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Cotizacion;
