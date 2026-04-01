const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  crearReporte,
  obtenerMisReportes,
  obtenerReporte,
  actualizarEstadoReporte,
  obtenerTodosReportes,
} = require('../controllers/reportController');

// Crear reporte (ciudadano)
router.post('/', verificarToken, crearReporte);

// Obtener mis reportes (ciudadano)
router.get('/', verificarToken, obtenerMisReportes);

// Obtener un reporte específico (ciudadano)
router.get('/:id', verificarToken, obtenerReporte);

// Actualizar estado del reporte (operador/admin)
router.patch('/:id', verificarToken, actualizarEstadoReporte);

// Obtener todos los reportes (operador/admin)
router.get('/admin/todos', verificarToken, obtenerTodosReportes);

module.exports = router;
