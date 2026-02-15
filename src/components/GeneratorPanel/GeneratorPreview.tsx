import { useState, useCallback } from 'react';
import { ArrowLeft, Save, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { useGeneratorStore } from '../../stores/generator-store';
import { GENERATOR_REGISTRY } from '../../utils/generators';

export function GeneratorPreview() {
  const selectedGenerator = useGeneratorStore((s) => s.selectedGenerator);
  const generatedFiles = useGeneratorStore((s) => s.generatedFiles);
  const saving = useGeneratorStore((s) => s.saving);
  const saveFiles = useGeneratorStore((s) => s.saveFiles);
  const backToList = useGeneratorStore((s) => s.backToList);

  const meta = selectedGenerator ? GENERATOR_REGISTRY[selectedGenerator]?.meta : null;

  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(() => {
    // All expanded by default
    return new Set(generatedFiles.map((_, i) => i));
  });

  const toggleFile = useCallback((index: number) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleCopy = useCallback(() => {
    const text = generatedFiles
      .map((f) => `// ${f.relativePath}\n${f.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  }, [generatedFiles]);

  const isSingleFile = generatedFiles.length === 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{meta?.name ?? 'Preview'}</span>
          <span className="text-xs text-text-muted">
            {generatedFiles.length} file{generatedFiles.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isSingleFile ? (
          <div className="p-3">
            <div className="text-[10px] text-text-muted font-mono mb-1.5 px-1">
              {generatedFiles[0].relativePath}
            </div>
            <pre className="p-3 bg-[#1a1a2e] rounded-lg text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
              {generatedFiles[0].content}
            </pre>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {generatedFiles.map((file, index) => {
              const expanded = expandedFiles.has(index);
              return (
                <div key={index} className="border border-border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 bg-bg-tertiary hover:bg-bg-hover transition-colors text-left"
                    onClick={() => toggleFile(index)}
                  >
                    {expanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    )}
                    <span className="text-xs font-mono text-text-secondary truncate">
                      {file.relativePath}
                    </span>
                  </button>
                  {expanded && (
                    <pre className="p-3 bg-[#1a1a2e] text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap break-words leading-relaxed">
                      {file.content}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-accent hover:bg-accent/80 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          onClick={saveFiles}
          disabled={saving}
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save to Disk'}
        </button>
        <button
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-muted text-xs font-medium rounded-lg transition-colors"
          onClick={handleCopy}
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
        <button
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-bg-tertiary hover:bg-bg-hover text-text-muted text-xs font-medium rounded-lg transition-colors"
          onClick={backToList}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>
    </div>
  );
}
