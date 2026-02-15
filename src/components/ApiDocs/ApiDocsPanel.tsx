import { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { useGeneratorStore } from '../../stores/generator-store';
import { useSheetStore } from '../../stores/sheet-store';
import { EndpointCard } from './EndpointCard';
import type { ParsedEndpoint } from '../../utils/openapi-parser';

export function ApiDocsPanel() {
  const parsedEndpoints = useGeneratorStore((s) => s.parsedEndpoints);
  const loadApiDocs = useGeneratorStore((s) => s.loadApiDocs);
  const toggleApiDocsPanel = useGeneratorStore((s) => s.toggleApiDocsPanel);
  const navigateToFlow = useSheetStore((s) => s.navigateToFlow);

  useEffect(() => {
    loadApiDocs();
  }, [loadApiDocs]);

  // Group by tag
  const grouped = parsedEndpoints.reduce<Record<string, ParsedEndpoint[]>>((acc, ep) => {
    const key = ep.tag;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ep);
    return acc;
  }, {});

  const handleEndpointClick = (ep: ParsedEndpoint) => {
    if (ep.domainId && ep.flowId) {
      navigateToFlow(ep.domainId, ep.flowId);
    }
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        toggleApiDocsPanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [toggleApiDocsPanel]);

  return (
    <div className="w-[380px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <BookOpen className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1">API Docs</span>
        <button className="btn-icon !p-1" onClick={toggleApiDocsPanel}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {parsedEndpoints.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-text-muted">No API docs available.</p>
            <p className="text-[10px] text-text-muted mt-1">Generate an OpenAPI spec first using the Generator panel.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([tag, endpoints]) => (
              <div key={tag}>
                <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                  {tag}
                </h3>
                <div className="space-y-1.5">
                  {endpoints.map((ep) => (
                    <EndpointCard
                      key={`${ep.method}-${ep.path}`}
                      endpoint={ep}
                      onClick={() => handleEndpointClick(ep)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
