const { getNotificationsForUser } = require('../services/notificationService');

// GET /api/notifications -> the logged-in user's own notifications
const getNotifications = async (req, res) => {
  try {
    const result = await getNotificationsForUser(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('getNotifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications };