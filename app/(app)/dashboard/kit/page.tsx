import { createClient } from '@/lib/supabase/server';
import styles from '../resource.module.css';

const DEVICE_META: Record<string, { icon: string; label: string }> = {
  laser_pbm:       { icon: '🔴', label: 'Laser (PBM)' },
  sound_therapy:   { icon: '🎧', label: 'Sound Therapy' },
  supplements_kit: { icon: '💊', label: 'Supplements Kit' },
  lab_kit:         { icon: '🧪', label: 'Lab Kit' },
  reflex_kit:      { icon: '🤸', label: 'Reflex Kit' },
};

function deviceBadge(status: string): { cls: string; text: string } {
  switch (status) {
    case 'connected': return { cls: styles.badgeConnected, text: 'Connected' };
    case 'low':       return { cls: styles.badgeLow, text: 'Low' };
    case 'shipped':   return { cls: styles.badgeShipped, text: 'Shipped' };
    case 'offline':   return { cls: styles.badgeOffline, text: 'Offline' };
    case 'returned':  return { cls: styles.badgeArchived, text: 'Returned' };
    default:          return { cls: styles.badgePending, text: 'Pending' };
  }
}

const TIMING_LABEL: Record<string, string> = {
  am: 'Morning',
  midday: 'Midday',
  pm: 'Evening',
  with_food: 'With food',
  before_bed: 'Before bed',
};

export default async function KitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('parent_user_id', user!.id)
    .single();

  const { data: devices } = patient
    ? await supabase
        .from('devices')
        .select('id, device_type, status, serial_number')
        .eq('patient_id', patient.id)
        .order('device_type', { ascending: true })
    : { data: [] };

  const { data: supplements } = patient
    ? await supabase
        .from('supplement_protocols')
        .select('id, name, dose, timing, scheduled_time, stock_low')
        .eq('patient_id', patient.id)
        .eq('active', true)
        .order('timing', { ascending: true })
    : { data: [] };

  const hasContent = (devices && devices.length > 0) || (supplements && supplements.length > 0);

  return (
    <main className={styles.page}>
      <a className={styles.back} href="/dashboard">← Back to dashboard</a>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Kit</h1>
        <p className={styles.subtitle}>Devices and supplements provided for your program.</p>
      </header>

      {devices && devices.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Devices</div>
          <div className={styles.list}>
            {devices.map((d) => {
              const meta = DEVICE_META[d.device_type] ?? { icon: '📦', label: d.device_type.replace(/_/g, ' ') };
              const badge = deviceBadge(d.status);
              return (
                <div key={d.id} className={styles.row}>
                  <div className={styles.rowIcon}>{meta.icon}</div>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{meta.label}</div>
                    {d.serial_number && <div className={styles.rowMeta}>SN {d.serial_number}</div>}
                  </div>
                  <span className={`${styles.badge} ${badge.cls}`}>{badge.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {supplements && supplements.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>Supplements</div>
          <div className={styles.list}>
            {supplements.map((s) => (
              <div key={s.id} className={styles.row}>
                <div className={styles.rowIcon}>💊</div>
                <div className={styles.rowMain}>
                  <div className={styles.rowTitle}>{s.name}</div>
                  <div className={styles.rowMeta}>
                    {s.dose} · {s.scheduled_time || TIMING_LABEL[s.timing] || s.timing}
                  </div>
                </div>
                {s.stock_low && <span className={`${styles.badge} ${styles.badgeLow}`}>Low</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasContent && (
        <div className={styles.card}>
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>📦</div>
            Your kit details will appear here once your program is set up.
          </div>
        </div>
      )}
    </main>
  );
}
