import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface EnvioAttributes {
  id: number;
  folio: string;
  fecha_programada: Date;
  fecha_real?: Date;
  cliente_id: number;
  transportista_id?: number;
  estado: 'pendiente' | 'preparando' | 'en_ruta' | 'entregado' | 'devuelto' | 'cancelado';
  // Dirección de entrega
  direccion_calle?: string;
  direccion_colonia?: string;
  direccion_ciudad?: string;
  direccion_estado_mx?: string;
  direccion_cp?: string;
  // Carga
  peso_total_kg?: number;
  bultos?: number;
  // Documentos
  factura_id?: number;
  numero_remision?: string;
  // Entrega
  nombre_receptor?: string;
  observaciones_entrega?: string;
  // Costo
  costo_envio?: number;
  observaciones?: string;
  usuario_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

class Envio extends Model<EnvioAttributes> implements EnvioAttributes {
  public id!: number;
  public folio!: string;
  public fecha_programada!: Date;
  public fecha_real!: Date;
  public cliente_id!: number;
  public transportista_id!: number;
  public estado!: 'pendiente' | 'preparando' | 'en_ruta' | 'entregado' | 'devuelto' | 'cancelado';
  public direccion_calle!: string;
  public direccion_colonia!: string;
  public direccion_ciudad!: string;
  public direccion_estado_mx!: string;
  public direccion_cp!: string;
  public peso_total_kg!: number;
  public bultos!: number;
  public factura_id!: number;
  public numero_remision!: string;
  public nombre_receptor!: string;
  public observaciones_entrega!: string;
  public costo_envio!: number;
  public observaciones!: string;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Envio.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    folio: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fecha_programada: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_real: DataTypes.DATEONLY,
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    transportista_id: DataTypes.INTEGER,
    estado: {
      type: DataTypes.ENUM('pendiente', 'preparando', 'en_ruta', 'entregado', 'devuelto', 'cancelado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    direccion_calle: DataTypes.STRING(200),
    direccion_colonia: DataTypes.STRING(100),
    direccion_ciudad: DataTypes.STRING(100),
    direccion_estado_mx: DataTypes.STRING(50),
    direccion_cp: DataTypes.STRING(5),
    peso_total_kg: DataTypes.DECIMAL(10, 2),
    bultos: DataTypes.INTEGER,
    factura_id: DataTypes.INTEGER,
    numero_remision: DataTypes.STRING(30),
    nombre_receptor: DataTypes.STRING(150),
    observaciones_entrega: DataTypes.TEXT,
    costo_envio: DataTypes.DECIMAL(12, 2),
    observaciones: DataTypes.TEXT,
    usuario_id: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'Envio',
    tableName: 'envios',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Envio;
