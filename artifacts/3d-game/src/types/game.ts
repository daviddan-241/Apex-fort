import * as THREE from "three";

export type GamePhase = "menu" | "character-select" | "dropping" | "playing" | "victory" | "defeat";
export type WeaponType = "AR" | "Shotgun" | "Sniper" | "SMG" | "Pistol" | "Pickaxe" | "RPG" | "Grenade";
export type BuildPieceType = "wall" | "floor" | "ramp" | "roof" | "stair";
export type MaterialType = "wood" | "stone" | "metal";
export type RarityType = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type VehicleType = "car" | "truck" | "bike";

export interface Weapon {
  type: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
  range: number;
  color: string;
  rarity: RarityType;
  spread?: number;
  pellets?: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  color: string;
  accentColor: string;
  maxHealth: number;
  maxShield: number;
  moveSpeed: number;
  tactical: string;
  ultimate: string;
  description: string;
}

export interface VehicleState {
  id: string;
  type: VehicleType;
  x: number;
  z: number;
  yaw: number;
  health: number;
  occupied: boolean;
  speed: number;
}

export interface Bot {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
  shield: number;
  isAlive: boolean;
  targetPosition: THREE.Vector3 | null;
  lastShotTime: number;
  wanderTimer: number;
  color: string;
  aggroRange: number;
  state: "wandering" | "chasing" | "shooting" | "retreating";
  name: string;
}

export interface Bullet {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  lifetime: number;
  fromPlayer: boolean;
}

export interface BuildPiece {
  id: string;
  type: BuildPieceType;
  position: THREE.Vector3;
  rotation: number;
  material: MaterialType;
  health: number;
}

export interface LootItem {
  id: string;
  position: THREE.Vector3;
  weaponType: WeaponType;
  ammo: number;
  rarity: RarityType;
}

export interface DamageNumber {
  id: string;
  value: number;
  position: { x: number; y: number };
  color: string;
  createdAt: number;
  isCritical: boolean;
}

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  selectedCharacter: CharacterDef | null;
  health: number;
  shield: number;
  kills: number;
  playersAlive: number;
  matchTime: number;
  currentWeapon: Weapon | null;
  weapons: (Weapon | null)[];
  activeSlot: number;
  isReloading: boolean;
  buildMode: boolean;
  selectedBuildPiece: BuildPieceType;
  activeMaterial: MaterialType;
  materials: Record<MaterialType, number>;
  stormRadius: number;
  stormCenter: THREE.Vector2;
  inStorm: boolean;
  stormDamageTimer: number;
  tacticalCooldown: number;
  ultimateCooldown: number;
  isADS: boolean;
  isSprinting: boolean;
  isSliding: boolean;
  damageNumbers: DamageNumber[];
  killFeed: KillFeedEntry[];
  locationName: string;
  xp: number;
  level: number;
  inVehicle: boolean;
  vehicleId: string | null;
  vehicleSpeed: number;
  gameVersion: string;
}
