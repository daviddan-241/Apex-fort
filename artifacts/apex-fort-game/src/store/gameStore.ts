import { create } from "zustand";

export type GamePhase = "MENU" | "CHARACTER_SELECT" | "PLAYING" | "VICTORY" | "DEFEAT";
export type BuildPiece = "WALL" | "FLOOR" | "RAMP";
export type BuildMaterial = "WOOD" | "STONE" | "METAL";

export interface WeaponSlot {
  id: string;
  name: string;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  damage: number;
  fireRate: number;
  rarity: string;
  type: string;
  isReloading: boolean;
}

export interface BotState {
  id: string;
  position: [number, number, number];
  hp: number;
  shield: number;
  isDead: boolean;
  state: "LOOTING" | "MOVING" | "ENGAGING" | "FLEEING";
  name: string;
  kills: number;
}

export interface LootItem {
  id: string;
  position: [number, number, number];
  weaponId: string;
  name: string;
  rarity: string;
  type: string;
  collected: boolean;
}

export interface BuildingPiece {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  type: BuildPiece;
  material: BuildMaterial;
  hp: number;
  maxHp: number;
}

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  time: number;
}

export interface GameState {
  phase: GamePhase;
  selectedCharacter: string;
  selectedMode: string;

  // Player stats
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  playerMaxShield: number;
  playerArmor: number;
  playerPosition: [number, number, number];

  // Inventory
  weapons: WeaponSlot[];
  activeWeaponIndex: number;
  wood: number;
  stone: number;
  metal: number;
  medkits: number;
  shields: number;

  // Build mode
  buildMode: boolean;
  buildPiece: BuildPiece;
  buildMaterial: BuildMaterial;
  buildings: BuildingPiece[];

  // Storm
  stormRadius: number;
  stormTargetRadius: number;
  stormCenter: [number, number];
  stormPhase: number;
  stormTimeLeft: number;
  stormDamageActive: boolean;

  // Game entities
  bots: BotState[];
  loot: LootItem[];
  killFeed: KillFeedEntry[];

  // Stats
  kills: number;
  matchStartTime: number;
  matchEndTime: number;
  shotsFired: number;
  shotsHit: number;
  damageDealt: number;

  // Actions
  setPhase: (phase: GamePhase) => void;
  selectCharacter: (id: string) => void;
  selectMode: (mode: string) => void;
  startGame: () => void;
  endGame: (victory: boolean) => void;
  resetGame: () => void;

  // Player actions
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addShield: (amount: number) => void;
  setPlayerPosition: (pos: [number, number, number]) => void;

  // Inventory actions
  pickupLoot: (lootId: string) => void;
  switchWeapon: (index: number) => void;
  shoot: () => boolean;
  reload: () => void;
  finishReload: () => void;
  addMaterials: (type: BuildMaterial, amount: number) => void;

  // Build actions
  toggleBuildMode: () => void;
  setBuildPiece: (piece: BuildPiece) => void;
  cycleBuildPiece: () => void;
  placeBuildingPiece: (pos: [number, number, number], rot: [number, number, number]) => void;
  damageBuildingPiece: (id: string, damage: number) => void;

  // Storm actions
  updateStorm: (dt: number) => void;

  // Bot actions
  updateBot: (id: string, updates: Partial<BotState>) => void;
  killBot: (id: string, weapon: string) => void;

  // Kill feed
  addKillFeedEntry: (killer: string, victim: string, weapon: string) => void;
  cleanKillFeed: () => void;

  // Stats
  recordShot: (hit: boolean) => void;
  recordDamage: (amount: number) => void;
}

const STORM_PHASES = [
  { radius: 250, targetRadius: 180, duration: 90, dps: 1 },
  { radius: 180, targetRadius: 120, duration: 75, dps: 3 },
  { radius: 120, targetRadius: 70,  duration: 60, dps: 8 },
  { radius: 70,  targetRadius: 35,  duration: 50, dps: 15 },
  { radius: 35,  targetRadius: 8,   duration: 40, dps: 30 },
];

const BOT_NAMES = [
  "ShadowHawk", "IronWolf", "NightRaider", "StormFox", "BlazeRunner",
  "CrimsonViper", "VoidWalker", "TitanBlade", "PhantomX", "GhostClaw",
  "NovaStar", "DarkEdge", "SteelSerpent", "CyberKnight", "ArcFury"
];

function generateBots(): BotState[] {
  return BOT_NAMES.map((name, i) => {
    const angle = (i / BOT_NAMES.length) * Math.PI * 2;
    const radius = 60 + Math.random() * 120;
    return {
      id: `bot-${i}`,
      position: [Math.cos(angle) * radius, 1, Math.sin(angle) * radius],
      hp: 80 + Math.random() * 20,
      shield: Math.random() > 0.5 ? 50 : 0,
      isDead: false,
      state: "LOOTING",
      name,
      kills: 0,
    };
  });
}

