import { create } from 'zustand';
import * as THREE from 'three';

export type GameState = 'menu' | 'playing' | 'game-over' | 'victory' | 'locker' | 'battlepass';
export type GameMode = 'solo' | 'duo' | 'squad' | 'bot-deathmatch';
export type WeaponType = 'AR' | 'Shotgun' | 'Sniper' | 'SMG' | 'MythicAR' | 'InfinityCannon';
export type WeaponRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Mythic';

export const RARITY_COLORS: Record<WeaponRarity, string> = {
  Common: '#9ca3af',
  Uncommon: '#4ade80',
  Rare: '#60a5fa',
  Epic: '#c084fc',
  Mythic: '#fbbf24',
};

export interface Weapon {
  name: WeaponType;
  displayName: string;
  damage: number;
  fireRate: number;
  range: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  color: string;
  rarity: WeaponRarity;
  isExplosive?: boolean;
}

export const WEAPONS: Record<WeaponType, Weapon> = {
  AR: { name: 'AR', displayName: 'Assault Rifle', damage: 20, fireRate: 0.15, range: 100, ammo: 30, maxAmmo: 30, reloadTime: 1.5, color: '#60a5fa', rarity: 'Rare' },
  Shotgun: { name: 'Shotgun', displayName: 'Pump Shotgun', damage: 80, fireRate: 0.8, range: 20, ammo: 5, maxAmmo: 5, reloadTime: 2.5, color: '#9ca3af', rarity: 'Common' },
  Sniper: { name: 'Sniper', displayName: 'Sniper Rifle', damage: 90, fireRate: 1.2, range: 200, ammo: 5, maxAmmo: 5, reloadTime: 3.0, color: '#4ade80', rarity: 'Uncommon' },
  SMG: { name: 'SMG', displayName: 'SMG', damage: 12, fireRate: 0.08, range: 40, ammo: 40, maxAmmo: 40, reloadTime: 1.2, color: '#9ca3af', rarity: 'Common' },
  MythicAR: { name: 'MythicAR', displayName: 'Mythic Havoc AR', damage: 38, fireRate: 0.10, range: 150, ammo: 40, maxAmmo: 40, reloadTime: 1.0, color: '#fbbf24', rarity: 'Mythic' },
  InfinityCannon: { name: 'InfinityCannon', displayName: 'Infinity Cannon', damage: 120, fireRate: 2.0, range: 130, ammo: 3, maxAmmo: 3, reloadTime: 4.0, color: '#c084fc', rarity: 'Mythic', isExplosive: true },
};

export interface Skin {
  id: string;
  name: string;
  color: string;
  emissive: string;
  requiredLevel: number;
}

export const SKINS: Skin[] = [
  { id: 'default', name: 'Default', color: '#00c8ff', emissive: '#003344', requiredLevel: 1 },
  { id: 'shadow', name: 'Shadow', color: '#7c3aed', emissive: '#2e1065', requiredLevel: 5 },
  { id: 'neon', name: 'Neon', color: '#ff0055', emissive: '#550022', requiredLevel: 10 },
  { id: 'arctic', name: 'Arctic', color: '#bae6fd', emissive: '#7dd3fc', requiredLevel: 15 },
  { id: 'inferno', name: 'Inferno', color: '#f97316', emissive: '#7c2d12', requiredLevel: 20 },
  { id: 'mythic', name: 'Mythic Gold', color: '#fbbf24', emissive: '#78350f', requiredLevel: 30 },
];

export interface Bullet {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  ownerId: string;
  distanceTraveled: number;
  maxRange: number;
  isExplosive?: boolean;
}

export interface Bot {
  id: string;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  color: string;
  name: string;
  lastFired: number;
  targetPos: THREE.Vector3 | null;
}

export interface Loot {
  id: string;
  position: THREE.Vector3;
  type: 'weapon' | 'health' | 'shield';
  weaponType?: WeaponType;
}

export interface Structure {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  size: THREE.Vector3;
  hp: number;
}

export interface DamageNumber {
  id: string;
  position: THREE.Vector3;
  amount: number;
  isHeadshot: boolean;
  createdAt: number;
}

export interface Vehicle {
  id: string;
  position: THREE.Vector3;
  type: 'car' | 'quad';
  hp: number;
  maxHp: number;
  occupiedBy: string | null;
  rotation: number;
}

export interface Challenge {
  id: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
}

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  time: number;
}

export interface CareerStats {
  totalKills: number;
  totalWins: number;
  totalGames: number;
  totalDamage: number;
  totalHeadshots: number;
}

