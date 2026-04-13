const mongoose = require('mongoose');
const Report = require('./models/Report');
require('dotenv').config({ path: '.env' });

async function testFlujoDesdeFrontend() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Simular EXACTAMENTE lo que envía el frontend en reporteData
    const datosDelFrontend = {
      usuario: {
        id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        nombre: 'Usuario Test',
        email: 'usuario@example.com',
      },
      anonimo: false,
      tipoIncidente: 'quema_ilegal',
      descripcion: 'Test desde frontend simulado',
      imagenes: [
        {
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
          nombre: 'imagen-reporte-test.jpg',
          tipo: 'capturada',
          fecha: new Date().toISOString(),
        }
      ],
      ubicacion: {
        departamento: 'LIMA',
        provincia: 'LIMA', 
        distrito: 'SAN ISIDRO',
        ubigeo: '',
        direccion: 'Calle Simonabolivar 123, San Isidro, Lima', // ← DIRECCIÓN DEL FRONTEND
        coordenadas: {
          lat: -12.1234,
          lng: -77.0567,
        },
      },
      nivelPercibido: 'alto',
      nivelFinal: null,
      estado: 'pendiente',
      fechas: {
        creado: new Date().toISOString(),
        resuelto: null,
      },
    };

    console.log('\n📤 Datos que envía el FRONTEND:');
    console.log(JSON.stringify(datosDelFrontend, null, 2));

    // IMPORTANTE: Procesar EXACTAMENTE igual a como lo hace crearReporte
    const reporteData = {
      usuario: datosDelFrontend.usuario,
      anonimo: datosDelFrontend.anonimo || false,
      tipoIncidente: datosDelFrontend.tipoIncidente,
      descripcion: datosDelFrontend.descripcion || '',
      imagenes: datosDelFrontend.imagenes.map(img => ({
        url: img.url,
        nombre: img.nombre,
        tipo: img.tipo || 'capturada',
        fecha: img.fecha ? new Date(img.fecha) : new Date(),
      })),
      ubicacion: {
        departamento: datosDelFrontend.ubicacion?.departamento || '',
        provincia: datosDelFrontend.ubicacion?.provincia || '',
        distrito: datosDelFrontend.ubicacion?.distrito || '',
        direccion: datosDelFrontend.ubicacion?.direccion ? String(datosDelFrontend.ubicacion.direccion).trim() : '',
        coordenadas: {
          lat: datosDelFrontend.ubicacion?.coordenadas?.lat || 0,
          lng: datosDelFrontend.ubicacion?.coordenadas?.lng || 0,
        },
        ubigeo: datosDelFrontend.ubicacion?.ubigeo || '',
      },
      nivelPercibido: datosDelFrontend.nivelPercibido,
      estado: datosDelFrontend.estado || 'pendiente',
    };

    console.log('\n🔄 Después de procesar en BACKEND (reporteData):');
    console.log(JSON.stringify(reporteData, null, 2));

    console.log('\n💾 Creando documento con new Report()...');
    const nuevoReporte = new Report(reporteData);

    console.log('\n🧪 Documento antes de guardar:');
    console.log(JSON.stringify(nuevoReporte.toObject(), null, 2));

    console.log('\n✅ Guardando...');
    const resultado = await nuevoReporte.save();
    console.log('Guardado con ID:', resultado._id);

    console.log('\n🔍 Verificando lo que se guardó...');
    const reporteGuardado = await Report.findById(resultado._id);
    
    console.log('\n📊 DOCUMENTO GUARDADO EN BD:');
    console.log(JSON.stringify(reporteGuardado.toObject(), null, 2));

    console.log('\n🎯 VALIDACIÓN FINAL:');
    console.log('- Dirección enviada del frontend:', datosDelFrontend.ubicacion.direccion);
    console.log('- Dirección procesada en backend:', reporteData.ubicacion.direccion);
    console.log('- Dirección guardada en BD:', reporteGuardado.ubicacion.direccion);
    
    if (reporteGuardado.ubicacion.direccion === datosDelFrontend.ubicacion.direccion) {
      console.log('✅ DIRECCIÓN GUARDADA CORRECTAMENTE');
    } else {
      console.log('❌ ERROR EN DIRECCIÓN');
    }

    console.log('\n✨ Test completado');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    mongoose.connection.close();
    process.exit(1);
  }
}

testFlujoDesdeFrontend();
