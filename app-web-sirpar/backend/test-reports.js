const mongoose = require('mongoose');
require('dotenv').config({ path: `${__dirname}/.env` });

const Report = require('./models/Report');
const Usuario = require('./models/Usuario');

async function testReportStructure() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar un usuario existente
    const usuario = await Usuario.findOne().select('_id nombre email');
    
    if (!usuario) {
      console.log('⚠️  No hay usuarios en la base de datos. Creando usuario de prueba...');
      const nuevoUsuario = new Usuario({
        nombre: 'Usuario Test',
        dni: '12345678',
        email: 'test@example.com',
        password: 'hashedpassword',
        zona: 'Lima, Lima, Independencia',
        rol: 'ciudadano',
        estado: 'activo'
      });
      await nuevoUsuario.save();
      console.log('✓ Usuario de prueba creado');
    }

    // Crear un reporte de prueba con la nueva estructura
    const nuevoReporte = new Report({
      usuario: {
        id: usuario?._id,
        nombre: usuario?.nombre || 'Test User',
        email: usuario?.email || 'test@example.com',
      },
      anonimo: false,
      tipoIncidente: 'quema_ilegal',
      descripcion: 'Reporte de prueba con una imagen',
      imagen: {
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwwDAwUGEAMFBwcGBwcGBwcHBwcICAgJCAgKCAcHCg0KCgsMDAwMBAkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwIDAwKDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWm5ybnJ2eoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k',
        nombre: 'test_image.jpg',
        tipo: 'image/jpeg',
        fecha: new Date(),
      },
      ubicacion: {
        departamento: 'LIMA',
        provincia: 'LIMA',
        distrito: 'INDEPENDENCIA',
        ubigeo: '150131',
        coordenadas: {
          lat: -11.9808,
          lng: -77.0765,
        },
      },
      nivelPercibido: 'alto',
      nivelFinal: null,
      estado: 'pendiente',
      fechas: {
        creado: new Date(),
        enProceso: null,
        resuelto: null,
      },
    });

    console.log('\n📋 Guardando reporte de prueba...');
    const reporteGuardado = await nuevoReporte.save();
    console.log('✓ Reporte guardado exitosamente');
    console.log('\n📊 Estructura guardada:');
    console.log(JSON.stringify(reporteGuardado, null, 2));

    // Verificar que se puede recuperar
    console.log('\n🔍 Recuperando reporte...');
    const reporteRecuperado = await Report.findById(reporteGuardado._id);
    
    if (reporteRecuperado) {
      console.log('✓ Reporte recuperado correctamente');
      console.log(`  • ID: ${reporteRecuperado._id}`);
      console.log(`  • Tipo: ${reporteRecuperado.tipoIncidente}`);
      console.log(`  • Imagen: ${reporteRecuperado.imagen.nombre}`);
      console.log(`  • Estado: ${reporteRecuperado.estado}`);
      console.log(`  • Ubicación: ${reporteRecuperado.ubicacion.distrito}`);
    } else {
      console.log('❌ No se pudo recuperar el reporte');
    }

    console.log('\n✅ Prueba completada exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

testReportStructure();
