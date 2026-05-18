import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface ProductoAttributes {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'producto_terminado' | 'subensamble' | 'pieza';
  unidad_medida: string;
  peso_gr?: number;
  material_principal_id?: number;
  ciclo_inyeccion_seg?: number;
  cavidades_molde?: number;
  tiempo_cambio_molde_min?: number;
  costo_material_unitario: number;
  costo_mano_obra_unitario: number;
  costo_energia_unitario: number;
  precio_venta: number;
  stock_minimo: number;
  stock_maximo: number;
  stock_actual: number;
  activo: boolean;
  created_at?: Date;
  updated_at?: Date;
}

class Producto extends Model<ProductoAttributes> implements ProductoAttributes {
  public id!: number;
  public codigo!: string;
  public nombre!: string;
  public descripcion!: string;
  public tipo!: 'producto_terminado' | 'subensamble' | 'pieza';
  public unidad_medida!: string;
  public peso_gr!: number;
  public material_principal_id!: number;
  public ciclo_inyeccion_seg!: number;
  public cavidades_molde!: number;
  public tiempo_cambio_molde_min!: number;
  public costo_material_unitario!: number;
  public costo_mano_obra_unitario!: number;
  public costo_energia_unitario!: number;
  public precio_venta!: number;
  public stock_minimo!: number;
  public stock_maximo!: number;
  public stock_actual!: number;
  public activo!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Producto.init(
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
    descripcion: DataTypes.TEXT,
    tipo: {
      type: DataTypes.ENUM('producto_terminado', 'subensamble', 'pieza'),
      allowNull: false,
      defaultValue: 'producto_terminado'
    },
    unidad_medida: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'PZ',
      comment: 'Unidad de medida SAT (PZ, KG, MT, etc)'
    },
    peso_gr: {
      type: DataTypes.DECIMAL(10, 2),
      comment: 'Peso en gramos del producto'
    },
    material_principal_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Material principal usado en la inyección'
    },
    ciclo_inyeccion_seg: {
      type: DataTypes.DECIMAL(6, 2),
      comment: 'Tiempo de ciclo de inyección en segundos'
    },
    cavidades_molde: {
      type: DataTypes.INTEGER,
      comment: 'Número de cavidades del molde'
    },
    tiempo_cambio_molde_min: {
      type: DataTypes.INTEGER,
      comment: 'Tiempo promedio de cambio de molde en minutos'
    },
    costo_material_unitario: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0
    },
    costo_mano_obra_unitario: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0
    },
    costo_energia_unitario: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false,
      defaultValue: 0
    },
    precio_venta: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    stock_minimo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    stock_maximo: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    stock_actual: {
      type: DataTypes.DECIMAL(12, 2),
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
    modelName: 'Producto',
    tableName: 'productos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Producto;
