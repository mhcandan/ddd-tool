import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { Command } from '@tauri-apps/plugin-shell';
import { stringify, parse } from 'yaml';
import { nanoid } from 'nanoid';
import { useFlowStore } from './flow-store';
import { useProjectStore } from './project-store';
import { useAppStore } from './app-store';
import { buildImplementationPrompt } from '../utils/implementation-prompt';
import type {
  ImplementationPanelState,
  QueueItem,
  BuiltPrompt,
  FlowMapping,
  TestSummary,
  TestCase,
  CommandOutput,
  DriftInfo,
  ReconciliationAction,
  ReconciliationEntry,
  ReconciliationReport,
  SyncScore,
} from '../types/implementation';

interface ImplementationState {
  panelOpen: boolean;
  panelState: ImplementationPanelState;
  currentPrompt: BuiltPrompt | null;
  processOutput: string;
  processRunning: boolean;
  processExitCode: number | null;
  testResults: TestSummary | null;
  queue: QueueItem[];
  mappings: Record<string, FlowMapping>;
  error: string | null;
  driftItems: DriftInfo[];
  reconPanelOpen: boolean;
  syncScore: SyncScore | null;
  ignoredDrifts: Set<string>;

  togglePanel: () => void;
  openPanel: () => void;
  buildPrompt: (flowId: string, domainId: string) => Promise<void>;
  updatePromptContent: (content: string) => void;
  runImplementation: () => Promise<void>;
  cancelImplementation: () => void;
  runTests: () => Promise<void>;
  fixFailingTest: (testCase: TestCase) => Promise<void>;
  fixRuntimeError: (errorDescription: string) => void;
  loadMappings: () => Promise<void>;
  saveMappings: () => Promise<void>;
  recordImplementation: (flowId: string, domainId: string) => Promise<void>;
  detectDrift: () => Promise<void>;
  computeSyncScore: () => SyncScore;
  resolveFlow: (flowKey: string, action: ReconciliationAction) => Promise<void>;
  resolveAll: (action: ReconciliationAction) => Promise<void>;
  saveReconciliationReport: (entries: ReconciliationEntry[]) => Promise<void>;
  toggleReconPanel: () => void;
  reset: () => void;
}

let activeChild: { kill: () => Promise<void> } | null = null;

