const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,   // links this interview to a specific Application
    ref: 'Application',
    required: true
  },
  round: {
    type: String,
    trim: true            // e.g. "Technical Round 1", "HR Round"
  },
  date: {
    type: Date
  },
  mode: {
    type: String,
    enum: ['Online', 'In-person', 'Phone'],
    default: 'Online'
  },
  interviewerName: {
    type: String,
    trim: true
  },
  feedback: {
    type: String,
    trim: true
  },
  outcome: {
    type: String,
    enum: ['Pending', 'Passed', 'Failed'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);