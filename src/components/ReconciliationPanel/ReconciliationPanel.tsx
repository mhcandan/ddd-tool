import { useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, X, CheckCircle } from 'lucide-react';
import { useImplementationStore } from '../../stores/implementation-store';
import { SyncScoreBar } from './SyncScoreBar';
import { DriftItem } from './DriftItem';

export function ReconciliationPanel() {
  const toggleReconPanel = useImplementationStore((s) => s.toggleReconPanel);
  const driftItems = useImplementationStore((s) => s.driftItems);
  const syncScore = useImplementationStore((s) => s.syncScore);
  const resolveFlow = useImplementationStore((s) => s.resolveFlow);
  const resolveAll = useImplementationStore((s) => s.resolveAll);
  const detectDrift = useImplementationStore((s) => s.detectDrift);

  // Close on Escape — capture phase
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        toggleReconPanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [toggleReconPanel]);

  // Group drift items by domain
  const grouped = useMemo(() => {
    const map = new Map<string, typeof driftItems>();
    for (const drift of driftItems) {
      const existing = map.get(drift.domainId) ?? [];
      existing.push(drift);
      map.set(drift.domainId, existing);
    }
    return map;
  }, [driftItems]);

  const handleAccept = useCallback((flowKey: string) => resolveFlow(flowKey, 'accept'), [resolveFlow]);
  const handleReimplement = useCallback((flowKey: string) => resolveFlow(flowKey, 'reimpl'), [resolveFlow]);
  const handleIgnore = useCallback((flowKey: string) => resolveFlow(flowKey, 'ignore'), [resolveFlow]);

  return (
    <div className="w-[380px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <RefreshCw className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1">
          Reconciliation
        </span>
        {syncScore && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            syncScore.stale > 0
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-green-500/15 text-green-400'
          }`}>
            {syncScore.score}%
          </span>
        )}
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={() => detectDrift()}
          title="Refresh drift detection"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={toggleReconPanel}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sync score bar */}
      {syncScore && <SyncScoreBar syncScore={syncScore} />}

      {/* Drift list */}
      <div className="flex-1 overflow-y-auto">
        {driftItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-muted">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <p className="text-sm">All implementations are in sync</p>
          </div>
        ) : (
          <>
            {Array.from(grouped.entries()).map(([domainId, items]) => (
              <div key={domainId}>
                <div className="px-4 py-1.5 bg-amber-500/5 text-[10px] uppercase tracking-wider text-amber-400 font-medium">
                  {domainId} ({items.length})
                </div>
                {items.map((drift) => (
                  <DriftItem
                    key={drift.flowKey}
                    drift={drift}
                    onAccept={handleAccept}
                    onReimplement={handleReimplement}
                    onIgnore={handleIgnore}
                  />
                ))}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bulk actions */}
      {driftItems.length > 0 && (
        <div className="px-4 py-3 border-t border-border flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-colors"
            onClick={() => resolveAll('accept')}
          >
            Accept All
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-muted text-xs font-medium rounded-lg transition-colors"
            onClick={() => resolveAll('ignore')}
          >
            Ignore All
          </button>
        </div>
      )}
    </div>
  );
}
