import type { ServiceCallSpec } from '../../../types/flow';
import { ExtraFieldsEditor } from './ExtraFieldsEditor';

interface Props {
  spec: ServiceCallSpec;
  onChange: (spec: ServiceCallSpec) => void;
}

export function ServiceCallSpecEditor({ spec, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Method</label>
        <select
          className="input"
          value={spec.method ?? 'GET'}
          onChange={(e) => onChange({ ...spec, method: e.target.value as ServiceCallSpec['method'] })}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div>
        <label className="label">URL</label>
        <input
          className="input"
          value={spec.url ?? ''}
          onChange={(e) => onChange({ ...spec, url: e.target.value })}
          placeholder="e.g. https://api.example.com/resource"
        />
      </div>
      <div>
        <label className="label">Headers</label>
        <textarea
          className="input min-h-[60px] resize-y font-mono text-xs"
          value={JSON.stringify(spec.headers ?? {}, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...spec, headers: JSON.parse(e.target.value) });
            } catch {
              // Keep raw while editing
            }
          }}
          placeholder='{"Content-Type": "application/json"}'
        />
      </div>
      <div>
        <label className="label">Body</label>
        <textarea
          className="input min-h-[60px] resize-y font-mono text-xs"
          value={JSON.stringify(spec.body ?? {}, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...spec, body: JSON.parse(e.target.value) });
            } catch {
              // Keep raw while editing
            }
          }}
          placeholder="{}"
        />
      </div>
      <div>
        <label className="label">Timeout (ms)</label>
        <input
          type="number"
          className="input"
          value={spec.timeout_ms ?? 5000}
          onChange={(e) => onChange({ ...spec, timeout_ms: Number(e.target.value) })}
        />
      </div>
      <div>
        <label className="label text-xs font-medium text-text-muted uppercase tracking-wider">Retry</label>
        <div className="space-y-2 ml-2 mt-1">
          <div>
            <label className="label">Max Attempts</label>
            <input
              type="number"
              className="input"
              value={spec.retry?.max_attempts ?? 3}
              onChange={(e) =>
                onChange({
                  ...spec,
                  retry: { ...spec.retry, max_attempts: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="label">Backoff (ms)</label>
            <input
              type="number"
              className="input"
              value={spec.retry?.backoff_ms ?? 1000}
              onChange={(e) =>
                onChange({
                  ...spec,
                  retry: { ...spec.retry, backoff_ms: Number(e.target.value) },
                })
              }
            />
          </div>
        </div>
      </div>
      <div>
        <label className="label">Error Mapping</label>
        <textarea
          className="input min-h-[60px] resize-y font-mono text-xs"
          value={JSON.stringify(spec.error_mapping ?? {}, null, 2)}
          onChange={(e) => {
            try {
              onChange({ ...spec, error_mapping: JSON.parse(e.target.value) });
            } catch {
              // Keep raw while editing
            }
          }}
          placeholder='{"404": "not_found", "500": "server_error"}'
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={spec.description ?? ''}
          onChange={(e) => onChange({ ...spec, description: e.target.value })}
          placeholder="Describe this service call..."
        />
      </div>
      <ExtraFieldsEditor spec={spec} nodeType="service_call" onChange={onChange} />
    </div>
  );
}
