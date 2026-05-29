type Session = {
  id: string;
  session_type: string;
  scheduled_at: string;
  duration_min: number;
};

type Props = {
  sessions: Session[];
  weekStart: Date;
  tier: string;
  phase: string;
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = [10, 13, 15];

const TIER_CADENCE: Record<string, string> = {
  foundation:      '2× live Zoom/wk + 3× home days (laser/LED)',
  accelerated:     '3× live Zoom sessions/wk (70 min each) + 2× self-guided home days/wk via NeuroSage Hub (30 min, includes laser/LED). Mon–Fri only. Weekends are rest days.',
  immersive:       '5× live Zoom/wk + daily home tasks',
  continuing_care: '1× live Zoom/wk + ongoing home days',
};

const CSS = `
.ws-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
.ws-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; flex-wrap: wrap; gap: 12px; }
.ws-title { font-family: 'Outfit', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); letter-spacing: -0.4px; margin-bottom: 4px; }
.ws-range { font-size: 12px; color: var(--text-3); margin-bottom: 6px; }
.ws-tag { display: inline-flex; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--brand-deep); background: var(--brand-light); padding: 4px 10px; border-radius: 6px; }
.ws-banner { display: flex; gap: 12px; padding: 14px 16px; background: var(--brand-light); border: 1px solid rgba(0,206,253,0.18); border-radius: var(--radius-sm); margin-bottom: 18px; }
.ws-banner-icon { font-size: 16px; flex-shrink: 0; line-height: 1.4; }
.ws-banner-content { font-size: 12.5px; color: var(--text-2); line-height: 1.55; }
.ws-banner-content strong { color: var(--text); font-weight: 700; }
.ws-grid { display: grid; grid-template-columns: 70px repeat(7, 1fr); gap: 4px; margin-bottom: 16px; }
.ws-head-cell { padding: 10px 6px; text-align: center; background: var(--bg-warm); border-radius: 8px; }
.ws-head-cell:first-child { background: transparent; }
.ws-head-cell.ws-weekend { opacity: 0.55; }
.ws-day-name { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-3); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
.ws-day-num { font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: var(--text); }
.ws-today { color: var(--brand-deep); background: var(--brand-light); width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
.ws-time-label { display: flex; align-items: center; padding-right: 8px; }
.ws-time-label span { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-3); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
.ws-cell { min-height: 58px; background: var(--bg); border-radius: 8px; padding: 5px; }
.ws-weekend-cell { background: transparent; opacity: 0.4; }
.ws-event { height: 100%; padding: 7px 9px; border-radius: 6px; font-size: 11px; display: flex; flex-direction: column; justify-content: center; }
.ws-event-zoom { background: rgba(0,206,253,0.12); border-left: 3px solid var(--brand); }
.ws-event-home { background: var(--purple-light); border-left: 3px solid var(--purple); }
.ws-event-atec { background: var(--amber-light); border-left: 3px solid var(--amber); }
.ws-event-title { font-family: 'Outfit', sans-serif; font-size: 11.5px; font-weight: 700; color: var(--text); line-height: 1.2; }
.ws-event-time { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; color: var(--text-3); margin-top: 2px; }
.ws-legend { display: flex; gap: 20px; flex-wrap: wrap; padding-top: 14px; border-top: 1px solid var(--border); font-size: 11.5px; color: var(--text-2); }
.ws-legend-item { display: inline-flex; align-items: center; gap: 7px; }
.ws-legend-dot { width: 10px; height: 10px; border-radius: 3px; }
.ws-legend-zoom { background: var(--brand); }
.ws-legend-home { background: var(--purple); }
.ws-legend-atec { background: var(--amber); }
`;

function eventClass(type: string): string {
  if (type === 'zoom_session') return 'ws-event ws-event-zoom';
  if (type === 'home_day') return 'ws-event ws-event-home';
  if (type === 'atec_check') return 'ws-event ws-event-atec';
  return 'ws-event ws-event-zoom';
}

function eventTitle(type: string): string {
  if (type === 'zoom_session') return '🎥 Zoom';
  if (type === 'home_day') return '🧠 NeuroSage';
  if (type === 'atec_check') return '📊 ATEC';
  return '•';
}

export function WeekSchedule({ sessions, weekStart, tier, phase }: Props) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);

  const rangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  const today = new Date();
  const days = DAYS.map((name, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      name,
      num: d.getDate(),
      date: d,
      isToday: d.toDateString() === today.toDateString(),
      isWeekend: i >= 5,
    };
  });

  function findSession(dayIdx: number, hour: number): Session | undefined {
    return sessions.find((s) => {
      const d = new Date(s.scheduled_at);
      return d.toDateString() === days[dayIdx].date.toDateString() && d.getHours() === hour;
    });
  }

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const phaseLabel = phase.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const cadence = TIER_CADENCE[tier] ?? 'Custom schedule';

  const cells: React.ReactNode[] = [];
  cells.push(<div key="corner" className="ws-head-cell"></div>);
  days.forEach((d) => {
    cells.push(
      <div key={`head-${d.name}`} className={`ws-head-cell ${d.isWeekend ? 'ws-weekend' : ''}`}>
        <div className="ws-day-name">{d.name}</div>
        <div className="ws-day-num">{d.isToday ? <span className="ws-today">{d.num}</span> : d.num}</div>
      </div>
    );
  });

  TIME_SLOTS.forEach((hour) => {
    const label = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    cells.push(
      <div key={`time-${hour}`} className="ws-time-label"><span>{label}</span></div>
    );
    days.forEach((d, dayIdx) => {
      const session = findSession(dayIdx, hour);
      cells.push(
        <div key={`cell-${hour}-${dayIdx}`} className={`ws-cell ${d.isWeekend ? 'ws-weekend-cell' : ''}`}>
          {session && (
            <div className={eventClass(session.session_type)}>
              <div className="ws-event-title">{eventTitle(session.session_type)}</div>
              <div className="ws-event-time">
                {new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })} · {session.duration_min}m
              </div>
            </div>
          )}
        </div>
      );
    });
  });

  return (
    <>
      <style>{CSS}</style>
      <section className="ws-card">
        <div className="ws-header">
          <div>
            <div className="ws-title">This Week&apos;s Schedule</div>
            <div className="ws-range">{rangeLabel}</div>
            <div className="ws-tag">🎯 {tierLabel.toUpperCase()} · {phaseLabel.toUpperCase()}</div>
          </div>
        </div>
        <div className="ws-banner">
          <span className="ws-banner-icon">ℹ️</span>
          <div className="ws-banner-content">
            <strong>{tierLabel} · {phaseLabel} cadence:</strong> {cadence}
          </div>
        </div>
        <div className="ws-grid">{cells}</div>
        <div className="ws-legend">
          <div className="ws-legend-item"><div className="ws-legend-dot ws-legend-zoom"></div>Live Zoom (OT/PT + concierge)</div>
          <div className="ws-legend-item"><div className="ws-legend-dot ws-legend-home"></div>NeuroSage Hub (self-guided · includes laser/LED)</div>
          <div className="ws-legend-item"><div className="ws-legend-dot ws-legend-atec"></div>ATEC / assessments</div>
        </div>
      </section>
    </>
  );
}