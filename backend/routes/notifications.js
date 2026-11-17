const express = require('express');
const { protect } = require('../middleware/auth');
const { getNotifications } = require('../controllers/notificationController');

const router = express.Router();

// Every route in this file needs a valid token
router.use(protect);

// GET /api/notifications -> list the user's current notifications
router.get('/', getNotifications);

module.exports = router;