// backend/routes/admin.js
// Security layer: admin-only audit endpoints.
//   GET /api/admin/logs   -> the security log, newest first
//   GET /api/admin/events -> suspicious patterns spotted in the log
// Peeyoosh mounts this with: app.use('/api/admin', require('./routes/admin'));

const express = require('express');
const fs = require('fs');
const path = require('path');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

const LOG_PATH = path.join(__dirname, '..', 'logs', 'security.log');

// Turns security.log into an array of parsed objects, newest last (file order).
// A line that isn't valid JSON is skipped rather than crashing the route.
function readLogEntries() {
  if (!fs.existsSync(LOG_PATH)) return [];
  const raw = fs.readFileSync(LOG_PATH, 'utf8');
  return raw
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((entry) => entry !== null);
}

// GET /api/admin/logs?limit=200
// Returns the most recent log entries, newest first. Capped so a huge log
// file, months from now, can't slow down the request.
router.get('/logs', protect, adminOnly, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);
  const entries = readLogEntries().reverse().slice(0, limit);
  res.json({ count: entries.length, logs: entries });
});

// GET /api/admin/events
// Flags an IP address that triggered the same kind of warning 3+ times.
// Covers repeated failed logins, repeated invalid/expired tokens, repeated
// denied admin attempts, and repeated rate-limit hits, from one source.
const SUSPICIOUS_MESSAGES = [
  'Failed login',
  'Invalid or expired token',
  'Admin access denied',
  'Rate limit hit',
];
const THRESHOLD = 3;

router.get('/events', protect, adminOnly, (req, res) => {
  const entries = readLogEntries();
  const counts = {}; // counts[ip][message] = how many times

  entries.forEach((entry) => {
    if (!entry.ip || !SUSPICIOUS_MESSAGES.includes(entry.message)) return;
    counts[entry.ip] = counts[entry.ip] || {};
    counts[entry.ip][entry.message] = (counts[entry.ip][entry.message] || 0) + 1;
  });

  const events = [];
  Object.entries(counts).forEach(([ip, byMessage]) => {
    Object.entries(byMessage).forEach(([message, count]) => {
      if (count >= THRESHOLD) {
        events.push({
          ip,
          type: message,
          count,
          severity: count >= THRESHOLD * 2 ? 'high' : 'medium',
        });
      }
    });
  });

  events.sort((a, b) => b.count - a.count); // most suspicious first
  res.json({ count: events.length, events });
});

module.exports = router;