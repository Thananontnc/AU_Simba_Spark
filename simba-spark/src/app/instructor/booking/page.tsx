import { auth } from '@/auth';
import sql from '@/lib/db';
import BookingClient from './booking-client';

export const dynamic = 'force-dynamic';

type Section = {
  id: number;
  course_name: string;
  course_code: string;
  section_number: string;
  room: string | null;
  timeframe_label: string | null;
};

type Booking = {
  id: number;
  section_id: number;
  course_name: string;
  section_number: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  created_at: string;
};

export default async function BookingPage() {
  const session = await auth();
  const instructorId = parseInt(session!.user.id);

  const [sections, bookings] = await Promise.all([
    sql`
      SELECT
        s.id,
        c.course_name,
        c.course_code,
        s.section_number,
        s.room,
        tf.label AS timeframe_label
      FROM sections s
      JOIN courses c ON c.id = s.course_id
      LEFT JOIN timeframes tf ON tf.id = s.timeframe_id
      WHERE s.instructor_id = ${instructorId}
      ORDER BY s.id
    `,
    sql`
      SELECT
        b.id,
        b.section_id,
        c.course_name,
        s.section_number,
        b.date::text,
        b.start_time::text,
        b.end_time::text,
        b.room,
        b.created_at::text
      FROM bookings b
      JOIN sections s ON s.id = b.section_id
      JOIN courses c  ON c.id = s.course_id
      WHERE s.instructor_id = ${instructorId}
      ORDER BY b.date DESC, b.start_time DESC
    `,
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--tx)' }}>Book a Slot</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tx-2)' }}>
          First come, first serve — earlier bookings always win conflicts.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-xl p-12 text-center text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--tx-2)' }}>
          No sections assigned. Contact your admin before booking.
        </div>
      ) : (
        <BookingClient
          sections={sections as Section[]}
          bookings={bookings as Booking[]}
        />
      )}
    </div>
  );
}
