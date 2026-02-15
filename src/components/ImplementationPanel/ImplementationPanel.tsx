import { useEffect, useState } from 'react';
import { Play, X, RotateCw, Pencil, Bug } from 'lucide-react';
import { useImplementationStore } from '../../stores/implementation-store';
import { PromptPreview } from './PromptPreview';
import { TerminalOutput } from './TerminalOutput';
import { TestResults } from './TestResults';
import { ClaudeCommandBox } from './ClaudeCommandBox';
import { CopyButton } from '../shared/CopyButton';

export function ImplementationPanel() {
  const panelState = useImplementationStore((s) => s.panelState);
  const error = useImplementationStore((s) => s.error);
  const processExitCode = useImplementationStore((s) => s.processExitCode);
  const togglePanel = useImplementationStore((s) => s.togglePanel);

  // Escape key to close panel (capture phase)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        togglePanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [togglePanel]);

  return (
    <div className="w-[420px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Play className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1">
          Implementation
        </span>
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={togglePanel}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {panelState === 'idle' && <IdleView />}
        {panelState === 'prompt_ready' && <PromptPreview />}
        {panelState === 'running' && <TerminalOutput />}
        {panelState === 'done' && <DoneView exitCode={processExitCode} />}
        {panelState === 'failed' && <FailedView error={error} />}
      </div>
    </div>
  );
}

function IdleView() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Play className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-secondary mb-1">
            Ready to implement
          </p>
          <p className="text-xs text-text-muted">
            Navigate to a flow and click the Implement button in the toolbar,
            or copy the command below to use in Claude Code terminal.
          </p>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-border">
        <ClaudeCommandBox />
      </div>
    </div>
  );
}

function DoneView({ exitCode }: { exitCode: number | null }) {
  const runTests = useImplementationStore((s) => s.runTests);
  const fixRuntimeError = useImplementationStore((s) => s.fixRuntimeError);
  const processOutput = useImplementationStore((s) => s.processOutput);
  const testResults = useImplementationStore((s) => s.testResults);
  const [showFixInput, setShowFixInput] = useState(false);
  const [errorText, setErrorText] = useState('');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs font-medium text-success">
            Implementation complete
          </span>
          <span className="text-[10px] text-text-muted">
            (exit code: {exitCode})
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative bg-[#0d1117] p-3 font-mono text-xs text-[#c9d1d9] max-h-[300px] overflow-y-auto">
          <CopyButton text={processOutput} className="absolute top-1 right-1" />
          <pre className="whitespace-pre-wrap break-words">
            {processOutput.slice(-2000) || 'No output'}
          </pre>
        </div>

        {testResults && <TestResults />}

        {!testResults && (
          <div className="px-4 py-3">
            <button
              className="btn-ghost text-xs w-full py-1.5"
              onClick={runTests}
            >
              <Play className="w-3.5 h-3.5" />
              Run Tests
            </button>
          </div>
        )}

        {/* Fix Runtime Error */}
        <div className="px-4 py-3 border-t border-border">
          {!showFixInput ? (
            <button
              className="btn-ghost text-xs w-full py-1.5 text-amber-500 hover:bg-amber-500/10"
              onClick={() => setShowFixInput(true)}
            >
              <Bug className="w-3.5 h-3.5" />
              Fix Runtime Error
            </button>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-text-secondary">
                Paste the error message or describe what went wrong:
              </label>
              <textarea
                className="w-full h-24 p-2 bg-bg-primary border border-border rounded text-xs font-mono text-text-primary resize-none focus:outline-none focus:border-accent"
                placeholder="e.g. 'An unexpected error occurred' when clicking Register — the database might not be set up..."
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  className="btn-ghost text-xs px-3 py-1.5 flex-1"
                  onClick={() => { setShowFixInput(false); setErrorText(''); }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary text-xs px-3 py-1.5 flex-1"
                  disabled={!errorText.trim()}
                  onClick={() => fixRuntimeError(errorText.trim())}
                >
                  <Bug className="w-3.5 h-3.5" />
                  Fix It
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-border space-y-2">
        <ClaudeCommandBox />
        <ClaudeCommandBox command="/ddd-sync" />
        <button
          className="btn-ghost text-xs w-full py-1.5"
          onClick={() =>
            useImplementationStore.setState({
              panelState: 'idle',
              currentPrompt: null,
              processOutput: '',
              processExitCode: null,
              testResults: null,
              error: null,
            })
          }
        >
          Implement Another Flow
        </button>
      </div>
    </div>
  );
}

function FailedView({ error }: { error: string | null }) {
  const currentPrompt = useImplementationStore((s) => s.currentPrompt);
  const runImplementation = useImplementationStore((s) => s.runImplementation);
  const fixRuntimeError = useImplementationStore((s) => s.fixRuntimeError);
  const processOutput = useImplementationStore((s) => s.processOutput);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-xs font-medium text-danger">
            Implementation failed
          </span>
        </div>
        {error && (
          <p className="text-xs text-text-muted mt-1">{error}</p>
        )}
      </div>

      {processOutput && (
        <div className="flex-1 overflow-y-auto relative bg-[#0d1117] p-3 font-mono text-xs text-[#c9d1d9]">
          <CopyButton text={processOutput} className="absolute top-1 right-1" />
          <pre className="whitespace-pre-wrap break-words">
            {processOutput.slice(-2000)}
          </pre>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        {currentPrompt && (
          <button
            className="btn-ghost text-xs px-3 py-1.5 flex-1"
            onClick={() =>
              useImplementationStore.setState({ panelState: 'prompt_ready' })
            }
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Prompt
          </button>
        )}
        {currentPrompt && processOutput && (
          <button
            className="btn-ghost text-xs px-3 py-1.5 flex-1 text-amber-500 hover:bg-amber-500/10"
            onClick={() => fixRuntimeError(processOutput.slice(-1000))}
          >
            <Bug className="w-3.5 h-3.5" />
            Fix Error
          </button>
        )}
        <button
          className="btn-primary text-xs px-3 py-1.5 flex-1"
          onClick={runImplementation}
          disabled={!currentPrompt}
        >
          <RotateCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    </div>
  );
}
