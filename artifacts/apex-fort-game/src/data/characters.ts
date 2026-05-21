export interface CharacterAbility {
  name: string;
  type: "passive" | "tactical" | "ultimate";
  description: string;
  cooldown: number;
  key?: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  archetype: string;
  description: string;
  rarity: string;
  color: string;
  glowColor: string;
  abilities: CharacterAbility[];
  stats: {
    health: number;
    armor: number;
    speed: number;
    abilityPower: number;
    accuracy: number;
  };
  tacticalCooldown: number;
  ultimateCooldown: number;
}

export const CHARACTERS: Character[] = [
  {
    id: "ghost-reaper",
    name: "Ghost Reaper",
    role: "Stealth",
    archetype: "Cyber-Ninja Operative",
    description: "A shadow operative who moves unseen through war zones. Smoke, wall-run, and vanish.",
    rarity: "Legendary",
    color: "#6366f1",
    glowColor: "#818cf8",
    stats: { health: 75, armor: 50, speed: 95, abilityPower: 80, accuracy: 90 },
    tacticalCooldown: 18,
    ultimateCooldown: 90,
    abilities: [
      { name: "Shadow Step", type: "passive", description: "No footstep sounds. 40% reduced detection.", cooldown: 0 },
      { name: "Smoke Veil", type: "tactical", description: "Deploy smoke cloud. Enemies visible through thermal.", cooldown: 18, key: "Q" },
      { name: "Phantom Surge", type: "ultimate", description: "8s invisibility + 30% speed bonus. Kills reset cooldown.", cooldown: 90, key: "F" },
    ],
  },
  {
    id: "ironclad",
    name: "Ironclad",
    role: "Tank",
    archetype: "Special Forces Heavy",
    description: "A walking fortress in reactive armor. Advance under fire, shield teammates, call orbital strikes.",
    rarity: "Legendary",
    color: "#64748b",
    glowColor: "#94a3b8",
    stats: { health: 100, armor: 95, speed: 55, abilityPower: 75, accuracy: 70 },
    tacticalCooldown: 22,
    ultimateCooldown: 120,
    abilities: [
      { name: "Reactive Plating", type: "passive", description: "Absorbs 15% damage as shield regen.", cooldown: 0 },
      { name: "Barrier Dome", type: "tactical", description: "6m energy barrier for 6s. Allies gain 25% resist.", cooldown: 22, key: "Q" },
      { name: "Orbital Strike", type: "ultimate", description: "Call orbital bombardment. 250 AOE damage.", cooldown: 120, key: "F" },
    ],
  },
  {
    id: "wraith-blade",
    name: "Wraith Blade",
    role: "Assault",
    archetype: "Battle-Hardened Soldier",
    description: "Combat-scarred mercenary. Recon drone, tactical strike, aggressive flanker.",
    rarity: "Epic",
    color: "#ef4444",
    glowColor: "#f87171",
    stats: { health: 85, armor: 70, speed: 80, abilityPower: 70, accuracy: 85 },
    tacticalCooldown: 25,
    ultimateCooldown: 100,
    abilities: [
      { name: "Combat Conditioning", type: "passive", description: "Health regen starts 2s faster. Slide distance +40%.", cooldown: 0 },
      { name: "Recon Drone", type: "tactical", description: "Deploy drone. Marks enemies in 30m for squad.", cooldown: 25, key: "Q" },
      { name: "Tactical Strike", type: "ultimate", description: "Missile strike: 180 AOE damage, 8m blast.", cooldown: 100, key: "F" },
    ],
  },
  {
    id: "specter",
    name: "Specter",
    role: "Recon",
    archetype: "Stealthy Assassin",
    description: "Intel operative. Pulse scan reveals enemies. Blackout disables all enemy systems.",
    rarity: "Epic",
    color: "#8b5cf6",
    glowColor: "#a78bfa",
    stats: { health: 70, armor: 55, speed: 90, abilityPower: 85, accuracy: 88 },
    tacticalCooldown: 20,
    ultimateCooldown: 110,
    abilities: [
      { name: "Ghost Protocol", type: "passive", description: "Invisible on minimap while crouching. Footsteps -60%.", cooldown: 0 },
      { name: "Pulse Scan", type: "tactical", description: "EMP pulse 40m. Reveals enemies for 8s.", cooldown: 20, key: "Q" },
      { name: "Blackout", type: "ultimate", description: "Signal blackout 25m for 12s. Disables enemy HUDs.", cooldown: 110, key: "F" },
    ],
  },
  {
    id: "vanguard",
    name: "Vanguard",
    role: "Support",
    archetype: "Combat Medic",
    description: "Squad backbone. Healing aura, instant revives, full damage-immune fortress shield.",
    rarity: "Rare",
    color: "#22c55e",
    glowColor: "#4ade80",
    stats: { health: 90, armor: 65, speed: 70, abilityPower: 95, accuracy: 65 },
    tacticalCooldown: 16,
    ultimateCooldown: 130,
    abilities: [
      { name: "Aura of Restoration", type: "passive", description: "Allies in 8m regen 3 HP/s. Revive 60% faster.", cooldown: 0 },
      { name: "Med Surge", type: "tactical", description: "Restore 60 HP to target or revive downed ally.", cooldown: 16, key: "Q" },
      { name: "Fortress Shield", type: "ultimate", description: "10m dome. Allies inside fully immune for 10s.", cooldown: 130, key: "F" },
    ],
  },
  {
    id: "jackal",
    name: "Jackal",
    role: "Specialist",
    archetype: "Master Thief & Trap Engineer",
    description: "Trap master and loot expert. Invisible mines, 60m chest radar, and mythic supply drops.",
    rarity: "Epic",
    color: "#f59e0b",
    glowColor: "#fbbf24",
    stats: { health: 80, armor: 60, speed: 85, abilityPower: 75, accuracy: 80 },
    tacticalCooldown: 14,
    ultimateCooldown: 150,
    abilities: [
      { name: "Opportunist", type: "passive", description: "Loot 50% faster. 20% rarity upgrade. 60m chest radar.", cooldown: 0 },
      { name: "Proximity Trap", type: "tactical", description: "Invisible mine. 80 damage + 10s reveal on trigger.", cooldown: 14, key: "Q" },
      { name: "Supply Cache", type: "ultimate", description: "Summon mythic-tier supply cache for squad.", cooldown: 150, key: "F" },
    ],
  },
  {
    id: "titan",
    name: "Titan",
    role: "Tank",
    archetype: "Mythical Warrior",
    description: "Unstoppable heavy. Earthshatter clears cover. Juggernaut charges through walls.",
    rarity: "Legendary",
    color: "#dc2626",
    glowColor: "#ef4444",
    stats: { health: 95, armor: 90, speed: 60, abilityPower: 80, accuracy: 65 },
    tacticalCooldown: 20,
    ultimateCooldown: 120,
    abilities: [
      { name: "Indomitable", type: "passive", description: "Cannot be staggered. At 25HP: +30% damage, -20% taken.", cooldown: 0 },
      { name: "Earthshatter", type: "tactical", description: "Ground slam: 50 damage + 5m knockback + destroys cover.", cooldown: 20, key: "Q" },
      { name: "Juggernaut", type: "ultimate", description: "12s: 50% resist, unlimited sprint, charge through walls.", cooldown: 120, key: "F" },
    ],
  },
  {
    id: "cipher",
    name: "Cipher",
    role: "Recon",
    archetype: "Anti-Hero Hacker",
    description: "Digital warfare specialist. Hack enemies to expose and debuff. Network crash disables all.",
    rarity: "Rare",
    color: "#06b6d4",
    glowColor: "#22d3ee",
    stats: { health: 72, armor: 50, speed: 88, abilityPower: 92, accuracy: 82 },
    tacticalCooldown: 22,
    ultimateCooldown: 115,
    abilities: [
      { name: "System Exploit", type: "passive", description: "Hacked enemies take +15% damage. 20m electronic radar.", cooldown: 0 },
      { name: "Data Breach", type: "tactical", description: "Hack target: reveal 6s, disable tactical, +15% vuln.", cooldown: 22, key: "Q" },
      { name: "Network Crash", type: "ultimate", description: "Crash all enemy abilities+HUDs in 35m for 15s.", cooldown: 115, key: "F" },
    ],
  },
];

export const getCharacter = (id: string) => CHARACTERS.find(c => c.id === id) ?? CHARACTERS[2];
