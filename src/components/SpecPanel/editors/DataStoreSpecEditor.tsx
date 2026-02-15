import { useMemo } from 'react';
import type { DataStoreSpec } from '../../../types/flow';
import { useFlowStore } from '../../../stores/flow-store';
import { ExtraFieldsEditor } from './ExtraFieldsEditor';

interface Props {
  spec: DataStoreSpec;
  onChange: (spec: DataStoreSpec) => void;
}

export function DataStoreSpecEditor({ spec, onChange }: Props) {
  const currentFlow = useFlowStore((s) => s.currentFlow);

  // Collect model names from all data_store nodes in the flow for autocomplete
  const modelSuggestions = useMemo(() => {
    if (!currentFlow) return [];
    const models = new Set<string>();
    const allNodes = [currentFlow.trigger, ...currentFlow.nodes];
    for (const node of allNodes) {
      if (node.type === 'data_store') {
        const m = (node.spec as DataStoreSpec).model;
        if (m && m.trim()) models.add(m.trim());
      }
    }
    return Array.from(models).sort();
  }, [currentFlow]);

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Operation</label>
        <select
          className="input"
          value={spec.operation ?? 'read'}
          onChange={(e) => onChange({ ...spec, operation: e.target.value as DataStoreSpec['operation'] })}
        >
          <option value="create">Create</option>
          <option value="read">Read</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
      </div>
      <div>
        <label className="label">Model</label>
        <input
          className="input"
          list="model-suggestions"
          value={spec.model ?? ''}
          onChange={(e) => onChange({ ...spec, model: e.target.value })}
          placeholder="e.g. User, Order"
        />
        {modelSuggestions.length > 0 && (
          <datalist id="model-suggestions">
            {modelSuggestions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        )}
      </div>
      <div>
        <label className="label">Data</label>
        <textarea
          className="input min-h-[60px] resize-y font-mono text-xs"
          value={JSON.stringify(spec.data ?? {}, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...spec, data: JSON.parse(e.target.value) });
            } catch {
              // Keep raw while editing
            }
          }}
          placeholder="{}"
        />
      </div>
      <div>
        <label className="label">Query</label>
        <textarea
          className="input min-h-[60px] resize-y font-mono text-xs"
          value={JSON.stringify(spec.query ?? {}, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...spec, query: JSON.parse(e.target.value) });
            } catch {
              // Keep raw while editing
            }
          }}
          placeholder="{}"
        />
      </div>
      {spec.operation === 'read' && (
        <>
          <div>
            <label className="label">Pagination</label>
            <textarea
              className="input min-h-[60px] resize-y font-mono text-xs"
              value={JSON.stringify(spec.pagination ?? {}, null, 2)}
              onChange={(e) => {
                try {
                  onChange({ ...spec, pagination: JSON.parse(e.target.value) });
                } catch {
                  // Keep raw while editing
                }
              }}
              placeholder='{ "style": "cursor", "default_limit": 20, "max_limit": 100 }'
            />
          </div>
          <div>
            <label className="label">Sort</label>
            <textarea
              className="input min-h-[60px] resize-y font-mono text-xs"
              value={JSON.stringify(spec.sort ?? {}, null, 2)}
              onChange={(e) => {
                try {
                  onChange({ ...spec, sort: JSON.parse(e.target.value) });
                } catch {
                  // Keep raw while editing
                }
              }}
              placeholder='{ "default": "created_at:desc", "allowed": [] }'
            />
          </div>
        </>
      )}
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={spec.description ?? ''}
          onChange={(e) => onChange({ ...spec, description: e.target.value })}
          placeholder="Describe this data store operation..."
        />
      </div>
      <ExtraFieldsEditor spec={spec} nodeType="data_store" onChange={onChange} />
    </div>
  );
}
