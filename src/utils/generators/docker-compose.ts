import { stringify } from 'yaml';
import type { GeneratorInput, GeneratedFile, GeneratorFunction } from '../../types/generator';

export const generateDockerCompose: GeneratorFunction = (input: GeneratorInput): GeneratedFile[] => {
  const ts = input.techStack;
  const lang = ts.language.toLowerCase();
  const db = ts.database.toLowerCase();

  // Determine app port
  const appPort = (lang === 'python') ? '8000' :
    (lang === 'go' || lang === 'rust' || lang === 'java') ? '8080' : '3000';

  const services: Record<string, unknown> = {};
  const volumes: Record<string, unknown> = {};

  // App service
  const appEnv: Record<string, string> = {
    NODE_ENV: 'production',
  };

  if (db === 'postgres' || db === 'postgresql') {
    appEnv.DATABASE_URL = 'postgresql://app:app_password@db:5432/app_db';
  } else if (db === 'mysql') {
    appEnv.DATABASE_URL = 'mysql://app:app_password@db:3306/app_db';
  } else if (db === 'mongodb' || db === 'mongo') {
    appEnv.DATABASE_URL = 'mongodb://app:app_password@db:27017/app_db';
  }

  if (ts.cache === 'redis') {
    appEnv.REDIS_URL = 'redis://cache:6379';
  }

  const appDependsOn: string[] = [];
  if (db) appDependsOn.push('db');
  if (ts.cache === 'redis') appDependsOn.push('cache');

  services.app = {
    build: { context: '.', dockerfile: 'generated/Dockerfile' },
    ports: [`${appPort}:${appPort}`],
    environment: appEnv,
    ...(appDependsOn.length > 0 ? { depends_on: appDependsOn } : {}),
    networks: ['app-network'],
    restart: 'unless-stopped',
  };

  // Database service
  if (db === 'postgres' || db === 'postgresql') {
    services.db = {
      image: 'postgres:16-alpine',
      environment: {
        POSTGRES_USER: 'app',
        POSTGRES_PASSWORD: 'app_password',
        POSTGRES_DB: 'app_db',
      },
      volumes: ['db-data:/var/lib/postgresql/data'],
      ports: ['5432:5432'],
      networks: ['app-network'],
      restart: 'unless-stopped',
    };
    volumes['db-data'] = { driver: 'local' };
  } else if (db === 'mysql') {
    services.db = {
      image: 'mysql:8.0',
      environment: {
        MYSQL_ROOT_PASSWORD: 'root_password',
        MYSQL_USER: 'app',
        MYSQL_PASSWORD: 'app_password',
        MYSQL_DATABASE: 'app_db',
      },
      volumes: ['db-data:/var/lib/mysql'],
      ports: ['3306:3306'],
      networks: ['app-network'],
      restart: 'unless-stopped',
    };
    volumes['db-data'] = { driver: 'local' };
  } else if (db === 'mongodb' || db === 'mongo') {
    services.db = {
      image: 'mongo:7',
      environment: {
        MONGO_INITDB_ROOT_USERNAME: 'app',
        MONGO_INITDB_ROOT_PASSWORD: 'app_password',
        MONGO_INITDB_DATABASE: 'app_db',
      },
      volumes: ['db-data:/data/db'],
      ports: ['27017:27017'],
      networks: ['app-network'],
      restart: 'unless-stopped',
    };
    volumes['db-data'] = { driver: 'local' };
  }

  // Cache service
  if (ts.cache === 'redis') {
    services.cache = {
      image: 'redis:7-alpine',
      ports: ['6379:6379'],
      volumes: ['cache-data:/data'],
      networks: ['app-network'],
      restart: 'unless-stopped',
    };
    volumes['cache-data'] = { driver: 'local' };
  }

  const doc: Record<string, unknown> = {
    services,
    networks: {
      'app-network': { driver: 'bridge' },
    },
  };

  if (Object.keys(volumes).length > 0) {
    doc.volumes = volumes;
  }

  return [
    {
      relativePath: 'generated/docker-compose.yaml',
      content: stringify(doc, { lineWidth: 0 }),
      language: 'yaml',
    },
  ];
};
