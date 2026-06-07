export default function StatCard({ title, value, color }) {
  return (
    <div className="stat-card" style={color ? { borderLeftColor: color } : undefined}>
      <div className="stat-title">{title}</div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}
