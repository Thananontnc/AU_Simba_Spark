import { auth } from '@/auth';
import sql from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Section = {
  id: number;
  course_name: string;
  course_code: string;
  credits: number;
  section_number: string;
  room: string | null;
  timeframe_label: string | null;
  timeframe_start: string | null;
  timeframe_end: string | null;
  enrolled_count: number;
  booking_count: number;
};

export default async function InstructorPage() {
  const session = await auth();
  const instructorId = parseInt(session!.user.id);

  const sections = await sql`
    SELECT
      s.id,
      c.course_name,
      c.course_code,
      c.credits,
      s.section_number,
      s.room,
      tf.label      AS timeframe_label,
      tf.start_date::text AS timeframe_start,
      tf.end_date::text   AS timeframe_end,
      COUNT(DISTINCT e.id)::int AS enrolled_count,
      COUNT(DISTINCT b.id)::int AS booking_count
    FROM sections s
    JOIN courses c ON c.id = s.course_id
    LEFT JOIN timeframes tf  ON tf.id = s.timeframe_id
    LEFT JOIN enrollments e  ON e.section_id = s.id
    LEFT JOIN bookings b     ON b.section_id = s.id
    WHERE s.instructor_id = ${instructorId}
    GROUP BY s.id, c.course_name, c.course_code, c.credits,
             s.section_number, s.room, tf.label, tf.start_date, tf.end_date
    ORDER BY s.id
  ` as Section[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--tx)' }}>My Courses</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tx-2)' }}>
          Sections assigned to you this semester.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl p-12 text-center text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}>
          No sections assigned yet. Contact your admin.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sections.map((sec) => (
            <div key={sec.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {/* Card header */}
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--subtle)' }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--tx)' }}>{sec.course_name}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'var(--border)', color: 'var(--tx-2)' }}>{sec.course_code}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--tx-2)' }}>Sec {sec.section_number}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--border)', color: 'var(--tx-2)' }}>{sec.credits} cr</span>
                  {sec.timeframe_label && (
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(245,132,31,0.12)', color: 'var(--accent)' }}>
                      {sec.timeframe_label}
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 space-y-2">
                {sec.room && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--tx-2)' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    {sec.room}
                  </div>
                )}
                {sec.timeframe_start && sec.timeframe_end && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--tx-2)' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    {sec.timeframe_start} → {sec.timeframe_end}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: 'var(--tx)' }}>{sec.enrolled_count}</p>
                    <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>Students</p>
                  </div>
                  <div className="w-px h-8" style={{ background: 'var(--border)' }} />
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{sec.booking_count}</p>
                    <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>Bookings</p>
                  </div>
                </div>
              </div>

              {/* Card footer */}
              <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                <Link href="/instructor/booking"
                  className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                  Book a slot →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
