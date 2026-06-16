# Simba Spark — INSTRUCTOR Role Spec

> Owner: **Instructor/Student developer (your friend).**
> Read `00_SHARED_FOUNDATION.md` first.
>
> This is the **technical core of the project** — the FCFS conflict detection.
> You can build against `seed.sql` data before the Admin screens are finished.

---

## Feature I1 — Assigned Courses list

**Screen:** `/instructor` (landing) and `/instructor/courses`

- Show the sections where `sections.instructor_id` = the logged-in instructor.
- For each: course name, section number, timeframe (block dates), room.

**Acceptance:**
- An instructor sees only their own assigned sections.

---

## Feature I2 — FCFS Time-Slot Booking  (proposal: Case E2E 3)

**Screen:** `/instructor/booking`

This is the headline feature. The instructor books a teaching slot, and the
system checks for conflicts in real time before confirming.

### UI (from the mockup)
- Title "Select Teaching Slot", subtitle "First come, first serve booking".
- A list of candidate slots, each showing the time range and a status:
  - **Available** → a black **Select** button.
  - **Booked** → greyed out, disabled Select.
- A **Conflict Alert Area** where system notifications appear.

### Booking logic (the important part)
When the instructor clicks Select, run the **shared conflict rule** (see
foundation file) against the `bookings` table for the chosen date + time:

A booking is **rejected** if, for an overlapping time on the same date:
1. the same **room** is already booked, OR
2. the same **instructor** already has a booking, OR
3. a **student enrolled in that section** is already in another block then.

- If no conflict → insert into `bookings` (with `created_at = NOW()`), show success.
- If conflict → do NOT insert; show the reason in the Conflict Alert Area
  (e.g. "Room A72 is already booked 09:00–10:30").

### Why created_at matters
"First come, first serve" = whoever booked first holds the slot. Because every
booking stores `created_at`, the earlier booking always wins; a later
conflicting attempt is the one rejected. Mention this when you demo.

### Overlap check (SQL hint)
Two time ranges on the same date overlap when:
`new_start < existing_end AND new_end > existing_start`.
Build the conflict query around that condition plus the room / instructor /
student checks above.

**Acceptance:**
- Booking an available slot succeeds and the slot then shows as Booked.
- Attempting a slot that violates any of the 3 rules is rejected with a clear
  message in the alert area.
- No double-booking is possible.

---

## Build order
I1 (assigned courses) → I2 (booking + conflict detection).

Start I2 against seed data — you do not need the Admin UI finished, only rows in
`sections`, `enrollments`, and a couple of existing `bookings` to test conflicts.

## Out of scope
Editing other instructors' bookings; recurring/auto scheduling; notifications by
email.
