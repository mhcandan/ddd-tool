import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ParsedEndpoint } from '../../utils/openapi-parser';

const methodColors: Record<string, string> = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-amber-500/20 text-amber-400',
  PATCH: 'bg-orange-500/20 text-orange-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

interface Props {
  endpoint: ParsedEndpoint;
  onClick: () => void;
}

export function EndpointCard({ endpoint, onClick }: Props) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = methodColors[endpoint.method] ?? 'bg-gray-500/20 text-gray-400';

  return (
    <div className="border border-border rounded hover:border-text-muted transition-colors">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={onClick}
      >
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${colorClass}`}>
          {endpoint.method}
        </span>
        <span className="text-xs font-mono text-text-primary truncate flex-1">{endpoint.path}</span>
        <button
          className="btn-icon !p-0.5 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {endpoint.summary && (
        <p className="px-3 pb-1 text-[10px] text-text-muted">{endpoint.summary}</p>
      )}

      {expanded && (
        <div className="px-3 pb-2 space-y-2 border-t border-border mt-1 pt-2">
          {endpoint.requestBody && (
            <div>
              <p className="text-[10px] font-medium text-text-secondary mb-1">Request Body</p>
              <div className="space-y-0.5">
                {Object.entries(endpoint.requestBody.properties).map(([name, prop]) => (
                  <div key={name} className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-text-primary font-mono">{name}</span>
                    <span className="text-text-muted">{prop.type}</span>
                    {endpoint.requestBody!.required.includes(name) && (
                      <span className="text-danger">*</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(endpoint.responses).length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-text-secondary mb-1">Responses</p>
              <div className="space-y-0.5">
                {Object.entries(endpoint.responses).map(([code, resp]) => (
                  <div key={code} className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-text-primary font-mono">{code}</span>
                    <span className="text-text-muted">{resp.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
