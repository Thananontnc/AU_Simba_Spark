'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Anchor-based nav: each item scrolls to a section on the same page.
// (Calendar, Course Directory, etc. are sections, not separate routes.)
const NAV = [
  {
    href: '#overview',
    label: 'Overview',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '#schedule',
    label: 'Schedule',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '#directory',
    label: 'Course Directory',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    href: '#notifications',
    label: 'Notifications',
    icon: (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

type Props = { userName: string; userEmail: string };

export default function StudentSidebar({ userName, userEmail }: Props) {
  const [open, setOpen] = useState(false);

  // Close the mobile drawer whenever the hash (anchor) changes.
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener('hashchange', close);
    return () => window.removeEventListener('hashchange', close);
  }, []);

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const sidebarContent = (
    <aside
      className="w-52 shrink-0 flex flex-col h-full"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Brand */}
      <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Image src="/simba-logo.webp" alt="Simba" width={28} height={28} className="shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white leading-tight">Simba Spark</p>
          <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Student
          </p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-medium text-white truncate">{userName}</p>
        <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {userEmail}
        </p>
      </div>

      {/* Nav — anchor links (smooth scroll handled in CSS) */}
      <nav className="flex-1 px-2 py-3">
        {NAV.map((item) => (
          <a key={item.href} href={item.href} className="sidebar-link">
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Sign out (mock phase: just a no-op link back to login) */}
      <div className="px-2 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/login" className="sidebar-signout">
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible, full height */}
      <div className="hidden lg:flex h-screen sticky top-0">{sidebarContent}</div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer — slides in (spec: fluid micro-interactions) */}
      <div
        className="fixed top-0 left-0 z-50 h-full flex flex-col lg:hidden transition-transform duration-200"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {sidebarContent}
      </div>

      {/* Hamburger — floats top-left on mobile only */}
      <button
        className="fixed top-3 left-4 z-50 lg:hidden flex items-center justify-center w-8 h-8 rounded-lg"
        style={{
          background: 'var(--sidebar)',
          color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        )}
      </button>
    </>
  );
}
