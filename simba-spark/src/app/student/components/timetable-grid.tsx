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
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

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

  // Timezone-safe local ISO date and "Now" minutes
  const nowIso = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const nowMin = useMemo(() => minutesNow(), []);

  const todayWeekIdx = useMemo(() => {
    return weeks.findIndex((week) => week.includes(nowIso));
  }, [weeks, nowIso]);

  const handleDayClick = (iso: string) => {
    if (selectedDayIso === iso) {
      setSelectedDayIso(null);
    } else {
      setSelectedDayIso(iso);
    }
  };

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
          if (!col) {
            return (
              <div
                key={i}
                className="text-center pb-2 select-none opacity-30 flex flex-col items-center justify-center pt-2"
                style={{ gridColumn: i + 2, gridRow: 1 }}
              >
                <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>
                  {i === 0 ? 'Sun' : 'Sat'}
                </p>
              </div>
            );
          }

          const isToday = col.iso === nowIso;
          const isSelected = selectedDayIso === col.iso;

          // Header button styling based on state
          let dateClass = 'border-transparent text-[var(--tx)] bg-transparent group-hover:border-orange-500/30';
          let labelClass = 'text-[var(--tx-3)] group-hover:text-[var(--accent)]';

          if (isSelected) {
            dateClass = 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent';
            labelClass = 'text-[var(--accent-2)]';
          } else if (isToday) {
            dateClass = 'border-[var(--accent)] text-[var(--accent)] bg-transparent';
            labelClass = 'text-[var(--accent)]';
          }

          return (
            <button
              key={col.iso}
              onClick={() => handleDayClick(col.iso)}
              className="w-full flex flex-col items-center justify-center py-2 active:scale-[0.97] cursor-pointer select-none focus:outline-none group transition-all duration-300"
              style={{
                gridColumn: i + 2,
                gridRow: 1,
                opacity: selectedDayIso !== null && !isSelected ? 0.35 : 1,
              }}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 ${labelClass}`}
              >
                {col.dayName}
              </p>
              <p
                className={`text-xs font-bold mt-0.5 inline-flex items-center justify-center min-w-[24px] h-6 rounded-lg px-1.5 border transition-all duration-300 group-hover:scale-105 ${dateClass}`}
              >
                {col.iso.split('-')[2]}
              </p>
            </button>
          );
        })}

        {/* Body: one row per hour */}
        {HOURS.map((hour, hIdx) => {
          const gridRow = hIdx + 2;
          return (
            <RowFragment key={hour}>
              {/* Hour label */}
              <div
                className="flex items-start justify-end pr-2.5 pt-1.5 select-none"
                style={{ gridColumn: 1, gridRow }}
              >
                <span className="text-[11px] font-bold text-black dark:text-zinc-100">
                  {hour}
                </span>
              </div>

              {wColumns.map((col, ci) => {
                const gridCol = ci + 2;
                if (!col) {
                  return <WeekendCell key={ci} gridCol={gridCol} gridRow={gridRow} isDimmed={selectedDayIso !== null} />;
                }

                const isToday = col.iso === nowIso;
                const isSelected = selectedDayIso === col.iso;
                const isDimmed = selectedDayIso !== null && !isSelected;

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
                  return <EmptyCell key={ci} isToday={isToday} gridCol={gridCol} gridRow={gridRow} isDimmed={isDimmed} />;
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
                      isDimmed={isDimmed}
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedDayIso(null)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300 ease-in-out cursor-pointer hover:text-[var(--tx)] hover:border-orange-500/30"
            style={{
              background: selectedDayIso === null ? 'var(--accent)' : 'transparent',
              borderColor: selectedDayIso === null ? 'var(--accent)' : 'var(--border)',
              color: selectedDayIso === null ? 'var(--accent-fg)' : 'var(--tx-3)',
              opacity: selectedDayIso === null ? 1 : 0.5,
            }}
          >
            All
          </button>
          <button
            onClick={() => {
              setSelectedDayIso(nowIso);
              if (todayWeekIdx !== -1) {
                setWeekIdx(todayWeekIdx);
              }
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300 ease-in-out cursor-pointer hover:text-[var(--tx)] hover:border-orange-500/30"
            style={{
              background: selectedDayIso === nowIso ? 'var(--accent)' : 'transparent',
              borderColor: selectedDayIso === nowIso ? 'var(--accent)' : 'var(--border)',
              color: selectedDayIso === nowIso ? 'var(--accent-fg)' : 'var(--tx-3)',
              opacity: selectedDayIso === nowIso ? 1 : 0.5,
            }}
          >
            Today
          </button>
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
              onClick={() => {
                setWeekIdx(i);
                setSelectedDayIso(null);
              }}
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
  isDimmed,
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
  isDimmed: boolean;
  gridCol: number;
  gridRow: number;
}) {
  const isOverride = !!booking.adminOverride;
  const fill = shade.bg;

  return (
    <div
      onClick={onToggle}
      className={[
        'rounded-xl p-3.5 cursor-pointer transition-all duration-300 ease-in-out select-none flex flex-col justify-between',
        'hover:-translate-y-1',
        'border',
        inSession || isOverride
          ? 'border-[var(--accent)]'
          : 'border-[var(--border)] hover:border-[#FF7A1A]/50 dark:hover:border-[#FF6B00]/60',
        isOverride ? 'block-override' : '',
        inSession ? 'block-now ring-2 ring-orange-400/50' : '',
        isDimmed ? 'opacity-15 scale-[0.98] pointer-events-none blur-[0.5px]' : 'opacity-100 scale-100',
      ].join(' ')}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.2) 100%), ${fill}`,
        gridColumn: gridCol,
        gridRow: `${gridRow} / span ${span}`,
        // Span multiple hour-rows: each row ~ 56px + 4px gap.
        minHeight: span * 56 + (span - 1) * 4,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.25)',
      }}
      title={`${ec.course.courseName} · ${timeBand(booking.startTime, booking.endTime)}`}
    >
      <div className="w-full">
        <div className="flex items-start justify-between gap-1 mb-1">
          {/* Primary: The Course Code (e.g., CS101) must be the most prominent element—bold and crisp white */}
          <span 
            className="block-now__code text-sm font-extrabold tracking-wide text-white"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
          >
            {ec.course.courseCode}
          </span>
          {inSession && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/35 text-white shrink-0 border border-white/20">
              Now
            </span>
          )}
        </div>
        
        {/* Secondary: The Course Title should be slightly smaller in font size with a very high opacity (text-white) */}
        <p 
          className="block-now__name text-xs font-bold leading-snug text-white"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}
        >
          {ec.course.courseName}
        </p>
      </div>
      
      {/* Tertiary: Time Slots must be rendered in a smaller, lighter font weight with lowered opacity */}
      <div className="mt-2.5">
        <p 
          className="block-now__time text-[10.5px] font-bold text-white/95 flex items-center gap-1 shrink-0"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        >
          <svg className="w-3.5 h-3.5 inline shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
          <div className="pt-2 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.3)' }}>
            <DetailRow label="Room" value={booking.room ?? ec.section.room ?? 'TBA'} />
            <DetailRow label="Instructor" value={ec.section.instructorName ?? 'TBA'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] font-semibold text-white/90">{label}</span>
      <span className="text-[11px] font-bold text-right truncate text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{value}</span>
    </div>
  );
}

