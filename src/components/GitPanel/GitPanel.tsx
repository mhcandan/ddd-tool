import { useEffect, useRef } from 'react';
import {
  GitBranch,
  RefreshCw,
  X,
  Plus,
  Minus,
  GitCommit,
} from 'lucide-react';
import { useGitStore } from '../../stores/git-store';
import type { GitFileEntry } from '../../types/git';

function statusColor(status: GitFileEntry['status']) {
  switch (status) {
    case 'new':
      return 'text-success';
    case 'modified':
      return 'text-warning';
    case 'deleted':
      return 'text-danger';
  }
}

function statusLabel(status: GitFileEntry['status']) {
  switch (status) {
    case 'new':
      return 'A';
    case 'modified':
      return 'M';
    case 'deleted':
      return 'D';
  }
}

function relativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function GitPanel() {
  const {
    branch,
    staged,
    unstaged,
    untracked,
    log,
    loading,
    committing,
    commitMessage,
    refresh,
    stageFile,
    unstageFile,
    stageAll,
    commit,
    setCommitMessage,
    togglePanel,
  } = useGitStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll every 10 seconds while panel is open
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refresh();
    }, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const changeCount = unstaged.length + untracked.length;
  const hasStaged = staged.length > 0;

  return (
    <div className="w-[320px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <GitBranch className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1 truncate">
          {branch || 'no branch'}
        </span>
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={() => refresh()}
          title="Refresh"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={togglePanel}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Staged Files */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
              Staged ({staged.length})
            </span>
            {hasStaged && (
              <button
                className="text-[10px] text-accent hover:text-accent-hover transition-colors"
                onClick={() => {
                  for (const f of staged) unstageFile(f.path);
                }}
              >
                Unstage All
              </button>
            )}
          </div>
          {staged.length === 0 ? (
            <p className="text-xs text-text-muted py-1">No staged files</p>
          ) : (
            <ul className="space-y-0.5">
              {staged.map((f) => (
                <li key={f.path} className="flex items-center gap-2 group">
                  <button
                    className="btn-icon !p-0.5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => unstageFile(f.path)}
                    title="Unstage"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className={`text-[10px] font-mono ${statusColor(f.status)} shrink-0`}>
                    {statusLabel(f.status)}
                  </span>
                  <span className="text-xs text-text-secondary truncate flex-1" title={f.path}>
                    {f.path}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Changes (unstaged + untracked) */}
        <div className="px-4 py-2 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
              Changes ({changeCount})
            </span>
            {changeCount > 0 && (
              <button
                className="text-[10px] text-accent hover:text-accent-hover transition-colors"
                onClick={stageAll}
              >
                Stage All
              </button>
            )}
          </div>
          {changeCount === 0 ? (
            <p className="text-xs text-text-muted py-1">No changes</p>
          ) : (
            <ul className="space-y-0.5">
              {unstaged.map((f) => (
                <li key={f.path} className="flex items-center gap-2 group">
                  <button
                    className="btn-icon !p-0.5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => stageFile(f.path)}
                    title="Stage"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className={`text-[10px] font-mono ${statusColor(f.status)} shrink-0`}>
                    {statusLabel(f.status)}
                  </span>
                  <span className="text-xs text-text-secondary truncate flex-1" title={f.path}>
                    {f.path}
                  </span>
                </li>
              ))}
              {untracked.map((p) => (
                <li key={p} className="flex items-center gap-2 group">
                  <button
                    className="btn-icon !p-0.5 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => stageFile(p)}
                    title="Stage"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-mono text-success shrink-0">?</span>
                  <span className="text-xs text-text-secondary truncate flex-1" title={p}>
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Commit Area */}
        <div className="px-4 py-2 border-b border-border">
          <textarea
            className="input resize-none text-xs"
            rows={3}
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (hasStaged && commitMessage.trim()) commit();
              }
            }}
          />
          <button
            className="btn-primary w-full mt-2 text-xs py-1.5"
            disabled={!hasStaged || !commitMessage.trim() || committing}
            onClick={commit}
          >
            <GitCommit className="w-3.5 h-3.5" />
            {committing ? 'Committing...' : 'Commit'}
          </button>
        </div>

        {/* History */}
        <div className="px-4 py-2">
          <span className="text-xs uppercase tracking-wider text-text-muted font-medium block mb-1">
            History
          </span>
          {log.length === 0 ? (
            <p className="text-xs text-text-muted py-1">No commits yet</p>
          ) : (
            <ul className="space-y-1.5">
              {log.map((entry) => (
                <li key={entry.oid} className="flex flex-col gap-0.5">
                  <span className="text-xs text-text-primary leading-snug truncate">
                    {entry.message.split('\n')[0]}
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-text-muted font-mono">
                      {entry.oid.slice(0, 7)}
                    </code>
                    <span className="text-[10px] text-text-muted">
                      {relativeTime(entry.timestamp)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
