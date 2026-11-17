# Secure Internship & Job Application Tracker

A full-stack web app that helps students manage their internship and job applications: track application status, record interview details, store resumes, and see everything in one dashboard. It includes security features: secure authentication, input validation, rate limiting, secure file uploads, and security logging. Phase 2 adds deadline notifications, daily email reminders, a status history for each application, and success rates on the dashboard.

## Team

| Name | Role |
|---|---|
| Peeyoosh Kumar | Backend |
| Yogesh | Frontend |
| Ankush Jha | Security / Cybersecurity |

## Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Frontend:** React (Vite)
- **Auth:** JWT (JSON Web Token), passwords hashed with bcryptjs
- **Security:** express-validator, express-rate-limit, helmet, multer, Winston (security log), Morgan (request log)
- **Phase 2 additions:** node-cron (daily timer) and nodemailer (email sending)

## Project Structure

```
job-tracker/
├── backend/
│   ├── controllers/   request handlers (auth, applications, interviews, dashboard, notifications)
│   ├── middleware/    security layer (auth, validators, rate limiters, upload, logger)
│   ├── models/        User, Application, Interview
│   ├── routes/        API routes, including admin.js
│   ├── services/      notification rules and the daily reminder job
│   ├── utils/         mailer (sends plain-text emails)
│   ├── scripts/       runReminders.js (runs the reminder job by hand)
│   ├── uploads/       uploaded resumes (not tracked by Git)
│   ├── logs/          security.log (not tracked by Git)
│   ├── .env.example   template for the .env file (placeholders only)
│   └── server.js
├── frontend/          React app
└── README.md
```

## Backend Setup

1. Go into the backend folder:
   ```
   cd backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create your own `.env` file in `backend/` by copying the template `.env.example` and filling in your own values (never commit `.env`):
   ```
   copy .env.example .env
   ```
   Required values:
   ```
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=any_random_long_string
   ```
   Optional values:
   ```
   PORT=5000
   # Deployment only (set these in the hosting platform's settings, leave unset locally):
   # TRUST_PROXY=1
   # FRONTEND_URL=https://your-deployed-frontend-address
   ```
   Email reminders (the reminder job starts only if `EMAIL_USER` is set):
   ```
   EMAIL_HOST=smtp.ethereal.email
   EMAIL_PORT=587
   EMAIL_USER=your_smtp_username
   EMAIL_PASS=your_smtp_password
   # EMAIL_FROM=Job Tracker <you@example.com>   (optional)
   ```
4. Run the server (restarts automatically when a file changes):
   ```
   npm run dev
   ```
   Wait for these lines: `Server running on port 5000` and `MongoDB connected successfully`. If `EMAIL_USER` is set you will also see `Reminder job scheduled: daily at 09:00 Asia/Kolkata`.
5. Visit `http://localhost:5000` - you should see "Job Tracker API is running".

## Frontend Setup

1. Go into the frontend folder:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Run the dev server, then open `http://localhost:5173`:
   ```
   npm run dev
   ```

The frontend expects the backend to be running on `http://localhost:5000`.

## API Contract

All responses are JSON. Protected routes require the header `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose | Owner |
|---|---|---|---|
| POST | /api/auth/register | Create account | Backend + Security |
| POST | /api/auth/login | Login, returns JWT and the user (including `role`) | Backend + Security |
| GET | /api/applications | List the logged-in user's applications (each has `statusHistory`) | Backend |
| POST | /api/applications | Add a new application | Backend |
| PUT | /api/applications/:id | Update an application (any fields, all optional) | Backend |
| DELETE | /api/applications/:id | Delete an application, its interviews and its resume file | Backend |
| POST | /api/applications/:id/resume | Upload a resume (field name `resume`) | Backend + Security validates file |
| GET | /api/applications/:id/resume | Download your own resume | Backend |
| GET | /api/interviews/:appId | Get interview details | Backend |
| POST | /api/interviews/:appId | Add interview details | Backend |
| GET | /api/dashboard | Summary counts, plus `responseRate`, `interviewRate` and `offerRate` | Backend |
| GET | /api/notifications | Deadline and follow-up alerts for the logged-in user | Backend |
| GET | /api/admin/logs | Security/audit log list (admin only) | Security |
| GET | /api/admin/events | Suspicious activity (admin only); optional `?hours=N`, default 24, maximum 720 | Security |

**Rule:** nobody changes an endpoint name or shape without telling the other two team members.

### Notifications

`GET /api/notifications` returns only the logged-in user's alerts:

```
{ "count": 1, "items": [
  { "type": "deadline", "severity": "warning", "applicationId": "...",
    "company": "ABC", "role": "Intern", "dueDate": "2026-11-18",
    "daysLeft": 2, "message": "Deadline in 2 days: Intern at ABC" } ] }
