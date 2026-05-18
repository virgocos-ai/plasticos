import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface OrdenProduccionAttributes {
  id: number;
  folio: string;
  fecha_orden: Date;
  fecha_entrega?: Date;
  cliente_id?: number;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'pendiente' | 'en_produccion' | 'completada' | 'cancelada';
  maquina_asignada?: string;
  turno: 'matutino' | 'vespertino' | 'nocturno';
  operador_id?: number;
  observaciones?: string;
  tiempo_estimado_min?: number;
  tiempo_real_min?: number;
  usuario_id: number;
  created_at?: Date;
  updated_at?: Date;
}

class OrdenProduccion extends Model<OrdenProduccionAttributes> implements OrdenProduccionAttributes {
  public id!: number;
  public folio!: string;
  public fecha_orden!: Date;
  public fecha_entrega!: Date;
  public cliente_id!: number;
  public prioridad!: 'baja' | 'media' | 'alta' | 'urgente';
  public estado!: 'pendiente' | 'en_produccion' | 'completada' | 'cancelada';
  public maquina_asignada!: string;
  public turno!: 'matutino' | 'vespertino' | 'nocturno';
  public operador_id!: number;
  public observaciones!: string;
  public tiempo_estimado_min!: number;
  public tiempo_real_min!: number;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrdenProduccion.init(
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
    fecha_entrega: DataTypes.DATEONLY,
    cliente_id: DataTypes.INTEGER,
    prioridad: {
      type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
      allowNull: false,
      defaultValue: 'media'
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_produccion', 'completada', 'cancelada'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    maquina_asignada: {
      type: DataTypes.STRING(20),
      comment: 'Máquina de inyección asignada (ej: INY-01, INY-02)'
    },
    turno: {
      type: DataTypes.ENUM('matutino', 'vespertino', 'nocturno'),
      allowNull: false,
      defaultValue: 'matutino'
    },
    operador_id: DataTypes.INTEGER,
    observaciones: DataTypes.TEXT,
    tiempo_estimado_min: {
      type: DataTypes.INTEGER,
      comment: 'Tiempo estimado de producción en minutos'
    },
    tiempo_real_min: {
      type: DataTypes.INTEGER,
      comment: 'Tiempo real de producción en minutos'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'OrdenProduccion',
    tableName: 'ordenes_produccion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default OrdenProduccion;
