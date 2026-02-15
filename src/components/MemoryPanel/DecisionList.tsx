import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useMemoryStore } from '../../stores/memory-store';
import { DecisionForm } from './DecisionForm';
import type { Decision } from '../../types/memory';

export function DecisionList() {
  const decisions = useMemoryStore((s) => s.decisions);
  const addDecision = useMemoryStore((s) => s.addDecision);
  const editDecision = useMemoryStore((s) => s.editDecision);
  const removeDecision = useMemoryStore((s) => s.removeDecision);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (title: string, rationale: string, affected: string[]) => {
    addDecision(title, rationale, affected);
    setShowAddForm(false);
  };

  const handleEdit = (id: string, title: string, rationale: string, affected: string[]) => {
    editDecision(id, { title, rationale, affected });
    setEditingId(null);
  };

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Decisions ({decisions.length})
        </span>
        <button
          className="btn-icon !p-0.5"
          onClick={() => setShowAddForm(true)}
          title="Add decision"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {showAddForm && (
        <DecisionForm
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {decisions.length === 0 && !showAddForm && (
        <p className="text-[10px] text-text-muted">
          No decisions recorded yet
        </p>
      )}

      <ul className="space-y-2 mt-1">
        {decisions.map((d: Decision) =>
          editingId === d.id ? (
            <DecisionForm
              key={d.id}
              existing={d}
              onSave={(title, rationale, affected) => handleEdit(d.id, title, rationale, affected)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <li key={d.id} className="group">
              <div className="flex items-start gap-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-text-primary font-medium truncate">
                      {d.title}
                    </span>
                    <span className="text-[10px] text-text-muted shrink-0">
                      {d.date}
                    </span>
                  </div>
                  {d.rationale && (
                    <p className="text-[10px] text-text-muted leading-snug mt-0.5 line-clamp-2">
                      {d.rationale}
                    </p>
                  )}
                  {d.affected.length > 0 && (
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {d.affected.map((a) => (
                        <span
                          key={a}
                          className="text-[9px] px-1 py-0.5 rounded bg-bg-hover text-text-muted"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    className="btn-icon !p-0.5"
                    onClick={() => setEditingId(d.id)}
                    title="Edit"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    className="btn-icon !p-0.5 hover:text-danger"
                    onClick={() => removeDecision(d.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
    </div>
  );
}
