import type { NodeSpec, DddNodeType } from '../../types/flow';

interface GhostSpecViewProps {
  originalSpec: NodeSpec;
  suggestedSpec: NodeSpec;
  nodeType: DddNodeType;
}

export function GhostSpecView({ originalSpec, suggestedSpec }: GhostSpecViewProps) {
  const original = originalSpec as Record<string, unknown>;
  const suggested = suggestedSpec as Record<string, unknown>;

  // Collect all keys from both specs
  const allKeys = new Set([...Object.keys(original), ...Object.keys(suggested)]);

  return (
    <div className="space-y-2">
      {Array.from(allKeys).map((key) => {
        const origVal = original[key];
        const sugVal = suggested[key];
        const hasChange = sugVal !== undefined && JSON.stringify(origVal) !== JSON.stringify(sugVal);

        return (
          <div
            key={key}
            className={`rounded px-2 py-1.5 ${hasChange ? 'border-l-2 border-l-success bg-success/5' : ''}`}
          >
            <label className="text-[10px] uppercase tracking-wider text-text-muted font-medium block mb-0.5">
              {key}
            </label>
            <div className="text-xs text-text-primary">
              {hasChange ? (
                <div className="space-y-0.5">
                  {origVal !== undefined && origVal !== '' && (
                    <div className="text-text-muted line-through text-[10px]">
                      {formatValue(origVal)}
                    </div>
                  )}
                  <div className="text-success font-medium">
                    {formatValue(sugVal)}
                  </div>
                </div>
              ) : (
                <span className="text-text-secondary">{formatValue(origVal)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
