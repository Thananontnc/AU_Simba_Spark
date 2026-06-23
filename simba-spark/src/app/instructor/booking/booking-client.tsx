'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking, deleteBooking } from '@/app/actions/instructor';

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

const inp = 'w-full rounded-lg px-3 py-2 text-sm outline-none';
const inpStyle = { background: 'var(--subtle)', border: '1px solid var(--border)', color: 'var(--tx)' } as React.CSSProperties;

function fmt(t: string) {
  return t.slice(0, 5); // "09:00:00" → "09:00"
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg px-3.5 py-2.5 text-xs"
      style={{
        background: type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        color: type === 'success' ? '#16a34a' : '#ef4444',
      }}>
      {type === 'success'
        ? <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {msg}
    </div>
  );
}

export default function BookingClient({ sections, bookings }: { sections: Section[]; bookings: Booking[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(sections[0]?.id ?? 0);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [bookPending, startBook] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const selectedSection = sections.find(s => s.id === selectedId);
  const sectionBookings = bookings.filter(b => b.section_id === selectedId);

  function handleBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAlert(null);
    startBook(async () => {
      const result = await createBooking(new FormData(e.currentTarget));
      if (result.error) {
        setAlert({ type: 'error', msg: result.error });
        return;
      }
      setAlert({ type: 'success', msg: 'Slot booked successfully.' });
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this booking?')) return;
    startDelete(async () => {
      const fd = new FormData();
      fd.append('id', String(id));
      await deleteBooking(fd);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">

      {/* Section tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => { setSelectedId(sec.id); setAlert(null); }}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: selectedId === sec.id ? 'var(--accent)' : 'var(--surface)',
              color: selectedId === sec.id ? 'var(--accent-fg)' : 'var(--tx-2)',
              border: `1px solid ${selectedId === sec.id ? 'transparent' : 'var(--border)'}`,
            }}
          >
            {sec.course_code} — Sec {sec.section_number}
          </button>
        ))}
      </div>

      {/* Conflict Alert Area */}
      {alert && <Alert type={alert.type} msg={alert.msg} />}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Booking form */}
        <div className="lg:col-span-2 rounded-xl p-5 h-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="font-semibold text-sm mb-4" style={{ color: 'var(--tx)' }}>New Booking</p>
          <form onSubmit={handleBook} className="space-y-3">
            <input type="hidden" name="section_id" value={selectedId} />

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--tx-2)' }}>Date</label>
              <input name="date" type="date" required
                className={inp} style={inpStyle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--tx-2)' }}>Start Time</label>
                <input name="start_time" type="time" required
                  className={inp} style={inpStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--tx-2)' }}>End Time</label>
                <input name="end_time" type="time" required
                  className={inp} style={inpStyle} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--tx-2)' }}>
                Room
                {selectedSection?.room && (
                  <span className="ml-1 font-normal" style={{ color: 'var(--tx-3)' }}>(default: {selectedSection.room})</span>
                )}
              </label>
              <input name="room" type="text"
                defaultValue={selectedSection?.room ?? ''}
                placeholder="e.g. Room A72"
                className={inp} style={inpStyle} />
            </div>

            <button type="submit" disabled={bookPending}
              className="w-full py-2.5 rounded-lg text-sm font-medium mt-1"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)', opacity: bookPending ? 0.6 : 1 }}>
              {bookPending ? 'Checking conflicts…' : 'Book Slot'}
            </button>
          </form>

          {/* Section info */}
          {selectedSection && (
            <div className="mt-4 pt-4 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tx-3)' }}>Selected Section</p>
              <p className="text-xs" style={{ color: 'var(--tx-2)' }}>
                <span style={{ color: 'var(--tx)' }}>{selectedSection.course_name}</span>
              </p>
              {selectedSection.timeframe_label && (
                <p className="text-xs" style={{ color: 'var(--tx-2)' }}>Block: {selectedSection.timeframe_label}</p>
              )}
              {selectedSection.room && (
                <p className="text-xs" style={{ color: 'var(--tx-2)' }}>Default room: {selectedSection.room}</p>
              )}
            </div>
          )}
        </div>

        {/* Existing bookings */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden h-fit" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="font-semibold text-sm" style={{ color: 'var(--tx)' }}>
              Existing Bookings
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tx-2)' }}>
              {sectionBookings.length} booking{sectionBookings.length !== 1 ? 's' : ''} for this section
            </p>
          </div>

          {sectionBookings.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm" style={{ color: 'var(--tx-2)' }}>
              No bookings yet. Book your first slot on the left.
            </p>
          ) : (
            <div>
              {sectionBookings.map((b, i) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: 'var(--tx)' }}>{fmtDate(b.date)}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'rgba(245,132,31,0.12)', color: 'var(--accent)' }}>
                        {fmt(b.start_time)} – {fmt(b.end_time)}
                      </span>
                    </div>
                    {b.room && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--tx-2)' }}>{b.room}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deletePending}
                    className="text-xs font-medium shrink-0"
                    style={{ color: '#ef4444', opacity: deletePending ? 0.5 : 1 }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
