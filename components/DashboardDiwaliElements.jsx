'use client';

const DIWALI_DATE = { month: 10, day: 8 };

export function isDiwaliToday() {
  const now = new Date();
  return now.getMonth() === DIWALI_DATE.month && now.getDate() === DIWALI_DATE.day;
}

/**
 * Clean & minimal festive greeting pill for the dashboard header:
 * ONLY "Happy Diwali!" with a diya icon — no extra sentence/line.
 */
export function DashboardDiwaliGreeting() {
  if (!isDiwaliToday()) return null;

  return (
    <div
      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none shadow-2xs"
      style={{
        background: 'linear-gradient(90deg, rgba(255, 140, 0, 0.1) 0%, rgba(255, 215, 0, 0.16) 100%)',
        border: '1px solid rgba(255, 180, 50, 0.35)',
        color: '#b45309',
      }}
    >
      <span className="text-sm">🪔</span>
      <span>Happy Diwali!</span>
    </div>
  );
}

// Kept as null stubs so existing imports don't break
export function DiyaBadge() {
  return null;
}

export function SidebarDiwaliAccent() {
  return null;
}
