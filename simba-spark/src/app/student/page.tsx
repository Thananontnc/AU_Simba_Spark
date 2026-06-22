import TopBanner from './components/top-banner';
import TimetableGrid from './components/timetable-grid';
import CourseDirectory from './components/course-directory';
import RightPanel from './components/right-panel';
import ProfileCard from './components/profile-card';
import { mockDashboardData } from '@/lib/mock-data';

export const dynamic = 'force-dynamic'; // dashboard shows live-ish data, never build-time frozen

export default function StudentPage() {
  // MOCK PHASE: read straight from the mock dataset. When real data is wired
  // in, replace this single line with the DB query that builds the same
  // StudentDashboardData shape (see lib/types.ts).
  const data = mockDashboardData;

  return (
    // 3-column dashboard inspired by the reference layout (but scoped to
    // Simba Spark features only):
    //   Sidebar (in layout) → Central grid → Right widget panel
    // Collapses gracefully on smaller screens.
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-6">
      {/* ---------- CENTER COLUMN ---------- */}
      <div className="space-y-6 min-w-0">
        {/* #overview anchor — banner sits at the top, acts as the hero */}
        <div id="overview" className="scroll-mt-20">
          <TopBanner data={data} />
        </div>

        {/* #schedule anchor — the 10-day block timetable */}
        <div id="schedule" className="scroll-mt-20">
          <TimetableGrid data={data} />
        </div>

        {/* #directory anchor — enrolled courses */}
        <div id="directory" className="scroll-mt-20">
          <CourseDirectory data={data} />
        </div>

        {/* #profile anchor — student profile / Microsoft identity */}
        <div id="profile" className="scroll-mt-20">
          <ProfileCard data={data} />
        </div>
      </div>

      {/* ---------- RIGHT COLUMN (scoped widget panel) ---------- */}
      <RightPanel data={data} />
    </div>
  );
}
