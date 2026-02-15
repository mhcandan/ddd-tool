import { useEffect } from 'react';
import { Package, X } from 'lucide-react';
import { useGeneratorStore } from '../../stores/generator-store';
import { GeneratorList } from './GeneratorList';
import { GeneratorPreview } from './GeneratorPreview';
import { GeneratorSaved } from './GeneratorSaved';

export function GeneratorPanel() {
  const togglePanel = useGeneratorStore((s) => s.togglePanel);
  const panelState = useGeneratorStore((s) => s.panelState);
  const error = useGeneratorStore((s) => s.error);

  // Close on Escape — capture phase
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        togglePanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [togglePanel]);

  return (
    <div className="w-[380px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Package className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1">
          Generators
        </span>
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={togglePanel}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 text-red-400 text-xs border-b border-border">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {panelState === 'list' && <GeneratorList />}
        {panelState === 'generating' && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-muted">Generating...</p>
            </div>
          </div>
        )}
        {panelState === 'preview' && <GeneratorPreview />}
        {panelState === 'saved' && <GeneratorSaved />}
      </div>
    </div>
  );
}
