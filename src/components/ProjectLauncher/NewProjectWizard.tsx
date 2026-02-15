import { useState } from 'react';
import { ArrowLeft, ArrowRight, FolderOpen, Plus, Trash2, Check } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import type { NewProjectConfig } from '../../types/app';
import { useAppStore } from '../../stores/app-store';

interface Props {
  onClose: () => void;
}

const STEPS = ['Basics', 'Tech Stack', 'Domains'] as const;

const emptyConfig: NewProjectConfig = {
  name: '',
  location: '',
  description: '',
  initGit: true,
  techStack: {
    language: 'TypeScript',
    languageVersion: '5.x',
    framework: '',
    database: '',
    orm: '',
  },
  domains: [{ name: '', description: '' }],
};

export function NewProjectWizard({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<NewProjectConfig>({ ...emptyConfig });
  const [creating, setCreating] = useState(false);
  const createProject = useAppStore((s) => s.createProject);
  const pushError = useAppStore((s) => s.pushError);

  const canNext =
    step === 0
      ? config.name.trim() !== '' && config.location.trim() !== ''
      : step === 1
        ? config.techStack.language.trim() !== ''
        : config.domains.some((d) => d.name.trim() !== '');

  async function handleBrowseLocation() {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      setConfig((c) => ({ ...c, location: selected as string }));
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const cleanedDomains = config.domains.filter(
        (d) => d.name.trim() !== ''
      );
      await createProject({ ...config, domains: cleanedDomains });
    } catch (e) {
      pushError('error', 'file', 'Failed to create project', String(e));
    } finally {
      setCreating(false);
    }
  }

  function addDomain() {
    setConfig((c) => ({
      ...c,
      domains: [...c.domains, { name: '', description: '' }],
    }));
  }

  function removeDomain(index: number) {
    setConfig((c) => ({
      ...c,
      domains: c.domains.filter((_, i) => i !== index),
    }));
  }

  function updateDomain(
    index: number,
    field: 'name' | 'description',
    value: string
  ) {
    setConfig((c) => ({
      ...c,
      domains: c.domains.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      ),
    }));
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
      <div className="card w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">New Project</h2>
          <div className="flex items-center gap-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    i < step
                      ? 'bg-success text-white'
                      : i === step
                        ? 'bg-accent text-white'
                        : 'bg-bg-tertiary text-text-muted'
                  }`}
                >
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span
                  className={`text-xs ${i === step ? 'text-text-primary' : 'text-text-muted'}`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input
                  className="input"
                  placeholder="my-project"
                  value={config.name}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Location</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="/path/to/projects"
                    value={config.location}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, location: e.target.value }))
                    }
                  />
                  <button
                    className="btn-secondary shrink-0"
                    onClick={handleBrowseLocation}
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  className="input"
                  placeholder="Optional project description"
                  value={config.description}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, description: e.target.value }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.initGit}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, initGit: e.target.checked }))
                  }
                  className="w-4 h-4 rounded accent-accent"
                />
                <span className="text-sm text-text-secondary">
                  Initialize Git repository
                </span>
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="label">Language</label>
                <input
                  className="input"
                  value={config.techStack.language}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      techStack: { ...c.techStack, language: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Language Version</label>
                <input
                  className="input"
                  value={config.techStack.languageVersion}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      techStack: {
                        ...c.techStack,
                        languageVersion: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Framework</label>
                <input
                  className="input"
                  placeholder="e.g. Next.js, Express, FastAPI"
                  value={config.techStack.framework}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      techStack: { ...c.techStack, framework: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Database</label>
                <input
                  className="input"
                  placeholder="e.g. PostgreSQL, MongoDB"
                  value={config.techStack.database}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      techStack: { ...c.techStack, database: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">ORM</label>
                <input
                  className="input"
                  placeholder="e.g. Prisma, Drizzle, SQLAlchemy"
                  value={config.techStack.orm}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      techStack: { ...c.techStack, orm: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Cache (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Redis, Memcached"
                  value={config.techStack.cache ?? ''}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      techStack: {
                        ...c.techStack,
                        cache: e.target.value || undefined,
                      },
                    }))
                  }
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary mb-4">
                Define the top-level business domains for your system.
              </p>
              {config.domains.map((domain, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      className="input"
                      placeholder="Domain name"
                      value={domain.name}
                      onChange={(e) => updateDomain(i, 'name', e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Brief description"
                      value={domain.description}
                      onChange={(e) =>
                        updateDomain(i, 'description', e.target.value)
                      }
                    />
                  </div>
                  {config.domains.length > 1 && (
                    <button
                      className="btn-icon mt-1"
                      onClick={() => removeDomain(i)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                className="btn-ghost text-sm"
                onClick={addDomain}
              >
                <Plus className="w-4 h-4" />
                Add Domain
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button className="btn-ghost" onClick={step === 0 ? onClose : () => setStep(step - 1)}>
            {step === 0 ? (
              'Cancel'
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Back
              </>
            )}
          </button>
          {step < 2 ? (
            <button
              className="btn-primary"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="btn-primary"
              disabled={!canNext || creating}
              onClick={handleCreate}
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
