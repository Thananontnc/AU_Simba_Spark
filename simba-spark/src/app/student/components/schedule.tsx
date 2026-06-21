'use client';

import { useState, useMemo } from 'react';
import type { StudentDashboardData, Booking, EnrolledCourse } from '@/lib/types';
import {
  weekdaysInRange,
  chunkWeeks,
  shortDayLabel,
  weekdayName,
  monthLabel,
  monthMatrix,
  isWithin,
  timeBand,
} from '@/lib/date-utils';

type View = 'weekly' | 'monthly';

type Props = { data: StudentDashboardData };

export default function Schedule({ data }: Props) {
  const { currentBlock, enrolledCourses } = data;

  // --- Interaction state -----------------------------------------------------
  const [view, setView] = useState<View>('weekly');
  // Hovering any session highlights ALL sessions of that course (continuity).
  const [hoveredCourseId, setHoveredCourseId] = useState<number | null>(null);
  // Tapping a session expands it to reveal instructor + room.
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // The 10 weekday ISO dates of the current block (Mon–Fri × 2).
  const blockDays = useMemo(
    () =>
      currentBlock
        ? weekdaysInRange(currentBlock.startDate, currentBlock.endDate)
        : [],
    [currentBlock],
  );

  // Flatten all sessions across courses for quick lookup.
  const allBookings = useMemo(
    () => enrolledCourses.flatMap((ec) => ec.bookings),
    [enrolledCourses],
  );

  // Build a { courseId -> EnrolledCourse } map for resolving a booking to its
  // course/section metadata in O(1).
  const courseBySectionId = useMemo(() => {
    const m = new Map<number, EnrolledCourse>();
    enrolledCourses.forEach((ec) => m.set(ec.section.id, ec));
    return m;
  }, [enrolledCourses]);

  if (!currentBlock || blockDays.length === 0) {
    return (
      <EmptyState copy="You have no active block schedule. Check back once your enrollment is confirmed." />
    );
  }

  return (
    <section
      id="schedule"
      className="card-premium p-5 sm:p-6 scroll-mt-20 animate-fade-in"
    >
      {/* Header: title + instructional copy + legend + view toggle */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>
              Personalized Schedule
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--tx-2)' }}>
              Your continuous 10-day block course —{' '}
              <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>
                {currentBlock.label}
              </span>
              . Hover a block to trace its track, tap a session for details.
            </p>
          </div>

          {/* View toggle: weekly ↔ monthly */}
          <div
            className="flex items-center gap-1 rounded-lg p-1 shrink-0"
            style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}
          >
            {(['weekly', 'monthly'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
                style={{
                  background: view === v ? 'var(--accent)' : 'transparent',
                  color: view === v ? 'var(--accent-fg)' : 'var(--tx-2)',
                  cursor: 'pointer',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs" style={{ color: 'var(--tx-2)' }}>
          <LegendItem color="var(--accent)" label="Block course session" />
          <LegendItem color="transparent" label="Available slot" dashed />
          <LegendItem color="var(--accent-2)" label="Admin override" pulse />
        </div>
      </div>

      {/* Calendar body — keyed so the fade re-triggers on view change */}
      <div key={view} className="view-fade">
        {view === 'weekly' ? (
          <WeeklyView
            weeks={chunkWeeks(blockDays)}
            allBookings={allBookings}
            courseBySectionId={courseBySectionId}
            hoveredCourseId={hoveredCourseId}
            setHoveredCourseId={setHoveredCourseId}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            monthLabelStr={monthLabel(currentBlock.startDate)}
          />
        ) : (
          <MonthlyView
            referenceIso={currentBlock.startDate}
            blockStart={currentBlock.startDate}
            blockEnd={currentBlock.endDate}
            allBookings={allBookings}
            courseBySectionId={courseBySectionId}
          />
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Weekly view — the main 10-day calendar (two Mon–Fri weeks stacked)
// ============================================================================
type WeeklyProps = {
  weeks: string[][];
  allBookings: Booking[];
  courseBySectionId: Map<number, EnrolledCourse>;
  hoveredCourseId: number | null;
  setHoveredCourseId: (id: number | null) => void;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
  monthLabelStr: string;
};

function WeeklyView(props: WeeklyProps) {
  const { weeks } = props;
  return (
    <div className="space-y-6">
      {weeks.map((week, wi) => (
        <div key={wi}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tx-3)' }}>
            {props.monthLabelStr} · Week {wi + 1}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {week.map((iso) => {
              const dayBookings = props.allBookings.filter((b) => b.date === iso);
              return (
                <DayColumn
                  key={iso}
                  iso={iso}
                  bookings={dayBookings}
                  {...props}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** One vertical day column (Mon–Fri) with its session cards. */
function DayColumn({
  iso,
  bookings,
  courseBySectionId,
  hoveredCourseId,
  setHoveredCourseId,
  expandedId,
  setExpandedId,
}: WeeklyProps & { iso: string; bookings: Booking[] }) {
  return (
    <div
      className="rounded-lg p-2 min-h-[96px]"
      style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}
    >
      {/* Day header */}
      <div className="flex items-baseline justify-between mb-1.5 px-0.5">
        <span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>
          {weekdayName(iso)}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--tx-3)' }}>
          {shortDayLabel(iso).split(' ')[1]}
        </span>
      </div>

      <div className="space-y-1.5">
        {bookings.length === 0 && <AvailableSlot />}

        {bookings
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((b) => (
            <SessionCard
              key={b.id}
              booking={b}
              course={courseBySectionId.get(b.sectionId)!}
              isHovered={hoveredCourseId === courseBySectionId.get(b.sectionId)!.course.id}
              isExpanded={expandedId === b.id}
              onHover={(id) => setHoveredCourseId(id)}
              onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
            />
          ))}
      </div>
    </div>
  );
}

/** A single block course session — the heart of the interactions. */
function SessionCard({
  booking,
  course,
  isHovered,
  isExpanded,
  onHover,
  onToggle,
}: {
  booking: Booking;
  course: EnrolledCourse;
  isHovered: boolean;
  isExpanded: boolean;
  onHover: (id: number | null) => void;
  onToggle: (id: number) => void;
}) {
  const { course: c, section } = course;
  const isOverride = !!booking.adminOverride;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(booking.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(booking.id);
        }
      }}
      onMouseEnter={() => onHover(c.id)}
      onMouseLeave={() => onHover(null)}
      className={[
        'block-session rounded-md p-2 cursor-pointer transition-all duration-150 select-none',
        isHovered ? 'block-glow' : '',
        isOverride ? 'block-override' : '',
      ].join(' ')}
      style={{
        background: isOverride
          ? 'linear-gradient(135deg, rgba(245,132,31,0.22), rgba(245,132,31,0.10))'
          : 'linear-gradient(135deg, rgba(245,132,31,0.14), rgba(245,132,31,0.05))',
        border: '1px solid rgba(245,132,31,0.3)',
      }}
      title={`${c.courseName} · ${timeBand(booking.startTime, booking.endTime)}`}
    >
      {/* Always-visible summary */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--accent-2)' }}>
          {c.courseCode}
        </span>
        <span className="text-[10px] font-medium shrink-0" style={{ color: 'var(--tx-2)' }}>
          {booking.startTime}
        </span>
      </div>
      <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: 'var(--tx)' }}>
        {c.courseName}
      </p>

      {isOverride && (
        <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wide" style={{ color: 'var(--accent-2)' }}>
          ⚠ Override
        </span>
      )}

      {/* Expandable detail panel: instructor + room + full time band */}
      <div
        className="expand-panel"
        style={{
          maxHeight: isExpanded ? 120 : 0,
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? 8 : 0,
        }}
      >
        <div className="pt-2 space-y-1" style={{ borderTop: '1px solid rgba(245,132,31,0.25)' }}>
          <DetailRow label="Time" value={timeBand(booking.startTime, booking.endTime)} />
          <DetailRow label="Instructor" value={section.instructorName ?? 'TBA'} />
          <DetailRow label="Room" value={booking.room ?? section.room ?? 'TBA'} />
          <DetailRow label="Credits" value={`${c.credits}`} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px]" style={{ color: 'var(--tx-2)' }}>{label}</span>
      <span className="text-[11px] font-medium text-right" style={{ color: 'var(--tx)' }}>{value}</span>
    </div>
  );
}

function AvailableSlot() {
  return (
    <div
      className="rounded-md py-2 text-center text-[10px]"
      style={{ border: '1px dashed var(--border)', color: 'var(--tx-3)' }}
    >
      Available slot
    </div>
  );
}

// ============================================================================
// Monthly view — overview grid; days inside the block are tinted.
// ============================================================================
function MonthlyView({
  referenceIso,
  blockStart,
  blockEnd,
  allBookings,
  courseBySectionId,
}: {
  referenceIso: string;
  blockStart: string;
  blockEnd: string;
  allBookings: Booking[];
  courseBySectionId: Map<number, EnrolledCourse>;
}) {
  const weeks = monthMatrix(referenceIso);
  const dowHeader = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function bookingsOn(iso: string): Booking[] {
    return allBookings.filter((b) => b.date === iso);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--tx-3)' }}>
        {monthLabel(referenceIso)} · Monthly overview
      </p>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {dowHeader.map((d) => (
          <div key={d} className="text-[10px] font-semibold py-1" style={{ color: 'var(--tx-3)' }}>
            {d}
          </div>
        ))}
        {weeks.flat().map((iso, i) => {
          if (!iso) return <div key={i} className="min-h-[64px]" />;
          const inBlock = isWithin(iso, blockStart, blockEnd);
          const todays = bookingsOn(iso);
          return (
            <div
              key={i}
              className="rounded-md p-1.5 min-h-[64px] flex flex-col"
              style={{
                background: inBlock ? 'rgba(245,132,31,0.08)' : 'var(--subtle)',
                border: inBlock ? '1px solid rgba(245,132,31,0.35)' : '1px solid var(--border)',
              }}
            >
              <span
                className="text-[11px] font-semibold mb-1"
                style={{ color: inBlock ? 'var(--accent-2)' : 'var(--tx-2)' }}
              >
                {iso.split('-')[2]}
              </span>
              {todays.slice(0, 3).map((b) => {
                const c = courseBySectionId.get(b.sectionId)!.course;
                return (
                  <span
                    key={b.id}
                    className="text-[9px] truncate rounded px-1 py-0.5 mb-0.5"
                    style={{ background: 'rgba(245,132,31,0.2)', color: 'var(--accent-2)' }}
                  >
                    {c.courseCode} {b.startTime}
                  </span>
                );
              })}
              {todays.length > 3 && (
                <span className="text-[9px]" style={{ color: 'var(--tx-3)' }}>
                  +{todays.length - 3} more
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] mt-3" style={{ color: 'var(--tx-3)' }}>
        Tinted days fall inside your active block. Switch to weekly for full session details.
      </p>
    </div>
  );
}

// ============================================================================
// Small shared bits
// ============================================================================
function LegendItem({ color, label, dashed, pulse }: { color: string; label: string; dashed?: boolean; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={['inline-block w-3 h-3 rounded-sm', pulse ? 'block-override' : ''].join(' ')}
        style={{
          background: color,
          border: dashed ? '1px dashed var(--tx-3)' : '1px solid var(--border)',
        }}
      />
      {label}
    </span>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <section id="schedule" className="card-premium p-6 scroll-mt-20 animate-fade-in">
      <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>Personalized Schedule</h2>
      <div className="mt-4 rounded-xl border border-dashed py-10 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--tx-2)' }}>
        {copy}
      </div>
    </section>
  );
}