export const useImplementationStore = create<ImplementationState>((set, get) => ({
  panelOpen: false,
  panelState: 'idle',
  currentPrompt: null,
  processOutput: '',
  processRunning: false,
  processExitCode: null,
  testResults: null,
  queue: [],
  mappings: {},
  error: null,
  driftItems: [],
  reconPanelOpen: false,
  syncScore: null,
  ignoredDrifts: new Set<string>(),

  togglePanel: () => {
    set((s) => ({ panelOpen: !s.panelOpen }));
  },

  openPanel: () => {
    set({ panelOpen: true });
  },

  buildPrompt: async (_flowId, domainId) => {
    const flow = useFlowStore.getState().currentFlow;
    const domainConfigs = useProjectStore.getState().domainConfigs;
    const projectPath = useProjectStore.getState().projectPath;
    const domainConfig = domainConfigs[domainId];

    if (!flow || !domainConfig || !projectPath) {
      set({ error: 'Missing flow, domain, or project data' });
      return;
    }

    try {
      const { mappings } = get();
      const prompt = await buildImplementationPrompt(
        flow,
        domainConfig,
        projectPath,
        mappings,
      );
      set({
        currentPrompt: prompt,
        panelState: 'prompt_ready',
        error: null,
        processOutput: '',
        processExitCode: null,
        testResults: null,
      });
    } catch (e) {
      set({ error: `Failed to build prompt: ${e}` });
    }
  },

  updatePromptContent: (content) => {
    const { currentPrompt } = get();
    if (!currentPrompt) return;
    set({ currentPrompt: { ...currentPrompt, content } });
  },

  runImplementation: async () => {
    const { currentPrompt } = get();
    if (!currentPrompt) return;

    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;

    const settings = useAppStore.getState().settings;
    const claudeCommand = settings?.claudeCode?.command || 'claude';

    set({
      panelState: 'running',
      processRunning: true,
      processOutput: '',
      processExitCode: null,
      error: null,
    });

    try {
      // Write prompt to temp file and pipe to claude via shell
      // to avoid CLI argument length limits and escaping issues
      const promptPath = `${projectPath}/.ddd/.impl-prompt.md`;
      try {
        await invoke('create_directory', { path: `${projectPath}/.ddd` });
      } catch { /* may already exist */ }
      await invoke('write_file', {
        path: promptPath,
        contents: currentPrompt.content,
      });

      // Source user's shell profile for PATH, then pipe prompt to claude
      // --dangerously-skip-permissions: auto-accept file writes (user explicitly clicked Implement)
      const escapedPromptPath = promptPath.replace(/"/g, '\\"');
      const shellScript = `. ~/.zprofile 2>/dev/null; . ~/.zshrc 2>/dev/null; cat "${escapedPromptPath}" | ${claudeCommand} --print --dangerously-skip-permissions 2>&1`;
      const command = Command.create('sh', ['-c', shellScript], { cwd: projectPath });

      command.stdout.on('data', (line) => {
        set((s) => ({ processOutput: s.processOutput + line + '\n' }));
      });

      command.stderr.on('data', (line) => {
        set((s) => ({ processOutput: s.processOutput + line + '\n' }));
      });

      command.on('close', (data) => {
        const exitCode = data.code ?? -1;
        activeChild = null;
        // Clean up temp prompt file
        invoke('delete_file', { path: promptPath }).catch(() => {});
        set({
          processRunning: false,
          processExitCode: exitCode,
          panelState: exitCode === 0 ? 'done' : 'failed',
          error: exitCode !== 0 ? `Process exited with code ${exitCode}` : null,
        });

        // Auto-record implementation on success
        if (exitCode === 0) {
          const { recordImplementation } = get();
          recordImplementation(currentPrompt.flowId, currentPrompt.domainId);

          // Auto-run tests if configured
          const appSettings = useAppStore.getState().settings;
          if (appSettings?.claudeCode?.postImplement?.runTests) {
            get().runTests();
          }
        }
      });

      command.on('error', (error) => {
        activeChild = null;
        set({
          processRunning: false,
          panelState: 'failed',
          error: `Process error: ${error}`,
        });
      });

      const child = await command.spawn();
      activeChild = child;
    } catch (e) {
      set({
        processRunning: false,
        panelState: 'failed',
        error: `Failed to spawn process: ${e}`,
      });
    }
  },

  cancelImplementation: () => {
    if (activeChild) {
      activeChild.kill().catch(() => {});
      activeChild = null;
    }
    set({
      processRunning: false,
      panelState: 'failed',
      error: 'Implementation cancelled',
    });
  },

  runTests: async () => {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;

    const settings = useAppStore.getState().settings;
    const testCommand = settings?.testing?.command || 'npm';
    const testArgs = settings?.testing?.args || ['test'];

    set((s) => ({
      processOutput: s.processOutput + '\n--- Running tests ---\n',
    }));

    try {
      const result: CommandOutput = await invoke('run_command', {
        command: testCommand,
        args: testArgs,
        cwd: projectPath,
      });

      const testSummary = parseTestOutput(result.stdout + result.stderr);
      set({ testResults: testSummary });

      set((s) => ({
        processOutput:
          s.processOutput + result.stdout + (result.stderr ? '\n' + result.stderr : ''),
      }));
    } catch (e) {
      set((s) => ({
        processOutput: s.processOutput + `\nTest execution failed: ${e}\n`,
      }));
    }
  },

  fixFailingTest: async (testCase) => {
    const { currentPrompt } = get();
    if (!currentPrompt) return;

    const fixPrompt: BuiltPrompt = {
      ...currentPrompt,
      title: `Fix: ${testCase.name}`,
      content: [
        `# Fix Failing Test: ${testCase.name}`,
        '',
        `Test error:`,
        '```',
        testCase.error ?? 'Unknown error',
        '```',
        '',
        `Fix this failing test. The test is part of the implementation for flow "${currentPrompt.flowId}" in domain "${currentPrompt.domainId}".`,
        '',
        'Do not change the test expectations unless the spec has changed. Fix the implementation to match the test.',
      ].join('\n'),
    };

    set({
      currentPrompt: fixPrompt,
      panelState: 'prompt_ready',
      processOutput: '',
      processExitCode: null,
    });
  },

  fixRuntimeError: (errorDescription) => {
    const { currentPrompt } = get();
    if (!currentPrompt) return;

    const fixPrompt: BuiltPrompt = {
      ...currentPrompt,
      title: `Fix runtime error: ${currentPrompt.flowId}`,
      content: [
        `# Fix Runtime Error`,
        '',
        `Flow: "${currentPrompt.flowId}" in domain "${currentPrompt.domainId}"`,
        '',
        `## Error`,
        '```',
        errorDescription,
        '```',
        '',
        `## Instructions`,
        `The implementation for this flow has a runtime error. Read the existing code, identify the root cause, and fix it.`,
        `- Do NOT rewrite from scratch — fix the existing implementation`,
        `- Make sure the fix handles edge cases`,
        `- Run the existing tests after fixing to ensure nothing breaks`,
        `- If the error is due to missing infrastructure (database, env vars), set up a working local default`,
      ].join('\n'),
    };

    set({
      currentPrompt: fixPrompt,
      panelState: 'prompt_ready',
      processOutput: '',
      processExitCode: null,
      testResults: null,
    });
  },

  loadMappings: async () => {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;

    try {
      const content: string = await invoke('read_file', {
        path: `${projectPath}/.ddd/mapping.yaml`,
      });
      const parsed = parse(content) as { flows?: Record<string, FlowMapping> };
      set({ mappings: parsed.flows ?? {} });
    } catch {
      // File doesn't exist yet — that's fine
      set({ mappings: {} });
    }

    // Auto-detect drift after loading mappings
    get().detectDrift();
  },

  saveMappings: async () => {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;

    const { mappings } = get();
    const content = stringify({ flows: mappings });

    try {
      await invoke('create_directory', {
        path: `${projectPath}/.ddd`,
      });
    } catch {
      // Directory may already exist
    }

    await invoke('write_file', {
      path: `${projectPath}/.ddd/mapping.yaml`,
      contents: content,
    });
  },

  recordImplementation: async (flowId, domainId) => {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;

    const flowKey = `${domainId}/${flowId}`;
    const specPath = `specs/domains/${domainId}/flows/${flowId}.yaml`;

    let specHash = '';
    try {
      specHash = await invoke<string>('compute_file_hash', {
        path: `${projectPath}/${specPath}`,
      });
    } catch {
      // Hash computation may fail if file doesn't exist
    }

    // Extract file paths from implementation output
    const files = extractFilePaths(get().processOutput, projectPath);

    // Compute hashes for implementation files (for reverse drift detection)
    const fileHashes: Record<string, string> = {};
    for (const file of files) {
      try {
        const hash = await invoke<string>('compute_file_hash', {
          path: `${projectPath}/${file}`,
        });
        if (hash) fileHashes[file] = hash;
      } catch {
        // File may not exist or be inaccessible
      }
    }

    const mapping: FlowMapping = {
      spec: specPath,
      specHash,
      files,
      fileHashes,
      implementedAt: new Date().toISOString(),
      mode: get().mappings[flowKey] ? 'update' : 'new',
      testResults: get().testResults ?? undefined,
    };

    set((s) => ({
      mappings: { ...s.mappings, [flowKey]: mapping },
    }));

    // Save to disk
    get().saveMappings();
  },

  detectDrift: async () => {
    const projectPath = useProjectStore.getState().projectPath;
    const domainConfigs = useProjectStore.getState().domainConfigs;
    if (!projectPath) return;

    const { mappings } = get();
    const driftItems: DriftInfo[] = [];
    const now = new Date().toISOString();

    for (const [domainId, config] of Object.entries(domainConfigs)) {
      for (const flow of config.flows) {
        const flowKey = `${domainId}/${flow.id}`;
        const mapping = mappings[flowKey];
        if (!mapping) continue;

        // Forward drift: spec file changed since last implementation
        let currentSpecHash = '';
        try {
          currentSpecHash = await invoke<string>('compute_file_hash', {
            path: `${projectPath}/${mapping.spec}`,
          });
        } catch {
          continue;
        }

        if (currentSpecHash && currentSpecHash !== mapping.specHash) {
          driftItems.push({
            flowKey,
            flowName: flow.name,
            domainId,
            specPath: mapping.spec,
            previousHash: mapping.specHash,
            currentHash: currentSpecHash,
            implementedAt: mapping.implementedAt,
            detectedAt: now,
            direction: 'forward',
          });
          continue; // Don't check reverse if forward drift already detected
        }

        // Reverse drift: implementation files changed since last implementation
        if (mapping.fileHashes && Object.keys(mapping.fileHashes).length > 0) {
          for (const [file, storedHash] of Object.entries(mapping.fileHashes)) {
            let currentFileHash = '';
            try {
              currentFileHash = await invoke<string>('compute_file_hash', {
                path: `${projectPath}/${file}`,
              });
            } catch {
              continue;
            }

            if (currentFileHash && currentFileHash !== storedHash) {
              driftItems.push({
                flowKey,
                flowName: flow.name,
                domainId,
                specPath: mapping.spec,
                previousHash: storedHash,
                currentHash: currentFileHash,
                implementedAt: mapping.implementedAt,
                detectedAt: now,
                direction: 'reverse',
              });
              break; // One changed file is enough to flag the flow
            }
          }
        }
      }
    }

    set({ driftItems });
    const syncScore = get().computeSyncScore();
    set({ syncScore });
  },

  computeSyncScore: () => {
    const { mappings, driftItems } = get();
    const domainConfigs = useProjectStore.getState().domainConfigs;

    let total = 0;
    for (const config of Object.values(domainConfigs)) {
      total += config.flows.length;
    }

    const staleKeys = new Set(driftItems.map((d) => d.flowKey));
    const implementedCount = Object.keys(mappings).filter((k) => !staleKeys.has(k)).length;
    const stale = staleKeys.size;
    const pending = total - implementedCount - stale;
    const score = total > 0 ? Math.round((implementedCount / total) * 100) : 0;

    return { total, implemented: implementedCount, stale, pending, score };
  },

  resolveFlow: async (flowKey, action) => {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath) return;

    const { driftItems, mappings } = get();
    const drift = driftItems.find((d) => d.flowKey === flowKey);
    if (!drift) return;

    if (action === 'accept') {
      // Update mapping hash to current hash
      const mapping = mappings[flowKey];
      if (mapping) {
        const updated: FlowMapping = { ...mapping, specHash: drift.currentHash };
        const newMappings = { ...mappings, [flowKey]: updated };
        set({ mappings: newMappings });
        // Remove from drift items
        set((s) => ({
          driftItems: s.driftItems.filter((d) => d.flowKey !== flowKey),
        }));
        // Persist
        const content = stringify({ flows: newMappings });
        try {
          await invoke('write_file', {
            path: `${projectPath}/.ddd/mapping.yaml`,
            contents: content,
          });
        } catch { /* best effort */ }
      }
    } else if (action === 'reimpl') {
      // Open implementation panel with prompt for this flow
      const [domainId, flowId] = flowKey.split('/');
      set({ panelOpen: true });
      get().buildPrompt(flowId, domainId);
    } else if (action === 'ignore') {
      set((s) => {
        const newIgnored = new Set(s.ignoredDrifts);
        newIgnored.add(flowKey);
        return {
          ignoredDrifts: newIgnored,
          driftItems: s.driftItems.filter((d) => d.flowKey !== flowKey),
        };
      });
    }

    // Update sync score
    const syncScore = get().computeSyncScore();
    set({ syncScore });

    // Save reconciliation report entry
    if (drift && (action === 'accept' || action === 'ignore')) {
      const entry: ReconciliationEntry = {
        flowKey,
        action,
        previousHash: drift.previousHash,
        newHash: drift.currentHash,
        resolvedAt: new Date().toISOString(),
      };
      get().saveReconciliationReport([entry]);
    }
  },

  resolveAll: async (action) => {
    const { driftItems } = get();
    if (driftItems.length === 0) return;

    const scoreBefore = get().computeSyncScore();
    const entries: ReconciliationEntry[] = [];

    // Process all drift items
    const items = [...driftItems];
    for (const drift of items) {
      if (action === 'accept') {
        const { mappings } = get();
        const mapping = mappings[drift.flowKey];
        if (mapping) {
          const updated: FlowMapping = { ...mapping, specHash: drift.currentHash };
          set((s) => ({
            mappings: { ...s.mappings, [drift.flowKey]: updated },
          }));
        }
        entries.push({
          flowKey: drift.flowKey,
          action,
          previousHash: drift.previousHash,
          newHash: drift.currentHash,
          resolvedAt: new Date().toISOString(),
        });
      } else if (action === 'ignore') {
        set((s) => {
          const newIgnored = new Set(s.ignoredDrifts);
          newIgnored.add(drift.flowKey);
          return { ignoredDrifts: newIgnored };
        });
        entries.push({
          flowKey: drift.flowKey,
          action,
          previousHash: drift.previousHash,
          newHash: drift.currentHash,
          resolvedAt: new Date().toISOString(),
        });
      }
    }

    // Clear drift items and persist mappings
    set({ driftItems: [] });

    if (action === 'accept') {
      get().saveMappings();
    }

    const scoreAfter = get().computeSyncScore();
    set({ syncScore: scoreAfter });

    // Save report with before/after scores
    if (entries.length > 0) {
      const report: ReconciliationReport = {
        id: nanoid(),
        timestamp: new Date().toISOString(),
        entries,
        syncScoreBefore: scoreBefore.score,
        syncScoreAfter: scoreAfter.score,
      };

      const projectPath = useProjectStore.getState().projectPath;
      if (projectPath) {
        const dir = `${projectPath}/.ddd/reconciliations`;
        try {
          await invoke('create_directory', { path: dir });
        } catch { /* may exist */ }
        const filename = new Date().toISOString().replace(/[:.]/g, '-');
        await invoke('write_file', {
          path: `${dir}/${filename}.yaml`,
          contents: stringify(report),
        }).catch(() => {});
      }
    }
  },

  saveReconciliationReport: async (entries) => {
    const projectPath = useProjectStore.getState().projectPath;
    if (!projectPath || entries.length === 0) return;

    const syncScore = get().computeSyncScore();
    const report: ReconciliationReport = {
      id: nanoid(),
      timestamp: new Date().toISOString(),
      entries,
      syncScoreBefore: syncScore.score,
      syncScoreAfter: syncScore.score,
    };

    const dir = `${projectPath}/.ddd/reconciliations`;
    try {
      await invoke('create_directory', { path: dir });
    } catch { /* may exist */ }

    const filename = new Date().toISOString().replace(/[:.]/g, '-');
    await invoke('write_file', {
      path: `${dir}/${filename}.yaml`,
      contents: stringify(report),
    }).catch(() => {});
  },

  toggleReconPanel: () => {
    set((s) => ({ reconPanelOpen: !s.reconPanelOpen }));
  },

  reset: () => {
    if (activeChild) {
      activeChild.kill().catch(() => {});
      activeChild = null;
    }
    set({
      panelOpen: false,
      panelState: 'idle',
      currentPrompt: null,
      processOutput: '',
      processRunning: false,
      processExitCode: null,
      testResults: null,
      queue: [],
      mappings: {},
      error: null,
      driftItems: [],
      reconPanelOpen: false,
      syncScore: null,
      ignoredDrifts: new Set<string>(),
    });
  },
}));

