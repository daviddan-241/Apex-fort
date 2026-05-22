import { openai } from "./openai";
import { logger } from "./logger";

export interface GameRequirements {
  genre: string;
  gameType: string;
  title: string;
  description: string;
  features: string[];
  platform: string;
  playerCount?: number;
  mapSize?: string;
  prompt: string;
}

export interface GeneratedGamePlan {
  title: string;
  genre: string;
  gameType: string;
  description: string;
  characters: string[];
  levels: string[];
  mechanics: string[];
  cppClasses: string[];
  blueprints: string[];
  uiScreens: string[];
  weapons: string[];
  platform: string;
}

export type GameType = "battle-royale" | "fps" | "mobile" | "rpg" | "racing" | "platformer" | "default";

export function detectGameType(genre: string, features: string[], prompt: string): GameType {
  const p = prompt.toLowerCase();
  const g = genre.toLowerCase();
  const f = features.join(" ").toLowerCase();
  if (p.includes("battle royale") || p.includes("fortnite") || p.includes("pubg") || p.includes("warzone") || p.includes("100 player") || p.includes("apex")) return "battle-royale";
  if (p.includes("call of duty") || p.includes("cod") || p.includes("killstreak") || p.includes("modern warfare") || p.includes("team deathmatch")) return "fps";
  if (p.includes("mobile") || p.includes("ios") || p.includes("android") || f.includes("mobile") || f.includes("ios")) return "mobile";
  if (g === "rpg" || p.includes(" rpg") || p.includes("open world") || p.includes("fantasy")) return "rpg";
  if (g === "racing" || p.includes("racing") || p.includes("car")) return "racing";
  if (g === "platformer" || p.includes("platformer") || p.includes("side-scroll")) return "platformer";
  return "default";
}

export async function analyzePrompt(prompt: string, platform?: string): Promise<GameRequirements> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a AAA game design expert. Analyze the prompt and return JSON:
- genre: one of [shooter, battle-royale, fps, rpg, survival, racing, strategy, puzzle, platformer, action, sports, mobile]
- gameType: specific type like "battle-royale", "fps", "mobile-shooter", "open-world-rpg", "racing-sim"
- title: catchy game title (max 4 words)
- description: 2-sentence game pitch
- features: 4-8 key gameplay features
- platform: "${platform || "PC"}" unless prompt specifies otherwise
- playerCount: max simultaneous players (100 for BR, 64 for CoD, 4 for co-op etc.)
- mapSize: "small" | "medium" | "large" | "massive"
- prompt: the original prompt (echo back)
Return only valid JSON.`,
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 500,
  });

  try {
    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    return { ...parsed, prompt };
  } catch {
    return {
      genre: "action",
      gameType: "fps",
      title: "AI Generated Game",
      description: prompt,
      features: ["combat", "exploration", "multiplayer"],
      platform: platform || "PC",
      playerCount: 32,
      mapSize: "medium",
      prompt,
    };
  }
}

export async function generateGamePlan(req: GameRequirements): Promise<GeneratedGamePlan> {
  const gameTypeHint = buildGameTypeHint(req);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a senior UE5 architect for a AAA studio. Generate a complete game architecture plan.
${gameTypeHint}
Return JSON:
- title, genre, gameType, description
- characters: 4-6 character Blueprint names
- levels: 3-5 level names
- mechanics: 6-8 core gameplay mechanics
- cppClasses: 8-12 C++ class names (AGameCharacter, AWeaponBase, etc.)
- blueprints: 8-14 Blueprint names
- uiScreens: 5-8 UMG widget names
- weapons: 4-8 weapon names specific to this game type
- platform: target platform`,
      },
      { role: "user", content: JSON.stringify(req) },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1000,
  });

  try {
    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    return buildFallbackPlan(req);
  }
}

function buildGameTypeHint(req: GameRequirements): string {
  const gt = detectGameType(req.genre, req.features, req.prompt);
  switch (gt) {
    case "battle-royale":
      return "This is a Battle Royale game (like Fortnite/PUBG). Include: storm system, loot spawns, 100-player support, parachute drop, shrinking zone, building mechanics if Fortnite-style.";
    case "fps":
      return "This is a fast-paced FPS (like Call of Duty). Include: weapon classes (AR/SMG/Sniper/Shotgun), killstreak system, respawn system, scoreboards, hit markers, ADS mechanics, sprint/slide.";
    case "mobile":
      return "This is a mobile game. Include: virtual joystick, on-screen buttons, auto-fire, gyroscope support, IAP store, battle pass, reduced poly LODs, touch-optimized UI.";
    case "rpg":
      return "This is an open-world RPG. Include: quest system, dialogue trees, inventory, crafting, skill trees, faction reputation, day/night cycle, NPC schedules.";
    case "racing":
      return "This is a racing game. Include: vehicle physics, drift mechanics, nitro boost, lap system, track editor, multiplayer racing, vehicle customization.";
    default:
      return "Generate a complete game architecture with appropriate C++ classes, Blueprints, and systems.";
  }
}

export async function generateCppClass(
  className: string,
  req: GameRequirements,
): Promise<{ header: string; source: string }> {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const systemPrompt = buildCppSystemPrompt(gameType, req);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate complete UE5 C++ for class: ${className}\nGame: ${req.title} (${req.genre})\nDescription: ${req.description}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2500,
  });

  try {
    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch {
    const mod = req.title.replace(/\s+/g, "");
    return {
      header: `#pragma once\n#include "CoreMinimal.h"\n#include "GameFramework/Actor.h"\n#include "${className}.generated.h"\n\nUCLASS()\nclass ${mod.toUpperCase()}_API A${className} : public AActor\n{\n  GENERATED_BODY()\npublic:\n  A${className}();\n  virtual void BeginPlay() override;\n  virtual void Tick(float DeltaTime) override;\n};\n`,
      source: `#include "${className}.h"\n\nA${className}::A${className}()\n{\n  PrimaryActorTick.bCanEverTick = true;\n}\n\nvoid A${className}::BeginPlay()\n{\n  Super::BeginPlay();\n  UE_LOG(LogTemp, Log, TEXT("[${req.title}] ${className} initialized"));\n}\n\nvoid A${className}::Tick(float DeltaTime)\n{\n  Super::Tick(DeltaTime);\n}\n`,
    };
  }
}

function buildCppSystemPrompt(gameType: GameType, req: GameRequirements): string {
  const base = `You are a senior UE5 C++ developer at a AAA studio. Generate production-quality UE5 5.4 C++ code.
Return JSON with "header" (.h content) and "source" (.cpp content).
Use proper UE5 macros: UPROPERTY, UFUNCTION, UCLASS, GENERATED_BODY, etc.
Include: Enhanced Input system, Gameplay Ability System where relevant, proper replication for multiplayer.`;

  switch (gameType) {
    case "battle-royale":
      return `${base}
This is a Battle Royale game (Fortnite/PUBG-style). Key systems to implement:
- Storm/safe zone with smooth radius interpolation and damage over time
- 100-player replication with optimized net updates (bOnlyRelevantToOwner, LOD-based replication)
- Building system (place wall/floor/ramp/roof with collision)
- Weapon with bullet spread, recoil patterns, hit-scan vs projectile toggle
- Inventory with item rarity (Common/Uncommon/Rare/Epic/Legendary)
- Parachute/glider deployment system
- Supply drop spawning and looting
Use ACharacter base, properly set NetUpdateFrequency and MinNetUpdateFrequency.`;

    case "fps":
      return `${base}
This is a fast-paced FPS (Call of Duty / Battlefield-style). Key systems:
- ADS (Aim Down Sights) with FOV interpolation and sway
- Weapon recoil with recovery (random + pattern-based)
- Kill streak tracking (UAV at 3, Airstrike at 5, Chopper Gunner at 11)
- Server-side hit validation with lag compensation
- Sprint, crouch, slide, prone movement states
- Footstep audio with surface detection
- Team respawn with spawn point selection (farthest from enemies)
Use UCameraComponent with spring arm, FPS arms mesh offset.`;

    case "mobile":
      return `${base}
This is a mobile game (iOS/Android). Key systems:
- Virtual joystick with configurable dead zone and sensitivity
- On-screen fire/aim buttons with touch event handling
- Auto-fire proximity detection
- Gyroscope aim assist
- IAP integration hooks (UPurchaseSubsystem)
- Reduced-complexity physics for 60fps on mobile
- Battery/thermal throttle detection
- Mobile-specific UMG scaling (SafeZone anchoring)`;

    default:
      return base;
  }
}

