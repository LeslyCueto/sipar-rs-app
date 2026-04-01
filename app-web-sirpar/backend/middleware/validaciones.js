const { body, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      mensaje: 'Errores de validación',
      errores: errors.array().map((err) => ({
        campo: err.param,
        mensaje: err.msg,
      })),
    });
  }
  next();
};

// Validaciones para registro
exports.validarRegistro = [
  body('nombreCompleto')
    .trim()
    .notEmpty().withMessage('El nombre completo es requerido')
    .isLength({ min: 3 }).withMessage('El nombre debe tener mínimo 3 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido'),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 12 }).withMessage('La contraseña debe tener mínimo 12 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('La contraseña debe contener al menos un símbolo especial'),

  body('dni')
    .optional({ checkFalsy: true })
    .matches(/^\d{8}$/).withMessage('El DNI debe tener exactamente 8 dígitos numéricos'),

  body('telefono')
    .trim()
    .notEmpty().withMessage('El teléfono es requerido')
    .matches(/^\d{9}$/).withMessage('El teléfono debe tener 9 dígitos (sin código de país)'),

  body('ubicacion')
    .trim()
    .notEmpty().withMessage('La zona/ubicación es requerida')
    .isLength({ min: 3 }).withMessage('La ubicación debe tener mínimo 3 caracteres'),

  handleValidationErrors,
];

// Validaciones para login
exports.validarLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido'),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),

  handleValidationErrors,
];
