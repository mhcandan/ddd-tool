import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from './project-store';
import type { GitFileEntry, GitStatusResult, GitLogEntry } from '../types/git';

interface GitState {
  branch: string;
  staged: GitFileEntry[];
  unstaged: GitFileEntry[];
  untracked: string[];
  log: GitLogEntry[];
  loading: boolean;
  committing: boolean;
  panelOpen: boolean;
  commitMessage: string;

  refresh: () => Promise<void>;
  stageFile: (filePath: string) => Promise<void>;
  unstageFile: (filePath: string) => Promise<void>;
  stageAll: () => Promise<void>;
  commit: () => Promise<void>;
  setCommitMessage: (msg: string) => void;
  togglePanel: () => void;
  reset: () => void;
}

function getProjectPath(): string | null {
  return useProjectStore.getState().projectPath;
}

const defaults = {
  branch: '',
  staged: [] as GitFileEntry[],
  unstaged: [] as GitFileEntry[],
  untracked: [] as string[],
  log: [] as GitLogEntry[],
  loading: false,
  committing: false,
  panelOpen: false,
  commitMessage: '',
};

export const useGitStore = create<GitState>((set, get) => ({
  ...defaults,

  refresh: async () => {
    const path = getProjectPath();
    if (!path) return;

    set({ loading: true });
    try {
      const [status, log] = await Promise.all([
        invoke<GitStatusResult>('git_status', { path }),
        invoke<GitLogEntry[]>('git_log', { path, limit: 20 }),
      ]);
      set({
        branch: status.branch,
        staged: status.staged,
        unstaged: status.unstaged,
        untracked: status.untracked,
        log,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  stageFile: async (filePath) => {
    const path = getProjectPath();
    if (!path) return;
    await invoke('git_stage_file', { path, filePath });
    await get().refresh();
  },

  unstageFile: async (filePath) => {
    const path = getProjectPath();
    if (!path) return;
    await invoke('git_unstage_file', { path, filePath });
    await get().refresh();
  },

  stageAll: async () => {
    const path = getProjectPath();
    if (!path) return;
    await invoke('git_add_all', { path });
    await get().refresh();
  },

  commit: async () => {
    const path = getProjectPath();
    const { commitMessage } = get();
    if (!path || !commitMessage.trim()) return;

    set({ committing: true });
    try {
      await invoke('git_commit', { path, message: commitMessage.trim() });
      set({ commitMessage: '' });
      await get().refresh();
    } finally {
      set({ committing: false });
    }
  },

  setCommitMessage: (msg) => set({ commitMessage: msg }),

  togglePanel: () => {
    const opening = !get().panelOpen;
    set({ panelOpen: opening });
    if (opening) {
      get().refresh();
    }
  },

  reset: () => set({ ...defaults }),
}));
