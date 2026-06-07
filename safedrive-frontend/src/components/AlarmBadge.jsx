const LABELS = {
  critical: 'Kritik',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük'
};

export default function AlarmBadge({ severity }) {
  const label = LABELS[severity] || severity;
  return <span className={`badge badge-${severity}`}>{label}</span>;
}
