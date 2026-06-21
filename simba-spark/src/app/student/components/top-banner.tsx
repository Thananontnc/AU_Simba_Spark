import type { StudentDashboardData } from '@/lib/types';
import { monthLabel } from '@/lib/date-utils';

type Props = { data: StudentDashboardData };

/**
 * Top Banner — the nostalgic image header spanning the central dashboard.
 *
 * Modernized AU Spark: a wide landscape image with a soft dark+orange overlay
 * so white text sits cleanly on top. Shows the active class/block label plus a
 * quick block-progress strip (like the original "CLASS 1/2026" header, elevated).
 *
 * Server Component — no interactivity needed.
 */
export default function TopBanner({ data }: Props) {
  const { currentBlock } = data;
  // "CLASS 1/2026" → derived from the block label ("Block 1 — 2026").
  const classTitle = currentBlock
    ? `CLASS ${currentBlock.label.split('—')[0].replace(/\D/g, '')}/${new Date(currentBlock.startDate).getFullYear()}`
    : 'CLASS —';

  // Block progress for the thin strip under the title.
  let pct = 0;
  let dayLabel = '';
  if (currentBlock) {
    const start = new Date(currentBlock.startDate + 'T00:00:00').getTime();
    const end = new Date(currentBlock.endDate + 'T00:00:00').getTime();
    const now = Date.now();
    pct = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
    const totalDays = Math.round((end - start) / 86_400_000) + 1;
    const elapsed = Math.max(0, Math.min(totalDays, Math.round((now - start) / 86_400_000) + 1));
    dayLabel = `Day ${elapsed} of ${totalDays}`;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl h-44 sm:h-52 animate-fade-in">
      {/* Landscape image layer — uses a campus-style stock photo from Unsplash
          source. Swap for a real AU campus photo later. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=80"
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
