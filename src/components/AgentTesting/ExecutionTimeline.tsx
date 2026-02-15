import { useState } from 'react';
import { Loader2, Check, XCircle, ChevronDown, ChevronRight, Zap, RotateCw, Shield, Hand, Cog } from 'lucide-react';
import { CopyButton } from '../shared/CopyButton';
import type { AgentTestStep } from '../../types/agent-test';
import type { DddNodeType } from '../../types/flow';

const nodeIcons: Partial<Record<DddNodeType, React.ElementType>> = {
  trigger: Zap,
  agent_loop: RotateCw,
  guardrail: Shield,
  human_gate: Hand,
  process: Cog,
};

interface Props {
  steps: AgentTestStep[];
}

function StepItem({ step }: { step: AgentTestStep }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = nodeIcons[step.nodeType] ?? Cog;

  return (
    <div className="border border-border rounded">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-bg-hover"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status indicator */}
        {step.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />}
        {step.status === 'completed' && <Check className="w-3.5 h-3.5 text-success shrink-0" />}
        {step.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-danger shrink-0" />}
        {step.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border-2 border-text-muted shrink-0" />}
        {step.status === 'skipped' && <div className="w-3.5 h-3.5 rounded-full bg-text-muted shrink-0" />}

        <Icon className="w-3.5 h-3.5 text-text-secondary shrink-0" />
        <span className="text-xs text-text-primary flex-1 truncate">{step.nodeLabel}</span>

        {step.duration !== undefined && (
          <span className="text-[10px] text-text-muted shrink-0">{step.duration}ms</span>
        )}

        {(step.input || step.output || step.error) && (
          expanded ? <ChevronDown className="w-3 h-3 text-text-muted" /> : <ChevronRight className="w-3 h-3 text-text-muted" />
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-2 space-y-1.5 border-t border-border pt-2">
          {step.input && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-text-secondary">Input</p>
                <CopyButton text={JSON.stringify(step.input, null, 2)} />
              </div>
              <pre className="text-[9px] text-text-muted bg-bg-primary rounded p-1.5 overflow-x-auto">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </div>
          )}
          {step.output && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-text-secondary">Output</p>
                <CopyButton text={JSON.stringify(step.output, null, 2)} />
              </div>
              <pre className="text-[9px] text-text-muted bg-bg-primary rounded p-1.5 overflow-x-auto max-h-[200px] overflow-y-auto">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            </div>
          )}
          {step.error && (
            <div>
              <p className="text-[10px] font-medium text-danger">Error</p>
              <p className="text-[9px] text-danger bg-danger/10 rounded p-1.5">{step.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExecutionTimeline({ steps }: Props) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">Execution Steps</p>
        <span className="text-[10px] text-text-muted">{completedCount}/{totalCount}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {steps.map((step) => (
          <StepItem key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
