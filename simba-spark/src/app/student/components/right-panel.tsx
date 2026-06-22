'use client';

import { useState, useEffect } from 'react';
import type { StudentDashboardData, Notification } from '@/lib/types';

type Props = { data: StudentDashboardData };

/**
 * Right-side widget panel — scoped strictly to Simba Spark.
 *
 * Three stacked widgets (our actual features, nothing copied from the legacy
 * system):
 *   1. Credits Tracking  — progress toward a full term, per-course breakdown
 *   2. Block Course Details — the active block + enrolled sections at a glance
 *   3. Notifications — room changes / scheduling conflicts, pulsing until dismissed
 *
 * The panel scrolls independently and sticks to the top on wide screens.
 */
export default function RightPanel({ data }: Props) {
  const { enrolledCourses, currentBlock, notifications } = data;

  // ---- Credits tracking (derived from enrolled course credits) ----------
  const totalCredits = enrolledCourses.reduce((n, ec) => n + ec.course.credits, 0);
  const target = 18; // a full Simba term
  const pct = Math.max(0, Math.min(100, Math.round((totalCredits / target) * 100)));

  // ---- Notification dismiss state (pulse until resolved) ----------------
  const [dismissing, setDismissing] = useState<Set<number>>(new Set());
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const visible = notifications.filter((n) => !removed.has(n.id));
  const unresolved = visible.filter((n) => n.level === 'override').length;

  function handleDismiss(id: number) {
    setDismissing((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setRemoved((prev) => new Set(prev).add(id));
    }, 320);
  }

  return (
    <aside id="notifications" className="space-y-4 xl:sticky xl:top-6 xl:self-start scroll-mt-20">
      {/* ============================================================ */}
      {/* 1. Credits Tracking                                          */}
      {/* ============================================================ */}
      <section className="card-premium p-5 rounded-md animate-fade-in">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>Credits Tracking</h2>
          <span className="text-sm font-semibold text-[var(--accent)]">
            {totalCredits}/{target}
          </span>
        </div>

        {/* Animated progress bar (fills on mount via .credit-fill) */}
        <div className="h-2.5 rounded-full overflow-hidden border border-zinc-200/80 dark:border-zinc-800/50 bg-zinc-100/50 dark:bg-zinc-900/30">
          <div
            className="credit-fill h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--tx-3)' }}>
          {target - totalCredits > 0
            ? `${target - totalCredits} credits to a full term`
            : 'Full term load reached'}
        </p>

        {/* Per-course credit breakdown */}
        <div className="mt-4 space-y-2">
          {enrolledCourses.map((ec) => (
            <div key={ec.section.id} className="flex items-center justify-between text-sm">
              <span className="truncate" style={{ color: 'var(--tx-2)' }}>
                <span className="font-semibold" style={{ color: 'var(--accent-2)' }}>{ec.course.courseCode}</span>
                {' '}{ec.course.courseName}
              </span>
              <span className="font-medium shrink-0 ml-2" style={{ color: 'var(--tx)' }}>{ec.course.credits} cr</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. Block Course Details                                      */}
      {/* ============================================================ */}
      <section className="card-premium p-5 rounded-md animate-fade-in">
        <h2 className="text-base font-bold mb-3.5" style={{ color: 'var(--tx)' }}>Block Course Details</h2>

        {currentBlock ? (
          <div className="rounded-md p-3 mb-4 bg-[#FF6B00]/5 border border-[#FF6B00]/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#FF6B00] dark:text-[#ff9a3f]">
                Active Block
              </span>
            </div>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--tx)' }}>{currentBlock.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--tx-2)' }}>
              {currentBlock.startDate} → {currentBlock.endDate}
            </p>
          </div>
        ) : (
          <p className="text-sm mb-3.5" style={{ color: 'var(--tx-2)' }}>No active block.</p>
        )}

        {/* Enrolled sections list */}
        <div className="space-y-3.5">
          {enrolledCourses.map((ec) => (
            <div key={ec.section.id} className="flex items-start gap-2.5">
              <span
                className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0"
                style={{ background: 'rgba(255, 107, 0, 0.14)', color: 'var(--accent)' }}
              >
                {ec.course.courseCode}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--tx)' }}>
                  {ec.course.courseName}
                </p>
                <p className="text-xs" style={{ color: 'var(--tx-3)' }}>
                  {ec.section.sectionNumber} · {ec.section.instructorName ?? 'TBA'} · {ec.section.room ?? 'TBA'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. Notifications — room changes / scheduling conflicts       */}
      {/* ============================================================ */}
      <section className="card-premium p-5 rounded-md animate-fade-in">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold" style={{ color: 'var(--tx)' }}>Notifications</h2>
          {unresolved > 0 && (
            <span
              className="notif-pulse inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
              style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--accent)', border: '1px solid rgba(255, 107, 0, 0.4)' }}
            >
              {unresolved} alert{unresolved === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {visible.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--tx-2)' }}>
            You&apos;re all caught up.
          </p>
        ) : (
          <div className="space-y-3">
            {visible.map((n) => (
              <NotificationItem
                key={n.id}
                n={n}
                isDismissing={dismissing.has(n.id)}
                onDismiss={() => handleDismiss(n.id)}
              />
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

/** A single notification — pulses orange if it's an override/conflict. */
function NotificationItem({
  n,
  isDismissing,
  onDismiss,
}: {
  n: Notification;
  isDismissing: boolean;
  onDismiss: () => void;
}) {
  const isOverride = n.level === 'override';
  return (
    <div
      className={[
        'rounded-md p-3 transition-colors border',
        isDismissing ? 'notif-out' : '',
        isOverride ? 'notif-pulse' : '',
      ].join(' ')}
      style={{
        background: isOverride ? 'rgba(255,107,0,0.10)' : 'var(--subtle)',
        borderColor: isOverride ? 'rgba(255,107,0,0.3)' : 'var(--border)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0" style={{ color: isOverride ? 'var(--accent-2)' : 'var(--tx-2)' }}>
          {isOverride ? (
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--tx)' }}>{n.title}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--tx-2)' }}>{n.body}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          style={{ color: 'var(--tx-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Dismiss"
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
