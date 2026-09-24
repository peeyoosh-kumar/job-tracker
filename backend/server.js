require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware: runs on every request before it reaches a route
app.use(cors());           // allows the frontend (different port) to call this API
app.use(express.json());   // lets the server read JSON data sent in requests
app.use(morgan('dev'));    // logs each request to the console (method, path, status, time)

// A simple test route to confirm the server is alive
app.get('/', (req, res) => {
  res.json({ message: 'Job Tracker API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});