import type { Position } from './sheet';
import type { ValidationIssue } from './validation';
import type { ObservabilityConfig, SecurityConfig } from './crosscutting';

// --- Node types ---

export type DddNodeType =
  | 'trigger' | 'input' | 'process' | 'decision' | 'terminal'
  | 'data_store' | 'service_call' | 'event' | 'loop' | 'parallel' | 'sub_flow' | 'llm_call'
  | 'agent_loop' | 'guardrail' | 'human_gate'
  | 'orchestrator' | 'smart_router' | 'handoff' | 'agent_group';

// --- Per-node spec shapes ---

export interface TriggerSpec {
  event?: string;
  source?: string;
  description?: string;
  [key: string]: unknown;
}

export interface InputSpec {
  fields?: Array<{ name: string; type: string; required?: boolean }>;
  validation?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ProcessSpec {
  action?: string;
  service?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DecisionSpec {
  condition?: string;
  trueLabel?: string;
  falseLabel?: string;
  description?: string;
  [key: string]: unknown;
}

export interface TerminalSpec {
  outcome?: string;
  description?: string;
  status?: number;
  body?: Record<string, unknown>;
  [key: string]: unknown;
}

// --- Agent-specific spec shapes ---

export interface ToolDefinition {
  id: string;
  name: string;
  description?: string;
  parameters?: string;
  implementation?: string;
  is_terminal?: boolean;
  requires_confirmation?: boolean;
}

export interface MemoryStoreDefinition {
  name: string;
  type: 'conversation_history' | 'vector_store' | 'key_value';
  max_tokens?: number;
  strategy?: string;
}

export interface AgentLoopSpec {
  model?: string;
  system_prompt?: string;
  max_iterations?: number;
  temperature?: number;
  stop_conditions?: string[];
  tools?: ToolDefinition[];
  memory?: MemoryStoreDefinition[];
  on_max_iterations?: 'escalate' | 'respond' | 'error';
  [key: string]: unknown;
}

export interface GuardrailCheck {
  type: string;
  action: 'block' | 'warn' | 'log';
}

export interface GuardrailSpec {
  position?: 'input' | 'output';
  checks?: GuardrailCheck[];
  on_block?: string;
  [key: string]: unknown;
}

export interface ApprovalOption {
  id: string;
  label: string;
  description?: string;
  requires_input?: boolean;
}

export interface HumanGateSpec {
  notification_channels?: string[];
  approval_options?: ApprovalOption[];
  timeout?: {
    duration?: number;
    action?: 'escalate' | 'auto_approve' | 'auto_reject';
  };
  context_for_human?: string[];
  [key: string]: unknown;
}

// --- Orchestration spec shapes ---

export interface OrchestratorAgent {
  id: string;
  flow: string;
  specialization?: string;
  priority?: number;
}

export interface SupervisionRule {
  condition: string;
  threshold?: number;
  action: string;
}

export interface SharedMemoryEntry {
  name: string;
  type: string;
  access: 'read_write' | 'read_only';
}

export interface OrchestratorSpec {
  strategy?: 'supervisor' | 'round_robin' | 'broadcast' | 'consensus';
  model?: string;
  supervisor_prompt?: string;
  agents?: OrchestratorAgent[];
  fallback_chain?: string[];
  shared_memory?: SharedMemoryEntry[];
  supervision?: {
    monitor_iterations?: number;
    intervene_on?: SupervisionRule[];
  };
  result_merge_strategy?: 'last_wins' | 'best_of' | 'combine' | 'supervisor_picks';
  [key: string]: unknown;
}

export interface SmartRouterRule {
  id: string;
  condition: string;
  route: string;
  priority?: number;
}

export interface SmartRouterSpec {
  rules?: SmartRouterRule[];
  llm_routing?: {
    enabled?: boolean;
    model?: string;
    routing_prompt?: string;
    confidence_threshold?: number;
    routes?: Record<string, string>;
  };
  fallback_chain?: string[];
  policies?: {
    retry?: { max_attempts?: number; on_failure?: string };
    timeout?: { per_route?: number; total?: number };
    circuit_breaker?: { enabled?: boolean; failure_threshold?: number; timeout_seconds?: number; runtime_state?: 'closed' | 'open' | 'half_open' };
  };
  [key: string]: unknown;
}

export interface HandoffSpec {
  mode?: 'transfer' | 'consult' | 'collaborate';
  target?: { flow?: string; domain?: string };
  context_transfer?: { include_types?: string[]; max_context_tokens?: number };
  on_complete?: { return_to?: string; merge_strategy?: string };
  on_failure?: { action?: string; timeout?: number };
  notify_customer?: boolean;
  [key: string]: unknown;
}

export interface AgentGroupMember {
  flow: string;
  domain?: string;
}

export interface AgentGroupSpec {
  name?: string;
  description?: string;
  members?: AgentGroupMember[];
  shared_memory?: SharedMemoryEntry[];
  coordination?: {
    communication?: 'via_orchestrator' | 'direct' | 'blackboard';
    max_active_agents?: number;
    selection_strategy?: string;
    sticky_session?: boolean;
  };
  [key: string]: unknown;
}

// --- Extended traditional node spec shapes ---

export interface DataStoreSpec {
  operation?: 'create' | 'read' | 'update' | 'delete';
  model?: string;
  data?: Record<string, string>;
  query?: Record<string, string>;
  pagination?: Record<string, unknown>;
  sort?: Record<string, unknown>;
  description?: string;
  [key: string]: unknown;
}

export interface ServiceCallSpec {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeout_ms?: number;
  retry?: { max_attempts?: number; backoff_ms?: number };
  error_mapping?: Record<string, string>;
  description?: string;
  [key: string]: unknown;
}

export interface EventNodeSpec {
  direction?: 'emit' | 'consume';
  event_name?: string;
  payload?: Record<string, unknown>;
  async?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface LoopSpec {
  collection?: string;
  iterator?: string;
  break_condition?: string;
  description?: string;
  [key: string]: unknown;
}

export interface ParallelSpec {
  branches?: string[];
  join?: 'all' | 'any' | 'n_of';
  join_count?: number;
  timeout_ms?: number;
  description?: string;
  [key: string]: unknown;
}

export interface SubFlowSpec {
  flow_ref?: string;
  input_mapping?: Record<string, string>;
  output_mapping?: Record<string, string>;
  description?: string;
  [key: string]: unknown;
}

export interface LlmCallSpec {
  model?: string;
  system_prompt?: string;
  prompt_template?: string;
  temperature?: number;
  max_tokens?: number;
  structured_output?: Record<string, unknown>;
  retry?: { max_attempts?: number; backoff_ms?: number };
  description?: string;
  [key: string]: unknown;
}

export type NodeSpec =
  | TriggerSpec
  | InputSpec
  | ProcessSpec
  | DecisionSpec
  | TerminalSpec
  | DataStoreSpec
  | ServiceCallSpec
  | EventNodeSpec
  | LoopSpec
  | ParallelSpec
  | SubFlowSpec
  | LlmCallSpec
  | AgentLoopSpec
  | GuardrailSpec
  | HumanGateSpec
  | OrchestratorSpec
  | SmartRouterSpec
  | HandoffSpec
  | AgentGroupSpec;

// --- Flow node (persisted) ---

export interface DddFlowNode {
  id: string;
  type: DddNodeType;
  position: Position;
  connections: Array<{
    targetNodeId: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  spec: NodeSpec;
  label: string;
  parentId?: string;
  observability?: ObservabilityConfig;
  security?: SecurityConfig;
}

// --- Flow document (YAML shape) ---

export interface FlowDocument {
  flow: {
    id: string;
    name: string;
    type: 'traditional' | 'agent';
    domain: string;
    description?: string;
  };
  trigger: DddFlowNode;
  nodes: DddFlowNode[];
  metadata: {
    created: string;
    modified: string;
  };
}

// --- React Flow data prop ---

export interface DddNodeData extends Record<string, unknown> {
  label: string;
  spec: NodeSpec;
  dddType: DddNodeType;
  validationIssues?: ValidationIssue[];
  observability?: ObservabilityConfig;
  security?: SecurityConfig;
}
