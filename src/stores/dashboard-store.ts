import { create } from 'zustand';
import type { DashboardMetrics, AgentStatus } from '../types/dashboard';
import { useProjectStore } from './project-store';

interface DashboardState {
  panelOpen: boolean;
  metrics: DashboardMetrics | null;
  loading: boolean;

  togglePanel: () => void;
  loadMetrics: () => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  panelOpen: false,
  metrics: null,
  loading: false,

  togglePanel: () => {
    const open = !get().panelOpen;
    set({ panelOpen: open });
    if (open) {
      get().loadMetrics();
    }
  },

  loadMetrics: () => {
    set({ loading: true });

    const domainConfigs = useProjectStore.getState().domainConfigs;

    let totalAgentFlows = 0;
    let totalOrchestrators = 0;
    let totalRouters = 0;
    const agentStatuses: AgentStatus[] = [];
    const routingDistribution: Record<string, number> = {};

    for (const [domainId, domain] of Object.entries(domainConfigs)) {
      for (const flow of domain.flows) {
        if (flow.type === 'agent') {
          totalAgentFlows++;

          agentStatuses.push({
            flowId: flow.id,
            flowName: flow.name,
            domainId,
            type: 'agent_loop',
            status: 'idle',
          });

          // Mock routing distribution based on domain
          const routeKey = domain.name;
          routingDistribution[routeKey] = (routingDistribution[routeKey] ?? 0) + 1;
        }
      }
    }

    // Estimate orchestrators/routers from flow names
    totalOrchestrators = agentStatuses.filter((a) =>
      a.flowName.toLowerCase().includes('orchestrat')
    ).length;
    totalRouters = agentStatuses.filter((a) =>
      a.flowName.toLowerCase().includes('router') || a.flowName.toLowerCase().includes('routing')
    ).length;

    // Add some mock routing distribution
    if (Object.keys(routingDistribution).length === 0) {
      routingDistribution['Default'] = 1;
    }

    set({
      metrics: {
        totalAgentFlows,
        totalOrchestrators,
        totalRouters,
        agentStatuses,
        routingDistribution,
      },
      loading: false,
    });
  },

  reset: () => {
    set({ panelOpen: false, metrics: null, loading: false });
  },
}));
