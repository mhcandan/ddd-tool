import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { nanoid } from 'nanoid';
import { useSheetStore } from './sheet-store';
import { useFlowStore } from './flow-store';
import { useAppStore } from './app-store';
import { buildSystemPrompt, buildInlinePrompt } from '../utils/llm-context';
import type {
  ChatMessage,
  ChatThread,
  LlmChatResponse,
  GhostSpecPreview,
  InlineAssistAction,
} from '../types/llm';
import type { NodeSpec, DddNodeType } from '../types/flow';
import type { ProviderConfig } from '../types/app';

function getScopeKey(): string {
  const sheet = useSheetStore.getState().current;
  if (sheet.level === 'flow' && sheet.domainId && sheet.flowId) {
    return `flow:${sheet.domainId}/${sheet.flowId}`;
  }
  if (sheet.level === 'domain' && sheet.domainId) {
    return `domain:${sheet.domainId}`;
  }
  return 'system';
}

function resolveProvider(): { provider: ProviderConfig; model: string } | null {
  const settings = useAppStore.getState().settings;
  const selectedModel = useLlmStore.getState().selectedModel;

  // If user picked a specific model, find its provider
  if (selectedModel) {
    for (const p of settings.llm.providers) {
      if (p.enabled && p.models.includes(selectedModel)) {
        return { provider: p, model: selectedModel };
      }
    }
  }

  // Default: first enabled provider, first model
  for (const p of settings.llm.providers) {
    if (p.enabled && p.models.length > 0) {
      return { provider: p, model: p.models[0] };
    }
  }

  return null;
}

