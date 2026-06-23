import { auth } from '@/auth';
import sql from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Booking = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  course_name: string;
  course_code: string;
  section_number: string;
};

// ── Week helpers ──────────────────────────────────────────────────────────────

function getWeekDates(offset: number): string[] {
  const now = new Date();
  const day = now.getDay();
  const daysSinceMon = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMon + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function fmt(t: string) { return t.slice(0, 5); }

function fmtHeader(d: string) {
  const date = new Date(d + 'T00:00:00');
  return {
    day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    num: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  };
}

// Hour range: 08:00–18:00  →  10 rows × 64px each = 640px total
const HOUR_START = 8;
const HOUR_END   = 18;
const ROW_H      = 64; // px per hour

function timeToTop(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return ((h - HOUR_START) * 60 + m) / 60 * ROW_H;
}

function blockHeight(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60 * ROW_H;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const session = await auth();
  const studentId = parseInt(session!.user.id);

  const { w } = await searchParams;
  const weekOffset = parseInt(w ?? '0') || 0;
  const weekDates = getWeekDates(weekOffset);

  const bookings = await sql`
    SELECT
      b.id,
      b.date::text,
      b.start_time::text,
      b.end_time::text,
      b.room,
      c.course_name,
      c.course_code,
      s.section_number
    FROM bookings b
    JOIN sections s    ON s.id = b.section_id
    JOIN courses c     ON c.id = s.course_id
    JOIN enrollments e ON e.section_id = s.id
    WHERE e.student_id = ${studentId}
      AND b.date >= ${weekDates[0]}::date
      AND b.date <= ${weekDates[4]}::date
    ORDER BY b.date, b.start_time
  ` as Booking[];

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--tx)' }}>My Block Course Schedule</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--tx-2)' }}>
            Week of {fmtHeader(weekDates[0]).num} – {fmtHeader(weekDates[4]).num}
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-1">
          <Link href={`?w=${weekOffset - 1}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
          </Link>
          {weekOffset !== 0 && (
            <Link href="?w=0"
              className="px-3 h-8 rounded-lg flex items-center text-xs font-medium transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}>
              Today
            </Link>
          )}
          <Link href={`?w=${weekOffset + 1}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 18l7-7-7-7"/></svg>
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: 'var(--tx-2)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'var(--accent)' }} />
          Block Course
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded border border-dashed" style={{ borderColor: 'var(--border)', background: 'transparent' }} />
          Available Slot
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl overflow-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div style={{ minWidth: 600 }}>

          {/* Column headers */}
          <div className="grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ borderRight: '1px solid var(--border)' }} />
            {weekDates.map((d) => {
              const h = fmtHeader(d);
              const today = new Date().toISOString().split('T')[0] === d;
              return (
                <div key={d} className="py-3 text-center" style={{ borderRight: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold" style={{ color: today ? 'var(--accent)' : 'var(--tx-2)' }}>{h.day}</p>
                  <p className="text-xs mt-0.5" style={{ color: today ? 'var(--accent)' : 'var(--tx-3)' }}>{h.num}</p>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative">
            {/* Hour rows (background grid) */}
            {hours.map((hr) => (
              <div key={hr} className="grid" style={{ gridTemplateColumns: '52px repeat(5, 1fr)', height: ROW_H, borderBottom: '1px solid var(--border)' }}>
                <div className="px-2 pt-1 text-right text-[10px]" style={{ color: 'var(--tx-3)', borderRight: '1px solid var(--border)' }}>
                  {String(hr).padStart(2, '0')}:00
                </div>
                {weekDates.map((d) => (
                  <div key={d} style={{ borderRight: '1px solid var(--border)' }} />
                ))}
              </div>
            ))}

            {/* Booking blocks — absolutely positioned over the grid */}
            <div className="absolute inset-0 pointer-events-none" style={{ gridTemplateColumns: '52px repeat(5, 1fr)', display: 'grid' }}>
              <div /> {/* time gutter */}
              {weekDates.map((d) => {
                const dayBookings = bookings.filter(b => b.date === d);
                const totalH = (HOUR_END - HOUR_START) * ROW_H;
                return (
                  <div key={d} className="relative" style={{ height: totalH, borderRight: '1px solid transparent' }}>
                    {dayBookings.length === 0 && (
                      <div
                        className="absolute inset-x-1 flex items-center justify-center text-[10px]"
                        style={{
                          top: 2, bottom: 2,
                          border: '1px dashed var(--border)',
                          borderRadius: 6,
                          color: 'var(--tx-3)',
                        }}
                      >
                        Available
                      </div>
                    )}
                    {dayBookings.map((b) => {
                      const top = timeToTop(b.start_time);
                      const height = Math.max(blockHeight(b.start_time, b.end_time), 24);
                      return (
                        <div
                          key={b.id}
                          className="absolute inset-x-1 rounded overflow-hidden pointer-events-auto"
                          style={{
                            top: top + 2,
                            height: height - 4,
                            background: 'var(--accent)',
                            padding: '4px 6px',
                          }}
                        >
                          <p className="text-[10px] font-semibold leading-tight text-white truncate">{b.course_name}</p>
                          <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            {fmt(b.start_time)}–{fmt(b.end_time)}
                          </p>
                          {b.room && height > 48 && (
                            <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.7)' }}>{b.room}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {bookings.length === 0 && (
        <p className="text-center text-sm mt-6" style={{ color: 'var(--tx-2)' }}>
          No bookings for your sections this week.
        </p>
      )}
    </div>
  );
}
