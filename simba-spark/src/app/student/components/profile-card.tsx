import type { StudentDashboardData } from '@/lib/types';

type Props = { data: StudentDashboardData };

/**
 * "My Profile" section — Simba Spark student identity + Microsoft identity
 * mapping. Read-only (students cannot edit anything per scope). This is the
 * destination of the sidebar's "My Profile" anchor.
 *
 * Server Component — no interactivity needed.
 */
export default function ProfileCard({ data }: Props) {
  const { student } = data;
  const initials = student.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('');

  return (
    <section className="card-premium p-5 sm:p-6 animate-fade-in">
      <h2 className="text-lg font-bold" style={{ color: 'var(--tx)' }}>My Profile</h2>
      <p className="text-sm mt-0.5" style={{ color: 'var(--tx-2)' }}>
        Your student identity and verified Microsoft account mapping.
      </p>

      <div className="mt-4 flex flex-col sm:flex-row gap-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--accent-fg)',
              boxShadow: '0 4px 14px rgba(245,132,31,0.3)',
            }}
          >
            {initials}
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: 'var(--tx)' }}>{student.fullName}</p>
            <p className="text-xs" style={{ color: 'var(--tx-2)' }}>{student.email}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--tx-3)' }}>{student.department}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
          <Field label="Student ID" value={student.studentId ?? '—'} />
          <Field label="GPA" value={student.gpa != null ? student.gpa.toFixed(2) : '—'} />
          <Field label="Role" value={student.role} capitalize />
          <Field label="Authorized" value={student.isAuthorized ? 'Yes' : 'No'} />
          <Field label="Microsoft OID" value={student.msOid ? truncate(student.msOid) : 'Not linked'} mono />
          <Field
            label="Identity status"
            value={student.msVerified ? 'Verified' : 'Unverified'}
            badge={student.msVerified}
          />
        </div>
      </div>

      {student.msVerified && (
        <div
          className="mt-4 flex items-center gap-2 rounded-lg p-3"
          style={{ background: 'rgba(245,132,31,0.08)', border: '1px solid rgba(245,132,31,0.25)' }}
        >
          <svg width="16" height="16" fill="none" stroke="var(--accent-2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c0 5-3.5 7.5-8.5 9.5C7.5 19.5 4 17 4 12V6l8-3 8 3z" />
          </svg>
          <span className="text-xs font-medium" style={{ color: 'var(--accent-2)' }}>
            Microsoft identity verified — your account is securely mapped.
          </span>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  capitalize,
  mono,
  badge,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  mono?: boolean;
  badge?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--tx-3)' }}>{label}</p>
      {badge ? (
        <span
          className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium"
          style={{
            background: value === 'Verified' ? 'rgba(34,197,94,0.12)' : 'var(--subtle)',
            color: value === 'Verified' ? '#16a34a' : 'var(--tx-2)',
          }}
        >
          {value}
        </span>
      ) : (
        <p
          className={[
            'text-sm font-medium mt-0.5',
            capitalize ? 'capitalize' : '',
          ].join(' ')}
          style={{ color: 'var(--tx)', fontFamily: mono ? 'var(--font-mono), monospace' : undefined }}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function truncate(s: string): string {
  return s.length > 18 ? s.slice(0, 8) + '…' + s.slice(-6) : s;
}