export async function generateBlueprint(
  bpName: string,
  req: GameRequirements,
): Promise<string> {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const bpPrompt = buildBlueprintPrompt(bpName, gameType);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a UE5 Blueprint expert. Describe a detailed Blueprint implementation for a ${req.genre} game called "${req.title}". Include event graph logic, component setup, and variable definitions as a structured description.`,
      },
      { role: "user", content: `Blueprint: ${bpName}\n${bpPrompt}\nGame: ${req.description}` },
    ],
    max_tokens: 1200,
  });

  const bpDef = {
    name: bpName,
    parentClass: inferParentClass(bpName),
    gameType,
    genre: req.genre,
    description: req.description,
    components: generateComponents(bpName, gameType),
    variables: generateVariables(bpName, req.genre, gameType),
    functions: generateBlueprintFunctions(bpName, gameType),
    eventGraph: completion.choices[0].message.content,
    replication: bpName.includes("Character") || bpName.includes("Weapon"),
    generatedBy: "AI Game Creator v2",
    generatedAt: new Date().toISOString(),
  };
  return JSON.stringify(bpDef, null, 2);
}

function buildBlueprintPrompt(bpName: string, gameType: GameType): string {
  if (gameType === "battle-royale") {
    if (bpName.includes("Character")) return "Implement: parachute state, building mode toggle, quick-slot weapon switching, looting interaction with E key, storm damage tick.";
    if (bpName.includes("Weapon")) return "Implement: projectile spawn at muzzle, spread cone, recoil push to camera, reload animation notify, ammo count replication.";
    if (bpName.includes("Storm")) return "Implement: sphere radius timeline (600s total), damage zone overlap, minimap circle update broadcast.";
  }
  if (gameType === "fps") {
    if (bpName.includes("Weapon")) return "Implement: ADS FOV lerp, recoil timeline, muzzle flash particle, bullet decal on impact, reload montage, automatic/burst/semi-auto toggle.";
    if (bpName.includes("Character")) return "Implement: prone/crouch/sprint state machine, footstep sound on surface type, sprint speed boost, slide from sprint.";
  }
  if (gameType === "mobile") {
    if (bpName.includes("HUD") || bpName.includes("UI")) return "Implement: virtual joystick widget, fire button with hold detection, ammo count SafeZone-aware layout, minimap overlay.";
  }
  return `Implement core functionality for ${bpName} appropriate to the game genre.`;
}

export async function generateUMGWidget(widgetName: string, req: GameRequirements): Promise<string> {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const widgets = generateWidgetComponents(widgetName, gameType);
  const widgetDef = {
    name: widgetName,
    type: "UserWidget",
    gameType,
    genre: req.genre,
    generatedBy: "AI Game Creator v2",
    designSize: req.platform === "Mobile" ? { x: 1920, y: 1080 } : { x: 1920, y: 1080 },
    safeZone: req.platform === "Mobile",
    widgets,
    animations: generateWidgetAnimations(widgetName),
    generatedAt: new Date().toISOString(),
  };
  return JSON.stringify(widgetDef, null, 2);
}

export async function generateLevelConfig(levelName: string, req: GameRequirements): Promise<string> {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const levelConfig = {
    name: levelName,
    type: "Level",
    gameType,
    genre: req.genre,
    generatedBy: "AI Game Creator v2",
    worldSettings: {
      gameModeOverride: `/Game/Blueprints/BP_GameMode`,
      gravityZ: gameType === "mobile" ? -980.0 : -980.0,
      killZ: -5000.0,
      worldGravityZ: -980.0,
      bEnableWorldBoundsChecks: true,
    },
    streaming: {
      worldPartitionEnabled: gameType === "battle-royale",
      hlodEnabled: gameType === "battle-royale",
      levelStreamingDistance: gameType === "battle-royale" ? 50000 : 20000,
    },
    lighting: buildLightingConfig(gameType, levelName),
    naniteSettings: { enabled: true, fallbackRelativeError: 1.0 },
    lumenSettings: { enabled: req.platform !== "Mobile", rayTracingMode: "Hardware", softwareLumen: req.platform === "Mobile" },
    actors: generateLevelActors(gameType, levelName),
    spawnPoints: generateSpawnPoints(req.genre, gameType),
    generatedAt: new Date().toISOString(),
  };
  return JSON.stringify(levelConfig, null, 2);
}

function buildLightingConfig(gameType: GameType, levelName: string) {
  if (levelName.includes("Menu") || levelName.includes("Lobby")) {
    return { skyLight: { intensity: 1.5 }, directionalLight: { intensity: 8.0, lightColor: "#FFF5E0" }, fog: false };
  }
  if (gameType === "battle-royale") {
    return { skyLight: { intensity: 1.0 }, directionalLight: { intensity: 12.0, lightColor: "#FFE8C0" }, atmosphericFog: true, volumetricClouds: true, timeOfDay: "afternoon", dayNightCycle: false };
  }
  if (gameType === "fps") {
    return { skyLight: { intensity: 0.8 }, directionalLight: { intensity: 6.0, lightColor: "#C0D8FF" }, atmosphericFog: true, volumetricClouds: false, timeOfDay: "overcast" };
  }
  return { skyLight: { intensity: 1.0 }, directionalLight: { intensity: 10.0, lightColor: "#FFF5E0" }, atmosphericFog: true, volumetricClouds: true };
}

// ─── UProject File ─────────────────────────────────────────────────────────────

export function generateUProjectFile(req: GameRequirements): string {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const moduleName = req.title.replace(/\s+/g, "");
  const platforms = buildTargetPlatforms(req.platform, gameType);
  const plugins = buildPluginList(gameType, req.features);

  return JSON.stringify({
    FileVersion: 3,
    EngineAssociation: "5.4",
    Category: "",
    Description: `AI-generated ${req.genre} game: ${req.title}`,
    GeneratedBy: "AI Game Creator v2",
    Modules: [{
      Name: moduleName,
      Type: "Runtime",
      LoadingPhase: "Default",
      AdditionalDependencies: ["Engine", "UMG", "AIModule", "GameplayAbilities", "EnhancedInput", "OnlineSubsystem"],
    }],
    Plugins: plugins,
    TargetPlatforms: platforms,
    EpicSampleNameHash: "0",
  }, null, 2);
}

function buildTargetPlatforms(platform: string, gameType: GameType): string[] {
  const base = ["Windows"];
  if (platform === "Mobile" || gameType === "mobile") return [...base, "IOS", "Android"];
  if (platform === "Console") return [...base, "PS5", "XSX", "Linux"];
  return [...base, "Linux", "Mac"];
}

function buildPluginList(gameType: GameType, features: string[]) {
  const base = [
    { Name: "GameplayAbilities", Enabled: true },
    { Name: "EnhancedInput", Enabled: true },
    { Name: "OnlineSubsystem", Enabled: true },
    { Name: "OnlineSubsystemNull", Enabled: true },
    { Name: "ModelingToolsEditorMode", Enabled: true },
    { Name: "PCGPlugin", Enabled: true },
  ];
  if (gameType === "battle-royale" || features.some(f => f.toLowerCase().includes("multi"))) {
    base.push({ Name: "EOSShared", Enabled: true });
    base.push({ Name: "OnlineServicesEOS", Enabled: true });
    base.push({ Name: "OnlineSubsystemEOS", Enabled: true });
  }
  if (gameType === "mobile") {
    base.push({ Name: "MobilePatchingUtils", Enabled: true });
  }
  return base;
}

// ─── Config Files ───────────────────────────────────────────────────────────────

export function generateDefaultEngineIni(req: GameRequirements): string {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const moduleName = req.title.replace(/\s+/g, "");
  const isMobile = req.platform === "Mobile" || gameType === "mobile";

  return `[/Script/EngineSettings.GeneralProjectSettings]
ProjectID=+ProjectID=${generateGuid()}
ProjectName=${req.title}
ProjectDisplayedTitle=NSLOCTEXT("", "${moduleName}", "${req.title}")
ProjectVersion=1.0.0
CompanyName=AI Game Creator
CopyrightNotice=Copyright 2025 AI Game Creator

[/Script/Engine.RendererSettings]
r.DefaultFeature.AutoExposure.ExtendDefaultLuminanceRange=True
r.DefaultFeature.MotionBlur=${isMobile ? "False" : "True"}
r.DynamicGlobalIlluminationMethod=${isMobile ? "0" : "1"}
r.ReflectionMethod=${isMobile ? "0" : "1"}
r.Shadow.Virtual.Enable=${isMobile ? "0" : "1"}
r.Lumen.DiffuseIndirect.Allow=${isMobile ? "0" : "1"}
r.Lumen.Reflections.Allow=${isMobile ? "0" : "1"}
r.Nanite.ProjectEnabled=${isMobile ? "False" : "True"}
r.MobileContentScaleFactor=${isMobile ? "0" : "1"}
r.MobileHDR=${isMobile ? "True" : "False"}

[/Script/HardwareTargeting.HardwareTargetingSettings]
TargetedHardwareClass=${isMobile ? "Mobile" : "Desktop"}
DefaultGraphicsPerformance=${isMobile ? "Scalable" : "Maximum"}

[/Script/Engine.Engine]
GameEngine=/Script/Engine.GameEngine
GameViewportClientClassName=/Script/${moduleName}.UGameViewportClient
+ActiveGameNameRedirects=(OldGameName="/Script/TP_ThirdPerson",NewGameName="/Script/${moduleName}")

${gameType === "battle-royale" ? `[/Script/OnlineSubsystem.OnlineSubsystem]
DefaultPlatformService=EOS
bHasVoiceEnabled=True

[OnlineSubsystemEOS]
bEnabled=true
bUseEAS=true
bUseEOS=true
` : ""}
${isMobile ? `[/Script/IOSRuntimeSettings.IOSRuntimeSettings]
MinimumiOSVersion=IOS_15
bSupportsPortraitOrientation=False
bSupportsUpsideDownOrientation=False
bSupportsLandscapeLeftOrientation=True
bSupportsLandscapeRightOrientation=True
bSupportsMetalMRT=True
bGeneratedSYMBundle=True
EnableRemoteNotificationsSupport=True
EnableCloudKitSupport=False
bEnableGameCenterSupport=True

[/Script/AndroidRuntimeSettings.AndroidRuntimeSettings]
PackageName=com.aigamecreator.${moduleName.toLowerCase()}
StoreVersion=1
VersionDisplayName=1.0
MinSDKVersion=28
TargetSDKVersion=34
bEnableGradle=True
bBuildForArmV7=False
bBuildForArm64=True
bBuildForX86_64=False
bSupportsVulkan=True
` : ""}`;
}

export function generateDefaultGameIni(req: GameRequirements): string {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const moduleName = req.title.replace(/\s+/g, "");
  const maxPlayers = gameType === "battle-royale" ? 100 : gameType === "fps" ? 64 : 32;

  return `[/Script/Engine.GameSession]
MaxPlayers=${maxPlayers}
bRequiresPushToTalk=False

[/Script/GameMapsSettings]
GameDefaultMap=/Game/Maps/L_World_01
LocalMapOptions=
TransitionMap=/Game/Maps/L_Loading
GlobalDefaultGameMode=/Game/${moduleName}/BP_GameMode
ServerDefaultMap=/Game/Maps/L_World_01

${gameType === "battle-royale" || gameType === "fps" ? `[/Script/Engine.GameNetworkManager]
TotalNetBandwidth=104857600
MaxDynamicBandwidth=52428800
MinDynamicBandwidth=26214400
MAXPOSITIONERRORSQUARED=625
MAXNEARZEROVELOCITYSQ=9
CLIENTADJUSTUPDATECOST=180
MaxClientForcedUpdateDuration=1
ServerForcedUpdateHitchThreshold=0.1
ServerForcedUpdateHitchCooldown=5.0
MaxMoveDeltaTime=0.125
ClientNetSendMoveThrottleAtNetSpeed=10000
ClientNetSendMoveThrottleOverPlayerCount=10

[OnlineSubsystemUtils.IpNetDriver]
MaxClientRate=100000
MaxInternetClientRate=100000
NetServerMaxTickRate=60
` : ""}`;
}

export function generateDefaultInputIni(req: GameRequirements): string {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const isMobile = req.platform === "Mobile" || gameType === "mobile";

  if (isMobile) {
    return `[/Script/Engine.InputSettings]
+AxisMappings=(AxisName="MoveForward",Scale=1.000000,Key=W)
+AxisMappings=(AxisName="MoveForward",Scale=-1.000000,Key=S)
+AxisMappings=(AxisName="MoveRight",Scale=1.000000,Key=D)
+AxisMappings=(AxisName="MoveRight",Scale=-1.000000,Key=A)
+ActionMappings=(ActionName="Fire",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=LeftMouseButton)
+ActionMappings=(ActionName="Jump",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=SpaceBar)
+ActionMappings=(ActionName="Aim",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=RightMouseButton)
+TouchBindings=(ActionName="Fire",KeyIndex=0)
+TouchBindings=(ActionName="Jump",KeyIndex=1)
bUseMotionControls=True
DefaultViewportMouseCaptureMode=CapturePermanently_IncludingInitialMouseDown`;
  }

  if (gameType === "fps" || gameType === "battle-royale") {
    return `[/Script/Engine.InputSettings]
+AxisMappings=(AxisName="MoveForward",Scale=1.000000,Key=W)
+AxisMappings=(AxisName="MoveForward",Scale=-1.000000,Key=S)
+AxisMappings=(AxisName="MoveRight",Scale=1.000000,Key=D)
+AxisMappings=(AxisName="MoveRight",Scale=-1.000000,Key=A)
+AxisMappings=(AxisName="Turn",Scale=1.000000,Key=MouseX)
+AxisMappings=(AxisName="LookUp",Scale=-1.000000,Key=MouseY)
+ActionMappings=(ActionName="Jump",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=SpaceBar)
+ActionMappings=(ActionName="Sprint",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=LeftShift)
+ActionMappings=(ActionName="Crouch",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=LeftControl)
+ActionMappings=(ActionName="Prone",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=Z)
+ActionMappings=(ActionName="Fire",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=LeftMouseButton)
+ActionMappings=(ActionName="AimDownSights",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=RightMouseButton)
+ActionMappings=(ActionName="Reload",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=R)
+ActionMappings=(ActionName="Interact",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=E)
+ActionMappings=(ActionName="Melee",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=V)
+ActionMappings=(ActionName="Grenade",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=G)
${gameType === "battle-royale" ? `+ActionMappings=(ActionName="BuildWall",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=Q)
+ActionMappings=(ActionName="BuildFloor",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=F)
+ActionMappings=(ActionName="BuildRamp",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=C)
+ActionMappings=(ActionName="BuildMode",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=B)` : ""}
bUseMouseForTouch=False
DefaultViewportMouseCaptureMode=CapturePermanently`;
  }

  return `[/Script/Engine.InputSettings]
+AxisMappings=(AxisName="MoveForward",Scale=1.000000,Key=W)
+AxisMappings=(AxisName="MoveRight",Scale=1.000000,Key=D)
+AxisMappings=(AxisName="Turn",Scale=1.000000,Key=MouseX)
+AxisMappings=(AxisName="LookUp",Scale=-1.000000,Key=MouseY)
+ActionMappings=(ActionName="Jump",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=SpaceBar)
+ActionMappings=(ActionName="Fire",bShift=False,bCtrl=False,bAlt=False,bCmd=False,Key=LeftMouseButton)`;
}

export function generateBuildCsFile(req: GameRequirements): string {
  const moduleName = req.title.replace(/\s+/g, "");
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const extraModules = gameType === "battle-royale" || gameType === "fps"
    ? `\t\t\t\t"NetCore",\n\t\t\t\t"OnlineSubsystem",\n\t\t\t\t"OnlineSubsystemUtils",`
    : gameType === "mobile"
    ? `\t\t\t\t"AndroidPermission",`
    : "";

  return `using UnrealBuildTool;

public class ${moduleName} : ModuleRules
{
\tpublic ${moduleName}(ReadOnlyTargetRules Target) : base(Target)
\t{
\t\tPCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

\t\tPublicDependencyModuleNames.AddRange(new string[] {
\t\t\t"Core",
\t\t\t"CoreUObject",
\t\t\t"Engine",
\t\t\t"InputCore",
\t\t\t"EnhancedInput",
\t\t\t"UMG",
\t\t\t"Slate",
\t\t\t"SlateCore",
\t\t\t"AIModule",
\t\t\t"NavigationSystem",
\t\t\t"GameplayAbilities",
\t\t\t"GameplayTags",
\t\t\t"GameplayTasks",
\t\t\t"PhysicsCore",
\t\t\t"Chaos",
${extraModules}
\t\t});

\t\tPrivateDependencyModuleNames.AddRange(new string[] {
\t\t\t"NetCore",
\t\t\t"DeveloperSettings",
\t\t});

\t\tif (Target.Type == TargetType.Editor)
\t\t{
\t\t\tPrivateDependencyModuleNames.Add("UnrealEd");
\t\t}
\t}
}
`;
}

export function generateTargetFile(req: GameRequirements, targetType: "Game" | "Editor"): string {
  const moduleName = req.title.replace(/\s+/g, "");
  return `using UnrealBuildTool;
using System.Collections.Generic;

public class ${moduleName}${targetType}Target : TargetRules
{
\tpublic ${moduleName}${targetType}Target(TargetInfo Target) : base(Target)
\t{
\t\tType = TargetType.${targetType};
\t\tDefaultBuildSettings = BuildSettingsVersion.V4;
\t\tIncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_4;
\t\tExtraModuleNames.Add("${moduleName}");
\t\tbUseUnityBuild = true;
\t\tbUsePCHFiles = true;
\t}
}
`;
}

export function generateGameInstanceCpp(req: GameRequirements): { header: string; source: string } {
  const moduleName = req.title.replace(/\s+/g, "");
  const gameType = detectGameType(req.genre, req.features, req.prompt);

  return {
    header: `#pragma once
#include "CoreMinimal.h"
#include "Engine/GameInstance.h"
#include "Interfaces/OnlineSessionInterface.h"
#include "${moduleName}GameInstance.generated.h"

UENUM(BlueprintType)
enum class EGameState : uint8
{
  MainMenu    UMETA(DisplayName = "Main Menu"),
  Matchmaking UMETA(DisplayName = "Matchmaking"),
  Loading     UMETA(DisplayName = "Loading"),
  InGame      UMETA(DisplayName = "In Game"),
  PostGame    UMETA(DisplayName = "Post Game"),
};

UCLASS()
class ${moduleName.toUpperCase()}_API U${moduleName}GameInstance : public UGameInstance
{
  GENERATED_BODY()

public:
  U${moduleName}GameInstance();
  virtual void Init() override;
  virtual void Shutdown() override;

  UFUNCTION(BlueprintCallable, Category = "Session")
  void CreateSession(int32 NumPlayers, bool bIsLAN);

  UFUNCTION(BlueprintCallable, Category = "Session")
  void FindSessions(bool bIsLAN);

  UFUNCTION(BlueprintCallable, Category = "Session")
  void JoinSession(int32 SearchResultIndex);

  UFUNCTION(BlueprintCallable, Category = "Session")
  void DestroySession();

  UFUNCTION(BlueprintCallable, Category = "Game")
  void SavePlayerData();

  UFUNCTION(BlueprintCallable, Category = "Game")
  void LoadPlayerData();

  UPROPERTY(BlueprintReadOnly, Category = "Game")
  EGameState CurrentGameState;

  UPROPERTY(BlueprintReadWrite, Category = "Player")
  FString PlayerDisplayName;

  UPROPERTY(BlueprintReadOnly, Category = "Player")
  int32 PlayerLevel;

  UPROPERTY(BlueprintReadOnly, Category = "Player")
  int32 TotalXP;

  UPROPERTY(BlueprintReadOnly, Category = "Player")
  int32 Currency;

${gameType === "battle-royale" ? `  UPROPERTY(BlueprintReadOnly, Category = "Stats")
  int32 TotalWins;

  UPROPERTY(BlueprintReadOnly, Category = "Stats")
  int32 TotalKills;

  UPROPERTY(BlueprintReadOnly, Category = "Stats")
  float KDRatio;
` : ""}
private:
  IOnlineSessionPtr SessionInterface;
  TSharedPtr<class FOnlineSessionSearch> SessionSearch;

  void OnCreateSessionComplete(FName SessionName, bool bWasSuccessful);
  void OnFindSessionsComplete(bool bWasSuccessful);
  void OnJoinSessionComplete(FName SessionName, EOnJoinSessionCompleteResult::Type Result);
  void OnDestroySessionComplete(FName SessionName, bool bWasSuccessful);
};
`,
    source: `#include "${moduleName}GameInstance.h"
#include "OnlineSubsystem.h"
#include "OnlineSessionSettings.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"

U${moduleName}GameInstance::U${moduleName}GameInstance()
  : CurrentGameState(EGameState::MainMenu)
  , PlayerDisplayName(TEXT("Player"))
  , PlayerLevel(1)
  , TotalXP(0)
  , Currency(0)
${gameType === "battle-royale" ? "  , TotalWins(0)\n  , TotalKills(0)\n  , KDRatio(0.0f)" : ""}
{
}

void U${moduleName}GameInstance::Init()
{
  Super::Init();

  IOnlineSubsystem* OnlineSubsystem = IOnlineSubsystem::Get();
  if (OnlineSubsystem)
  {
    SessionInterface = OnlineSubsystem->GetSessionInterface();
    if (SessionInterface.IsValid())
    {
      SessionInterface->OnCreateSessionCompleteDelegates.AddUObject(this, &U${moduleName}GameInstance::OnCreateSessionComplete);
      SessionInterface->OnFindSessionsCompleteDelegates.AddUObject(this, &U${moduleName}GameInstance::OnFindSessionsComplete);
      SessionInterface->OnJoinSessionCompleteDelegates.AddUObject(this, &U${moduleName}GameInstance::OnJoinSessionComplete);
      SessionInterface->OnDestroySessionCompleteDelegates.AddUObject(this, &U${moduleName}GameInstance::OnDestroySessionComplete);
    }
  }

  LoadPlayerData();
  UE_LOG(LogTemp, Log, TEXT("[${req.title}] GameInstance Initialized — Player: %s Level %d"), *PlayerDisplayName, PlayerLevel);
}

void U${moduleName}GameInstance::Shutdown()
{
  SavePlayerData();
  Super::Shutdown();
}

void U${moduleName}GameInstance::CreateSession(int32 NumPlayers, bool bIsLAN)
{
  if (SessionInterface.IsValid())
  {
    FOnlineSessionSettings SessionSettings;
    SessionSettings.bIsLANMatch = bIsLAN;
    SessionSettings.NumPublicConnections = NumPlayers;
    SessionSettings.bShouldAdvertise = true;
    SessionSettings.bAllowJoinInProgress = false;
    SessionSettings.bAllowInvites = true;
    SessionSettings.bUsesPresence = true;
    SessionSettings.bUseLobbiesIfAvailable = true;
    SessionSettings.Set(FName("GAME_MODE"), FString("${gameType === "battle-royale" ? "BattleRoyale" : gameType === "fps" ? "TeamDeathMatch" : "Default"}"), EOnlineDataAdvertisementType::ViaOnlineServiceAndPing);
    SessionInterface->CreateSession(0, NAME_GameSession, SessionSettings);
  }
}

void U${moduleName}GameInstance::FindSessions(bool bIsLAN)
{
  SessionSearch = MakeShared<FOnlineSessionSearch>();
  SessionSearch->bIsLanQuery = bIsLAN;
  SessionSearch->MaxSearchResults = 50;
  SessionSearch->QuerySettings.Set(SEARCH_PRESENCE, true, EOnlineComparisonOp::Equals);
  SessionInterface->FindSessions(0, SessionSearch.ToSharedRef());
}

void U${moduleName}GameInstance::JoinSession(int32 Index)
{
  if (SessionInterface.IsValid() && SessionSearch.IsValid() && SessionSearch->SearchResults.IsValidIndex(Index))
  {
    SessionInterface->JoinSession(0, NAME_GameSession, SessionSearch->SearchResults[Index]);
  }
}

void U${moduleName}GameInstance::DestroySession()
{
  if (SessionInterface.IsValid())
  {
    SessionInterface->DestroySession(NAME_GameSession);
  }
}

void U${moduleName}GameInstance::SavePlayerData()
{
  UE_LOG(LogTemp, Log, TEXT("[${req.title}] Saving player data for %s"), *PlayerDisplayName);
}

void U${moduleName}GameInstance::LoadPlayerData()
{
  UE_LOG(LogTemp, Log, TEXT("[${req.title}] Loading player data"));
}

void U${moduleName}GameInstance::OnCreateSessionComplete(FName SessionName, bool bWasSuccessful)
{
  if (bWasSuccessful)
  {
    UE_LOG(LogTemp, Log, TEXT("Session created: %s"), *SessionName.ToString());
    UWorld* World = GetWorld();
    if (World) World->ServerTravel("/Game/Maps/L_World_01?listen");
  }
}

void U${moduleName}GameInstance::OnFindSessionsComplete(bool bWasSuccessful)
{
  UE_LOG(LogTemp, Log, TEXT("Find sessions: %s — Found %d results"), bWasSuccessful ? TEXT("OK") : TEXT("FAIL"), SessionSearch.IsValid() ? SessionSearch->SearchResults.Num() : 0);
}

void U${moduleName}GameInstance::OnJoinSessionComplete(FName SessionName, EOnJoinSessionCompleteResult::Type Result)
{
  if (Result == EOnJoinSessionCompleteResult::Success)
  {
    APlayerController* PC = GetFirstLocalPlayerController();
    FString ConnectURL;
    SessionInterface->GetResolvedConnectString(SessionName, ConnectURL);
    if (PC && !ConnectURL.IsEmpty()) PC->ClientTravel(ConnectURL, ETravelType::TRAVEL_Absolute);
  }
}

void U${moduleName}GameInstance::OnDestroySessionComplete(FName SessionName, bool bWasSuccessful)
{
  UE_LOG(LogTemp, Log, TEXT("Session destroyed: %s"), *SessionName.ToString());
}
`,
  };
}

// ─── Game-Type Specific Extra Files ────────────────────────────────────────────

export function generateBattleRoyaleFiles(req: GameRequirements): Record<string, string> {
  const moduleName = req.title.replace(/\s+/g, "");
  return {
    [`Source/${moduleName}/Public/AStormSystem.h`]: `#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "AStormSystem.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnStormPhaseChanged, int32, NewPhase, float, NewRadius);

UCLASS()
class ${moduleName.toUpperCase()}_API AStormSystem : public AActor
{
  GENERATED_BODY()

public:
  AStormSystem();
  virtual void Tick(float DeltaTime) override;

  UPROPERTY(BlueprintAssignable, Category = "Storm")
  FOnStormPhaseChanged OnStormPhaseChanged;

  UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Storm", Replicated)
  float SafeZoneRadius;

  UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Storm", Replicated)
  FVector SafeZoneCenter;

  UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Storm", Replicated)
  int32 CurrentPhase;

  UPROPERTY(EditAnywhere, Category = "Storm")
  TArray<float> PhaseRadii = { 8000.f, 5000.f, 3000.f, 1500.f, 600.f, 200.f };

  UPROPERTY(EditAnywhere, Category = "Storm")
  TArray<float> PhaseWaitTimes = { 120.f, 90.f, 75.f, 60.f, 45.f, 30.f };

  UPROPERTY(EditAnywhere, Category = "Storm")
  TArray<float> PhaseShrinkTimes = { 90.f, 75.f, 60.f, 45.f, 30.f, 25.f };

  UPROPERTY(EditAnywhere, Category = "Storm")
  TArray<float> PhaseDamagePerSecond = { 5.f, 8.f, 10.f, 15.f, 20.f, 50.f };

  UFUNCTION(BlueprintCallable, Category = "Storm")
  bool IsInsideSafeZone(FVector Location) const;

  UFUNCTION(BlueprintCallable, Category = "Storm")
  float GetStormDamageAtLocation(FVector Location) const;

  UFUNCTION(BlueprintCallable, Category = "Storm")
  float GetPhaseProgress() const;

protected:
  virtual void BeginPlay() override;

private:
  float PhaseTimer;
  float TargetRadius;
  float StartRadius;
  bool bShrinking;
  void AdvanceToNextPhase();
  void ApplyStormDamage();
};
`,
    [`Source/${moduleName}/Private/AStormSystem.cpp`]: `#include "AStormSystem.h"
#include "Net/UnrealNetwork.h"
#include "TimerManager.h"
#include "Kismet/GameplayStatics.h"

AStormSystem::AStormSystem()
  : SafeZoneRadius(8000.f), CurrentPhase(0), PhaseTimer(0.f), bShrinking(false)
{
  PrimaryActorTick.bCanEverTick = true;
  bReplicates = true;
  NetUpdateFrequency = 5.f;
}

void AStormSystem::BeginPlay()
{
  Super::BeginPlay();
  SafeZoneCenter = FVector::ZeroVector;
  SafeZoneRadius = PhaseRadii.IsValidIndex(0) ? PhaseRadii[0] : 8000.f;
  TargetRadius = SafeZoneRadius;
  StartRadius = SafeZoneRadius;
  GetWorldTimerManager().SetTimer(FTimerHandle{}, this, &AStormSystem::AdvanceToNextPhase, PhaseWaitTimes.IsValidIndex(0) ? PhaseWaitTimes[0] : 120.f, false);
}

void AStormSystem::Tick(float DeltaTime)
{
  Super::Tick(DeltaTime);
  if (bShrinking && HasAuthority())
  {
    PhaseTimer += DeltaTime;
    float ShrinkTime = PhaseShrinkTimes.IsValidIndex(CurrentPhase) ? PhaseShrinkTimes[CurrentPhase] : 60.f;
    float Alpha = FMath::Clamp(PhaseTimer / ShrinkTime, 0.f, 1.f);
    SafeZoneRadius = FMath::Lerp(StartRadius, TargetRadius, Alpha);
    ApplyStormDamage();
    if (Alpha >= 1.f) { bShrinking = false; PhaseTimer = 0.f; }
  }
}

bool AStormSystem::IsInsideSafeZone(FVector Location) const
{
  return FVector::Dist2D(Location, SafeZoneCenter) <= SafeZoneRadius;
}

float AStormSystem::GetStormDamageAtLocation(FVector Location) const
{
  if (IsInsideSafeZone(Location)) return 0.f;
  return PhaseDamagePerSecond.IsValidIndex(CurrentPhase) ? PhaseDamagePerSecond[CurrentPhase] : 5.f;
}

float AStormSystem::GetPhaseProgress() const
{
  if (!bShrinking) return 0.f;
  float ShrinkTime = PhaseShrinkTimes.IsValidIndex(CurrentPhase) ? PhaseShrinkTimes[CurrentPhase] : 60.f;
  return FMath::Clamp(PhaseTimer / ShrinkTime, 0.f, 1.f);
}

void AStormSystem::AdvanceToNextPhase()
{
  CurrentPhase = FMath::Min(CurrentPhase + 1, PhaseRadii.Num() - 1);
  StartRadius = SafeZoneRadius;
  TargetRadius = PhaseRadii.IsValidIndex(CurrentPhase) ? PhaseRadii[CurrentPhase] : 200.f;
  bShrinking = true;
  PhaseTimer = 0.f;
  OnStormPhaseChanged.Broadcast(CurrentPhase, TargetRadius);
  UE_LOG(LogTemp, Log, TEXT("Storm Phase %d — Shrinking to %.0f"), CurrentPhase, TargetRadius);
  float WaitAfterShrink = PhaseWaitTimes.IsValidIndex(CurrentPhase) ? PhaseWaitTimes[CurrentPhase] : 60.f;
  float ShrinkTime = PhaseShrinkTimes.IsValidIndex(CurrentPhase) ? PhaseShrinkTimes[CurrentPhase] : 45.f;
  GetWorldTimerManager().SetTimer(FTimerHandle{}, this, &AStormSystem::AdvanceToNextPhase, ShrinkTime + WaitAfterShrink, false);
}

void AStormSystem::ApplyStormDamage()
{
  // Server: find all characters outside safe zone and apply damage via GAS or direct health deduction
}

void AStormSystem::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
  Super::GetLifetimeReplicatedProps(OutLifetimeProps);
  DOREPLIFETIME(AStormSystem, SafeZoneRadius);
  DOREPLIFETIME(AStormSystem, SafeZoneCenter);
  DOREPLIFETIME(AStormSystem, CurrentPhase);
}
`,
  };
}

export function generateFPSWeaponSystem(req: GameRequirements): Record<string, string> {
  const moduleName = req.title.replace(/\s+/g, "");
  return {
    [`Source/${moduleName}/Public/AWeaponBase.h`]: `#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "AWeaponBase.generated.h"

