# Simba Spark — Auth (Shared Prerequisite)

> Read `00_SHARED_FOUNDATION.md` first. Build this **before** the role features —
> everything depends on being able to log in with a role.

## Goal

Email + password login and registration, with role-based access. No public
open signup: a person can only register if their email is already on the
Admin's authorized list. (This honors the proposal's "Admin-provisioned only"
rule and makes swapping to Microsoft login later a small change.)

## Requirements

### R1 — Authorized-email gate
- Admin adds a person's email + role to `users` first (with a flag or simply by
  the row existing). `is_authorized` defaults handling is up to setup, but the
  rule is: **registration only succeeds if the email already exists in `users`
  as an authorized entry.**
- If the email is not authorized, registration is rejected with a clear message.

### R2 — Registration
- Form: email, password (and confirm password).
- On submit: verify email is authorized → hash password with **bcrypt** →
  store `password_hash` on the existing user row.
- Never store plaintext passwords.

### R3 — Login
- Form: email + password.
- Use **Auth.js (NextAuth) Credentials provider**.
- On success, the session must carry the user's `id` and `role`.

### R4 — Role-based routing
- After login, route by role:
  - admin → `/admin`
  - instructor → `/instructor`
  - student → `/student`
- A single role-check helper/middleware protects each area. A student hitting
  `/admin` is blocked.

### R5 — Logout
- Standard sign-out that clears the session.

## Acceptance criteria
- A non-authorized email cannot register.
- An authorized user can register, then log in, and lands on the page for their role.
- Visiting another role's area while logged in is blocked.
- Passwords are bcrypt-hashed in the database (verify by inspecting a row).

## Notes for later (do NOT build now)
- Microsoft University login replaces the password step later. Keep the
  authorized-email check separate from the password check so only the password
  part is swapped out.
