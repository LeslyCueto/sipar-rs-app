require('dotenv').config({ path: `${__dirname}/.env` });
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const Report = require('./models/Report');
const Assign = require('./models/Assign');
const connectDB = require('./config/database');

const zona = 'Lima, Lima, San Isidro';

const main = async () => {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await connectDB();
    console.log('✅ Conectado a MongoDB');

    // ============================================
    // 1. CREAR CIUDADANO
    // ============================================
    console.log('\n📝 Creando ciudadano...');
    const ciudadano = new Usuario({
      nombre: 'Carlos Mendoza',
      email: 'carlos.mendoza@test.com',
      dni: '12345678',
      telefono: '987654321',
      zona: zona,
      rol: 'ciudadano',
      password: 'hash_password_123', // En producción estaría hasheado
    });

    const ciudadanoGuardado = await ciudadano.save();
    console.log('✅ Ciudadano creado:', {
      _id: ciudadanoGuardado._id,
      nombre: ciudadanoGuardado.nombre,
      zona: ciudadanoGuardado.zona,
    });

    // ============================================
    // 2. CREAR OPERADOR
    // ============================================
    console.log('\n👮 Creando operador...');
    const operador = new Usuario({
      nombre: 'Juan Rivera Pérez',
      email: 'juan.rivera@test.com',
      dni: '87654321',
      telefono: '912345678',
      zona: zona,
      rol: 'operador',
      password: 'hash_password_456',
    });

    const operadorGuardado = await operador.save();
    console.log('✅ Operador creado:', {
      _id: operadorGuardado._id,
      nombre: operadorGuardado.nombre,
      zona: operadorGuardado.zona,
    });

    // ============================================
    // 3. CREAR REPORTE
    // ============================================
    console.log('\n📋 Creando reporte...');
    const reporte = new Report({
      usuario: {
        id: ciudadanoGuardado._id,
        nombre: ciudadanoGuardado.nombre,
        email: ciudadanoGuardado.email,
      },
      anonimo: false,
      tipoIncidente: 'quema_ilegal',
      descripcion: 'Se detectó quema ilegal en parque cercano - PRUEBA',
      imagenes: [
        {
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAA==', // Imagen base64 mínima
          nombre: 'foto-prueba.jpg',
          tipo: 'capturada',
          fecha: new Date(),
        },
      ],
      ubicacion: {
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Miraflores', // Diferente del distrito del usuario
        coordenadas: {
          lat: -12.1234,
          lng: -77.0234,
        },
        ubigeo: '150131',
      },
      nivelPercibido: 'alto',
      nivelCalculado: 'alto',
      estado: 'pendiente',
      fechas: {
        creado: new Date(),
      },
    });

    const reporteGuardado = await reporte.save();
    console.log('✅ Reporte creado:', {
      _id: reporteGuardado._id,
      tipoIncidente: reporteGuardado.tipoIncidente,
      usuarioId: reporteGuardado.usuario.id,
      estado: reporteGuardado.estado,
    });

    // ============================================
    // 4. CREAR ASIGNACIÓN
    // ============================================
    console.log('\n🎯 Creando asignación de reporte a operador...');
    const asignacion = new Assign({
      reporte: {
        id: reporteGuardado._id,
        tipoIncidente: reporteGuardado.tipoIncidente,
        descripcion: reporteGuardado.descripcion,
        zona: reporteGuardado.ubicacion?.distrito || zona,
      },
      operador: {
        id: operadorGuardado._id,
        nombre: operadorGuardado.nombre,
        zona: operadorGuardado.zona,
      },
      estado: 'asignado',
      fechaAsignacion: new Date(),
    });

    const asignacionGuardada = await asignacion.save();
    console.log('✅ Asignación creada:', {
      _id: asignacionGuardada._id,
      reporteId: asignacionGuardada.reporte.id,
      operadorId: asignacionGuardada.operador.id,
      estado: asignacionGuardada.estado,
    });

    // ============================================
    // 5. ACTUALIZAR REPORTE CON OPERADOR
    // ============================================
    console.log('\n🔄 Actualizando reporte con operador asignado...');
    const reporteActualizado = await Report.findByIdAndUpdate(
      reporteGuardado._id,
      {
        operadorAsignado: {
          id: operadorGuardado._id,
          nombre: operadorGuardado.nombre,
        },
      },
      { new: true }
    );
    console.log('✅ Reporte actualizado:', {
      _id: reporteActualizado._id,
      operadorAsignado: reporteActualizado.operadorAsignado,
    });

    // ============================================
    // 6. VERIFICAR DATOS
    // ============================================
    console.log('\n📊 VERIFICACIÓN DE DATOS:');
    console.log('═══════════════════════════════════════');

    console.log('\n👤 Ciudadano:');
    console.log(`   Nombre: ${ciudadanoGuardado.nombre}`);
    console.log(`   Email: ${ciudadanoGuardado.email}`);
    console.log(`   DNI: ${ciudadanoGuardado.dni}`);
    console.log(`   Zona: ${ciudadanoGuardado.zona}`);
    console.log(`   Rol: ${ciudadanoGuardado.rol}`);
    console.log(`   ID: ${ciudadanoGuardado._id}`);

    console.log('\n👮 Operador:');
    console.log(`   Nombre: ${operadorGuardado.nombre}`);
    console.log(`   Email: ${operadorGuardado.email}`);
    console.log(`   DNI: ${operadorGuardado.dni}`);
    console.log(`   Zona: ${operadorGuardado.zona}`);
    console.log(`   Rol: ${operadorGuardado.rol}`);
    console.log(`   ID: ${operadorGuardado._id}`);

    console.log('\n📋 Reporte:');
    console.log(`   ID: ${reporteGuardado._id}`);
    console.log(`   Tipo: ${reporteGuardado.tipoIncidente}`);
    console.log(`   Usuario: ${reporteGuardado.usuario.nombre} (${ciudadanoGuardado.zona})`);
    console.log(`   Ubicación reportada: ${reporteGuardado.ubicacion.distrito}`);
    console.log(`   Operador asignado: ${reporteActualizado.operadorAsignado.nombre}`);
    console.log(`   Estado: ${reporteActualizado.estado}`);

    console.log('\n🎯 Asignación:');
    console.log(`   ID: ${asignacionGuardada._id}`);
    console.log(`   Reporte: ${asignacionGuardada.reporte.id}`);
    console.log(`   Operador: ${asignacionGuardada.operador.nombre}`);
    console.log(`   Estado: ${asignacionGuardada.estado}`);
    console.log(`   Fecha: ${asignacionGuardada.fechaAsignacion}`);

    console.log('\n═══════════════════════════════════════');
    console.log('✅ ¡DATOS DE PRUEBA CREADOS EXITOSAMENTE!');
    console.log('\n📍 ZONA DE COINCIDENCIA:');
    console.log(`   Ciudadano zona: ${ciudadanoGuardado.zona}`);
    console.log(`   Operador zona: ${operadorGuardado.zona}`);
    console.log(`   ✅ COINCIDEN - El operador verá este reporte al asignar`);

    console.log('\n🧪 Para probar en el dashboard:');
    console.log(`   1. Inicia sesión como admin`);
    console.log(`   2. Ve a GESTIÓN DE OPERADORES`);
    console.log(`   3. Abre el operador: "${operadorGuardado.nombre}"`);
    console.log(`   4. Haz clic en "Ver Asignados"`);
    console.log(`   5. Verás ${1} reporte en la lista`);
    console.log(`   6. Haz clic en "ASIGNAR REPORTES"`);
    console.log(`   7. Deberías ver el reporte disponible para asignar`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  }
};

main();
