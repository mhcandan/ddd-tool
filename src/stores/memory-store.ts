import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { stringify, parse } from 'yaml';
import { nanoid } from 'nanoid';
import { useProjectStore } from './project-store';
import { useAppStore } from './app-store';
import { buildSpecIndex, buildFlowMap, buildImplementationStatus } from '../utils/memory-builder';
import type {
  ProjectSummary,
  SpecIndex,
  Decision,
  FlowMap,
  FlowDependency,
  ImplementationStatus,
} from '../types/memory';
import type { LlmChatResponse } from '../types/llm';

function getProjectPath(): string | null {
  return useProjectStore.getState().projectPath;
}

async function ensureMemoryDir(projectPath: string): Promise<void> {
  const dirPath = `${projectPath}/.ddd/memory`;
  try {
    const exists: boolean = await invoke('path_exists', { path: dirPath });
    if (!exists) {
      await invoke('create_directory', { path: dirPath });
    }
  } catch {
    // Best effort
  }
}

async function readFileOrNull(path: string): Promise<string | null> {
  try {
    const exists: boolean = await invoke('path_exists', { path });
    if (!exists) return null;
    return await invoke<string>('read_file', { path });
  } catch {
    return null;
  }
}

let decisionSaveTimer: ReturnType<typeof setTimeout> | null = null;

interface MemoryState {
  summary: ProjectSummary | null;
  specIndex: SpecIndex | null;
  decisions: Decision[];
  flowMap: FlowMap | null;
  implementationStatus: ImplementationStatus | null;
  panelOpen: boolean;
  isRefreshing: boolean;
  summaryGenerating: boolean;

  togglePanel: () => void;
  loadMemory: () => Promise<void>;
  refreshMemory: () => Promise<void>;
  regenerateSummary: () => Promise<void>;
  addDecision: (title: string, rationale: string, affected: string[]) => void;
  editDecision: (id: string, updates: Partial<Pick<Decision, 'title' | 'rationale' | 'affected'>>) => void;
  removeDecision: (id: string) => void;
  getFlowDependencies: (fullFlowId: string) => FlowDependency | null;
  getRelevantDecisions: (domainId?: string, flowId?: string) => Decision[];
  reset: () => void;
}

const defaults = {
  summary: null as ProjectSummary | null,
  specIndex: null as SpecIndex | null,
  decisions: [] as Decision[],
  flowMap: null as FlowMap | null,
  implementationStatus: null as ImplementationStatus | null,
  panelOpen: false,
  isRefreshing: false,
  summaryGenerating: false,
};

