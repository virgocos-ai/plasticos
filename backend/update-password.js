const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('plasticos_erp', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  activo: DataTypes.BOOLEAN
}, {
  tableName: 'usuarios',
  timestamps: false
});

async function updatePassword() {
  const hash = bcrypt.hashSync('admin123', 10);
  console.log('Nuevo hash:', hash);
  
  await Usuario.update({ password: hash }, { where: { email: 'admin@plasticos.com' } });
  console.log('Contraseña actualizada correctamente');
  
  const user = await Usuario.findOne({ where: { email: 'admin@plasticos.com' } });
  console.log('Verificación:', bcrypt.compareSync('admin123', user.password));
  
  process.exit(0);
}

updatePassword().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
