'use client';

import { useState, useMemo } from 'react';
import type { StudentDashboardData, Booking, EnrolledCourse } from '@/lib/types';
import { weekdaysInRange, chunkWeeks, weekColumns, timeBand } from '@/lib/date-utils';

type Props = { data: StudentDashboardData };

// ────────────────────────────────────────────────────────────────────────────
// RIGID HOURLY GRID — rows are every hour from 09:00 to 15:00. This makes time
// GAPS between classes visible as faint empty cells (a class at 09:00–10:30
// leaves 10:00 + 10:30 + half of 11:00 as free time). Real-timetable behavior.
// ────────────────────────────────────────────────────────────────────────────
const HOURS = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30', '21:00'] as const;

// Stable warm-orange shade per time band (same time = same color).
function shadeForTime(startTime: string) {
  const hour = parseInt(startTime.split(':')[0], 10) || 0;
  
  // Strict time-based horizontal color mapping
  if (hour <= 10) {
    return { bg: '#FF6B00', text: '#FFFFFF' }; // 09:00 - Vibrant orange
  } else if (hour >= 11 && hour <= 13) {
    return { bg: '#FF944D', text: '#FFFFFF' }; // 11:00 - Softer, lighter coral/peach
  } else {
    return { bg: '#C25100', text: '#FFFFFF' }; // 14:00+ - Deep rich burnt-orange
  }
}

