const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Application = require('../models/Application');
const Interview = require('../models/Interview'); // NEW: needed to delete an application's interviews

// Only these fields can be set from the request body.
// This stops a user from sending extra fields (like "user") to change the owner.
const ALLOWED_FIELDS = ['company', 'role', 'status', 'appliedDate', 'deadline', 'notes'];

// Resume file names we create look like 32 hex characters + .pdf/.doc/.docx
// (moved to the top because both download and delete use them)
const SAFE_RESUME_NAME = /^[a-f0-9]{32}\.(pdf|docx|doc)$/;
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

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

    // The validator treats an empty status or appliedDate as "not sent",
    // so remove them here. Otherwise they would be written to the database.
    const updates = pickAllowed(req.body);
    if (!updates.status) delete updates.status;
    if (!updates.appliedDate) delete updates.appliedDate;

    // Searching by BOTH id and user means you can only edit your own applications
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
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

    // NEW: clean up what belonged to this application.
    // 1) Its interviews
    await Interview.deleteMany({ application: application._id });

    // 2) Its resume file, only if the name is one of our own random names.
    // A missing file or any file error must not stop the delete from succeeding.
    if (application.resumeFileName && SAFE_RESUME_NAME.test(application.resumeFileName)) {
      try {
        await fs.promises.unlink(path.join(UPLOADS_DIR, application.resumeFileName));
      } catch (fileError) {
        if (fileError.code !== 'ENOENT') console.error('Could not delete resume file:', fileError.message);
      }
    }

    res.json({ message: 'Application deleted' });
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/applications/:id/resume  -> upload a resume file for one application
exports.uploadResume = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { resumeFileName: req.file.filename },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.json({ message: 'Resume uploaded successfully', application });
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/applications/:id/resume  -> download the resume of one application
exports.downloadResume = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Searching by BOTH id and user means you can only download your own resume
    const application = await Application.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('resumeFileName');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    if (!application.resumeFileName) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // The file name comes from the database only. This check refuses anything
    // that is not one of our own random names (for example one containing "..").
    const fileName = application.resumeFileName;
    if (!SAFE_RESUME_NAME.test(fileName)) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const fullPath = path.join(UPLOADS_DIR, fileName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'private, no-store');
    res.download(fullPath, 'resume' + path.extname(fileName));
  } catch (error) {
    handleError(error, res);
  }
};