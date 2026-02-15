import { stringify } from 'yaml';
import type { GeneratorInput, GeneratedFile, GeneratorFunction } from '../../types/generator';

export const generateKubernetes: GeneratorFunction = (input: GeneratorInput): GeneratedFile[] => {
  const files: GeneratedFile[] = [];
  const ns = input.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const lang = input.techStack.language.toLowerCase();
  const appPort = (lang === 'python') ? 8000 :
    (lang === 'go' || lang === 'rust' || lang === 'java') ? 8080 : 3000;

  // Namespace
  files.push({
    relativePath: 'generated/k8s/namespace.yaml',
    content: stringify({
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: ns },
    }),
    language: 'yaml',
  });

  // ConfigMap with shared config
  const configData: Record<string, string> = {
    NODE_ENV: 'production',
    APP_NAME: input.projectName,
  };
  const db = input.techStack.database.toLowerCase();
  if (db === 'postgres' || db === 'postgresql') {
    configData.DATABASE_HOST = 'postgres';
    configData.DATABASE_PORT = '5432';
    configData.DATABASE_NAME = 'app_db';
  } else if (db === 'mysql') {
    configData.DATABASE_HOST = 'mysql';
    configData.DATABASE_PORT = '3306';
    configData.DATABASE_NAME = 'app_db';
  } else if (db === 'mongodb' || db === 'mongo') {
    configData.DATABASE_HOST = 'mongodb';
    configData.DATABASE_PORT = '27017';
    configData.DATABASE_NAME = 'app_db';
  }
  if (input.techStack.cache === 'redis') {
    configData.REDIS_HOST = 'redis';
    configData.REDIS_PORT = '6379';
  }

  files.push({
    relativePath: 'generated/k8s/configmap.yaml',
    content: stringify({
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: { name: `${ns}-config`, namespace: ns },
      data: configData,
    }),
    language: 'yaml',
  });

  // Per-domain deployment + service
  for (const domain of input.domains) {
    const domainSlug = domain.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const labels = {
      app: domainSlug,
      domain: domain.id,
      project: ns,
    };

    // Deployment
    files.push({
      relativePath: `generated/k8s/${domainSlug}-deployment.yaml`,
      content: stringify({
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: domainSlug,
          namespace: ns,
          labels,
        },
        spec: {
          replicas: 2,
          selector: { matchLabels: { app: domainSlug } },
          template: {
            metadata: { labels },
            spec: {
              containers: [
                {
                  name: domainSlug,
                  image: `${ns}/${domainSlug}:latest`,
                  ports: [{ containerPort: appPort }],
                  envFrom: [{ configMapRef: { name: `${ns}-config` } }],
                  resources: {
                    requests: { cpu: '100m', memory: '128Mi' },
                    limits: { cpu: '500m', memory: '512Mi' },
                  },
                  livenessProbe: {
                    httpGet: { path: '/health', port: appPort },
                    initialDelaySeconds: 15,
                    periodSeconds: 20,
                  },
                  readinessProbe: {
                    httpGet: { path: '/ready', port: appPort },
                    initialDelaySeconds: 5,
                    periodSeconds: 10,
                  },
                },
              ],
            },
          },
        },
      }),
      language: 'yaml',
    });

    // Service
    files.push({
      relativePath: `generated/k8s/${domainSlug}-service.yaml`,
      content: stringify({
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: domainSlug,
          namespace: ns,
          labels,
        },
        spec: {
          type: 'ClusterIP',
          selector: { app: domainSlug },
          ports: [
            { port: 80, targetPort: appPort, protocol: 'TCP' },
          ],
        },
      }),
      language: 'yaml',
    });
  }

  return files;
};
