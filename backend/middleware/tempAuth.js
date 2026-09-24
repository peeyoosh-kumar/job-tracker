const jwt = require('jsonwebtoken');
const User = require('../models/User');

// TEMPORARY version of "protect" so we can build and test the applications routes.
// Ankush's middleware/auth.js will replace it later.
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // The token must arrive as:  Authorization: Bearer <token>
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = header.split(' ')[1];

    // Checks the signature and expiry. Throws an error if the token is fake or expired.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // The token only holds the user's id, so we load the user from the database.
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;   // routes after this can now use req.user
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = { protect };