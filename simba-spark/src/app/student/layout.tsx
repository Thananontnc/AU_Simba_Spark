import { signOut } from '@/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import StudentSidebar from './sidebar';
import { mockDashboardData } from '@/lib/mock-data';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const data = mockDashboardData;

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--tx)' }}>
      <StudentSidebar data={data} signOutAction={handleSignOut} />

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
          <div className="hidden lg:block" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
