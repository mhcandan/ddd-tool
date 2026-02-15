import { useState } from 'react';
import { X, GitBranch, Bot, Layout } from 'lucide-react';
import { FLOW_TEMPLATES } from '../../utils/flow-templates';

interface Props {
  onClose: () => void;
  onCreate: (name: string, description: string, flowType: 'traditional' | 'agent', templateId?: string) => void;
}

export function AddFlowDialog({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [flowType, setFlowType] = useState<'traditional' | 'agent'>('traditional');
  const [mode, setMode] = useState<'blank' | 'template'>('blank');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, description.trim(), flowType, mode === 'template' ? selectedTemplate ?? undefined : undefined);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-md mx-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add Flow</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="label" htmlFor="flow-name">
              Name
            </label>
            <input
              id="flow-name"
              className="input"
              placeholder="e.g. User Registration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Flow type selector */}
          <div>
            <label className="label">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  flowType === 'traditional'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-secondary hover:border-text-muted'
                }`}
                onClick={() => { setFlowType('traditional'); setSelectedTemplate(null); }}
              >
                <GitBranch className="w-4 h-4" />
                <span className="text-sm font-medium">Traditional</span>
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  flowType === 'agent'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-secondary hover:border-text-muted'
                }`}
                onClick={() => { setFlowType('agent'); setSelectedTemplate(null); }}
              >
                <Bot className="w-4 h-4" />
                <span className="text-sm font-medium">Agent</span>
              </button>
            </div>
          </div>

          {/* Mode toggle: Blank vs Template */}
          <div>
            <label className="label">Start From</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                  mode === 'blank'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-secondary hover:border-text-muted'
                }`}
                onClick={() => { setMode('blank'); setSelectedTemplate(null); }}
              >
                Blank
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                  mode === 'template'
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-secondary hover:border-text-muted'
                }`}
                onClick={() => setMode('template')}
              >
                <Layout className="w-4 h-4" />
                From Template
              </button>
            </div>
          </div>

          {/* Template grid */}
          {mode === 'template' && (
            <div className="grid grid-cols-2 gap-2">
              {FLOW_TEMPLATES.filter((t) => t.type === flowType).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-text-muted'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <p className="text-sm font-medium text-text-primary">{template.name}</p>
                  <p className="text-[10px] text-text-muted mt-1">{template.description}</p>
                  <p className="text-[10px] text-text-secondary mt-1">{template.nodeCount} nodes</p>
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="label" htmlFor="flow-description">
              Description (optional)
            </label>
            <input
              id="flow-description"
              className="input"
              placeholder="What does this flow do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!name.trim() || (mode === 'template' && !selectedTemplate)}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
