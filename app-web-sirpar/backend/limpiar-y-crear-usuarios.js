const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
require('dotenv').config({ path: '.env' });

async function limpiarYCrearUsuarios() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Emails a eliminar
    const emailsAEliminar = ['operador@sirpar.pe', 'admin@sirpar.pe'];

    console.log('🗑️  Eliminando usuarios antiguos...\n');
    for (const email of emailsAEliminar) {
      const resultado = await Usuario.deleteOne({ email: email.toLowerCase() });
      if (resultado.deletedCount > 0) {
        console.log(`✅ Usuario ${email} eliminado`);
      }
    }

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

    console.log('\n📝 Creando usuarios nuevos...\n');

    for (const datosUsuario of usuarios) {
      try {
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
    console.log('✨ USUARIOS RECREADOS EXITOSAMENTE\n');
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

limpiarYCrearUsuarios();
