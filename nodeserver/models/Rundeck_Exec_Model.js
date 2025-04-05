import mongoose from 'mongoose';

const rundeckExecutionSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['running', 'succeeded', 'failed', 'aborted', 'unknown'],
    default: 'unknown'
  },
  permalink: String,
  project: String,
  cambiochg: String,
  changeType: String, // Tipo de cambio (nivel superior)
  specificOptions: mongoose.Schema.Types.Mixed, // Para guardar opciones específicas (nivel superior)
  machines: mongoose.Schema.Types.Mixed, // Para guardar máquinas (nivel superior)
  options: {
    // Estructura completa de opciones
    changeType: String,
    specificOptions: mongoose.Schema.Types.Mixed,
    machines: mongoose.Schema.Types.Mixed,
    machinesList: [String], // Lista procesada de máquinas
    argString: String
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  cambiochg: {
    type: String,
    default: ''
  }
});

// Actualizar el timestamp cuando se modifica
rundeckExecutionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const RundeckExecution = mongoose.model('RundeckExecution', rundeckExecutionSchema);

export default RundeckExecution;