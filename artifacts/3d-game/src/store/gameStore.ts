import { create } from "zustand";
import * as THREE from "three";
import { GameState, GamePhase, BuildPieceType, Weapon, CharacterDef, MaterialType, DamageNumber, KillFeedEntry } from "../types/game";
import { WEAPONS } from "../data/weapons";

interface GameStore extends GameState {
  setPhase: (phase: GamePhase) => void;
  setCharacter: (char: CharacterDef) => void;
  takeDamage: (amount: number) => boolean;
  heal: (amount: number) => void;
  addShield: (amount: number) => void;
  addKill: (victimName: string, weaponName: string) => void;
  setPlayersAlive: (n: number) => void;
  tick: (dt: number) => void;
  setActiveSlot: (slot: number) => void;
  pickupWeapon: (weapon: Weapon) => void;
  shootWeapon: () => boolean;
  startReload: () => void;
  finishReload: () => void;
  toggleBuildMode: () => void;
  setSelectedBuildPiece: (piece: BuildPieceType) => void;
  setActiveMaterial: (mat: MaterialType) => void;
  addMaterial: (mat: MaterialType, amount: number) => void;
  spendMaterial: (mat: MaterialType, amount: number) => boolean;
  setStorm: (radius: number, center: THREE.Vector2) => void;
  setInStorm: (v: boolean) => void;
  setADS: (v: boolean) => void;
  setSprinting: (v: boolean) => void;
  setSliding: (v: boolean) => void;
  useTactical: () => void;
  useUltimate: () => void;
  addDamageNumber: (value: number, screenX: number, screenY: number, isCritical?: boolean) => void;
  removeDamageNumber: (id: string) => void;
  setLocationName: (name: string) => void;
  addXP: (amount: number) => void;
  reset: () => void;
}

const INITIAL_STORM_RADIUS = 120;
const NULL_SLOTS = [null, null, null, null, null] as unknown as (Weapon | null)[];

