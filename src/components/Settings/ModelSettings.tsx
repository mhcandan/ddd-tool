import { useAppStore } from '../../stores/app-store';

const TASK_ROUTING_ROWS = [
  { key: 'generate_flow', label: 'Generate Flow', description: 'Auto-generate flow nodes from description' },
  { key: 'suggest_spec', label: 'Suggest Spec', description: 'Fill in node spec fields' },
  { key: 'review_design', label: 'Review Design', description: 'Analyze design for issues' },
  { key: 'explain_node', label: 'Explain Node', description: 'Explain what a node does' },
] as const;

export function ModelSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const saveSettings = useAppStore((s) => s.saveSettings);

  // Gather all models from enabled providers
  const availableModels = settings.llm.providers
    .filter((p) => p.enabled)
    .flatMap((p) => p.models);

  const taskRouting = settings.models.taskRouting;

  function setTaskModel(task: string, model: string) {
    const updated = {
      ...settings,
      models: {
        ...settings.models,
        taskRouting: { ...taskRouting, [task]: model },
      },
    };
    updateSettings(updated);
    saveSettings(updated);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Task Routing
        </h3>
        <p className="text-xs text-text-muted mb-3">
          Assign specific models to different AI tasks. Leave as "Auto" to use the default provider.
        </p>
      </div>

      <div className="space-y-3">
        {TASK_ROUTING_ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary">{row.label}</p>
              <p className="text-xs text-text-muted">{row.description}</p>
            </div>
            <select
              className="input w-48"
              value={taskRouting[row.key] || ''}
              onChange={(e) => setTaskModel(row.key, e.target.value)}
            >
              <option value="">Auto</option>
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {availableModels.length === 0 && (
        <p className="text-xs text-warning mt-2">
          No providers are enabled. Enable at least one provider in the LLM settings tab.
        </p>
      )}
    </div>
  );
}
