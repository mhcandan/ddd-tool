import type { GeneratorInput, GeneratedFile, GeneratorFunction, TechStackInfo } from '../../types/generator';

function buildDockerfile(ts: TechStackInfo, projectName: string): string {
  const lang = ts.language.toLowerCase();
  const ver = ts.languageVersion;
  const fw = ts.framework.toLowerCase();

  if (lang === 'typescript' || lang === 'javascript') {
    const useYarn = fw === 'next' || fw === 'nextjs';
    const installCmd = useYarn ? 'yarn install --frozen-lockfile' : 'npm ci';
    const buildCmd = useYarn ? 'yarn build' : 'npm run build';
    const startCmd = useYarn ? 'yarn start' : 'node dist/index.js';

    return `# Build stage
FROM node:${ver}-alpine AS builder
WORKDIR /app
COPY package*.json ${useYarn ? 'yarn.lock ' : ''}./
RUN ${installCmd}
COPY . .
RUN ${buildCmd}

# Production stage
FROM node:${ver}-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER node
CMD ["${startCmd.split(' ')[0]}", ${startCmd.split(' ').slice(1).map(s => `"${s}"`).join(', ')}]
`;
  }

  if (lang === 'python') {
    return `FROM python:${ver}-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
USER nobody
CMD ["python", "-m", "${fw === 'fastapi' ? 'uvicorn' : fw}", "${fw === 'fastapi' ? 'app.main:app' : 'app'}"${fw === 'fastapi' ? ', "--host", "0.0.0.0", "--port", "8000"' : ''}]
`;
  }

  if (lang === 'go') {
    return `# Build stage
FROM golang:${ver}-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /${projectName} .

# Production stage
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /${projectName} .
EXPOSE 8080
USER nobody
CMD ["./${projectName}"]
`;
  }

  if (lang === 'rust') {
    return `# Build stage
FROM rust:${ver}-slim AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm -rf src
COPY . .
RUN cargo build --release

# Production stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/${projectName} .
EXPOSE 8080
USER nobody
CMD ["./${projectName}"]
`;
  }

  if (lang === 'java') {
    const buildTool = fw === 'spring' || fw === 'spring-boot' ? 'gradle' : 'maven';
    if (buildTool === 'gradle') {
      return `# Build stage
FROM eclipse-temurin:${ver}-jdk AS builder
WORKDIR /app
COPY build.gradle* settings.gradle* gradlew* ./
COPY gradle ./gradle
RUN ./gradlew dependencies --no-daemon || true
COPY . .
RUN ./gradlew bootJar --no-daemon

# Production stage
FROM eclipse-temurin:${ver}-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
USER nobody
CMD ["java", "-jar", "app.jar"]
`;
    }
    return `# Build stage
FROM eclipse-temurin:${ver}-jdk AS builder
WORKDIR /app
COPY pom.xml mvnw* ./
COPY .mvn ./.mvn
RUN ./mvnw dependency:resolve -B || true
COPY . .
RUN ./mvnw package -DskipTests -B

# Production stage
FROM eclipse-temurin:${ver}-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
USER nobody
CMD ["java", "-jar", "app.jar"]
`;
  }

  // Fallback
  return `FROM ubuntu:22.04
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["echo", "Configure your Dockerfile for ${lang}"]
`;
}

function buildDockerignore(): string {
  return `node_modules
.git
.gitignore
*.md
.env
.env.*
dist
build
target
__pycache__
.pytest_cache
.mypy_cache
*.pyc
.DS_Store
specs/
generated/
.ddd/
`;
}

export const generateDockerfile: GeneratorFunction = (input: GeneratorInput): GeneratedFile[] => {
  return [
    {
      relativePath: 'generated/Dockerfile',
      content: buildDockerfile(input.techStack, input.projectName),
      language: 'dockerfile',
    },
    {
      relativePath: 'generated/.dockerignore',
      content: buildDockerignore(),
      language: 'text',
    },
  ];
};
