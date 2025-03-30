import mongoose from 'mongoose';

const rundeckExecutionSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true
  },
  executionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['running', 'succeeded', 'failed', 'aborted', 'unknown'],
    default: 'running'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  options: {
    type: Object
  },
  user: {
    type: String
  },
  projectName: {
    type: String
  },
  description: {
    type: String
  },
  result: {
    type: Object
  },
  logOutput: {
    type: String
  }
}, { timestamps: true });

const RundeckExecution = mongoose.model('RundeckExecution', rundeckExecutionSchema);

export default RundeckExecution;