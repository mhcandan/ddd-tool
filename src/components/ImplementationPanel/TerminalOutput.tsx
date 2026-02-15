import { useEffect, useRef } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { useImplementationStore } from '../../stores/implementation-store';
import { CopyButton } from '../shared/CopyButton';

// Strip ANSI escape codes for display
function stripAnsi(text: string): string {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

export function TerminalOutput() {
  const output = useImplementationStore((s) => s.processOutput);
  const running = useImplementationStore((s) => s.processRunning);
  const cancelImplementation = useImplementationStore((s) => s.cancelImplementation);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        {running && (
          <>
            <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
            <span className="text-xs text-accent">Running...</span>
          </>
        )}
        {!running && (
          <span className="text-xs text-text-muted">Process finished</span>
        )}
        <div className="flex-1" />
        {output && <CopyButton text={stripAnsi(output)} />}
        {running && (
          <button
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-danger hover:bg-danger/10 transition-colors"
            onClick={cancelImplementation}
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-[#0d1117] p-3 font-mono text-xs text-[#c9d1d9] leading-relaxed"
      >
        <pre className="whitespace-pre-wrap break-words">
          {stripAnsi(output) || (running ? 'Waiting for output...' : 'No output')}
        </pre>
      </div>
    </div>
  );
}