function parseTestOutput(output: string): TestSummary {
  const cases: TestCase[] = [];
  let total = 0;
  let passed = 0;
  let failed = 0;
  let duration = 0;

  const lines = output.split('\n');
  let lastFailedCase: TestCase | null = null;
  let collectingError = false;
  const errorLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match common test output patterns (Jest, Vitest, pytest, etc.)
    const passMatch = line.match(/✓|✔|PASS|passed|ok\s+\d/i);
    const failMatch = line.match(/✗|✘|FAIL|failed|not ok\s+\d/i);

    if (passMatch || failMatch) {
      // Flush any error being collected for the previous failed test
      if (lastFailedCase && errorLines.length > 0) {
        lastFailedCase.error = errorLines.join('\n').trim();
        errorLines.length = 0;
      }
      collectingError = false;
      lastFailedCase = null;

      const status = passMatch ? 'passed' : 'failed';
      const name = line.replace(/^\s*[✓✔✗✘]\s*/, '').replace(/\(\d+m?s\)/, '').trim();
      const durationMatch = line.match(/\((\d+)m?s\)/);
      const testDuration = durationMatch ? parseInt(durationMatch[1], 10) / 1000 : 0;

      if (name) {
        const testCase: TestCase = { name, status, duration: testDuration };
        cases.push(testCase);
        total++;
        if (status === 'passed') {
          passed++;
        } else {
          failed++;
          lastFailedCase = testCase;
          collectingError = true;
        }
      }
      continue;
    }

    // Collect error lines after a failed test
    if (collectingError && lastFailedCase) {
      // Stop collecting on blank line after we have some content, or on next test/summary
      const trimmed = line.trim();
      if (trimmed === '' && errorLines.length > 0) {
        // Check if next non-empty line is a new test — if so, flush
        const nextNonEmpty = lines.slice(i + 1).find((l) => l.trim() !== '');
        if (nextNonEmpty && (nextNonEmpty.match(/^\s*[✓✔✗✘]/) || nextNonEmpty.match(/\d+\s+(?:passing|failed|failing)/i))) {
          lastFailedCase.error = errorLines.join('\n').trim();
          errorLines.length = 0;
          collectingError = false;
          lastFailedCase = null;
          continue;
        }
      }
      // Capture error/stack trace lines (indented or containing error keywords)
      if (trimmed !== '' || errorLines.length > 0) {
        errorLines.push(line);
      }
      // Limit error capture to 30 lines
      if (errorLines.length >= 30) {
        lastFailedCase.error = errorLines.join('\n').trim();
        errorLines.length = 0;
        collectingError = false;
        lastFailedCase = null;
      }
      continue;
    }

    // Try to capture summary lines
    const summaryMatch = line.match(/(\d+)\s+(?:passing|passed)/i);
    if (summaryMatch && total === 0) {
      passed = parseInt(summaryMatch[1], 10);
      total = passed;
    }
    const failSummaryMatch = line.match(/(\d+)\s+(?:failing|failed)/i);
    if (failSummaryMatch) {
      failed = parseInt(failSummaryMatch[1], 10);
      total = passed + failed;
    }

    // Duration
    const durationMatch = line.match(/(?:Time|Duration):\s*([\d.]+)\s*s/i);
    if (durationMatch) {
      duration = parseFloat(durationMatch[1]);
    }
  }

  // Flush any remaining error
  if (lastFailedCase && errorLines.length > 0) {
    lastFailedCase.error = errorLines.join('\n').trim();
  }

  return { total, passed, failed, duration, cases };
}

