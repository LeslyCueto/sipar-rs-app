const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

async function verificarDirectamenteEnMongo() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔌 Conectando directamente a MongoDB (sin Mongoose)...');
    await client.connect();
    console.log('✅ Conectado');

    const db = client.db();
    const reportesCollection = db.collection('reports');

    console.log('\n Verificando el documento más reciente...');
    const ultimoDoc = await reportesCollection
      .findOne({}, { sort: { 'fechas.creado': -1 } });

    if (!ultimoDoc) {
      console.log('❌ No hay documentos en la colección');
      return;
    }

    console.log('\n📋 DOCUMENTO COMPLETO EN MONGODB:');
    console.log(JSON.stringify(ultimoDoc, null, 2));

    console.log('\n🎯 INFORMACIÓN DE UBICACIÓN:');
    console.log('- Documento ubicacion:', ultimoDoc.ubicacion);
    console.log('- Campo direccion:', ultimoDoc.ubicacion?.direccion);
    console.log('- ¿Existe el campo?:', 'direccion' in (ultimoDoc.ubicacion || {}));

    console.log('\n📊 TODAS LAS CLAVES DE UBICACION:');
    console.log(Object.keys(ultimoDoc.ubicacion || {}));

    // Contar documentos con dirección
    console.log('\n📈 ESTADÍSTICAS:');
    const totalDocs = await reportesCollection.countDocuments({});
    const docsConDireccion = await reportesCollection.countDocuments({
      'ubicacion.direccion': { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`- Total de documentos: ${totalDocs}`);
    console.log(`- Documentos con dirección: ${docsConDireccion}`);
    console.log(`- Documentos SIN dirección: ${totalDocs - docsConDireccion}`);

    console.log('\n✨ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.close();
  }
}

verificarDirectamenteEnMongo();
