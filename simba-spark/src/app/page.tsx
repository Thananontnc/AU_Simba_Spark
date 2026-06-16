import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const role = (session.user as { role: string }).role;
  if (role === 'admin') redirect('/admin');
  if (role === 'instructor') redirect('/instructor');
  redirect('/student');
}
