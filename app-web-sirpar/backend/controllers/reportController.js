const mongoose = require('mongoose');
const Report = require('../models/Report');
const Usuario = require('../models/Usuario');
const Assign = require('../models/Assign');

// Crear un nuevo reporte
exports.crearReporte = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Del middleware de autenticación

    const {
      anonimo,
      tipoIncidente,
      descripcion,
      imagenes,
      ubicacion,
      nivelPercibido,
    } = req.body;

    // Log inicial - datos recibidos
    console.log('📥 Datos recibidos:', {
      usuarioId,
      tipoIncidente,
      anonimo,
      imagenCount: imagenes?.length,
      nivelPercibido,
    });

    // Validar datos requeridos
    if (!tipoIncidente || !imagenes || imagenes.length === 0 || !ubicacion || !nivelPercibido) {
      console.log('❌ Validación fallida - Datos faltantes:', {
        tipoIncidente: !!tipoIncidente,
        imagenes: !!imagenes && imagenes.length,
        ubicacion: !!ubicacion,
        nivelPercibido: !!nivelPercibido,
      });
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
        campos: {
          tipoIncidente: !!tipoIncidente,
          imagenes: !!imagenes && imagenes.length,
          ubicacion: !!ubicacion,
          nivelPercibido: !!nivelPercibido,
        }
      });
    }

    const usuario = await Usuario.findById(usuarioId).select('nombre email');

    if (!usuario) {
      console.log('❌ Usuario no encontrado:', usuarioId);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    console.log('✅ Usuario encontrado:', usuario.email);

    // Procesar imagenes para asegurar estructura correcta
    const imagenesValidas = imagenes.filter(img => img.url && img.url.trim().length > 0);
    
    if (imagenesValidas.length === 0) {
      console.log('❌ Validación fallida - Sin imágenes válidas');
      return res.status(400).json({
        success: false,
        message: 'Debes incluir al menos una imagen válida',
      });
    }

    const imagenesProcessadas = imagenesValidas.map((img, idx) => {
      console.log(`   📸 Procesando imagen ${idx + 1}:`, {
        urlLength: img.url?.length,
        tipo: img.tipo,
        nombre: img.nombre,
      });
      return {
        url: img.url,
        nombre: img.nombre || `imagen-${Date.now()}.jpg`,
        tipo: img.tipo || 'capturada',
        fecha: img.fecha ? new Date(img.fecha) : new Date(),
      };
    });

    console.log('✅ Imágenes procesadas:', imagenesProcessadas.length);

    const reporteData = {
      usuario: {
        id: usuarioId,
        nombre: usuario.nombre,
        email: usuario.email,
      },
      anonimo: anonimo || false,
      tipoIncidente,
      descripcion: descripcion || '',
      imagenes: imagenesProcessadas,
      ubicacion: {
        departamento: ubicacion?.departamento || '',
        provincia: ubicacion?.provincia || '',
        distrito: ubicacion?.distrito || '',
        direccion: ubicacion?.direccion || '',
        coordenadas: {
          lat: ubicacion?.coordenadas?.lat || 0,
          lng: ubicacion?.coordenadas?.lng || 0,
        },
        ubigeo: ubicacion?.ubigeo || '',
      },
      nivelPercibido,
      estado: 'pendiente',
      fechas: {
        creado: new Date(),
      },
    };

    console.log('🔄 Intentando crear reporte con estructura:', {
      usuario: `${reporteData.usuario.nombre} (${reporteData.usuario.email})`,
      tipoIncidente: reporteData.tipoIncidente,
      imagenes: reporteData.imagenes.length,
      nivelPercibido: reporteData.nivelPercibido,
    });

    const nuevoReporte = new Report(reporteData);
    
    console.log('🔍 Validando schema...');
    const error = nuevoReporte.validateSync();
    if (error) {
      console.error('❌ Error de validación del schema:', error.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        detalles: error.message,
      });
    }

    // Verificar tamaño del documento antes de guardar
    const docSize = JSON.stringify(reporteData).length;
    const docSizeMB = (docSize / (1024 * 1024)).toFixed(2);
    console.log(`📊 Tamaño del documento: ${docSizeMB} MB`);
    
    if (docSize > 15 * 1024 * 1024) {
      console.error(`❌ Documento demasiado grande: ${docSizeMB} MB (máx 16MB)`);
      return res.status(413).json({
        success: false,
        message: 'El reporte es demasiado grande. Intenta con una imagen más pequeña.',
      });
    }

    console.log('✅ Schema válido, guardando en BD...');
    await nuevoReporte.save();

    console.log('✅ Reporte guardado exitosamente:', nuevoReporte._id);

    res.status(201).json({
      success: true,
      message: '✓ Reporte creado correctamente',
      reporte: nuevoReporte,
    });
  } catch (err) {
    console.error('❌ Error creando reporte:', err.message);
    console.error('❌ Stack:', err.stack);
    
    // Devolver error específico según el tipo
    let mensaje = 'Error al crear el reporte';
    let estado = 500;
    
    if (err.name === 'ValidationError') {
      const campos = Object.keys(err.errors).map(key => `${key}: ${err.errors[key].message}`).join(', ');
      mensaje = `Validación: ${campos}`;
      estado = 400;
    } else if (err.name === 'MongoError' || err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
      mensaje = `Error de conexión a base de datos: ${err.message}`;
      estado = 503;
    } else if (err.name === 'MongoServerSelectionError') {
      mensaje = 'No se puede conectar a la base de datos. Intenta más tarde.';
      estado = 503;
    } else if (err.message) {
      mensaje = err.message;
    }
    
    res.status(estado).json({
      success: false,
      message: mensaje,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// Obtener reportes del usuario autenticado
exports.obtenerMisReportes = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const reportes = await Report.find({
      'usuario.id': new mongoose.Types.ObjectId(usuarioId),
    }).sort({ 'fechas.creado': -1 });

    res.status(200).json({
      success: true,
      reportes,
    });
  } catch (err) {
    console.error('❌ Error obteniendo reportes:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los reportes',
    });
  }
};

