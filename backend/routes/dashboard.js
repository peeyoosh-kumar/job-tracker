const express = require('express');
const { protect } = require('../middleware/tempAuth');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard  -> summary statistics (login required)
router.get('/', protect, getDashboard);

module.exports = router;