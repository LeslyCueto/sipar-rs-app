const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  usuario: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    nombre: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  anonimo: {
    type: Boolean,
    default: false,
  },
  tipoIncidente: {
    type: String,
    enum: ['quema_ilegal', 'acumulacion_residuos'],
    required: true,
  },
  descripcion: {
    type: String,
    default: '',
  },
  imagenes: [
    {
      url: {
        type: String, // Base64 o URL
        required: true,
      },
      nombre: String,
      tipo: {
        type: String,
        enum: ['capturada', 'cargada'],
      },
      fecha: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  ubicacion: {
    departamento: String,
    provincia: String,
    distrito: String,
    direccion: String,
    coordenadas: {
      lat: Number,
      lng: Number,
    },
    ubigeo: String,
  },
  nivelPercibido: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    required: true,
  },
  nivelCalculado: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    default: 'medio',
  },
  nivelFinal: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
  },
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'resuelto'],
    default: 'pendiente',
  },
  operadorAsignado: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    nombre: String,
  },
  fechas: {
    creado: {
      type: Date,
      default: Date.now,
    },
    enProceso: Date,
    resuelto: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
