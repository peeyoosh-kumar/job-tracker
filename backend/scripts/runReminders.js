const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { runReminderJob } = require('../services/reminderJob');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const r = await runReminderJob();
    console.log('Users with reminders:', r.users);
    console.log('Emails sent:', r.sent);
    console.log('Emails failed:', r.failed);
    r.previews.forEach((p) => console.log('Preview:', p));
  } catch (err) {
    console.error('Run failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();