const mongoose = require('mongoose');
const Application = require('../models/Application');

// Only these fields can be set from the request body.
// This stops a user from sending extra fields (like "user") to change the owner.
const ALLOWED_FIELDS = ['company', 'role', 'status', 'appliedDate', 'deadline', 'notes'];

const pickAllowed = (body) => {
  const data = {};
  ALLOWED_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  return data;
};

// Bad input (missing company, wrong status, bad date) gives 400.
// Anything unexpected gives 500 and is printed in the server window.
const handleError = (error, res) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: 'Server error' });
};

// GET /api/applications  -> all applications of the logged-in user, newest first
exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/applications  -> add a new application
exports.createApplication = async (req, res) => {
  try {
    const application = await Application.create({
      ...pickAllowed(req.body),
      user: req.user._id   // the owner always comes from the token, never from the request body
    });
    res.status(201).json(application);
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/applications/:id  -> update status/details
exports.updateApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Searching by BOTH id and user means you can only edit your own applications
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      pickAllowed(req.body),
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    handleError(error, res);
  }
};

// DELETE /api/applications/:id  -> delete an application
exports.deleteApplication = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({ message: 'Application deleted' });
  } catch (error) {
    handleError(error, res);
  }
};
