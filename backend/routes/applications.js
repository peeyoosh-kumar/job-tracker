const express = require('express');
const { protect } = require('../middleware/tempAuth');
const upload = require('../middleware/upload');
const {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  uploadResume
} = require('../controllers/applicationController');

const router = express.Router();

// Every route in this file needs a valid token (the login check)
router.use(protect);

// GET /api/applications    -> list the user's applications
// POST /api/applications   -> add a new application
router.route('/').get(getApplications).post(createApplication);

// PUT /api/applications/:id     -> update an application
// DELETE /api/applications/:id  -> delete an application
router.route('/:id').put(updateApplication).delete(deleteApplication);

// POST /api/applications/:id/resume  -> upload a resume file
// upload.single('resume') means: expect ONE file, sent under the field name "resume"
router.post('/:id/resume', upload.single('resume'), uploadResume);

module.exports = router;