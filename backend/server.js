require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimiter');
const { logger } = require('./middleware/logger'); // NEW: lets this file write to security.log

const app = express();

// Trust the first proxy in front of the app (needed on hosting platforms),
// so req.ip and the rate limiters use the real visitor address
app.set('trust proxy', 1);

// Security headers (Helmet). Cross-Origin-Resource-Policy is "same-site" so the
// frontend on another port (Vite) can still load files such as resumes from this API
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

// Middleware: runs on every request before it reaches a route
app.use(cors());           // allows the frontend (different port) to call this API
app.use(express.json());   // lets the server read JSON data sent in requests
app.use(morgan('dev'));    // logs each request to the console (method, path, status, time)

// General limit: 100 requests per IP per 15 minutes on every /api route
app.use('/api', apiLimiter);

// A simple test route to confirm the server is alive
app.get('/', (req, res) => {
  res.json({ message: 'Job Tracker API is running' });
});

// Auth routes: register and login
app.use('/api/auth', require('./routes/auth'));

// Applications routes: list, add, edit, delete (login required)
app.use('/api/applications', require('./routes/applications'));

// Interviews routes: list and add interview details (login required)
app.use('/api/interviews', require('./routes/interviews'));

// Dashboard route: summary statistics (login required)
app.use('/api/dashboard', require('./routes/dashboard'));

// Admin routes: security/audit logs and suspicious activity (admin only)
app.use('/api/admin', require('./routes/admin'));

// Unknown URL: reply with JSON instead of Express's default HTML page
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// General error handler: catches errors that no route handled.
// Express knows it is an error handler because it has FOUR parameters.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  console.error(err);
  // NEW: also record it in security.log (message, path and IP only, never the request body)
  logger.error('Server error', { error: err.message, path: req.originalUrl, ip: req.ip });
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});