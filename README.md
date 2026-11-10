# Secure Internship & Job Application Tracker

A full-stack web app that helps students manage their internship and job applications: track application status, record interview details, store resumes, and see everything in one dashboard. It includes security features: secure authentication, input validation, rate limiting, secure file uploads, and security logging.

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
- **Security:** express-validator, express-rate-limit, multer, Winston (security log), Morgan (request log)

## Project Structure

```
job-tracker/
├── backend/
│   ├── controllers/   request handlers (auth, applications, interviews, dashboard)
│   ├── middleware/    security layer (auth, validators, rate limiters, upload, logger)
│   ├── models/        User, Application, Interview
│   ├── routes/        API routes, including admin.js
│   ├── uploads/       uploaded resumes (not tracked by Git)
│   ├── logs/          security.log (not tracked by Git)
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
3. Create a `.env` file in `backend/` (never commit this file):
   ```
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=any_random_long_string
   ```
4. Run the server (restarts automatically when a file changes):
   ```
   npm run dev
   ```
   Wait for both lines: `Server running on port 5000` and `MongoDB connected successfully`.
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
| POST | /api/auth/login | Login, returns JWT | Backend + Security |
| GET | /api/applications | List the logged-in user's applications | Backend |
| POST | /api/applications | Add a new application | Backend |
| PUT | /api/applications/:id | Update an application (any fields, all optional) | Backend |
| DELETE | /api/applications/:id | Delete an application, its interviews and its resume file | Backend |
| POST | /api/applications/:id/resume | Upload a resume (field name `resume`) | Backend + Security validates file |
| GET | /api/applications/:id/resume | Download your own resume | Backend |
| GET | /api/interviews/:appId | Get interview details | Backend |
| POST | /api/interviews/:appId | Add interview details | Backend |
| GET | /api/dashboard | Summary counts | Backend |
| GET | /api/admin/logs | Security/audit log list (admin only) | Security |
| GET | /api/admin/events | Suspicious activity (admin only); optional `?hours=N`, default 24, maximum 720 | Security |

**Rule:** nobody changes an endpoint name or shape without telling the other two team members.

## Security Features

- **Passwords:** hashed with bcryptjs before saving; login errors never say whether the email exists.
- **JWT:** every protected route verifies the token and loads the user from the database; the role always comes from the database, never from the token.
- **Ownership:** users can only read, change, delete or download their own applications, interviews and resumes.
- **Input validation:** register, login, create application and update application are validated; bad input gets `400` with `{ message: "Validation failed", errors: [...] }`.
- **Rate limits:** 5 login attempts per IP per 15 minutes; 100 API requests per IP per 15 minutes. Blocked requests get `429`.
- **Resume uploads:** PDF, DOC and DOCX only, 5 MB maximum, the file's real content is checked (not just its extension), and it is saved under a random name.
- **Logging:** security events (failed logins, invalid tokens, denied admin access, rejected uploads, rate-limit hits, server errors) are written to `backend/logs/security.log`. Admins can read them through `/api/admin/logs` and `/api/admin/events`.

## Known Limits

- `security.log` has no size limit or rotation yet.
- CORS currently allows any origin and no Helmet security headers are set; both are planned before deployment.
- Admin accounts cannot be created through the API. An admin's `role` is set directly in the database.

## Notes

- Never commit `.env`: it holds secrets and is listed in `.gitignore`. Anyone who has seen it should change the database password and `JWT_SECRET`.
- Security middleware lives in `backend/middleware/` as separate files that plug into the Express routes.