function generateLoot(): LootItem[] {
  const items: LootItem[] = [];
  const weaponPool = [
    { id: "kraken-ar", name: "KRAKEN AR-X", rarity: "Legendary", type: "Assault Rifle", damage: 38 },
    { id: "phantom-smg", name: "PHANTOM SMG", rarity: "Epic", type: "SMG", damage: 24 },
    { id: "nova-shotgun", name: "NOVA-9 SHOTGUN", rarity: "Rare", type: "Shotgun", damage: 110 },
    { id: "specter-sniper", name: "SPECTER SR-1", rarity: "Legendary", type: "Sniper Rifle", damage: 145 },
    { id: "stryker-ar", name: "STRYKER AR-5", rarity: "Rare", type: "Assault Rifle", damage: 32 },
    { id: "viper-pistol", name: "VIPER COMPACT", rarity: "Common", type: "Pistol", damage: 22 },
    { id: "nova-smg", name: "NOVA RUSH SMG", rarity: "Common", type: "SMG", damage: 18 },
  ];

  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 20 + Math.random() * 200;
    const weapon = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    items.push({
      id: `loot-${i}`,
      position: [Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius],
      weaponId: weapon.id,
      name: weapon.name,
      rarity: weapon.rarity,
      type: weapon.type,
      collected: false,
    });
  }
  return items;
}

const defaultWeapons: WeaponSlot[] = [
  {
    id: "viper-pistol",
    name: "VIPER COMPACT",
    ammo: 15,
    maxAmmo: 15,
    reserveAmmo: 90,
    damage: 22,
    fireRate: 4.5,
    rarity: "Common",
    type: "Pistol",
    isReloading: false,
  },
];

