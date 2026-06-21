import { ThemeToggle } from '@/components/theme-toggle';
import StudentSidebar from './sidebar';
import { mockDashboardData } from '@/lib/mock-data';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  // MOCK PHASE: read identity from mock data. When real auth is wired in,
  // replace these two lines with `const session = await auth();` and read
  // `session.user.name` / `session.user.email`.
  const { student } = mockDashboardData;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--tx)' }}>
      <StudentSidebar userName={student.fullName} userEmail={student.email} />

      {/* Content column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className="h-12 flex items-center justify-between px-4 shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          {/* Mobile brand (hidden on desktop) */}
          <div className="flex items-center gap-2 lg:hidden pl-10">
            <span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>
              Simba Spark
            </span>
          </div>
          {/* Spacer on desktop */}
          <div className="hidden lg:block" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
