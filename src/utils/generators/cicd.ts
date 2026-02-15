import { stringify } from 'yaml';
import type { GeneratorInput, GeneratedFile, GeneratorFunction } from '../../types/generator';

export const generateCicd: GeneratorFunction = (input: GeneratorInput): GeneratedFile[] => {
  const lang = input.techStack.language.toLowerCase();
  const ver = input.techStack.languageVersion;
  const projectName = input.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const steps: Array<Record<string, unknown>> = [
    { uses: 'actions/checkout@v4' },
  ];

  // Language-specific setup
  if (lang === 'typescript' || lang === 'javascript') {
    steps.push({
      name: 'Setup Node.js',
      uses: 'actions/setup-node@v4',
      with: { 'node-version': ver },
    });
    steps.push({ name: 'Install dependencies', run: 'npm ci' });
    steps.push({ name: 'Lint', run: 'npm run lint --if-present' });
    steps.push({ name: 'Test', run: 'npm test --if-present' });
    steps.push({ name: 'Build', run: 'npm run build' });
  } else if (lang === 'python') {
    steps.push({
      name: 'Setup Python',
      uses: 'actions/setup-python@v5',
      with: { 'python-version': ver },
    });
    steps.push({ name: 'Install dependencies', run: 'pip install -r requirements.txt' });
    steps.push({ name: 'Lint', run: 'pip install ruff && ruff check .' });
    steps.push({ name: 'Test', run: 'pytest' });
  } else if (lang === 'go') {
    steps.push({
      name: 'Setup Go',
      uses: 'actions/setup-go@v5',
      with: { 'go-version': ver },
    });
    steps.push({ name: 'Install dependencies', run: 'go mod download' });
    steps.push({ name: 'Lint', run: 'go vet ./...' });
    steps.push({ name: 'Test', run: 'go test ./...' });
    steps.push({ name: 'Build', run: 'go build ./...' });
  } else if (lang === 'rust') {
    steps.push({
      name: 'Setup Rust',
      uses: 'dtolnay/rust-toolchain@stable',
    });
    steps.push({ name: 'Cache', uses: 'Swatinem/rust-cache@v2' });
    steps.push({ name: 'Lint', run: 'cargo clippy -- -D warnings' });
    steps.push({ name: 'Test', run: 'cargo test' });
    steps.push({ name: 'Build', run: 'cargo build --release' });
  } else if (lang === 'java') {
    steps.push({
      name: 'Setup Java',
      uses: 'actions/setup-java@v4',
      with: { distribution: 'temurin', 'java-version': ver },
    });
    steps.push({ name: 'Build & Test', run: './gradlew build' });
  }

  // Docker build + push (only on main)
  steps.push({
    name: 'Build and push Docker image',
    if: "github.ref == 'refs/heads/main'",
    uses: 'docker/build-push-action@v5',
    with: {
      context: '.',
      file: 'generated/Dockerfile',
      push: false,
      tags: `${projectName}:$\{{ github.sha }}`,
    },
  });

  const workflow = {
    name: 'CI',
    on: {
      push: { branches: ['main'] },
      pull_request: { branches: ['main'] },
    },
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        steps,
      },
    },
  };

  return [
    {
      relativePath: 'generated/.github/workflows/ci.yaml',
      content: stringify(workflow, { lineWidth: 0 }),
      language: 'yaml',
    },
  ];
};
