import Hero from './components/hero';
import Schedule from './components/schedule';
import { mockDashboardData } from '@/lib/mock-data';

export const dynamic = 'force-dynamic'; // dashboard shows live-ish data, never build-time frozen

export default function StudentPage() {
  // MOCK PHASE: read straight from the mock dataset. When real data is wired
  // in, replace this single line with the DB query that builds the same
  // StudentDashboardData shape (see lib/types.ts).
  const data = mockDashboardData;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Hero data={data} />
      <Schedule data={data} />

      {/* Placeholders for Step 4 — filled in next. */}
      <SectionPlaceholder
        id="directory"
        title="Course Directory"
        copy="A searchable list of your registered and multi-faculty courses."
      />
      <SectionPlaceholder
        id="notifications"
        title="Notification Feed"
        copy="Real-time administrative updates and timeframe changes."
      />
    </div>
  );
}

/** Temporary placeholder — replaced by the real component in Step 4. */
function SectionPlaceholder({ id, title, copy }: { id: string; title: string; copy: string }) {
  return (
    <section id={id} className="card-premium p-6 scroll-mt-20 animate-fade-in">
      <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>
        {title}
      </h2>
      <p className="text-sm mt-1" style={{ color: 'var(--tx-2)' }}>
        {copy}
      </p>
      <div
        className="mt-4 rounded-xl border border-dashed py-10 text-center text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--tx-3)' }}
      >
        Coming up in a later step
      </div>
    </section>
  );
}
