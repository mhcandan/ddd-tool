interface Props {
  distribution: Record<string, number>;
}

export function RoutingChart({ distribution }: Props) {
  const entries = Object.entries(distribution);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return <p className="text-xs text-text-muted text-center py-4">No routing data</p>;
  }

  const colors = ['bg-accent', 'bg-blue-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];

  return (
    <div className="space-y-2">
      {entries.map(([route, count], i) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const color = colors[i % colors.length];

        return (
          <div key={route} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-primary truncate">{route}</span>
              <span className="text-text-muted shrink-0 ml-2">{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
