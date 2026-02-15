import type { GeneratorId, GeneratorMeta, GeneratorFunction } from '../../types/generator';
import { generateOpenApi } from './openapi';
import { generateDockerfile } from './dockerfile';
import { generateDockerCompose } from './docker-compose';
import { generateKubernetes } from './kubernetes';
import { generateCicd } from './cicd';
import { generateMermaid } from './mermaid';

export { collectGeneratorInput } from './collect-input';

export const GENERATOR_REGISTRY: Record<GeneratorId, { meta: GeneratorMeta; generate: GeneratorFunction }> = {
  openapi: {
    meta: {
      id: 'openapi',
      name: 'OpenAPI Spec',
      description: 'Generate OpenAPI 3.0 schema from flow definitions',
      multiFile: false,
    },
    generate: generateOpenApi,
  },
  dockerfile: {
    meta: {
      id: 'dockerfile',
      name: 'Dockerfile',
      description: 'Multi-stage Dockerfile with .dockerignore',
      multiFile: true,
    },
    generate: generateDockerfile,
  },
  'docker-compose': {
    meta: {
      id: 'docker-compose',
      name: 'Docker Compose',
      description: 'App, database, and cache services',
      multiFile: false,
    },
    generate: generateDockerCompose,
  },
  kubernetes: {
    meta: {
      id: 'kubernetes',
      name: 'Kubernetes',
      description: 'Per-domain deployments, services, namespace, configmap',
      multiFile: true,
    },
    generate: generateKubernetes,
  },
  cicd: {
    meta: {
      id: 'cicd',
      name: 'CI/CD Pipeline',
      description: 'GitHub Actions workflow with test, build, and deploy',
      multiFile: false,
    },
    generate: generateCicd,
  },
  mermaid: {
    meta: {
      id: 'mermaid',
      name: 'Mermaid Diagram',
      description: 'Mermaid flowchart diagram from flow definitions',
      multiFile: true,
    },
    generate: generateMermaid,
  },
};
