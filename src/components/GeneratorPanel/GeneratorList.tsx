import { FileCode, Container, Layers, Cloud, GitBranch, Share2 } from 'lucide-react';
import { useGeneratorStore } from '../../stores/generator-store';
import { GENERATOR_REGISTRY } from '../../utils/generators';
import type { GeneratorId } from '../../types/generator';

const ICONS: Record<GeneratorId, typeof FileCode> = {
  openapi: FileCode,
  dockerfile: Container,
  'docker-compose': Layers,
  kubernetes: Cloud,
  cicd: GitBranch,
  mermaid: Share2,
};

const GENERATOR_ORDER: GeneratorId[] = ['openapi', 'dockerfile', 'docker-compose', 'kubernetes', 'cicd', 'mermaid'];

export function GeneratorList() {
  const generate = useGeneratorStore((s) => s.generate);

  return (
    <div className="p-4 flex flex-col gap-3">
      <p className="text-xs text-text-muted">
        Generate production artifacts from your DDD specifications.
      </p>
      {GENERATOR_ORDER.map((id) => {
        const { meta } = GENERATOR_REGISTRY[id];
        const Icon = ICONS[id];
        return (
          <button
            key={id}
            className="flex items-start gap-3 p-3 rounded-lg bg-bg-tertiary hover:bg-bg-hover border border-border transition-colors text-left"
            onClick={() => generate(id)}
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-accent/10">
              <Icon className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">{meta.name}</div>
              <div className="text-xs text-text-muted mt-0.5">{meta.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