// Obtener un reporte específico
exports.obtenerReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const reporte = await Report.findById(id);

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado',
      });
    }

    // Verificar que el usuario sea el dueño del reporte
    if (reporte.usuario.id.toString() !== usuarioId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este reporte',
      });
    }

    res.status(200).json({
      success: true,
      reporte,
    });
  } catch (err) {
    console.error('❌ Error obteniendo reporte:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el reporte',
    });
  }
};

// Actualizar estado del reporte (para operadores)
exports.actualizarEstadoReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nivelCalculado } = req.body;

    const reporte = await Report.findByIdAndUpdate(
      id,
      {
        estado,
        nivelCalculado,
        ...(estado === 'en_proceso' && { 'fechas.enProceso': new Date() }),
        ...(estado === 'resuelto' && { 'fechas.resuelto': new Date() }),
      },
      { new: true }
    );

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Estado actualizado correctamente',
      reporte,
    });
  } catch (err) {
    console.error('❌ Error actualizando reporte:', err);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el reporte',
    });
  }
};

// Obtener todos los reportes (para admin/operadores)
exports.obtenerTodosReportes = async (req, res) => {
  try {
    const { estado, tipo } = req.query;

    // Construir filtros simples
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (tipo) filtro.tipoIncidente = tipo;

    // Obtener reportes sin complicaciones - igual a obtenerMisReportes pero para TODOS
    const reportes = await Report.find(filtro)
      .sort({ 'fechas.creado': -1 });

    console.log(`✅ Obtenidos ${reportes.length} reportes`);
    
    // Obtener TODOS los registros de Assign para verificar asignaciones
    const assigns = await Assign.find({});
    const assignMap = {};
    assigns.forEach(assign => {
      const reporteId = assign.reporte.id?.toString() || assign.reporte.id;
      assignMap[reporteId] = assign.operador.id;
    });

    // Enriquecer reportes con información de asignación
    const reportesEnriquecidos = reportes.map(reporte => {
      const reporteId = reporte._id?.toString();
      const estaAsignado = !!assignMap[reporteId];
      
      return {
        ...reporte.toObject(),
        estaAsignado,
        usuarioZona: reporte.ubicacion?.distrito || reporte.ubicacion?.provincia || '',
        operadorAsignadoId: assignMap[reporteId] || null,
      };
    });

    console.log(`📊 Reportes enriquecidos con asignación info. Asignados: ${Object.keys(assignMap).length}`);

    res.status(200).json({
      success: true,
      total: reportesEnriquecidos.length,
      reportes: reportesEnriquecidos,
    });
  } catch (err) {
    console.error('❌ Error obteniendo reportes:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los reportes',
    });
  }
};

