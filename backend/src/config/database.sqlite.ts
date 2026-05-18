import { Sequelize } from 'sequelize';
import path from 'path';

// Configuración SQLite para desarrollo rápido sin MySQL
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: console.log,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: false,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