UENUM(BlueprintType)
enum class EWeaponType : uint8
{
  AssaultRifle  UMETA(DisplayName = "Assault Rifle"),
  SMG           UMETA(DisplayName = "SMG"),
  SniperRifle   UMETA(DisplayName = "Sniper Rifle"),
  Shotgun       UMETA(DisplayName = "Shotgun"),
  Pistol        UMETA(DisplayName = "Pistol"),
  LMG           UMETA(DisplayName = "LMG"),
  RocketLauncher UMETA(DisplayName = "Rocket Launcher"),
};

UENUM(BlueprintType)
enum class EFireMode : uint8
{
  Automatic UMETA(DisplayName = "Automatic"),
  Burst     UMETA(DisplayName = "Burst"),
  Single    UMETA(DisplayName = "Semi-Auto"),
};

USTRUCT(BlueprintType)
struct FWeaponStats
{
  GENERATED_BODY()
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float Damage = 30.f;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float HeadshotMultiplier = 2.5f;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float FireRate = 0.1f;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 MagazineSize = 30;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) int32 MaxAmmo = 120;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float ReloadTime = 2.0f;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float Range = 5000.f;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float HipFireSpread = 3.f;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float ADSSpread = 0.5f;
  UPROPERTY(EditAnywhere, BlueprintReadWrite) FVector2D RecoilPattern = FVector2D(0.5f, 0.3f);
  UPROPERTY(EditAnywhere, BlueprintReadWrite) float ADSMovementSpeedMultiplier = 0.5f;
};

