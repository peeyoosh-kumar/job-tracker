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
  },
  // Phase 2: a record of every status the application has had, with the date of each change
  statusHistory: [
    {
      status: {
        type: String,
        enum: ['Applied', 'Interview Scheduled', 'Interviewed', 'Offer', 'Rejected']
      },
      changedAt: {
        type: Date,
        default: Date.now
      },
      _id: false
    }
  ],
  // Phase 2: the last time a deadline reminder email was sent for this application (stops duplicate emails)
  lastReminderSent: {
    type: Date
  }
}, { timestamps: true }); // automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Application', applicationSchema);