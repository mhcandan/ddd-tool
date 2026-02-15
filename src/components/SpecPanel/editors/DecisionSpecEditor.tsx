import type { DecisionSpec } from '../../../types/flow';
import { ExtraFieldsEditor } from './ExtraFieldsEditor';

interface Props {
  spec: DecisionSpec;
  onChange: (spec: DecisionSpec) => void;
}

export function DecisionSpecEditor({ spec, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Condition</label>
        <input
          className="input"
          value={spec.condition ?? ''}
          onChange={(e) => onChange({ ...spec, condition: e.target.value })}
          placeholder="e.g. payment.isValid"
        />
      </div>
      <div>
        <label className="label">True Label</label>
        <input
          className="input"
          value={spec.trueLabel ?? 'Yes'}
          onChange={(e) => onChange({ ...spec, trueLabel: e.target.value })}
          placeholder="Yes"
        />
      </div>
      <div>
        <label className="label">False Label</label>
        <input
          className="input"
          value={spec.falseLabel ?? 'No'}
          onChange={(e) => onChange({ ...spec, falseLabel: e.target.value })}
          placeholder="No"
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={spec.description ?? ''}
          onChange={(e) => onChange({ ...spec, description: e.target.value })}
          placeholder="Describe this decision..."
        />
      </div>
      <ExtraFieldsEditor spec={spec} nodeType="decision" onChange={onChange} />
    </div>
  );
}
