import type { StudentDashboardData } from '@/lib/types';

type Props = { data: StudentDashboardData };

/**
 * Hero Section (spec: "personalized student welcome and quick-stats badge
 * with current block progress").
 *
 * Server Component — no client interactivity needed here. It just renders the
 * snapshot from mockDashboardData. Computed values (credits, course count,
 * block progress %) are derived from the data so they're never stale.
 */
export default function Hero({ data }: Props) {
  const { student, currentBlock, enrolledCourses } = data;

  // ---- Derived quick-stats ---------------------------------------------------
  const totalCredits = enrolledCourses.reduce((sum, ec) => sum + ec.course.credits, 0);
  const courseCount = enrolledCourses.length;
  const bookingCount = enrolledCourses.reduce((n, ec) => n + ec.bookings.length, 0);

  // Block progress: how far through the current timeframe window we are,
  // as a percentage. Clamped 0–100. If no current block, 0.
  let blockProgress = 0;
  if (currentBlock) {
    const start = new Date(currentBlock.startDate + 'T00:00:00').getTime();
    const end = new Date(currentBlock.endDate + 'T00:00:00').getTime();
    const now = Date.now();
    blockProgress = Math.round(((now - start) / (end - start)) * 100);
    blockProgress = Math.max(0, Math.min(100, blockProgress));
  }

  // Days elapsed / total in the block window (calendar days, for the label).
  let dayLabel = '';
  if (currentBlock) {
    const start = new Date(currentBlock.startDate + 'T00:00:00');
    const end = new Date(currentBlock.endDate + 'T00:00:00');
    const totalDays =
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    const now = new Date();
    const elapsed = Math.max(
      0,
      Math.min(
        totalDays,
        Math.round((now.getTime() - start.getTime()) / 86_400_000) + 1,
      ),
    );
    dayLabel = `Day ${elapsed} of ${totalDays}`;
  }

  const firstName = student.fullName.split(' ')[0];

  return (
    <section
      id="overview"
      className="card-premium overflow-hidden relative animate-fade-in"
      style={{ borderColor: 'rgba(245, 132, 31, 0.3)' }}
    >
      {/* Soft orange radial glow in the corner — the "energetic campus" vibe */}
      <div
        aria-hidden
        className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at top right, rgba(245,132,31,0.18), transparent 70%)',
        }}
      />

      <div className="relative p-6 sm:p-8">
        {/* Welcome line */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
            style={{
              background: 'rgba(245, 132, 31, 0.12)',
              color: 'var(--accent-2)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 6px var(--accent)',
              }}
            />
            {currentBlock?.label ?? 'No active block'}
          </span>
          {student.msVerified && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: 'var(--subtle)', color: 'var(--tx-2)', border: '1px solid var(--border)' }}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12c0 5-3.5 7.5-8.5 9.5C7.5 19.5 4 17 4 12V6l8-3 8 3z" />
              </svg>
              Microsoft verified
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--tx)' }}>
          Welcome back, {firstName}.
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--tx-2)' }}>
          Here's your personalized block course schedule for this window.
        </p>

        {/* Quick-stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatCard label="Active courses" value={String(courseCount)} />
          <StatCard label="Total credits" value={String(totalCredits)} />
          <StatCard label="Booked sessions" value={String(bookingCount)} />
          <StatCard label="Block day" value={dayLabel || '—'} />
        </div>

        {/* Block progress badge — the spec's "quick-stats badge" */}
        {currentBlock && (
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--tx-2)' }}>
                  Block progress
                </span>
                <span className="text-xs font-semibold" style={{ color: 'var(--accent-2)' }}>
                  {blockProgress}%
                </span>
              </div>
              {/* Progress track */}
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${blockProgress}%`,
                    background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                    boxShadow: '0 0 8px rgba(245,132,31,0.5)',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Small reusable stat tile used inside the Hero. */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--subtle)', border: '1px solid var(--border)' }}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--tx-2)' }}>
        {label}
      </p>
      <p className="text-xl font-bold mt-1" style={{ color: 'var(--tx)' }}>
        {value}
      </p>
    </div>
  );
}
