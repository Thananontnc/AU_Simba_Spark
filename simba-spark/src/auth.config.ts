import type { NextAuthConfig } from 'next-auth';

// Edge-safe config — no bcrypt, no pg. Used by middleware (proxy.ts).
// Full config with Credentials + bcrypt lives in auth.ts.
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || 'au-simba-spark-fallback-secret-production-key-2026',
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { role: string }).role = token.role as string;
      return session;
    },
  },
};
