import styles from './TodaysProtocol.module.css';

// NOTE (debt): protocol block content is HARDCODED for the pilot.
// This is NOT the patient's individually-generated plan — it's the same static
// content for everyone. Real per-patient generation = the Hub assembler (Phase 2+).
// patientId is accepted now so the signature is stable when we wire real data later.

type Step = { time: string; html: React.ReactNode };
type Block = {
  id: string;
  icon: string;
  iconClass: string;
  title: string;
  meta: string;
  featured?: boolean;
  open?: boolean;
  steps: Step[];
};

const BLOCKS: Block[] = [
  {
    id: 'morning',
    icon: '☀️',
    iconClass: 'am',
    title: 'Morning Routine',
    meta: '~5 MIN · WITH BREAKFAST · SOLO',
    steps: [
      { time: 'setup', html: 'Shen Men acupressure beads on both ears · rosemary L nostril + collar, eucalyptus R nostril + collar' },
      { time: 'supps', html: <><strong>Intrakid</strong> 1 oz + <strong>Gut Feeling</strong> · <strong>benaGene</strong> lozenge · all with breakfast</> },
      { time: 'passive', html: 'Blue eye lights on (outside L / inside R) while child eats · theta music low in background' },
    ],
  },
  {
    id: 'midday',
    icon: '🌤️',
    iconClass: 'mid',
    title: 'Midday Touch-ups',
    meta: '~10 MIN · LUNCH + AFTER SCHOOL · SOLO',
    steps: [
      { time: 'lunch', html: 'Oils round 2 · vibration device auricular vagus L+R ear, 30 sec each' },
      { time: '3:00', html: <>Quick reflex primer · <strong>starfish</strong> or <strong>cross-crawl</strong>, parent&apos;s pick · 3 min</> },
    ],
  },
  {
    id: 'afternoon',
    icon: '🎯',
    iconClass: 'tx',
    title: 'Afternoon Treatment Block',
    meta: '~90 MIN · CONCIERGE-LED · 1:00 PM',
    featured: true,
    open: true,
    steps: [
      { time: '1:00', html: <><strong>Setup + Hub opener</strong> · concierge walks through SaeboStim placement · Hub game: Mountain Climb (attention + visual-motor warm-up)</> },
      { time: '1:25', html: <><strong>Stim sequence + Hub round 2</strong> · laser vagus L+R → cerebellum L+R → abdomen vagus → Green LED · Hub game: Forest Journey</> },
      { time: '1:50', html: <><strong>Primitive reflex work</strong> · starfish · cross-crawl · snow angels · single-leg balance · live form correction</> },
      { time: '2:20', html: <><strong>Movement integration</strong> · cross-crawl with metronome 60 bpm · eyes-closed balance · throws + catches</> },
      { time: '2:40', html: <><strong>Hub round 3 + cool-down</strong> · Hub game: Fruit Catcher · oils round 3 · concierge debriefs with parent</> },
    ],
  },
  {
    id: 'evening',
    icon: '🌙',
    iconClass: 'pm',
    title: 'Evening Wind-Down',
    meta: '~20 MIN · BEFORE BED · SOLO',
    steps: [
      { time: '7:30', html: <><strong>AdrenaCalm</strong> · 1 pump to stomach · theta music on through bath</> },
      { time: 'lights', html: 'Blue eye lights second round during story (passive) · Shen Men beads off' },
      { time: 'bed', html: 'LED Light Panel at 4 Hz facing back of head, 10 min while falling asleep' },
    ],
  },
];

export function TodaysProtocol({ patientId: _patientId }: { patientId: string }) {
  return (
    <div className={styles.card}>
      <div className={styles.labelRow}>
        <div className={styles.label}>Today&apos;s Protocol · Friday</div>
        <span className={styles.detailLink}>~2 hr total · MID</span>
      </div>
      <div className={styles.title}>Tap a block to expand</div>
      <div className={styles.blocks}>
        {BLOCKS.map((b) => (
          <details key={b.id} className={`${styles.block} ${b.featured ? styles.featured : ''}`} open={b.open}>
            <summary className={styles.summary}>
              <div className={`${styles.icon} ${styles[b.iconClass]}`}>{b.icon}</div>
              <div className={styles.head}>
                <div className={styles.blockTitle}>{b.title}</div>
                <div className={styles.meta}>{b.meta}</div>
              </div>
              <svg className={styles.chev} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </summary>
            <div className={styles.body}>
              {b.steps.map((s, i) => (
                <div key={i} className={styles.step}>
                  <span className={styles.stepTime}>{s.time}</span>
                  <div>{s.html}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}