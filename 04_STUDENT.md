# Simba Spark — STUDENT Role Spec

> Owner: **Instructor/Student developer (your friend).**
> Read `00_SHARED_FOUNDATION.md` first. Easiest of the three areas — build it
> after the Instructor booking feature so there are real bookings to display.

---

## Feature S1 — Personalized Block Schedule  (proposal: Case E2E 4)

**Screen:** `/student`

Show the logged-in student their own block course schedule on a calendar.

### Data
- Find the sections the student is enrolled in (`enrollments` → `sections`).
- For those sections, pull the `bookings` (date, start/end time, room) plus the
  course name and timeframe.
- Show **only this student's** enrolled blocks — never anyone else's.

### UI (from the mockup)
- Title "My Block Course Schedule".
- A **weekly** calendar grid: columns Mon–Fri, time rows roughly 08:00–17:00.
- Booked blocks render as filled cards spanning their time
  (e.g. "Course Title (Block 1)" 10:00–12:00).
- Empty slots show as faint "Available Slot" placeholders.
- A small legend: filled = Block Course, dashed = Available Slot.

### Scope decisions (keep it simple)
- **Weekly view only.** Monthly view is optional/cut — do not build unless ahead.
- Read-only. Students cannot book, add, or drop anything (per Out of Scope).

**Acceptance:**
- A student sees their enrolled block(s) placed correctly on the weekly grid.
- A student with no enrollments sees an empty grid, not an error.
- One student cannot see another student's schedule.

---

## Build order
Build after Instructor I2 exists, so there are real bookings to render.
Until then, develop against `seed.sql` bookings.

## Out of scope
Self add/drop, booking, editing, monthly view (optional), notifications.