function extractYamlBlocks(content: string): { raw: string; nodeType?: DddNodeType; spec?: NodeSpec }[] {
  const blocks: { raw: string; nodeType?: DddNodeType; spec?: NodeSpec }[] = [];
  const regex = /```yaml\s*\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const raw = match[1].trim();
    // Check for spec:type comment
    const typeMatch = raw.match(/^#\s*spec:(\w+)\s*\n/);
    if (typeMatch) {
      const nodeType = typeMatch[1] as DddNodeType;
      const yamlBody = raw.replace(/^#\s*spec:\w+\s*\n/, '');
      try {
        // Parse YAML-like content as JSON (simple key:value)
        const spec = parseSimpleYaml(yamlBody);
        blocks.push({ raw, nodeType, spec: spec as NodeSpec });
      } catch {
        blocks.push({ raw, nodeType });
      }
    } else {
      blocks.push({ raw });
    }
  }

  return blocks;
}

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  // Basic YAML-like parsing for simple key: value pairs
  // For real YAML parsing we'd use the yaml library, but keeping it simple for spec blocks
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value: unknown = trimmed.slice(colonIdx + 1).trim();

    // Simple type coercion
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (value === '' || value === '~' || value === 'null') value = '';
    else if (!isNaN(Number(value)) && value !== '') value = Number(value);

    result[key] = value;
  }

  return result;
}

interface LlmState {
  panelOpen: boolean;
  threads: Record<string, ChatThread>;
  activeThreadId: string | null;
  sending: boolean;
  error: string | null;
  ghostPreview: GhostSpecPreview | null;
  selectedModel: string | null;

  togglePanel: () => void;
  openPanel: () => void;
  sendMessage: (content: string) => Promise<void>;
  runInlineAssist: (action: InlineAssistAction, nodeId?: string) => Promise<void>;
  applyGhostPreview: () => void;
  discardGhostPreview: () => void;
  clearThread: () => void;
  setSelectedModel: (model: string | null) => void;
  reset: () => void;
}

export const useLlmStore = create<LlmState>((set, get) => ({
  panelOpen: false,
  threads: {},
  activeThreadId: null,
  sending: false,
  error: null,
  ghostPreview: null,
  selectedModel: null,

  togglePanel: () => {
    set((s) => ({ panelOpen: !s.panelOpen }));
  },

  openPanel: () => {
    set({ panelOpen: true });
  },

  sendMessage: async (content) => {
    const scopeKey = getScopeKey();
    const { threads } = get();
    const now = Date.now();

    // Get or create thread
    let thread = Object.values(threads).find((t) => t.scopeKey === scopeKey);
    if (!thread) {
      thread = {
        id: nanoid(),
        scopeKey,
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content,
      timestamp: now,
    };

    const updatedThread: ChatThread = {
      ...thread,
      messages: [...thread.messages, userMsg],
      updatedAt: now,
    };

    set({
      threads: { ...get().threads, [updatedThread.id]: updatedThread },
      activeThreadId: updatedThread.id,
      sending: true,
      error: null,
    });

    try {
      const resolved = resolveProvider();
      if (!resolved) {
        throw new Error('No LLM provider configured. Enable a provider in Settings.');
      }

      console.log('[LLM] Provider:', resolved.provider.type, 'Model:', resolved.model);

      const systemPrompt = buildSystemPrompt();
      const apiMessages = updatedThread.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const invokeArgs = {
        providerType: resolved.provider.type,
        model: resolved.model,
        apiKeyEnvVar: resolved.provider.apiKeyEnvVar ?? null,
        baseUrl: resolved.provider.baseUrl ?? null,
        messages: apiMessages,
        systemPrompt,
        maxTokens: 4096,
      };
      console.log('[LLM] Invoking llm_chat with args:', JSON.stringify(invokeArgs, null, 2));

      const response = await invoke<LlmChatResponse>('llm_chat', invokeArgs);
      console.log('[LLM] Response received, length:', response.content.length);

      const yamlBlocks = extractYamlBlocks(response.content);

      // Attach flow preview snapshot when at flow scope
      const flowPreview = scopeKey.startsWith('flow:')
        ? useFlowStore.getState().currentFlow ?? undefined
        : undefined;

      const assistantMsg: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        hasDddYaml: yamlBlocks.length > 0,
        yamlBlocks,
        flowPreview: flowPreview ? JSON.parse(JSON.stringify(flowPreview)) : undefined,
      };

      const finalThread: ChatThread = {
        ...updatedThread,
        messages: [...updatedThread.messages, assistantMsg],
        updatedAt: Date.now(),
      };

      set({
        threads: { ...get().threads, [finalThread.id]: finalThread },
        sending: false,
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error('[LLM] Error:', errorMsg, e);
      const errorAssistantMsg: ChatMessage = {
        id: nanoid(),
        role: 'assistant',
        content: `Error: ${errorMsg}`,
        timestamp: Date.now(),
      };

      const finalThread: ChatThread = {
        ...updatedThread,
        messages: [...updatedThread.messages, errorAssistantMsg],
        updatedAt: Date.now(),
      };

      set({
        threads: { ...get().threads, [finalThread.id]: finalThread },
        sending: false,
        error: errorMsg,
      });
    }
  },

  runInlineAssist: async (action, nodeId?) => {
    const { openPanel, sendMessage } = get();
    openPanel();

    const prompt = buildInlinePrompt(action, nodeId);
    await sendMessage(prompt);

    // After the response, check if we should create a ghost preview
    const { threads, activeThreadId } = get();
    if (!activeThreadId) return;

    const thread = threads[activeThreadId];
    if (!thread) return;

    const lastMsg = thread.messages[thread.messages.length - 1];
    if (!lastMsg || lastMsg.role !== 'assistant' || !lastMsg.yamlBlocks?.length) return;

    // For spec actions, create ghost preview
    if ((action === 'suggest_spec' || action === 'complete_spec') && nodeId) {
      const yamlBlock = lastMsg.yamlBlocks.find((b) => b.spec);
      if (yamlBlock?.spec) {
        const flow = useFlowStore.getState();
        const allNodes = flow.currentFlow
          ? [flow.currentFlow.trigger, ...flow.currentFlow.nodes]
          : [];
        const node = allNodes.find((n) => n.id === nodeId);
        if (node) {
          set({
            ghostPreview: {
              type: 'spec',
              nodeId,
              originalSpec: { ...node.spec },
              suggestedSpec: yamlBlock.spec,
            },
          });
        }
      }
    }
  },

  applyGhostPreview: () => {
    const { ghostPreview } = get();
    if (!ghostPreview) return;

    const flow = useFlowStore.getState();
    // Merge suggested spec into original (keep original fields, override with suggested)
    const mergedSpec = { ...ghostPreview.originalSpec, ...ghostPreview.suggestedSpec };
    flow.updateNodeSpec(ghostPreview.nodeId, mergedSpec);

    set({ ghostPreview: null });
  },

  discardGhostPreview: () => {
    set({ ghostPreview: null });
  },

  clearThread: () => {
    const scopeKey = getScopeKey();
    const { threads } = get();
    const thread = Object.values(threads).find((t) => t.scopeKey === scopeKey);
    if (thread) {
      const { [thread.id]: _, ...remaining } = threads;
      set({ threads: remaining, activeThreadId: null });
    }
  },

  setSelectedModel: (model) => {
    set({ selectedModel: model });
  },

  reset: () => {
    set({
      panelOpen: false,
      threads: {},
      activeThreadId: null,
      sending: false,
      error: null,
      ghostPreview: null,
      selectedModel: null,
    });
  },
}));
