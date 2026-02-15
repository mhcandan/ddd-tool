interface Props {
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ label, value, trend }: Props) {
  return (
    <div className="bg-bg-primary rounded-lg border border-border p-3">
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
        {label}
        {trend === 'up' && <span className="text-success">+</span>}
        {trend === 'down' && <span className="text-danger">-</span>}
      </p>
    </div>
  );
}
