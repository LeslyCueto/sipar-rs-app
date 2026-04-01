const Report = require('../models/Report');
const Usuario = require('../models/Usuario');

// Crear un nuevo reporte
exports.crearReporte = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Del middleware de autenticación

    const {
      anonimo,
      tipoIncidente,
      descripcion,
      imagen,
      ubicacion,
      nivelPercibido,
    } = req.body;

    // Validar datos requeridos
    if (!tipoIncidente || !imagen || !ubicacion || !nivelPercibido) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
    }

    const usuario = await Usuario.findById(usuarioId).select('nombre email');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const nuevoReporte = new Report({
      usuario: {
        id: usuarioId,
        nombre: anonimo ? 'Anónimo' : usuario.nombre,
        email: anonimo ? 'anonimo@sirpar.pe' : usuario.email,
      },
      anonimo,
      tipoIncidente,
      descripcion: descripcion || '',
      imagen,
      ubicacion,
      nivelPercibido,
      estado: 'pendiente',
      fechas: {
        creado: new Date(),
      },
    });

    await nuevoReporte.save();

    res.status(201).json({
      success: true,
      message: '✓ Reporte creado correctamente',
      reporte: nuevoReporte,
    });
  } catch (err) {
    console.error('❌ Error creando reporte:', err);
    res.status(500).json({
      success: false,
      message: 'Error al crear el reporte',
    });
  }
};

// Obtener reportes del usuario autenticado
exports.obtenerMisReportes = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const reportes = await Report.find({
      'usuario.id': usuarioId,
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

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipoIncidente = tipo;

    const reportes = await Report.find(filtros).sort({ 'fechas.creado': -1 });

    res.status(200).json({
      success: true,
      total: reportes.length,
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
