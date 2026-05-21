import { Router, type IRouter } from "express";
import { ListSystemsResponse, GetSystemResponse, GetSystemParams } from "@workspace/api-zod";

const router: IRouter = Router();

const systems = [
  {
    id: "building-destruction",
    name: "Hybrid Building & Destruction",
    category: "Building",
    overview: "A Fortnite-inspired fast-build system layered on top of Unreal Engine 5's Chaos Physics destruction pipeline. Players can construct structures from harvested materials (wood, stone, metal, concrete) at high speed, while those same structures can be realistically destroyed by weapons, explosives, and vehicles.",
    components: [
      {
        name: "Resource Harvesting",
        description: "Players harvest materials from the environment using their pickaxe or weapons.",
        details: [
          "Wood: trees, fences, wooden structures (fastest harvest, weakest build)",
          "Stone: rocks, brick walls, concrete (medium speed, medium strength)",
          "Metal: vehicles, industrial objects (slowest, strongest)",
          "Each material has unique structural HP: Wood 150, Stone 300, Metal 500",
          "Harvesting triggers Niagara particle systems per material type"
        ]
      },
      {
        name: "Fast Build System",
        description: "Blueprint-driven grid-snap building system with UE5 procedural mesh generation.",
        details: [
          "Build pieces: Wall, Floor, Ramp, Roof, Cone, Stair, Trap mount",
          "180ms average build time per piece (keyboard: Q/E/F/V/T shortcuts)",
          "Ghost preview mesh rendered in real-time before placement",
          "Edit mode: highlight sections to modify piece geometry",
          "Build piece HP shown via HUD damage overlay",
          "Controller support: separate Build Mode with d-pad piece selection"
        ]
      },
      {
        name: "Chaos Physics Destruction",
        description: "Geometry Collection assets processed through UE5 Chaos physics for realistic fracture and destruction.",
        details: [
          "All structures and environment geometry use Chaos Destruction fields",
          "Damage states: Intact → Damaged (50% HP) → Critical (20% HP) → Destroyed",
          "Voronoi fracture patterns tuned per material type",
          "Destruction triggers Niagara debris particle emitters",
          "Networked destruction state replication via Fast Array Serialization",
          "Performance: LOD-based physics simulation (full sim within 50m of player)"
        ]
      },
      {
        name: "Edit System",
        description: "Grid-based editing of existing build pieces to create windows, doors, and structural variants.",
        details: [
          "2x2 or 3x3 grid overlay per piece for selective section removal",
          "Edit presets: Window, Door, Half-wall, Arch",
          "Edit cooldown: 0.15s to prevent spam",
          "Confirmed edits immediately rebuild the geometry with edited shape",
          "Edit history tracked for undo during build phase"
        ]
      }
    ],
    technicalNotes: [
      "Use UProceduralMeshComponent for real-time build piece generation",
      "Chaos Geometry Collections pre-fractured offline, streamed on demand",
      "Network authority: server authoritative on all placements and destructions",
      "GAS Integration: Build actions implemented as UGameplayAbility subclasses",
      "Performance target: 500+ simultaneous active Chaos bodies at 60 FPS on RTX 3070"
    ],
    codeSnippet: `// UBuildingComponent.h - Core building system
UCLASS()
class APEXFORT_API UBuildingComponent : public UActorComponent {
    GENERATED_BODY()
public:
    UPROPERTY(EditDefaultsOnly, Category="Building")
    TMap<EBuildMaterial, TSubclassOf<ABuildPiece>> BuildPieceClasses;
    
    UPROPERTY(EditDefaultsOnly, Category="Building")
    float BuildSnapGridSize = 100.0f;
    
    UFUNCTION(Server, Reliable)
    void ServerPlaceBuildPiece(EBuildPieceType Type, FTransform PlaceTransform, EBuildMaterial Material);
    
    UFUNCTION(Server, Reliable)
    void ServerEditBuildPiece(ABuildPiece* TargetPiece, TArray<int32> EditedSections);
    
    bool TryConsumeMaterials(EBuildMaterial Material, int32 Amount);
    ABuildPiece* GetGhostPreviewPiece() const { return GhostPreview; }

private:
    UPROPERTY()
    ABuildPiece* GhostPreview;
    
    FIntVector SnapToGrid(FVector WorldLocation) const;
};`,
    language: "cpp"
  },
  {
    id: "gameplay-ability-system",
    name: "Gameplay Ability System (GAS)",
    category: "Combat",
    overview: "UE5's native Gameplay Ability System provides the backbone for all character abilities. Each character has a custom AbilitySystemComponent with AttributeSets defining health, armor, speed, and ability power. Abilities are implemented as UGameplayAbility subclasses with Blueprint-exposed parameters for designer iteration.",
    components: [
      {
        name: "Attribute Sets",
        description: "Structured C++ AttributeSets defining all character stats with GAS replication.",
        details: [
          "UApexAttributeSet: Health, MaxHealth, Armor, MaxArmor, Speed, AbilityPower, WeaponAccuracy",
          "StormDamageImmunity float attribute for ability-based storm resistance",
          "All attributes replicated to owning client with prediction",
          "Clamp delegates prevent out-of-range values",
          "MetaAttribute: DamageToApply (virtual damage calculation sink)"
        ]
      },
      {
        name: "Ability Classes",
        description: "Each operator has three unique abilities: Passive (always active), Tactical (cooldown-gated), and Ultimate (long-cooldown, high-impact).",
        details: [
          "UApexPassiveAbility: Granted at spawn, never activated manually, listens to GAS events",
          "UApexTacticalAbility: Player-activated, cooldown enforced via Gameplay Effect",
          "UApexUltimateAbility: Requires ability charge (accumulated from eliminations/time)",
          "Blueprint subclasses per character for VFX, audio, and design iteration",
          "Ability cancellation handled via AbilityTag system",
          "Network prediction with client-side activation and server validation"
        ]
      },
      {
        name: "Gameplay Effects",
        description: "Standardized Gameplay Effects for damage, healing, buffs, debuffs, and cooldowns.",
        details: [
          "GE_Damage: Duration Instant, uses DamageToApply MetaAttribute",
          "GE_Heal: Duration Instant, adds to Health attribute",
          "GE_Cooldown_Tactical / GE_Cooldown_Ultimate: Duration-based timer effects",
          "GE_StormDamage: Periodic tick damage during storm exposure",
          "GE_SpeedBuff / GE_SpeedDebuff: Duration modifier effects",
          "GE_InfiniteRegen: Infinite duration for Vanguard's healing aura"
        ]
      },
      {
        name: "Gameplay Tags",
        description: "Hierarchical tag system governing ability interactions and state communication.",
        details: [
          "Ability.Passive.* / Ability.Tactical.* / Ability.Ultimate.* namespaces",
          "State.Invisible, State.Stunned, State.Downed, State.Invulnerable",
          "Damage.Type.Ballistic, Damage.Type.Explosive, Damage.Type.Storm",
          "Character.Role.Stealth, Character.Role.Tank, Character.Role.Support",
          "Block tags prevent conflicting abilities from activating simultaneously"
        ]
      }
    ],
    technicalNotes: [
      "AbilitySystemComponent lives on PlayerState for persistence across pawn respawns",
      "AvatarActor (the Character pawn) changes on respawn; ASC stays on PlayerState",
      "Use FGameplayEffectContextHandle for damage source tracking",
      "Passive abilities use Always tag requirement — no input binding",
      "Replicated attributes use GAMEPLAYATTRIBUTE_REPNOTIFY macro pattern"
    ],
    codeSnippet: `// UApexAttributeSet.h
UCLASS()
class APEXFORT_API UApexAttributeSet : public UAttributeSet {
    GENERATED_BODY()
public:
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_Health)
    FGameplayAttributeData Health;
    ATTRIBUTE_ACCESSORS(UApexAttributeSet, Health)
    
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing=OnRep_Armor)
    FGameplayAttributeData Armor;
    ATTRIBUTE_ACCESSORS(UApexAttributeSet, Armor)
    
    UPROPERTY(BlueprintReadOnly, Replicated)
    FGameplayAttributeData Speed;
    ATTRIBUTE_ACCESSORS(UApexAttributeSet, Speed)
    
    // Virtual MetaAttribute — not replicated, used in damage calc
    UPROPERTY(BlueprintReadOnly)
    FGameplayAttributeData DamageToApply;
    ATTRIBUTE_ACCESSORS(UApexAttributeSet, DamageToApply)
    
    virtual void PostGameplayEffectExecute(
        const FGameplayEffectModCallbackData& Data) override;
    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;
};`,
    language: "cpp"
  },
  {
    id: "ai-bot-system",
    name: "AI Bot Intelligence System",
    category: "AI",
    overview: "Behavior Tree-driven AI opponents with Environment Query System (EQS) for tactical positioning. Bots scale in difficulty from passive newcomers to aggressive pro-level opponents. They build, edit, use abilities, drive vehicles, and adapt to storm movement — making them nearly indistinguishable from real players.",
    components: [
      {
        name: "Behavior Tree Architecture",
        description: "Multi-layer BT with high-level strategy selection and low-level execution tasks.",
        details: [
          "Root: Selector between Storm Avoidance, Combat, Looting, Patrolling",
          "Combat subtree: Engage → Flank → Build Cover → Aim → Fire",
          "Looting subtree: EQS navigate to loot → Harvest → Evaluate loadout",
          "Storm subtree: Calculate safe zone path → Sprint to safety → Build on arrival",
          "Third-party detection: react to nearby gunfire even when not primary target"
        ]
      },
      {
        name: "Environment Query System",
        description: "EQS queries for optimal positioning, cover evaluation, and loot navigation.",
        details: [
          "EQS_FindCover: score positions by cover quality, distance to target, storm safety",
          "EQS_FlankPosition: find lateral attack angles while staying out of enemy FOV",
          "EQS_LootNavigation: path to highest-priority nearby loot based on loadout gaps",
          "EQS_BuildPosition: optimal build placement to gain height advantage",
          "All EQS queries run asynchronously on separate thread pool"
        ]
      },
      {
        name: "Difficulty Scaling",
        description: "Continuous skill scaling from bot skill level 1 (beginner) to 10 (pro-player simulation).",
        details: [
          "Aim: reaction time (600ms → 150ms), tracking accuracy (60% → 95%), aim shake amount",
          "Decision: action frequency, third-party aggression, flank likelihood",
          "Building: no building → basic builds → fast building → pro edits",
          "Abilities: never uses → uses tacticals → uses all optimally",
          "Loot efficiency: slow/greedy → fast/strategic",
          "Difficulty auto-scales based on player skill rating from match history"
        ]
      },
      {
        name: "Perception System",
        description: "UE5 AI Perception System with sight, hearing, and damage senses.",
        details: [
          "Sight: 120° FOV, 5000cm range, 0.1s update interval",
          "Hearing: responds to gunfire, footsteps, vehicle engines within 3000cm",
          "Damage sense: always reacts to taking damage regardless of sight/hearing",
          "Memory decay: last known position tracked for 8 seconds after losing sight",
          "Team communication: share detected target positions via Blackboard broadcast"
        ]
      }
    ],
    technicalNotes: [
      "Bot GameMode spawns bots via UBotSpawnerComponent — not player controllers",
      "Each bot has its own UApexAIController with dedicated Blackboard instance",
      "Bots use same GAS AttributeSet and abilities as human players",
      "Bot building uses same UBuildingComponent as humans — no special-cased logic",
      "Performance: AI update throttled at >50 bots — low-priority bots run at 0.5s tick"
    ],
    codeSnippet: `// UApexAIController.h
UCLASS()
class APEXFORT_API AApexAIController : public AAIController {
    GENERATED_BODY()
public:
    UPROPERTY(EditDefaultsOnly, Category="AI")
    UBehaviorTree* BehaviorTreeAsset;
    
    UPROPERTY(EditDefaultsOnly, Category="AI")
    float BotSkillLevel = 5.0f; // 1.0 = novice, 10.0 = pro
    
    virtual void OnPossess(APawn* InPawn) override;
    
    // Called when perception system detects a stimulus
    UFUNCTION()
    void OnTargetPerceptionUpdated(AActor* Actor, FAIStimulus Stimulus);
    
    // Dynamic difficulty adjustment from match performance data
    void AdjustDifficultyFromMatchStats(const FApexMatchStats& Stats);
    
private:
    UPROPERTY()
    UAIPerceptionComponent* PerceptionComponent;
    
    float GetAimReactionTime() const;
    float GetAimAccuracy() const;
    bool ShouldUseAbility(EAbilityType Type) const;
};`,
    language: "cpp"
  },
  {
    id: "storm-system",
    name: "Storm Circle System",
    category: "World",
    overview: "A multi-phase shrinking storm circle that deals escalating damage to players outside its boundary. The storm uses a dynamic material with Niagara-based visual effects, real-time boundary rendering, and predictive path calculation for the minimap.",
    components: [
      {
        name: "Storm Phases",
        description: "9 configurable phases that shrink the safe zone and increase damage over time.",
        details: [
          "Phase 1: 300s wait, 90s shrink, 1 DPS, full map to 70% size",
          "Phase 2: 180s wait, 75s shrink, 3 DPS",
          "Phase 3: 120s wait, 60s shrink, 5 DPS",
          "Phase 4-6: 90s waits, escalating damage (10/20/35 DPS)",
          "Phase 7-9: 60s waits, lethal damage (50/75/100 DPS), tiny circles",
          "Final zone: 1m diameter, instant death — forces final confrontation"
        ]
      },
      {
        name: "Visual Representation",
        description: "Dynamic material-based storm wall with Niagara particle effects.",
        details: [
          "Storm wall: cylindrical dynamic mesh with scrolling electrical/fog material",
          "Niagara: lightning arcs, dust particles, fog density gradient",
          "Eye of storm: clear interior, gradual density increase toward storm wall",
          "Post-process: desaturation + blue tint when inside storm",
          "Minimap: real-time circle rendering with current + next zone preview",
          "Sound design: escalating wind/electrical ambience based on storm proximity"
        ]
      },
      {
        name: "Damage System",
        description: "Storm damage applied as periodic Gameplay Effects to exposed players.",
        details: [
          "GE_StormDamage: periodic 0.5s tick applying phase-appropriate DPS",
          "Storm immunity: certain abilities grant temporary storm immunity",
          "Healing items partially offset storm damage in early phases",
          "Vehicles provide 30% storm damage reduction to occupants",
          "Storm damage bypasses shields — applies to health directly"
        ]
      }
    ],
    technicalNotes: [
      "AStormManager is a single persistent actor in GameMode — not replicated per-client",
      "Storm circle center and radius replicated via FVector + float to all clients",
      "IsInStorm() helper on Character checks distance from StormManager",
      "Lumen handles storm interior fog volumes dynamically",
      "Minimap circle drawn in Slate/UMG via custom SLeafWidget"
    ],
    codeSnippet: `// AStormManager.h - Storm system authority
UCLASS()
class APEXFORT_API AStormManager : public AActor {
    GENERATED_BODY()
public:
    UPROPERTY(EditDefaultsOnly, Category="Storm")
    TArray<FStormPhaseData> StormPhases;
    
    UFUNCTION(BlueprintCallable)
    bool IsLocationInStorm(FVector WorldLocation) const;
    
    UFUNCTION(BlueprintCallable)
    float GetTimeUntilNextPhase() const;
    
    UFUNCTION(BlueprintCallable)
    FVector GetNextCircleCenter() const { return NextCircleCenter; }

private:
    UPROPERTY(ReplicatedUsing=OnRep_StormData)
    FStormReplicationData StormData;
    
    FVector CurrentCircleCenter;
    FVector NextCircleCenter;
    float CurrentCircleRadius;
    float NextCircleRadius;
    int32 CurrentPhaseIndex = 0;
    FTimerHandle PhaseTimer;
    
    void AdvanceToNextPhase();
    void BeginShrinking();
    void ApplyStormDamageTick();
};`,
    language: "cpp"
  },
  {
    id: "vehicle-system",
    name: "Vehicle System",
    category: "Vehicles",
    overview: "Physics-based vehicles built on UE5 Chaos Vehicle Physics. All vehicles support realistic handling, destructible body panels, mounted weapons, and passenger occupancy. Vehicle damage is tracked per-component with realistic deformation.",
    components: [
      {
        name: "Vehicle Types",
        description: "Diverse vehicle roster covering different mobility and combat roles.",
        details: [
          "SUV (4-player): 600 HP, 2 mounted machine guns, cargo for loot transport",
          "Motorcycle (2-player): 300 HP, fastest land speed, no weapons, best maneuverability",
          "Armored Truck (4-player): 1200 HP, forward-mounted cannon, very slow",
          "ATV (2-player): 400 HP, off-road optimized, jump boost feature",
          "Military Jeep (4-player): 500 HP, rear-mounted minigun, good balance",
          "Transport Helicopter (5-player): 800 HP, aerial mobility, minigun turret"
        ]
      },
      {
        name: "Chaos Vehicle Physics",
        description: "Realistic vehicle simulation with suspension, traction, and impact response.",
        details: [
          "Per-wheel suspension simulation with configurable spring rate and damping",
          "Traction model: surface friction varies per terrain (asphalt, dirt, sand, water)",
          "Impact physics: ramming enemies/structures applies momentum-based damage",
          "Destruction: body panels detach as Chaos debris when damaged past threshold",
          "Engine damage: progressive performance loss as vehicle HP decreases",
          "Fuel system optional (disabled in standard BR, enabled in Simulation mode)"
        ]
      },
      {
        name: "Mounted Weapons",
        description: "Vehicle-mounted weapon systems with independent aim and unlimited ammo.",
        details: [
          "Machine Gun turret: 360° rotation, 15 DPS, overheats after 5s continuous fire",
          "Cannon: 120° arc, 120 damage per shot, 3s reload, Chaos destruction on impact",
          "Minigun: 180° arc, 20 DPS, 3s spin-up time",
          "All turrets operated by passengers, not driver",
          "Turret aiming decoupled from vehicle steering"
        ]
      }
    ],
    technicalNotes: [
      "Chaos Vehicle component configured per vehicle in Blueprint subclasses",
      "Vehicle HP tracked on server-authoritative UVehicleHealthComponent",
      "Driver and passenger entry uses interpolated mount animation via Montage",
      "Vehicle destruction spawns Chaos Geometry Collection for wreckage",
      "Replicated: VehicleHP (float), OccupancyMap (TArray), TurretRotation (FRotator)"
    ],
    codeSnippet: `// AApexVehicle.h - Base vehicle class
UCLASS()
class APEXFORT_API AApexVehicle : public AChaosWheeledVehiclePawn {
    GENERATED_BODY()
public:
    UPROPERTY(EditDefaultsOnly, Category="Vehicle")
    float MaxVehicleHealth = 600.0f;
    
    UPROPERTY(EditDefaultsOnly, Category="Vehicle")  
    TArray<FVehicleSeatData> Seats; // Driver + passengers
    
    UFUNCTION(Server, Reliable)
    void ServerEnterVehicle(AApexCharacter* Character, int32 SeatIndex);
    
    UFUNCTION(Server, Reliable)
    void ServerExitVehicle(AApexCharacter* Character);
    
    UFUNCTION(Server, Reliable)
    void ServerFireTurret(int32 TurretIndex, FVector TargetLocation);
    
    // Called by projectile/explosion hit
    void ApplyVehicleDamage(float DamageAmount, FVector HitLocation);

private:
    UPROPERTY(Replicated)
    float CurrentVehicleHealth;
    
    UPROPERTY(Replicated)
    TArray<AApexCharacter*> OccupiedSeats;
    
    void DestroyVehicle();
    void SpawnWreckageDebris();
};`,
    language: "cpp"
  },
  {
    id: "loot-inventory",
    name: "Loot & Inventory System",
    category: "Combat",
    overview: "A complete loot ecosystem with tiered rarity, floor loot, chests, supply drops, and mythic spawns. Players have 5 weapon slots plus a dedicated inventory for consumables, ammo, and utility items. The system is server-authoritative with client-side prediction for looting feel.",
    components: [
      {
        name: "Loot Tiers & Spawning",
        description: "Probability-weighted loot spawning across the map using pre-baked spawn tables.",
        details: [
          "Floor loot: random from weighted table (Common 45%, Rare 30%, Epic 20%, Legendary 5%)",
          "Chests: guaranteed 2-3 items, higher rarity weights (Epic 35%, Legendary 15%)",
          "Supply drops: 3-4 items, Legendary guaranteed, Mythic 20% chance",
          "Mythic spawns: 1-2 per map, fixed locations, always Mythic tier",
          "Ammo spawns: unlimited common ammo on floor, specialized ammo in chests",
          "Loot respawns disabled — once taken, location is empty for the match"
        ]
      },
      {
        name: "Inventory Management",
        description: "Slot-based inventory with drag-and-drop management and quick-swap.",
        details: [
          "5 weapon slots (scroll or 1-5 hotkeys to switch)",
          "Healing: 3 slots for Med Kits, Bandages, Shield Pots, Shield Brews",
          "Utility: 2 slots for grenades, deployables, traps",
          "Ammo: automatic stack management, no slot usage",
          "Auto-pickup: option to auto-collect ammo and consumables",
          "Compare overlay: shows current vs. looted item stats before picking up"
        ]
      },
      {
        name: "Item Rarity Visual System",
        description: "Distinct visual language for each rarity tier — ground glow, chest glow, pickup UI.",
        details: [
          "Common: white/gray glow pulse",
          "Rare: blue electrical shimmer",
          "Epic: purple radiance with particle halo",
          "Legendary: gold fire effect with ambient light",
          "Mythic: multicolor aurora with heavy Niagara particle system",
          "All glows powered by Niagara systems for performance-scalable effects"
        ]
      }
    ],
    technicalNotes: [
      "ALootActor: base class for all droppable/pickupable items — server authority",
      "UInventoryComponent on Character: server-replicated item arrays",
      "Loot table UDataAsset: defines spawn weights per item per zone",
      "Fast loot: press F once to grab, hold F for item comparison",
      "Items broadcast via GameplayEvent when picked up (for GAS stat tracking)"
    ],
    codeSnippet: `// UInventoryComponent.h
UCLASS()
class APEXFORT_API UInventoryComponent : public UActorComponent {
    GENERATED_BODY()
public:
    static const int32 MAX_WEAPON_SLOTS = 5;
    static const int32 MAX_HEALING_SLOTS = 3;
    static const int32 MAX_UTILITY_SLOTS = 2;
    
    UPROPERTY(ReplicatedUsing=OnRep_WeaponSlots)
    TArray<FWeaponData> WeaponSlots;
    
    UPROPERTY(ReplicatedUsing=OnRep_HealingItems)
    TArray<FItemData> HealingItems;
    
    UPROPERTY(Replicated)
    TMap<EAmmoType, int32> AmmoStacks;
    
    UFUNCTION(Server, Reliable)
    void ServerPickupItem(ALootActor* LootActor, int32 SlotIndex = -1);
    
    UFUNCTION(Server, Reliable)
    void ServerDropItem(int32 SlotIndex, EInventoryCategory Category);
    
    UFUNCTION(Server, Reliable)
    void ServerSwapSlots(int32 SlotA, int32 SlotB, EInventoryCategory Category);
    
    bool CanPickup(const FItemData& Item) const;
    int32 GetFirstEmptySlot(EInventoryCategory Category) const;
};`,
    language: "cpp"
  },
  {
    id: "progression-ui",
    name: "Lobby & UI System",
    category: "UI",
    overview: "A cinematic lobby experience matching Fortnite's quality bar — animated character showcase, battle pass progression visualization, cosmetic locker, settings, and match flow screens. Built in UE5's UMG with custom Slate widgets for performance-critical elements.",
    components: [
      {
        name: "Main Lobby",
        description: "Full 3D lobby with animated character showcase on a dramatic backdrop.",
        details: [
          "3D character display rotating on a podium with dynamic lighting",
          "Background: animated war-torn cityscape with environmental storytelling",
          "Navigation: Play, Locker, Battle Pass, Item Shop, Challenges, Settings",
          "Live ticker: recent events, challenge progress, match history",
          "APEX FORT logo with ambient glow animation"
        ]
      },
      {
        name: "Battle Pass System",
        description: "100-tier offline progression system with cosmetic rewards.",
        details: [
          "100 tiers, each requiring XP earned from matches, challenges, daily quests",
          "Every 10 tiers: major reward (character skin, weapon wrap, vehicle skin)",
          "Premium track: additional cosmetics alongside free track",
          "Challenge bundles: multi-part challenges with bonus XP rewards",
          "End-of-season rewards: exclusive title, animated banner"
        ]
      },
      {
        name: "Victory & End Screen",
        description: "Cinematic victory sequence with statistics and replay access.",
        details: [
          "Victory Royale: slow-motion moment of final kill, camera pull-back",
          "Stats display: eliminations, damage, accuracy, survival time, materials used",
          "Replay system: auto-saved match replay with spectator controls",
          "Squad breakdown: per-teammate performance metrics",
          "XP calculation: animated breakdown of earned XP and progression"
        ]
      },
      {
        name: "HUD System",
        description: "In-match HUD with health/shield/armor, minimap, inventory, and ability display.",
        details: [
          "Health/Shield/Armor bars with animated damage flash",
          "Minimap: realtime with storm circle, squadmates, pinged locations",
          "Weapon hotbar: 5 slots with ammo count, reload indicator",
          "Ability display: 3 ability icons with cooldown radial fill",
          "Elimination feed: top-right kill notifications",
          "Storm timer: countdown to next phase with distance indicator"
        ]
      }
    ],
    technicalNotes: [
      "UMG Blueprint widgets for gameplay HUD — Slate for lobby performance",
      "Character showcase: dedicated level stream with cinematic camera setup",
      "Battle pass data: UDataAsset per tier with soft references to cosmetic assets",
      "Enhanced Input System for all HUD interactions (keyboard + controller)",
      "CommonUI plugin for platform-appropriate input icons"
    ],
    codeSnippet: `// UApexHUDWidget.h - Main in-match HUD
UCLASS()
class APEXFORT_API UApexHUDWidget : public UUserWidget {
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable)
    void UpdateHealthShield(float Health, float MaxHealth, float Shield, float MaxShield);
    
    UFUNCTION(BlueprintCallable)
    void UpdateAbilityCooldowns(float TacticalProgress, float UltimateProgress);
    
    UFUNCTION(BlueprintCallable)
    void ShowEliminationNotification(const FString& EliminatedName, EWeaponType ByWeapon);
    
    UFUNCTION(BlueprintCallable)
    void UpdateStormTimer(float TimeUntilShrink, float StormDistance, bool bIsInStorm);
    
    UFUNCTION(BlueprintCallable)
    void UpdateInventorySlots(const TArray<FWeaponData>& Weapons, int32 ActiveSlot);

protected:
    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& Geometry, float DeltaTime) override;
    
    UPROPERTY(meta=(BindWidget))
    UProgressBar* HealthBar;
    
    UPROPERTY(meta=(BindWidget))
    UProgressBar* ShieldBar;
    
    UPROPERTY(meta=(BindWidget))
    UProgressBar* UltimateCharge;
};`,
    language: "cpp"
  }
];

router.get("/systems", async (_req, res): Promise<void> => {
  res.json(ListSystemsResponse.parse(systems));
});

router.get("/systems/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSystemParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const system = systems.find(s => s.id === params.data.id);
  if (!system) {
    res.status(404).json({ error: "System not found" });
    return;
  }
  res.json(GetSystemResponse.parse(system));
});

export default router;