/** Row of grid cells laid out inline (time label + 7 day cells). */
function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/** Weekend — ultra-faint, clearly not a teaching day. */
function WeekendCell({ gridCol, gridRow, isDimmed }: { gridCol: number; gridRow: number; isDimmed: boolean }) {
  return (
    <div
      className="rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out"
      style={{
        background: 'var(--empty-cell-bg)',
        border: '1px solid var(--empty-cell-border)',
        minHeight: 52,
        gridColumn: gridCol,
        gridRow: gridRow,
        opacity: isDimmed ? 0.15 : 1,
        filter: isDimmed ? 'blur(0.5px)' : 'none',
        pointerEvents: isDimmed ? 'none' : 'auto',
      }}
    >
      <span className="text-[9px]" style={{ color: 'var(--tx-3)', opacity: 0.35 }}>—</span>
    </div>
  );
}

/** Empty cell — clean hollow free-time placeholder. Transitioning container with dash / Free + icons cross-fading */
function EmptyCell({ isToday, gridCol, gridRow, isDimmed }: { isToday: boolean; gridCol: number; gridRow: number; isDimmed: boolean }) {
  return (
    <div
      className="rounded-xl transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center group relative min-h-[52px] hover:bg-orange-500/[0.04] dark:hover:bg-orange-500/[0.03] hover:border-[#FF6B00]/30 dark:hover:border-[#FF6B00]/20"
      style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: isToday ? 'var(--empty-cell-border-today)' : 'var(--empty-cell-border)',
        gridColumn: gridCol,
        gridRow: gridRow,
        opacity: isDimmed ? 0.15 : 1,
        filter: isDimmed ? 'blur(0.5px)' : 'none',
        pointerEvents: isDimmed ? 'none' : 'auto',
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
