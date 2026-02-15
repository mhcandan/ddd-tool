import { ArrowDownRight, ArrowUpLeft } from 'lucide-react';
import { useMemoryStore } from '../../stores/memory-store';
import { useSheetStore } from '../../stores/sheet-store';

export function FlowDependencies() {
  const current = useSheetStore((s) => s.current);
  const getFlowDependencies = useMemoryStore((s) => s.getFlowDependencies);

  if (current.level !== 'flow' || !current.domainId || !current.flowId) {
    return null;
  }

  const fullId = `${current.domainId}/${current.flowId}`;
  const deps = getFlowDependencies(fullId);

  if (!deps) {
    return (
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Flow Dependencies
        </span>
        <p className="text-[10px] text-text-muted mt-1">
          Refresh memory to see dependencies
        </p>
      </div>
    );
  }

  const hasAny =
    deps.dependsOn.length > 0 ||
    deps.dependedOnBy.length > 0 ||
    deps.eventsIn.length > 0 ||
    deps.eventsOut.length > 0;

  if (!hasAny) {
    return (
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Flow Dependencies
        </span>
        <p className="text-[10px] text-text-muted mt-1">
          No dependencies detected
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-b border-border">
      <span className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-2">
        Flow Dependencies
      </span>

      {deps.dependsOn.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1 mb-0.5">
            <ArrowDownRight className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted font-medium">Upstream</span>
          </div>
          <ul className="ml-4 space-y-0.5">
            {deps.dependsOn.map((id) => (
              <li key={id} className="text-xs text-text-secondary">{id}</li>
            ))}
          </ul>
        </div>
      )}

      {deps.dependedOnBy.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1 mb-0.5">
            <ArrowUpLeft className="w-3 h-3 text-text-muted" />
            <span className="text-[10px] text-text-muted font-medium">Downstream</span>
          </div>
          <ul className="ml-4 space-y-0.5">
            {deps.dependedOnBy.map((id) => (
              <li key={id} className="text-xs text-text-secondary">{id}</li>
            ))}
          </ul>
        </div>
      )}

      {deps.eventsIn.length > 0 && (
        <div className="mb-2">
          <span className="text-[10px] text-text-muted font-medium block mb-0.5">Events In</span>
          <div className="flex flex-wrap gap-1 ml-4">
            {deps.eventsIn.map((e) => (
              <span key={e} className="text-[9px] px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}

      {deps.eventsOut.length > 0 && (
        <div className="mb-2">
          <span className="text-[10px] text-text-muted font-medium block mb-0.5">Events Out</span>
          <div className="flex flex-wrap gap-1 ml-4">
            {deps.eventsOut.map((e) => (
              <span key={e} className="text-[9px] px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary">
                {e}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
