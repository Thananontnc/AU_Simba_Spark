'use client';

import { useState, useMemo } from 'react';
import type { StudentDashboardData, Booking, EnrolledCourse } from '@/lib/types';
import { weekdaysInRange, chunkWeeks, weekColumns, timeBand } from '@/lib/date-utils';

type Props = { data: StudentDashboardData };

// Warm, eye-friendly palette — all orange-family + warm grays (no harsh colors).
// Each course gets one shade so the eye can distinguish sessions without the
// original's jarring red/purple/green/blue.
const COURSE_SHADES: Record<string, { bg: string; border: string; text: string }> = {
  default: { bg: 'rgba(245,132,31,0.14)', border: 'rgba(245,132,31,0.35)', text: '#c45f00' },
};
// Stable shade per course id (deterministic, not random on re-render).
function shadeFor(courseId: number) {
  const palette = [
    { bg: 'rgba(245,132,31,0.18)', border: 'rgba(245,132,31,0.45)', text: '#b85600' }, // deep orange
    { bg: 'rgba(232,114,13,0.16)',  border: 'rgba(232,114,13,0.4)',  text: '#9a4a00' }, // burnt orange
    { bg: 'rgba(245,168,80,0.18)',  border: 'rgba(245,168,80,0.45)', text: '#a85a10' }, // warm amber
    { bg: 'rgba(210,138,90,0.16)',  border: 'rgba(210,138,90,0.4)',  text: '#7a3f12' }, // warm clay
  ];
  return palette[courseId % palette.length];
}

