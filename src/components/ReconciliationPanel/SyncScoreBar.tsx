import type { SyncScore } from '../../types/implementation';

interface Props {
  syncScore: SyncScore;
}

export function SyncScoreBar({ syncScore }: Props) {
  const { total, implemented, stale, pending, score } = syncScore;

  if (total === 0) return null;

  const implPct = (implemented / total) * 100;
  const stalePct = (stale / total) * 100;

  return (
    <div className="px-4 py-3 border-b border-border">
      {/* Progress bar */}
      <div className="h-2 rounded-full bg-bg-tertiary overflow-hidden flex">
        {implPct > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${implPct}%` }}
          />
        )}
        {stalePct > 0 && (
          <div
            className="bg-amber-500 transition-all"
            style={{ width: `${stalePct}%` }}
          />
        )}
      </div>

      {/* Text summary */}
      <p className="text-[11px] text-text-secondary mt-1.5">
        <span className="text-text-primary font-medium">{score}%</span> in sync
        {stale > 0 && (
          <>
            {' · '}
            <span className="text-amber-400">{stale} stale</span>
          </>
        )}
        {pending > 0 && (
          <>
            {' · '}
            <span className="text-text-muted">{pending} pending</span>
          </>
        )}
      </p>
    </div>
  );
}
