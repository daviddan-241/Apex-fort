# Apex Fort

A browser-based 3D battle royale game built with React Three Fiber. 30 players, shrinking storm, building system, weapons with rarity tiers, 8 selectable characters, and full Fortnite-inspired HUD.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game: React + Vite + @react-three/fiber + @react-three/drei + Three.js + Zustand
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/3d-game/src/` — game source
  - `types/game.ts` — all TypeScript types
  - `store/gameStore.ts` — Zustand game state
  - `data/characters.ts` — 8 playable characters
  - `data/weapons.ts` — all weapons + rarity system + loot table
  - `components/game/` — 3D scene components (Player, Bots, Terrain, Storm, LootItems, BuildingSystem, Bullets)
  - `components/ui/` — HUD, Minimap, MainMenu, CharacterSelect, VictoryScreen

## Render Deployment

Apex Fort is a **static SPA** (no server needed). Deploy on Render as a **Static Site**:

| Setting | Value |
|---|---|
| **Root Directory** | `artifacts/3d-game` |
| **Build Command** | `npm install -g pnpm && pnpm install && pnpm run build` |
| **Publish Directory** | `dist/public` |
| **Node Version** | 20 or 22 |

> Or use the monorepo root with:
> - **Build Command**: `npm install -g pnpm && pnpm install && pnpm --filter @workspace/3d-game run build`
> - **Publish Directory**: `artifacts/3d-game/dist/public`

No environment variables required for the frontend game.

## Architecture decisions

- Pure frontend game — no backend required, all state is client-side Zustand
- Storm uses phase-based shrink like Fortnite (7 phases with wait intervals)
- Weapon rarity weighted random table (common→legendary)
- Bots use a 3-state machine: wandering → chasing → shooting
- Buildings snap to a 2-unit grid, costs materials (wood/stone/metal)
- Terrain height uses bilinear interpolation from a 48×48 noise grid

## Product

30-player browser battle royale with:
- 8 unique characters (Soldier, Ninja, Cyber, Warrior, Ghost, Hero, Assassin, Thief)
- 10 weapon variants across 5 types (AR, Shotgun, Sniper, SMG, Pistol, RPG)
- 5 rarity tiers: Common → Uncommon → Rare → Epic → Legendary
- Building system: Wall, Floor, Ramp, Roof, Stair (costs wood/stone/metal)
- Named POIs: Tilted Towers, Loot Lake, Retail Row, Pleasant Park, Dusty Depot, Fatal Fields, Salty Springs, Snobby Shores
- Supply chests that drop epic/legendary loot
- Fortnite-style HUD: Minimap, Compass, Weapon bar, Materials counter, Kill feed, Damage numbers
- Storm with 7 shrink phases
- Kill feed, XP/Level system, Victory Royale screen

## User preferences

- Game should look and feel like Fortnite — detailed POIs, rarity colors, minimap, weapon bar
- Push updates to GitHub: https://github.com/daviddan-241/Apex-fort

## Gotchas

- Do NOT use `Math.clamp` — it doesn't exist in TypeScript/browser JS, use `Math.min(Math.max(...), ...)`
- Three.js `ellipseGeometry` doesn't exist in R3F — use `circleGeometry` with `scale` instead
- Building `newPiece` ref needs `material: MaterialType` field now (not just position/type)
- `JSX.Element` namespace needs `React.ReactElement` for standalone function return types
- `require()` is not available in ESM — dynamic imports needed for chest loot (or restructure imports)
- Always run `pnpm run typecheck` before pushing

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
