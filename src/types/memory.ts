// --- Layer 1: Project Summary ---

export interface ProjectSummary {
  content: string;
  generatedAt: string;
  stale: boolean;
}

// --- Layer 2: Spec Index ---

export interface SpecIndexFlow {
  type: 'traditional' | 'agent';
  trigger: string;
  nodeCount: number;
  nodeTypes: string[];
  publishesEvents: string[];
  consumesEvents: string[];
  agentModel?: string;
  tools?: string[];
}

export interface SpecIndexDomain {
  description?: string;
  flows: Record<string, SpecIndexFlow>;
}

export interface SpecIndexEvent {
  name: string;
  publisher: string;
  consumers: string[];
}

export interface SpecIndex {
  domains: Record<string, SpecIndexDomain>;
  events: SpecIndexEvent[];
  generatedAt: string;
}

// --- Layer 3: Decisions ---

export interface Decision {
  id: string;
  date: string;
  title: string;
  rationale: string;
  affected: string[];
  author: 'user' | 'llm';
}

// --- Layer 4: Flow Map ---

export interface FlowMapEdge {
  from: string;
  to: string;
  via: string;
  type: 'event' | 'handoff' | 'orchestrator_manages';
}

export interface FlowDependency {
  dependsOn: string[];
  dependedOnBy: string[];
  eventsIn: string[];
  eventsOut: string[];
}

export interface FlowMap {
  events: FlowMapEdge[];
  flowDependencies: Record<string, FlowDependency>;
  generatedAt: string;
}

// --- Layer 5: Implementation Status ---

export interface FlowImplStatus {
  status: 'implemented' | 'pending' | 'stale';
  domain: string;
  flowName: string;
}

export interface ImplementationStatus {
  overview: {
    total: number;
    implemented: number;
    pending: number;
    stale: number;
  };
  flows: Record<string, FlowImplStatus>;
  generatedAt: string;
}
