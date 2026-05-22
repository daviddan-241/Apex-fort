# AI Game Creator

A platform where users enter a game prompt (or upload reference files), and 10+ AI agents generate a complete Unreal Engine 5 project — C++ classes, Blueprints, levels, configs, UMG widgets — downloadable as a zip.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, routed at `/api`)
- `pnpm --filter @workspace/ai-game-creator run dev` — run the frontend (port 24116, routed at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `OPENAI_API_KEY` — OpenAI key for generation

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn/ui + Framer Motion (wouter routing)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (tables: projects, agent_logs, generated_files, uploaded_files)
- AI: OpenAI GPT-4o-mini for game planning, C++ code, blueprint generation, image analysis
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Zip packaging: adm-zip

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI spec
- `lib/db/src/schema/projects.ts` — all DB table definitions
- `artifacts/api-server/src/lib/ue5generator.ts` — UE5 project generation logic
- `artifacts/api-server/src/routes/projects.ts` — project CRUD + AI generation pipeline
- `artifacts/api-server/src/routes/files.ts` — file upload + AI analysis
- `artifacts/api-server/src/routes/agents.ts` — agent roster
- `artifacts/ai-game-creator/src/` — React frontend (pages: home, dashboard, /new, /studio/:id)

## Architecture decisions

- Generation pipeline runs async (fire-and-forget after POST /generate) so the HTTP response returns immediately; frontend polls for progress
- OpenAI client lives at `artifacts/api-server/src/lib/openai.ts` (NOT the workspace integration — user provided own key)
- Generated file content is stored in PostgreSQL (text column) and packaged into zip on download
- 10 specialized agents are defined in code with distinct colors and roles; logs are tagged per-agent for colored real-time display
- File uploads stored on disk at `<cwd>/uploads/`, metadata in DB

## Product

- **Home page**: hero with prompt input, genre presets, stats, agent showcase
- **New Project**: full form with game options, platform selector, file upload
- **Dashboard**: project grid with status badges, progress bars, genre tags
- **Studio**: live agent log feed, progress ring, file tree, upload panel, AI analysis, download ZIP

## User preferences

- Uses own `OPENAI_API_KEY` (not Replit AI integration — phone verification was required)

## Gotchas

- Always run `pnpm --filter @workspace/db run push` after schema changes
- After codegen, run `pnpm run typecheck:libs` to rebuild composite lib declarations before typechecking leaf packages
- The `adm-zip` dynamic import in `files.ts` is intentional — needed for zip reading during file analysis
- Download endpoint streams raw zip bytes — frontend uses `window.open('/api/projects/:id/download')` rather than the generated hook

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
