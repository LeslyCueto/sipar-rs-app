const mongoose = require('mongoose');
const Report = require('./models/Report');
require('dotenv').config({ path: '.env' });

async function insertarTestConDireccion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Insertar directamente con Mongoose pero documentación completa
    const reporteTest = new Report({
      usuario: {
        id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // ID de test
        nombre: 'Test User',
        email: 'test@example.com',
      },
      anonimo: false,
      tipoIncidente: 'quema_ilegal',
      descripcion: 'Reporte de prueba para verificar dirección',
      imagenes: [
        {
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', // Imagen pequeña de test
          nombre: 'test-image.jpg',
          tipo: 'capturada',
        },
      ],
      ubicacion: {
        departamento: 'LIMA',
        provincia: 'LIMA',
        distrito: 'SAN ISIDRO',
        direccion: 'Avenida Los Jazmines 150, San Isidro, Lima', // DIRECCIÓN EXPLÍCITA
        coordenadas: {
          lat: -12.1181,
          lng: -77.0341,
        },
        ubigeo: '150131',
      },
      nivelPercibido: 'alto',
      estado: 'pendiente',
    });

    console.log('\n📝 Documento a guardar:');
    console.log(JSON.stringify(reporteTest.toObject(), null, 2));

    console.log('\n🔄 Validando esquema...');
    const error = reporteTest.validateSync();
    if (error) {
      console.error('❌ Error de validación:', error.message);
      process.exit(1);
    }
    console.log('✅ Validación pasada');

    console.log('\n💾 Guardando en MongoDB...');
    const resultado = await reporteTest.save();
    console.log('✅ Guardado con ID:', resultado._id);

    console.log('\n🔍 Verificando inmediatamente lo que se guardó...');
    const verificacion = await Report.findById(resultado._id);
    console.log(JSON.stringify(verificacion.toObject(), null, 2));

    console.log('\n🎯 VERIFICACIÓN FINAL:');
    console.log('- Dirección guardada:', verificacion.ubicacion.direccion);
    console.log('- ¿Existe?: ', verificacion.ubicacion.direccion ? '✅ SÍ' : '❌ NO');
    console.log('- Tipo:', typeof verificacion.ubicacion.direccion);

    console.log('\n✨ Test completado exitosamente');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
}

insertarTestConDireccion();
