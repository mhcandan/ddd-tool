import { Terminal } from 'lucide-react';
import { useSheetStore } from '../../stores/sheet-store';
import { CopyButton } from '../shared/CopyButton';

interface Props {
  /** Override the auto-detected scope (e.g. for fix commands) */
  command?: string;
}

export function ClaudeCommandBox({ command: commandOverride }: Props) {
  const current = useSheetStore((s) => s.current);

  let command: string;
  if (commandOverride) {
    command = commandOverride;
  } else if (current.level === 'flow' && current.domainId && current.flowId) {
    command = `/ddd-implement ${current.domainId}/${current.flowId}`;
  } else if (current.level === 'domain' && current.domainId) {
    command = `/ddd-implement ${current.domainId}`;
  } else {
    command = `/ddd-implement --all`;
  }

  return (
    <div className="border border-border rounded bg-bg-primary">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border">
        <Terminal className="w-3 h-3 text-text-muted" />
        <span className="text-[10px] text-text-muted flex-1">Claude Code command</span>
        <CopyButton text={command} />
      </div>
      <div className="px-3 py-2">
        <code className="text-xs font-mono text-accent select-all">{command}</code>
      </div>
    </div>
  );
}
