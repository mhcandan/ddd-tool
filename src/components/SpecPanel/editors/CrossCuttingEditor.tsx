import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ObservabilityConfig, SecurityConfig } from '../../../types/crosscutting';

interface Props {
  observability?: ObservabilityConfig;
  security?: SecurityConfig;
  onChange: (obs: ObservabilityConfig | undefined, sec: SecurityConfig | undefined) => void;
}

export function CrossCuttingEditor({ observability, security, onChange }: Props) {
  const [obsOpen, setObsOpen] = useState(false);
  const [secOpen, setSecOpen] = useState(false);

  const obs = observability ?? {};
  const sec = security ?? {};

  const updateObs = (updates: Partial<ObservabilityConfig>) => {
    onChange({ ...obs, ...updates }, security);
  };

  const updateSec = (updates: Partial<SecurityConfig>) => {
    onChange(observability, { ...sec, ...updates });
  };

  return (
    <div className="space-y-2 mt-4 pt-3 border-t border-border">
      {/* Observability */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary w-full"
        onClick={() => setObsOpen(!obsOpen)}
      >
        {obsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Observability
      </button>
      {obsOpen && (
        <div className="pl-3 space-y-2">
          {/* Logging */}
          <div className="bg-bg-primary rounded p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Logging</p>
            <div>
              <label className="text-[10px] text-text-muted">Level</label>
              <select
                className="input py-1 text-xs"
                value={obs.logging?.level ?? 'info'}
                onChange={(e) => updateObs({ logging: { ...obs.logging, level: e.target.value as ObservabilityConfig['logging'] extends { level?: infer L } ? L : never } })}
              >
                {['debug', 'info', 'warn', 'error'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={obs.logging?.include_input ?? false}
                onChange={(e) => updateObs({ logging: { ...obs.logging, include_input: e.target.checked } })}
              />
              Log input
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={obs.logging?.include_output ?? false}
                onChange={(e) => updateObs({ logging: { ...obs.logging, include_output: e.target.checked } })}
              />
              Log output
            </label>
          </div>

          {/* Metrics */}
          <div className="bg-bg-primary rounded p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Metrics</p>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={obs.metrics?.enabled ?? false}
                onChange={(e) => updateObs({ metrics: { ...obs.metrics, enabled: e.target.checked } })}
              />
              Enable metrics
            </label>
            {obs.metrics?.enabled && (
              <div>
                <label className="text-[10px] text-text-muted">Custom counters (comma-separated)</label>
                <input
                  className="input py-1 text-xs"
                  value={(obs.metrics?.custom_counters ?? []).join(', ')}
                  onChange={(e) => updateObs({ metrics: { ...obs.metrics, custom_counters: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })}
                  placeholder="requests, errors"
                />
              </div>
            )}
          </div>

          {/* Tracing */}
          <div className="bg-bg-primary rounded p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Tracing</p>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={obs.tracing?.enabled ?? false}
                onChange={(e) => updateObs({ tracing: { ...obs.tracing, enabled: e.target.checked } })}
              />
              Enable tracing
            </label>
            {obs.tracing?.enabled && (
              <div>
                <label className="text-[10px] text-text-muted">Span name</label>
                <input
                  className="input py-1 text-xs"
                  value={obs.tracing?.span_name ?? ''}
                  onChange={(e) => updateObs({ tracing: { ...obs.tracing, span_name: e.target.value } })}
                  placeholder="node.process"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary w-full"
        onClick={() => setSecOpen(!secOpen)}
      >
        {secOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Security
      </button>
      {secOpen && (
        <div className="pl-3 space-y-2">
          {/* Authentication */}
          <div className="bg-bg-primary rounded p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Authentication</p>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={sec.authentication?.required ?? false}
                onChange={(e) => updateSec({ authentication: { ...sec.authentication, required: e.target.checked } })}
              />
              Required
            </label>
            {sec.authentication?.required && (
              <>
                <div>
                  <label className="text-[10px] text-text-muted">Methods (comma-separated)</label>
                  <input
                    className="input py-1 text-xs"
                    value={(sec.authentication?.methods ?? []).join(', ')}
                    onChange={(e) => updateSec({ authentication: { ...sec.authentication, methods: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })}
                    placeholder="jwt, api_key"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-muted">Roles (comma-separated)</label>
                  <input
                    className="input py-1 text-xs"
                    value={(sec.authentication?.roles ?? []).join(', ')}
                    onChange={(e) => updateSec({ authentication: { ...sec.authentication, roles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })}
                    placeholder="admin, user"
                  />
                </div>
              </>
            )}
          </div>

          {/* Rate Limiting */}
          <div className="bg-bg-primary rounded p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Rate Limiting</p>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={sec.rate_limiting?.enabled ?? false}
                onChange={(e) => updateSec({ rate_limiting: { ...sec.rate_limiting, enabled: e.target.checked } })}
              />
              Enable rate limiting
            </label>
            {sec.rate_limiting?.enabled && (
              <div>
                <label className="text-[10px] text-text-muted">Requests/min</label>
                <input
                  type="number"
                  className="input py-1 text-xs"
                  value={sec.rate_limiting?.requests_per_minute ?? 60}
                  onChange={(e) => updateSec({ rate_limiting: { ...sec.rate_limiting, requests_per_minute: parseInt(e.target.value) || 60 } })}
                  min={1}
                />
              </div>
            )}
          </div>

          {/* Encryption */}
          <div className="bg-bg-primary rounded p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Encryption</p>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={sec.encryption?.at_rest ?? false}
                onChange={(e) => updateSec({ encryption: { ...sec.encryption, at_rest: e.target.checked } })}
              />
              At rest
            </label>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={sec.encryption?.in_transit ?? false}
                onChange={(e) => updateSec({ encryption: { ...sec.encryption, in_transit: e.target.checked } })}
              />
              In transit
            </label>
            <div>
              <label className="text-[10px] text-text-muted">PII fields (comma-separated)</label>
              <input
                className="input py-1 text-xs"
                value={(sec.encryption?.pii_fields ?? []).join(', ')}
                onChange={(e) => updateSec({ encryption: { ...sec.encryption, pii_fields: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })}
                placeholder="email, ssn"
              />
            </div>
          </div>

          {/* Audit */}
          <div className="bg-bg-primary rounded p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Audit</p>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                className="accent-accent"
                checked={sec.audit?.enabled ?? false}
                onChange={(e) => updateSec({ audit: { enabled: e.target.checked } })}
              />
              Enable audit logging
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
