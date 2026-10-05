const express = require('express');
const { register, login } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/register  -> creates a new account
router.post('/register', register);

// POST /api/auth/login  -> checks the password and returns a JWT
router.post('/login', loginLimiter, login);

module.exports = router;