const defaultState: GameState = {
  phase: "menu",
  selectedCharacter: null,
  health: 100,
  shield: 100,
  kills: 0,
  playersAlive: 30,
  matchTime: 0,
  currentWeapon: { ...WEAPONS.Pickaxe },
  weapons: [{ ...WEAPONS.Pickaxe }, { ...WEAPONS.AR }, null, null, null] as (Weapon | null)[],
  activeSlot: 1,
  isReloading: false,
  buildMode: false,
  selectedBuildPiece: "wall",
  activeMaterial: "wood",
  materials: { wood: 200, stone: 100, metal: 50 },
  stormRadius: INITIAL_STORM_RADIUS,
  stormCenter: new THREE.Vector2(0, 0),
  inStorm: false,
  stormDamageTimer: 0,
  tacticalCooldown: 0,
  ultimateCooldown: 0,
  isADS: false,
  isSprinting: false,
  isSliding: false,
  damageNumbers: [],
  killFeed: [],
  locationName: "Tilted Towers",
  xp: 0,
  level: 1,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...defaultState,

  setPhase: (phase) => set({ phase }),
  setCharacter: (char) => set({ selectedCharacter: char, health: char.maxHealth, shield: char.maxShield }),

  takeDamage: (amount) => {
    const { health, shield } = get();
    let remaining = amount;
    const newShield = Math.max(0, shield - remaining);
    remaining = Math.max(0, remaining - shield);
    const newHealth = Math.max(0, health - remaining);
    set({ health: newHealth, shield: newShield });
    if (newHealth <= 0) {
      set({ phase: "defeat" });
      return true;
    }
    return false;
  },

  heal: (amount) => set((s) => ({ health: Math.min(s.selectedCharacter?.maxHealth ?? 100, s.health + amount) })),
  addShield: (amount) => set((s) => ({ shield: Math.min(s.selectedCharacter?.maxShield ?? 100, s.shield + amount) })),

  addKill: (victimName, weaponName) => {
    const entry: KillFeedEntry = {
      id: `kf_${Date.now()}`,
      killer: "You",
      victim: victimName,
      weapon: weaponName,
      timestamp: Date.now(),
    };
    set((s) => ({
      kills: s.kills + 1,
      killFeed: [entry, ...s.killFeed].slice(0, 5),
    }));
    get().addXP(100);
  },

  setPlayersAlive: (n) => {
    set({ playersAlive: n });
    if (n <= 1) set({ phase: "victory" });
  },

  tick: (dt) => {
    const s = get();
    const updates: Partial<GameState> = {
      matchTime: s.matchTime + dt,
      tacticalCooldown: Math.max(0, s.tacticalCooldown - dt),
      ultimateCooldown: Math.max(0, s.ultimateCooldown - dt),
    };
    if (s.inStorm) {
      const newTimer = s.stormDamageTimer + dt;
      if (newTimer >= 0.5) {
        updates.stormDamageTimer = 0;
        const dmg = 3;
        const ns = Math.max(0, s.shield - dmg);
        const rem = Math.max(0, dmg - s.shield);
        const nh = Math.max(0, s.health - rem);
        updates.shield = ns; updates.health = nh;
        if (nh <= 0) updates.phase = "defeat";
      } else updates.stormDamageTimer = newTimer;
    }
    // Clear old kill feed entries
    const now = Date.now();
    const freshKillFeed = s.killFeed.filter(k => now - k.timestamp < 5000);
    if (freshKillFeed.length !== s.killFeed.length) updates.killFeed = freshKillFeed;
    set(updates);
  },

  setActiveSlot: (slot) => {
    const { weapons } = get();
    const w = weapons[slot];
    set({ activeSlot: slot, currentWeapon: w ?? null });
  },

  pickupWeapon: (weapon) => {
    set((s) => {
      const newWeapons = [...s.weapons] as (Weapon | null)[];
      // Find existing slot of same type
      const existingIdx = newWeapons.findIndex(w => w?.type === weapon.type);
      if (existingIdx >= 0 && newWeapons[existingIdx]) {
        (newWeapons[existingIdx] as Weapon).ammo = Math.min((newWeapons[existingIdx] as Weapon).maxAmmo, (newWeapons[existingIdx] as Weapon).ammo + weapon.ammo);
        return { weapons: newWeapons };
      }
      // Find empty slot (skip slot 0 which is pickaxe)
      const emptySlot = newWeapons.findIndex((w, i) => i > 0 && w === null);
      if (emptySlot >= 0) {
        newWeapons[emptySlot] = weapon;
        return { weapons: newWeapons };
      }
      // Replace active slot (not pickaxe)
      const active = s.activeSlot > 0 ? s.activeSlot : 1;
      newWeapons[active] = weapon;
      return { weapons: newWeapons, currentWeapon: weapon };
    });
  },

  shootWeapon: () => {
    const s = get();
    if (!s.currentWeapon || s.isReloading) return false;
    const w = s.currentWeapon;
    if (w.type === "Pickaxe") return true;
    if (w.ammo <= 0) { get().startReload(); return false; }
    const updated = { ...w, ammo: w.ammo - 1 };
    set((prev) => ({
      currentWeapon: updated,
      weapons: prev.weapons.map(ww => ww?.type === w.type && ww?.rarity === w.rarity ? updated : ww),
    }));
    return true;
  },

  startReload: () => {
    const s = get();
    if (s.isReloading || !s.currentWeapon || s.currentWeapon.type === "Pickaxe") return;
    if (s.currentWeapon.ammo === s.currentWeapon.maxAmmo) return;
    set({ isReloading: true });
    setTimeout(() => get().finishReload(), s.currentWeapon.reloadTime);
  },

  finishReload: () => {
    const s = get();
    if (!s.currentWeapon) return;
    const reloaded = { ...s.currentWeapon, ammo: s.currentWeapon.maxAmmo };
    set((prev) => ({
      isReloading: false,
      currentWeapon: reloaded,
      weapons: prev.weapons.map(w => w?.type === reloaded.type && w?.rarity === reloaded.rarity ? reloaded : w),
    }));
  },

  toggleBuildMode: () => set((s) => ({ buildMode: !s.buildMode })),
  setSelectedBuildPiece: (piece) => set({ selectedBuildPiece: piece }),
  setActiveMaterial: (mat) => set({ activeMaterial: mat }),
  addMaterial: (mat, amount) => set((s) => ({ materials: { ...s.materials, [mat]: s.materials[mat] + amount } })),
  spendMaterial: (mat, amount) => {
    const { materials } = get();
    if (materials[mat] < amount) return false;
    set((s) => ({ materials: { ...s.materials, [mat]: s.materials[mat] - amount } }));
    return true;
  },

  setStorm: (radius, center) => set({ stormRadius: radius, stormCenter: center }),
  setInStorm: (v) => set({ inStorm: v }),
  setADS: (v) => set({ isADS: v }),
  setSprinting: (v) => set({ isSprinting: v }),
  setSliding: (v) => set({ isSliding: v }),

  useTactical: () => {
    const s = get();
    if (s.tacticalCooldown > 0) return;
    set({ tacticalCooldown: 15 });
    get().heal(25);
    get().addShield(15);
  },

  useUltimate: () => {
    const s = get();
    if (s.ultimateCooldown > 0) return;
    set({ ultimateCooldown: 60 });
    get().addShield(50);
    get().addMaterial("wood", 100);
    get().addMaterial("stone", 50);
  },

  addDamageNumber: (value, screenX, screenY, isCritical = false) => {
    const id = `dmg_${Date.now()}_${Math.random()}`;
    const dn: DamageNumber = { id, value, position: { x: screenX, y: screenY }, color: isCritical ? "#ff4444" : "#ffffff", createdAt: Date.now(), isCritical };
    set((s) => ({ damageNumbers: [...s.damageNumbers.slice(-15), dn] }));
    setTimeout(() => get().removeDamageNumber(id), 1200);
  },

  removeDamageNumber: (id) => set((s) => ({ damageNumbers: s.damageNumbers.filter(d => d.id !== id) })),

  setLocationName: (name) => set({ locationName: name }),

  addXP: (amount) => set((s) => {
    const newXP = s.xp + amount;
    const newLevel = Math.floor(newXP / 1000) + 1;
    return { xp: newXP, level: newLevel };
  }),

  reset: () => set({
    ...defaultState,
    stormCenter: new THREE.Vector2(0, 0),
    weapons: [{ ...WEAPONS.Pickaxe }, { ...WEAPONS.AR }, null, null, null] as (Weapon | null)[],
    materials: { wood: 200, stone: 100, metal: 50 },
    killFeed: [],
    damageNumbers: [],
  }),
}));
