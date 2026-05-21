import { Weapon, RarityType } from "../types/game";

export const RARITY_COLORS: Record<RarityType, string> = {
  common: "#aaaaaa",
  uncommon: "#2ecc71",
  rare: "#3498db",
  epic: "#9b59b6",
  legendary: "#f39c12",
};

export const RARITY_BG: Record<RarityType, string> = {
  common: "#555555",
  uncommon: "#1a5c30",
  rare: "#1a3b6b",
  epic: "#4a1a7a",
  legendary: "#7a4a00",
};

export const WEAPONS: Record<string, Weapon> = {
  AR: {
    type: "AR", name: "Assault Rifle", damage: 22, fireRate: 110,
    ammo: 30, maxAmmo: 30, reloadTime: 1800, range: 80,
    color: "#4a7a40", rarity: "common", spread: 0.04,
  },
  AR_RARE: {
    type: "AR", name: "Assault Rifle", damage: 30, fireRate: 100,
    ammo: 30, maxAmmo: 30, reloadTime: 1600, range: 85,
    color: "#3498db", rarity: "rare", spread: 0.03,
  },
  Shotgun: {
    type: "Shotgun", name: "Pump Shotgun", damage: 70, fireRate: 800,
    ammo: 5, maxAmmo: 5, reloadTime: 2800, range: 18,
    color: "#8b4513", rarity: "uncommon", spread: 0.12, pellets: 9,
  },
  Shotgun_EPIC: {
    type: "Shotgun", name: "Tactical Shotgun", damage: 55, fireRate: 550,
    ammo: 8, maxAmmo: 8, reloadTime: 2200, range: 22,
    color: "#9b59b6", rarity: "epic", spread: 0.1, pellets: 9,
  },
  Sniper: {
    type: "Sniper", name: "Bolt Sniper Rifle", damage: 105, fireRate: 1800,
    ammo: 4, maxAmmo: 4, reloadTime: 3500, range: 300,
    color: "#2f4f4f", rarity: "rare", spread: 0.005,
  },
  Sniper_LEGENDARY: {
    type: "Sniper", name: "Heavy Sniper", damage: 150, fireRate: 2200,
    ammo: 3, maxAmmo: 3, reloadTime: 4000, range: 400,
    color: "#f39c12", rarity: "legendary", spread: 0.002,
  },
  SMG: {
    type: "SMG", name: "SMG", damage: 14, fireRate: 75,
    ammo: 35, maxAmmo: 35, reloadTime: 1500, range: 40,
    color: "#666", rarity: "common", spread: 0.07,
  },
  SMG_UNCOMMON: {
    type: "SMG", name: "Combat SMG", damage: 17, fireRate: 65,
    ammo: 40, maxAmmo: 40, reloadTime: 1400, range: 45,
    color: "#2ecc71", rarity: "uncommon", spread: 0.06,
  },
  Pistol: {
    type: "Pistol", name: "Pistol", damage: 30, fireRate: 450,
    ammo: 10, maxAmmo: 10, reloadTime: 1200, range: 50,
    color: "#b8860b", rarity: "common", spread: 0.05,
  },
  RPG: {
    type: "RPG", name: "Rocket Launcher", damage: 200, fireRate: 3000,
    ammo: 1, maxAmmo: 1, reloadTime: 5000, range: 200,
    color: "#f39c12", rarity: "legendary", spread: 0.01,
  },
  Pickaxe: {
    type: "Pickaxe", name: "Harvesting Tool", damage: 20, fireRate: 600,
    ammo: 999, maxAmmo: 999, reloadTime: 0, range: 3,
    color: "#cccccc", rarity: "common",
  },
};

export const STARTING_WEAPONS: Weapon[] = [
  { ...WEAPONS.Pickaxe },
  { ...WEAPONS.AR },
  null as unknown as Weapon,
  null as unknown as Weapon,
  null as unknown as Weapon,
];

export const LOOT_TABLE: { weapon: Weapon; weight: number }[] = [
  { weapon: WEAPONS.Pistol, weight: 30 },
  { weapon: WEAPONS.AR, weight: 25 },
  { weapon: WEAPONS.SMG, weight: 20 },
  { weapon: WEAPONS.SMG_UNCOMMON, weight: 15 },
  { weapon: WEAPONS.AR_RARE, weight: 12 },
  { weapon: WEAPONS.Shotgun, weight: 10 },
  { weapon: WEAPONS.Shotgun_EPIC, weight: 6 },
  { weapon: WEAPONS.Sniper, weight: 5 },
  { weapon: WEAPONS.Sniper_LEGENDARY, weight: 2 },
  { weapon: WEAPONS.RPG, weight: 1 },
];

export function randomLoot(): Weapon {
  const totalWeight = LOOT_TABLE.reduce((s, l) => s + l.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const entry of LOOT_TABLE) {
    rand -= entry.weight;
    if (rand <= 0) return { ...entry.weapon };
  }
  return { ...WEAPONS.AR };
}
