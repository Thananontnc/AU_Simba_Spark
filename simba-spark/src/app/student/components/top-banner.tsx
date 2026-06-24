import type { StudentDashboardData } from '@/lib/types';
import { monthLabel, weekdaysInRange } from '@/lib/date-utils';

type Props = { data: StudentDashboardData };

/**
 * Top Banner — the nostalgic image header spanning the central dashboard.
 *
 * Modernized AU Spark: a wide landscape image with a soft dark+orange overlay
 * so white text sits cleanly on top. Shows the active class/block label plus a
 * quick block-progress strip (like the original "CLASS 1/2026" header, elevated).
 *
 * Counts TEACHING DAYS (weekdays only), not calendar days — a Simba block is
 * 10 teaching days, not 12 calendar days.
 *
 * Server Component — no interactivity needed.
 */
export default function TopBanner({ data }: Props) {
  const { currentBlock } = data;
  // "CLASS 1/2026" → derived from the block label ("Block 1 — 2026").
  const classTitle = currentBlock
    ? `CLASS ${currentBlock.label.split('—')[0].replace(/\D/g, '')}/${new Date(currentBlock.startDate).getFullYear()}`
    : 'CLASS —';

  // Teaching-day count + progress (weekdays only, matching the actual schedule).
  let pct = 0;
  let dayLabel = '';
  if (currentBlock) {
    const teachingDays = weekdaysInRange(currentBlock.startDate, currentBlock.endDate); // e.g. 10 weekdays
    const todayIso = new Date().toISOString().slice(0, 10);

    // How many teaching days have elapsed (including today if it's a teaching day)?
    const elapsedCount = teachingDays.filter((iso) => iso <= todayIso).length;
    const total = teachingDays.length;
    // Progress = teaching days elapsed / total teaching days.
    pct = total > 0 ? Math.round((elapsedCount / total) * 100) : 0;
    // Clamp: if we're before the block, 0%; after, 100%.
    if (todayIso < currentBlock.startDate) pct = 0;
    if (todayIso > currentBlock.endDate) pct = 100;
    dayLabel = `Day ${Math.min(elapsedCount || (todayIso < currentBlock.startDate ? 0 : 1), total)} of ${total}`;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl h-44 sm:h-52 animate-fade-in bg-[#161513] border border-zinc-800/40 shadow-lg">
      {/* Landscape image layer — uses a campus-style stock photo from Unsplash
          source. Swap for a real AU campus photo later. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/3/31/Assumption_University.jpg"
        alt="Campus"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay: dark base + warm orange tint for the nostalgic premium look */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, rgba(17,17,17,0.82) 0%, rgba(17,17,17,0.55) 45%, rgba(245,132,31,0.45) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {currentBlock ? monthLabel(currentBlock.startDate) : '—'}
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-1 drop-shadow-sm">
              {classTitle}
            </h1>
            <p className="text-sm text-white/85 mt-1">
              {dayLabel} · {currentBlock?.label}
            </p>
          </div>

          {/* Quick block-progress pill */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wide text-white/60">Block progress</span>
            <span className="text-xl font-bold text-white">{pct}%</span>
          </div>
        </div>

        {/* Thin progress strip */}
        <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--accent), #ffd9b0)',
              boxShadow: '0 0 10px rgba(255,200,140,0.7)',
            }}
          />
        </div>
      </div>
    </section>
  );
}
