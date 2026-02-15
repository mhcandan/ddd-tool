import { AlertCircle, AlertTriangle, Info, X, XCircle } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';

const icons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  fatal: XCircle,
};

const colors = {
  info: 'border-accent/50 bg-accent/10',
  warning: 'border-warning/50 bg-warning/10',
  error: 'border-danger/50 bg-danger/10',
  fatal: 'border-danger bg-danger/20',
};

export function ErrorToasts() {
  const errors = useAppStore((s) => s.errors);
  const dismissError = useAppStore((s) => s.dismissError);

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {errors.map((error) => {
        const Icon = icons[error.severity];
        return (
          <div
            key={error.id}
            className={`card border ${colors[error.severity]} p-3 flex gap-3 items-start animate-in slide-in-from-right`}
          >
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">
                {error.message}
              </p>
              {error.detail && (
                <p className="text-xs text-text-secondary mt-1 truncate">
                  {error.detail}
                </p>
              )}
              {error.recoveryAction && (
                <button
                  className="btn-ghost text-xs text-accent mt-2"
                  onClick={() => {
                    error.recoveryAction!.action();
                    dismissError(error.id);
                  }}
                >
                  {error.recoveryAction.label}
                </button>
              )}
            </div>
            <button
              onClick={() => dismissError(error.id)}
              className="btn-icon shrink-0 -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
