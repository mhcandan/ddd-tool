import { Check, Play, EyeOff } from 'lucide-react';
import type { DriftInfo } from '../../types/implementation';

interface Props {
  drift: DriftInfo;
  onAccept: (flowKey: string) => void;
  onReimplement: (flowKey: string) => void;
  onIgnore: (flowKey: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DriftItem({ drift, onAccept, onReimplement, onIgnore }: Props) {
  return (
    <div className="px-4 py-2.5 border-b border-border/50 hover:bg-bg-hover transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">
            {drift.flowName}
          </p>
          <p className="text-[11px] text-text-muted">
            {drift.domainId} · implemented {timeAgo(drift.implementedAt)}
          </p>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
          drift.direction === 'reverse'
            ? 'bg-purple-500/15 text-purple-400'
            : 'bg-amber-500/15 text-amber-400'
        }`}>
          {drift.direction === 'reverse' ? 'code changed' : 'spec changed'}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 mt-2">
        <button
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded transition-colors"
          onClick={() => onAccept(drift.flowKey)}
          title="Accept spec changes (update hash)"
        >
          <Check className="w-3 h-3" />
          Accept
        </button>
        <button
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-accent/10 hover:bg-accent/20 text-accent rounded transition-colors"
          onClick={() => onReimplement(drift.flowKey)}
          title="Re-implement flow"
        >
          <Play className="w-3 h-3" />
          Re-implement
        </button>
        <button
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-bg-tertiary hover:bg-bg-hover text-text-muted rounded transition-colors"
          onClick={() => onIgnore(drift.flowKey)}
          title="Ignore drift for this session"
        >
          <EyeOff className="w-3 h-3" />
          Ignore
        </button>
      </div>
    </div>
  );
}
