import { stringify } from 'yaml';
import type { GeneratorInput, GeneratedFile, GeneratorFunction } from '../../types/generator';

function tsTypeToJsonSchema(type: string): string {
  const lower = type.toLowerCase();
  if (lower === 'number' || lower === 'int' || lower === 'integer' || lower === 'float') return 'number';
  if (lower === 'boolean' || lower === 'bool') return 'boolean';
  if (lower === 'array' || lower.endsWith('[]')) return 'array';
  return 'string';
}

export const generateOpenApi: GeneratorFunction = (input: GeneratorInput): GeneratedFile[] => {
  const paths: Record<string, unknown> = {};
  const tags: Array<{ name: string; description?: string }> = [];

  for (const domain of input.domains) {
    tags.push({
      name: domain.name,
      ...(domain.description ? { description: domain.description } : {}),
    });

    for (const flow of domain.flows) {
      const pathKey = `/${domain.id}/${flow.flowId}`;

      // Build request body schema from inputs
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const field of flow.inputs) {
        properties[field.name] = { type: tsTypeToJsonSchema(field.type) };
        if (field.required) required.push(field.name);
      }

      const hasInputs = Object.keys(properties).length > 0;

      // Build response description from terminals
      const responseDesc = flow.terminals
        .map((t) => t.outcome)
        .filter(Boolean)
        .join('; ') || 'Successful operation';

      const operation: Record<string, unknown> = {
        tags: [domain.name],
        summary: flow.flowName,
        operationId: `${domain.id}_${flow.flowId}`.replace(/-/g, '_'),
        responses: {
          '200': {
            description: responseDesc,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          '400': { description: 'Bad request' },
          '500': { description: 'Internal server error' },
        },
      };

      if (hasInputs) {
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties,
                ...(required.length > 0 ? { required } : {}),
              },
            },
          },
        };
      }

      paths[pathKey] = { post: operation };
    }
  }

  const doc = {
    openapi: '3.0.0',
    info: {
      title: `${input.projectName} API`,
      description: input.projectDescription || `API for ${input.projectName}`,
      version: '1.0.0',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
    tags,
    paths,
  };

  return [
    {
      relativePath: 'generated/openapi.yaml',
      content: stringify(doc, { lineWidth: 0 }),
      language: 'yaml',
    },
  ];
};