export default function TimetableGrid({ data }: Props) {
  const { currentBlock, enrolledCourses } = data;
  const [weekIdx, setWeekIdx] = useState(0); // which of the 2 weeks to show
  const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  if (!currentBlock || weeks.length === 0) {
    return (
      <section className="card-premium p-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>Timetable</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--tx-2)' }}>No active block schedule.</p>
      </section>
    );
  }

  const currentWeek = weeks[weekIdx] ?? [];
  const columns = weekColumns(currentWeek); // Sun..Sat, nulls for weekends

  // Build a set of unique time bands across the week (the row labels).
  const rowBands = useMemo(() => {
    const set = new Set<string>();
    currentWeek.forEach((iso) =>
      allBookings
        .filter((b) => b.date === iso)
        .forEach((b) => set.add(`${b.startTime}-${b.endTime}`)),
    );
    return Array.from(set).sort();
  }, [currentWeek, allBookings]);

  function bookingsAt(iso: string, band: string): Booking[] {
    return allBookings.filter((b) => b.date === iso && `${b.startTime}-${b.endTime}` === band);
  }

  return (
    <section className="card-premium p-4 sm:p-5 animate-fade-in">
      {/* Header: week switcher */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>Timetable</h2>
          <p className="text-xs" style={{ color: 'var(--tx-2)' }}>
            Week {weekIdx + 1} of {weeks.length} · tap a card for details
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}>
          {weeks.map((_, i) => (
            <button
              key={i}
              onClick={() => setWeekIdx(i)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
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

      {/* Grid: header row (Sun..Sat) */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `60px repeat(7, minmax(0, 1fr))` }}>
        <div /> {/* corner */}
        {columns.map((col, i) => (
          <div key={i} className="text-center py-1.5">
            {col ? (
              <button
                onClick={() => setSelectedDate(selectedDate === col.iso ? null : col.iso)}
                className="w-full"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-2)' }}>
                  {col.dayName}
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--tx)' }}>
                  {col.iso.split('-')[2]}
                </p>
              </button>
            ) : (
              <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>—</p>
            )}
          </div>
        ))}

        {/* Rows: one per time band */}
        {rowBands.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm" style={{ color: 'var(--tx-2)' }}>
            No sessions scheduled this week.
          </div>
        )}

        {rowBands.map((band) => {
          const [start, end] = band.split('-');
          return (
            <FragmentRow key={band}>
              {/* Time label */}
              <div className="flex items-start justify-end pr-1 pt-1.5">
                <span className="text-[10px] font-medium text-right" style={{ color: 'var(--tx-3)' }}>
                  {start}
                </span>
              </div>
              {columns.map((col, ci) => {
                if (!col) return <WeekendCell key={ci} />;
                const cellBookings = bookingsAt(col.iso, band);
                if (cellBookings.length === 0) return <EmptyCell key={ci} selected={selectedDate === col.iso} />;
                return cellBookings.map((b) => {
                  const ec = courseBySectionId.get(b.sectionId)!;
                  const shade = shadeFor(ec.course.id);
                  const isHovered = hoveredCourseId === ec.course.id;
                  const isExpanded = expandedId === b.id;
                  return (
                    <TimetableCard
                      key={b.id}
                      booking={b}
                      ec={ec}
                      shade={shade}
                      isHovered={isHovered}
                      isExpanded={isExpanded}
                      onHover={setHoveredCourseId}
                      onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    />
                  );
                });
              })}
            </FragmentRow>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-[11px]" style={{ color: 'var(--tx-2)' }}>
        <LegendDot color="var(--accent)" label="Block session" />
        <LegendDot color="var(--border)" label="Available slot" hollow />
        <LegendDot color="var(--accent-2)" label="Admin override" pulse />
      </div>
    </section>
  );
}

/** A single timetable cell card. */
function TimetableCard({
  booking,
  ec,
  shade,
  isHovered,
  isExpanded,
  onHover,
  onToggle,
}: {
  booking: Booking;
  ec: EnrolledCourse;
  shade: { bg: string; border: string; text: string };
  isHovered: boolean;
  isExpanded: boolean;
  onHover: (id: number | null) => void;
  onToggle: () => void;
}) {
  const isOverride = !!booking.adminOverride;
  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => onHover(ec.course.id)}
      onMouseLeave={() => onHover(null)}
      className={[
        'rounded-md p-1.5 cursor-pointer transition-all duration-150 select-none',
        isHovered ? 'block-glow' : '',
        isOverride ? 'block-override' : '',
      ].join(' ')}
      style={{
        background: isOverride ? 'rgba(245,132,31,0.24)' : shade.bg,
        border: `1px solid ${isOverride ? 'var(--accent)' : shade.border}`,
        minHeight: 44,
      }}
      title={`${ec.course.courseName} · ${timeBand(booking.startTime, booking.endTime)}`}
    >
      <p className="text-[10px] font-bold truncate" style={{ color: shade.text }}>
        {ec.course.courseCode}
      </p>
      <p className="text-[9px] truncate" style={{ color: 'var(--tx-2)' }}>
        {booking.startTime}
      </p>

      {/* Expanded inline detail */}
      <div
        className="expand-panel"
        style={{
          maxHeight: isExpanded ? 100 : 0,
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? 6 : 0,
        }}
      >
        <div className="pt-1.5 space-y-0.5" style={{ borderTop: `1px solid ${shade.border}` }}>
          <p className="text-[9px]" style={{ color: 'var(--tx-2)' }}>
            {ec.section.instructorName ?? 'TBA'}
          </p>
          <p className="text-[9px]" style={{ color: 'var(--tx-2)' }}>
            {booking.room ?? ec.section.room ?? 'TBA'}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Row fragment that renders its children inline in the CSS grid. */
function FragmentRow({ children }: { children: React.ReactNode }) {
  // React fragments don't accept a style/gridColumn, but our grid is set on the
  // parent with the column template; children just lay out in source order.
  return <>{children}</>;
}

function WeekendCell() {
  return (
    <div
      className="rounded-md flex items-center justify-center"
      style={{ background: 'var(--subtle)', border: '1px dashed var(--border)', minHeight: 44 }}
    >
      <span className="text-[9px]" style={{ color: 'var(--tx-3)' }}>wknd</span>
    </div>
  );
}

function EmptyCell({ selected }: { selected: boolean }) {
  return (
    <div
      className="rounded-md flex items-center justify-center"
      style={{
        background: selected ? 'rgba(245,132,31,0.05)' : 'var(--subtle)',
        border: `1px dashed ${selected ? 'rgba(245,132,31,0.3)' : 'var(--border)'}`,
        minHeight: 44,
      }}
    >
      <span className="text-[9px]" style={{ color: 'var(--tx-3)' }}>·</span>
    </div>
  );
}

function LegendDot({ color, label, hollow, pulse }: { color: string; label: string; hollow?: boolean; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={['inline-block w-2.5 h-2.5 rounded-sm', pulse ? 'block-override' : ''].join(' ')}
        style={{ background: hollow ? 'transparent' : color, border: `1px solid ${color}` }}
      />
      {label}
    </span>
  );
}
