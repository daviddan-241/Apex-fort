import { Router, type IRouter } from "express";
import { ListCharactersResponse, GetCharacterResponse, GetCharacterParams } from "@workspace/api-zod";

const router: IRouter = Router();

const characters = [
  {
    id: "ghost-reaper",
    name: "Ghost Reaper",
    role: "Stealth",
    archetype: "Cyber-Ninja Operative",
    description: "A shadow operative engineered by black-budget military programs. Reaper moves through war zones like smoke — unseen, unfelt, devastating.",
    backstory: "Former NSA black-ops asset turned rogue after his entire unit was erased from official records. Reaper surgically modified his nervous system with military-grade cybernetics, giving him inhuman reflexes and the ability to bend light around his body. He fights not for country or cause — only for the thrill of perfecting his art.",
    playstyle: "Aggressive flanker and assassin. Use smoke to close distance, wall-run to gain vertical advantage, then eliminate targets before they know you're there. Ultimate is best deployed in squad wipes.",
    rarity: "Legendary",
    abilities: [
      { name: "Shadow Step", type: "passive", description: "Movement makes no sound. Sprinting leaves no footprints. Enemy detection radius reduced by 40%.", cooldown: null, damage: null, range: null },
      { name: "Smoke Veil", type: "tactical", description: "Deploy a 12m smoke cloud that blocks vision and reveals enemies inside to Reaper's HUD via thermal overlay.", cooldown: "18s", damage: null, range: "12m radius" },
      { name: "Phantom Surge", type: "ultimate", description: "Become fully invisible for 8 seconds with 30% movement speed bonus. Kills during Phantom Surge reset its cooldown.", cooldown: "90s", damage: null, range: null }
    ],
    passiveBonus: "Silent movement + 40% reduced detection radius",
    stats: { health: 75, armor: 50, speed: 95, ability_power: 80, weapon_accuracy: 90 }
  },
  {
    id: "ironclad",
    name: "Ironclad",
    role: "Tank",
    archetype: "Special Forces Heavy",
    description: "A walking fortress wrapped in custom-fabricated reactive armor. Where others fall back, Ironclad advances.",
    backstory: "Sergeant Marcus 'Ironclad' Voss survived three tours of urban combat where his entire squad was annihilated. The military rebuilt him — not as a soldier, but as a weapons platform. His suit integrates experimental reactive plating and an onboard tactical AI that calculates optimal cover positions in real-time.",
    playstyle: "Frontline anchor and shield for your squad. Advance under Barrier Dome, soak damage, and use Tactical Strike to punish enemies who cluster. Pairs exceptionally well with Support operators.",
    rarity: "Legendary",
    abilities: [
      { name: "Reactive Plating", type: "passive", description: "Absorbs 15% of incoming damage as bonus shield regeneration. Heavy weapon handling speed increased by 25%.", cooldown: null, damage: null, range: null },
      { name: "Barrier Dome", type: "tactical", description: "Deploy a 6m radius energy barrier for 6 seconds. Allies inside gain 25% damage resistance. Bullets cannot penetrate from outside.", cooldown: "22s", damage: null, range: "6m radius" },
      { name: "Orbital Strike", type: "ultimate", description: "Call in a precision orbital bombardment on a targeted 15m zone. Deals 250 damage over 5 seconds with Chaos Physics destruction.", cooldown: "120s", damage: "250 (AOE)", range: "15m zone" }
    ],
    passiveBonus: "15% damage absorption as shield regen + 25% heavy weapon speed",
    stats: { health: 100, armor: 95, speed: 55, ability_power: 75, weapon_accuracy: 70 }
  },
  {
    id: "wraith-blade",
    name: "Wraith Blade",
    role: "Assault",
    archetype: "Battle-Hardened Soldier",
    description: "Combat-scarred mercenary who fights with machine precision and zero hesitation. Every bullet has a purpose.",
    backstory: "Elena 'Wraith Blade' Varga spent 12 years running private military contracts across five conflict zones. Her body carries 23 recorded injuries — each one a story she doesn't tell. She treats the battlefield like a chess board, always three moves ahead, exploiting every terrain feature and enemy mistake.",
    playstyle: "Aggressive mid-range fighter. Deploy drone for intel before pushing, use tactical strike to flush enemies from cover, then close and eliminate. High skill ceiling — mastery unlocks devastating combo potential.",
    rarity: "Epic",
    abilities: [
      { name: "Combat Conditioning", type: "passive", description: "Health regeneration begins 2 seconds faster after taking damage. Slide distance increased by 40%.", cooldown: null, damage: null, range: null },
      { name: "Recon Drone", type: "tactical", description: "Deploy a fast recon drone for 12 seconds that marks all enemies within 30m and shares data with squad.", cooldown: "25s", damage: null, range: "30m scan" },
      { name: "Tactical Strike", type: "ultimate", description: "Call in a targeted missile strike on a marked location. 180 damage with 8m blast radius and Chaos Physics destruction.", cooldown: "100s", damage: "180 (AOE)", range: "8m blast" }
    ],
    passiveBonus: "Health regen 2s faster + 40% increased slide distance",
    stats: { health: 85, armor: 70, speed: 80, ability_power: 70, weapon_accuracy: 85 }
  },
  {
    id: "specter",
    name: "Specter",
    role: "Recon",
    archetype: "Stealthy Assassin",
    description: "An intelligence operative who turns information into power. Specter sees everything — and remains unseen.",
    backstory: "No confirmed identity. No confirmed nationality. Intelligence agencies across 12 countries have fragments of a file on an operative who simply doesn't exist in any database. Specter may be a person, or a program — few who've met her are alive to clarify.",
    playstyle: "Passive-aggressive intel operator. Gather information, reveal enemy positions to your squad, then exploit the intel to pick perfect engagement angles. Never engage straight up — always have the information advantage.",
    rarity: "Epic",
    abilities: [
      { name: "Ghost Protocol", type: "passive", description: "Does not appear on enemy minimaps while crouching. Footstep sounds muffled by 60%.", cooldown: null, damage: null, range: null },
      { name: "Pulse Scan", type: "tactical", description: "Emit an EMP pulse in 40m radius. Reveals all enemy positions for 8 seconds. Disables enemy electronics for 3 seconds.", cooldown: "20s", damage: "15 (EMP)", range: "40m radius" },
      { name: "Blackout", type: "ultimate", description: "Deploy a signal blackout field in 25m radius for 12 seconds. Disables all enemy HUDs, minimaps, and tactical abilities in the zone.", cooldown: "110s", damage: null, range: "25m radius" }
    ],
    passiveBonus: "Minimap invisible while crouching + 60% footstep suppression",
    stats: { health: 70, armor: 55, speed: 90, ability_power: 85, weapon_accuracy: 88 }
  },
  {
    id: "vanguard",
    name: "Vanguard",
    role: "Support",
    archetype: "Combat Medic",
    description: "The operator who stands between death and survival for his entire squad. Vanguard's revives have turned certain defeats into legendary victories.",
    backstory: "Dr. James 'Vanguard' Okafor was a trauma surgeon in three active conflict zones before he realized bullets needed stopping, not just their victims. He retrained as a combat medic and operator, combining battlefield surgical skill with offensive capability. His squad has the lowest casualty rate of any active unit.",
    playstyle: "Squad backbone. Keep allies alive, revive fallen teammates under fire, and use your shield ultimate to protect the squad during high-pressure engagements. Passive healing field enables sustained fights others can't survive.",
    rarity: "Rare",
    abilities: [
      { name: "Aura of Restoration", type: "passive", description: "Passive healing aura: allies within 8m regenerate 3 HP/second. Vanguard revives 60% faster.", cooldown: null, damage: null, range: "8m aura" },
      { name: "Med Surge", type: "tactical", description: "Instantly restore 60 HP to a targeted ally. If ally is downed, revive them in 1.5 seconds with 50% HP.", cooldown: "16s", damage: null, range: "15m range" },
      { name: "Fortress Shield", type: "ultimate", description: "Project a 10m dome shield around Vanguard for 10 seconds. Allies inside are fully immune to damage.", cooldown: "130s", damage: null, range: "10m dome" }
    ],
    passiveBonus: "8m passive heal aura (3 HP/s) + 60% faster revives",
    stats: { health: 90, armor: 65, speed: 70, ability_power: 95, weapon_accuracy: 65 }
  },
  {
    id: "jackal",
    name: "Jackal",
    role: "Specialist",
    archetype: "Master Thief & Trap Engineer",
    description: "Equal parts criminal genius and battlefield architect. Jackal turns every environment into a death maze of his own design.",
    backstory: "Born into a crime syndicate, Nico 'Jackal' Torres learned to read environments like blueprints by age 12. By 20 he'd pulled off heists that embarrassed three intelligence agencies. Now he uses that skill set on a larger stage — treating battlefields as heist targets, deploying traps that would make any engineer weep with envy.",
    playstyle: "Environmental control and area denial. Trap routes before enemies arrive, grapple to unexpected positions, and use the Supply Cache ultimate to swing late-game loot advantage in your favor.",
    rarity: "Epic",
    abilities: [
      { name: "Opportunist", type: "passive", description: "Loot speed increased by 50%. Items looted have 20% chance to be one rarity higher. Chest locations visible on minimap within 60m.", cooldown: null, damage: null, range: "60m detection" },
      { name: "Proximity Trap", type: "tactical", description: "Deploy an invisible pressure-mine trap. Triggers on enemy proximity — deals 80 damage and reveals enemy position for 10 seconds.", cooldown: "14s", damage: "80", range: "3m trigger radius" },
      { name: "Supply Cache", type: "ultimate", description: "Summon a mythic-tier supply cache containing guaranteed Legendary+ loot. Can be shared with squad. Cache attracts storm resistance bubble.", cooldown: "150s", damage: null, range: null }
    ],
    passiveBonus: "50% faster looting + 20% rarity upgrade chance + 60m chest radar",
    stats: { health: 80, armor: 60, speed: 85, ability_power: 75, weapon_accuracy: 80 }
  },
  {
    id: "titan",
    name: "Titan",
    role: "Tank",
    archetype: "Mythical Warrior",
    description: "A warrior whose origins blur the line between soldier and legend. Titan's combat style draws from ancient warrior traditions fused with modern brutality.",
    backstory: "Ares Koval's file lists his birthplace as somewhere in Eastern Europe, his training as 'classified', and his combat record as 'extraordinary'. Special operators who've fought alongside him describe a man who seems to absorb punishment that would kill anyone else, and who fights with a calm ferocity that borders on the supernatural.",
    playstyle: "Unstoppable close-range force. Use Earthshatter to clear buildings, Juggernaut charge to engage on your terms, and War Cry to amplify your squad in decisive teamfights.",
    rarity: "Legendary",
    abilities: [
      { name: "Indomitable", type: "passive", description: "Cannot be staggered or knocked back. Last 25 HP triggers Rage state: +30% damage output, -20% damage taken for 8 seconds.", cooldown: null, damage: null, range: null },
      { name: "Earthshatter", type: "tactical", description: "Slam the ground with devastating force. 50 damage + knockback in 5m radius. Destroys cover structures (Chaos Physics).", cooldown: "20s", damage: "50 (AOE)", range: "5m radius" },
      { name: "Juggernaut", type: "ultimate", description: "Enter Juggernaut state for 12 seconds: 50% damage resistance, unlimited sprint, structures destroyed on contact. Charges through walls.", cooldown: "120s", damage: "Contact damage", range: "Forward charge" }
    ],
    passiveBonus: "Stagger immune + Last Stand rage state (25 HP threshold)",
    stats: { health: 95, armor: 90, speed: 60, ability_power: 80, weapon_accuracy: 65 }
  },
  {
    id: "cipher",
    name: "Cipher",
    role: "Recon",
    archetype: "Anti-Hero Hacker",
    description: "A digital ghost who weaponizes the battlefield's own systems against it. Cipher doesn't fight fair — he makes sure no one else can either.",
    backstory: "Known only by the handle 'Cipher', this former intelligence analyst turned weapons against the state that created him. He hacked military satellite networks from a beach in Thailand, rewrote drone firmware mid-mission, and once crashed an entire regional power grid as a distraction. Now he fights on the ground, but his real battlefield is digital.",
    playstyle: "Information warfare and equipment denial. Hack enemies to expose and weaken them, exploit their own systems for intel, and use Network Crash to neutralize ability-heavy opponents.",
    rarity: "Rare",
    abilities: [
      { name: "System Exploit", type: "passive", description: "Hacked enemies take 15% extra damage from all sources. Electronic equipment in 20m radius gives off visible signals on HUD.", cooldown: null, damage: null, range: "20m detection" },
      { name: "Data Breach", type: "tactical", description: "Hack a targeted enemy for 6 seconds: reveals their position to squad, disables their tactical ability, applies 15% damage vulnerability.", cooldown: "22s", damage: null, range: "25m range" },
      { name: "Network Crash", type: "ultimate", description: "Deploy a signal disruptor bomb that crashes all enemy abilities, HUDs, and electronics in 35m for 15 seconds.", cooldown: "115s", damage: null, range: "35m radius" }
    ],
    passiveBonus: "Hacked enemies take 15% extra damage + 20m electronic detection",
    stats: { health: 72, armor: 50, speed: 88, ability_power: 92, weapon_accuracy: 82 }
  }
];

router.get("/characters", async (_req, res): Promise<void> => {
  res.json(ListCharactersResponse.parse(characters));
});

router.get("/characters/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCharacterParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const character = characters.find(c => c.id === params.data.id);
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json(GetCharacterResponse.parse(character));
});

export default router;
