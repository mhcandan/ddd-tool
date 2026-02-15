import { useState } from 'react';
import type { ValidationIssue } from '../../../types/validation';

interface Props {
  issues?: ValidationIssue[];
}

export function NodeValidationDot({ issues }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!issues || issues.length === 0) return null;

  const hasErrors = issues.some((i) => i.severity === 'error');
  const hasWarnings = issues.some((i) => i.severity === 'warning');

  const dotColor = hasErrors
    ? 'bg-red-500'
    : hasWarnings
      ? 'bg-amber-500'
      : 'bg-blue-500';

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const firstIssue = issues[0];

  return (
    <div
      className="absolute -top-1 -right-1 z-10"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-3 h-3 rounded-full ${dotColor} border border-bg-secondary shadow-sm`} />
      {showTooltip && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-bg-primary border border-border rounded-lg shadow-xl p-2 text-xs z-50">
          <div className="font-medium text-text-primary mb-1">
            {errorCount > 0 && <span className="text-red-400">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>}
            {errorCount > 0 && warningCount > 0 && ', '}
            {warningCount > 0 && <span className="text-amber-400">{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>}
            {errorCount === 0 && warningCount === 0 && <span className="text-blue-400">{issues.length} info</span>}
          </div>
          <p className="text-text-secondary line-clamp-2">{firstIssue.message}</p>
        </div>
      )}
    </div>
  );
}
