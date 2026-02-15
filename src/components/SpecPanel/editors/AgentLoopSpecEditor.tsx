import { nanoid } from 'nanoid';
import { Plus, Trash2 } from 'lucide-react';
import type { AgentLoopSpec, ToolDefinition, MemoryStoreDefinition } from '../../../types/flow';
import { ExtraFieldsEditor } from './ExtraFieldsEditor';

interface Props {
  spec: AgentLoopSpec;
  onChange: (spec: AgentLoopSpec) => void;
}

const MODEL_OPTIONS = ['claude-sonnet', 'claude-haiku', 'gpt-4o', 'custom'];
const ON_MAX_OPTIONS: AgentLoopSpec['on_max_iterations'][] = ['escalate', 'respond', 'error'];
const MEMORY_TYPES: MemoryStoreDefinition['type'][] = ['conversation_history', 'vector_store', 'key_value'];

export function AgentLoopSpecEditor({ spec, onChange }: Props) {
  const tools = spec.tools ?? [];
  const memory = spec.memory ?? [];

  const addTool = () => {
    const tool: ToolDefinition = {
      id: nanoid(6),
      name: '',
      description: '',
      is_terminal: false,
    };
    onChange({ ...spec, tools: [...tools, tool] });
  };

  const updateTool = (index: number, updates: Partial<ToolDefinition>) => {
    const updated = tools.map((t, i) => (i === index ? { ...t, ...updates } : t));
    onChange({ ...spec, tools: updated });
  };

  const removeTool = (index: number) => {
    onChange({ ...spec, tools: tools.filter((_, i) => i !== index) });
  };

  const addMemory = () => {
    const mem: MemoryStoreDefinition = {
      name: '',
      type: 'conversation_history',
    };
    onChange({ ...spec, memory: [...memory, mem] });
  };

  const updateMemory = (index: number, updates: Partial<MemoryStoreDefinition>) => {
    const updated = memory.map((m, i) => (i === index ? { ...m, ...updates } : m));
    onChange({ ...spec, memory: updated });
  };

  const removeMemory = (index: number) => {
    onChange({ ...spec, memory: memory.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      {/* Model */}
      <div>
        <label className="label">Model</label>
        <select
          className="input"
          value={spec.model ?? 'claude-sonnet'}
          onChange={(e) => onChange({ ...spec, model: e.target.value })}
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* System Prompt */}
      <div>
        <label className="label">System Prompt</label>
        <textarea
          className="input min-h-[100px] resize-y"
          value={spec.system_prompt ?? ''}
          onChange={(e) => onChange({ ...spec, system_prompt: e.target.value })}
          placeholder="You are a helpful assistant..."
        />
      </div>

      {/* Max Iterations */}
      <div>
        <label className="label">Max Iterations</label>
        <input
          type="number"
          className="input"
          min={1}
          max={100}
          value={spec.max_iterations ?? 10}
          onChange={(e) => onChange({ ...spec, max_iterations: parseInt(e.target.value) || 10 })}
        />
      </div>

      {/* Temperature */}
      <div>
        <label className="label">Temperature: {(spec.temperature ?? 0.7).toFixed(1)}</label>
        <input
          type="range"
          className="w-full accent-accent"
          min={0}
          max={1}
          step={0.1}
          value={spec.temperature ?? 0.7}
          onChange={(e) => onChange({ ...spec, temperature: parseFloat(e.target.value) })}
        />
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>0.0</span>
          <span>1.0</span>
        </div>
      </div>

      {/* On Max Iterations */}
      <div>
        <label className="label">On Max Iterations</label>
        <select
          className="input"
          value={spec.on_max_iterations ?? 'respond'}
          onChange={(e) => onChange({ ...spec, on_max_iterations: e.target.value as AgentLoopSpec['on_max_iterations'] })}
        >
          {ON_MAX_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* Tools */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label !mb-0">Tools</label>
          <button type="button" className="btn-icon !p-0.5" onClick={addTool} title="Add tool">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {tools.length === 0 && (
          <p className="text-xs text-text-muted">No tools defined</p>
        )}
        <div className="space-y-2">
          {tools.map((tool, i) => (
            <div key={tool.id} className="bg-bg-primary rounded p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <input
                  className="input py-1 text-xs flex-1"
                  value={tool.name}
                  onChange={(e) => updateTool(i, { name: e.target.value })}
                  placeholder="Tool name"
                />
                <button type="button" className="btn-icon !p-0.5" onClick={() => removeTool(i)}>
                  <Trash2 className="w-3 h-3 text-text-muted hover:text-red-400" />
                </button>
              </div>
              <input
                className="input py-1 text-xs"
                value={tool.description ?? ''}
                onChange={(e) => updateTool(i, { description: e.target.value })}
                placeholder="Description"
              />
              <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={tool.is_terminal ?? false}
                  onChange={(e) => updateTool(i, { is_terminal: e.target.checked })}
                />
                Terminal tool
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Memory */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="label !mb-0">Memory</label>
          <button type="button" className="btn-icon !p-0.5" onClick={addMemory} title="Add memory store">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {memory.length === 0 && (
          <p className="text-xs text-text-muted">No memory stores</p>
        )}
        <div className="space-y-2">
          {memory.map((mem, i) => (
            <div key={i} className="bg-bg-primary rounded p-2 space-y-1.5">
              <div className="flex items-center gap-1">
                <input
                  className="input py-1 text-xs flex-1"
                  value={mem.name}
                  onChange={(e) => updateMemory(i, { name: e.target.value })}
                  placeholder="Store name"
                />
                <button type="button" className="btn-icon !p-0.5" onClick={() => removeMemory(i)}>
                  <Trash2 className="w-3 h-3 text-text-muted hover:text-red-400" />
                </button>
              </div>
              <select
                className="input py-1 text-xs"
                value={mem.type}
                onChange={(e) => updateMemory(i, { type: e.target.value as MemoryStoreDefinition['type'] })}
              >
                {MEMORY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <input
                type="number"
                className="input py-1 text-xs"
                value={mem.max_tokens ?? ''}
                onChange={(e) => updateMemory(i, { max_tokens: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Max tokens (optional)"
              />
            </div>
          ))}
        </div>
      </div>

      <ExtraFieldsEditor spec={spec} nodeType="agent_loop" onChange={onChange} />
    </div>
  );
}
