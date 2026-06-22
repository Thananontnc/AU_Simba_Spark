// ============================================================================
// Simba Spark — Mock data for the Student dashboard (mock-data phase)
// ----------------------------------------------------------------------------
// Stand-in for PostgreSQL. Each object below mirrors a row from schema.sql, so
// when we later do `await sql\`SELECT ...\`` the rows will already match the
// `StudentDashboardData` shape. Nothing in the UI imports a table name — only
// these types — so the swap is a one-file change.
// ============================================================================

import type {
  User,
  Course,
  Timeframe,
  Section,
  Booking,
  Notification,
  EnrolledCourse,
  StudentDashboardData,
} from './types';
import { weekdaysInRange } from './date-utils';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
const users: User[] = [
  {
    id: 3,
    fullName: 'Prathomporn Bunjua',
    email: 'student@simba.au',
    role: 'student',
    isAuthorized: true,
    msOid: '9a7c2f1e-4b3d-4c8a-9e6f-7d2b1a0c3e4f',
    msVerified: true,
    // Nostalgic profile summary fields (sidebar top block).
    studentId: '6710990',
    gpa: 3.61,
    department: 'COMPUTER SCIENCE',
    faculty: 'ENGINEERING, SCIENCE AND TECHNOLOGY',
    credits: 68,
  },
  {
    id: 2,
    fullName: 'Instructor One',
    email: 'instructor@simba.au',
    role: 'instructor',
    isAuthorized: true,
  },
];

// ---------------------------------------------------------------------------
// Courses (Case E2E 2 — credits + multi-faculty)
// ---------------------------------------------------------------------------
const courses: Course[] = [
  {
    id: 1,
    courseName: 'Introduction to Programming',
    courseCode: 'CS101',
    credits: 3,
    faculty: 'Computing & IT',
  },
  {
    id: 2,
    courseName: 'Calculus I',
    courseCode: 'MA101',
    credits: 4,
    faculty: 'Science & Mathematics',
  },
  {
    id: 3,
    courseName: 'Academic English Foundations',
    courseCode: 'EN101',
    credits: 2,
    faculty: 'Humanities & Languages',
  },
];

// ---------------------------------------------------------------------------
// Timeframes (the 2-week block windows)
// ---------------------------------------------------------------------------
// NOTE: We anchor Block 1 on Monday 2026-06-15 → Fri 2026-06-26 so the window
// contains exactly 10 weekdays (Mon–Fri × 2). The real seed.sql window starts
// on a Tuesday (only 9 weekdays); when we go live the calendar computes dates
// from `timeframes`, so the mock's tidy 10-day window is purely a mock choice.
// ---------------------------------------------------------------------------
const timeframes: Timeframe[] = [
  {
    id: 1,
    label: 'Block 1 — 2026',
    startDate: '2026-06-22',
    endDate: '2026-07-03',
  },
  {
    id: 2,
    label: 'Block 2 — 2026',
    startDate: '2026-07-06',
    endDate: '2026-07-17',
  },
];

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
const sections: Section[] = [
  {
    id: 1,
    courseId: 1,
    sectionNumber: 'SEC-01',
    instructorId: 2,
    instructorName: 'Instructor One',
    room: 'Room A72',
    timeframeId: 1,
  },
  {
    id: 2,
    courseId: 2,
    sectionNumber: 'SEC-01',
    instructorId: 2,
    instructorName: 'Instructor One',
    room: 'Room B10',
    timeframeId: 1,
  },
  {
    id: 3,
    courseId: 3,
    sectionNumber: 'SEC-02',
    instructorId: 2,
    instructorName: 'Instructor One',
    room: 'Room C05',
    timeframeId: 1,
  },
];

// ---------------------------------------------------------------------------
// Bookings — generate the continuous 10-day pattern per section
// ---------------------------------------------------------------------------
// `weekdaysInRange` is imported from date-utils.ts (timezone-safe). The local
// copy that used to live here had a UTC bug: `toISOString()` shifted local
// midnight back one day in negative timezones, so the range Jun 15–26 became
// Jun 14–25 and weekday labels no longer matched the dates. Reusing the safe
// helper fixes that.

/**
 * Build one booking per weekday for a section. Real block courses hold the
 * same daily slot for the whole block, so we repeat the time band across all
 * 10 days. `dayOverride` lets us flag a single day as an admin override to
 * demo the pulse interaction (spec interaction #4).
 */
function buildBlock(
  sectionId: number,
  room: string,
  timeframe: Timeframe,
  startTime: string,
  endTime: string,
  overrideDates: string[] = [],
  type: 'lecture' | 'lab' = 'lecture',
): Booking[] {
  return weekdaysInRange(timeframe.startDate, timeframe.endDate).map((date, i) => ({
    id: sectionId * 100 + i,
    sectionId,
    date,
    startTime,
    endTime,
    room,
    adminOverride: overrideDates.includes(date),
    type,
  }));
}

const block1 = timeframes[0];

const bookings: Booking[] = [
  // CS101 — daily 09:00–10:30 in A72. One admin override (Mon 22 Jun) to demo
  // the pulse interaction.
  ...buildBlock(1, 'Room A72', block1, '09:00', '10:30', ['2026-06-22'], 'lecture'),
  // MA101 — daily 12:00–13:30 in B10.
  ...buildBlock(2, 'Room B10', block1, '12:00', '13:30', [], 'lecture'),
  // EN101 — daily 15:00–16:30 in C05.
  ...buildBlock(3, 'Room C05', block1, '15:00', '16:30', [], 'lab'),
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
const now = Date.now();
const hour = 3_600_000;

const notifications: Notification[] = [
  {
    id: 1,
    title: 'Timeframe confirmed',
    body: 'Block 1 — 2026 runs 15–26 June. Your calendar is now finalized.',
    createdAt: now - 2 * hour,
    level: 'info',
  },
  {
    id: 2,
    title: 'Manual override — CS101 on 22 Jun',
    body: 'An admin changed the room for CS101 to Room A72 to clear a clash. Tap the highlighted slot to review.',
    createdAt: now - 26 * hour,
    level: 'override',
  },
  {
    id: 3,
    title: 'No conflicts detected',
    body: 'Your enrolled blocks for this window are conflict-free.',
    createdAt: now - 50 * hour,
    level: 'info',
  },
];

// ---------------------------------------------------------------------------
// Assemble the dashboard view-model
// ---------------------------------------------------------------------------
function buildEnrolledCourse(section: Section): EnrolledCourse {
  const course = courses.find((c) => c.id === section.courseId)!;
  const timeframe = timeframes.find((t) => t.id === section.timeframeId)!;
  const sectionBookings = bookings.filter((b) => b.sectionId === section.id);
  return { course, section, timeframe, bookings: sectionBookings };
}

const student = users.find((u) => u.role === 'student')!;

export const mockDashboardData: StudentDashboardData = {
  student,
  // "Current block" = the timeframe whose window contains today, else the
  // first one. Keeps the quick-stats badge meaningful in the demo.
  currentBlock: block1,
  enrolledCourses: sections.map(buildEnrolledCourse),
  notifications,
};

// Re-export the typed pieces in case a component wants to import a single entity.
export { users, courses, timeframes, sections, bookings, notifications };
