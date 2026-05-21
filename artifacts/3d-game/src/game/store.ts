import { create } from 'zustand';
import * as THREE from 'three';

export type GameState = 'menu' | 'mode-select' | 'playing' | 'game-over';
export type GameMode = 'solo' | 'duo' | 'squad' | 'bot-deathmatch';

export type WeaponType = 'AR' | 'Shotgun' | 'Sniper' | 'SMG';

export interface Weapon {
  name: WeaponType;
  damage: number;
  fireRate: number; // seconds between shots
  range: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  color: string;
}

export const WEAPONS: Record<WeaponType, Weapon> = {
  AR: { name: 'AR', damage: 20, fireRate: 0.15, range: 100, ammo: 30, maxAmmo: 30, reloadTime: 1.5, color: '#00c8ff' },
  Shotgun: { name: 'Shotgun', damage: 80, fireRate: 0.8, range: 20, ammo: 5, maxAmmo: 5, reloadTime: 2.5, color: '#ff0055' },
  Sniper: { name: 'Sniper', damage: 90, fireRate: 1.2, range: 200, ammo: 5, maxAmmo: 5, reloadTime: 3.0, color: '#ffcc00' },
  SMG: { name: 'SMG', damage: 12, fireRate: 0.08, range: 40, ammo: 40, maxAmmo: 40, reloadTime: 1.2, color: '#00ffcc' },
};

export interface Bullet {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  ownerId: string;
  distanceTraveled: number;
  maxRange: number;
}

export interface Bot {
  id: string;
  position: THREE.Vector3;
  hp: number;
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
  createdAt: number;
}

interface GameStore {
  gameState: GameState;
  gameMode: GameMode;
  
  // Player stats
  playerHp: number;
  playerShield: number;
  playerPos: THREE.Vector3;
  playerKills: number;
  currentWeapon: Weapon;
  isReloading: boolean;
  isBuildMode: boolean;
  
  // World state
  bots: Bot[];
  bullets: Bullet[];
  loot: Loot[];
  structures: Structure[];
  damageNumbers: DamageNumber[];
  
  stormRadius: number;
  stormTimeLeft: number;
  gameTime: number;
  
  // Actions
  setGameState: (state: GameState) => void;
  setGameMode: (mode: GameMode) => void;
  startGame: () => void;
  endGame: () => void;
  
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
  damageBot: (id: string, amount: number) => void;
  
  collectLoot: (id: string) => void;
  
  updateStorm: (dt: number) => void;
  
  addDamageNumber: (pos: THREE.Vector3, amount: number) => void;
  removeOldDamageNumbers: (currentTime: number) => void;
}

const INITIAL_STORM_RADIUS = 100;
const STORM_SHRINK_TIME = 180; // 3 minutes
const MIN_STORM_RADIUS = 10;

const BOT_NAMES = ['Zero', 'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India'];

const generateInitialBots = (): Bot[] => {
  return BOT_NAMES.map((name, i) => {
    const angle = (i / BOT_NAMES.length) * Math.PI * 2;
    const radius = 30 + (i * 5) % 40;
    return {
      id: `bot-${i}`,
      name,
      hp: 100,
      position: new THREE.Vector3(Math.cos(angle) * radius, 1, Math.sin(angle) * radius),
      color: `hsl(${Math.random() * 360}, 80%, 50%)`,
      lastFired: 0,
      targetPos: null
    };
  });
};

