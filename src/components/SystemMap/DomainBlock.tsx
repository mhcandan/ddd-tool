import { useRef, useCallback, useState } from 'react';
import { Layers, GripVertical } from 'lucide-react';
import type { SystemMapDomain } from '../../types/domain';
import type { Position } from '../../types/sheet';

interface Props {
  domain: SystemMapDomain;
  selected: boolean;
  onSelect: (domainId: string) => void;
  onPositionChange: (domainId: string, position: Position) => void;
  onDoubleClick: (domainId: string) => void;
  onRename: (domainId: string, newName: string) => void;
}

export function DomainBlock({ domain, selected, onSelect, onPositionChange, onDoubleClick, onRename }: Props) {
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
      onSelect(domain.id);
      dragging.current = true;
      didDrag.current = false;
      dragStart.current = { x: e.clientX, y: e.clientY };
      posStart.current = { x: domain.position.x, y: domain.position.y };

      const handleMouseMove = (me: MouseEvent) => {
        if (!dragging.current) return;
        const dx = me.clientX - dragStart.current.x;
        const dy = me.clientY - dragStart.current.y;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
        onPositionChange(domain.id, {
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
    [domain.id, domain.position.x, domain.position.y, onPositionChange, onSelect, editing]
  );

  const handleBlockDoubleClick = useCallback(() => {
    if (!didDrag.current) onDoubleClick(domain.id);
  }, [domain.id, onDoubleClick]);

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(domain.name);
    setEditing(true);
  }, [domain.name]);

  const commitRename = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== domain.name) {
      onRename(domain.id, trimmed);
    }
    setEditing(false);
  }, [draft, domain.name, domain.id, onRename]);

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
        left: domain.position.x,
        top: domain.position.y,
        minWidth: 200,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={handleBlockDoubleClick}
    >
      <div className={`bg-bg-secondary border rounded-xl p-4 transition-colors shadow-lg ${
        selected ? 'border-accent ring-2 ring-accent/30' : 'border-border group-hover:border-accent'
      }`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <GripVertical className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          <Layers className="w-4 h-4 text-accent" />
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
              {domain.name}
            </span>
          )}
        </div>

        {/* Description */}
        {domain.description && (
          <p className="text-xs text-text-secondary mb-3 line-clamp-2">
            {domain.description}
          </p>
        )}

        {/* Flow count badge */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs bg-bg-tertiary text-text-secondary px-2 py-0.5 rounded-full">
            {domain.flowCount} {domain.flowCount === 1 ? 'flow' : 'flows'}
          </span>
        </div>
      </div>
    </div>
  );
}
