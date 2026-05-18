import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface FacturaAttributes {
  id: number;
  serie: string;
  folio: number;
  uuid?: string;
  fecha_emision: Date;
  fecha_timbrado?: Date;
  cliente_id: number;
  forma_pago: string;
  metodo_pago: string;
  condiciones_pago?: string;
  moneda: string;
  tipo_cambio: number;
  subtotal: number;
  descuento: number;
  impuesto_trasladado: number;
  impuesto_retenido: number;
  total: number;
  estado: 'borrador' | 'timbrada' | 'cancelada';
  estado_sat?: 'Vigente' | 'Cancelado';
  sello_digital_cfdi?: string;
  sello_digital_sat?: string;
  cadena_original?: string;
  xml_timbrado?: string;
  observaciones?: string;
  motivo_cancelacion?: string;
  fecha_cancelacion?: Date;
  usuario_id: number;
  created_at?: Date;
  updated_at?: Date;
}

class Factura extends Model<FacturaAttributes> implements FacturaAttributes {
  public id!: number;
  public serie!: string;
  public folio!: number;
  public uuid!: string;
  public fecha_emision!: Date;
  public fecha_timbrado!: Date;
  public cliente_id!: number;
  public forma_pago!: string;
  public metodo_pago!: string;
  public condiciones_pago!: string;
  public moneda!: string;
  public tipo_cambio!: number;
  public subtotal!: number;
  public descuento!: number;
  public impuesto_trasladado!: number;
  public impuesto_retenido!: number;
  public total!: number;
  public estado!: 'borrador' | 'timbrada' | 'cancelada';
  public estado_sat!: 'Vigente' | 'Cancelado';
  public sello_digital_cfdi!: string;
  public sello_digital_sat!: string;
  public cadena_original!: string;
  public xml_timbrado!: string;
  public observaciones!: string;
  public motivo_cancelacion!: string;
  public fecha_cancelacion!: Date;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Factura.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    serie: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'A'
    },
    folio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: 'serie_folio_unique'
    },
    uuid: {
      type: DataTypes.STRING(36),
      unique: true,
      comment: 'UUID asignado por el SAT al timbrar'
    },
    fecha_emision: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_timbrado: DataTypes.DATE,
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'clientes', key: 'id' }
    },
    forma_pago: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: '01',
      comment: '01=Efectivo, 02=Cheque, 03=Transferencia, 04=Tarjetas, 99=Por definir'
    },
    metodo_pago: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'PUE',
      comment: 'PUE=Pago en una sola exhibición, PPD=Pago en parcialidades o diferido'
    },
    condiciones_pago: DataTypes.STRING(100),
    moneda: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'MXN'
    },
    tipo_cambio: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1
    },
    subtotal: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    descuento: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuesto_trasladado: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    impuesto_retenido: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'timbrada', 'cancelada'),
      allowNull: false,
      defaultValue: 'borrador'
    },
    estado_sat: {
      type: DataTypes.ENUM('Vigente', 'Cancelado')
    },
    sello_digital_cfdi: DataTypes.TEXT,
    sello_digital_sat: DataTypes.TEXT,
    cadena_original: DataTypes.TEXT,
    xml_timbrado: DataTypes.TEXT('long'),
    observaciones: DataTypes.TEXT,
    motivo_cancelacion: {
      type: DataTypes.STRING(100),
      comment: 'Motivo de cancelación SAT: 01, 02, 03'
    },
    fecha_cancelacion: DataTypes.DATE,
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Factura',
    tableName: 'facturas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { unique: true, fields: ['serie', 'folio'] },
      { fields: ['uuid'] },
      { fields: ['cliente_id'] },
      { fields: ['estado'] },
      { fields: ['fecha_emision'] }
    ]
  }
);

export default Factura;
