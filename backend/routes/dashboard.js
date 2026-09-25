const express = require('express');
const { protect } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard  -> summary statistics (login required)
router.get('/', protect, getDashboard);

module.exports = router;