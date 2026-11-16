const cron = require('node-cron');
const Application = require('../models/Application');
require('../models/User'); // registers the User model so populate('user') works
const { sendMail } = require('../utils/mailer');

const DAY_MS = 24 * 60 * 60 * 1000;
const FINISHED_STATUSES = ['Offer', 'Rejected'];
const REMIND_WITHIN_DAYS = 2; // today, tomorrow and the day after

let running = false; // stops two runs from overlapping

function startOfToday(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayText(daysLeft) {
  if (daysLeft <= 0) return 'today';
  if (daysLeft === 1) return 'tomorrow';
  return 'in ' + daysLeft + ' days';
}

function buildEmailText(name, apps, today) {
  const lines = apps.map((app) => {
    const daysLeft = Math.floor((new Date(app.deadline) - today) / DAY_MS);
    return '- ' + app.role + ' at ' + app.company + ': deadline ' +
      dayText(daysLeft) + ' (' + new Date(app.deadline).toDateString() + ')';
  });
  return (
    'Hi ' + name + ',\n\n' +
    'These application deadlines are coming up:\n\n' +
    lines.join('\n') +
    '\n\nGood luck!\nJob Tracker\n'
  );
}

// Finds applications with a deadline in the next 2 days that have not been
// reminded today, sends ONE email per user, then records lastReminderSent.
async function runReminderJob(now = new Date()) {
  const today = startOfToday(now);
  const end = new Date(today.getTime() + (REMIND_WITHIN_DAYS + 1) * DAY_MS);

  const applications = await Application.find({
    status: { $nin: FINISHED_STATUSES },
    deadline: { $gte: today, $lt: end },
    $or: [
      { lastReminderSent: { $exists: false } },
      { lastReminderSent: null },
      { lastReminderSent: { $lt: today } }
    ]
  }).populate('user', 'name email');

  // Group by user so each user gets a single email
  const byUser = new Map();
  for (const app of applications) {
    if (!app.user || !app.user.email) continue;
    const key = String(app.user._id);
    if (!byUser.has(key)) byUser.set(key, { user: app.user, apps: [] });
    byUser.get(key).apps.push(app);
  }

  let sent = 0;
  let failed = 0;
  const previews = [];

  for (const { user, apps } of byUser.values()) {
    try {
      const result = await sendMail({
        to: user.email,
        subject: 'Job Tracker: ' + apps.length + ' deadline(s) coming up',
        text: buildEmailText(user.name, apps, today)
      });
      await Application.updateMany(
        { _id: { $in: apps.map((a) => a._id) } },
        { $set: { lastReminderSent: now } },
        { timestamps: false }
      );
      sent++;
      if (result.previewUrl) previews.push(result.previewUrl);
    } catch (err) {
      failed++;
      console.error('Reminder email failed:', err.message);
    }
  }

  return { users: byUser.size, sent, failed, previews };
}

async function safeRun(label) {
  if (running) return;
  running = true;
  try {
    const r = await runReminderJob();
    console.log('Reminder job (' + label + '): users=' + r.users + ', sent=' + r.sent + ', failed=' + r.failed);
  } catch (err) {
    console.error('Reminder job failed:', err.message);
  } finally {
    running = false;
  }
}

// Starts only if email is configured. Daily at 09:00 India time, and once now.
function startReminderJob() {
  if (!process.env.EMAIL_USER) {
    console.log('Reminder job not started (EMAIL_USER is not set)');
    return;
  }
  cron.schedule('0 9 * * *', () => safeRun('scheduled'), { timezone: 'Asia/Kolkata' });
  console.log('Reminder job scheduled: daily at 09:00 Asia/Kolkata');
  safeRun('startup');
}

module.exports = { runReminderJob, startReminderJob };