UCLASS(Abstract)
class ${moduleName.toUpperCase()}_API AWeaponBase : public AActor
{
  GENERATED_BODY()

public:
  AWeaponBase();
  virtual void Tick(float DeltaTime) override;

  UFUNCTION(BlueprintCallable, Category = "Weapon")
  virtual void StartFiring();

  UFUNCTION(BlueprintCallable, Category = "Weapon")
  virtual void StopFiring();

  UFUNCTION(BlueprintCallable, Category = "Weapon")
  virtual void Reload();

  UFUNCTION(BlueprintCallable, Category = "Weapon")
  void SetADS(bool bNewADS);

  UFUNCTION(BlueprintCallable, Category = "Weapon")
  bool CanFire() const;

  UFUNCTION(BlueprintPure, Category = "Weapon")
  int32 GetCurrentAmmo() const { return CurrentAmmo; }

  UFUNCTION(BlueprintPure, Category = "Weapon")
  int32 GetReserveAmmo() const { return ReserveAmmo; }

  UFUNCTION(BlueprintPure, Category = "Weapon")
  bool IsReloading() const { return bIsReloading; }

  UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Weapon")
  FWeaponStats WeaponStats;

  UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Weapon")
  EWeaponType WeaponType;

  UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Weapon")
  EFireMode FireMode;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
  USkeletalMeshComponent* WeaponMesh;

