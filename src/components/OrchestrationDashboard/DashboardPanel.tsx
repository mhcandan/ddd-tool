import { useEffect } from 'react';
import { X, BarChart3 } from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboard-store';
import { MetricCard } from './MetricCard';
import { AgentStatusTable } from './AgentStatusTable';
import { RoutingChart } from './RoutingChart';

export function DashboardPanel() {
  const metrics = useDashboardStore((s) => s.metrics);
  const loading = useDashboardStore((s) => s.loading);
  const togglePanel = useDashboardStore((s) => s.togglePanel);
  const loadMetrics = useDashboardStore((s) => s.loadMetrics);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [togglePanel]);

  return (
    <div className="w-[380px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <BarChart3 className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1">Orchestration Dashboard</span>
        <button className="btn-icon !p-1" onClick={togglePanel}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <p className="text-xs text-text-muted text-center py-8">Loading metrics...</p>
        ) : !metrics ? (
          <p className="text-xs text-text-muted text-center py-8">No data available</p>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-2">
              <MetricCard label="Agent Flows" value={metrics.totalAgentFlows} />
              <MetricCard label="Orchestrators" value={metrics.totalOrchestrators} />
              <MetricCard label="Smart Routers" value={metrics.totalRouters} />
              <MetricCard label="Total Agents" value={metrics.agentStatuses.length} />
            </div>

            {/* Agent Status Table */}
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2">Agent Flows</h3>
              <AgentStatusTable agents={metrics.agentStatuses} />
            </div>

            {/* Routing Distribution */}
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2">Routing Distribution</h3>
              <RoutingChart distribution={metrics.routingDistribution} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
