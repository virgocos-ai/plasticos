import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface MantenimientoRegistroAttributes {
  id: number;
  folio: string;
  fecha: Date;
  entidad_tipo: 'maquina' | 'molde';
  entidad_id: number;
  tipo: 'preventivo' | 'correctivo' | 'predictivo';
  descripcion: string;
  trabajo_realizado?: string;
  tecnico: string;
  tiempo_paro_min?: number;
  costo?: number;
  piezas_reemplazadas?: string;
  proximo_mantenimiento?: Date;
  disparos_en_mantenimiento?: number;
  estado: 'pendiente' | 'en_progreso' | 'completado';
  observaciones?: string;
  usuario_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

class MantenimientoRegistro extends Model<MantenimientoRegistroAttributes> implements MantenimientoRegistroAttributes {
  public id!: number;
  public folio!: string;
  public fecha!: Date;
  public entidad_tipo!: 'maquina' | 'molde';
  public entidad_id!: number;
  public tipo!: 'preventivo' | 'correctivo' | 'predictivo';
  public descripcion!: string;
  public trabajo_realizado!: string;
  public tecnico!: string;
  public tiempo_paro_min!: number;
  public costo!: number;
  public piezas_reemplazadas!: string;
  public proximo_mantenimiento!: Date;
  public disparos_en_mantenimiento!: number;
  public estado!: 'pendiente' | 'en_progreso' | 'completado';
  public observaciones!: string;
  public usuario_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

MantenimientoRegistro.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    folio: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    entidad_tipo: {
      type: DataTypes.ENUM('maquina', 'molde'),
      allowNull: false
    },
    entidad_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo: {
      type: DataTypes.ENUM('preventivo', 'correctivo', 'predictivo'),
      allowNull: false,
      defaultValue: 'preventivo'
    },
    descripcion: { type: DataTypes.TEXT, allowNull: false },
    trabajo_realizado: DataTypes.TEXT,
    tecnico: { type: DataTypes.STRING(100), allowNull: false },
    tiempo_paro_min: DataTypes.INTEGER,
    costo: DataTypes.DECIMAL(12, 2),
    piezas_reemplazadas: DataTypes.TEXT,
    proximo_mantenimiento: DataTypes.DATEONLY,
    disparos_en_mantenimiento: { type: DataTypes.INTEGER, comment: 'Para moldes: disparos al momento del mantenimiento' },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_progreso', 'completado'),
      allowNull: false,
      defaultValue: 'completado'
    },
    observaciones: DataTypes.TEXT,
    usuario_id: DataTypes.INTEGER,
  },
  {
    sequelize,
    modelName: 'MantenimientoRegistro',
    tableName: 'mantenimiento_registros',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default MantenimientoRegistro;
