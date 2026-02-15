import { useEffect } from 'react';
import { Brain, RefreshCw, X } from 'lucide-react';
import { useMemoryStore } from '../../stores/memory-store';
import { SummaryCard } from './SummaryCard';
import { StatusList } from './StatusList';
import { DecisionList } from './DecisionList';
import { FlowDependencies } from './FlowDependencies';

export function MemoryPanel() {
  const togglePanel = useMemoryStore((s) => s.togglePanel);
  const refreshMemory = useMemoryStore((s) => s.refreshMemory);
  const isRefreshing = useMemoryStore((s) => s.isRefreshing);

  // Close on Escape — capture phase so it's handled before Breadcrumb navigation
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
    <div className="w-[340px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Brain className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1">
          Project Memory
        </span>
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={() => refreshMemory()}
          title="Refresh memory"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={togglePanel}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <SummaryCard />
        <FlowDependencies />
        <DecisionList />
        <StatusList />
      </div>
    </div>
  );
}
