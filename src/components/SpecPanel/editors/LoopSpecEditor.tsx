import type { LoopSpec } from '../../../types/flow';
import { ExtraFieldsEditor } from './ExtraFieldsEditor';

interface Props {
  spec: LoopSpec;
  onChange: (spec: LoopSpec) => void;
}

export function LoopSpecEditor({ spec, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Collection</label>
        <input
          className="input"
          value={spec.collection ?? ''}
          onChange={(e) => onChange({ ...spec, collection: e.target.value })}
          placeholder="e.g. order.items"
        />
      </div>
      <div>
        <label className="label">Iterator</label>
        <input
          className="input"
          value={spec.iterator ?? ''}
          onChange={(e) => onChange({ ...spec, iterator: e.target.value })}
          placeholder="e.g. item"
        />
      </div>
      <div>
        <label className="label">Break Condition</label>
        <input
          className="input"
          value={spec.break_condition ?? ''}
          onChange={(e) => onChange({ ...spec, break_condition: e.target.value })}
          placeholder="e.g. item.quantity > 100"
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={spec.description ?? ''}
          onChange={(e) => onChange({ ...spec, description: e.target.value })}
          placeholder="Describe this loop..."
        />
      </div>
      <ExtraFieldsEditor spec={spec} nodeType="loop" onChange={onChange} />
    </div>
  );
}
