export interface RecentProject {
  name: string;
  path: string;
  lastOpenedAt: string;
  description?: string;
}

export interface NewProjectConfig {
  name: string;
  location: string;
  description: string;
  initGit: boolean;
  techStack: {
    language: string;
    languageVersion: string;
    framework: string;
    database: string;
    orm: string;
    cache?: string;
  };
  domains: Array<{ name: string; description: string }>;
}

export type AppView = 'launcher' | 'first-run' | 'project';

export interface GlobalSettings {
  llm: {
    providers: ProviderConfig[];
  };
  models: {
    taskRouting: Record<string, string>;
    fallbackChain: string[];
    costLimit?: { daily: number; monthly: number };
  };
  claudeCode: {
    enabled: boolean;
    command: string;
    postImplement: {
      runTests: boolean;
      runLint: boolean;
      autoCommit: boolean;
      regenerateClaudeMd: boolean;
    };
  };
  testing: {
    command: string;
    args: string[];
    scoped: boolean;
    scopePattern: string;
    autoRun: boolean;
  };
  editor: {
    gridSnap: boolean;
    autoSaveInterval: number;
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    ghostPreviewAnimation: boolean;
  };
  git: {
    autoCommitMessage: string;
    branchNaming: string;
  };
  reconciliation: {
    autoRun: boolean;
    autoAcceptMatching: boolean;
    notifyOnDrift: boolean;
  };
  testGeneration: {
    autoDerive: boolean;
    includeInPrompt: boolean;
    complianceCheck: boolean;
  };
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'anthropic' | 'openai' | 'ollama' | 'openai_compatible';
  apiKeyEnvVar?: string;
  baseUrl?: string;
  models: string[];
  enabled: boolean;
}

export interface FlowSnapshot {
  nodes: unknown[];
  connections: unknown[];
  specValues: Record<string, unknown>;
  timestamp: number;
  description: string;
}

export interface UndoState {
  undoStack: FlowSnapshot[];
  redoStack: FlowSnapshot[];
  maxHistory: number;
}

export interface AppError {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'fatal';
  component: string;
  message: string;
  detail?: string;
  recoveryAction?: {
    label: string;
    action: () => void;
  };
  timestamp: number;
  dismissed: boolean;
}