const INITIAL_STORM_RADIUS = 90;
const STORM_SHRINK_TIME = 180;
const MIN_STORM_RADIUS = 12;

const BOT_NAMES = ['Zero', 'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India'];

const BOT_COLORS = ['#ef4444', '#f97316', '#a855f7', '#ec4899', '#14b8a6', '#84cc16', '#f59e0b', '#06b6d4', '#8b5cf6', '#10b981'];

const loadSavedInt = (key: string, def: number): number => {
  try { const v = localStorage.getItem(key); return v ? parseInt(v, 10) : def; } catch { return def; }
};
const loadSavedStr = (key: string, def: string): string => {
  try { return localStorage.getItem(key) ?? def; } catch { return def; }
};
const loadSavedObj = <T>(key: string, def: T): T => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : def; } catch { return def; }
};

const INITIAL_CHALLENGES: Challenge[] = [
  { id: 'c0', description: 'Get 5 kills', progress: 0, target: 5, completed: false, xpReward: 500 },
  { id: 'c1', description: 'Survive 3 minutes', progress: 0, target: 180, completed: false, xpReward: 300 },
  { id: 'c2', description: 'Collect 10 loot items', progress: 0, target: 10, completed: false, xpReward: 250 },
  { id: 'c3', description: 'Deal 500 damage', progress: 0, target: 500, completed: false, xpReward: 400 },
  { id: 'c4', description: 'Build 5 structures', progress: 0, target: 5, completed: false, xpReward: 200 },
  { id: 'c5', description: 'Eliminate with Sniper Rifle', progress: 0, target: 1, completed: false, xpReward: 600 },
  { id: 'c6', description: 'Drive a vehicle', progress: 0, target: 1, completed: false, xpReward: 150 },
  { id: 'c7', description: 'Finish top 3', progress: 0, target: 1, completed: false, xpReward: 350 },
  { id: 'c8', description: 'Land 3 headshots', progress: 0, target: 3, completed: false, xpReward: 400 },
  { id: 'c9', description: 'Win a match', progress: 0, target: 1, completed: false, xpReward: 1000 },
];

const generateInitialBots = (): Bot[] => {
  return BOT_NAMES.map((name, i) => {
    const angle = (i / BOT_NAMES.length) * Math.PI * 2;
    const radius = 30 + (i * 5) % 40;
    return {
      id: `bot-${i}`,
      name,
      hp: 100,
      maxHp: 100,
      position: new THREE.Vector3(Math.cos(angle) * radius, 1, Math.sin(angle) * radius),
      color: BOT_COLORS[i % BOT_COLORS.length],
      lastFired: 0,
      targetPos: null,
    };
  });
};

const generateInitialLoot = (): Loot[] => {
  const lootTypes: ('weapon' | 'health' | 'shield')[] = ['weapon', 'health', 'shield'];
  const normalWeapons: WeaponType[] = ['AR', 'Shotgun', 'Sniper', 'SMG'];
  const mythicWeapons: WeaponType[] = ['MythicAR', 'InfinityCannon'];
  const loot: Loot[] = [];
  for (let i = 0; i < 18; i++) {
    const angle = (i * 137.5) * Math.PI / 180;
    const radius = 15 + (i * 4.5) % 65;
    const type = lootTypes[i % lootTypes.length];
    let weaponType: WeaponType | undefined;
    if (type === 'weapon') {
      weaponType = i >= 16 ? mythicWeapons[i - 16] : normalWeapons[i % normalWeapons.length];
    }
    loot.push({
      id: `loot-${i}`,
      position: new THREE.Vector3(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius),
      type,
      weaponType,
    });
  }
  return loot;
};

const generateInitialVehicles = (): Vehicle[] => [
  { id: 'v0', position: new THREE.Vector3(18, 0.5, 8), type: 'car', hp: 200, maxHp: 200, occupiedBy: null, rotation: 0 },
  { id: 'v1', position: new THREE.Vector3(-28, 0.5, 22), type: 'quad', hp: 150, maxHp: 150, occupiedBy: null, rotation: 1.2 },
  { id: 'v2', position: new THREE.Vector3(42, 0.5, -18), type: 'car', hp: 200, maxHp: 200, occupiedBy: null, rotation: 2.5 },
];

interface GameStore {
  gameState: GameState;
  gameMode: GameMode;

  playerHp: number;
  playerShield: number;
  playerPos: THREE.Vector3;
  playerKills: number;
  currentWeapon: Weapon;
  isReloading: boolean;
  isBuildMode: boolean;
  inVehicle: boolean;
  currentVehicleId: string | null;

  xp: number;
  level: number;
  selectedSkin: string;
  levelUpFlash: number;

