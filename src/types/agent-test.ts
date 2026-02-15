import type { DddNodeType } from './flow';

export interface AgentTestSession {
  id: string;
  flowId: string;
  domainId: string;
  status: 'idle' | 'configuring' | 'running' | 'completed' | 'failed';
  input: Record<string, unknown>;
  steps: AgentTestStep[];
  startedAt?: string;
  completedAt?: string;
}

export interface AgentTestStep {
  id: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: DddNodeType;
  status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  duration?: number;
  error?: string;
}
