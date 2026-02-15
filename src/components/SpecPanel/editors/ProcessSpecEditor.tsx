import type { ProcessSpec } from '../../../types/flow';
import { ExtraFieldsEditor } from './ExtraFieldsEditor';

interface Props {
  spec: ProcessSpec;
  onChange: (spec: ProcessSpec) => void;
}

export function ProcessSpecEditor({ spec, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Action</label>
        <input
          className="input"
          value={spec.action ?? ''}
          onChange={(e) => onChange({ ...spec, action: e.target.value })}
          placeholder="e.g. validatePayment"
        />
      </div>
      <div>
        <label className="label">Service</label>
        <input
          className="input"
          value={spec.service ?? ''}
          onChange={(e) => onChange({ ...spec, service: e.target.value })}
          placeholder="e.g. PaymentService"
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={spec.description ?? ''}
          onChange={(e) => onChange({ ...spec, description: e.target.value })}
          placeholder="Describe this process..."
        />
      </div>
      <ExtraFieldsEditor spec={spec} nodeType="process" onChange={onChange} />
    </div>
  );
}
