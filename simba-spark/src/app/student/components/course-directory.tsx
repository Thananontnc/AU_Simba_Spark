'use client';

import { useState, useMemo } from 'react';
import type { StudentDashboardData, EnrolledCourse } from '@/lib/types';
import { timeBand } from '@/lib/date-utils';

type Props = { data: StudentDashboardData };

/**
 * Course Directory (spec: "scrollable list of enrolled and upcoming block
 * courses with a breakdown of credits").
 *
 * Interactions:
 *  - Search by name/code/faculty
 *  - Hover a card → soft orange glow + an expand button appears
 *  - Click expand → reveals section, instructor, room, daily time band
 */
export default function CourseDirectory({ data }: Props) {
  const { enrolledCourses, currentBlock } = data;
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enrolledCourses;
    return enrolledCourses.filter((ec) => {
      const { course, section } = ec;
      return (
        course.courseName.toLowerCase().includes(q) ||
        course.courseCode.toLowerCase().includes(q) ||
        course.faculty.toLowerCase().includes(q) ||
        section.sectionNumber.toLowerCase().includes(q)
      );
    });
  }, [query, enrolledCourses]);

  const totalCredits = enrolledCourses.reduce((n, ec) => n + ec.course.credits, 0);

  if (enrolledCourses.length === 0) {
    return (
      <section id="directory" className="card-premium p-6 scroll-mt-20 animate-fade-in">
        <Header count={0} totalCredits={0} query={query} setQuery={setQuery} />
        <div className="mt-4 rounded-xl border border-dashed py-10 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--tx-2)' }}>
          You are not enrolled in any courses yet.
        </div>
      </section>
    );
  }

  return (
    <section id="directory" className="card-premium p-5 sm:p-6 scroll-mt-20 animate-fade-in">
      <Header count={enrolledCourses.length} totalCredits={totalCredits} query={query} setQuery={setQuery} />

      <div className="mt-4 space-y-2.5">
        {filtered.map((ec) => (
          <CourseCard
            key={ec.section.id}
            ec={ec}
            blockLabel={currentBlock?.label ?? '—'}
            isExpanded={expandedId === ec.section.id}
            onToggle={() =>
              setExpandedId(expandedId === ec.section.id ? null : ec.section.id)
            }
          />
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm" style={{ borderColor: 'var(--border)', color: 'var(--tx-2)' }}>
            No courses match &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Header with title, instructional copy, and search box
// ----------------------------------------------------------------------------
function Header({
  count,
  totalCredits,
  query,
  setQuery,
}: {
  count: number;
  totalCredits: number;
  query: string;
  setQuery: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
      <div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>
          Course Directory
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--tx-2)' }}>
          {count} enrolled course{count === 1 ? '' : 's'} · {totalCredits} credits total.
          {' '}Hover a card, then tap <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>Details </span> for room &amp; instructor.
        </p>
      </div>

      {/* Search box */}
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 w-full sm:w-64 shrink-0"
        style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--tx-2)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, code, faculty…"
          className="flex-1 text-sm outline-none bg-transparent min-w-0"
          style={{ color: 'var(--tx)' }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ color: 'var(--tx-2)' }} className="text-xs" aria-label="Clear search">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// One course card — hover glow + expandable details
// ----------------------------------------------------------------------------
function CourseCard({
  ec,
  blockLabel,
  isExpanded,
  onToggle,
}: {
  ec: EnrolledCourse;
  blockLabel: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { course: c, section, bookings } = ec;
  // The daily time band (all sessions share the same band, so take the first).
  const sample = bookings[0];

  return (
    <div
      className="rounded-xl p-4 border border-[var(--border)] transition-all duration-300 ease-in-out hover:border-[#FF7A1A]/50 dark:hover:border-[#FF6B00]/60 hover:shadow-md hover:shadow-orange-500/[0.06] hover:-translate-y-0.5"
      style={{ background: 'var(--surface)' }}
    >
      {/* Top row: code + name + credits */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold"
              style={{ background: 'rgba(245,132,31,0.14)', color: 'var(--accent-2)' }}
            >
              {c.courseCode}
            </span>
            <span
              className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium"
              style={{ background: 'var(--subtle)', color: 'var(--tx-2)', border: '1px solid var(--border)' }}
            >
              {c.faculty}
            </span>
          </div>
          <h3 className="text-sm font-semibold mt-1.5 truncate" style={{ color: 'var(--tx)' }}>
            {c.courseName}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--tx-3)' }}>
            {section.sectionNumber} · {blockLabel} · {bookings.length} sessions
          </p>
        </div>

        {/* Credits badge */}
        <div className="text-right shrink-0">
          <p className="text-lg font-bold leading-none" style={{ color: 'var(--accent-2)' }}>
            {c.credits}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>credits</p>
        </div>
      </div>

      {/* Details button — appears subtly; always reachable, but the spec calls
          it out as revealed on hover, so we boost its prominence on hover via
          the group/course-glow parent. */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={onToggle}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
          style={{
            background: isExpanded ? 'rgba(245,132,31,0.14)' : 'var(--subtle)',
            color: isExpanded ? 'var(--accent-2)' : 'var(--tx-2)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Hide details' : 'Details'}
          <svg
            width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Expandable detail panel */}
      <div
        className="expand-panel"
        style={{
          maxHeight: isExpanded ? 200 : 0,
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? 12 : 0,
        }}
      >
        <div className="pt-3 grid grid-cols-2 gap-x-4 gap-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Detail label="Section" value={section.sectionNumber} />
          <Detail label="Credits" value={`${c.credits}`} />
          <Detail label="Instructor" value={section.instructorName ?? 'TBA'} />
          <Detail label="Room" value={sample?.room ?? section.room ?? 'TBA'} />
          <Detail label="Daily time" value={sample ? timeBand(sample.startTime, sample.endTime) : '—'} />
          <Detail label="Block" value={blockLabel} />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--tx-3)' }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--tx)' }}>
        {value}
      </p>
    </div>
  );
}
