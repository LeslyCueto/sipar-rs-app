const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');
require('dotenv').config({ path: '.env' });

async function crearUsuariosEspeciales() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Datos de los usuarios a crear
    const usuarios = [
      {
        nombre: 'Operador SIRPAR',
        dni: '12345601',
        telefono: '987654101',
        zona: 'Lima, Lima, Independencia',
        email: 'operador@sirpar.pe',
        password: 'Operador@2026!SIRPAR',
        rol: 'operador',
        estado: 'activo',
      },
      {
        nombre: 'Administrador SIRPAR',
        dni: '12345602',
        telefono: '987654102',
        zona: 'Lima, Lima, San Isidro',
        email: 'admin@sirpar.pe',
        password: 'Admin@2026!SIRPAR',
        rol: 'admin',
        estado: 'activo',
      },
    ];

    console.log('📝 Creando usuarios...\n');

    for (const datosUsuario of usuarios) {
      try {
        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ email: datosUsuario.email });
        
        if (usuarioExistente) {
          console.log(`⚠️  El usuario ${datosUsuario.email} ya existe. Saltando...`);
          continue;
        }

        // Crear nuevo usuario
        const nuevoUsuario = new Usuario(datosUsuario);
        await nuevoUsuario.save();

        console.log(`✅ ${datosUsuario.rol.toUpperCase()} creado exitosamente:`);
        console.log(`   📧 Email: ${datosUsuario.email}`);
        console.log(`   🔐 Contraseña: ${datosUsuario.password}`);
        console.log(`   👤 Nombre: ${datosUsuario.nombre}`);
        console.log(`   📍 Zona: ${datosUsuario.zona}`);
        console.log(`   📱 Teléfono: ${datosUsuario.telefono}\n`);
      } catch (err) {
        console.error(`❌ Error creando usuario ${datosUsuario.email}:`, err.message);
      }
    }

    console.log('═'.repeat(60));
    console.log('✨ USUARIOS CREADOS EXITOSAMENTE\n');
    console.log('📋 CREDENCIALES DE ACCESO:\n');
    
    console.log('🔵 OPERADOR:');
    console.log('   📧 Email: operador@sirpar.pe');
    console.log('   🔐 Contraseña: Operador@2026!SIRPAR\n');
    
    console.log('🔴 ADMINISTRADOR:');
    console.log('   📧 Email: admin@sirpar.pe');
    console.log('   🔐 Contraseña: Admin@2026!SIRPAR\n');
    
    console.log('═'.repeat(60));
    console.log('✨ Puedes usar estas credenciales para acceder a SIRPAR');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
}

crearUsuariosEspeciales();
