const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    // Información personal (todos obligatorios excepto dni)
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
    },
    dni: {
      type: String,
      default: null,
      sparse: true,
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es requerido'],
      trim: true,
    },
    zona: {
      type: String,
      required: [true, 'La zona/ubicación es requerida'],
      trim: true,
    },

    // Autenticación
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: [true, 'Este email ya está registrado'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es requerida'],
      minlength: [6, 'La contraseña debe tener mínimo 6 caracteres'],
      select: false,
    },

    // Control de acceso
    rol: {
      type: String,
      enum: ['ciudadano', 'operador', 'admin'],
      default: 'ciudadano',
    },
    estado: {
      type: String,
      enum: ['activo', 'inactivo', 'suspendido'],
      default: 'activo',
    },

    // Recuperación de contraseña
    codigoRecuperacion: {
      type: String,
      default: null,
      select: false,
    },
    expiracionCodigo: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para compatibilidad con el frontend (mapear zona → ubicacion)
usuarioSchema.virtual('ubicacion').get(function() {
  return this.zona;
}).set(function(value) {
  this.zona = value;
});

// Middleware para encriptar contraseña antes de guardar
usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
usuarioSchema.methods.compararContraseña = async function (passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
