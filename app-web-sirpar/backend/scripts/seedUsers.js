/**
 * Script para insertar usuarios iniciales en MongoDB
 * Ejecutar: node scripts/seedUsers.js
 */

require('dotenv').config({ path: `${__dirname}/../.env` });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

const usuarios = [
  {
    nombre: 'Administrador Principal',
    email: 'admin@sirpar.pe',
    password: 'Admin2026!',
    dni: '12345678',
    telefono: '+51 987654321',
    zona: 'Lima, Sede Central',
    rol: 'admin',
    estado: 'activo',
  },
  {
    nombre: 'Operador Zona Lima',
    email: 'operador.lima@sirpar.pe',
    password: 'Operador2026!',
    dni: '87654321',
    telefono: '+51 987654322',
    zona: 'Lima, Centro de Operaciones',
    rol: 'operador',
    estado: 'activo',
  },
  {
    nombre: 'Operador Zona Callao',
    email: 'operador.callao@sirpar.pe',
    password: 'Operador2026!',
    dni: '11223344',
    telefono: '+51 987654323',
    zona: 'Callao, Centro Regional',
    rol: 'operador',
    estado: 'activo',
  },
];

const seedUsers = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección existente (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      await Usuario.deleteMany({ $or: [
        { rol: 'admin' },
        { rol: 'operador' }
      ]});
      console.log('🗑️  Usuarios admin y operador eliminados');
    }

    // Insertar nuevos usuarios uno por uno (para que se ejecuten los middleware)
    const resultado = [];
    for (const usuarioData of usuarios) {
      const usuarioCreado = await Usuario.create(usuarioData);
      resultado.push(usuarioCreado);
    }
    console.log(`
╔════════════════════════════════════════════════╗
║  ✅ Usuarios iniciales insertados            ║
║  ${resultado.length} registros creados
║
║  Credenciales de Admin:
║  Email: admin@sirpar.pe
║  Password: Admin2026!
║
║  Credenciales de Operadores:
║  Email: operador.lima@sirpar.pe
║  Email: operador.callao@sirpar.pe
║  Password: Operador2026! (ambos)
╚════════════════════════════════════════════════╝
    `);

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedUsers();
