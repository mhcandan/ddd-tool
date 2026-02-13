# DDD Tool — Development Context

## Spec Reference
- Full specification: ~/code/DDD/ddd-specification-complete.md
- Implementation guide: ~/code/DDD/ddd-implementation-guide.md
- Templates: ~/code/DDD/templates/

## Tech Stack
- **Framework:** Tauri 2.0 (Rust backend, React frontend)
- **Canvas:** React Flow
- **State:** Zustand
- **UI:** Tailwind CSS + Radix UI
- **Git:** libgit2 (via git2 crate in Rust)

## Implementation Status

### Built
_(nothing yet — Session 1 starts the scaffold)_

### Session Plan
1. Project scaffold + App Shell (launcher, routing)
2. System Map (L1) with domain blocks
3. Domain Map (L2) + navigation
4. Flow Canvas (L3) + basic nodes
5. Connections + spec panel
6. YAML save/load + Git
7. Agent nodes + agent canvas
8. Orchestration nodes
9. LLM Design Assistant (chat + ghost preview)
10. Project Memory
11. Validation system
12. Claude Code integration (PTY + prompt builder)
13. Test runner + test generation
14. Reconciliation + drift detection
15. Production generators (OpenAPI, CI/CD, Docker)
16. Settings, first-run, polish

## Stores
| Store | File | Owns |
|-------|------|------|
| sheet | src/stores/sheet-store.ts | navigation, breadcrumbs, current level |
| flow | src/stores/flow-store.ts | current flow nodes/connections |
| project | src/stores/project-store.ts | domains, schemas, configs |
| ui | src/stores/ui-store.ts | selection, panel visibility |
| git | src/stores/git-store.ts | git state |
| llm | src/stores/llm-store.ts | chat, ghost nodes, LLM config |
| memory | src/stores/memory-store.ts | project memory layers |
| implementation | src/stores/implementation-store.ts | PTY, queue, test results |
| app | src/stores/app-store.ts | app view, recent projects, settings |
| undo | src/stores/undo-store.ts | per-flow undo/redo stacks |
| validation | src/stores/validation-store.ts | validation results, gate state |

## Conventions
- All Tauri commands in `src-tauri/src/commands/`
- All types in `src/types/`
- All utilities in `src/utils/`
- Component folders match feature area (Canvas/, SpecPanel/, LLMAssistant/, etc.)
- Spec is source of truth — read from ~/code/DDD/ when needed

## Known Issues
_(none yet)_