const generateInitialLoot = (): Loot[] => {
  const lootTypes: ('weapon' | 'health' | 'shield')[] = ['weapon', 'health', 'shield'];
  const weaponTypes: WeaponType[] = ['AR', 'Shotgun', 'Sniper', 'SMG'];
  const loot: Loot[] = [];
  
  // Deterministic positions based on index
  for (let i = 0; i < 15; i++) {
    const angle = (i * 137.5) * Math.PI / 180; // Golden angle
    const radius = 20 + (i * 4) % 60;
    const type = lootTypes[i % lootTypes.length];
    
    loot.push({
      id: `loot-${i}`,
      position: new THREE.Vector3(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius),
      type,
      weaponType: type === 'weapon' ? weaponTypes[i % weaponTypes.length] : undefined
    });
  }
  return loot;
};

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
  
  bots: [],
  bullets: [],
  loot: [],
  structures: [],
  damageNumbers: [],
  
  stormRadius: INITIAL_STORM_RADIUS,
  stormTimeLeft: STORM_SHRINK_TIME,
  gameTime: 0,
  
  setGameState: (state) => set({ gameState: state }),
  setGameMode: (mode) => set({ gameMode: mode }),
  
  startGame: () => set({
    gameState: 'playing',
    playerHp: 100,
    playerShield: 100,
    playerPos: new THREE.Vector3(0, 1, 0),
    playerKills: 0,
    currentWeapon: { ...WEAPONS.AR },
    isReloading: false,
    isBuildMode: false,
    bots: generateInitialBots(),
    bullets: [],
    loot: generateInitialLoot(),
    structures: [],
    damageNumbers: [],
    stormRadius: INITIAL_STORM_RADIUS,
    stormTimeLeft: STORM_SHRINK_TIME,
    gameTime: 0
  }),
  
  endGame: () => set({ gameState: 'game-over' }),
  
  updatePlayerPos: (pos) => set({ playerPos: pos }),
  
  damagePlayer: (amount) => set(state => {
    let remainingDamage = amount;
    let newShield = state.playerShield;
    let newHp = state.playerHp;
    
    if (newShield > 0) {
      if (newShield >= remainingDamage) {
        newShield -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= newShield;
        newShield = 0;
      }
    }
    
    if (remainingDamage > 0) {
      newHp -= remainingDamage;
    }
    
    if (newHp <= 0) {
      setTimeout(() => get().endGame(), 100);
      return { playerShield: 0, playerHp: 0 };
    }
    
    return { playerShield: newShield, playerHp: newHp };
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
      speed: 50,
      damage: newWeapon.damage,
      ownerId: 'player',
      distanceTraveled: 0,
      maxRange: newWeapon.range
    };
    
    return {
      currentWeapon: newWeapon,
      bullets: [...state.bullets, bullet]
    };
  }),
  
  reloadWeapon: () => set(state => {
    if (state.isReloading || state.currentWeapon.ammo === state.currentWeapon.maxAmmo) return state;
    
    setTimeout(() => {
      set(s => ({
        currentWeapon: { ...s.currentWeapon, ammo: s.currentWeapon.maxAmmo },
        isReloading: false
      }));
    }, state.currentWeapon.reloadTime * 1000);
    
    return { isReloading: true };
  }),
  
  toggleBuildMode: () => set(state => ({ isBuildMode: !state.isBuildMode })),
  
  placeStructure: (structure) => set(state => ({
    structures: [...state.structures, structure],
    isBuildMode: false
  })),
  
  addBullet: (bullet) => set(state => ({ bullets: [...state.bullets, bullet] })),
  
  updateBullets: (dt) => set(state => {
    // Simple update logic, detailed collision in Game Loop
    const newBullets = state.bullets.map(b => {
      const movement = b.direction.clone().multiplyScalar(b.speed * dt);
      return {
        ...b,
        position: b.position.clone().add(movement),
        distanceTraveled: b.distanceTraveled + movement.length()
      };
    }).filter(b => b.distanceTraveled < b.maxRange);
    
    return { bullets: newBullets };
  }),
  
  updateBots: (newBots) => set({ bots: newBots }),
  
  damageBot: (id, amount) => set(state => {
    const bots = state.bots.map(b => {
      if (b.id !== id) return b;
      return { ...b, hp: b.hp - amount };
    });
    
    const deadBots = bots.filter(b => b.hp <= 0);
    const aliveBots = bots.filter(b => b.hp > 0);
    
    let newKills = state.playerKills;
    if (deadBots.length > 0) {
      newKills += deadBots.length;
      if (aliveBots.length === 0) {
        setTimeout(() => get().endGame(), 1000);
      }
    }
    
    return { bots: aliveBots, playerKills: newKills };
  }),
  
  collectLoot: (id) => set(state => {
    const item = state.loot.find(l => l.id === id);
    if (!item) return state;
    
    const newLoot = state.loot.filter(l => l.id !== id);
    
    if (item.type === 'weapon' && item.weaponType) {
      return { loot: newLoot, currentWeapon: { ...WEAPONS[item.weaponType] }, isReloading: false };
    } else if (item.type === 'health') {
      return { loot: newLoot, playerHp: Math.min(100, state.playerHp + 50) };
    } else if (item.type === 'shield') {
      return { loot: newLoot, playerShield: Math.min(100, state.playerShield + 50) };
    }
    
    return { loot: newLoot };
  }),
  
  updateStorm: (dt) => set(state => {
    const newTime = Math.max(0, state.stormTimeLeft - dt);
    const progress = 1 - (newTime / STORM_SHRINK_TIME);
    const newRadius = INITIAL_STORM_RADIUS - (INITIAL_STORM_RADIUS - MIN_STORM_RADIUS) * progress;
    
    return {
      gameTime: state.gameTime + dt,
      stormTimeLeft: newTime,
      stormRadius: newRadius
    };
  }),
  
  addDamageNumber: (pos, amount) => set(state => ({
    damageNumbers: [...state.damageNumbers, {
      id: `dmg-${Date.now()}-${Math.random()}`,
      position: pos.clone().add(new THREE.Vector3((Math.random()-0.5)*2, 1, (Math.random()-0.5)*2)),
      amount,
      createdAt: state.gameTime
    }]
  })),
  
  removeOldDamageNumbers: (currentTime) => set(state => ({
    damageNumbers: state.damageNumbers.filter(dn => currentTime - dn.createdAt < 1.5)
  }))
}));