/** Extract file paths from implementation output (created/modified files). */
function extractFilePaths(output: string, projectPath: string): string[] {
  const files = new Set<string>();
  const lines = output.split('\n');

  // Common source file extensions
  const extPattern = /\.(ts|tsx|js|jsx|py|rs|go|java|rb|css|scss|html|json|yaml|yml|sql|graphql|proto|md)$/;

  for (const line of lines) {
    // Match patterns like "Created src/foo.ts", "Modified src/bar.ts", "Wrote to src/baz.ts"
    const writeMatch = line.match(/(?:creat|modif|writ|updat|add|edit|generat)\w*\s+[`"']?([^\s`"']+\.\w+)[`"']?/i);
    if (writeMatch && extPattern.test(writeMatch[1])) {
      files.add(writeMatch[1]);
      continue;
    }

    // Match file paths that appear on their own or with common prefixes
    const pathMatch = line.match(/^\s*[-+*>●]\s+([^\s]+\.\w+)/);
    if (pathMatch && extPattern.test(pathMatch[1])) {
      files.add(pathMatch[1]);
      continue;
    }

    // Match absolute paths within the project
    if (projectPath) {
      const absMatch = line.match(new RegExp(projectPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/([^\\s`"\']+\\.[a-z]+)', 'i'));
      if (absMatch && extPattern.test(absMatch[1])) {
        files.add(absMatch[1]);
      }
    }
  }

  // Filter out spec files (those are tracked separately) and non-source files
  return Array.from(files).filter((f) =>
    !f.startsWith('specs/') && !f.startsWith('.ddd/')
  );
}
