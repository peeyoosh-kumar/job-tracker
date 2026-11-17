const Application = require('../models/Application');

const DAY_MS = 24 * 60 * 60 * 1000;
const FINISHED_STATUSES = ['Offer', 'Rejected'];
const SEVERITY_ORDER = { danger: 0, warning: 1, info: 2 };

function startOfToday(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function deadlineMessage(company, role, daysLeft) {
  const what = 'Deadline for ' + role + ' at ' + company;
  if (daysLeft < 0) {
    const n = Math.abs(daysLeft);
    return what + ' was ' + n + (n === 1 ? ' day' : ' days') + ' ago';
  }
  if (daysLeft === 0) return what + ' is today';
  if (daysLeft === 1) return what + ' is tomorrow';
  return what + ' is in ' + daysLeft + ' days';
}

// Pure function: takes a list of applications and "now", returns {count, items}.
// It does no database work, so it can be tested with fake data.
function buildNotifications(applications, now = new Date()) {
  const today = startOfToday(now);
  const items = [];

  for (const app of applications) {
    // Finished applications never produce notifications
    if (FINISHED_STATUSES.includes(app.status)) continue;

    // Rule 1: deadline within 3 days (warning) or already passed (danger)
    if (app.deadline) {
      const daysLeft = Math.floor((new Date(app.deadline) - today) / DAY_MS);
      if (daysLeft <= 3) {
        items.push({
          type: 'deadline',
          severity: daysLeft < 0 ? 'danger' : 'warning',
          applicationId: String(app._id),
          company: app.company,
          role: app.role,
          dueDate: app.deadline,
          daysLeft: daysLeft,
          message: deadlineMessage(app.company, app.role, daysLeft)
        });
      }
    }

    // Rule 2: still "Applied" more than 7 days after applying -> follow-up (info)
    if (app.status === 'Applied' && app.appliedDate) {
      const daysSince = Math.floor((now - new Date(app.appliedDate)) / DAY_MS);
      if (daysSince > 7) {
        items.push({
          type: 'followup',
          severity: 'info',
          applicationId: String(app._id),
          company: app.company,
          role: app.role,
          dueDate: app.appliedDate,
          daysLeft: null,
          message: 'Applied to ' + app.company + ' ' + daysSince + ' days ago. Consider following up.'
        });
      }
    }
  }

  // Most urgent first: danger, then warning, then info; then by days left
  items.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
  });

  return { count: items.length, items: items };
}

// Reads ONLY this user's applications, so user A can never see user B's items
async function getNotificationsForUser(userId) {
  const applications = await Application.find({
    user: userId,
    status: { $nin: FINISHED_STATUSES }
  }).lean();
  return buildNotifications(applications);
}

module.exports = { buildNotifications, getNotificationsForUser };