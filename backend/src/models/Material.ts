import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

type MaterialCreationAttributes = Optional<MaterialAttributes, 'id'>;

interface MaterialAttributes {
  id?: number;
  codigo: string;
  nombre: string;
  tipo: 'resina' | 'masterbatch' | 'aditivo' | 'empaque' | 'otro';
  marca?: string;
  modelo?: string;
  color?: string;
  unidad_medida: string;
  peso_kg_bolsa?: number;
  proveedor_preferido_id?: number;
  costo_por_kg: number;
  stock_minimo_kg: number;
  stock_maximo_kg: number;
  stock_actual_kg: number;
  temperatura_inyeccion_c?: number;
  temperatura_molde_c?: number;
  presion_inyeccion_bar?: number;
  tiempo_ciclo_seg?: number;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public tipo!: 'resina' | 'masterbatch' | 'aditivo' | 'empaque' | 'otro';
  public marca!: string;
  public modelo!: string;
  public color!: string;
  public unidad_medida!: string;
  public peso_kg_bolsa!: number;
  public proveedor_preferido_id!: number;
  public costo_por_kg!: number;
  public stock_minimo_kg!: number;
  public stock_maximo_kg!: number;
  public stock_actual_kg!: number;
  public temperatura_inyeccion_c!: number;
  public temperatura_molde_c!: number;
  public presion_inyeccion_bar!: number;
  public tiempo_ciclo_seg!: number;
  public activo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public lotesMaterial?: any[];
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    codigo: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('resina', 'masterbatch', 'aditivo', 'empaque', 'otro'),
      allowNull: false
    },
    marca: DataTypes.STRING(50),
    modelo: DataTypes.STRING(50),
    color: DataTypes.STRING(30),
    unidad_medida: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'KG',
      comment: 'Unidad SAT: KG, G, LT, etc'
    },
    peso_kg_bolsa: {
      type: DataTypes.DECIMAL(8, 2),
      comment: 'Peso por bolsa/saco en KG'
    },
    proveedor_preferido_id: DataTypes.INTEGER,
    costo_por_kg: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0
    },
    stock_minimo_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    stock_maximo_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1000
    },
    stock_actual_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    temperatura_inyeccion_c: {
      type: DataTypes.DECIMAL(5, 1),
      comment: 'Temperatura recomendada de inyección en °C'
    },
    temperatura_molde_c: {
      type: DataTypes.DECIMAL(5, 1),
      comment: 'Temperatura recomendada del molde en °C'
    },
    presion_inyeccion_bar: {
      type: DataTypes.DECIMAL(6, 1),
      comment: 'Presión de inyección en bar'
    },
    tiempo_ciclo_seg: {
      type: DataTypes.DECIMAL(6, 1),
      comment: 'Tiempo de ciclo estimado en segundos'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Material',
    tableName: 'materiales',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Material;
