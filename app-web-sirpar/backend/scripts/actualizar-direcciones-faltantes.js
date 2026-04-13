const mongoose = require('mongoose');
const Report = require('../models/Report');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ac-bsm78km:7c9ce8e5ce@ac-bsm78km.6ls6ggk.mongodb.net/sirpar-rs?retryWrites=true&w=majority';

// Función para obtener dirección usando coordenadas (geocoding inverso)
async function obtenerDireccionDeCoordenadas(lat, lng, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'SIRPAR-MigrationScript/1.0'
          },
        }
      );

      if (!response.ok) {
        console.warn(`⚠️ Error en solicitud (intento ${attempt + 1}/${retries}): ${response.status}`);
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        }
        continue;
      }

      const datos = await response.json();
      
      if (datos && datos.address) {
        const address = datos.address;
        const partes = [];
        
        // Agregar calle y número
        if (address.road) {
          partes.push(address.road);
          if (address.house_number) {
            partes[partes.length - 1] += ` ${address.house_number}`;
          }
        }
        
        // Agregar barrio
        if (address.suburb && !partes.join().includes(address.suburb)) {
          partes.push(address.suburb);
        }
        
        // Agregar ciudad
        if (address.city && !partes.join().includes(address.city)) {
          partes.push(address.city);
        } else if (address.town && !partes.join().includes(address.town)) {
          partes.push(address.town);
        }
        
        const direccion = partes.length > 0 
          ? partes.join(', ') 
          : datos.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        return direccion;
      }
      
      // Si data.display_name existe pero address no
      if (datos && datos.display_name) {
        return datos.display_name.split(',').slice(0, 3).join(',');
      }
    } catch (err) {
      console.warn(`⚠️ Error fetching (intento ${attempt + 1}/${retries}):`, err.message);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  return null;
}

async function actualizarDirecciones() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar reportes sin dirección
    const reportesSinDireccion = await Report.find({
      $or: [
        { 'ubicacion.direccion': { $exists: false } },
        { 'ubicacion.direccion': '' },
        { 'ubicacion.direccion': null }
      ]
    }).sort({ 'fechas.creado': -1 });

    console.log(`\n📋 Encontrados ${reportesSinDireccion.length} reportes sin dirección`);

    if (reportesSinDireccion.length === 0) {
      console.log('✅ Todos los reportes ya tienen dirección');
      await mongoose.connection.close();
      return;
    }

    // Actualizar cada reporte
    let actualizados = 0;
    let conErrores = 0;

    for (const reporte of reportesSinDireccion) {
      try {
        let direccionGenerada = '';

        // Intentar usar coordenadas si existen
        if (reporte.ubicacion?.coordenadas?.lat && reporte.ubicacion?.coordenadas?.lng) {
          console.log(`\n📍 Obteniendo dirección para coordenadas: ${reporte.ubicacion.coordenadas.lat}, ${reporte.ubicacion.coordenadas.lng}`);
          
          const direccionDesdeCoords = await obtenerDireccionDeCoordenadas(
            reporte.ubicacion.coordenadas.lat,
            reporte.ubicacion.coordenadas.lng
          );

          if (direccionDesdeCoords) {
            direccionGenerada = direccionDesdeCoords;
          } else {
            // Fallback a construir desde ubicación existente
            const partes = [];
            if (reporte.ubicacion.distrito) partes.push(reporte.ubicacion.distrito);
            if (reporte.ubicacion.provincia) partes.push(reporte.ubicacion.provincia);
            if (reporte.ubicacion.departamento) partes.push(reporte.ubicacion.departamento);
            direccionGenerada = partes.length > 0 
              ? partes.join(', ') 
              : `Ubicación ID: ${reporte._id}`;
          }
        } else {
          // Fallback si no hay coordenadas
          const partes = [];
          if (reporte.ubicacion?.distrito) partes.push(reporte.ubicacion.distrito);
          if (reporte.ubicacion?.provincia) partes.push(reporte.ubicacion.provincia);
          if (reporte.ubicacion?.departamento) partes.push(reporte.ubicacion.departamento);
          direccionGenerada = partes.length > 0 
            ? partes.join(', ') 
            : `Ubicación ID: ${reporte._id}`;
        }

        // Actualizar el reporte
        reporte.ubicacion.direccion = direccionGenerada;
        await reporte.save();
        
        actualizados++;
        console.log(`✅ Reporte ${actualizados}: ${direccionGenerada}`);
      } catch (err) {
        conErrores++;
        console.error(`❌ Error actualizando reporte ${reporte._id}:`, err.message);
      }
    }

    console.log(`\n✅ Proceso completado:`);
    console.log(`   - ${actualizados} reportes actualizados exitosamente`);
    console.log(`   - ${conErrores} reportes con error`);
    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

actualizarDirecciones();
