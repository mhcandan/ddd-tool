import { useAppStore } from '../../stores/app-store';
import type { ProviderConfig } from '../../types/app';

export function LLMSettings() {
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);

  function updateProvider(id: string, updates: Partial<ProviderConfig>) {
    const providers = settings.llm.providers.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    saveSettings({
      ...settings,
      llm: { ...settings.llm, providers },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          LLM Providers
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Configure API keys via environment variable names. Keys are never
          stored directly.
        </p>
      </div>

      {settings.llm.providers.map((provider) => (
        <div key={provider.id} className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{provider.name}</span>
              <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">
                {provider.type}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={provider.enabled}
                onChange={(e) =>
                  updateProvider(provider.id, { enabled: e.target.checked })
                }
                className="w-4 h-4 rounded accent-accent"
              />
              <span className="text-xs text-text-secondary">Enabled</span>
            </label>
          </div>

          <div>
            <label className="label">API Key Env Variable</label>
            <input
              className="input"
              placeholder="e.g. ANTHROPIC_API_KEY"
              value={provider.apiKeyEnvVar ?? ''}
              onChange={(e) =>
                updateProvider(provider.id, { apiKeyEnvVar: e.target.value })
              }
            />
          </div>

          {(provider.type === 'ollama' ||
            provider.type === 'openai_compatible') && (
            <div>
              <label className="label">Base URL</label>
              <input
                className="input"
                placeholder="http://localhost:11434"
                value={provider.baseUrl ?? ''}
                onChange={(e) =>
                  updateProvider(provider.id, { baseUrl: e.target.value })
                }
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