// Obtener reportes asignados a un operador específico
exports.obtenerReportesAsignados = async (req, res) => {
  try {
    const { operadorId } = req.params;

    // Validar que el operatorId es válido
    if (!mongoose.Types.ObjectId.isValid(operadorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de operador inválido',
      });
    }

    console.log('📋 Obteniendo reportes asignados a:', operadorId);

    // Buscar registros en Assign para este operador
    const assignments = await Assign.find({
      'operador.id': operadorId,
    }).populate('reporte.id');

    console.log(`✅ Found ${assignments.length} assignments for operator`);

    // Mapear para obtener los reportes con su información de asignación
    const reportesAsignados = assignments
      .map(assign => {
        const reporteData = assign.reporte.id;
        if (!reporteData) return null;

        return {
          ...reporteData.toObject(),
          asignacionId: assign._id,
          estaAsignado: true,
          usuarioZona: reporteData.ubicacion?.distrito || reporteData.ubicacion?.provincia || '',
        };
      })
      .filter(reporte => reporte !== null);

    console.log(`📊 Mapped ${reportesAsignados.length} assignmnets to reports`);

    res.status(200).json({
      success: true,
      total: reportesAsignados.length,
      reportes: reportesAsignados,
    });
  } catch (err) {
    console.error('❌ Error obteniendo reportes asignados:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los reportes asignados',
    });
  }
};

