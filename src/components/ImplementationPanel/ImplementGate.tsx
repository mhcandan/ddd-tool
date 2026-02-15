import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useValidationStore } from '../../stores/validation-store';
import type { ImplementGateState } from '../../types/validation';

interface Props {
  flowId: string;
  domainId: string;
  onGateResult: (canImplement: boolean) => void;
}

export function ImplementGate({ flowId, domainId, onGateResult }: Props) {
  const checkImplementGate = useValidationStore((s) => s.checkImplementGate);
  const validateAll = useValidationStore((s) => s.validateAll);

  // Run validation on mount
  useEffect(() => {
    validateAll();
  }, [validateAll]);

  const gate: ImplementGateState = checkImplementGate(flowId, domainId);
  const errorCount =
    (gate.flowValidation?.errorCount ?? 0) +
    (gate.domainValidation?.errorCount ?? 0) +
    (gate.systemValidation?.errorCount ?? 0);
  const warningCount =
    (gate.flowValidation?.warningCount ?? 0) +
    (gate.domainValidation?.warningCount ?? 0) +
    (gate.systemValidation?.warningCount ?? 0);

  useEffect(() => {
    onGateResult(gate.canImplement);
  }, [gate.canImplement, onGateResult]);

  if (!gate.canImplement) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 bg-danger/10 border border-danger/30 rounded text-xs">
        <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
        <div>
          <span className="font-medium text-danger">
            Fix {errorCount} error{errorCount !== 1 ? 's' : ''} before implementing
          </span>
          <p className="text-text-muted mt-0.5">
            Open the Validation panel to see details.
          </p>
        </div>
      </div>
    );
  }

  if (gate.hasWarnings) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded text-xs">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <span className="text-warning">
          {warningCount} warning{warningCount !== 1 ? 's' : ''} — review before implementing
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-success">
      <CheckCircle className="w-3.5 h-3.5" />
      <span>All checks passed</span>
    </div>
  );
}
