const mongoose = require('mongoose');
const Report = require('./models/Report');
require('dotenv').config({ path: '.env' });

async function testDireccion() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar el reporte más reciente
    const ultimoReporte = await Report.findOne()
      .sort({ 'fechas.creado': -1 })
      .exec();

    if (!ultimoReporte) {
      console.log('❌ No hay reportes en la base de datos');
      return;
    }

    console.log('\n📋 ULTIMO REPORTE EN BD:');
    console.log('='.repeat(50));
    
    // Verificar ubicación
    console.log('\n🗺️ UBICACION COMPLETA:');
    console.log(JSON.stringify(ultimoReporte.ubicacion, null, 2));

    console.log('\n🔍 VERIFICACION CAMPO DIRECCION:');
    console.log('- Existe: ', 'direccion' in ultimoReporte.ubicacion);
    console.log('- Valor: ', ultimoReporte.ubicacion?.direccion);
    console.log('- Tipo: ', typeof ultimoReporte.ubicacion?.direccion);
    console.log('- Es vacío: ', !ultimoReporte.ubicacion?.direccion);

    // Verificar si lean() hace diferencia
    const ultimoReporteLean = await Report.findOne()
      .sort({ 'fechas.creado': -1 })
      .lean()
      .exec();

    console.log('\n📋 CON LEAN():');
    console.log('- Direccion: ', ultimoReporteLean.ubicacion?.direccion);
    console.log('- Ubicacion completa:', JSON.stringify(ultimoReporteLean.ubicacion, null, 2));

    // Verificar schema fields
    console.log('\n📊 SCHEMA FIELDS:');
    const schemaFields = Object.keys(Report.schema.paths).filter(p => p.includes('ubicacion'));
    console.log('Campos de ubicacion en schema:', schemaFields);

    console.log('\n✅ Test completado');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    mongoose.connection.close();
  }
}

testDireccion();
