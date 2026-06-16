# Simba Spark — ADMIN Role Spec

> Owner: **Admin developer (you).**
> Read `00_SHARED_FOUNDATION.md` first. Auth must exist before this is testable.

The Admin side is the data-entry engine. Nothing the instructor or student sees
exists until Admin creates it. Build in the order below.

---

## Feature A1 — User Management  (proposal: Case E2E 1)

CRUD for user accounts. This is the "User Provisioning" objective.

**Screen:** `/admin/users`

- **Add New User** form: Full Name, University Email, Select Role
  (admin / instructor / student). On save, create a row in `users` with
  `is_authorized = true` (so the person can later register a password).
- **Registered Users** table: Name, Email, Role, with **Edit** and **Delete**
  actions per row.
- Email must be unique (the DB enforces this — handle the error gracefully).

**Acceptance:**
- Admin can add, edit, and delete users.
- A newly added user's email can then be used to register (ties into Auth R2).

---

## Feature A2 — Course & Section Setup  (proposal: Case E2E 2)

**Screen:** `/admin/courses`

- **Course & Section Details:** Course Name, Course Code, Credits, Section Number.
- **Schedule & Location:** select a **2-Week Block Timeframe** (from `timeframes`),
  select a **Room**.
- Creates a `courses` row (if new) and a `sections` row linked to it.

**Acceptance:**
- Admin can create a course with a section, a timeframe, and a room.
- The section appears available for instructor assignment.

---

## Feature A3 — Timeframe Setup

**Screen:** `/admin/timeframes` (can be a tab/section within courses)

- Create the 2-week block windows: Label, Start Date, End Date.
- These populate the timeframe dropdown used in A2.

**Acceptance:**
- Admin can create timeframes that show up when setting up a section.

---

## Feature A4 — Assign Instructor & Enroll Students  (proposal: Case E2E 2)

Part of the course setup screen ("Assign & Enroll" block in the mockup).

- **Select Instructor:** pick from users where role = instructor; set
  `sections.instructor_id`.
- **Add Students:** search users where role = student; insert rows into
  `enrollments` (section_id + student_id). Respect the UNIQUE constraint —
  a student can't be enrolled in the same section twice.
- Show an enrolled-students count in the setup summary.

**Acceptance:**
- A section has one assigned instructor.
- Students can be enrolled and the count updates.
- Re-adding the same student is prevented or ignored cleanly.

---

## Feature A5 — Conflict Resolution view (build LAST, optional if short on time)

- Show admin an alert when bookings overlap (uses the shared conflict rule).
- A **Manual Override** action lets admin force a schedule adjustment.
- If time runs out, cut this — it is the lowest priority Admin feature.

---

## Build order
A1 → A3 (timeframes) → A2 (courses/sections) → A4 (assign/enroll) → A5 (if time).

## Out of scope (do not build)
Self-signup, Add/Drop by students, payment, syncing to the university registrar
database. (See proposal "Out of Scope".)
