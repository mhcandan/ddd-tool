import { useState, useCallback } from 'react';
import { Play, ArrowLeft, Pencil, Eye } from 'lucide-react';
import { useImplementationStore } from '../../stores/implementation-store';
import { ImplementGate } from './ImplementGate';
import { ClaudeCommandBox } from './ClaudeCommandBox';
import { CopyButton } from '../shared/CopyButton';

export function PromptPreview() {
  const currentPrompt = useImplementationStore((s) => s.currentPrompt);
  const updatePromptContent = useImplementationStore((s) => s.updatePromptContent);
  const runImplementation = useImplementationStore((s) => s.runImplementation);
  const [editing, setEditing] = useState(false);
  const [canImplement, setCanImplement] = useState(true);

  const handleGateResult = useCallback((result: boolean) => {
    setCanImplement(result);
  }, []);

  if (!currentPrompt) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b border-border">
        <p className="text-xs font-medium text-text-primary truncate">
          {currentPrompt.title}
        </p>
      </div>

      <ImplementGate
        flowId={currentPrompt.flowId}
        domainId={currentPrompt.domainId}
        onGateResult={handleGateResult}
      />

      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border">
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
            !editing
              ? 'bg-bg-hover text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setEditing(false)}
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
            editing
              ? 'bg-bg-hover text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
          onClick={() => setEditing(true)}
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        <div className="flex-1" />
        <CopyButton text={currentPrompt.content} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <textarea
            className="w-full h-full p-3 bg-transparent text-xs font-mono text-text-primary resize-none focus:outline-none"
            value={currentPrompt.content}
            onChange={(e) => updatePromptContent(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <pre className="p-3 text-xs font-mono text-text-secondary whitespace-pre-wrap break-words">
            {currentPrompt.content}
          </pre>
        )}
      </div>

      <div className="px-4 py-2 border-t border-border">
        <ClaudeCommandBox />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <button
          className="btn-ghost text-xs px-3 py-1.5"
          onClick={() =>
            useImplementationStore.setState({
              panelState: 'idle',
              currentPrompt: null,
            })
          }
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          className="btn-primary text-xs px-4 py-1.5 flex-1"
          disabled={!canImplement}
          onClick={runImplementation}
        >
          <Play className="w-3.5 h-3.5" />
          Run Implementation
        </button>
      </div>
    </div>
  );
}
