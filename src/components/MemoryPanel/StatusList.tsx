import { useMemoryStore } from '../../stores/memory-store';

const statusOrder: Record<string, number> = { stale: 0, pending: 1, implemented: 2 };
const statusDot: Record<string, string> = {
  implemented: 'bg-success',
  stale: 'bg-warning',
  pending: 'bg-text-muted/40',
};

export function StatusList() {
  const implementationStatus = useMemoryStore((s) => s.implementationStatus);

  if (!implementationStatus) {
    return (
      <div className="px-4 py-3 border-b border-border">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Implementation Status
        </span>
        <p className="text-[10px] text-text-muted mt-1">
          Refresh memory to see status
        </p>
      </div>
    );
  }

  // Group flows by domain, then sort within each by status
  const byDomain: Record<string, Array<{ fullId: string; flowName: string; status: string }>> = {};

  for (const [fullId, flow] of Object.entries(implementationStatus.flows)) {
    const domain = flow.domain;
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push({ fullId, flowName: flow.flowName, status: flow.status });
  }

  for (const flows of Object.values(byDomain)) {
    flows.sort((a, b) => (statusOrder[a.status] ?? 1) - (statusOrder[b.status] ?? 1));
  }

  return (
    <div className="px-4 py-3 border-b border-border">
      <span className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-2">
        Implementation Status
      </span>

      {Object.entries(byDomain).map(([domain, flows]) => (
        <div key={domain} className="mb-2">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">
            {domain}
          </span>
          <ul className="mt-0.5 space-y-0.5">
            {flows.map((f) => (
              <li key={f.fullId} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[f.status] ?? statusDot.pending}`} />
                <span className="text-xs text-text-secondary truncate flex-1">
                  {f.flowName}
                </span>
                <span className="text-[10px] text-text-muted capitalize">
                  {f.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
