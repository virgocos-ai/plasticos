import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface InspeccionCalidadAttributes {
  id: number;
  folio: string;
  fecha_inspeccion: Date;
  orden_produccion_id?: number;
  lote_id?: number;
  producto_id: number;
  tipo_inspeccion: 'entrada' | 'proceso' | 'salida' | 'final';
  resultado: 'aprobado' | 'rechazado' | 'condicional' | 'pendiente';
  cantidad_inspeccionada: number;
  cantidad_defectuosa: number;
  porcentaje_defectos: number;
  defectos_encontrados?: string;
  criterios_inspeccion?: string;
  observaciones?: string;
  inspector_id: number;
  evidencia_fotos?: string;
  certificado_generado: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class InspeccionCalidad extends Model<InspeccionCalidadAttributes> implements InspeccionCalidadAttributes {
  public id!: number;
  public folio!: string;
  public fecha_inspeccion!: Date;
  public orden_produccion_id!: number;
  public lote_id!: number;
  public producto_id!: number;
  public tipo_inspeccion!: 'entrada' | 'proceso' | 'salida' | 'final';
  public resultado!: 'aprobado' | 'rechazado' | 'condicional' | 'pendiente';
  public cantidad_inspeccionada!: number;
  public cantidad_defectuosa!: number;
  public porcentaje_defectos!: number;
  public defectos_encontrados!: string;
  public criterios_inspeccion!: string;
  public observaciones!: string;
  public inspector_id!: number;
  public evidencia_fotos!: string;
  public certificado_generado!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly producto?: any;
  public readonly lote?: any;
  public readonly ordenProduccion?: any;
  public readonly inspector?: any;
}

InspeccionCalidad.init(
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
    fecha_inspeccion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    orden_produccion_id: DataTypes.INTEGER,
    lote_id: DataTypes.INTEGER,
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipo_inspeccion: {
      type: DataTypes.ENUM('entrada', 'proceso', 'salida', 'final'),
      allowNull: false
    },
    resultado: {
      type: DataTypes.ENUM('aprobado', 'rechazado', 'condicional', 'pendiente'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    cantidad_inspeccionada: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    cantidad_defectuosa: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    porcentaje_defectos: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    defectos_encontrados: DataTypes.TEXT,
    criterios_inspeccion: DataTypes.TEXT,
    observaciones: DataTypes.TEXT,
    inspector_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    evidencia_fotos: DataTypes.TEXT,
    certificado_generado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'InspeccionCalidad',
    tableName: 'inspecciones_calidad',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default InspeccionCalidad;
