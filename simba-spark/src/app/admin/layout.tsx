import { auth, signOut } from '@/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import Sidebar from './sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--tx)' }}>

      <Sidebar
        userName={session?.user?.name ?? ''}
        userEmail={session?.user?.email ?? ''}
        signOutAction={handleSignOut}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 flex items-center justify-end px-4 shrink-0" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
