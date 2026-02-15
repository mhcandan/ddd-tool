import { CheckCircle } from 'lucide-react';
import { useGeneratorStore } from '../../stores/generator-store';

export function GeneratorSaved() {
  const generatedFiles = useGeneratorStore((s) => s.generatedFiles);
  const backToList = useGeneratorStore((s) => s.backToList);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
      <CheckCircle className="w-10 h-10 text-green-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">Files saved</p>
        <p className="text-xs text-text-muted mt-1">
          {generatedFiles.length} file{generatedFiles.length !== 1 ? 's' : ''} written to disk
        </p>
      </div>

      <div className="w-full bg-bg-tertiary rounded-lg p-3 max-h-48 overflow-y-auto">
        {generatedFiles.map((file, i) => (
          <div key={i} className="text-xs font-mono text-text-secondary py-0.5">
            {file.relativePath}
          </div>
        ))}
      </div>

      <button
        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent/80 text-white text-xs font-medium rounded-lg transition-colors"
        onClick={backToList}
      >
        Generate Another
      </button>
    </div>
  );
}
