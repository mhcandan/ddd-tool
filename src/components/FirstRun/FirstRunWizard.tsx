import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle, XCircle, Loader2, FolderOpen, SkipForward } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore, DEFAULT_SETTINGS } from '../../stores/app-store';
import { createSampleProject } from '../../utils/sample-project';
import type { GlobalSettings, ProviderConfig } from '../../types/app';

const STEPS = ['Connect LLM', 'Claude Code', 'Get Started'] as const;

type ConnectionStatus = 'idle' | 'testing' | 'success' | 'error';

interface ProviderState {
  enabled: boolean;
  apiKeyEnvVar: string;
  baseUrl?: string;
  detectedModels?: string[];
  status: ConnectionStatus;
  error?: string;
}

export function FirstRunWizard() {
  const [step, setStep] = useState(0);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const openProject = useAppStore((s) => s.openProject);
  const setView = useAppStore((s) => s.setView);

  // Step 1: LLM provider state
  const [providers, setProviders] = useState<Record<string, ProviderState>>({
    anthropic: { enabled: true, apiKeyEnvVar: 'ANTHROPIC_API_KEY', status: 'idle' },
    openai: { enabled: false, apiKeyEnvVar: 'OPENAI_API_KEY', status: 'idle' },
    ollama: { enabled: false, apiKeyEnvVar: '', baseUrl: 'http://localhost:11434', status: 'idle' },
  });

  // Step 2: Claude Code state
  const [claudeDetected, setClaudeDetected] = useState<boolean | null>(null);
  const [claudePath, setClaudePath] = useState('claude');
  const [claudeEnabled, setClaudeEnabled] = useState(true);
  const [detectingClaude, setDetectingClaude] = useState(false);

  // Step 3: Starting point
  const [startChoice, setStartChoice] = useState<'new' | 'open' | 'sample'>('new');
  const [completing, setCompleting] = useState(false);

  function updateProvider(id: string, partial: Partial<ProviderState>) {
    setProviders((p) => ({ ...p, [id]: { ...p[id], ...partial } }));
  }

  async function testConnection(providerId: string) {
    const p = providers[providerId];
    updateProvider(providerId, { status: 'testing', error: undefined });

    try {
      const providerType = providerId === 'ollama' ? 'ollama' : providerId;
      await invoke('llm_chat', {
        provider: providerType,
        model: providerId === 'anthropic' ? 'claude-haiku-4-5-20251001' :
               providerId === 'openai' ? 'gpt-4o-mini' : 'llama3',
        systemPrompt: 'Reply with OK',
        userMessage: 'Hello',
        apiKeyEnvVar: p.apiKeyEnvVar || undefined,
      });
      updateProvider(providerId, { status: 'success' });
    } catch (e) {
      updateProvider(providerId, { status: 'error', error: String(e) });
    }
  }

  async function detectClaude() {
    setDetectingClaude(true);
    try {
      const result: string = await invoke('run_command', {
        command: 'which',
        args: [claudePath],
        cwd: '/',
      });
      setClaudeDetected(result.trim().length > 0);
      if (result.trim().length > 0) {
        setClaudePath(result.trim());
      }
    } catch {
      setClaudeDetected(false);
    } finally {
      setDetectingClaude(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);

    // Build settings from wizard state
    const providerConfigs: ProviderConfig[] = [
      {
        id: 'anthropic',
        name: 'Anthropic',
        type: 'anthropic',
        apiKeyEnvVar: providers.anthropic.apiKeyEnvVar,
        models: ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001'],
        enabled: providers.anthropic.enabled,
      },
      {
        id: 'openai',
        name: 'OpenAI',
        type: 'openai',
        apiKeyEnvVar: providers.openai.apiKeyEnvVar,
        models: ['gpt-4o', 'gpt-4o-mini'],
        enabled: providers.openai.enabled,
      },
      ...(providers.ollama.enabled
        ? [{
            id: 'ollama',
            name: 'Ollama',
            type: 'ollama' as const,
            baseUrl: providers.ollama.baseUrl || 'http://localhost:11434',
            models: providers.ollama.detectedModels?.length ? providers.ollama.detectedModels : ['llama3'],
            enabled: true,
          }]
        : []),
    ];

    const settings: GlobalSettings = {
      ...DEFAULT_SETTINGS,
      llm: { providers: providerConfigs },
      claudeCode: {
        ...DEFAULT_SETTINGS.claudeCode,
        enabled: claudeEnabled,
        command: claudePath,
      },
    };

    await saveSettings(settings);

    if (startChoice === 'open') {
      try {
        const selected = await open({ directory: true, multiple: false });
        if (selected) {
          openProject(selected as string);
          return;
        }
      } catch {
        // Fall through to launcher
      }
    } else if (startChoice === 'sample') {
      try {
        const samplePath = await createSampleProject();
        openProject(samplePath);
        return;
      } catch {
        // Fall through to launcher
      }
    }

    // 'new' or fallback — go to launcher
    setView('launcher');
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center px-4">
      <div className="card w-full max-w-lg mx-4 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Welcome to DDD Tool</h2>
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
                <span className={`text-xs ${i === step ? 'text-text-primary' : 'text-text-muted'}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Connect LLM */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Configure at least one LLM provider for AI-powered features.
              </p>

              {/* Anthropic */}
              <ProviderCard
                label="Anthropic"
                description="Claude models for design assistance"
                provider={providers.anthropic}
                onToggle={(v) => updateProvider('anthropic', { enabled: v })}
                onApiKeyChange={(v) => updateProvider('anthropic', { apiKeyEnvVar: v })}
                onTest={() => testConnection('anthropic')}
              />

              {/* OpenAI */}
              <ProviderCard
                label="OpenAI"
                description="GPT models as alternative or fallback"
                provider={providers.openai}
                onToggle={(v) => updateProvider('openai', { enabled: v })}
                onApiKeyChange={(v) => updateProvider('openai', { apiKeyEnvVar: v })}
                onTest={() => testConnection('openai')}
              />

              {/* Ollama */}
              <ProviderCard
                label="Ollama"
                description="Local models via Ollama"
                provider={providers.ollama}
                onToggle={(v) => updateProvider('ollama', { enabled: v })}
                onTest={() => testConnection('ollama')}
                hideApiKey
                showUrl
                onUrlChange={(v) => updateProvider('ollama', { baseUrl: v })}
                onDetectModels={async () => {
                  const url = providers.ollama.baseUrl || 'http://localhost:11434';
                  try {
                    const result: string = await invoke('run_command', {
                      command: 'curl',
                      args: ['-s', `${url}/api/tags`],
                      cwd: '/',
                    });
                    const parsed = JSON.parse(result);
                    const models = (parsed.models || []).map((m: { name: string }) => m.name);
                    updateProvider('ollama', { detectedModels: models.length > 0 ? models : ['llama3'] });
                  } catch {
                    updateProvider('ollama', { detectedModels: ['llama3'] });
                  }
                }}
                detectedModels={providers.ollama.detectedModels}
              />
            </div>
          )}

          {/* Step 2: Claude Code */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Claude Code enables automated implementation from your flow designs.
              </p>

              <div className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">Claude Code CLI</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={claudeEnabled}
                      onChange={(e) => setClaudeEnabled(e.target.checked)}
                      className="w-4 h-4 rounded accent-accent"
                    />
                    <span className="text-xs text-text-secondary">Enable</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={claudePath}
                    onChange={(e) => {
                      setClaudePath(e.target.value);
                      setClaudeDetected(null);
                    }}
                    placeholder="Path to claude CLI"
                  />
                  <button
                    className="btn-secondary text-xs"
                    onClick={detectClaude}
                    disabled={detectingClaude}
                  >
                    {detectingClaude ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Detect'}
                  </button>
                </div>

                {claudeDetected === true && (
                  <div className="flex items-center gap-2 text-success text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Found at {claudePath}
                  </div>
                )}
                {claudeDetected === false && (
                  <div className="flex items-center gap-2 text-danger text-xs">
                    <XCircle className="w-4 h-4" />
                    Not found. You can install it later or provide the correct path.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Get Started */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                Choose how to get started.
              </p>

              <label
                className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                  startChoice === 'new' ? 'ring-2 ring-accent' : ''
                }`}
                onClick={() => setStartChoice('new')}
              >
                <input
                  type="radio"
                  name="start"
                  checked={startChoice === 'new'}
                  onChange={() => setStartChoice('new')}
                  className="mt-1 accent-accent"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">New Project</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Create a new DDD project from scratch
                  </p>
                </div>
              </label>

              <label
                className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                  startChoice === 'open' ? 'ring-2 ring-accent' : ''
                }`}
                onClick={() => setStartChoice('open')}
              >
                <input
                  type="radio"
                  name="start"
                  checked={startChoice === 'open'}
                  onChange={() => setStartChoice('open')}
                  className="mt-1 accent-accent"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">Open Existing</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Open an existing DDD project folder
                  </p>
                </div>
              </label>

              <label
                className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                  startChoice === 'sample' ? 'ring-2 ring-accent' : ''
                }`}
                onClick={() => setStartChoice('sample')}
              >
                <input
                  type="radio"
                  name="start"
                  checked={startChoice === 'sample'}
                  onChange={() => setStartChoice('sample')}
                  className="mt-1 accent-accent"
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">Explore Sample</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Open a pre-built sample project with 3 domains and 5 flows
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          {step === 0 ? (
            <button
              className="btn-ghost text-xs"
              onClick={() => {
                // Skip wizard entirely with defaults
                saveSettings(DEFAULT_SETTINGS);
                setView('launcher');
              }}
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip Setup
            </button>
          ) : (
            <button className="btn-ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step < 2 ? (
            <button
              className="btn-primary"
              onClick={() => {
                if (step === 1 && claudeDetected === null && claudeEnabled) {
                  detectClaude();
                }
                setStep(step + 1);
              }}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="btn-primary"
              disabled={completing}
              onClick={handleComplete}
            >
              {completing ? 'Setting up...' : (
                <>
                  {startChoice === 'open' && <FolderOpen className="w-4 h-4" />}
                  {startChoice === 'open' ? 'Open Project' : startChoice === 'sample' ? 'Open Sample' : 'Get Started'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Provider Card sub-component ---

interface ProviderCardProps {
  label: string;
  description: string;
  provider: ProviderState;
  onToggle: (enabled: boolean) => void;
  onApiKeyChange?: (envVar: string) => void;
  onTest: () => void;
  hideApiKey?: boolean;
  showUrl?: boolean;
  onUrlChange?: (url: string) => void;
  onDetectModels?: () => void;
  detectedModels?: string[];
}

function ProviderCard({ label, description, provider, onToggle, onApiKeyChange, onTest, hideApiKey, showUrl, onUrlChange, onDetectModels, detectedModels }: ProviderCardProps) {
  return (
    <div className={`card p-4 space-y-2 transition-opacity ${!provider.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={provider.enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 rounded accent-accent"
          />
        </label>
      </div>

      {provider.enabled && (
        <>
          {!hideApiKey && onApiKeyChange && (
            <div>
              <label className="label">API Key Env Variable</label>
              <input
                className="input"
                value={provider.apiKeyEnvVar}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="ENV_VAR_NAME"
              />
            </div>
          )}

          {showUrl && onUrlChange && (
            <div>
              <label className="label">URL</label>
              <input
                className="input"
                value={provider.baseUrl || ''}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-xs"
              onClick={onTest}
              disabled={provider.status === 'testing'}
            >
              {provider.status === 'testing' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'Test Connection'
              )}
            </button>
            {onDetectModels && (
              <button
                className="btn-secondary text-xs"
                onClick={onDetectModels}
              >
                Detect Models
              </button>
            )}
            {provider.status === 'success' && (
              <span className="flex items-center gap-1 text-success text-xs">
                <CheckCircle className="w-3.5 h-3.5" /> Connected
              </span>
            )}
            {provider.status === 'error' && (
              <span className="flex items-center gap-1 text-danger text-xs truncate max-w-[200px]" title={provider.error}>
                <XCircle className="w-3.5 h-3.5" /> {provider.error?.slice(0, 40)}
              </span>
            )}
          </div>

          {detectedModels && detectedModels.length > 0 && (
            <div className="text-xs text-text-secondary">
              Models: {detectedModels.join(', ')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