export const useGameStore = create<GameState>((set, get) => ({
  phase: "MENU",
  selectedCharacter: "wraith-blade",
  selectedMode: "battle-royale-solo",

  playerHp: 100,
  playerMaxHp: 100,
  playerShield: 0,
  playerMaxShield: 100,
  playerArmor: 0,
  playerPosition: [0, 1, 0],

  weapons: defaultWeapons,
  activeWeaponIndex: 0,
  wood: 100,
  stone: 50,
  metal: 30,
  medkits: 2,
  shields: 1,

  buildMode: false,
  buildPiece: "WALL",
  buildMaterial: "WOOD",
  buildings: [],

  stormRadius: STORM_PHASES[0].radius,
  stormTargetRadius: STORM_PHASES[0].targetRadius,
  stormCenter: [0, 0],
  stormPhase: 0,
  stormTimeLeft: STORM_PHASES[0].duration,
  stormDamageActive: false,

  bots: [],
  loot: [],
  killFeed: [],

  kills: 0,
  matchStartTime: 0,
  matchEndTime: 0,
  shotsFired: 0,
  shotsHit: 0,
  damageDealt: 0,

  setPhase: (phase) => set({ phase }),
  selectCharacter: (id) => set({ selectedCharacter: id }),
  selectMode: (mode) => set({ selectedMode: mode }),

  startGame: () => {
    set({
      phase: "PLAYING",
      playerHp: 100,
      playerShield: 0,
      playerArmor: 0,
      playerPosition: [0, 1, 0],
      weapons: [...defaultWeapons],
      activeWeaponIndex: 0,
      wood: 100,
      stone: 50,
      metal: 30,
      medkits: 2,
      shields: 1,
      buildMode: false,
      buildPiece: "WALL",
      buildings: [],
      stormRadius: STORM_PHASES[0].radius,
      stormTargetRadius: STORM_PHASES[0].targetRadius,
      stormCenter: [0, 0],
      stormPhase: 0,
      stormTimeLeft: STORM_PHASES[0].duration,
      stormDamageActive: false,
      bots: generateBots(),
      loot: generateLoot(),
      killFeed: [],
      kills: 0,
      matchStartTime: Date.now(),
      matchEndTime: 0,
      shotsFired: 0,
      shotsHit: 0,
      damageDealt: 0,
    });
  },

  endGame: (victory) => {
    set({ phase: victory ? "VICTORY" : "DEFEAT", matchEndTime: Date.now() });
  },

  resetGame: () => {
    set({ phase: "MENU" });
  },

  takeDamage: (amount) => {
    const { playerHp, playerShield, playerArmor } = get();
    let remaining = amount;
    let newArmor = playerArmor;
    let newShield = playerShield;
    let newHp = playerHp;

    // Armor absorbs 30%
    if (newArmor > 0) {
      const armorAbsorb = Math.min(newArmor, remaining * 0.3);
      newArmor -= armorAbsorb;
      remaining -= armorAbsorb;
    }
    // Shield absorbs first
    if (newShield > 0) {
      const shieldDmg = Math.min(newShield, remaining);
      newShield -= shieldDmg;
      remaining -= shieldDmg;
    }
    newHp = Math.max(0, newHp - remaining);

    set({ playerHp: newHp, playerShield: newShield, playerArmor: newArmor });

    if (newHp <= 0) {
      get().endGame(false);
    }
  },

  heal: (amount) => {
    const { playerHp, playerMaxHp } = get();
    set({ playerHp: Math.min(playerMaxHp, playerHp + amount) });
  },

  addShield: (amount) => {
    const { playerShield, playerMaxShield } = get();
    set({ playerShield: Math.min(playerMaxShield, playerShield + amount) });
  },

  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  pickupLoot: (lootId) => {
    const { loot, weapons } = get();
    const item = loot.find(l => l.id === lootId);
    if (!item || item.collected) return;

    const newWeapon: WeaponSlot = {
      id: item.weaponId,
      name: item.name,
      ammo: getMaxAmmo(item.type),
      maxAmmo: getMaxAmmo(item.type),
      reserveAmmo: getMaxAmmo(item.type) * 3,
      damage: getWeaponDamage(item.weaponId),
      fireRate: getFireRate(item.type),
      rarity: item.rarity,
      type: item.type,
      isReloading: false,
    };

    const newWeapons = [...weapons];
    if (newWeapons.length < 5) {
      newWeapons.push(newWeapon);
    } else {
      newWeapons[get().activeWeaponIndex] = newWeapon;
    }

    set({
      loot: loot.map(l => l.id === lootId ? { ...l, collected: true } : l),
      weapons: newWeapons,
    });
  },

  switchWeapon: (index) => {
    const { weapons } = get();
    if (index >= 0 && index < weapons.length) {
      set({ activeWeaponIndex: index });
    }
  },

  shoot: () => {
    const { weapons, activeWeaponIndex } = get();
    const weapon = weapons[activeWeaponIndex];
    if (!weapon || weapon.ammo <= 0 || weapon.isReloading) return false;

    const newWeapons = [...weapons];
    newWeapons[activeWeaponIndex] = { ...weapon, ammo: weapon.ammo - 1 };
    set({ weapons: newWeapons, shotsFired: get().shotsFired + 1 });
    return true;
  },

  reload: () => {
    const { weapons, activeWeaponIndex } = get();
    const weapon = weapons[activeWeaponIndex];
    if (!weapon || weapon.ammo === weapon.maxAmmo || weapon.reserveAmmo === 0 || weapon.isReloading) return;
    const newWeapons = [...weapons];
    newWeapons[activeWeaponIndex] = { ...weapon, isReloading: true };
    set({ weapons: newWeapons });
  },

  finishReload: () => {
    const { weapons, activeWeaponIndex } = get();
    const weapon = weapons[activeWeaponIndex];
    if (!weapon) return;
    const needed = weapon.maxAmmo - weapon.ammo;
    const taken = Math.min(needed, weapon.reserveAmmo);
    const newWeapons = [...weapons];
    newWeapons[activeWeaponIndex] = {
      ...weapon,
      ammo: weapon.ammo + taken,
      reserveAmmo: weapon.reserveAmmo - taken,
      isReloading: false,
    };
    set({ weapons: newWeapons });
  },

  addMaterials: (type, amount) => {
    const s = get();
    if (type === "WOOD") set({ wood: Math.min(999, s.wood + amount) });
    if (type === "STONE") set({ stone: Math.min(999, s.stone + amount) });
    if (type === "METAL") set({ metal: Math.min(999, s.metal + amount) });
  },

  toggleBuildMode: () => set(s => ({ buildMode: !s.buildMode })),
  setBuildPiece: (piece) => set({ buildPiece: piece }),
  cycleBuildPiece: () => {
    const pieces: BuildPiece[] = ["WALL", "FLOOR", "RAMP"];
    const idx = pieces.indexOf(get().buildPiece);
    set({ buildPiece: pieces[(idx + 1) % pieces.length] });
  },

  placeBuildingPiece: (pos, rot) => {
    const { buildings, buildPiece, buildMaterial, wood, stone, metal } = get();
    const cost = buildMaterial === "WOOD" ? 10 : buildMaterial === "STONE" ? 15 : 20;
    const available = buildMaterial === "WOOD" ? wood : buildMaterial === "STONE" ? stone : metal;
    if (available < cost) return;

    const maxHp = buildMaterial === "WOOD" ? 150 : buildMaterial === "STONE" ? 300 : 500;
    const newPiece: BuildingPiece = {
      id: `build-${Date.now()}-${Math.random()}`,
      position: pos,
      rotation: rot,
      type: buildPiece,
      material: buildMaterial,
      hp: maxHp,
      maxHp,
    };

    const updates: Partial<GameState> = { buildings: [...buildings, newPiece] };
    if (buildMaterial === "WOOD") updates.wood = wood - cost;
    if (buildMaterial === "STONE") updates.stone = stone - cost;
    if (buildMaterial === "METAL") updates.metal = metal - cost;
    set(updates as GameState);
  },

  damageBuildingPiece: (id, damage) => {
    set(s => ({
      buildings: s.buildings
        .map(b => b.id === id ? { ...b, hp: b.hp - damage } : b)
        .filter(b => b.hp > 0),
    }));
  },

  updateStorm: (dt) => {
    const { stormPhase, stormTimeLeft, stormRadius, stormTargetRadius, playerPosition, stormCenter, stormDamageActive } = get();
    const phase = STORM_PHASES[stormPhase];
    if (!phase) return;

    const newTimeLeft = stormTimeLeft - dt;
    const shrinkProgress = 1 - (newTimeLeft / phase.duration);
    const newRadius = STORM_PHASES[stormPhase].radius + (stormTargetRadius - STORM_PHASES[stormPhase].radius) * shrinkProgress;

    // Check if player is outside storm
    const dx = playerPosition[0] - stormCenter[0];
    const dz = playerPosition[2] - stormCenter[1];
    const distFromCenter = Math.sqrt(dx * dx + dz * dz);
    const inStorm = distFromCenter > newRadius;

    if (inStorm) {
      get().takeDamage(phase.dps * dt);
    }

    if (newTimeLeft <= 0 && stormPhase < STORM_PHASES.length - 1) {
      const nextPhase = stormPhase + 1;
      set({
        stormPhase: nextPhase,
        stormRadius: STORM_PHASES[nextPhase].radius,
        stormTargetRadius: STORM_PHASES[nextPhase].targetRadius,
        stormTimeLeft: STORM_PHASES[nextPhase].duration,
        stormDamageActive: true,
      });
    } else {
      set({ stormRadius: newRadius, stormTimeLeft: Math.max(0, newTimeLeft), stormDamageActive: inStorm });
    }
  },

  updateBot: (id, updates) => {
    set(s => ({
      bots: s.bots.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  },

  killBot: (id, weapon) => {
    const { bots, kills } = get();
    const bot = bots.find(b => b.id === id);
    if (!bot || bot.isDead) return;

    get().addKillFeedEntry("You", bot.name, weapon);
    set(s => ({
      bots: s.bots.map(b => b.id === id ? { ...b, isDead: true, hp: 0 } : b),
      kills: s.kills + 1,
    }));

    // Check win condition
    const aliveBots = get().bots.filter(b => !b.isDead).length;
    if (aliveBots === 0) {
      setTimeout(() => get().endGame(true), 1500);
    }
  },

  addKillFeedEntry: (killer, victim, weapon) => {
    const entry: KillFeedEntry = {
      id: `kf-${Date.now()}`,
      killer,
      victim,
      weapon,
      time: Date.now(),
    };
    set(s => ({ killFeed: [entry, ...s.killFeed].slice(0, 6) }));
  },

  cleanKillFeed: () => {
    const now = Date.now();
    set(s => ({ killFeed: s.killFeed.filter(e => now - e.time < 4000) }));
  },

  recordShot: (hit) => {
    set(s => ({
      shotsFired: s.shotsFired + 1,
      shotsHit: hit ? s.shotsHit + 1 : s.shotsHit,
    }));
  },

  recordDamage: (amount) => {
    set(s => ({ damageDealt: s.damageDealt + amount }));
  },
}));

// Helpers
function getMaxAmmo(type: string): number {
  if (type === "Pistol") return 15;
  if (type === "SMG") return 35;
  if (type === "Assault Rifle") return 30;
  if (type === "Shotgun") return 6;
  if (type === "Sniper Rifle") return 5;
  if (type === "LMG") return 100;
  return 30;
}

function getWeaponDamage(id: string): number {
  const damages: Record<string, number> = {
    "kraken-ar": 38, "phantom-smg": 24, "colossus-lmg": 45,
    "specter-sniper": 145, "nova-shotgun": 110, "viper-pistol": 22,
    "stryker-ar": 32, "hellfire-rpg": 300, "nova-smg": 18, "warblade-melee": 85,
  };
  return damages[id] || 25;
}

function getFireRate(type: string): number {
  if (type === "Pistol") return 4.5;
  if (type === "SMG") return 11.0;
  if (type === "Assault Rifle") return 5.5;
  if (type === "Shotgun") return 1.2;
  if (type === "Sniper Rifle") return 0.9;
  if (type === "LMG") return 8.0;
  return 5.0;
}
