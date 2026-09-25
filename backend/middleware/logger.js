// backend/middleware/logger.js
// Security layer: structured logging.
// Writes one JSON line per event, with a timestamp, to backend/logs/security.log
// and also prints a readable line to the console.
//
// Usage (from Peeyoosh's code):
//   const { logger } = require('../middleware/logger');
//   logger.warn('Failed login', { email, ip: req.ip });
//   logger.info('Successful login', { userId, ip: req.ip });

const fs = require('fs');
const path = require('path');
const winston = require('winston');

// Make sure backend/logs exists, even on a fresh clone where the empty
// folder isn't tracked by Git. Without this, the very first log call
// would crash with a "no such file or directory" error.
const logsDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: 'info', // records 'info', 'warn' and 'error'; skips noisy 'debug' messages
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // The permanent record: one JSON object per line, e.g.
    // {"level":"warn","message":"Failed login","email":"...","ip":"...","timestamp":"..."}
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
    }),
    // A human-readable copy in the terminal while the server is running
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const extra = Object.keys(meta).length
            ? ' ' + JSON.stringify(meta)
            : '';
          return `[${timestamp}] ${level.toUpperCase()}: ${message}${extra}`;
        })
      ),
    }),
  ],
});

module.exports = { logger };