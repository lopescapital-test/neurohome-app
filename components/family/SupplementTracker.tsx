import { createClient } from '@/lib/supabase/server';
import styles from './SupplementTracker.module.css';

type Protocol = {
  id: string;
  name: string;
  dose: string;
  notes: string | null;
  timing: 'am' | 'midday' | 'pm' | 'with_food' | 'before_bed';
  scheduled_time: string | null;
  stock_low: boolean;
};

type LogRow = { supplement_id: string; taken: boolean };

const ICON: Record<string, { cls: string; emoji: string }> = {
  am: { cls: 'am', emoji: '☀️' },
  midday: { cls: 'mid', emoji: '🌤️' },
  pm: { cls: 'pm', emoji: '🌙' },
  before_bed: { cls: 'pm', emoji: '🌙' },
  with_food: { cls: 'mid', emoji: '🌤️' },
};

export async function SupplementTracker({ patientId }: { patientId: string }) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: protocols }, { data: logs }] = await Promise.all([
    supabase
      .from('supplement_protocols')
      .select('id, name, dose, notes, timing, scheduled_time, stock_low')
      .eq('patient_id', patientId)
      .eq('active', true)
      .order('scheduled_time', { ascending: true }),
    supabase
      .from('supplement_logs')
      .select('supplement_id, taken')
      .eq('patient_id', patientId)
      .eq('taken_date', today),
  ]);

  const items = (protocols ?? []) as Protocol[];
  const takenIds = new Set(
    ((logs ?? []) as LogRow[]).filter((l) => l.taken).map((l) => l.supplement_id),
  );

  const takenCount = items.filter((i) => takenIds.has(i.id)).length;
  const lowCount = items.filter((i) => i.stock_low).length;
  const nextItem = items.find((i) => !takenIds.has(i.id));

  return (
    <div className={styles.card}>
      <div className={styles.labelRow}>
        <div className={styles.label}>Supplement Tracker</div>
        <span className={styles.detailLink}>
          {takenCount} of {items.length} today
        </span>
      </div>

      <div className={styles.title}>Today&apos;s protocol</div>

      <div className={styles.list}>
        {items.map((s) => {
          const taken = takenIds.has(s.id);
          const icon = ICON[s.timing] ?? ICON.am;
          return (
            <div key={s.id} className={`${styles.row} ${taken ? styles.taken : ''}`}>
              <div className={`${styles.icon} ${styles[icon.cls]}`}>{icon.emoji}</div>
              <div>
                <div className={styles.name}>{s.name}</div>
                <div className={styles.dose}>
                  {s.dose}
                  {s.notes ? ` · ${s.notes}` : ''}
                  {s.stock_low && (
                    <span className={styles.statusLow}>● LOW — REFILL SOON</span>
                  )}
                </div>
              </div>
              <span className={styles.time}>{s.scheduled_time ?? ''}</span>
              <div className={styles.check} />
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerText}>
          {nextItem ? (
            <>Next reminder · <strong>{nextItem.scheduled_time}</strong></>
          ) : (
            <>All done for today ✓</>
          )}
        </div>
        {lowCount > 0 && (
          <button className={styles.refillBtn}>Refill {lowCount} item{lowCount > 1 ? 's' : ''} →</button>
        )}
      </div>
    </div>
  );
}