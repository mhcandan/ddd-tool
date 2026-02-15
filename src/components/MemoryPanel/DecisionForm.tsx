import { useState } from 'react';
import { useSheetStore } from '../../stores/sheet-store';
import type { Decision } from '../../types/memory';

interface DecisionFormProps {
  existing?: Decision;
  onSave: (title: string, rationale: string, affected: string[]) => void;
  onCancel: () => void;
}

export function DecisionForm({ existing, onSave, onCancel }: DecisionFormProps) {
  const current = useSheetStore((s) => s.current);

  // Pre-fill affected with current context
  const defaultAffected = (() => {
    if (existing) return existing.affected.join(', ');
    if (current.level === 'flow' && current.domainId && current.flowId) {
      return `${current.domainId}/${current.flowId}`;
    }
    if (current.level === 'domain' && current.domainId) {
      return current.domainId;
    }
    return '';
  })();

  const [title, setTitle] = useState(existing?.title ?? '');
  const [rationale, setRationale] = useState(existing?.rationale ?? '');
  const [affected, setAffected] = useState(defaultAffected);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const affectedList = affected
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSave(title.trim(), rationale.trim(), affectedList);
  };

  return (
    <div className="space-y-2 px-4 py-2 bg-bg-hover/50 rounded">
      <input
        className="input text-xs w-full"
        placeholder="Decision title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        className="input text-xs w-full resize-none"
        rows={3}
        placeholder="Rationale..."
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
      />
      <input
        className="input text-xs w-full"
        placeholder="Affected (comma-separated, e.g. auth, auth/login)"
        value={affected}
        onChange={(e) => setAffected(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <button className="btn-ghost text-[10px] px-2 py-1" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn-primary text-[10px] px-2 py-1"
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          {existing ? 'Update' : 'Add'}
        </button>
      </div>
    </div>
  );
}