  UPROPERTY(EditAnywhere, Category = "Effects")
  UParticleSystem* MuzzleFlashEffect;

  UPROPERTY(EditAnywhere, Category = "Effects")
  USoundBase* FireSound;

  UPROPERTY(EditAnywhere, Category = "Effects")
  USoundBase* EmptyFireSound;

protected:
  virtual void BeginPlay() override;
  virtual void FireShot();
  void ApplyRecoil();

  UPROPERTY(Replicated, BlueprintReadOnly, Category = "Weapon")
  int32 CurrentAmmo;

  UPROPERTY(Replicated, BlueprintReadOnly, Category = "Weapon")
  int32 ReserveAmmo;

  UPROPERTY(Replicated, BlueprintReadOnly, Category = "Weapon")
  bool bIsReloading;

  UPROPERTY(Replicated, BlueprintReadOnly, Category = "Weapon")
  bool bIsADS;

private:
  bool bIsFiring;
  float LastFireTime;
  FTimerHandle FireTimerHandle;
  FTimerHandle ReloadTimerHandle;
  void OnReloadComplete();
};
`,
  };
}

export function generateMobileConfigs(req: GameRequirements): Record<string, string> {
  const moduleName = req.title.replace(/\s+/g, "");
  return {
    "Config/IOS/PListOverride.xml": `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${req.title}</string>
  <key>CFBundleIdentifier</key>
  <string>com.aigamecreator.${moduleName.toLowerCase()}</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSRequiresIPhoneOS</key>
  <true/>
  <key>UIRequiredDeviceCapabilities</key>
  <array>
    <string>metal</string>
    <string>arm64</string>
  </array>
  <key>UIStatusBarHidden</key>
  <true/>
  <key>UIViewControllerBasedStatusBarAppearance</key>
  <false/>
  <key>NSCameraUsageDescription</key>
  <string>${req.title} uses the camera for AR features.</string>
  <key>NSMicrophoneUsageDescription</key>
  <string>${req.title} uses the microphone for voice chat.</string>
  <key>NSLocationWhenInUseUsageDescription</key>
  <string>${req.title} uses location for regional matchmaking.</string>
  <key>UIRequiresFullScreen</key>
  <true/>
  <key>UISupportsDocumentBrowser</key>
  <false/>
  <key>CADisableMinimumFrameDurationOnPhone</key>
  <true/>
  <key>ITSAppUsesNonExemptEncryption</key>
  <false/>
