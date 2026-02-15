export type GeneratorId = 'openapi' | 'dockerfile' | 'docker-compose' | 'kubernetes' | 'cicd' | 'mermaid';

export interface GeneratorMeta {
  id: GeneratorId;
  name: string;
  description: string;
  multiFile: boolean;
}

export interface TechStackInfo {
  language: string;
  languageVersion: string;
  framework: string;
  database: string;
  orm: string;
  cache?: string;
}

export interface FlowEndpoint {
  flowId: string;
  flowName: string;
  domainId: string;
  domainName: string;
  type: 'traditional' | 'agent';
  triggerEvent?: string;
  triggerSource?: string;
  inputs: Array<{ name: string; type: string; required?: boolean }>;
  processes: Array<{ action?: string; service?: string }>;
  terminals: Array<{ outcome?: string }>;
}

export interface DomainGeneratorData {
  id: string;
  name: string;
  description?: string;
  flows: FlowEndpoint[];
  publishesEvents: string[];
  consumesEvents: string[];
}

export interface GeneratorInput {
  projectName: string;
  projectDescription: string;
  techStack: TechStackInfo;
  domains: DomainGeneratorData[];
}

export interface GeneratedFile {
  relativePath: string;
  content: string;
  language: string;
}

export type GeneratorPanelState = 'list' | 'generating' | 'preview' | 'saved';

export type GeneratorFunction = (input: GeneratorInput) => GeneratedFile[];
