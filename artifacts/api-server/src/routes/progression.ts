import { Router, type IRouter } from "express";
import { GetProgressionResponse, GetStatsOverviewResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const progressionData = {
  levels: 500,
  battlePassTiers: 100,
  cosmetics: {
    skins: 120,
    emotes: 85,
    pickaxes: 60,
    backblings: 75,
    loadingScreens: 40
  },
  currencies: [
    {
      name: "Apex Credits",
      description: "Primary offline currency earned through gameplay. Used for cosmetic unlocks in the offline Item Shop.",
      earnedBy: [
        "Match placement (1st: 500, Top 5: 200, Top 10: 100)",
        "Eliminations (25 credits each)",
        "Daily challenges (100-500 credits)",
        "Weekly challenges (500-2000 credits)",
        "Battle Pass tier completion (50 credits bonus per tier)",
        "PvE mission completion (200-1000 credits)"
      ]
    },
    {
      name: "XP",
      description: "Experience points that drive level progression and Battle Pass tier advancement.",
      earnedBy: [
        "Match survival time (1 XP per second alive)",
        "Eliminations (250 XP each)",
        "Placement bonuses (5000 XP for Victory Royale)",
        "Harvesting resources (5 XP per material unit)",
        "Reviving teammates (500 XP)",
        "Daily bonus (2500 XP first match of day)",
        "Challenge completion (500-5000 XP per challenge)"
      ]
    },
    {
      name: "Prestige Tokens",
      description: "Rare currency awarded for exceptional performance and seasonal achievements. Unlocks exclusive Prestige-tier cosmetics.",
      earnedBy: [
        "Victory Royale (1 token guaranteed)",
        "20+ elimination match (2 tokens)",
        "Season completion at level 100+ (10 tokens)",
        "Ranked mode peak placement (1-5 tokens)",
        "Challenge completion milestones (every 10 challenges: 1 token)"
      ]
    },
    {
      name: "Mythic Shards",
      description: "Ultra-rare currency for crafting or purchasing Mythic-tier items. Earned through exceptional gameplay feats.",
      earnedBy: [
        "Solo Victory Royale with 10+ eliminations (1 shard)",
        "Perfect match (Victory + zero deaths + 15+ elims): 3 shards",
        "Seasonal milestone completions",
        "PvE mission on Legendary difficulty (1 shard)"
      ]
    }
  ],
  unlockMethods: [
    "Battle Pass tier progression (earn XP from matches)",
    "Purchase with Apex Credits in offline Item Shop",
    "Complete daily/weekly/seasonal challenges",
    "PvE mission rewards (unique cosmetics per mission)",
    "Level milestone rewards (every 10, 25, 50, 100 levels)",
    "Win streak rewards (consecutive Victory Royales)",
    "Achievement system unlocks (over 200 achievements)",
    "Prestige system: reset level for exclusive prestige cosmetics",
    "Community challenges: unlock items by hitting server-wide milestones"
  ]
};

const statsOverview = {
  totalCharacters: 8,
  totalWeapons: 10,
  totalGameModes: 8,
  totalSystems: 7,
  totalBiomes: 6,
  totalPOIs: 24
};

router.get("/progression", async (_req, res): Promise<void> => {
  res.json(GetProgressionResponse.parse(progressionData));
});

router.get("/stats/overview", async (_req, res): Promise<void> => {
  res.json(GetStatsOverviewResponse.parse(statsOverview));
});

export default router;
