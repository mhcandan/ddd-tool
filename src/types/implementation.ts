export type ImplementationPanelState =
  | 'idle'
  | 'prompt_ready'
  | 'running'
  | 'done'
  | 'failed';

export interface QueueItem {
  flowId: string;
  domainId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  selected: boolean;
}

export interface BuiltPrompt {
  title: string;
  content: string;
  flowId: string;
  domainId: string;
}

export interface ProcessSession {
  id: string;
  running: boolean;
  output: string;
  exitCode: number | null;
}

export interface FlowMapping {
  spec: string;
  specHash: string;
  files: string[];
  fileHashes?: Record<string, string>;
  implementedAt: string;
  mode: 'new' | 'update';
  testResults?: TestSummary;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  duration: number;
  cases: TestCase[];
}

export interface TestCase {
  name: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

export interface CommandOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface DriftInfo {
  flowKey: string;
  flowName: string;
  domainId: string;
  specPath: string;
  previousHash: string;
  currentHash: string;
  implementedAt: string;
  detectedAt: string;
  direction: 'forward' | 'reverse';
}

export type ReconciliationAction = 'accept' | 'reimpl' | 'ignore';

export interface ReconciliationEntry {
  flowKey: string;
  action: ReconciliationAction;
  previousHash: string;
  newHash: string;
  resolvedAt: string;
}

export interface ReconciliationReport {
  id: string;
  timestamp: string;
  entries: ReconciliationEntry[];
  syncScoreBefore: number;
  syncScoreAfter: number;
}

export interface SyncScore {
  total: number;
  implemented: number;
  stale: number;
  pending: number;
  score: number;
}
