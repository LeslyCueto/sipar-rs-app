require('dotenv').config({ path: `${__dirname}/.env` });
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const email = 'operador.callao@sirpar.pe';
    const passwordIngresada = 'Operador2026!';

    console.log(`\n🔍 Buscando usuario: ${email}`);
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario) {
      console.log('❌ Usuario NO encontrado');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:', usuario.nombre);
    console.log('📋 Email en BD:', usuario.email);
    console.log('🔐 Password hash:', usuario.password.substring(0, 20) + '...');
    console.log('📝 Password ingresado:', passwordIngresada);

    // Test bcrypt
    const esValida = await bcrypt.compare(passwordIngresada, usuario.password);
    console.log('\n🔐 bcrypt.compare resultado:', esValida);

    // Test con método del modelo
    const esValidaMetodo = await usuario.compararContraseña(passwordIngresada);
    console.log('🔐 usuario.compararContraseña resultado:', esValidaMetodo);

    if (!esValidaMetodo) {
      // Intentar con otras variantes
      console.log('\n🧪 Intentando variantes...');
      const pwds = [
        'Operador2026!',
        'operador2026!',
        'OPERADOR2026!',
        'Operador2026',
      ];
      for (const pwd of pwds) {
        const result = await bcrypt.compare(pwd, usuario.password);
        console.log(`  ${pwd}: ${result}`);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testLogin();
