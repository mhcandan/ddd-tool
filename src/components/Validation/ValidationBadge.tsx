import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useValidationStore } from '../../stores/validation-store';

export function ValidationBadge() {
  const panelOpen = useValidationStore((s) => s.panelOpen);
  const togglePanel = useValidationStore((s) => s.togglePanel);
  const getCurrentFlowResult = useValidationStore((s) => s.getCurrentFlowResult);

  const result = getCurrentFlowResult();
  const errorCount = result?.errorCount ?? 0;
  const warningCount = result?.warningCount ?? 0;
  const totalIssues = errorCount + warningCount;

  const Icon = errorCount > 0 ? ShieldX : warningCount > 0 ? ShieldAlert : ShieldCheck;

  return (
    <button
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
        panelOpen
          ? 'bg-accent/20 text-accent'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      }`}
      onClick={togglePanel}
      title="Toggle validation panel"
    >
      <Icon className="w-3.5 h-3.5" />
      <span>Validate</span>
      {totalIssues > 0 && (
        <span
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-medium leading-none ${
            errorCount > 0 ? 'bg-red-500' : 'bg-amber-500'
          }`}
        >
          {totalIssues > 9 ? '9+' : totalIssues}
        </span>
      )}
    </button>
  );
}
