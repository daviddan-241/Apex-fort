import { Router, type IRouter } from "express";
import { ListWeaponsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const weapons = [
  {
    id: "kraken-ar",
    name: "KRAKEN AR-X",
    type: "Assault Rifle",
    rarity: "Legendary",
    damage: 38,
    fireRate: 5.5,
    reloadTime: 2.4,
    magazineSize: 30,
    description: "A custom military-spec assault rifle with magnetic rail-assist barrel. Engineered for unparalleled accuracy at medium-to-long range. Used by Tier 1 operators worldwide.",
    attachments: ["Extended Mag (40)", "Holographic Scope", "Foregrip", "Muzzle Brake", "Laser Sight", "Underbarrel Grenade Launcher"]
  },
  {
    id: "phantom-smg",
    name: "PHANTOM SMG",
    type: "SMG",
    rarity: "Epic",
    damage: 24,
    fireRate: 11.0,
    reloadTime: 1.8,
    magazineSize: 35,
    description: "Compact, aggressive, and devastating at close range. The Phantom was designed for indoor room-clearing operations where fire rate dominates.",
    attachments: ["Extended Mag (50)", "Red Dot Sight", "Suppressor", "Vertical Grip", "Rapid Fire Mod"]
  },
  {
    id: "colossus-lmg",
    name: "COLOSSUS LMG",
    type: "LMG",
    rarity: "Epic",
    damage: 45,
    fireRate: 8.0,
    reloadTime: 4.5,
    magazineSize: 100,
    description: "A sustained-fire powerhouse that destroys structures and suppresses entire squads. Ironclad's weapon of choice for area denial operations.",
    attachments: ["Extended Drum (150)", "Bipod", "Thermal Scope", "Muzzle Dampener"]
  },
  {
    id: "specter-sniper",
    name: "SPECTER SR-1",
    type: "Sniper Rifle",
    rarity: "Legendary",
    damage: 145,
    fireRate: 0.9,
    reloadTime: 3.2,
    magazineSize: 5,
    description: "A precision anti-materiel rifle capable of penetrating light armor and disabling vehicles. One shot to the chest drops an unshielded target. One shot to the head is guaranteed elimination.",
    attachments: ["8x Scope", "Suppressor", "Bipod", "Extended Mag (8)", "Match-Grade Ammo"]
  },
  {
    id: "nova-shotgun",
    name: "NOVA-9 SHOTGUN",
    type: "Shotgun",
    rarity: "Rare",
    damage: 110,
    fireRate: 1.2,
    reloadTime: 0.6,
    magazineSize: 6,
    description: "Pump-action devastation at close range. Each shell fires nine pellets with realistic spread modeling. A point-blank hit ends most engagements instantly.",
    attachments: ["Choke (Tight Spread)", "Extended Tube (8)", "Pistol Grip", "Reflex Sight"]
  },
  {
    id: "viper-pistol",
    name: "VIPER COMPACT",
    type: "Pistol",
    rarity: "Common",
    damage: 22,
    fireRate: 4.5,
    reloadTime: 1.4,
    magazineSize: 15,
    description: "A reliable semi-automatic sidearm. Surprisingly accurate at medium range for a pistol. Every operator carries one as last-resort backup.",
    attachments: ["Suppressor", "Extended Mag (20)", "Laser Sight", "Compensator"]
  },
  {
    id: "warblade-melee",
    name: "WARBLADE MACHETE",
    type: "Melee",
    rarity: "Epic",
    damage: 85,
    fireRate: 1.8,
    reloadTime: 0.0,
    magazineSize: 0,
    description: "A custom-forged tactical machete with serrated edge. Silent, brutal, and effective. One-hit down when attacking from stealth. Stagger enemies on block-break.",
    attachments: []
  },
  {
    id: "hellfire-rpg",
    name: "HELLFIRE RPG",
    type: "Explosive",
    rarity: "Mythic",
    damage: 300,
    fireRate: 0.5,
    reloadTime: 5.0,
    magazineSize: 1,
    description: "A mythic-tier shoulder-fired rocket with smart guidance system. Rockets track targets for the first 2 seconds of flight. Direct hit is a guaranteed instant elimination. Chaos Physics destruction radius: 10m.",
    attachments: ["Smart Guidance System", "Tandem Warhead (Anti-Armor)", "Dual Warhead Pack"]
  },
  {
    id: "stryker-ar",
    name: "STRYKER AR-5",
    type: "Assault Rifle",
    rarity: "Rare",
    damage: 32,
    fireRate: 6.2,
    reloadTime: 2.6,
    magazineSize: 30,
    description: "A workhorse assault rifle built for reliability in all conditions. Accurate burst-fire mode for longer engagements. Standard issue in most military loadouts.",
    attachments: ["ACOG Scope", "Grip Tape", "Extended Mag (40)", "Vertical Foregrip", "Suppressor"]
  },
  {
    id: "nova-smg",
    name: "NOVA RUSH SMG",
    type: "SMG",
    rarity: "Common",
    damage: 18,
    fireRate: 13.0,
    reloadTime: 1.6,
    magazineSize: 25,
    description: "Lightest SMG in the arsenal. Minimal recoil, maximum mobility. Ideal for aggressive players who sprint-shoot and prefer constant movement over static firefights.",
    attachments: ["Extended Mag (35)", "Reflex Sight", "Stock (Stability)", "Laser Sight"]
  }
];

router.get("/weapons", async (_req, res): Promise<void> => {
  res.json(ListWeaponsResponse.parse(weapons));
});

export default router;
