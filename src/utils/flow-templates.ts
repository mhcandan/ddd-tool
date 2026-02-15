import { nanoid } from 'nanoid';
import type { FlowDocument, DddFlowNode } from '../types/flow';

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  type: 'traditional' | 'agent';
  nodeCount: number;
  create: (flowId: string, flowName: string, domainId: string) => FlowDocument;
}

function node(
  type: DddFlowNode['type'],
  label: string,
  position: { x: number; y: number },
  spec: DddFlowNode['spec'],
  connections: DddFlowNode['connections'] = []
): DddFlowNode {
  return {
    id: `${type}-${nanoid(8)}`,
    type,
    position,
    connections,
    spec,
    label,
  };
}

function meta(): { created: string; modified: string } {
  const now = new Date().toISOString();
  return { created: now, modified: now };
}

export const FLOW_TEMPLATES: FlowTemplate[] = [
  {
    id: 'rest-api',
    name: 'REST API Endpoint',
    description: 'Trigger → Input → Process → Terminal (success/error)',
    type: 'traditional',
    nodeCount: 5,
    create(flowId, flowName, domainId) {
      const termSuccess = node('terminal', 'Success', { x: 150, y: 450 }, { outcome: 'success', description: '' });
      const termError = node('terminal', 'Error', { x: 400, y: 450 }, { outcome: 'error', description: '' });
      const process = node('process', 'Process Request', { x: 250, y: 300 }, { action: '', service: '', description: '' }, [
        { targetNodeId: termSuccess.id },
        { targetNodeId: termError.id },
      ]);
      const input = node('input', 'Request Input', { x: 250, y: 170 }, { fields: [], validation: '', description: '' }, [
        { targetNodeId: process.id },
      ]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 50 },
        connections: [{ targetNodeId: input.id }],
        spec: { event: 'HTTP Request', source: 'API Gateway', description: '' },
        label: 'API Request',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'traditional', domain: domainId },
        trigger,
        nodes: [input, process, termSuccess, termError],
        metadata: meta(),
      };
    },
  },
  {
    id: 'crud-entity',
    name: 'CRUD Entity',
    description: 'Trigger → Input → Decision → Data Store operations → Terminal',
    type: 'traditional',
    nodeCount: 6,
    create(flowId, flowName, domainId) {
      const terminal = node('terminal', 'Done', { x: 250, y: 550 }, { outcome: 'completed', description: '' });
      const dataStore = node('data_store', 'Data Store', { x: 250, y: 420 }, { operation: 'read', model: '', data: {}, query: {}, description: '' }, [
        { targetNodeId: terminal.id },
      ]);
      const decision = node('decision', 'Operation?', { x: 250, y: 290 }, { condition: 'operation_type', trueLabel: 'Write', falseLabel: 'Read', description: '' }, [
        { targetNodeId: dataStore.id, sourceHandle: 'true' },
        { targetNodeId: dataStore.id, sourceHandle: 'false' },
      ]);
      const input = node('input', 'Entity Input', { x: 250, y: 170 }, { fields: [], validation: '', description: '' }, [
        { targetNodeId: decision.id },
      ]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 50 },
        connections: [{ targetNodeId: input.id }],
        spec: { event: 'CRUD Request', source: '', description: '' },
        label: 'CRUD Trigger',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'traditional', domain: domainId },
        trigger,
        nodes: [input, decision, dataStore, terminal],
        metadata: meta(),
      };
    },
  },
  {
    id: 'webhook-handler',
    name: 'Webhook Handler',
    description: 'Trigger → Input → Process → Service Call → Terminal',
    type: 'traditional',
    nodeCount: 5,
    create(flowId, flowName, domainId) {
      const terminal = node('terminal', 'Done', { x: 250, y: 500 }, { outcome: 'webhook processed', description: '' });
      const serviceCall = node('service_call', 'External Service', { x: 250, y: 380 }, { method: 'POST', url: '', headers: {}, body: {}, timeout_ms: 5000, retry: { max_attempts: 3, backoff_ms: 1000 }, error_mapping: {}, description: '' }, [
        { targetNodeId: terminal.id },
      ]);
      const process = node('process', 'Transform Payload', { x: 250, y: 260 }, { action: 'transform', service: '', description: '' }, [
        { targetNodeId: serviceCall.id },
      ]);
      const input = node('input', 'Webhook Payload', { x: 250, y: 150 }, { fields: [], validation: '', description: '' }, [
        { targetNodeId: process.id },
      ]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 40 },
        connections: [{ targetNodeId: input.id }],
        spec: { event: 'Webhook Received', source: 'External', description: '' },
        label: 'Webhook',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'traditional', domain: domainId },
        trigger,
        nodes: [input, process, serviceCall, terminal],
        metadata: meta(),
      };
    },
  },
  {
    id: 'event-processor',
    name: 'Event Processor',
    description: 'Trigger → Event (consume) → Process → Event (emit) → Terminal',
    type: 'traditional',
    nodeCount: 5,
    create(flowId, flowName, domainId) {
      const terminal = node('terminal', 'Done', { x: 250, y: 520 }, { outcome: 'event processed', description: '' });
      const emitEvent = node('event', 'Emit Result', { x: 250, y: 400 }, { direction: 'emit', event_name: '', payload: {}, async: true, description: '' }, [
        { targetNodeId: terminal.id },
      ]);
      const process = node('process', 'Process Event', { x: 250, y: 280 }, { action: '', service: '', description: '' }, [
        { targetNodeId: emitEvent.id },
      ]);
      const consumeEvent = node('event', 'Consume Event', { x: 250, y: 160 }, { direction: 'consume', event_name: '', payload: {}, async: false, description: '' }, [
        { targetNodeId: process.id },
      ]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 40 },
        connections: [{ targetNodeId: consumeEvent.id }],
        spec: { event: 'Event Received', source: 'Message Bus', description: '' },
        label: 'Event Trigger',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'traditional', domain: domainId },
        trigger,
        nodes: [consumeEvent, process, emitEvent, terminal],
        metadata: meta(),
      };
    },
  },

  // --- Agent Templates ---

  {
    id: 'rag-agent',
    name: 'RAG Agent',
    description: 'Guardrail → Agent Loop (retrieval + answer) → Guardrail → Terminal',
    type: 'agent',
    nodeCount: 5,
    create(flowId, flowName, domainId) {
      const terminal = node('terminal', 'Response', { x: 250, y: 600 }, { outcome: 'answer delivered', description: '' });
      const outputGuard = node('guardrail', 'Output Guard', { x: 250, y: 480 }, {
        position: 'output',
        checks: [{ type: 'hallucination_check', action: 'warn' }, { type: 'pii_filter', action: 'block' }],
        on_block: 'Return safe fallback response',
      }, [{ targetNodeId: terminal.id }]);
      const agentLoop = node('agent_loop', 'RAG Loop', { x: 250, y: 320 }, {
        model: 'claude-sonnet',
        system_prompt: 'You are a knowledgeable assistant. Use the retrieval tool to find relevant documents, then answer the user question accurately based on the retrieved context.',
        max_iterations: 5,
        temperature: 0.3,
        stop_conditions: ['answer_provided'],
        tools: [
          { id: 'retrieve', name: 'retrieve_documents', description: 'Search and retrieve relevant documents from the knowledge base', parameters: '{"query": "string", "top_k": "number"}' },
          { id: 'answer', name: 'provide_answer', description: 'Provide the final answer based on retrieved context', parameters: '{"answer": "string", "sources": "string[]"}', is_terminal: true },
        ],
        memory: [{ name: 'conversation', type: 'conversation_history', max_tokens: 4000, strategy: 'sliding_window' }],
        on_max_iterations: 'respond',
      }, [{ targetNodeId: outputGuard.id }]);
      const inputGuard = node('guardrail', 'Input Guard', { x: 250, y: 170 }, {
        position: 'input',
        checks: [{ type: 'prompt_injection', action: 'block' }, { type: 'content_policy', action: 'block' }],
        on_block: 'Reject with policy violation message',
      }, [{ targetNodeId: agentLoop.id }]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 50 },
        connections: [{ targetNodeId: inputGuard.id }],
        spec: { event: 'User Query', source: 'Chat Interface', description: 'User asks a question' },
        label: 'Query Received',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'agent', domain: domainId },
        trigger,
        nodes: [inputGuard, agentLoop, outputGuard, terminal],
        metadata: meta(),
      };
    },
  },
  {
    id: 'support-agent',
    name: 'Customer Support Agent',
    description: 'Guardrail → Agent Loop (ticket tools) → Human Gate → Terminal',
    type: 'agent',
    nodeCount: 5,
    create(flowId, flowName, domainId) {
      const terminal = node('terminal', 'Resolved', { x: 250, y: 600 }, { outcome: 'ticket resolved', description: '' });
      const humanGate = node('human_gate', 'Escalation Gate', { x: 250, y: 470 }, {
        notification_channels: ['slack', 'email'],
        approval_options: [
          { id: 'approve', label: 'Approve Resolution' },
          { id: 'reject', label: 'Reject & Reassign', requires_input: true },
        ],
        timeout: { duration: 1800, action: 'escalate' },
        context_for_human: ['ticket_summary', 'proposed_resolution', 'customer_history'],
      }, [{ targetNodeId: terminal.id }]);
      const agentLoop = node('agent_loop', 'Support Agent', { x: 250, y: 300 }, {
        model: 'claude-sonnet',
        system_prompt: 'You are a customer support agent. Investigate the customer issue, look up relevant tickets, and propose a resolution.',
        max_iterations: 8,
        temperature: 0.5,
        stop_conditions: ['resolution_proposed', 'escalation_needed'],
        tools: [
          { id: 'lookup', name: 'lookup_ticket', description: 'Look up an existing support ticket', parameters: '{"ticket_id": "string"}' },
          { id: 'search', name: 'search_knowledge_base', description: 'Search internal KB for solutions', parameters: '{"query": "string"}' },
          { id: 'update', name: 'update_ticket', description: 'Update ticket status and notes', parameters: '{"ticket_id": "string", "status": "string", "notes": "string"}' },
          { id: 'resolve', name: 'propose_resolution', description: 'Propose a resolution for human review', parameters: '{"resolution": "string"}', is_terminal: true, requires_confirmation: true },
        ],
        memory: [{ name: 'conversation', type: 'conversation_history', max_tokens: 8000, strategy: 'sliding_window' }],
        on_max_iterations: 'escalate',
      }, [{ targetNodeId: humanGate.id }]);
      const inputGuard = node('guardrail', 'Input Guard', { x: 250, y: 160 }, {
        position: 'input',
        checks: [{ type: 'content_policy', action: 'block' }],
        on_block: 'Reject inappropriate content',
      }, [{ targetNodeId: agentLoop.id }]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 50 },
        connections: [{ targetNodeId: inputGuard.id }],
        spec: { event: 'Support Ticket Created', source: 'Ticketing System', description: 'New support ticket arrives' },
        label: 'New Ticket',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'agent', domain: domainId },
        trigger,
        nodes: [inputGuard, agentLoop, humanGate, terminal],
        metadata: meta(),
      };
    },
  },
  {
    id: 'code-review-agent',
    name: 'Code Review Agent',
    description: 'Trigger → Agent Loop (code analysis + diff) → Terminal',
    type: 'agent',
    nodeCount: 3,
    create(flowId, flowName, domainId) {
      const terminal = node('terminal', 'Review Complete', { x: 250, y: 400 }, { outcome: 'review submitted', description: '' });
      const agentLoop = node('agent_loop', 'Code Reviewer', { x: 250, y: 230 }, {
        model: 'claude-sonnet',
        system_prompt: 'You are a senior code reviewer. Analyze the code diff, check for bugs, security issues, and style violations, then provide a structured review.',
        max_iterations: 6,
        temperature: 0.2,
        stop_conditions: ['review_submitted'],
        tools: [
          { id: 'diff', name: 'get_diff', description: 'Get the code diff for the PR', parameters: '{"pr_id": "string"}' },
          { id: 'analyze', name: 'analyze_code', description: 'Run static analysis on changed files', parameters: '{"files": "string[]"}' },
          { id: 'review', name: 'submit_review', description: 'Submit the final review with comments', parameters: '{"summary": "string", "comments": "object[]", "verdict": "string"}', is_terminal: true },
        ],
        memory: [],
        on_max_iterations: 'respond',
      }, [{ targetNodeId: terminal.id }]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 50 },
        connections: [{ targetNodeId: agentLoop.id }],
        spec: { event: 'Pull Request Opened', source: 'GitHub Webhook', description: 'PR ready for review' },
        label: 'PR Opened',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'agent', domain: domainId },
        trigger,
        nodes: [agentLoop, terminal],
        metadata: meta(),
      };
    },
  },
  {
    id: 'data-pipeline-agent',
    name: 'Data Pipeline Agent',
    description: 'Trigger → Agent Loop (transform tools) → Terminal',
    type: 'agent',
    nodeCount: 3,
    create(flowId, flowName, domainId) {
      const terminal = node('terminal', 'Pipeline Done', { x: 250, y: 400 }, { outcome: 'data processed', description: '' });
      const agentLoop = node('agent_loop', 'Data Pipeline', { x: 250, y: 230 }, {
        model: 'claude-sonnet',
        system_prompt: 'You are a data pipeline agent. Extract, validate, transform, and load data according to the pipeline specification.',
        max_iterations: 10,
        temperature: 0.1,
        stop_conditions: ['pipeline_complete', 'critical_error'],
        tools: [
          { id: 'extract', name: 'extract_data', description: 'Extract data from the configured source', parameters: '{"source": "string", "format": "string"}' },
          { id: 'validate', name: 'validate_data', description: 'Validate data against schema rules', parameters: '{"schema": "string"}' },
          { id: 'transform', name: 'transform_data', description: 'Apply transformations to the dataset', parameters: '{"transformations": "object[]"}' },
          { id: 'load', name: 'load_data', description: 'Load transformed data to the destination', parameters: '{"destination": "string"}', is_terminal: true },
        ],
        memory: [],
        on_max_iterations: 'error',
      }, [{ targetNodeId: terminal.id }]);
      const trigger: DddFlowNode = {
        id: `trigger-${nanoid(8)}`,
        type: 'trigger',
        position: { x: 250, y: 50 },
        connections: [{ targetNodeId: agentLoop.id }],
        spec: { event: 'Pipeline Triggered', source: 'Scheduler / API', description: 'Data pipeline run initiated' },
        label: 'Pipeline Start',
      };

      return {
        flow: { id: flowId, name: flowName, type: 'agent', domain: domainId },
        trigger,
        nodes: [agentLoop, terminal],
        metadata: meta(),
      };
    },
  },
];
