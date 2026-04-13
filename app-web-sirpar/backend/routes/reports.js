const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  crearReporte,
  obtenerMisReportes,
  obtenerReporte,
  actualizarEstadoReporte,
  obtenerTodosReportes,
  obtenerVistaReportes,
  obtenerReportesParaMapa,
  asignarReportes,
  desasignarReporte,
  obtenerReportesAsignados,
  obtenerReportesDisponibles,
} = require('../controllers/reportController');

// Ruta pública para ver la vista HTML de reportes
router.get('/vista', obtenerVistaReportes);

// Crear reporte (ciudadano)
router.post('/', verificarToken, crearReporte);

// Obtener mis reportes (ciudadano)
router.get('/', verificarToken, obtenerMisReportes);

// Obtener reportes para mapa (operador/admin)
router.get('/admin/mapa', verificarToken, obtenerReportesParaMapa);

// Obtener reportes disponibles (sin asignar) en una zona específica
router.get('/admin/disponibles', verificarToken, obtenerReportesDisponibles);

// Obtener reportes asignados a un operador específico
router.get('/admin/asignados/:operadorId', verificarToken, obtenerReportesAsignados);

// Obtener un reporte específico (ciudadano)
router.get('/:id', verificarToken, obtenerReporte);

// Actualizar estado del reporte (operador/admin)
router.patch('/:id', verificarToken, actualizarEstadoReporte);

// Obtener todos los reportes (operador/admin)
router.get('/admin/todos', verificarToken, obtenerTodosReportes);

// Asignar reportes a un operador (admin)
router.post('/assign', verificarToken, asignarReportes);

// Desasignar un reporte de un operador (admin/operador)
router.delete('/assign/:reportId', verificarToken, desasignarReporte);

module.exports = router;
