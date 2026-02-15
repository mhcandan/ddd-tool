import { useState } from 'react';
import { AlertTriangle, RotateCw, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  projectPath: string;
  files: string[];
  onDone: () => void;
}

export function CrashRecoveryDialog({ projectPath, files, onDone }: Props) {
  const [recovering, setRecovering] = useState(false);

  const flowIds = files
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace('.yaml', ''));

  async function handleRecover() {
    setRecovering(true);
    try {
      for (const file of files) {
        if (!file.endsWith('.yaml')) continue;
        const flowId = file.replace('.yaml', '');
        const autoSavePath = `${projectPath}/.ddd/autosave/${file}`;

        // Read autosave content
        const content: string = await invoke('read_file', { path: autoSavePath });

        // We need to find the correct domain for this flow
        // Parse the autosave to get domain info
        const { parse } = await import('yaml');
        const doc = parse(content);
        const domainId = doc?.flow?.domain;

        if (domainId) {
          const flowPath = `${projectPath}/specs/domains/${domainId}/flows/${flowId}.yaml`;
          await invoke('write_file', { path: flowPath, contents: content });
        }

        // Delete autosave file after recovery
        await invoke('delete_file', { path: autoSavePath });
      }
    } catch {
      // Best effort
    }
    setRecovering(false);
    onDone();
  }

  async function handleDiscard() {
    try {
      for (const file of files) {
        await invoke('delete_file', {
          path: `${projectPath}/.ddd/autosave/${file}`,
        });
      }
    } catch {
      // Best effort
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="card w-full max-w-md mx-4">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <h2 className="text-lg font-semibold text-text-primary">Unsaved Changes Found</h2>
        </div>

        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-text-secondary">
            Auto-saved changes were found from a previous session that may not have been saved properly.
          </p>

          <div className="bg-bg-tertiary rounded p-3 space-y-1">
            {flowIds.map((id) => (
              <p key={id} className="text-xs text-text-primary font-mono">{id}</p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button className="btn-ghost" onClick={handleDiscard}>
            <Trash2 className="w-4 h-4" />
            Discard
          </button>
          <button
            className="btn-primary"
            onClick={handleRecover}
            disabled={recovering}
          >
            <RotateCw className={`w-4 h-4 ${recovering ? 'animate-spin' : ''}`} />
            {recovering ? 'Recovering...' : 'Recover'}
          </button>
        </div>
      </div>
    </div>
  );
}
