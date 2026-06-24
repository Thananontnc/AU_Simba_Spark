'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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

type Props = { data: StudentDashboardData; signOutAction: () => Promise<void> };

export default function StudentSidebar({ data, signOutAction }: Props) {
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


  const sidebarContent = (
    <aside
      className="w-80 shrink-0 flex flex-col h-full overflow-y-auto"
      style={{ background: 'var(--student-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* ---------- Brand Logo & App Name ---------- */}
      <button
        onClick={() => window.location.reload()}
        className="group flex items-center gap-3 px-6 pt-6 pb-4 select-none w-full text-left focus:outline-none cursor-pointer"
        aria-label="Refresh page"
      >
        <div className="flex items-center justify-center shrink-0">
          <Image
            src="/simba-logo.webp"
            alt="Simba Spark Logo"
            width={36}
            height={36}
            className="shrink-0"
            priority
          />
        </div>
        <div className="text-lg font-bold tracking-wider flex items-center transition-all duration-300 transform group-hover:translate-x-1 group-hover:scale-[1.02] origin-left">
          <span className="text-zinc-800 dark:text-slate-100 transition-colors duration-300 group-hover:text-zinc-950 dark:group-hover:text-white">
            SIMBA
          </span>
          <span className="text-[#FF6B00] ml-1.5 dark:text-[#f5841f] transition-colors duration-300 group-hover:text-[#ff8522] dark:group-hover:text-[#ffb03a]">
            SPARK
          </span>
        </div>
      </button>

      {/* ---------- Profile summary block (top) ---------- */}
      <div className="p-5 flex flex-col items-start w-full" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Row 1: Avatar + Names */}
        <div className="flex items-center gap-4 w-full">
          {/* Avatar (with beautiful human silhouette SVG) */}
          <div className="w-14 h-14 rounded-full bg-[#E5E7EB] dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
            <svg className="w-10 h-10 text-white mt-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          {/* Names */}
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-tight text-zinc-800 dark:text-zinc-100 uppercase leading-none truncate">
              {student.fullName.split(' ')[0]}
            </h2>
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide leading-none mt-1 truncate">
              {student.fullName.split(' ').slice(1).join(' ')}
            </p>
          </div>
        </div>

        {/* Row 2: Rounded info box (Shield + Department/Faculty) */}
        <div className="w-full bg-[#f3f4f6] dark:bg-zinc-800/60 rounded-xl p-3.5 flex items-center gap-3 mt-4">
          <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide truncate">
              {student.department}
            </p>
            <p className="text-[8px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate mt-1">
              {student.faculty ?? 'ENGINEERING, SCIENCE AND TECHNOLOGY'}
            </p>
          </div>
        </div>

        {/* Row 3: 3-column Stats */}
        <div className="grid grid-cols-3 gap-2 w-full mt-5 text-center">
          <div>
            <p className="text-sm font-bold text-[#18181b] dark:text-zinc-100">
              {student.studentId ?? '—'}
            </p>
            <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
              STUDENT ID
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-[#18181b] dark:text-zinc-100">
              {student.gpa != null ? student.gpa.toFixed(2) : '0.00'}
            </p>
            <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
              G.P.A.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-[#18181b] dark:text-zinc-100">
              {student.credits ?? totalCredits}
            </p>
            <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
              CREDIT
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Categorized navigation ---------- */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>
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
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 15,
                    marginBottom: 2,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    // Soft Orange active highlight
                    background: isActive ? 'rgba(255,107,0,0.1)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--tx-2)',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--subtle)';
                      e.currentTarget.style.color = 'var(--tx)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--tx-2)';
                    }
                  }}
                >
                  <span style={{ color: isActive ? 'var(--accent-2)' : 'var(--tx-3)' }}>
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
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <form action={signOutAction}>
          <button type="submit" className="sidebar-signout">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </form>
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
          background: 'var(--student-sidebar)',
          color: 'var(--tx)',
          border: '1px solid var(--border)',
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
    <div className="rounded-md py-2 px-1" style={{ background: 'var(--subtle)' }}>
      <p className="text-[10px]" style={{ color: 'var(--tx-3)' }}>
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color: 'var(--accent-2)' }}>
        {display.toFixed(decimals)}
      </p>
    </div>
  );
}

// ---------- Inline SVG icons (18px, currentColor) ----------
const S = { width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' };
function IconHome() { return <svg {...S}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>; }
function IconUser() { return <svg {...S}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function IconClass() { return <svg {...S}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>; }
function IconCalendar() { return <svg {...S}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function IconBell() { return <svg {...S}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }
