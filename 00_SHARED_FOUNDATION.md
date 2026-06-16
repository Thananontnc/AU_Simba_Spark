# Simba Spark — Shared Foundation (READ THIS FIRST)

This file is the common ground for everyone on the team. **Every role spec
assumes you have read this file.** Build the foundation together before anyone
starts their own role.

---

## What we are building

A web application for the **Simba program** that manages **Block Course**
schedules for first-year students. Courses change every 2 weeks ("blocks").

Three user roles:

- **Admin** — provisions users, sets up courses/sections/timeframes, enrolls students.
- **Instructor** — books teaching time slots (first come, first serve).
- **Student** — views their personalized block schedule on a calendar.

---

## Tech stack (fixed — do not substitute)

| Layer | Tool |
|---|---|
| Frontend UI | React (via Next.js) |
| Framework / backend / SSR | Next.js (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| DB hosting | Neon (serverless Postgres) |
| Deployment | Vercel |
| Data access | **Raw SQL via `@neondatabase/serverless`** (NO ORM, no Prisma) |
| Auth | Auth.js (NextAuth) — Credentials provider (email + password) |
| Password hashing | bcrypt |

> We are deliberately **not** using Prisma. All database access is raw SQL
> through the Neon serverless driver. See the DB helper below.

---

## Database schema (the single source of truth)

This lives in `schema.sql` at the repo root. **Do not change a table without
telling the whole team and updating this file in git.**

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','instructor','student')),
  is_authorized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  course_name TEXT NOT NULL,
  course_code TEXT UNIQUE NOT NULL,
  credits INT
);

CREATE TABLE timeframes (        -- the 2-week block windows
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);

CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  course_id INT NOT NULL REFERENCES courses(id),
  section_number TEXT NOT NULL,
  instructor_id INT REFERENCES users(id),
  room TEXT,
  timeframe_id INT REFERENCES timeframes(id)
);

CREATE TABLE enrollments (       -- which students are in which section
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES sections(id),
  student_id INT NOT NULL REFERENCES users(id),
  UNIQUE (section_id, student_id)
);

CREATE TABLE bookings (          -- FCFS teaching-slot reservations
  id SERIAL PRIMARY KEY,
  section_id INT NOT NULL REFERENCES sections(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()   -- earlier created_at wins a conflict
);
```

---

## Database helper (every query goes through this)

```ts
// lib/db.ts
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);
export default sql;
```

Usage — **always use tagged templates** so values are parameterized
(this is our SQL-injection protection):

```ts
import sql from '@/lib/db';

// read
const users = await sql`SELECT * FROM users WHERE role = ${role}`;

// insert and get the row back
const [course] = await sql`
  INSERT INTO courses (course_name, course_code, credits)
  VALUES (${name}, ${code}, ${credits})
  RETURNING *
`;
```

**NEVER** build SQL by string concatenation
(`"... WHERE email = '" + email + "'"`). That is a security hole.

---

## Project conventions (everyone follows these)

- **Reads** can happen directly in Server Components (`await sql\`...\`` in the
  page/component file). No API layer needed for reads.
- **Writes** (create / update / delete) go through **Server Actions**
  (`'use server'`).
- Any page that shows live data (all admin lists, booking screen, student
  calendar) must add `export const dynamic = 'force-dynamic';`, otherwise
  Next.js renders it once at build time and the data looks frozen.
- Do **not** use HTML `<form>` inside flows where it conflicts with client
  components; for Server Actions a `<form action={...}>` is correct and expected.
- Role-checking logic lives in **one** place (a helper / middleware). Do not
  copy-paste role checks around.
- Keep all schema changes in `schema.sql` in git. Tell the team when it changes.

---

## How we work with Claude Code

Each person opens their own role spec file and gives it to Claude Code as the
task description. Recommended order of work:

1. **Together:** repo setup, `schema.sql`, `lib/db.ts`, `seed.sql`, deploy empty
   app to Vercel.
2. **One person:** Auth (login / register + role + authorized-email check).
3. **Then split** into the three role specs and build in parallel against
   seed data.

When prompting Claude Code, paste the relevant role file and add one line like:
"Build feature X from this spec. Use the shared foundation conventions. Ask me
before changing the database schema."

---

## Definition of a booking CONFLICT (shared rule — memorize this)

A new booking is **rejected** if, for an overlapping time on the same date, any
of these is already true:

1. The same **room** is already booked, OR
2. The same **instructor** already has a booking, OR
3. A **student enrolled in that section** is already in another block at that time.

When two bookings would conflict, the one with the **earlier `created_at` wins**
(First Come First Serve). Confirm this rule with the advisor before building.