// Obtener reportes sin asignar en una zona específica
// Filtra por la ZONA DEL USUARIO que reportó, no por la ubicación del incidente
exports.obtenerReportesDisponibles = async (req, res) => {
  try {
    const { zona } = req.query;

    // Validar que se proporcionó una zona
    if (!zona) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar una zona',
      });
    }

    console.log('📍 Obteniendo reportes sin asignar de usuarios con zona:', zona);

    // Extraer el distrito: tomar el último valor después de la última coma
    // Ejemplo: "Lima, Lima, Independencia" -> "Independencia"
    const partesZona = zona.split(',').map(parte => parte.trim());
    const distritoOperador = partesZona[partesZona.length - 1].toLowerCase().trim();

    console.log('🔍 Zona recibida:', zona);
    console.log('🎯 Distrito del operador extraído:', distritoOperador);

    // Obtener todos los registros de Assign para extraer IDs de reportes asignados
    const assignRecords = await Assign.find({}).lean();
    const assignedReportIds = assignRecords.map(record => record.reporte?.id || record.reporte).filter(Boolean);
    console.log(`📊 Total reportes asignados en Assign: ${assignedReportIds.length}`);
    console.log(`🔗 IDs asignados (primeros 3):`, assignedReportIds.slice(0, 3));

    // Obtener todos los reportes con usuario poblado
    const todosReportes = await Report.find({}).populate('usuario.id');
    console.log(`📋 Total reportes en BD: ${todosReportes.length}`);

    // Filtrar reportes sin asignar Y que pertenecen a la zona correcta
    const reportesDisponibles = todosReportes.filter(reporte => {
      // Verificar que NO esté asignado
      const estaAsignado = assignedReportIds.some(id => id.toString() === reporte._id.toString());
      if (estaAsignado) {
        return false;
      }

      // Obtener el objeto usuario poblado
      const usuarioObj = reporte.usuario?.id;
      
      if (!usuarioObj) {
        console.log(`⚠️ Reporte ${reporte._id} no tiene usuario poblado. usuario:`, reporte.usuario);
        return false;
      }

      if (!usuarioObj.zona) {
        console.log(`⚠️ Usuario de reporte ${reporte._id} no tiene zona. Usuario:`, {
          id: usuarioObj._id,
          nombre: usuarioObj.nombre,
          email: usuarioObj.email,
        });
        return false;
      }

      // Extraer zona del usuario ciudadano
      const zonaUsuario = usuarioObj.zona;
      const partesZonaUsuario = zonaUsuario.split(',').map(parte => parte.trim());
      const distritoUsuario = partesZonaUsuario[partesZonaUsuario.length - 1].toLowerCase().trim();

      // Hacer match por distrito
      const coincide = distritoUsuario === distritoOperador;
      
      console.log(`🔎 Reporte ${reporte._id}: usuario="${usuarioObj.nombre}", zonaCompleta="${zonaUsuario}", distroUsuario="${distritoUsuario}", distroOperador="${distritoOperador}", match=${coincide}`);
      
      if (coincide) {
        console.log(
          `✅ MATCH ENCONTRADO para reporte ${reporte._id}:\n` +
          `   Usuario: ${usuarioObj.nombre} (${usuarioObj.email})\n` +
          `   Zona usuario: "${zonaUsuario}"\n` +
          `   Distrito usuario: "${distritoUsuario}"\n` +
          `   Distrito operador: "${distritoOperador}"`
        );
      }
      
      return coincide;
    });

    console.log(`✅ Encontrados ${reportesDisponibles.length} reportes sin asignar de usuarios en distrito: ${distritoOperador}`);

    res.status(200).json({
      success: true,
      total: reportesDisponibles.length,
      reportes: reportesDisponibles,
    });
  } catch (err) {
    console.error('❌ Error obteniendo reportes disponibles:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los reportes disponibles',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};

// Obtener vista HTML de todos los reportes
exports.obtenerVistaReportes = async (req, res) => {
  try {
    const reportes = await Report.find({}).sort({ 'fechas.creado': -1 });

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vista de Reportes - SIRPAR</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        h1 {
          color: white;
          text-align: center;
          margin-bottom: 30px;
          font-size: 2.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .stat-card h3 {
          color: #667eea;
          font-size: 2rem;
          margin-bottom: 10px;
        }
        
        .stat-card p {
          color: #666;
          font-size: 0.9rem;
        }
        
        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }
        
        .report-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .report-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .report-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-bottom: 4px solid #667eea;
        }
        
        .report-header h3 {
          margin-bottom: 5px;
          font-size: 1.2rem;
        }
        
        .report-type {
          font-size: 0.85rem;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .report-body {
          padding: 20px;
        }
        
        .report-info {
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        
        .report-label {
          font-weight: 600;
          color: #667eea;
          min-width: 100px;
        }
        
        .report-value {
          color: #333;
          word-break: break-word;
          flex: 1;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-pendiente {
          background-color: #fef3c7;
          color: #d97706;
        }
        
        .status-en_proceso {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .status-resuelto {
          background-color: #dcfce7;
          color: #15803d;
        }
        
        .nivel-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .nivel-bajo {
          background-color: #dcfce7;
          color: #15803d;
        }
        
        .nivel-medio {
          background-color: #fef3c7;
          color: #d97706;
        }
        
        .nivel-alto {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: white;
        }
        
        .empty-state h2 {
          font-size: 1.5rem;
          margin-bottom: 10px;
        }
        
        @media (max-width: 768px) {
          h1 {
            font-size: 1.8rem;
          }
          
          .reports-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📋 Vista de Reportes - SIRPAR</h1>
        
        <div class="stats">
          <div class="stat-card">
            <h3>${reportes.length}</h3>
            <p>Total de Reportes</p>
          </div>
          <div class="stat-card">
            <h3>${reportes.filter(r => r.estado === 'pendiente').length}</h3>
            <p>Pendientes</p>
          </div>
          <div class="stat-card">
            <h3>${reportes.filter(r => r.estado === 'en_proceso').length}</h3>
            <p>En Proceso</p>
          </div>
          <div class="stat-card">
            <h3>${reportes.filter(r => r.estado === 'resuelto').length}</h3>
            <p>Resueltos</p>
          </div>
        </div>
        
        ${reportes.length > 0 ? `
          <div class="reports-grid">
            ${reportes.map(reporte => `
              <div class="report-card">
                <div class="report-header">
                  <h3>#${reporte._id.toString().slice(-6).toUpperCase()}</h3>
                  <div class="report-type">${reporte.tipoIncidente}</div>
                </div>
                <div class="report-body">
                  <div class="report-info">
                    <span class="report-label">Estado:</span>
                    <span class="report-value">
                      <span class="status-badge status-${reporte.estado}">
                        ${reporte.estado.replace('_', ' ')}
                      </span>
                    </span>
                  </div>
                  
                  <div class="report-info">
                    <span class="report-label">Usuario:</span>
                    <span class="report-value">${reporte.usuario.nombre}</span>
                  </div>
                  
                  <div class="report-info">
                    <span class="report-label">Descripción:</span>
                    <span class="report-value">${reporte.descripcion || 'Sin descripción'}</span>
                  </div>
                  
                  <div class="report-info">
                    <span class="report-label">Nivel:</span>
                    <span class="report-value">
                      <span class="nivel-badge nivel-${reporte.nivelPercibido}">
                        ${reporte.nivelPercibido}
                      </span>
                    </span>
                  </div>
                  
                  <div class="report-info">
                    <span class="report-label">Ubicación:</span>
                    <span class="report-value">${JSON.stringify(reporte.ubicacion)}</span>
                  </div>
                  
                  <div class="report-info">
                    <span class="report-label">Fecha:</span>
                    <span class="report-value">${new Date(reporte.fechas.creado).toLocaleDateString('es-PE')}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <h2>No hay reportes aún</h2>
            <p>Los reportes aparecerán aquí cuando sean creados en el sistema</p>
          </div>
        `}
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('❌ Error generando vista:', err);
    res.status(500).send('<h1>Error al generar la vista de reportes</h1>');
  }
};

// Obtener reportes agrupados por zona para el mapa (operador/admin)
exports.obtenerReportesParaMapa = async (req, res) => {
  try {
    const reportes = await Report.find({}).lean();

    // Agrupar reportes por zona (distrito)
    const zonasMap = {};

    reportes.forEach((reporte) => {
      const zona = reporte.ubicacion?.distrito || 'Sin zona';
      const lat = reporte.ubicacion?.coordenadas?.lat;
      const lng = reporte.ubicacion?.coordenadas?.lng;

      // Solo procesar reportes con coordenadas válidas
      if (!lat || !lng) return;

      const key = `${zona}`;

      if (!zonasMap[key]) {
        zonasMap[key] = {
          zona,
          departamento: reporte.ubicacion?.departamento || '',
          provincia: reporte.ubicacion?.provincia || '',
          coordenadas: { lat, lng },
          reportes: [],
          cantidad: 0,
          tiposIncidente: {},
          nivelRiesgo: 'bajo',
        };
      }

      zonasMap[key].reportes.push({
        id: reporte._id,
        tipoIncidente: reporte.tipoIncidente,
        estado: reporte.estado,
        nivelPercibido: reporte.nivelPercibido,
        comentario: reporte.descripcion || '',
      });

      // Contar tipos de incidente
      if (!zonasMap[key].tiposIncidente[reporte.tipoIncidente]) {
        zonasMap[key].tiposIncidente[reporte.tipoIncidente] = 0;
      }
      zonasMap[key].tiposIncidente[reporte.tipoIncidente]++;
    });

    // Calcular nivel de riesgo para cada zona
    const zonas = Object.values(zonasMap).map((zona) => {
      zona.cantidad = zona.reportes.length;

      // Lógica para calcular nivel de riesgo
      // Factor 1: Cantidad de reportes
      let riesgoBase = 'bajo';
      if (zona.cantidad >= 5) {
        riesgoBase = 'alto';
      } else if (zona.cantidad >= 3) {
        riesgoBase = 'medio';
      }

      // Factor 2: Tipos de incidente (quema_ilegal es más crítico)
      const tieneQuemaIlegal = zona.tiposIncidente['quema_ilegal'] > 0;
      const cantidadQuemaIlegal = zona.tiposIncidente['quema_ilegal'] || 0;

      // Si hay quema ilegal y más de 1, es riesgo alto
      if (tieneQuemaIlegal && cantidadQuemaIlegal >= 2) {
        zona.nivelRiesgo = 'alto';
      } else if (tieneQuemaIlegal && riesgoBase === 'medio') {
        // Quema ilegal con riesgo medio lo sube a alto
        zona.nivelRiesgo = 'alto';
      } else if (tieneQuemaIlegal && riesgoBase === 'bajo' && zona.cantidad >= 2) {
        // Si hay quema ilegal y al menos 2 reportes, es riesgo medio
        zona.nivelRiesgo = 'medio';
      } else {
        zona.nivelRiesgo = riesgoBase;
      }

      // Limpiar array de reportes para respuesta (solo contar, no enviar todos)
      delete zona.reportes;

      return zona;
    });

    // Ordenar por nivel de riesgo (alto primero)
    const ordenes = { alto: 0, medio: 1, bajo: 2 };
    zonas.sort((a, b) => ordenes[a.nivelRiesgo] - ordenes[b.nivelRiesgo]);

    console.log(`📍 Zonas para mapa: ${zonas.length}`, {
      alto: zonas.filter(z => z.nivelRiesgo === 'alto').length,
      medio: zonas.filter(z => z.nivelRiesgo === 'medio').length,
      bajo: zonas.filter(z => z.nivelRiesgo === 'bajo').length,
      totalReportes: reportes.length,
    });

    res.status(200).json({
      success: true,
      total: zonas.length,
      totalReportes: reportes.length,
      zonas,
    });
  } catch (err) {
    console.error('❌ Error obteniendo reportes para mapa:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos para el mapa',
    });
  }
};

// Asignar reportes a un operador
exports.asignarReportes = async (req, res) => {
  try {
    const { operadorId, reportIds } = req.body;

    // Validar datos
    if (!operadorId || !reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar operadorId y un array de reportIds',
      });
    }

    console.log('📋 Asignando reportes:', {
      operadorId,
      reportCount: reportIds.length,
      reportIds: reportIds.slice(0, 3).concat(reportIds.length > 3 ? ['...'] : []),
    });

    // Validar que el operador existe
    const operador = await Usuario.findById(operadorId).select('nombre zona email rol');
    if (!operador || operador.rol !== 'operador') {
      return res.status(404).json({
        success: false,
        message: 'Operador no encontrado o no tiene rol de operador',
      });
    }

    console.log('✅ Operador encontrado:', {
      id: operador._id,
      nombre: operador.nombre,
      zona: operador.zona,
    });

    // Validar que los reportes existen
    const reportes = await Report.find({ _id: { $in: reportIds } });
    if (reportes.length !== reportIds.length) {
      return res.status(404).json({
        success: false,
        message: `Solo se encontraron ${reportes.length} de ${reportIds.length} reportes`,
      });
    }

    console.log('✅ Reportes encontrados:', reportes.length);

    // Crear registros en la colección Assign y actualizar reportes
    const assignmentPromises = reportes.map(async (reporte) => {
      // Crear registro en Assign
      const assignment = new Assign({
        reporte: {
          id: reporte._id,
          tipoIncidente: reporte.tipoIncidente,
          descripcion: reporte.descripcion,
          zona: reporte.ubicacion?.distrito || reporte.ubicacion?.provincia || 'Sin zona',
        },
        operador: {
          id: operador._id,
          nombre: operador.nombre,
          zona: operador.zona,
        },
        estado: 'asignado',
        fechaAsignacion: new Date(),
      });

      // Guardar en Assign
      await assignment.save();
      console.log(`📝 Asignación registrada: ${reporte._id} -> ${operador._id}`);

      // Actualizar el reporte con el operador asignado
      reporte.operadorAsignado = {
        id: operador._id,
        nombre: operador.nombre,
      };
      await reporte.save();
      console.log(`✏️ Reporte actualizado: ${reporte._id}`);

      return {
        reportId: reporte._id,
        success: true,
      };
    });

    const results = await Promise.all(assignmentPromises);

    const successCount = results.filter(r => r.success).length;

    console.log('✅ Asignación completada:', {
      totalAsignados: successCount,
      totalSolicitados: reportIds.length,
    });

    // Obtener el último estado del operador (contar reportes asignados)
    const reportesAsignados = await Report.countDocuments({
      'operadorAsignado.id': operadorId,
    });

    res.status(200).json({
      success: true,
      message: `✅ ${successCount} reportes asignados correctamente al operador`,
      data: {
        operadorId,
        operadorNombre: operador.nombre,
        reportesAsignados: successCount,
        totalReportesOperador: reportesAsignados,
      },
    });
  } catch (err) {
    console.error('❌ Error asignando reportes:', err);
    res.status(500).json({
      success: false,
      message: 'Error al asignar reportes',
      error: err.message,
    });
  }
};

// @desc    Desasignar un reporte de un operador
// @route   DELETE /api/reports/assign/:reportId
// @access  Private (admin/operador)
exports.desasignarReporte = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Validar que el reportId es válido
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de reporte inválido',
      });
    }

    console.log('🗑️ Desasignando reporte:', reportId);

    // Buscar el reporte
    const reporte = await Report.findById(reportId);
    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado',
      });
    }

    const operadorId = reporte.operadorAsignado?.id || reporte.operadorAsignado?._id;

    // Eliminar de la colección Assign
    const assign = await Assign.findOneAndDelete({
      'reporte.id': reportId,
    });

    if (assign) {
      console.log(`📝 Asignación eliminada de Assign: ${reportId}`);
    }

    // Limpiar operadorAsignado del reporte
    reporte.operadorAsignado = null;
    await reporte.save();

    console.log(`✏️ Reporte limpiado: ${reportId}`);

    res.status(200).json({
      success: true,
      message: '✅ Reporte desasignado correctamente',
      data: {
        reportId,
        operadorId,
      },
    });
  } catch (err) {
    console.error('❌ Error desasignando reporte:', err);
    res.status(500).json({
      success: false,
      message: 'Error al desasignar reporte',
      error: err.message,
    });
  }
};
