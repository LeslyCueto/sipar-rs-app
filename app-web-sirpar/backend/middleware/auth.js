const jwt = require('jsonwebtoken');

// Middleware para verificar token
exports.proteger = async (req, res, next) => {
  try {
    let token;

    // Obtener token del header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar que exista token
    if (!token) {
      return res.status(401).json({
        success: false,
        mensaje: 'No autorizado para acceder a esta ruta',
      });
    }

    try {
      // Verificar token
      const decodificado = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: decodificado.id };
      req.usuarioId = decodificado.id;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        mensaje: 'Token inválido o expirado',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      mensaje: 'Error verificando autenticación',
    });
  }
};

// Alias para compatibilidad
exports.verificarToken = exports.proteger;
