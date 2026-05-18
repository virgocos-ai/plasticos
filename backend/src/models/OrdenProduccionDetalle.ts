import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface OrdenProduccionDetalleAttributes {
  id: number;
  orden_id: number;
  producto_id: number;
  material_id?: number;
  cantidad_solicitada: number;
  cantidad_producida: number;
  cantidad_defectuosa: number;
  peso_pieza_gr?: number;
  peso_total_material_kg?: number;
  ciclos_completados?: number;
  temperatura_inyeccion_real?: number;
  presion_inyeccion_real?: number;
  tiempo_ciclo_real_seg?: number;
  observaciones?: string;
  created_at?: Date;
  updated_at?: Date;
}

class OrdenProduccionDetalle extends Model<OrdenProduccionDetalleAttributes> implements OrdenProduccionDetalleAttributes {
  public id!: number;
  public orden_id!: number;
  public producto_id!: number;
  public material_id!: number;
  public cantidad_solicitada!: number;
  public cantidad_producida!: number;
  public cantidad_defectuosa!: number;
  public peso_pieza_gr!: number;
  public peso_total_material_kg!: number;
  public ciclos_completados!: number;
  public temperatura_inyeccion_real!: number;
  public presion_inyeccion_real!: number;
  public tiempo_ciclo_real_seg!: number;
  public observaciones!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrdenProduccionDetalle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ordenes_produccion',
        key: 'id'
      }
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'productos',
        key: 'id'
      }
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'materiales',
        key: 'id'
      }
    },
    cantidad_solicitada: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    cantidad_producida: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    cantidad_defectuosa: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    peso_pieza_gr: DataTypes.DECIMAL(8, 2),
    peso_total_material_kg: DataTypes.DECIMAL(10, 3),
    ciclos_completados: DataTypes.INTEGER,
    temperatura_inyeccion_real: DataTypes.DECIMAL(5, 1),
    presion_inyeccion_real: DataTypes.DECIMAL(6, 1),
    tiempo_ciclo_real_seg: DataTypes.DECIMAL(6, 1),
    observaciones: DataTypes.TEXT
  },
  {
    sequelize,
    modelName: 'OrdenProduccionDetalle',
    tableName: 'ordenes_produccion_detalle',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default OrdenProduccionDetalle;
