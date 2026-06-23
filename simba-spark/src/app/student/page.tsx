import { auth } from '@/auth';
import { signOut } from '@/auth';

export const dynamic = 'force-dynamic';

export default async function StudentPage() {
  const session = await auth();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">Student Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome, {session?.user?.name}</p>
      <form
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}
      >
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">Sign Out</button>
      </form>
    </main>
  );
}
