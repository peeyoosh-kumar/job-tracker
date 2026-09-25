// backend/middleware/auth.js
// Security layer: JWT protection.
//   protect   -> lets only logged-in users through (checks the token)
//   adminOnly -> lets only admins through (always use it AFTER protect)
//
// Messages below match Peeyoosh's middleware/tempAuth.js exactly, so
// swapping this file in changes nothing else (routes, frontend, etc.)

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // Step 1: read the header "Authorization: Bearer <token>"
    const header = req.headers.authorization;
    const token =
      header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Step 2: verify the token was signed with our JWT_SECRET and has not expired.
    // jwt.verify throws for a fake, altered, or expired token.
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // only accept the algorithm our login uses
      });
    } catch (err) {
      // TODO (after logger.js exists): logger.warn('Invalid or expired token', { ip: req.ip });
      return res
        .status(401)
        .json({ message: 'Not authorized, invalid or expired token' });
    }

    // Step 3: the token only holds { id }, so load the user from the database.
    // '-password' means "do not include the password hash".
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Not authorized, user not found' });
    }

    // Step 4: attach the user (a Mongoose document, so req.user._id and
    // req.user.role both work) and let the request continue.
    req.user = user;
    next();
  } catch (error) {
    // Unexpected problem (for example the database is down), not the user's fault
    console.error('protect middleware error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

const adminOnly = (req, res, next) => {
  // req.user is set by protect, so protect must run first
  if (!req.user || req.user.role !== 'admin') {
    // TODO (after logger.js exists): logger.warn('Admin access denied', { userId: req.user?._id, ip: req.ip });
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, adminOnly };