</dict>
</plist>`,
    "Config/Android/AndroidManifestOverride.xml": `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aigamecreator.${moduleName.toLowerCase()}"
    android:versionCode="1"
    android:versionName="1.0">
  <uses-permission android:name="android.permission.INTERNET"/>
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
  <uses-permission android:name="android.permission.VIBRATE"/>
  <uses-permission android:name="com.android.vending.BILLING"/>
  <uses-permission android:name="android.permission.WAKE_LOCK"/>
  <uses-feature android:name="android.hardware.vulkan.version" android:required="false"/>
  <uses-feature android:glEsVersion="0x00030000" android:required="true"/>
  <application
      android:label="${req.title}"
      android:icon="@mipmap/ic_launcher"
      android:hardwareAccelerated="true"
      android:allowBackup="false">
    <meta-data android:name="com.google.android.gms.games.APP_ID" android:value="@string/app_id"/>
    <meta-data android:name="com.google.android.gms.version" android:value="@integer/google_play_services_version"/>
  </application>
</manifest>`,
    "Config/DefaultScalability.ini": `[ScalabilitySettings]
; Mobile-optimized scalability groups
[ResolutionQuality]
Low=65
Medium=75
High=85
Epic=100

[ViewDistanceQuality]
Low=0
Medium=1
High=2
Epic=3

[ShadowQuality]
Low=0
Medium=1
High=2
Epic=3

[TextureQuality]
Low=0
Medium=1
High=2
Epic=3

[PostProcessQuality]
Low=0
Medium=1
High=2
Epic=3`,
  };
}

export function generateNetworkConfig(req: GameRequirements): string {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const maxPlayers = gameType === "battle-royale" ? 100 : 64;
  const moduleName = req.title.replace(/\s+/g, "");

  return `[/Script/Engine.GameSession]
MaxPlayers=${maxPlayers}
bRequiresPushToTalk=False

[/Script/Engine.GameNetworkManager]
TotalNetBandwidth=104857600
MaxDynamicBandwidth=52428800
MinDynamicBandwidth=1048576
ServerForcedUpdateHitchThreshold=0.1
MaxClientForcedUpdateDuration=1.0
MaxMoveDeltaTime=0.125
ClientNetSendMoveThrottleAtNetSpeed=10000
ClientNetSendMoveThrottleOverPlayerCount=10

[OnlineSubsystemUtils.IpNetDriver]
MaxClientRate=100000
MaxInternetClientRate=100000
NetServerMaxTickRate=60
LanServerMaxTickRate=60
InitialConnectTimeout=120.0
ConnectionTimeout=60.0
RecentlyDisconnectedTrackingTime=180

[${moduleName}.GameMode]
MaxPlayers=${maxPlayers}
bUseSeamlessTravel=True
bDelayedStart=True

[/Script/OnlineSubsystemUtils.OnlineBeaconHost]
ListenPort=15000`;
}

// ─── README ─────────────────────────────────────────────────────────────────────

export function generateReadme(req: GameRequirements, plan: GeneratedGamePlan): string {
  const gameType = detectGameType(req.genre, req.features, req.prompt);
  const moduleName = req.title.replace(/\s+/g, "");

  return `# ${req.title}

> AI-Generated Unreal Engine 5 Game — Created by AI Game Creator

## Overview

**Genre:** ${req.genre} | **Type:** ${gameType} | **Platform:** ${req.platform}

${req.description}

## Requirements

- Unreal Engine 5.4+
- Visual Studio 2022 (Windows) / Xcode 15+ (Mac/iOS)
- DirectX 12 / Vulkan / Metal
${req.platform === "Mobile" ? "- iOS 15+ / Android 9+ (API 28+)" : ""}
${plan.weapons.length > 0 ? `
## Weapons
${plan.weapons.map(w => `- ${w}`).join("\n")}
` : ""}

## Architecture

### C++ Classes (${plan.cppClasses.length})
${plan.cppClasses.map(c => `- \`${c}\``).join("\n")}

### Blueprints (${plan.blueprints.length})
${plan.blueprints.map(b => `- \`${b}\``).join("\n")}

### Levels
${plan.levels.map(l => `- \`${l}\``).join("\n")}

### UI Screens
${plan.uiScreens.map(u => `- \`${u}\``).join("\n")}

## Getting Started

\`\`\`bash
# 1. Open ${moduleName}.uproject in UE5.4
# 2. Right-click → Generate Visual Studio project files
# 3. Build (Development Editor) in Visual Studio
# 4. Open UE5, press Play
\`\`\`

${gameType === "battle-royale" ? `## Multiplayer Setup
- Configure Epic Online Services (EOS) App ID in \`Config/DefaultEngine.ini\`
- Set \`bUseEAS=true\` and \`bUseEOS=true\` for production
- Run dedicated server: \`${moduleName}Server.exe -server -log\`
- Max players: 100 per lobby
` : ""}
${req.platform === "Mobile" ? `## Mobile Deployment

### iOS
- Update bundle ID in \`Config/IOS/PListOverride.xml\`
- Set provisioning profile in Project Settings → iOS
- Build: \`Package Project → iOS\` in UE5 editor

### Android
- Update package name in \`Config/Android/AndroidManifestOverride.xml\`
- Generate keystore: \`keytool -genkey -v -keystore ${moduleName}.keystore\`
- Build: \`Package Project → Android (ETC2 + Vulkan)\`
` : ""}

