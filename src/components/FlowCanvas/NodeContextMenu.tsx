import { useEffect, useRef } from 'react';
import { Sparkles, PenLine, HelpCircle, Search, GitBranch } from 'lucide-react';
import { useLlmStore } from '../../stores/llm-store';
import type { InlineAssistAction } from '../../types/llm';

interface NodeContextMenuProps {
  x: number;
  y: number;
  nodeId: string | null;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  action: InlineAssistAction;
  icon: React.ElementType;
}

const nodeActions: MenuItem[] = [
  { label: 'Suggest Spec', action: 'suggest_spec', icon: Sparkles },
  { label: 'Complete Spec', action: 'complete_spec', icon: PenLine },
  { label: 'Explain Node', action: 'explain_node', icon: HelpCircle },
];

const canvasActions: MenuItem[] = [
  { label: 'Review Flow', action: 'review_flow', icon: Search },
  { label: 'Suggest Wiring', action: 'suggest_wiring', icon: GitBranch },
];

export function NodeContextMenu({ x, y, nodeId, onClose }: NodeContextMenuProps) {
  const runInlineAssist = useLlmStore((s) => s.runInlineAssist);
  const menuRef = useRef<HTMLDivElement>(null);

  const actions = nodeId ? nodeActions : canvasActions;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu visible
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 100,
  };

  const handleAction = (action: InlineAssistAction) => {
    onClose();
    runInlineAssist(action, nodeId ?? undefined);
  };

  return (
    <div ref={menuRef} style={menuStyle}>
      <div className="bg-bg-secondary border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
        <div className="px-3 py-1 border-b border-border">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Assist
          </span>
        </div>
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.action}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors text-left"
              onClick={() => handleAction(item.action)}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
