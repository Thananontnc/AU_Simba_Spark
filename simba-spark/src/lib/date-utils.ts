// ============================================================================
// Simba Spark — Pure date/time helpers
// ----------------------------------------------------------------------------
// All functions are pure (no side effects, no I/O) and timezone-safe: ISO
// date strings ("YYYY-MM-DD") are parsed as LOCAL midnight via
// `new Date(y, m-1, d)`, never via `new Date(iso)` which UTC-parses and can
// shift a day backwards in negative timezones.
// ============================================================================

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Parse "YYYY-MM-DD" as local midnight (timezone-safe). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a Date back to "YYYY-MM-DD" using local fields. */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Weekday (Mon–Fri) ISO dates inside an inclusive [start, end] range. */
export function weekdaysInRange(start: string, end: string): string[] {
  const out: string[] = [];
  const s = parseDate(start);
  const e = parseDate(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); // 0 = Sun, 6 = Sat
    if (dow !== 0 && dow !== 6) out.push(toISO(d));
  }
  return out;
}

/** Split a list into chunks of 5 (one Mon–Fri work-week each). */
export function chunkWeeks(days: string[]): string[][] {
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 5) weeks.push(days.slice(i, i + 5));
  return weeks;
}

/** Short label like "Mon 15". */
export function shortDayLabel(iso: string): string {
  const d = parseDate(iso);
  return `${DOW[d.getDay()]} ${d.getDate()}`;
}

/** Just the weekday name, e.g. "Mon". */
export function weekdayName(iso: string): string {
  return DOW[parseDate(iso).getDay()];
}

/** "June 2026". */
export function monthLabel(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "HH:mm" → minutes since midnight (e.g. "09:30" → 570). */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Pretty time band, e.g. "09:00 – 10:30". */
export function timeBand(start: string, end: string): string {
  return `${start} – ${end}`;
}

/**
 * Build a month grid (weeks × 7) for the month containing `iso`.
 * Each cell is either an ISO date or null (for leading/trailing blanks so
 * the first column is always Sunday). Used by the monthly calendar view.
 */
export function monthMatrix(iso: string): (string | null)[][] {
  const d = parseDate(iso);
  const year = d.getFullYear();
  const month = d.getMonth();
  const startDow = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid: (string | null)[][] = [];
  let row: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) row.push(null);
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    row.push(toISO(new Date(year, month, dayNum)));
    if (row.length === 7) {
      grid.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    grid.push(row);
  }
  return grid;
}

/** True if `iso` is within [start, end] inclusive. */
export function isWithin(iso: string, start: string, end: string): boolean {
  return iso >= start && iso <= end;
}

/** Long weekday name for an ISO date, e.g. "Monday". */
export function longWeekdayName(iso: string): string {
  const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return LONG[parseDate(iso).getDay()];
}

/**
 * Given a list of weekday ISO dates (a 10-day block split into two Mon–Fri
 * weeks), return the Sun–Sat column layout the nostalgic timetable expects.
 *
 * Each weekday maps to a { dayName, iso } column header; weekends are null
 * columns (rendered as a faint "Weekend" cell, no sessions). The result is
 * always 7 entries so the grid stays a consistent 7-day view while honoring
 * the 10-day block logic underneath.
 */
export function weekColumns(weekDays: string[]): ({ dayName: string; iso: string } | null)[] {
  const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Map iso → short name, then place into the Sun..Sat slots of one week.
  const byDow: Record<number, string> = {};
  weekDays.forEach((iso) => {
    byDow[parseDate(iso).getDay()] = iso;
  });
  return [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const iso = byDow[dow];
    return iso ? { dayName: SHORT[dow], iso } : null;
  });
}
