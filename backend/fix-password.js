const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('Hash generado:', hash);
console.log('Verificación:', bcrypt.compareSync(password, hash));
