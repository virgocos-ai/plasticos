import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface RecetaInyeccionAttributes {
  id: number;
  codigo: string;
  nombre: string;
  producto_id: number;
  material_id?: number;
  molde_id?: number;
  maquina_id?: number;
  // Temperaturas de barril (°C)
  temp_zona1?: number;
  temp_zona2?: number;
  temp_zona3?: number;
  temp_zona4?: number;
  temp_zona5?: number;
  temp_zona6?: number;
  temp_boquilla?: number;
  temp_molde_fijo?: number;
  temp_molde_movil?: number;
  // Parámetros de inyección
  vel_inyeccion_pct?: number;
  presion_inyeccion_bar?: number;
  presion_sostenimiento_bar?: number;
  tiempo_inyeccion_seg?: number;
  tiempo_sostenimiento_seg?: number;
  // Enfriamiento
  tiempo_enfriamiento_seg?: number;
  temp_agua_enfriamiento_c?: number;
  // Dosificación / Plastificación
  tiempo_plastificacion_seg?: number;
  contrapresion_bar?: number;
  rpm_husillo?: number;
  colchon_mm?: number;
  posicion_disparo_mm?: number;
  // Resultados esperados
  ciclo_total_seg?: number;
  peso_disparo_gr?: number;
  peso_pieza_gr?: number;
  piezas_por_ciclo?: number;
  // Control
  activa: boolean;
  version: number;
  observaciones?: string;
  created_at?: Date;
  updated_at?: Date;
}

class RecetaInyeccion extends Model<RecetaInyeccionAttributes> implements RecetaInyeccionAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public producto_id!: number;
  public material_id!: number;
  public molde_id!: number;
  public maquina_id!: number;
  public temp_zona1!: number;
  public temp_zona2!: number;
  public temp_zona3!: number;
  public temp_zona4!: number;
  public temp_zona5!: number;
  public temp_zona6!: number;
  public temp_boquilla!: number;
  public temp_molde_fijo!: number;
  public temp_molde_movil!: number;
  public vel_inyeccion_pct!: number;
  public presion_inyeccion_bar!: number;
  public presion_sostenimiento_bar!: number;
  public tiempo_inyeccion_seg!: number;
  public tiempo_sostenimiento_seg!: number;
  public tiempo_enfriamiento_seg!: number;
  public temp_agua_enfriamiento_c!: number;
  public tiempo_plastificacion_seg!: number;
  public contrapresion_bar!: number;
  public rpm_husillo!: number;
  public colchon_mm!: number;
  public posicion_disparo_mm!: number;
  public ciclo_total_seg!: number;
  public peso_disparo_gr!: number;
  public peso_pieza_gr!: number;
  public piezas_por_ciclo!: number;
  public activa!: boolean;
  public version!: number;
  public observaciones!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RecetaInyeccion.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    material_id: DataTypes.INTEGER,
    molde_id: DataTypes.INTEGER,
    maquina_id: DataTypes.INTEGER,
    // Temperaturas barril
    temp_zona1: DataTypes.DECIMAL(5, 1),
    temp_zona2: DataTypes.DECIMAL(5, 1),
    temp_zona3: DataTypes.DECIMAL(5, 1),
    temp_zona4: DataTypes.DECIMAL(5, 1),
    temp_zona5: DataTypes.DECIMAL(5, 1),
    temp_zona6: DataTypes.DECIMAL(5, 1),
    temp_boquilla: DataTypes.DECIMAL(5, 1),
    temp_molde_fijo: DataTypes.DECIMAL(5, 1),
    temp_molde_movil: DataTypes.DECIMAL(5, 1),
    // Inyección
    vel_inyeccion_pct: DataTypes.DECIMAL(5, 1),
    presion_inyeccion_bar: DataTypes.DECIMAL(6, 1),
    presion_sostenimiento_bar: DataTypes.DECIMAL(6, 1),
    tiempo_inyeccion_seg: DataTypes.DECIMAL(6, 2),
    tiempo_sostenimiento_seg: DataTypes.DECIMAL(6, 2),
    // Enfriamiento
    tiempo_enfriamiento_seg: DataTypes.DECIMAL(6, 2),
    temp_agua_enfriamiento_c: DataTypes.DECIMAL(5, 1),
    // Plastificación
    tiempo_plastificacion_seg: DataTypes.DECIMAL(6, 2),
    contrapresion_bar: DataTypes.DECIMAL(6, 1),
    rpm_husillo: DataTypes.DECIMAL(6, 1),
    colchon_mm: DataTypes.DECIMAL(6, 2),
    posicion_disparo_mm: DataTypes.DECIMAL(6, 2),
    // Resultados
    ciclo_total_seg: DataTypes.DECIMAL(6, 2),
    peso_disparo_gr: DataTypes.DECIMAL(8, 2),
    peso_pieza_gr: DataTypes.DECIMAL(8, 2),
    piezas_por_ciclo: DataTypes.INTEGER,
    // Control
    activa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    observaciones: DataTypes.TEXT,
  },
  {
    sequelize,
    modelName: 'RecetaInyeccion',
    tableName: 'recetas_inyeccion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default RecetaInyeccion;
