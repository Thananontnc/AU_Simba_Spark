# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Simba Spark — a Next.js web app for managing **Block Course** schedules in the Simba program. First-year students rotate courses every 2 weeks. Three roles: Admin, Instructor, Student.

The app lives in `simba-spark/`. All commands must be run from inside that directory.

## Tech stack (fixed — do not substitute)

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL — **local** via `pg` Pool (`@neondatabase/serverless` is NOT used) |
| Data access | Raw SQL tagged templates — **no ORM, no Prisma** |
| Auth | Auth.js (NextAuth v5 beta) — Credentials provider |
| Password hashing | bcrypt |
| Styling | Tailwind v4 (`@import "tailwindcss"`) + CSS variables |

## Common commands

```bash
cd simba-spark

npm run dev        # dev server at localhost:3000
npm run build      # production build
npx tsc --noEmit   # type check
```

If CSS looks broken or old errors persist, kill stale processes and wipe cache:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## Environment

`.env.local` (inside `simba-spark/`):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/simba_spark
AUTH_SECRET=<any long random string>
```

## Database setup

```bash
psql -U postgres -c "CREATE DATABASE simba_spark;"
psql -U postgres -d simba_spark -f schema.sql
psql -U postgres -d simba_spark -f seed.sql
```

Seed creates 3 users, all with password `password123`:
- `admin@simba.au` / role: admin
- `instructor@simba.au` / role: instructor
- `student@simba.au` / role: student

## Database helper

```ts
// simba-spark/src/lib/db.ts  — uses pg Pool, NOT neon()
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const sql = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const query = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
  const { rows } = await pool.query(query, values as unknown[]);
  return rows;
};
export default sql;
```

**Always use tagged templates** (SQL injection protection):
```ts
// correct
const users = await sql`SELECT * FROM users WHERE role = ${role}`;
// NEVER do this
const bad = await sql(`SELECT * FROM users WHERE role = '${role}'`);
```

## Architecture conventions

- **Reads** — in Server Components (`await sql\`...\`` directly in page files). No API routes.
- **Writes** (INSERT/UPDATE/DELETE) — Server Actions (`'use server'`), in `src/app/actions/`.
- **Dynamic pages** — all data pages need `export const dynamic = 'force-dynamic';` or data appears frozen.
- **Route protection** — `src/proxy.ts` (NOT `middleware.ts` — Next.js 16 renamed it). Redirects unauthenticated to `/login`, blocks cross-role access.
- **Client components** — only for interactivity (modals, search, forms with local state). Named `*-client.tsx`.
- **Role checking** — single helper only; never copy-paste checks.

## Theming

CSS variables in `src/app/globals.css` — `:root` (light) and `.dark` (dark). Key vars: `--bg`, `--surface`, `--subtle`, `--border`, `--tx`, `--tx-2`, `--tx-3`, `--accent` (`#F5841F` Simba orange), `--sidebar`.

Dark mode toggled by adding `.dark` class to `<html>`. Sidebar uses its own `--sidebar` dark background regardless of theme. Theme persists via `localStorage`.

Tailwind dark mode: `@variant dark { .dark & { ... } }` — NOT `darkMode: 'class'` config.

Pre-built CSS classes for sidebar nav in `globals.css`: `.sidebar-link`, `.sidebar-icon`, `.sidebar-signout`.

## Responsive layout

Admin sidebar (`src/app/admin/sidebar.tsx`) is a **Client Component**:
- **Desktop (lg+)**: sticky sidebar always visible
- **Mobile (<lg)**: sidebar hidden, hamburger button top-left opens a drawer with overlay
- Closes on route change and Escape key

## Database schema

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

CREATE TABLE timeframes (        -- 2-week block windows
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

CREATE TABLE enrollments (
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
  created_at TIMESTAMPTZ DEFAULT NOW()  -- earlier created_at wins conflicts
);
```

## Booking conflict rule (FCFS — the technical core)

A new booking is **rejected** if, for an overlapping time on the same date, any of these is already true:

1. Same **room** already booked, OR
2. Same **instructor** already has a booking, OR
3. A **student enrolled in that section** is already in another booking.

Overlap: `new_start < existing_end AND new_end > existing_start`

Earlier `created_at` wins. This is First Come First Serve.

## Role-based routing

| Role | Root path |
|---|---|
| admin | `/admin` |
| instructor | `/instructor` |
| student | `/student` |

## Auth flow

- Registration only succeeds if email already exists in `users` with `is_authorized = true`. Admin pre-provisions users; they then set their password via `/register`.
- Session carries `id` and `role` (both strings in JWT).
- In server actions: `const session = await auth(); const id = parseInt(session!.user.id);`

## What is already built ✅

### Auth
- `/login` — email + password login
- `/register` — set password for pre-authorized email
- `src/proxy.ts` — route protection + role redirect

### Admin (`/admin/*`)
All admin server actions live in `src/app/actions/admin.ts`. Profile actions in `src/app/actions/profile.ts`.

| Route | File | What it does |
|---|---|---|
| `/admin/users` | `users/page.tsx` + `users-client.tsx` | List all users. Search by name/email. Filter by role. Add / Edit / Delete modals. |
| `/admin/timeframes` | `timeframes/page.tsx` + `timeframes-client.tsx` | Create / Edit / Delete 2-week block windows. Date picker blocks past dates and auto-skips weekends (Sat/Sun = holidays). |
| `/admin/courses` | `courses/page.tsx` | Create courses + sections. Assign instructor to section. Enroll / unenroll students per section. |
| `/admin/profile` | `profile/page.tsx` + `profile-client.tsx` | Edit name/email. Change password (requires current password). |

Admin sidebar: logo → user name/email → nav (Users, Timeframes, Courses) → Profile + Sign Out at bottom.

### Theme
- Light / dark toggle (`ThemeToggle` button in header)
- No flash on load — `next/script strategy="beforeInteractive"` writes `.dark` class before paint

## What is NOT yet built ❌

### Instructor (`/instructor/*`)
- **I1**: List of sections assigned to the logged-in instructor (with timeframe, room, enrolled student count)
- **I2**: FCFS booking form — pick date + time slot → conflict check → create booking. Show existing bookings for that section.

### Student (`/student/*`)
- **S1**: Weekly calendar view (read-only). Shows bookings for sections the student is enrolled in. No editing.

Build order: I1 → I2 → S1. Student view requires real bookings from I2.

## Out of scope (do not build)

Self-signup, student add/drop, payment, university registrar sync, monthly calendar view, editing other instructors' bookings, recurring/auto scheduling, email notifications.
