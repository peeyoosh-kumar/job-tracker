# Secure Internship & Job Application Tracker

A full-stack web app that helps students manage their internship and job applications — track application status, record interview details, store resumes, and see everything in one dashboard. Includes security features: secure authentication, input validation, secure file uploads, and activity logging.

## Team

| Name | Role |
|---|---|
| Peeyoosh Kumar | Backend |
| Yogesh | Frontend |
| Ankush Jha | Security / Cybersecurity |

## Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas
- **Frontend:** React (Vite)
- **Auth:** JWT (JSON Web Token)
- **Security:** bcrypt, express-validator, express-rate-limit, multer, morgan/winston

## Project Structure

```
job-tracker/
├── backend/       ← Express API, database models, routes, security middleware
├── frontend/      ← React app
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
4. Run the server:
   ```
   node index.js
   ```
5. Visit `http://localhost:5000` — you should see "API is running".

## Frontend Setup

1. Go into the frontend folder:
   ```
   cd frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Run the dev server:
   ```
   npm run dev
   ```

## API Contract

All responses are JSON. Protected routes require header `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose | Owner |
|---|---|---|---|
| POST | /api/auth/register | Create account | Backend + Security |
| POST | /api/auth/login | Login, returns JWT | Backend + Security |
| GET | /api/applications | List user's applications | Backend |
| POST | /api/applications | Add new application | Backend |
| PUT | /api/applications/:id | Update application | Backend |
| DELETE | /api/applications/:id | Delete application | Backend |
| POST | /api/applications/:id/resume | Upload resume | Backend + Security validates file |
| GET | /api/interviews/:appId | Get interview details | Backend |
| POST | /api/interviews/:appId | Add interview details | Backend |
| GET | /api/dashboard | Summary counts | Backend |
| GET | /api/admin/logs | Audit log list (admin only) | Security |
| GET | /api/admin/events | Suspicious activity (failed logins etc.) | Security |

**Rule:** nobody changes an endpoint name or shape without telling the other two team members.

## Notes

- Never commit `.env` — it holds secrets. It's already listed in `.gitignore`.
- Security middleware lives in `backend/middleware/` as separate files that plug into the Express routes.
