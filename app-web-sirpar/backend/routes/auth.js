const express = require('express');
const { registro, login, obtenerMi, obtenerTodos, actualizarPerfil, actualizarUsuarioAdmin, crearUsuarioAdmin, enviarCodigoRecuperacion, cambiarContrasena } = require('../controllers/authController');
const { proteger } = require('../middleware/auth');
const { validarRegistro, validarLogin } = require('../middleware/validaciones');

const router = express.Router();

// Rutas públicas
router.post('/registro', validarRegistro, registro);
router.post('/login', validarLogin, login);
router.get('/usuarios', obtenerTodos); // DEBUG: Ver todos los usuarios

// Rutas privadas
router.get('/me', proteger, obtenerMi);
router.put('/actualizar-perfil', proteger, actualizarPerfil);
router.post('/usuarios', proteger, crearUsuarioAdmin); // Crear nuevo usuario/operador desde admin
router.put('/usuarios/:id', proteger, actualizarUsuarioAdmin);
router.post('/enviar-codigo-recuperacion', proteger, enviarCodigoRecuperacion);
router.post('/cambiar-contrasena', proteger, cambiarContrasena);

module.exports = router;
