const mongoose = require('mongoose');

const AssignSchema = new mongoose.Schema({
  reporte: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    tipoIncidente: String,
    descripcion: String,
    zona: String,
  },
  operador: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    nombre: String,
    zona: String,
  },
  estado: {
    type: String,
    enum: ['asignado', 'en_revision', 'completado'],
    default: 'asignado',
  },
  fechaAsignacion: {
    type: Date,
    default: Date.now,
  },
  fechaCompletado: Date,
  notas: String,
}, { timestamps: true });

module.exports = mongoose.model('Assign', AssignSchema);