export default function TimetableGrid({ data }: Props) {
  const { currentBlock, enrolledCourses } = data;
  const [weekIdx, setWeekIdx] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'lecture' | 'lab'>('all');

  const blockDays = useMemo(
    () => (currentBlock ? weekdaysInRange(currentBlock.startDate, currentBlock.endDate) : []),
    [currentBlock],
  );
  const weeks = useMemo(() => chunkWeeks(blockDays), [blockDays]);

  const courseBySectionId = useMemo(() => {
    const m = new Map<number, EnrolledCourse>();
    enrolledCourses.forEach((ec) => m.set(ec.section.id, ec));
    return m;
  }, [enrolledCourses]);

  const allBookings = useMemo(
    () => enrolledCourses.flatMap((ec) => ec.bookings),
    [enrolledCourses],
  );

  // "Now" context — drives the in-session highlight.
  const nowIso = new Date().toISOString().slice(0, 10);
  const nowMin = minutesNow();

  if (!currentBlock || weeks.length === 0) {
    return (
      <section className="card-premium p-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>Timetable</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--tx-2)' }}>No active block schedule.</p>
      </section>
    );
  }



  const renderGrid = (wIdx: number) => {
    const wWeek = weeks[wIdx] ?? [];
    const wColumns = weekColumns(wWeek);

    return (
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `48px repeat(7, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${HOURS.length}, minmax(56px, auto))`,
        }}
      >
        {/* Header row: corner + day columns */}
        <div style={{ gridColumn: 1, gridRow: 1 }} />
        {wColumns.map((col, i) => {
          const isToday = col?.iso === nowIso;
          return (
            <div
              key={i}
              className="text-center pb-2 select-none"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              {col ? (
                <>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: isToday ? 'var(--accent-2)' : 'var(--tx-3)' }}
                  >
                    {col.dayName}
                  </p>
                  <p
                    className="text-xs font-bold mt-0.5 inline-flex items-center justify-center min-w-[24px] h-6 rounded-lg px-1.5"
                    style={{
                      color: isToday ? 'var(--accent-fg)' : 'var(--tx)',
                      background: isToday ? 'var(--accent)' : 'transparent',
                    }}
                  >
                    {col.iso.split('-')[2]}
                  </p>
                </>
              ) : (
                <p className="text-[10px] pt-2" style={{ color: 'var(--tx-3)', opacity: 0.4 }}>
                  {i === 0 ? 'Sun' : 'Sat'}
                </p>
              )}
            </div>
          );
        })}

        {/* Body: one row per hour */}
        {HOURS.map((hour, hIdx) => {
          const gridRow = hIdx + 2;
          return (
            <RowFragment key={hour}>
              {/* Hour label */}
              <div
                className="flex items-start justify-end pr-2 pt-1.5 select-none"
                style={{ gridColumn: 1, gridRow }}
              >
                <span className="text-[10px] font-medium" style={{ color: 'var(--tx-3)' }}>
                  {hour}
                </span>
              </div>

              {wColumns.map((col, ci) => {
                const gridCol = ci + 2;
                if (!col) {
                  return <WeekendCell key={ci} gridCol={gridCol} gridRow={gridRow} />;
                }

                const isToday = col.iso === nowIso;

                // Check if this hour slot overlaps with any booking on this day
                const slotStart = toMin(hour);
                const slotEnd = slotStart + 90;

                const dayBookings = allBookings.filter((b) => b.date === col.iso);
                const overlappingBooking = dayBookings.find((b) => {
                  const bStart = toMin(b.startTime);
                  const bEnd = toMin(b.endTime);
                  return slotStart < bEnd && bStart < slotEnd;
                });

                if (!overlappingBooking) {
                  return <EmptyCell key={ci} isToday={isToday} gridCol={gridCol} gridRow={gridRow} />;
                }

                // If overlapping booking exists, find all hours in HOURS that overlap with it
                const overlappingHours = HOURS.filter((h) => {
                  const hStart = toMin(h);
                  const hEnd = hStart + 90;
                  const bStart = toMin(overlappingBooking.startTime);
                  const bEnd = toMin(overlappingBooking.endTime);
                  return hStart < bEnd && bStart < hEnd;
                });

                // Only render the card in the FIRST overlapping hour slot
                if (hour === overlappingHours[0]) {
                  const ec = courseBySectionId.get(overlappingBooking.sectionId)!;
                  const span = overlappingHours.length;
                  const inSession =
                    isToday &&
                    nowMin >= toMin(overlappingBooking.startTime) &&
                    nowMin < toMin(overlappingBooking.endTime);

                  return (
                    <TimetableCard
                      key={overlappingBooking.id}
                      booking={overlappingBooking}
                      ec={ec}
                      shade={shadeForTime(overlappingBooking.startTime)}
                      span={span}
                      isExpanded={expandedId === overlappingBooking.id}
                      isToday={isToday}
                      inSession={inSession}
                      onToggle={() => setExpandedId(expandedId === overlappingBooking.id ? null : overlappingBooking.id)}
                      matchesFilter={activeFilter === 'all' || overlappingBooking.type === activeFilter}
                      gridCol={gridCol}
                      gridRow={gridRow}
                    />
                  );
                }

                // For subsequent overlapping slots, return null (it will be filled by the spanned card)
                return null;
              })}
            </RowFragment>
          );
        })}
      </div>
    );
  };

  return (
    <section
      id="schedule"
      className="card-premium p-4 sm:p-6 scroll-mt-20 animate-fade-in"
    >
      {/* Subtle Segmented Filter Controls */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Filter View
        </span>
        <div 
          className="flex items-center gap-1 rounded-xl p-1" 
          style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}
        >
          {(['all', 'lecture', 'lab'] as const).map((filterOpt) => (
            <button
              key={filterOpt}
              onClick={() => setActiveFilter(filterOpt)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 ease-in-out cursor-pointer border-none"
              style={{
                background: activeFilter === filterOpt ? 'var(--accent)' : 'transparent',
                color: activeFilter === filterOpt ? 'var(--accent-fg)' : 'var(--tx-2)',
              }}
            >
              {filterOpt === 'all' ? 'All' : filterOpt === 'lecture' ? 'Lectures Only' : 'Labs Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>Timetable</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tx-2)' }}>
            Week {weekIdx + 1} of {weeks.length} · Mon–Fri · empty cells = free time
          </p>
        </div>
        {/* Week toggle — orange fill ONLY on active button */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}>
          {weeks.map((_, i) => (
            <button
              key={i}
              onClick={() => setWeekIdx(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: weekIdx === i ? 'var(--accent)' : 'transparent',
                color: weekIdx === i ? 'var(--accent-fg)' : 'var(--tx-2)',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              W{i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Week slider container with horizontal slide transition */}
      <div className="overflow-hidden w-full relative">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            width: `${weeks.length * 100}%`,
            transform: `translateX(-${weekIdx * (100 / weeks.length)}%)`,
          }}
        >
          {weeks.map((_, i) => (
            <div
              key={i}
              className="shrink-0 transition-opacity duration-300 ease-in-out"
              style={{
                width: `${100 / weeks.length}%`,
                opacity: weekIdx === i ? 1 : 0.4,
              }}
            >
              {renderGrid(i)}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

/**
 * Course card. Orange appears ONLY as a solid fill here. The in-session card
 * gets `.block-now` (full solid orange); others use a softer translucent fill.
 * Card height scales with its time span (90-min class → 2 hour-rows tall).
 */
function TimetableCard({
  booking,
  ec,
  shade,
  span,
  isExpanded,
  isToday,
  inSession,
  onToggle,
  matchesFilter,
  gridCol,
  gridRow,
}: {
  booking: Booking;
  ec: EnrolledCourse;
  shade: { bg: string; text: string };
  span: number;
  isExpanded: boolean;
  isToday: boolean;
  inSession: boolean;
  onToggle: () => void;
  matchesFilter: boolean;
  gridCol: number;
  gridRow: number;
}) {
  const isOverride = !!booking.adminOverride;
  const fill = shade.bg;

  return (
    <div
      onClick={onToggle}
      className={[
        'rounded-xl p-2.5 cursor-pointer transition-all duration-300 ease-in-out select-none',
        'hover:-translate-y-1',
        'border',
        'hover:shadow-md hover:shadow-orange-500/[0.06]',
        inSession || isOverride
          ? 'border-[var(--accent)]'
          : 'border-[var(--border)] hover:border-[#FF7A1A]/50 dark:hover:border-[#FF6B00]/60',
        isOverride ? 'block-override' : '',
        inSession ? 'block-now ring-2 ring-orange-400/50 animate-pulse' : '',
        matchesFilter ? 'opacity-100 scale-100' : 'opacity-30 scale-[0.98] pointer-events-none',
      ].join(' ')}
      style={{
        background: fill,
        gridColumn: gridCol,
        gridRow: `${gridRow} / span ${span}`,
        // Span multiple hour-rows: each row ~ 56px + 4px gap.
        minHeight: span * 56 + (span - 1) * 4,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
      }}
      title={`${ec.course.courseName} · ${timeBand(booking.startTime, booking.endTime)}`}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        {/* Primary: The Course Code (e.g., CS101) must be the most prominent element—bold and crisp white (text-white) */}
        <span className="block-now__code text-sm font-bold tracking-tight text-white drop-shadow-sm">
          {ec.course.courseCode}
        </span>
        {inSession && (
          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/25 text-[#FFF5EB] shrink-0 border border-white/20">
            Now
          </span>
        )}
      </div>
      
      {/* Secondary: The Course Title should be slightly smaller in font size with a very high opacity (text-white/90) */}
      <p className="block-now__name text-[11px] font-semibold leading-snug text-white/90 drop-shadow-sm">
        {ec.course.courseName}
      </p>
      
      {/* Tertiary: Time Slots must be rendered in a smaller, lighter font weight with lowered opacity (text-white/70) */}
      <p className="block-now__time text-[9px] font-light mt-1.5 text-white/70 drop-shadow-sm">
        {booking.startTime}–{booking.endTime}
      </p>

      {/* Expand panel */}
      <div
        className="expand-panel"
        style={{
          maxHeight: isExpanded ? 120 : 0,
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? 8 : 0,
        }}
      >
        <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
          {/* Tertiary: Supporting Room Numbers and Instructor rendered in a smaller, lighter font weight with lowered opacity (text-white/70) */}
          <DetailRow label="Room" value={booking.room ?? ec.section.room ?? 'TBA'} />
          <DetailRow label="Instructor" value={ec.section.instructorName ?? 'TBA'} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-light text-white/70">{label}</span>
      <span className="text-[10px] font-light text-right truncate drop-shadow-sm text-white/70">{value}</span>
    </div>
  );
}

/** Row of grid cells laid out inline (time label + 7 day cells). */
function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Weekend — ultra-faint, clearly not a teaching day. */
function WeekendCell({ gridCol, gridRow }: { gridCol: number; gridRow: number }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center"
      style={{
        background: 'var(--empty-cell-bg)',
        border: '1px solid var(--empty-cell-border)',
        minHeight: 52,
        gridColumn: gridCol,
        gridRow: gridRow,
      }}
    >
      <span className="text-[9px]" style={{ color: 'var(--tx-3)', opacity: 0.35 }}>—</span>
    </div>
  );
}

/** Empty cell — clean hollow free-time placeholder. Transitioning container with dash / Free + icons cross-fading */
function EmptyCell({ isToday, gridCol, gridRow }: { isToday: boolean; gridCol: number; gridRow: number }) {
  return (
    <div
      className="rounded-xl transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center group relative min-h-[52px] hover:bg-orange-500/[0.04] dark:hover:bg-orange-500/[0.03] hover:border-[#FF6B00]/30 dark:hover:border-[#FF6B00]/20"
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isToday ? 'var(--empty-cell-border-today)' : 'var(--empty-cell-border)',
        gridColumn: gridCol,
        gridRow: gridRow,
      }}
    >
      {/* Simple dash showing when not hovered, fades out on hover */}
      <span className="absolute text-[9px] text-zinc-300 dark:text-zinc-700 opacity-100 group-hover:opacity-0 transition-opacity duration-300 ease-in-out select-none">
        —
      </span>

      {/* Subtle indicator that fades in on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out select-none">
        <svg className="w-3 h-3 text-[#FF6B00] dark:text-[#FF944D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span className="text-[9px] font-bold text-[#FF6B00] dark:text-[#FF944D] tracking-wider uppercase">
          Free
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function minutesNow(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
