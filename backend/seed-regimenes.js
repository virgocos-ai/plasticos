const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('plasticos_erp', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

const RegimenFiscal = sequelize.define('RegimenFiscal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  clave: { type: DataTypes.STRING(3), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(200), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'regimenes_fiscales',
  timestamps: true,
  underscored: true,
  freezeTableName: true
});

const catalogoSAT = [
  { clave: '601', descripcion: 'General de Ley Personas Morales' },
  { clave: '603', descripcion: 'Personas Morales con Fines no Lucrativos' },
  { clave: '605', descripcion: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { clave: '606', descripcion: 'Arrendamiento' },
  { clave: '607', descripcion: 'Régimen de Enajenación o Adquisición de Bienes' },
  { clave: '608', descripcion: 'Demás ingresos' },
  { clave: '610', descripcion: 'Residentes en el Extranjero sin Establecimiento Permanente en México' },
  { clave: '611', descripcion: 'Ingresos por Dividendos (socios y accionistas)' },
  { clave: '612', descripcion: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { clave: '614', descripcion: 'Ingresos por intereses' },
  { clave: '615', descripcion: 'Régimen de los ingresos por obtención de premios' },
  { clave: '616', descripcion: 'Sin obligaciones fiscales' },
  { clave: '620', descripcion: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos' },
  { clave: '621', descripcion: 'Incorporación Fiscal' },
  { clave: '622', descripcion: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { clave: '623', descripcion: 'Opcional para Grupos de Sociedades' },
  { clave: '624', descripcion: 'Coordinados' },
  { clave: '625', descripcion: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { clave: '626', descripcion: 'Régimen Simplificado de Confianza' }
];

async function seedRegimenes() {
  try {
    await sequelize.sync();
    console.log('Tabla sincronizada');

    let creados = 0;
    let actualizados = 0;

    for (const item of catalogoSAT) {
      const [regimen, created] = await RegimenFiscal.findOrCreate({
        where: { clave: item.clave },
        defaults: { ...item, activo: true }
      });
      
      if (created) {
        creados++;
        console.log(`✓ Creado: ${item.clave} - ${item.descripcion}`);
      } else {
        await regimen.update({ descripcion: item.descripcion, activo: true });
        actualizados++;
        console.log(`↻ Actualizado: ${item.clave} - ${item.descripcion}`);
      }
    }

    console.log('\n========================================');
    console.log('CATÁLOGO SAT CARGADO EXITOSAMENTE');
    console.log('========================================');
    console.log(`Total de regímenes: ${catalogoSAT.length}`);
    console.log(`Nuevos: ${creados}`);
    console.log(`Actualizados: ${actualizados}`);
    console.log('========================================');

    const total = await RegimenFiscal.count();
    console.log(`Registros en BD: ${total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedRegimenes();
