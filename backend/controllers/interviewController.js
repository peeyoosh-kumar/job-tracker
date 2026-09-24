const mongoose = require('mongoose');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// Only these fields can be set from the request body.
// "application" is NOT in this list - it always comes from the URL (and is checked),
// so a user cannot attach an interview to someone else's application.
const ALLOWED_FIELDS = ['round', 'date', 'mode', 'interviewerName', 'feedback', 'outcome'];

const pickAllowed = (body) => {
  const data = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  return data;
};

// Bad input (wrong mode, bad date) gives 400.
// Anything unexpected gives 500 and is printed in the server window.
const handleError = (error, res) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Server error' });
};

// Finds the application ONLY if it belongs to the logged-in user.
// Returns null if the id is not a valid ObjectId, does not exist, or belongs to someone else.
const findOwnApplication = async (appId, userId) => {
  if (!mongoose.isValidObjectId(appId)) return null;
  return Application.findOne({ _id: appId, user: userId });
};

// GET /api/interviews/:appId  -> all interviews of one application, earliest first
exports.getInterviews = async (req, res) => {
  try {
    const application = await findOwnApplication(req.params.appId, req.user._id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const interviews = await Interview.find({ application: application._id }).sort({ date: 1 });
    res.json(interviews);
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/interviews/:appId  -> add interview details to one application
exports.addInterview = async (req, res) => {
  try {
    const application = await findOwnApplication(req.params.appId, req.user._id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const interview = await Interview.create({
      ...pickAllowed(req.body),
      application: application._id   // comes from the checked application, never from the request body
    });
    res.status(201).json(interview);
  } catch (error) {
    handleError(error, res);
  }
};