  bots: Bot[];
  bullets: Bullet[];
  loot: Loot[];
  structures: Structure[];
  damageNumbers: DamageNumber[];
  vehicles: Vehicle[];
  killFeed: KillFeedEntry[];

  challenges: Challenge[];

  stormRadius: number;
  stormTimeLeft: number;
  gameTime: number;

  damageDealtThisMatch: number;
  headshotsThisMatch: number;
  lootCollectedThisMatch: number;
  structuresBuiltThisMatch: number;

  careerStats: CareerStats;

  setGameState: (s: GameState) => void;
  setGameMode: (m: GameMode) => void;
  startGame: () => void;
  endGame: (victory: boolean) => void;

  updatePlayerPos: (pos: THREE.Vector3) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number, type: 'hp' | 'shield') => void;
  setWeapon: (weapon: Weapon) => void;
  fireWeapon: (direction: THREE.Vector3, origin: THREE.Vector3) => void;
  reloadWeapon: () => void;
  toggleBuildMode: () => void;
  placeStructure: (structure: Structure) => void;

  addBullet: (bullet: Bullet) => void;
  updateBullets: (dt: number) => void;

  updateBots: (newBots: Bot[]) => void;
  damageBot: (id: string, amount: number, isHeadshot?: boolean) => void;

  collectLoot: (id: string) => void;
  updateStorm: (dt: number) => void;

  addDamageNumber: (pos: THREE.Vector3, amount: number, isHeadshot: boolean) => void;
  removeOldDamageNumbers: (currentTime: number) => void;

  gainXp: (amount: number) => void;
  setSelectedSkin: (id: string) => void;

  enterVehicle: (vehicleId: string) => void;
  exitVehicle: () => void;
  updateVehicles: (vehicles: Vehicle[]) => void;

  updateChallenge: (id: string, value: number) => void;
  addKillFeed: (killer: string, victim: string) => void;
  clearOldKillFeed: (currentTime: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  gameMode: 'solo',

  playerHp: 100,
  playerShield: 100,
  playerPos: new THREE.Vector3(0, 1, 0),
  playerKills: 0,
  currentWeapon: { ...WEAPONS.AR },
  isReloading: false,
  isBuildMode: false,
  inVehicle: false,
  currentVehicleId: null,

  xp: loadSavedInt('apexstorm_xp', 0),
  level: loadSavedInt('apexstorm_level', 1),
  selectedSkin: loadSavedStr('apexstorm_skin', 'default'),
  levelUpFlash: 0,

  bots: [],
  bullets: [],
  loot: [],
  structures: [],
  damageNumbers: [],
  vehicles: generateInitialVehicles(),
  killFeed: [],

  challenges: loadSavedObj<Challenge[]>('apexstorm_challenges', INITIAL_CHALLENGES),

  stormRadius: INITIAL_STORM_RADIUS,
  stormTimeLeft: STORM_SHRINK_TIME,
  gameTime: 0,

  damageDealtThisMatch: 0,
  headshotsThisMatch: 0,
  lootCollectedThisMatch: 0,
  structuresBuiltThisMatch: 0,

  careerStats: loadSavedObj<CareerStats>('apexstorm_career', {
    totalKills: 0, totalWins: 0, totalGames: 0, totalDamage: 0, totalHeadshots: 0,
  }),

  setGameState: (s) => set({ gameState: s }),
  setGameMode: (m) => set({ gameMode: m }),

  startGame: () => set({
    gameState: 'playing',
    playerHp: 100,
    playerShield: 100,
    playerPos: new THREE.Vector3(0, 1, 0),
    playerKills: 0,
    currentWeapon: { ...WEAPONS.AR },
    isReloading: false,
    isBuildMode: false,
    inVehicle: false,
    currentVehicleId: null,
    bots: generateInitialBots(),
    bullets: [],
    loot: generateInitialLoot(),
    structures: [],
    damageNumbers: [],
    vehicles: generateInitialVehicles(),
    killFeed: [],
    stormRadius: INITIAL_STORM_RADIUS,
    stormTimeLeft: STORM_SHRINK_TIME,
    gameTime: 0,
    damageDealtThisMatch: 0,
    headshotsThisMatch: 0,
    lootCollectedThisMatch: 0,
    structuresBuiltThisMatch: 0,
  }),

  endGame: (victory) => {
    const state = get();
    const newCareer: CareerStats = {
      totalKills: state.careerStats.totalKills + state.playerKills,
      totalWins: state.careerStats.totalWins + (victory ? 1 : 0),
      totalGames: state.careerStats.totalGames + 1,
      totalDamage: state.careerStats.totalDamage + state.damageDealtThisMatch,
      totalHeadshots: state.careerStats.totalHeadshots + state.headshotsThisMatch,
    };
    localStorage.setItem('apexstorm_career', JSON.stringify(newCareer));
    const xpEarned = state.playerKills * 50 + state.headshotsThisMatch * 25 + Math.floor(state.gameTime) + (victory ? 500 : 0);
    set({ gameState: victory ? 'victory' : 'game-over', careerStats: newCareer, inVehicle: false, currentVehicleId: null });
    get().gainXp(xpEarned);
    if (victory) {
      get().updateChallenge('c9', 1);
    }
    if (state.bots.length <= 2) {
      get().updateChallenge('c7', 1);
    }
  },

  updatePlayerPos: (pos) => set({ playerPos: pos }),

  damagePlayer: (amount) => set(state => {
    let remaining = amount;
    let shield = state.playerShield;
    let hp = state.playerHp;
    if (shield > 0) {
      if (shield >= remaining) { shield -= remaining; remaining = 0; }
      else { remaining -= shield; shield = 0; }
    }
    if (remaining > 0) hp -= remaining;
    if (hp <= 0) {
      setTimeout(() => get().endGame(false), 100);
      return { playerShield: 0, playerHp: 0 };
    }
    return { playerShield: shield, playerHp: hp };
  }),

  healPlayer: (amount, type) => set(state => {
    if (type === 'hp') return { playerHp: Math.min(100, state.playerHp + amount) };
    return { playerShield: Math.min(100, state.playerShield + amount) };
  }),

  setWeapon: (weapon) => set({ currentWeapon: { ...weapon }, isReloading: false }),

  fireWeapon: (direction, origin) => set(state => {
    if (state.currentWeapon.ammo <= 0 || state.isReloading) return state;
    const newWeapon = { ...state.currentWeapon, ammo: state.currentWeapon.ammo - 1 };
    const bullet: Bullet = {
      id: `bullet-${Date.now()}-${Math.random()}`,
      position: origin.clone(),
      direction: direction.clone().normalize(),
      speed: 60,
      damage: newWeapon.damage,
      ownerId: 'player',
      distanceTraveled: 0,
      maxRange: newWeapon.range,
      isExplosive: newWeapon.isExplosive,
    };
    return { currentWeapon: newWeapon, bullets: [...state.bullets, bullet] };
  }),

  reloadWeapon: () => set(state => {
    if (state.isReloading || state.currentWeapon.ammo === state.currentWeapon.maxAmmo) return state;
    setTimeout(() => {
      set(s => ({ currentWeapon: { ...s.currentWeapon, ammo: s.currentWeapon.maxAmmo }, isReloading: false }));
    }, state.currentWeapon.reloadTime * 1000);
    return { isReloading: true };
  }),

  toggleBuildMode: () => set(state => ({ isBuildMode: !state.isBuildMode })),

  placeStructure: (structure) => set(state => {
    const count = state.structuresBuiltThisMatch + 1;
    get().updateChallenge('c4', count);
    get().gainXp(5);
    return { structures: [...state.structures, structure], isBuildMode: false, structuresBuiltThisMatch: count };
  }),

  addBullet: (bullet) => set(state => ({ bullets: [...state.bullets, bullet] })),

  updateBullets: (dt) => set(state => {
    const updated = state.bullets.map(b => {
      const move = b.direction.clone().multiplyScalar(b.speed * dt);
      return { ...b, position: b.position.clone().add(move), distanceTraveled: b.distanceTraveled + move.length() };
    }).filter(b => b.distanceTraveled < b.maxRange);
    return { bullets: updated };
  }),

  updateBots: (newBots) => set({ bots: newBots }),

  damageBot: (id, amount, isHeadshot = false) => set(state => {
    const headshotBonus = isHeadshot ? 1 : 0;
    const actualDamage = isHeadshot ? Math.round(amount * 1.5) : amount;
    const newDamage = state.damageDealtThisMatch + actualDamage;
    const newHeadshots = state.headshotsThisMatch + headshotBonus;

    get().updateChallenge('c3', newDamage);
    if (isHeadshot) get().updateChallenge('c8', newHeadshots);

    const bots = state.bots.map(b => b.id === id ? { ...b, hp: b.hp - actualDamage } : b);
    const dead = bots.filter(b => b.hp <= 0);
    const alive = bots.filter(b => b.hp > 0);

    let newKills = state.playerKills;
    if (dead.length > 0) {
      dead.forEach(d => {
        newKills++;
        get().addKillFeed('You', d.name);
        get().gainXp(50 + (isHeadshot ? 25 : 0));
        if (state.currentWeapon.name === 'Sniper') get().updateChallenge('c5', 1);
      });
      get().updateChallenge('c0', newKills);
      if (alive.length === 0) {
        setTimeout(() => get().endGame(true), 800);
      } else if (alive.length <= 2) {
        get().updateChallenge('c7', 1);
      }
    }

    return {
      bots: alive,
      playerKills: newKills,
      damageDealtThisMatch: newDamage,
      headshotsThisMatch: newHeadshots,
    };
  }),

  collectLoot: (id) => set(state => {
    const item = state.loot.find(l => l.id === id);
    if (!item) return state;
    const newLoot = state.loot.filter(l => l.id !== id);
    const count = state.lootCollectedThisMatch + 1;
    get().updateChallenge('c2', count);
    get().gainXp(10);
    if (item.type === 'weapon' && item.weaponType) {
      return { loot: newLoot, currentWeapon: { ...WEAPONS[item.weaponType] }, isReloading: false, lootCollectedThisMatch: count };
    } else if (item.type === 'health') {
      return { loot: newLoot, playerHp: Math.min(100, state.playerHp + 50), lootCollectedThisMatch: count };
    } else {
      return { loot: newLoot, playerShield: Math.min(100, state.playerShield + 50), lootCollectedThisMatch: count };
    }
  }),

  updateStorm: (dt) => set(state => {
    const newTime = Math.max(0, state.stormTimeLeft - dt);
    const progress = 1 - (newTime / STORM_SHRINK_TIME);
    const newRadius = INITIAL_STORM_RADIUS - (INITIAL_STORM_RADIUS - MIN_STORM_RADIUS) * progress;
    const newGameTime = state.gameTime + dt;
    get().updateChallenge('c1', newGameTime);
    if (Math.floor(newGameTime) > Math.floor(state.gameTime)) {
      get().gainXp(1);
    }
    return { gameTime: newGameTime, stormTimeLeft: newTime, stormRadius: newRadius };
  }),

  addDamageNumber: (pos, amount, isHeadshot) => set(state => ({
    damageNumbers: [...state.damageNumbers, {
      id: `dmg-${Date.now()}-${Math.random()}`,
      position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 1, (Math.random() - 0.5) * 2)),
      amount,
      isHeadshot,
      createdAt: state.gameTime,
    }],
  })),

  removeOldDamageNumbers: (currentTime) => set(state => ({
    damageNumbers: state.damageNumbers.filter(dn => currentTime - dn.createdAt < 1.5),
  })),

  gainXp: (amount) => {
    const state = get();
    const newXp = state.xp + amount;
    const xpNeeded = 1000;
    if (newXp >= xpNeeded) {
      const newLevel = state.level + 1;
      try { localStorage.setItem('apexstorm_level', String(newLevel)); localStorage.setItem('apexstorm_xp', String(newXp - xpNeeded)); } catch {}
      set({ xp: newXp - xpNeeded, level: newLevel, levelUpFlash: Date.now() });
    } else {
      try { localStorage.setItem('apexstorm_xp', String(newXp)); } catch {}
      set({ xp: newXp });
    }
  },

  setSelectedSkin: (id) => {
    try { localStorage.setItem('apexstorm_skin', id); } catch {}
    set({ selectedSkin: id });
  },

  enterVehicle: (vehicleId) => {
    get().updateChallenge('c6', 1);
    set({ inVehicle: true, currentVehicleId: vehicleId });
  },

  exitVehicle: () => set({ inVehicle: false, currentVehicleId: null }),

  updateVehicles: (vehicles) => set({ vehicles }),

  updateChallenge: (id, value) => {
    const state = get();
    const challenges = state.challenges.map(c => {
      if (c.id !== id || c.completed) return c;
      const newProgress = Math.min(c.target, value);
      const completed = newProgress >= c.target;
      if (completed && !c.completed) {
        get().gainXp(c.xpReward);
      }
      return { ...c, progress: newProgress, completed };
    });
    try { localStorage.setItem('apexstorm_challenges', JSON.stringify(challenges)); } catch {}
    set({ challenges });
  },

  addKillFeed: (killer, victim) => set(state => ({
    killFeed: [
      { id: `kf-${Date.now()}`, killer, victim, time: state.gameTime },
      ...state.killFeed.slice(0, 4),
    ],
  })),

  clearOldKillFeed: (currentTime) => set(state => ({
    killFeed: state.killFeed.filter(e => currentTime - e.time < 5),
  })),
}));
