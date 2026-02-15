import { useAppStore } from '../../stores/app-store';

export function GitSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const saveSettings = useAppStore((s) => s.saveSettings);

  function updateGit(field: 'autoCommitMessage' | 'branchNaming', value: string) {
    const updated = {
      ...settings,
      git: { ...settings.git, [field]: value },
    };
    updateSettings(updated);
    saveSettings(updated);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">Git</h3>
        <p className="text-xs text-text-muted mb-3">
          Configure auto-commit messages and branch naming conventions.
        </p>
      </div>

      <div>
        <label className="label">Auto-commit Message Template</label>
        <input
          className="input"
          value={settings.git.autoCommitMessage}
          onChange={(e) => updateGit('autoCommitMessage', e.target.value)}
          placeholder="DDD: {action} in {flow_id}"
        />
        <p className="text-xs text-text-muted mt-1">
          Available placeholders: <code className="text-accent">{'{action}'}</code> (e.g. implement, update), <code className="text-accent">{'{flow_id}'}</code> (flow identifier)
        </p>
      </div>

      <div>
        <label className="label">Branch Naming Convention</label>
        <input
          className="input"
          value={settings.git.branchNaming}
          onChange={(e) => updateGit('branchNaming', e.target.value)}
          placeholder="ddd/{flow_id}"
        />
        <p className="text-xs text-text-muted mt-1">
          Available placeholders: <code className="text-accent">{'{flow_id}'}</code> (flow identifier)
        </p>
      </div>
    </div>
  );
}
