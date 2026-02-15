import { useSheetStore } from '../../stores/sheet-store';
import type { AgentStatus } from '../../types/dashboard';

const statusColors: Record<AgentStatus['status'], string> = {
  idle: 'bg-gray-500/20 text-gray-400',
  active: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
};

interface Props {
  agents: AgentStatus[];
}

export function AgentStatusTable({ agents }: Props) {
  const navigateToFlow = useSheetStore((s) => s.navigateToFlow);

  if (agents.length === 0) {
    return <p className="text-xs text-text-muted text-center py-4">No agent flows found</p>;
  }

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_60px_50px] gap-2 text-[10px] text-text-muted uppercase tracking-wider px-2 py-1">
        <span>Flow</span>
        <span>Type</span>
        <span>Status</span>
      </div>
      {agents.map((agent) => (
        <div
          key={`${agent.domainId}/${agent.flowId}`}
          className="grid grid-cols-[1fr_60px_50px] gap-2 items-center px-2 py-1.5 rounded hover:bg-bg-hover cursor-pointer text-xs"
          onClick={() => navigateToFlow(agent.domainId, agent.flowId)}
        >
          <span className="text-text-primary truncate">{agent.flowName}</span>
          <span className="text-[10px] text-text-muted">{agent.type.replace('_', ' ')}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-center ${statusColors[agent.status]}`}>
            {agent.status}
          </span>
        </div>
      ))}
    </div>
  );
}
