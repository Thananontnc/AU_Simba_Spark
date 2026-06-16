# Simba Spark — Specs (read me first)

These files describe what to build. Use them with Claude Code: open a file,
give it to Claude Code as the task, and say "build this, follow the shared
foundation conventions."

## Reading order

1. **00_SHARED_FOUNDATION.md** — everyone reads this first. Stack, database
   schema, conventions, and the booking conflict rule.
2. **01_AUTH.md** — build this together/first; everything depends on login + roles.
3. Then split:
   - **02_ADMIN.md** — Admin developer (Prathomporn / you).
   - **03_INSTRUCTOR.md** — Instructor+Student developer (your friend). The
     FCFS conflict detection here is the technical core.
   - **04_STUDENT.md** — same developer, build after the instructor booking works.

## Who builds what

| Area | Owner |
|---|---|
| Repo setup, schema.sql, lib/db.ts, seed.sql, Vercel deploy | Together |
| Auth (login/register + roles) | Whoever is faster — do first |
| Admin (users, courses, timeframes, enroll) | You |
| Instructor (assigned courses, FCFS booking) | Friend |
| Student (personalized calendar) | Friend |

## The one rule that keeps a 2-person team unblocked

Build against **seed.sql** data. Your friend should NOT wait for your Admin
screens to be finished — with seeded rows in `sections`, `enrollments`, and
`bookings`, they can build and test booking immediately. Integrate the real
data later.

## Target milestone

Get the full chain working end-to-end by mid-project, even if ugly:
**Admin creates a course → Instructor books a slot → Student sees it on the
calendar.** Everything after that is polish.
