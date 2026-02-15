import { useRef, useCallback, useState } from 'react';
import { GitBranch, GripVertical, Bot, Trash2, AlertTriangle } from 'lucide-react';
import type { DomainMapFlow } from '../../types/domain';
import type { Position } from '../../types/sheet';

interface Props {
  flow: DomainMapFlow;
  selected: boolean;
  isStale?: boolean;
  onSelect: (flowId: string) => void;
  onPositionChange: (flowId: string, position: Position) => void;
  onDoubleClick: (flowId: string) => void;
  onDelete: (flowId: string) => void;
  onRename: (flowId: string, newName: string) => void;
}

export function FlowBlock({ flow, selected, isStale, onSelect, onPositionChange, onDoubleClick, onDelete, onRename }: Props) {
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if (editing) return;
      e.preventDefault();
      e.stopPropagation();
      onSelect(flow.id);
      dragging.current = true;
      didDrag.current = false;
      dragStart.current = { x: e.clientX, y: e.clientY };
      posStart.current = { x: flow.position.x, y: flow.position.y };

      const handleMouseMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const dx = me.clientX - dragStart.current.x;
        const dy = me.clientY - dragStart.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
        onPositionChange(flow.id, {
          x: posStart.current.x + dx,
          y: posStart.current.y + dy,
        });
      };

      const handleMouseUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [flow.id, flow.position.x, flow.position.y, onPositionChange, onSelect, editing]
  );

  const handleBlockDoubleClick = useCallback(() => {
    if (!didDrag.current) onDoubleClick(flow.id);
  }, [flow.id, onDoubleClick]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(flow.id);
    },
    [flow.id, onDelete]
  );

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(flow.name);
    setEditing(true);
  }, [flow.name]);

  const commitRename = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== flow.name) {
      onRename(flow.id, trimmed);
    }
    setEditing(false);
  }, [draft, flow.name, flow.id, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitRename();
      } else if (e.key === 'Escape') {
        setEditing(false);
      }
    },
    [commitRename]
  );

  return (
    <div
      className="absolute group cursor-grab active:cursor-grabbing"
      style={{
        left: flow.position.x,
        top: flow.position.y,
        minWidth: 180,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={handleBlockDoubleClick}
    >
      <div className={`bg-bg-secondary border rounded-xl p-4 transition-colors shadow-lg relative ${
        selected ? 'border-accent ring-2 ring-accent/30' : 'border-border group-hover:border-accent'
      }`}>
        {/* Delete button */}
        <button
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-bg-tertiary border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger hover:border-danger hover:text-white text-text-muted z-10"
          onClick={handleDeleteClick}
          title="Delete flow"
        >
          <Trash2 className="w-3 h-3" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <GripVertical className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          <GitBranch className="w-4 h-4 text-accent" />
          {editing ? (
            <input
              className="text-sm font-semibold text-text-primary bg-bg-primary border border-accent rounded px-1 py-0 outline-none w-full"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleKeyDown}
              onMouseDown={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-semibold text-text-primary truncate cursor-text"
              onDoubleClick={startEditing}
            >
              {flow.name}
            </span>
          )}
          {isStale && (
            <span title="Spec changed since last implementation">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </span>
          )}
        </div>

        {/* Description */}
        {flow.description && (
          <p className="text-xs text-text-secondary mb-2 line-clamp-2 ml-6">
            {flow.description}
          </p>
        )}

        {/* Agent badge */}
        {flow.type === 'agent' && (
          <div className="flex items-center gap-1 ml-6">
            <Bot className="w-3 h-3 text-text-muted" />
            <span className="text-xs bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded-full">
              Agent
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
