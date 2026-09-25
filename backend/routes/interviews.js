const express = require('express');
const { protect } = require('../middleware/auth');
const { getInterviews, addInterview } = require('../controllers/interviewController');

const router = express.Router();

// Every route in this file needs a valid token (the login check)
router.use(protect);

// GET /api/interviews/:appId   -> list interviews of one application
// POST /api/interviews/:appId  -> add an interview to that application
router.route('/:appId').get(getInterviews).post(addInterview);

module.exports = router;