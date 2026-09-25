// backend/middleware/rateLimiter.js
// Security layer: rate limiting.
//   loginLimiter -> strict, just for the login route (slows down password guessing)
//   apiLimiter   -> looser, for every /api route (general abuse protection)

const rateLimit = require('express-rate-limit');
const { logger } = require('./logger');

// Runs whenever either limiter blocks a request. Logs it, then sends the
// exact message Yogesh's frontend expects.
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit hit', { ip: req.ip, path: req.originalUrl });
  res.status(429).json({ message: 'Too many requests, try again later' });
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per IP per window (v8 uses "limit", not "max")
  standardHeaders: true, // sends standard RateLimit-* headers
  legacyHeaders: false, // skips the old, non-standard X-RateLimit-* headers
  handler: rateLimitHandler,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { loginLimiter, apiLimiter };