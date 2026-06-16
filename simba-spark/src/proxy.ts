import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  instructor: '/instructor',
  student: '/student',
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;

  const isAuthed = !!req.auth;
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/instructor') || pathname.startsWith('/student');

  if (isAuthed && isAuthPage) {
    return NextResponse.redirect(new URL(ROLE_HOME[role!] ?? '/', req.url));
  }

  if (!isAuthed && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthed && isProtected) {
    const area = pathname.split('/')[1];
    if (role !== area) {
      return NextResponse.redirect(new URL(ROLE_HOME[role!] ?? '/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
