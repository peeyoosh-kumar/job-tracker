# Security Work Record: Phase 2 (Tuesday 17 November 2026)
**Project:** Secure Internship & Job Application Tracker (DIT University Dehradun)
**Author:** Ankush Jha (security) · **Branch:** `ankush-phase2` · **Repo:** `peeyoosh-kumar/job-tracker` (public)
**Base:** `main` at `5abac1a` (Peeyoosh's Phase 2 merged). Safe old version: tag `v1-final` (`838532d`).
**Status:** written at about 16:25 IST on 17 Nov. It contains only results I ran and pasted. Results reported by Peeyoosh are marked *his claim*.

**Labels:** *tested live* (run against the real running server, output shown), *tested offline* (stub or simulated), *checked in code only* (read in the source, not run), *his claim* (reported by Peeyoosh, not run by me), *not tested*. In report Table 7.1 my rows use "Live (Ankush)".

---

## 1. Commits on `ankush-phase2` (both pushed)

| Commit | Change | Files |
|---|---|---|
| `fa600e1` | Add `GET /api/admin/summary` (admin only) | `routes/admin.js` (33 insertions, 2 deletions) |
| `4f7582a` | Fix negative and invalid `?limit=` on `/api/admin/logs` | `routes/admin.js` (2 insertions, 1 deletion) |

Only `routes/admin.js` was edited in code. My three helper scripts (`check-role.js`, `fix-role.js`, `test-security.js`) stay untracked. This record is committed as a separate file, outside the backend code, at Peeyoosh's request.

## 2. Setup

- Server started on `ankush-phase2` with `npm run dev` (started 11:45 IST, left running; its reminder job was off because `EMAIL_USER` was not set when it started). Startup lines seen: `Server running on port 5000`, `Reminder job not started (EMAIL_USER is not set)`, `MongoDB connected successfully`.
- `npm ci` run first (old `node_modules` lacked `node-cron` and `nodemailer`). Installed: `helmet` 8.3.0, `mongoose` 9.12.1, `multer` 2.5.0, `node-cron` 4.6.0, `nodemailer` 10.6.0. `npm ci` reported 2 moderate findings. I did **not** run `npm audit` myself today.
- My `.env` points to Peeyoosh's shared Atlas cluster (`job-tracker` database), so he changes roles. Test accounts created: `ankush-p2-user`, `ankush-p2-admin`, `ankush-p2b-user`, `ankush-p2b-admin` (all `@example.com`). Only `ankush-p2-admin` was promoted by him.
- Reminder tests used a free Ethereal fake inbox (credentials only in my local `.env`, never committed or pasted). Peeyoosh agreed to the test run against his database after first declining.

## 3. Task 1: `GET /api/admin/summary?hours=24`

| # | Test | Result | Label |
|---|---|---|---|
| S1 | `node --check routes\admin.js` | Printed nothing (syntax fine) | checked in code only |
| S2 | `/summary` with no token | HTTP 401 | tested live |
| S3 | `/summary` with a normal user token (`ankush-p2b-user`) | HTTP 403 | tested live |
| S4 | `/summary` with admin token | 200; fields `windowHours`, `failedLogins`, `rateLimitHits`, `deniedAdmin`, `invalidTokens` | tested live |
| S5 | Hours rule: no `hours`, `hours=1`, `hours=-5`, `hours=99999` | `windowHours` 24, 1, 24, 720 | tested live |
| S6 | Counts against an independent count of `security.log` (`hours=720`) | Summary 48 / 35 / 3 / 0 vs file 51 / 37 / 5 / 4 | tested live, see below |

**S6 explanation.** The differences are lines older than the 30-day cutoff (about 18 Oct 2026). I printed the oldest timestamps per message: 3 `Failed login` (5 Oct), 2 `Rate limit hit` (27 Sep), 2 `Admin access denied` (26 Sep), and all 4 `Invalid or expired token` (26 and 29 Sep). 51-3 = 48, 37-2 = 35, 5-2 = 3, 4-4 = 0, so the counts match. Limit of this check: I read only the 5 oldest timestamps per message and relied on the arithmetic.

**Design note.** `/summary` counts every occurrence in the window. `/events` flags an IP only at 3 or more of the same warning.

## 4. Task 2: `/api/admin/logs?limit=` problem

| # | Test | Result | Label |
|---|---|---|---|
| L1 | Reproduce (before fix, 126 entries in file): `limit=5`, no limit, `limit=-5` | 5, 126, **121** (all but the last 5) | tested live |
| L2 | After fix: `limit=5`, `-5`, `0`, `abc`, `99999` | 5, 126, 126, 126, 126 | tested live |
| L3 | The 1000 cap itself (the log has far fewer than 1000 lines) | Not shown | checked in code only |

Fix: `const requested = parseInt(req.query.limit, 10); const limit = requested > 0 ? Math.min(requested, 1000) : 200;` (same rule `/events` uses for `hours`). The reproduction also corrected two of my predictions: the default returned 126, not 200, because the file only has 126 lines.

## 5. Task 3: reminder log events

- `/api/admin/logs?limit=1000` with the admin token (16:24 IST) showed 4 reminder events, all *tested live*:
  - 1 x `Reminder email sent` (fields: `applications` 1, `userId`, `level` info, `timestamp`)
  - 3 x `Reminder job failed` (fields: `error` "Invalid login: 535 Authentication failed", `userId`, `level` error, `timestamp`)
  - No `email` field and no password in any line.
- Decision: **`/summary` does not count them.** The summary is for suspicious activity. A sent reminder is normal behaviour and a failed job is an operational error, not an attack.
- `logger.js` needs no change (checked in code only).
- `security.log` is local to each machine. Peeyoosh reports the same two events in his own log (*his claim*).

## 6. Task 4: security review of Peeyoosh's Phase 2

| # | Item | Result | Label |
|---|---|---|---|
| R1 | `/api/notifications`, valid user token | 200, `{"count":0,"items":[]}` (account owned no applications) | tested live |
| R2 | `/api/notifications`, no token | 401 | tested live |
| R3 | `/api/notifications`, bad token | 401 | tested live |
| R4 | `/api/dashboard`, no token | 401 | tested live |
| R5 | `/api/dashboard`, bad token | 401 | tested live |
| R6 | `git ls-files \| findstr env` | Only `.env.example` | tested live |
| R7 | Secret search over `838532d..HEAD` (4 patterns, see below) | Only placeholders and public host names | tested live (patterns only) |
| R8 | `.env.example` has placeholders only | Read in full, placeholders only | checked in code only |
| R9 | User A cannot see user B's items in `/api/notifications` | Two normal users, one application each (deadline tomorrow): A saw only "P2 Isolation Test Co A", B saw only "P2 Isolation Test Co B". Matches the code (`Application.find({ user: userId })`, `userId` = `req.user._id` from `protect`). Limit: two users, notifications route only | tested live |
| R10 | Reminder email is plain text, subject has only a count, no password/hash/token in body | Code: `text` only, no `html`; subject is a count; `populate` fetches only name and email. I did not record what the delivered email looked like | checked in code only |
| R11 | Reminder sent once per application per day | Run 1: `Users with reminders` 1, `Emails sent` 1, `Emails failed` 0. Run 2 right after: 0, 0, 0 | tested live |
| R12 | Failed send leaves the application eligible (retry) | Two failed runs in a row (rejected mail login) both reported `Users with reminders: 1`, so the application was not marked as reminded after a failure. Code: `updateMany` runs only after `sendMail` returns | tested live |
| R13 | Mailer errors do not print the mail password | After a rejected login, I read `EMAIL_PASS` from `.env` (length 20) and checked that it appears neither in the console output nor in `security.log` (both `False`). Only for this error type; other mail errors (timeout, refused connection) not tested | tested live (rejected login only) |
| R14 | Reminder log events carry no email address | See section 5 (field names checked on the admin route) | tested live |
| R15 | User A deletes user B's application (`DELETE /api/applications/:id`) | HTTP 404; B then deleted its own record successfully, so A's attempt had no effect. How the controller does the ownership check was not read | tested live |
| R16 | Notification disappears after the application is deleted | A's `/api/notifications` returned `{"count":0,"items":[]}` after A deleted its own application | tested live |

**R7 patterns (all run on 13 commits, up to `4f7582a`):**
1. `mongodb+srv://user:pass@` pattern: printed nothing.
2. `ethereal.email | smtp.gmail | app password`: `smtp.ethereal.email` in `.env.example` and `mailer.js`, plus README text. Public host name, not a secret.
3. Secret assignments (`EMAIL_PASS`, `JWT_SECRET`, `MONGO_URI`): placeholders only.
4. Committed `.env`, `.log` or `node_modules`: printed nothing.

Limit: this finds only these patterns; it does not prove that no secret exists anywhere. **Repeat before the final push.**

**Results reported by Peeyoosh (his claim, not run by me):** `npm audit` shows exactly 2 moderate findings (`minimatch` via `nodemon`, a dev tool) ("Live (Peeyoosh)"); the two reminder events are in his own `security.log`.

## 7. Known weak points (checked in code only, not bugs to fix now)

- Overdue deadline alerts never expire until the status becomes Offer or Rejected.
- The follow-up rule counts days since `appliedDate`, not days spent in Applied.
- The reminder email covers deadlines from today to 2 days ahead and skips overdue ones; the bell covers up to 3 days ahead and includes overdue ones.
- `startOfToday` uses the server's time zone, so "today" can shift by a day if the server runs in UTC.
- If `sendMail` succeeds but `updateMany` throws, the job logs a failure and the next run can send a duplicate.
- The user's name goes into the email greeting as plain text. It cannot reach the subject, so header injection through it is not possible by my reading.
- `getNotifications` errors go only to the console, not to `security.log`.
- `company`, `role` and `message` are plain text; the frontend must show them as text, not HTML (Yogesh's side, not tested).
- The reminder job runs only while the server runs. My tests used a fake Ethereal inbox, not a real mail account.
- The reminder job works on all users' applications in the shared database. A run by one teammate marks applications as reminded for everyone on that day (seen on 17 Nov, see section 8).

## 8. Mistakes and corrections from today (for the honest process note)

- **Lost password:** logins at 11:17, 11:40 and 11:41 failed because I typed the password differently from registration. I later registered the `p2b` accounts with a password entered twice. The old admin account accepted that same password, so the earlier failures were typos, not a code problem.
- **429 on login:** after failed logins the limiter locked my IP. My first "restart" did not happen in the server window; `Ctrl + C` and `npm run dev` fixed it. Counters are in server memory and reset on restart.
- **Wrong account promoted:** I asked for `ankush-p2b-admin`; Peeyoosh changed `ankush-p2-admin`. That account turned out to be usable.
- **Results that did not count:** the login runs at 11:40 and 11:41 and the "normal user: HTTP 401" lines (empty token) are not test results. The 403 test was valid only after the 11:45 restart.
- **First `/summary` count check did not match:** the difference was the 30-day cutoff (section 3, S6), not a code fault.
- **Two of my predictions were wrong** (default `/logs` count and the size of the negative-limit result), both explained by the log having only 126 lines.
- **Mail login rejected twice (535):** the first Ethereal credentials in `.env` were not accepted. The failures were useful for R12 and R13, but they were a setup mistake, not a code problem. I replaced the credentials with a fresh account, using a prompt instead of hand-editing.
- **Another process marked my test application:** a run at about 10:48 UTC (16:18 IST), not by me, set `lastReminderSent` on my first reminder test application, so my next run found nothing (`Users with reminders: 0`). The timing fits Peeyoosh running the job on the same database. I created a fresh application for the real run.
- **Ethereal username pasted into the chat:** a fake-inbox username, low risk, but credentials stay out of chats.

## 9. Still to do

1. Look at the delivered email in the Ethereal preview and note: subject, plain text, only name/role/company/deadline. Until then R10 stays *checked in code only*.
2. Tell Peeyoosh I am finished, so he sets `ankush-p2-admin` back to `user`.
3. Update Chapter 6 (6.x.3 and 6.x.4) and the Table 7.1 rows.
4. Repeat the secret search (R7), `git status`, push this record (outside the backend code) and any final change with a normal `git push`. Final version due Wed 18 Nov, 12:00.
5. After the final push, delete the `.env` copy that points to Peeyoosh's cluster (his request). He keeps my four test accounts until after the screenshots and will change the database password after submission.

## 10. Cleanup state

- Isolation-test applications (ids ending `...58a2` and `...58a3`) and the two reminder-test applications (ids ending `...d48d` and `...d48e`) were created and then deleted by their owner; no test applications remain.
- The four `EMAIL_*` lines were removed from my `.env`; the reminder job was never started by the server.
- Test accounts remain in Peeyoosh's database (his decision).
- No passwords, tokens, mail credentials or `.env` values are recorded in this file.