export const useMemoryStore = create<MemoryState>((set, get) => ({
  ...defaults,

  togglePanel: () => {
    const opening = !get().panelOpen;
    set({ panelOpen: opening });
    if (opening) {
      get().loadMemory();
    }
  },

  loadMemory: async () => {
    const projectPath = getProjectPath();
    if (!projectPath) return;

    const memDir = `${projectPath}/.ddd/memory`;

    // Load all layers in parallel
    const [summaryMd, specIndexYaml, decisionsYaml, flowMapYaml, statusYaml] = await Promise.all([
      readFileOrNull(`${memDir}/summary.md`),
      readFileOrNull(`${memDir}/spec-index.yaml`),
      readFileOrNull(`${memDir}/decisions.yaml`),
      readFileOrNull(`${memDir}/flow-map.yaml`),
      readFileOrNull(`${memDir}/status.yaml`),
    ]);

    const updates: Partial<MemoryState> = {};

    if (summaryMd) {
      try {
        // Summary is markdown with frontmatter-like metadata at the end
        const metaMatch = summaryMd.match(/<!--\s*generatedAt:\s*(.+?)\s*-->/);
        updates.summary = {
          content: summaryMd.replace(/<!--.*?-->/gs, '').trim(),
          generatedAt: metaMatch?.[1] ?? '',
          stale: false,
        };
      } catch {
        // Ignore parse errors
      }
    }

    if (specIndexYaml) {
      try { updates.specIndex = parse(specIndexYaml) as SpecIndex; } catch { /* ignore */ }
    }

    if (decisionsYaml) {
      try { updates.decisions = parse(decisionsYaml) as Decision[]; } catch { /* ignore */ }
    }

    if (flowMapYaml) {
      try { updates.flowMap = parse(flowMapYaml) as FlowMap; } catch { /* ignore */ }
    }

    if (statusYaml) {
      try { updates.implementationStatus = parse(statusYaml) as ImplementationStatus; } catch { /* ignore */ }
    }

    set(updates);
  },

  refreshMemory: async () => {
    const projectPath = getProjectPath();
    if (!projectPath) return;

    const { domainConfigs } = useProjectStore.getState();
    set({ isRefreshing: true });

    try {
      await ensureMemoryDir(projectPath);
      const memDir = `${projectPath}/.ddd/memory`;

      const [specIndex, flowMap, implStatus] = await Promise.all([
        buildSpecIndex(projectPath, domainConfigs),
        Promise.resolve(buildFlowMap(domainConfigs)),
        buildImplementationStatus(projectPath, domainConfigs),
      ]);

      // Persist to disk
      await Promise.all([
        invoke('write_file', { path: `${memDir}/spec-index.yaml`, contents: stringify(specIndex) }),
        invoke('write_file', { path: `${memDir}/flow-map.yaml`, contents: stringify(flowMap) }),
        invoke('write_file', { path: `${memDir}/status.yaml`, contents: stringify(implStatus) }),
      ]);

      // Mark summary as stale if spec index changed
      const { summary } = get();
      const updatedSummary = summary ? { ...summary, stale: true } : null;

      set({
        specIndex,
        flowMap,
        implementationStatus: implStatus,
        summary: updatedSummary,
        isRefreshing: false,
      });
    } catch {
      set({ isRefreshing: false });
    }
  },

  regenerateSummary: async () => {
    const projectPath = getProjectPath();
    if (!projectPath) return;

    let { specIndex } = get();

    // Build spec index first if missing
    if (!specIndex) {
      const { domainConfigs } = useProjectStore.getState();
      specIndex = await buildSpecIndex(projectPath, domainConfigs);
      set({ specIndex });
    }

    set({ summaryGenerating: true });

    try {
      // Build a compact prompt from spec index
      const domainSummaries = Object.entries(specIndex.domains).map(([id, d]) => {
        const flowList = Object.entries(d.flows)
          .map(([fid, f]) => `  - ${fid} (${f.type}, ${f.nodeCount} nodes, trigger: ${f.trigger})`)
          .join('\n');
        return `Domain "${id}"${d.description ? ` — ${d.description}` : ''}:\n${flowList}`;
      }).join('\n\n');

      const eventSummary = specIndex.events.length > 0
        ? `\nEvents:\n${specIndex.events.map((e) => `- ${e.name}: ${e.publisher} → ${e.consumers.join(', ')}`).join('\n')}`
        : '';

      const prompt = `Summarize this DDD project in 3-5 sentences. Focus on the domain purpose, key flows, and integration points.\n\n${domainSummaries}${eventSummary}`;

      // Resolve provider (same pattern as llm-store)
      const settings = useAppStore.getState().settings;
      let provider = null;
      let model = '';
      for (const p of settings.llm.providers) {
        if (p.enabled && p.models.length > 0) {
          provider = p;
          model = p.models[0];
          break;
        }
      }

      if (!provider) {
        throw new Error('No LLM provider configured');
      }

      const response = await invoke<LlmChatResponse>('llm_chat', {
        providerType: provider.type,
        model,
        apiKeyEnvVar: provider.apiKeyEnvVar ?? null,
        baseUrl: provider.baseUrl ?? null,
        messages: [{ role: 'user', content: prompt }],
        systemPrompt: 'You are a concise technical writer. Summarize the project structure clearly.',
        maxTokens: 1024,
      });

      const now = new Date().toISOString();
      const summaryObj: ProjectSummary = {
        content: response.content.trim(),
        generatedAt: now,
        stale: false,
      };

      // Persist
      await ensureMemoryDir(projectPath);
      const summaryMd = `${summaryObj.content}\n\n<!-- generatedAt: ${now} -->`;
      await invoke('write_file', {
        path: `${projectPath}/.ddd/memory/summary.md`,
        contents: summaryMd,
      });

      set({ summary: summaryObj, summaryGenerating: false });
    } catch (e) {
      console.error('[Memory] Summary generation failed:', e);
      set({ summaryGenerating: false });
    }
  },

  addDecision: (title, rationale, affected) => {
    const decision: Decision = {
      id: nanoid(),
      date: new Date().toISOString().slice(0, 10),
      title,
      rationale,
      affected,
      author: 'user',
    };
    const decisions = [...get().decisions, decision];
    set({ decisions });
    debounceSaveDecisions(decisions);
  },

  editDecision: (id, updates) => {
    const decisions = get().decisions.map((d) =>
      d.id === id ? { ...d, ...updates } : d
    );
    set({ decisions });
    debounceSaveDecisions(decisions);
  },

  removeDecision: (id) => {
    const decisions = get().decisions.filter((d) => d.id !== id);
    set({ decisions });
    debounceSaveDecisions(decisions);
  },

  getFlowDependencies: (fullFlowId) => {
    return get().flowMap?.flowDependencies[fullFlowId] ?? null;
  },

  getRelevantDecisions: (domainId?, flowId?) => {
    const { decisions } = get();
    if (!domainId) return decisions.slice(0, 5);
    return decisions.filter((d) => {
      return d.affected.some((a) => {
        if (a === domainId) return true;
        if (flowId && a === `${domainId}/${flowId}`) return true;
        if (flowId && a === flowId) return true;
        return false;
      });
    }).slice(0, 5);
  },

  reset: () => {
    if (decisionSaveTimer) clearTimeout(decisionSaveTimer);
    set({ ...defaults });
  },
}));

function debounceSaveDecisions(decisions: Decision[]) {
  if (decisionSaveTimer) clearTimeout(decisionSaveTimer);
  decisionSaveTimer = setTimeout(async () => {
    const projectPath = getProjectPath();
    if (!projectPath) return;
    try {
      await ensureMemoryDir(projectPath);
      await invoke('write_file', {
        path: `${projectPath}/.ddd/memory/decisions.yaml`,
        contents: stringify(decisions),
      });
    } catch {
      // Best effort
    }
  }, 500);
}