```

- `type` is `deadline` or `followup`.
- `severity` is `danger` (deadline already passed), `warning` (deadline coming up) or `info` (follow-up).
- `daysLeft` is `null` for follow-ups. `dueDate` is a date, not a time.
- Applications with status Offer or Rejected are skipped.
- A follow-up alert appears for an application that has been in status Applied for more than 7 days.

### Status history and dashboard rates

- Every application has `statusHistory`, a list of `{ status, changedAt }`. The first status is saved when the application is created, and a new entry is added only when the status really changes. Older applications may have an empty list.
- The dashboard rates are whole percentages (0 when there are no applications). Response rate = status is not Applied. Interview rate = Interview Scheduled, Interviewed or Offer. Offer rate = Offer. Each is divided by the total number of applications.

## Email Reminders

- The reminder job finds applications that are not Offer or Rejected and have a deadline from today up to 2 days ahead. It sends one plain-text email per user and then records `lastReminderSent`, so the same application is not reminded twice on the same day.
- It runs every day at 09:00 (timezone Asia/Kolkata) and once when the server starts. It starts only if `EMAIL_USER` is set in `.env`.
- To run it by hand (from the `backend` folder):
  ```
  node scripts/runReminders.js
  ```
  The script prints the number of users, emails sent and failed, and a Preview link when a test inbox is used.
- Events "Reminder email sent" and "Reminder job failed" are written to `security.log`. Email addresses and passwords are never logged.
- For testing, create a free fake inbox at https://ethereal.email and put its SMTP details in `.env`. Emails are not delivered to a real inbox; you open the Preview link instead. Using a real mail account only needs different `.env` values (not tested yet).

## Security Features

- **Passwords:** hashed with bcryptjs before saving; login errors never say whether the email exists.
- **JWT:** every protected route verifies the token and loads the user from the database; the role always comes from the database, never from the token.
- **Ownership:** users can only read, change, delete or download their own applications, interviews, resumes and notifications.
- **Input validation:** register, login, create application and update application are validated; bad input gets `400` with `{ message: "Validation failed", errors: [...] }`.
- **Rate limits:** 5 failed login attempts per IP per 15 minutes (successful logins are not counted); 100 API requests per IP per 15 minutes. Blocked requests get `429`.
- **Security headers:** Helmet sets headers such as `X-Content-Type-Options` and `X-Frame-Options` and hides `X-Powered-By`; Cross-Origin-Resource-Policy is `same-site` so the frontend on another port can load files from the API.
- **Resume uploads:** PDF, DOC and DOCX only, 5 MB maximum, the file's real content is checked (not just its extension), and it is saved under a random name.
- **Email:** plain text only (no user text inside HTML); the mail password is read from `.env` and never printed.
- **Logging:** security events (failed logins, invalid tokens, denied admin access, rejected uploads, rate-limit hits, server errors, reminder emails sent or failed) are written to `backend/logs/security.log`. Admins can read them through `/api/admin/logs` and `/api/admin/events`.

## Known Limits

- `security.log` has no size limit or rotation yet.
- CORS allows only the frontend addresses `http://localhost:5173` and `http://127.0.0.1:5173`, plus one deployed address if `FRONTEND_URL` is set in `.env`.
- Admin accounts cannot be created through the API. An admin's `role` is set directly in the database.
- The daily reminder is a timer inside the server, so it only runs while the server is running. It also runs once at startup, and can be run by hand.
- There is no "interview within 48 hours" notification, because an application has no interview date of its own.
- Browser pop-up notifications while the tab is closed (web push) need a deployed HTTPS site, so they are future work.
- Reminder emails were tested with Ethereal (a fake inbox), not with a real mail account.

## Notes

- Never commit `.env`: it holds secrets and is listed in `.gitignore`. Anyone who has seen it should change the database password and `JWT_SECRET`.
- Security middleware lives in `backend/middleware/` as separate files that plug into the Express routes.