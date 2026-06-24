// ============================================================================
// Simba Spark — Shared domain types
// ----------------------------------------------------------------------------
// These interfaces intentionally mirror the tables in `schema.sql`
// (users, courses, sections, enrollments, bookings, timeframes). During the
// mock-data phase the Student dashboard reads objects shaped like these. When
// we later connect PostgreSQL via `@/lib/db`, the raw SQL rows will already
// match these types, so swapping mock → live is just changing the data source.
// ============================================================================

/** Auth roles, as constrained by `users.role CHECK (...)` in schema.sql. */
export type Role = 'admin' | 'instructor' | 'student';

/**
 * A person in the system. The `student` variant is what the dashboard renders.
 * `msOid` and `msVerified` model the "Microsoft Identity" mapping called out in
 * the spec (verified identity display).
 *
 * `studentId`, `gpa`, `department`, and `avatarUrl` populate the nostalgic
 * profile summary at the top of the sidebar (modernized AU Spark layout).
 */
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  isAuthorized: boolean;
  /** Microsoft Entra OID this account is linked to, if any. */
  msOid?: string;
  /** True once Microsoft identity verification completed. */
  msVerified?: boolean;
  /** Student-facing profile fields (sidebar summary). */
  studentId?: string;
  gpa?: number;
  department?: string;
  faculty?: string;
  credits?: number;
  /** Optional avatar URL; if absent we render an initials avatar. */
  avatarUrl?: string;
}

/**
 * A course offering (Case E2E 2 — "Academic Setup & Enrollment").
 * `credits` is the academic-weight field requested in Step 1.
 */
export interface Course {
  id: number;
  courseName: string;
  courseCode: string;
  credits: number;
  /** Owning faculty / department — drives the "multi-faculty course views". */
  faculty: string;
}

/**
 * A 2-week teaching window ("Block 1", "Block 2", …). `schema.sql: timeframes`.
 * A *continuous 10-day block course* runs across the 10 weekdays inside this
 * window (Mon–Fri × 2).
 */
export interface Timeframe {
  id: number;
  label: string;
  startDate: string; // ISO date, e.g. '2026-06-15'
  endDate: string;   // ISO date, e.g. '2026-06-26'
}

/**
 * A specific section of a course: who teaches it, where, and in which block.
 * `schema.sql: sections`.
 */
export interface Section {
  id: number;
  courseId: number;
  sectionNumber: string;
  instructorId: number | null;
  instructorName?: string; // denormalized for easy display in mock data
  room: string | null;
  timeframeId: number;
}

/**
 * One booked teaching slot. A continuous block course is represented by many
 * of these — typically one per weekday across the timeframe.
 * `schema.sql: bookings`.
 */
export interface Booking {
  id: number;
  sectionId: number;
  date: string;        // ISO date
  startTime: string;   // 'HH:mm'
  endTime: string;     // 'HH:mm'
  room: string | null;
  /**
   * True when an admin has force-kept this slot despite an overlap. The spec
   * calls for these to "animate with a subtle pulse effect".
   */
  adminOverride?: boolean;
  type?: 'lecture' | 'lab';
}

/** A real-time message shown in the Notification Feed. */
export interface Notification {
  id: number;
  title: string;
  body: string;
  /** Seconds since epoch, so the feed can render relative time. */
  createdAt: number;
  /** 'info' | 'warning' | 'override' — 'override' pulses (admin manual signal). */
  level: 'info' | 'warning' | 'override';
}

// ----------------------------------------------------------------------------
// Composite view-models (shapes the UI actually consumes)
// ----------------------------------------------------------------------------

/** A course the student is enrolled in, with its section + block resolved. */
export interface EnrolledCourse {
  course: Course;
  section: Section;
  timeframe: Timeframe;
  /** All dated bookings for this section within the block. */
  bookings: Booking[];
}

/** A typed snapshot of everything the personalized dashboard needs. */
export interface StudentDashboardData {
  student: User;
  /** The block currently in progress (drives the quick-stats badge). */
  currentBlock: Timeframe | null;
  enrolledCourses: EnrolledCourse[];
  notifications: Notification[];
}
