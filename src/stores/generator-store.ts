import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import type { GeneratorId, GeneratedFile, GeneratorPanelState } from '../types/generator';
import { GENERATOR_REGISTRY, collectGeneratorInput } from '../utils/generators';
import { useProjectStore } from './project-store';
import { parseOpenApiYaml, type ParsedEndpoint } from '../utils/openapi-parser';

interface GeneratorState {
  panelOpen: boolean;
  panelState: GeneratorPanelState;
  selectedGenerator: GeneratorId | null;
  generatedFiles: GeneratedFile[];
  error: string | null;
  saving: boolean;
  apiDocsPanelOpen: boolean;
  parsedEndpoints: ParsedEndpoint[];

  togglePanel: () => void;
  generate: (id: GeneratorId) => Promise<void>;
  saveFiles: () => Promise<void>;
  backToList: () => void;
  toggleApiDocsPanel: () => void;
  loadApiDocs: () => Promise<void>;
  reset: () => void;
}

export const useGeneratorStore = create<GeneratorState>((set, get) => ({
  panelOpen: false,
  panelState: 'list',
  selectedGenerator: null,
  generatedFiles: [],
  error: null,
  saving: false,
  apiDocsPanelOpen: false,
  parsedEndpoints: [],

  togglePanel: () => {
    const open = !get().panelOpen;
    set({ panelOpen: open });
    if (!open) {
      set({ panelState: 'list', selectedGenerator: null, generatedFiles: [], error: null, saving: false });
    }
  },

  generate: async (id) => {
    const entry = GENERATOR_REGISTRY[id];
    if (!entry) return;

    set({ selectedGenerator: id, panelState: 'generating', error: null, generatedFiles: [] });

    try {
      const input = await collectGeneratorInput();
      const files = entry.generate(input);
      set({ generatedFiles: files, panelState: 'preview' });
    } catch (e) {
      set({ error: String(e), panelState: 'list' });
    }
  },

  saveFiles: async () => {
    const { generatedFiles } = get();
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath || generatedFiles.length === 0) return;

    set({ saving: true, error: null });

    try {
      for (const file of generatedFiles) {
        await invoke('write_file', {
          path: `${projectPath}/${file.relativePath}`,
          contents: file.content,
        });
      }
      set({ panelState: 'saved', saving: false });
    } catch (e) {
      set({ error: String(e), saving: false });
    }
  },

  backToList: () => {
    set({ panelState: 'list', selectedGenerator: null, generatedFiles: [], error: null });
  },

  toggleApiDocsPanel: () => {
    set((s) => ({ apiDocsPanelOpen: !s.apiDocsPanelOpen }));
  },

  loadApiDocs: async () => {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;

    try {
      const content: string = await invoke('read_file', {
        path: `${projectPath}/generated/openapi.yaml`,
      });
      const endpoints = parseOpenApiYaml(content);
      set({ parsedEndpoints: endpoints });
    } catch {
      set({ parsedEndpoints: [] });
    }
  },

  reset: () => {
    set({
      panelOpen: false,
      panelState: 'list',
      selectedGenerator: null,
      generatedFiles: [],
      error: null,
      saving: false,
      apiDocsPanelOpen: false,
      parsedEndpoints: [],
    });
  },
}));
