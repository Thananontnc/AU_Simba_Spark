'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { StudentDashboardData } from '@/lib/types';

// Simba Spark navigation — scoped to OUR app only. We borrow the reference's
// visual *structure* (grouped nav, profile block) for nostalgia, but the links
// are exclusively Simba Spark features (Schedule, Course Directory, Notifications,
// Profile). NO Examination / Registration / Grades / Planner — those belong to
// the legacy system and are out of scope for the Block Course Scheduler.
//
// Each item anchors to a section on the dashboard (single-page layout).
const NAV_GROUPS: { heading: string; items: { key: string; label: string; href: string; icon: React.ReactNode }[] }[] = [
  {
    heading: 'Dashboard',
    items: [
      { key: 'overview', label: 'Overview', href: '#overview', icon: <IconHome /> },
      { key: 'schedule', label: 'My Schedule', href: '#schedule', icon: <IconCalendar /> },
      { key: 'directory', label: 'Course Directory', href: '#directory', icon: <IconClass /> },
    ],
  },
  {
    heading: 'Account',
    items: [
      { key: 'notifications', label: 'Notifications', href: '#notifications', icon: <IconBell /> },
      { key: 'profile', label: 'My Profile', href: '#profile', icon: <IconUser /> },
    ],
  },
];

type Props = { data: StudentDashboardData };

export default function StudentSidebar({ data }: Props) {
  const { student, enrolledCourses } = data;
  const [open, setOpen] = useState(false); // mobile drawer
  const [active, setActive] = useState('overview'); // 'Overview' is active by default

  // Compute total credits for the count-up stat.
  const totalCredits = enrolledCourses.reduce((n, ec) => n + ec.course.credits, 0);

  // Close drawer on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const initials = student.fullName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  const sidebarContent = (
    <aside
      className="w-64 shrink-0 flex flex-col h-full overflow-y-auto"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* ---------- Profile summary block (top) ---------- */}
      <div className="p-5 flex flex-col items-center text-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Avatar (initials fallback) */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-3"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--accent-fg)',
            boxShadow: '0 4px 14px rgba(245,132,31,0.35)',
          }}
        >
          {initials}
        </div>
        <p className="text-sm font-semibold text-white leading-tight">{student.fullName}</p>
        <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {student.department}
        </p>

        {/* Student ID */}
        <div className="mt-3 w-full flex items-center justify-between px-3 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Student ID</span>
          <span className="text-xs font-medium text-white">{student.studentId ?? '—'}</span>
        </div>

        {/* GPA + Credits stats — count up on load */}
        <div className="mt-2 grid grid-cols-2 gap-2 w-full">
          <ProfileStat label="GPA" value={student.gpa ?? 0} decimals={2} />
          <ProfileStat label="Credits" value={totalCredits} decimals={0} />
        </div>
      </div>

      {/* ---------- Categorized navigation ---------- */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {group.heading}
            </p>
            {group.items.map((item) => {
              const isActive = active === item.key;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={() => {
                    setActive(item.key);
                    setOpen(false); // close mobile drawer on nav
                  }}
                  className="nav-link w-full text-left"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 2,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    // Soft orange active highlight (replaces original dull purple)
                    background: isActive ? 'rgba(245,132,31,0.16)' : 'transparent',
                    color: isActive ? 'var(--accent-2)' : 'rgba(255,255,255,0.55)',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                    }
                  }}
                >
                  <span style={{ color: isActive ? 'var(--accent-2)' : 'rgba(255,255,255,0.35)' }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        width: 4,
                        height: 16,
                        borderRadius: 2,
                        background: 'var(--accent)',
                      }}
                    />
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/login" className="sidebar-signout">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
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
      {/* Desktop: always visible */}
      <div className="hidden lg:flex h-screen sticky top-0">{sidebarContent}</div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className="fixed top-0 left-0 z-50 h-full flex flex-col lg:hidden transition-transform duration-200"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        {sidebarContent}
      </div>

      {/* Hamburger */}
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

/** Count-up stat tile for the profile block (GPA, Credits). */
function ProfileStat({ label, value, decimals }: { label: string; value: number; decimals: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(eased * value);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="rounded-md py-2 px-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color: 'var(--accent-2)' }}>
        {display.toFixed(decimals)}
      </p>
    </div>
  );
}

// ---------- Inline SVG icons (15px, currentColor) ----------
const S = { width: 15, height: 15, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' };
function IconHome() { return <svg {...S}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>; }
function IconUser() { return <svg {...S}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function IconClass() { return <svg {...S}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>; }
function IconCalendar() { return <svg {...S}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function IconBell() { return <svg {...S}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }
