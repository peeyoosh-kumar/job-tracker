const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,   // links this application to a specific User
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Applied', 'Interview Scheduled', 'Interviewed', 'Offer', 'Rejected'],
    default: 'Applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  resumeFileName: {
    type: String   // will store the uploaded resume's filename once Ankush's upload feature is wired in
  }
}, { timestamps: true }); // automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Application', applicationSchema);