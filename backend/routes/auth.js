const express = require('express');
const { register, login } = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation } = require('../middleware/validators');

const router = express.Router();

// POST /api/auth/register  -> checks the input, then creates a new account
router.post('/register', registerValidation, register);

// POST /api/auth/login  -> rate limit, check the input, then return a JWT
router.post('/login', loginLimiter, loginValidation, login);

module.exports = router;