import type { SubFlowSpec } from '../../../types/flow';
import { ExtraFieldsEditor } from './ExtraFieldsEditor';

interface Props {
  spec: SubFlowSpec;
  onChange: (spec: SubFlowSpec) => void;
}

export function SubFlowSpecEditor({ spec, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Flow Reference</label>
        <input
          className="input"
          value={spec.flow_ref ?? ''}
          onChange={(e) => onChange({ ...spec, flow_ref: e.target.value })}
          placeholder="domain/flow-id"
        />
      </div>
      <div>
        <label className="label">Input Mapping</label>
        <textarea
          className="input min-h-[60px] resize-y font-mono text-xs"
          value={JSON.stringify(spec.input_mapping ?? {}, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...spec, input_mapping: JSON.parse(e.target.value) });
            } catch {
              // Keep raw while editing
            }
          }}
          placeholder='{"param": "source.field"}'
        />
      </div>
      <div>
        <label className="label">Output Mapping</label>
        <textarea
          className="input min-h-[60px] resize-y font-mono text-xs"
          value={JSON.stringify(spec.output_mapping ?? {}, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...spec, output_mapping: JSON.parse(e.target.value) });
            } catch {
              // Keep raw while editing
            }
          }}
          placeholder='{"result": "output.field"}'
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={spec.description ?? ''}
          onChange={(e) => onChange({ ...spec, description: e.target.value })}
          placeholder="Describe this sub-flow invocation..."
        />
      </div>
      <ExtraFieldsEditor spec={spec} nodeType="sub_flow" onChange={onChange} />
    </div>
  );
}
