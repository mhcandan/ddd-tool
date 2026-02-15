import { useAppStore } from '../../stores/app-store';

export function TestingSettings() {
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const testing = settings.testing;

  const update = (partial: Partial<typeof testing>) => {
    saveSettings({
      ...settings,
      testing: { ...testing, ...partial },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-1">
          Testing
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Configure how tests are executed after implementation.
        </p>
      </div>

      {/* Test Command */}
      <div>
        <label className="label">Test Command</label>
        <input
          className="input w-full"
          value={testing.command}
          onChange={(e) => update({ command: e.target.value })}
          placeholder="npm"
        />
        <p className="text-xs text-text-muted mt-1">
          The command to run tests (e.g., npm, npx, pytest, cargo)
        </p>
      </div>

      {/* Test Args */}
      <div>
        <label className="label">Arguments</label>
        <input
          className="input w-full"
          value={testing.args.join(' ')}
          onChange={(e) => {
            const args = e.target.value.split(/\s+/).filter(Boolean);
            update({ args: args.length > 0 ? args : ['test'] });
          }}
          placeholder="test"
        />
        <p className="text-xs text-text-muted mt-1">
          Space-separated arguments passed to the test command
        </p>
      </div>

      {/* Auto-run toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 rounded accent-accent"
          checked={testing.autoRun}
          onChange={(e) => update({ autoRun: e.target.checked })}
        />
        <div>
          <span className="text-sm text-text-primary">Auto-run tests</span>
          <p className="text-xs text-text-muted">Automatically run tests after successful implementation</p>
        </div>
      </label>

      {/* Scoped Testing */}
      <div>
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Scoped Testing
        </h4>

        <label className="flex items-center gap-3 cursor-pointer mb-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-accent"
            checked={testing.scoped}
            onChange={(e) => update({ scoped: e.target.checked })}
          />
          <div>
            <span className="text-sm text-text-primary">Run scoped tests only</span>
            <p className="text-xs text-text-muted">Only run tests matching the implemented flow's scope pattern</p>
          </div>
        </label>

        {testing.scoped && (
          <div>
            <label className="label">Scope Pattern</label>
            <input
              className="input w-full"
              value={testing.scopePattern}
              onChange={(e) => update({ scopePattern: e.target.value })}
              placeholder="tests/{domain_id}/**"
            />
            <p className="text-xs text-text-muted mt-1">
              Pattern to filter test files. Use {'{domain_id}'} and {'{flow_id}'} as placeholders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
