export interface DashboardMetrics {
  totalAgentFlows: number;
  totalOrchestrators: number;
  totalRouters: number;
  agentStatuses: AgentStatus[];
  routingDistribution: Record<string, number>;
}

export interface AgentStatus {
  flowId: string;
  flowName: string;
  domainId: string;
  type: 'agent_loop' | 'orchestrator' | 'smart_router';
  status: 'idle' | 'active' | 'error';
  lastActive?: string;
}