---
_Generated by [AI Game Creator](https://aigamecreator.replit.app) on ${new Date().toLocaleDateString()}_
`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function buildFallbackPlan(req: GameRequirements): GeneratedGamePlan {
  const gt = detectGameType(req.genre, req.features, req.prompt);
  const moduleName = req.title.replace(/\s+/g, "");

  const plans: Record<GameType, Partial<GeneratedGamePlan>> = {
    "battle-royale": {
      cppClasses: ["APlayerCharacter_BR", "AWeaponBase", "AStormSystem", "ABattleRoyaleGameMode", "AInventoryComponent", "ASupplyDrop", "ALootItem", "AParachuteComponent", "ABuildingPiece"],
      blueprints: ["BP_GameMode_BR", "BP_PlayerCharacter_BR", "BP_AssaultRifle", "BP_SniperRifle", "BP_Shotgun", "BP_StormSphere", "BP_SupplyDrop", "BP_LootChest", "BP_BuildingWall", "BP_BuildingFloor"],
      uiScreens: ["WBP_HUD_BR", "WBP_StormTimer", "WBP_PlayerCount", "WBP_Inventory", "WBP_MainMenu", "WBP_LobbyScreen", "WBP_MatchResults"],
      levels: ["L_MainMenu", "L_LobbyIsland", "L_BattleRoyaleMap", "L_Training"],
      weapons: ["AR-15 Assault Rifle", "M24 Sniper Rifle", "SPAS-12 Shotgun", "MP5 SMG", "Desert Eagle", "RPG-7"],
    },
    "fps": {
      cppClasses: ["AFPSCharacter", "AWeaponBase", "AFPSGameMode", "AKillstreakManager", "AProjectileBase", "ASpawnSystem", "AHitValidator"],
      blueprints: ["BP_GameMode_TDM", "BP_FPSCharacter", "BP_AK47", "BP_M4A1", "BP_AWP", "BP_Grenade", "BP_KillstreakUAV", "BP_Airstrike", "BP_SpawnPoint"],
      uiScreens: ["WBP_HUD_FPS", "WBP_Scoreboard", "WBP_KillFeed", "WBP_DeathScreen", "WBP_MainMenu", "WBP_MatchSummary"],
      levels: ["L_MainMenu", "L_Shipment", "L_Rust", "L_Nuketown", "L_UrbanMap"],
      weapons: ["AK-47", "M4A1", "AWP Sniper", "MP5 SMG", "Desert Eagle", "SPAS-12 Shotgun", "RPG"],
    },
    "mobile": {
      cppClasses: ["AMobileCharacter", "AMobileWeapon", "AMobileGameMode", "AVirtualJoystick", "AIAPManager", "AMobileHUD"],
      blueprints: ["BP_GameMode_Mobile", "BP_MobileCharacter", "BP_VirtualJoystick", "BP_AutoFire", "BP_MobileWeapon", "BP_BattlePassUI"],
      uiScreens: ["WBP_MobileHUD", "WBP_VirtualControls", "WBP_Store", "WBP_BattlePass", "WBP_MainMenu", "WBP_Settings"],
      levels: ["L_MainMenu", "L_MobileMap_01", "L_Training"],
      weapons: ["AR-Mobile", "Sniper-Mobile", "Shotgun-Mobile", "SMG-Mobile"],
    },
    "rpg": {
      cppClasses: ["ARPGCharacter", "AQuestManager", "AInventorySystem", "ANPCBase", "ACraftingSystem", "ADialogueComponent"],
      blueprints: ["BP_GameMode_RPG", "BP_PlayerCharacter_RPG", "BP_NPC_Merchant", "BP_QuestGiver", "BP_ItemPickup", "BP_SpellEffect"],
      uiScreens: ["WBP_HUD_RPG", "WBP_Inventory", "WBP_QuestJournal", "WBP_Dialogue", "WBP_Map", "WBP_CharacterSheet"],
      levels: ["L_MainMenu", "L_OpenWorld_01", "L_Dungeon_01", "L_Village_01"],
      weapons: ["Iron Sword", "Longbow", "Fire Staff", "Battle Axe", "Dagger"],
    },
    "racing": {
      cppClasses: ["AVehicleBase", "ARacingGameMode", "ALapManager", "AVehiclePhysics", "ACheckpointActor"],
      blueprints: ["BP_GameMode_Race", "BP_Car_01", "BP_Car_02", "BP_Checkpoint", "BP_Boost", "BP_RaceManager"],
      uiScreens: ["WBP_RaceHUD", "WBP_Speedometer", "WBP_LapTimer", "WBP_MainMenu", "WBP_RaceResults"],
      levels: ["L_MainMenu", "L_RaceTrack_01", "L_RaceTrack_02"],
      weapons: [],
    },
    "platformer": {
      cppClasses: ["APlatformerCharacter", "AMovingPlatform", "AEnemyBase", "ACheckpointActor", "ACollectible"],
      blueprints: ["BP_GameMode_Plat", "BP_PlayerCharacter_Plat", "BP_Enemy_Goomba", "BP_MovingPlatform", "BP_Coin", "BP_PowerUp"],
      uiScreens: ["WBP_HUD_Plat", "WBP_MainMenu", "WBP_PauseMenu", "WBP_GameOver"],
      levels: ["L_MainMenu", "L_World_1_1", "L_World_1_2", "L_Boss_1"],
      weapons: [],
    },
    "default": {
      cppClasses: ["AGameCharacter", "AWeaponBase", "AGameMode_Custom", "AEnemyAI", "APlayerController_Custom"],
      blueprints: ["BP_GameMode", "BP_PlayerCharacter", "BP_Enemy", "BP_Weapon", "BP_Pickup"],
      uiScreens: ["WBP_HUD", "WBP_MainMenu", "WBP_PauseMenu"],
      levels: ["L_MainMenu", "L_World_01"],
      weapons: ["Default Weapon"],
    },
  };

  const specific = plans[gt] || plans.default;
  return {
    title: req.title,
    genre: req.genre,
    gameType: gt,
    description: req.description,
    characters: [`BP_PlayerCharacter`, `BP_EnemyAI_01`],
    mechanics: req.features,
    platform: req.platform,
    ...specific,
  } as GeneratedGamePlan;
}

function inferParentClass(bpName: string): string {
  if (bpName.includes("Character") || bpName.includes("Player")) return "/Script/Engine.Character";
  if (bpName.includes("GameMode")) return "/Script/Engine.GameModeBase";
  if (bpName.includes("Controller")) return "/Script/Engine.PlayerController";
  if (bpName.includes("HUD") || bpName.includes("WBP")) return "/Script/UMG.UserWidget";
  if (bpName.includes("Weapon")) return "/Script/Engine.Actor";
  if (bpName.includes("Enemy") || bpName.includes("AI") || bpName.includes("NPC")) return "/Script/Engine.Character";
  if (bpName.includes("GameState")) return "/Script/Engine.GameStateBase";
  if (bpName.includes("PlayerState")) return "/Script/Engine.PlayerState";
  if (bpName.includes("GameInstance")) return "/Script/Engine.GameInstance";
  return "/Script/Engine.Actor";
}

function generateComponents(bpName: string, gameType: GameType): Record<string, unknown>[] {
  if (bpName.includes("Character") || bpName.includes("Player")) {
    const base: Record<string, unknown>[] = [
      { name: "CharacterMesh", type: "SkeletalMeshComponent", relativeLocation: { X: 0, Y: 0, Z: -90 }, relativeRotation: { Yaw: -90 } },
      { name: "SpringArm", type: "SpringArmComponent", TargetArmLength: gameType === "fps" ? 0 : 400, bUsePawnControlRotation: true },
      { name: "Camera", type: "CameraComponent", bUsePawnControlRotation: false },
      { name: "CapsuleComponent", type: "CapsuleComponent", HalfHeight: 88, Radius: 34 },
    ];
    if (gameType === "fps") {
      base.push({ name: "FPSArmsMesh", type: "SkeletalMeshComponent", relativeLocation: { X: 20, Y: 0, Z: -160 } });
    }
    return base;
  }
  if (bpName.includes("Weapon")) {
    return [
      { name: "WeaponMesh", type: "SkeletalMeshComponent" },
      { name: "MuzzlePoint", type: "SceneComponent", relativeLocation: { X: 50, Y: 0, Z: 0 } },
      { name: "ScopePoint", type: "SceneComponent" },
    ];
  }
  return [{ name: "DefaultSceneRoot", type: "SceneComponent" }];
}

function generateVariables(bpName: string, _genre: string, gameType: GameType): Record<string, unknown>[] {
  const base: Record<string, unknown>[] = [{ name: "bIsActive", type: "Boolean", default: true }];
  if (bpName.includes("Character") || bpName.includes("Player")) {
    const charVars: Record<string, unknown>[] = [
      ...base,
      { name: "Health", type: "Float", default: 100, category: "Stats", replicated: true },
      { name: "MaxHealth", type: "Float", default: 100, category: "Stats" },
      { name: "Shield", type: "Float", default: 0, category: "Stats", replicated: true },
      { name: "MoveSpeed", type: "Float", default: 600, category: "Movement" },
      { name: "SprintSpeed", type: "Float", default: 900, category: "Movement" },
      { name: "bIsDead", type: "Boolean", default: false, category: "State", replicated: true },
      { name: "bIsSprinting", type: "Boolean", default: false, category: "State", replicated: true },
    ];
    if (gameType === "battle-royale") {
      charVars.push({ name: "bIsBuilding", type: "Boolean", default: false, category: "Building" });
      charVars.push({ name: "Materials", type: "Integer", default: 0, category: "Resources", replicated: true });
    }
    if (gameType === "fps") {
      charVars.push({ name: "bIsCrouching", type: "Boolean", default: false, category: "Movement", replicated: true });
      charVars.push({ name: "bIsProne", type: "Boolean", default: false, category: "Movement", replicated: true });
      charVars.push({ name: "KillCount", type: "Integer", default: 0, category: "Stats", replicated: true });
    }
    return charVars;
  }
  return base;
}

function generateBlueprintFunctions(bpName: string, gameType: GameType): object[] {
  if (bpName.includes("Character")) {
    return [
      { name: "OnDeath", pure: false, inputs: [], outputs: [], description: "Handle character death logic" },
      { name: "ApplyDamage", pure: false, inputs: [{ name: "Damage", type: "Float" }, { name: "Instigator", type: "AController*" }], outputs: [], description: "Apply damage to this character" },
      { name: "Heal", pure: false, inputs: [{ name: "Amount", type: "Float" }], outputs: [], description: "Restore health" },
    ];
  }
  return [];
}

function generateWidgetComponents(widgetName: string, gameType: GameType): object[] {
  if (widgetName.includes("HUD")) {
    const base = [
      { name: "HealthBar", type: "ProgressBar", anchors: "BottomLeft", fillColor: "#FF4444" },
      { name: "HealthText", type: "TextBlock", anchors: "BottomLeft" },
      { name: "Crosshair", type: "Image", anchors: "Center" },
    ];
    if (gameType === "fps" || gameType === "battle-royale") {
      base.push({ name: "AmmoCount", type: "TextBlock", anchors: "BottomRight" });
      base.push({ name: "WeaponIcon", type: "Image", anchors: "BottomRight" });
      base.push({ name: "Minimap", type: "Image", anchors: "TopRight" });
      base.push({ name: "KillFeed", type: "ScrollBox", anchors: "TopRight" });
    }
    if (gameType === "battle-royale") {
      base.push({ name: "PlayersAlive", type: "TextBlock", anchors: "TopCenter" });
      base.push({ name: "StormTimer", type: "TextBlock", anchors: "TopCenter" });
      base.push({ name: "ShieldBar", type: "ProgressBar", anchors: "BottomLeft", fillColor: "#4488FF" });
      base.push({ name: "MaterialsCount", type: "TextBlock", anchors: "BottomRight" });
    }
    if (gameType === "mobile") {
      base.push({ name: "VirtualJoystick", type: "CustomWidget", anchors: "BottomLeft" });
      base.push({ name: "FireButton", type: "Button", anchors: "BottomRight" });
      base.push({ name: "JumpButton", type: "Button", anchors: "BottomRight" });
      base.push({ name: "ReloadButton", type: "Button", anchors: "BottomRight" });
    }
    return base;
  }
  if (widgetName.includes("MainMenu")) {
    return [
      { name: "Background", type: "Image", anchors: "FullScreen" },
      { name: "TitleText", type: "TextBlock", anchors: "TopCenter", fontSize: 72 },
      { name: "PlayButton", type: "Button", anchors: "Center", text: "PLAY" },
      { name: "MultiplayerButton", type: "Button", anchors: "Center", text: "MULTIPLAYER" },
      { name: "SettingsButton", type: "Button", anchors: "Center", text: "SETTINGS" },
      { name: "StoreButton", type: "Button", anchors: "Center", text: "STORE" },
      { name: "QuitButton", type: "Button", anchors: "Center", text: "QUIT" },
    ];
  }
  return [{ name: "Canvas", type: "CanvasPanel" }];
}

function generateWidgetAnimations(widgetName: string): object[] {
  if (widgetName.includes("HUD")) {
    return [
      { name: "HitFlash", type: "Flash", tracks: ["Background.ColorAndOpacity"], duration: 0.15 },
      { name: "LowHealthPulse", type: "Loop", tracks: ["HealthBar.FillColorAndOpacity"], duration: 1.0 },
    ];
  }
  return [];
}

function generateSpawnPoints(genre: string, gameType: GameType): object[] {
  const count = gameType === "battle-royale" ? 100 : gameType === "fps" ? 16 : 8;
  return Array.from({ length: count }, (_, i) => ({
    id: `SP_${i + 1}`,
    team: gameType === "fps" ? (i % 2 === 0 ? "TeamA" : "TeamB") : undefined,
    location: { X: (Math.random() - 0.5) * 20000, Y: (Math.random() - 0.5) * 20000, Z: 100 },
    rotation: { Yaw: Math.random() * 360, Pitch: 0, Roll: 0 },
  }));
}

function generateLevelActors(gameType: GameType, levelName: string): object[] {
  if (levelName.includes("Menu")) return [{ type: "BP_MainMenuCamera", location: { X: 0, Y: 0, Z: 200 } }];
  const actors: object[] = [
    { type: "SkyAtmosphere", id: "SkyAtmosphere_0" },
    { type: "DirectionalLight", id: "SunLight", intensity: 10 },
    { type: "SkyLight", id: "SkyLight_0", intensity: 1 },
    { type: "PostProcessVolume", id: "PPV_Global", infinite: true },
    { type: "ReverbVolume", id: "GlobalReverb" },
  ];
  if (gameType === "battle-royale") {
    actors.push({ type: "AStormSystem", id: "StormSystem_0" });
    actors.push({ type: "BP_LootSpawner", id: "LootSpawner_0" });
    actors.push({ type: "BP_AirDropManager", id: "AirDropManager_0" });
    actors.push({ type: "WorldPartitionSubsystem", enabled: true });
    for (let i = 0; i < 12; i++) actors.push({ type: "BP_LootChest", id: `LootChest_${i}`, location: { X: (Math.random() - 0.5) * 15000, Y: (Math.random() - 0.5) * 15000, Z: 50 } });
  }
  return actors;
}

function generateSoundCues(genre: string): object[] {
  const base = [
    { name: "SC_UIClick", type: "SoundCue", volume: 0.8 },
    { name: "SC_UIHover", type: "SoundCue", volume: 0.5 },
    { name: "SC_Ambient_Wind", type: "SoundCue", volume: 0.4, loop: true },
  ];
  if (genre === "shooter" || genre === "fps" || genre === "battle-royale") {
    return [...base,
      { name: "SC_GunShot_AR", type: "SoundCue", volume: 1.0, variations: 3 },
      { name: "SC_GunShot_Sniper", type: "SoundCue", volume: 1.0 },
      { name: "SC_GunShot_Shotgun", type: "SoundCue", volume: 1.0 },
      { name: "SC_Reload_AR", type: "SoundCue", volume: 0.8 },
      { name: "SC_BulletWhiz", type: "SoundCue", volume: 0.7, variations: 4 },
      { name: "SC_Footstep_Dirt", type: "SoundCue", volume: 0.4, variations: 4 },
      { name: "SC_Footstep_Metal", type: "SoundCue", volume: 0.5, variations: 4 },
      { name: "SC_Explosion_Large", type: "SoundCue", volume: 1.0 },
      { name: "SC_PlayerDeath", type: "SoundCue", volume: 0.9 },
      { name: "SC_KillConfirm", type: "SoundCue", volume: 0.8 },
    ];
  }
  return base;
}

function generateMusicTracks(genre: string): object[] {
  return [
    { name: "MT_MainMenu", type: "SoundWave", loop: true, volume: 0.6 },
    { name: "MT_InGame_Calm", type: "SoundWave", loop: true, volume: 0.4 },
    { name: "MT_InGame_Combat", type: "SoundWave", loop: true, volume: 0.7 },
    { name: "MT_Victory", type: "SoundWave", loop: false, volume: 0.8 },
    { name: "MT_Defeat", type: "SoundWave", loop: false, volume: 0.6 },
  ];
}

function generateAmbientSounds(genre: string): object[] {
  return [
    { name: "AMB_Wind", type: "SoundCue", volume: 0.3, loop: true },
    { name: "AMB_Distant_Battle", type: "SoundCue", volume: 0.2, loop: true },
    { name: "AMB_Birds", type: "SoundCue", volume: 0.2, loop: true },
  ];
}

export { generateSoundCues, generateMusicTracks, generateAmbientSounds };

function generateGuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
