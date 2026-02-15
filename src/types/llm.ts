import type { SheetLevel } from './sheet';
import type { DddNodeType, NodeSpec, FlowDocument } from './flow';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  hasDddYaml?: boolean;
  yamlBlocks?: YamlBlock[];
  flowPreview?: FlowDocument;
}

export interface YamlBlock {
  raw: string;
  nodeType?: DddNodeType;
  spec?: NodeSpec;
}

export interface ChatThread {
  id: string;
  scopeKey: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface LlmChatResponse {
  content: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export interface GhostSpecPreview {
  type: 'spec';
  nodeId: string;
  originalSpec: NodeSpec;
  suggestedSpec: NodeSpec;
}

export interface LlmContext {
  sheetLevel: SheetLevel;
  domainId?: string;
  flowId?: string;
  domains?: string[];
  currentDomain?: { name: string; flows: string[] };
  currentFlow?: { name: string; nodeCount: number; nodes: Array<{ id: string; type: string; label: string }> };
  selectedNode?: { id: string; type: DddNodeType; label: string; spec: NodeSpec };
}

export type InlineAssistAction =
  | 'suggest_spec'
  | 'complete_spec'
  | 'explain_node'
  | 'review_flow'
  | 'suggest_wiring';
