import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from './stores/app-store';
import { useProjectStore } from './stores/project-store';
import { useSheetStore } from './stores/sheet-store';
import { useGitStore } from './stores/git-store';
import { useLlmStore } from './stores/llm-store';
import { useMemoryStore } from './stores/memory-store';
import { useImplementationStore } from './stores/implementation-store';
import { useGeneratorStore } from './stores/generator-store';
import { Breadcrumb } from './components/Navigation/Breadcrumb';
import { SheetTabs } from './components/Navigation/SheetTabs';
import { SystemMap } from './components/SystemMap/SystemMap';
import { DomainMap } from './components/DomainMap/DomainMap';
import { FlowCanvas } from './components/FlowCanvas/FlowCanvas';
import { GitPanel } from './components/GitPanel/GitPanel';
import { ChatPanel } from './components/LLMAssistant/ChatPanel';
import { MemoryPanel } from './components/MemoryPanel/MemoryPanel';
import { ImplementationPanel } from './components/ImplementationPanel/ImplementationPanel';
import { ReconciliationPanel } from './components/ReconciliationPanel/ReconciliationPanel';
import { GeneratorPanel } from './components/GeneratorPanel/GeneratorPanel';
import { ApiDocsPanel } from './components/ApiDocs/ApiDocsPanel';
import { CrashRecoveryDialog } from './components/shared/CrashRecoveryDialog';
import { AgentTestPanel } from './components/AgentTesting/AgentTestPanel';
import { DashboardPanel } from './components/OrchestrationDashboard/DashboardPanel';
import { useAgentTestStore } from './stores/agent-test-store';
import { useDashboardStore } from './stores/dashboard-store';

export function AppShell() {
  const currentProjectPath = useAppStore((s) => s.currentProjectPath);
  const setView = useAppStore((s) => s.setView);
  const pushError = useAppStore((s) => s.pushError);
  const loading = useProjectStore((s) => s.loading);
  const loaded = useProjectStore((s) => s.loaded);
  const level = useSheetStore((s) => s.current.level);
  const panelOpen = useGitStore((s) => s.panelOpen);
  const llmPanelOpen = useLlmStore((s) => s.panelOpen);
  const memoryPanelOpen = useMemoryStore((s) => s.panelOpen);
  const implPanelOpen = useImplementationStore((s) => s.panelOpen);
  const reconPanelOpen = useImplementationStore((s) => s.reconPanelOpen);
  const generatorPanelOpen = useGeneratorStore((s) => s.panelOpen);
  const apiDocsPanelOpen = useGeneratorStore((s) => s.apiDocsPanelOpen);
  const agentTestPanelOpen = useAgentTestStore((s) => s.panelOpen);
  const dashboardPanelOpen = useDashboardStore((s) => s.panelOpen);
  const loadedPathRef = useRef<string | null>(null);

  const [recoveryFiles, setRecoveryFiles] = useState<string[]>([]);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!currentProjectPath) return;
    // Prevent double-loading in StrictMode
    if (loadedPathRef.current === currentProjectPath) return;
    loadedPathRef.current = currentProjectPath;

    useSheetStore.getState().reset();
    useProjectStore.getState().loadProject(currentProjectPath).then(async () => {
      useGitStore.getState().refresh();
      useMemoryStore.getState().loadMemory();
      useImplementationStore.getState().loadMappings();

      // Check for crash recovery autosave files
      try {
        const files: string[] = await invoke('list_directory', {
          path: `${currentProjectPath}/.ddd/autosave`,
        });
        const yamlFiles = files.filter((f) => f.endsWith('.yaml'));
        if (yamlFiles.length > 0) {
          setRecoveryFiles(yamlFiles);
          setShowRecovery(true);
        }
      } catch {
        // No autosave dir — nothing to recover
      }
    }).catch((e) => {
      pushError('error', 'project', 'Failed to load project', String(e));
    });

    return () => {
      loadedPathRef.current = null;
      useProjectStore.getState().reset();
      useGitStore.getState().reset();
      useMemoryStore.getState().reset();
      useImplementationStore.getState().reset();
      useGeneratorStore.getState().reset();
    };
  }, [currentProjectPath, pushError]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Breadcrumb />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-text-muted">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="h-screen flex flex-col">
        <Breadcrumb />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <p className="text-sm text-danger">Failed to load project.</p>
            <button className="btn-secondary text-xs" onClick={() => setView('launcher')}>
              Back to Launcher
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Breadcrumb />
      <SheetTabs />
      <div className="flex-1 flex flex-row overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {level === 'system' && <SystemMap />}
          {level === 'domain' && <DomainMap />}
          {level === 'flow' && <FlowCanvas />}
        </div>
        {llmPanelOpen && <ChatPanel />}
        {memoryPanelOpen && <MemoryPanel />}
        {implPanelOpen && <ImplementationPanel />}
        {reconPanelOpen && <ReconciliationPanel />}
        {generatorPanelOpen && <GeneratorPanel />}
        {apiDocsPanelOpen && <ApiDocsPanel />}
        {agentTestPanelOpen && <AgentTestPanel />}
        {dashboardPanelOpen && <DashboardPanel />}
        {panelOpen && <GitPanel />}
      </div>

      {showRecovery && currentProjectPath && (
        <CrashRecoveryDialog
          projectPath={currentProjectPath}
          files={recoveryFiles}
          onDone={() => {
            setShowRecovery(false);
            setRecoveryFiles([]);
          }}
        />
      )}
    </div>
  );
}
