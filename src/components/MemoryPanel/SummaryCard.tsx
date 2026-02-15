import { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useMemoryStore } from '../../stores/memory-store';
import { useProjectStore } from '../../stores/project-store';

export function SummaryCard() {
  const summary = useMemoryStore((s) => s.summary);
  const implementationStatus = useMemoryStore((s) => s.implementationStatus);
  const summaryGenerating = useMemoryStore((s) => s.summaryGenerating);
  const regenerateSummary = useMemoryStore((s) => s.regenerateSummary);
  const domainConfigs = useProjectStore((s) => s.domainConfigs);

  const [expanded, setExpanded] = useState(false);

  const domainCount = Object.keys(domainConfigs).length;
  const flowCount = Object.values(domainConfigs).reduce((sum, d) => sum + d.flows.length, 0);
  const overview = implementationStatus?.overview;

  const content = summary?.content ?? '';
  const isLong = content.length > 200;
  const displayContent = isLong && !expanded ? content.slice(0, 200) + '...' : content;

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-text-muted font-medium">
          Summary
        </span>
        {summary?.stale && (
          <span className="text-[10px] text-warning">stale</span>
        )}
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 mb-2">
        <span className="text-[10px] text-text-muted">
          <span className="text-text-secondary font-medium">{domainCount}</span> domains
        </span>
        <span className="text-[10px] text-text-muted">
          <span className="text-text-secondary font-medium">{flowCount}</span> flows
        </span>
        {overview && (
          <>
            <span className="text-[10px] text-text-muted">
              <span className="text-success font-medium">{overview.implemented}</span> impl
            </span>
            <span className="text-[10px] text-text-muted">
              <span className="text-text-secondary font-medium">{overview.pending}</span> pending
            </span>
          </>
        )}
      </div>

      {content ? (
        <div>
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          {isLong && (
            <button
              className="text-[10px] text-accent hover:text-accent-hover mt-1 flex items-center gap-0.5"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          <button
            className="text-[10px] text-accent hover:text-accent-hover mt-2 flex items-center gap-1"
            onClick={regenerateSummary}
            disabled={summaryGenerating}
          >
            <RefreshCw className={`w-3 h-3 ${summaryGenerating ? 'animate-spin' : ''}`} />
            {summaryGenerating ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-3">
          <Sparkles className="w-6 h-6 text-text-muted/30" />
          <p className="text-[10px] text-text-muted text-center">
            No summary yet. Generate one from your project specs.
          </p>
          <button
            className="btn-primary text-[10px] px-3 py-1"
            onClick={regenerateSummary}
            disabled={summaryGenerating}
          >
            {summaryGenerating ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>
      )}
    </div>
  );
}
