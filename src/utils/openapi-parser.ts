import { parse } from 'yaml';

export interface ParsedEndpoint {
  method: string;
  path: string;
  summary: string;
  operationId: string;
  tag: string;
  requestBody?: { properties: Record<string, { type: string }>; required: string[] };
  responses: Record<string, { description: string }>;
  flowId?: string;
  domainId?: string;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const;

export function parseOpenApiYaml(yaml: string): ParsedEndpoint[] {
  const endpoints: ParsedEndpoint[] = [];

  let doc: Record<string, unknown>;
  try {
    doc = parse(yaml) as Record<string, unknown>;
  } catch {
    return endpoints;
  }

  const paths = doc.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return endpoints;

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, unknown>)[method] as Record<string, unknown> | undefined;
      if (!operation) continue;

      const tags = (operation.tags as string[]) ?? [];
      const tag = tags[0] ?? 'default';

      // Extract request body schema
      let requestBody: ParsedEndpoint['requestBody'];
      const reqBody = operation.requestBody as Record<string, unknown> | undefined;
      if (reqBody) {
        const content = reqBody.content as Record<string, Record<string, unknown>> | undefined;
        const jsonContent = content?.['application/json'];
        const schema = jsonContent?.schema as Record<string, unknown> | undefined;
        if (schema) {
          const props = schema.properties as Record<string, { type: string }> | undefined;
          const required = (schema.required as string[]) ?? [];
          if (props) {
            requestBody = { properties: props, required };
          }
        }
      }

      // Extract responses
      const responses: Record<string, { description: string }> = {};
      const rawResponses = operation.responses as Record<string, Record<string, unknown>> | undefined;
      if (rawResponses) {
        for (const [code, resp] of Object.entries(rawResponses)) {
          responses[code] = { description: (resp?.description as string) ?? '' };
        }
      }

      // Extract x-ddd-flow and x-ddd-domain extensions
      const flowId = operation['x-ddd-flow'] as string | undefined;
      const domainId = operation['x-ddd-domain'] as string | undefined;

      endpoints.push({
        method: method.toUpperCase(),
        path,
        summary: (operation.summary as string) ?? '',
        operationId: (operation.operationId as string) ?? '',
        tag,
        requestBody,
        responses,
        flowId: flowId ?? tag.toLowerCase().replace(/\s+/g, '-'),
        domainId: domainId ?? tag.toLowerCase().replace(/\s+/g, '-'),
      });
    }
  }

  return endpoints;
}
