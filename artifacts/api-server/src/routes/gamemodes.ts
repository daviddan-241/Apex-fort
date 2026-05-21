import { Router, type IRouter } from "express";
import { ListGameModesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const gameModes = [
  {
    id: "battle-royale-solo",
    name: "Battle Royale — Solo",
    description: "The classic mode. Drop alone on a massive map with up to 99 AI opponents and bot-fill players. Survive the shrinking storm, loot, build, and be the last operator standing.",
    playerCount: "1 (vs 99 bots/players)",
    features: [
      "Full storm circle simulation",
      "Complete loot ecosystem (floor loot, chests, supply drops, mythic spawns)",
      "All character abilities active",
      "Full building and destruction systems",
      "Realistic ballistics and weapon handling",
      "Intel-based AI bot opponents with scalable difficulty",
      "Kill feed and match statistics",
      "Victory Royale cinematic sequence"
    ],
    mapSize: "Large (8x8km)",
    isMultiplayer: false,
    hasBuilding: true
  },
  {
    id: "battle-royale-squads",
    name: "Battle Royale — Squads",
    description: "Team up in squads of 4 against other squads. One revive per teammate. Communication and ability synergy separate the good squads from the dominant ones.",
    playerCount: "4 vs 96 (bots/local)",
    features: [
      "4-player squad coordination",
      "Revive and respawn system",
      "Squad ping system for communication",
      "Shared minimap intelligence from Recon operators",
      "Squad supply drops",
      "Combined ability synergies",
      "Local co-op or bot fill"
    ],
    mapSize: "Large (8x8km)",
    isMultiplayer: true,
    hasBuilding: true
  },
  {
    id: "zero-build",
    name: "Zero Build",
    description: "Pure gunplay. No building allowed — only movement, cover, and combat skill. A brutal test of raw aim and positioning. Overshields replace building as the armor mechanic.",
    playerCount: "1–4 (solo/squads)",
    features: [
      "No building or editing",
      "Overshield system (150 HP shield)",
      "Tactical movement emphasis (sprint, slide, mantle)",
      "Natural terrain and destructible cover",
      "Enhanced vehicle utility",
      "All weapon types available",
      "Faster storm pace"
    ],
    mapSize: "Large (8x8km)",
    isMultiplayer: true,
    hasBuilding: false
  },
  {
    id: "arena-1v1",
    name: "1v1 Arena",
    description: "Settle it in a controlled arena. Pure mechanical skill — equal loot, equal spawns, equal footing. Rounds are fast and decisive. Best of 5.",
    playerCount: "1 vs 1",
    features: [
      "Equal preset loadouts available",
      "Custom loot drop settings",
      "Best of 5 round format",
      "Building enabled (optional)",
      "Full ability usage",
      "Timed rounds (3 minutes)",
      "Instant respawn between rounds",
      "Detailed post-match stat breakdown"
    ],
    mapSize: "Small Arena (500m)",
    isMultiplayer: true,
    hasBuilding: true
  },
  {
    id: "reload-mode",
    name: "Reload Mode",
    description: "Respawn-enabled Battle Royale. You come back after each elimination until a final zone closes respawning. Last squad with lives remaining wins. Fast, chaotic, addictive.",
    playerCount: "Up to 4 per squad, multiple squads",
    features: [
      "3 respawns per player",
      "Faster storm pace",
      "Reduced loot time",
      "Respawn beacons on the map",
      "Teammate respawn cards",
      "Escalating storm damage",
      "Final zone: no respawns"
    ],
    mapSize: "Medium (5x5km)",
    isMultiplayer: true,
    hasBuilding: true
  },
  {
    id: "team-deathmatch",
    name: "Team Deathmatch",
    description: "Two teams fight for eliminations. First team to 50 kills wins. Infinite respawns, preset loadouts, controlled map zones. Pure team combat with ability synergies.",
    playerCount: "2–8 players (1v1 to 4v4)",
    features: [
      "Infinite respawn",
      "First to 50 eliminations wins",
      "Preset loadout selection",
      "Role-based team composition bonus",
      "Ability cooldown reductions",
      "10-minute time limit (score-based tiebreak)",
      "Local split-screen support"
    ],
    mapSize: "Small-Medium Arena (1x1km)",
    isMultiplayer: true,
    hasBuilding: false
  },
  {
    id: "pve-missions",
    name: "PvE Story Missions",
    description: "Narrative-driven single-player or co-op missions set in the APEX FORT universe. Infiltrate enemy compounds, rescue operatives, destroy objectives. Each mission reveals lore fragments.",
    playerCount: "1–2 players + AI allies",
    features: [
      "Narrative cutscenes and voice acting",
      "Objective-based mission structure",
      "AI ally squad support",
      "Unique mission-specific enemy types",
      "Lore collectibles and intel documents",
      "Difficulty scaling (Recruit to Legendary)",
      "Unique mission rewards (exclusive cosmetics)",
      "Replay for higher scores and challenges"
    ],
    mapSize: "Variable per mission",
    isMultiplayer: true,
    hasBuilding: false
  },
  {
    id: "custom-skirmish",
    name: "Custom Skirmish",
    description: "Full sandbox control. Create custom matches with configurable player counts, loot tables, ability rules, storm settings, time of day, weather, and map zones.",
    playerCount: "1 to 100 (configurable)",
    features: [
      "Full rule customization",
      "Custom loot table configuration",
      "Ability enable/disable per character",
      "Storm circle control (speed, size, damage)",
      "Time of day and weather selection",
      "Custom POI loading",
      "Vehicle enable/disable",
      "Friendly fire toggle",
      "Recording and replay system"
    ],
    mapSize: "Full map or custom zone",
    isMultiplayer: true,
    hasBuilding: true
  }
];

router.get("/gamemodes", async (_req, res): Promise<void> => {
  res.json(ListGameModesResponse.parse(gameModes));
});

export default router;
