require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

// Middleware: runs on every request before it reaches a route
app.use(cors());           // allows the frontend (different port) to call this API
app.use(express.json());   // lets the server read JSON data sent in requests
app.use(morgan('dev'));    // logs each request to the console (method, path, status, time)

// A simple test route to confirm the server is alive
app.get('/', (req, res) => {
  res.json({ message: 'Job Tracker API is running' });
});

// Auth routes: register and login
app.use('/api/auth', require('./routes/auth'));

// Applications routes: list, add, edit, delete (login required)
app.use('/api/applications', require('./routes/applications'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
