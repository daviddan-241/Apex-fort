import { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import { getCharacter } from "@/data/characters";
import Minimap from "./Minimap";

const RARITY_COLORS: Record<string, string> = {
  Mythic: "#e879f9", Legendary: "#fbbf24", Epic: "#a78bfa", Rare: "#60a5fa", Common: "#9ca3af",
};

// Fortnite-style health/shield bar
function VitalBar({ value, max, color, bg, icon }: {
  value: number; max: number; color: string; bg: string; icon: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] w-3 text-center">{icon}</span>
      <div
        className="flex-1 h-3 rounded-sm overflow-hidden relative"
        style={{ background: bg, border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-150"
          style={{
            width: `${pct}%`,
            background: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
        {/* Shine */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>
      <span className="text-[10px] font-mono w-7 text-right" style={{ color: pct < 30 ? "#ef4444" : "#9ca3af" }}>
        {Math.ceil(value)}
      </span>
    </div>
  );
}

// Fortnite-style weapon slot
function WeaponSlot({ weapon, active, index }: {
  weapon?: { name: string; ammo: number; maxAmmo: number; rarity: string; type: string; isReloading: boolean };
  active: boolean;
  index: number;
}) {
  const rarityColor = weapon ? (RARITY_COLORS[weapon.rarity] ?? "#9ca3af") : "#2a2a3a";
  const ammoPct = weapon ? weapon.ammo / weapon.maxAmmo : 0;

  return (
    <div
      className="relative flex flex-col items-center transition-all duration-150"
      style={{
        width: 58,
        padding: "6px 4px",
        background: active
          ? "linear-gradient(180deg, rgba(255,140,0,0.15), rgba(255,80,0,0.08))"
          : "rgba(0,0,0,0.5)",
        border: active
          ? "1px solid rgba(255,140,0,0.6)"
          : weapon ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.05)",
        borderRadius: "3px",
        boxShadow: active ? "0 0 15px rgba(255,140,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
        transform: active ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* Rarity top bar */}
      {weapon && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t"
          style={{ background: rarityColor, opacity: 0.8 }}
        />
      )}

      {/* Slot number */}
      <div
        className="text-[8px] font-mono mb-1"
        style={{ color: active ? "#ff8c00" : "#4a4a5a" }}
      >
        {index + 1}
      </div>

      {weapon ? (
        <>
          {/* Weapon icon */}
          <div
            className="w-9 h-5 rounded-sm mb-1.5 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${rarityColor}40, ${rarityColor}15)`,
              border: `1px solid ${rarityColor}30`,
            }}
          >
            <div className="w-6 h-1.5 rounded-sm" style={{ background: rarityColor, opacity: 0.7 }} />
          </div>

          {/* Name */}
          <div
            className="text-[7px] font-display uppercase text-center leading-tight truncate w-full px-0.5"
            style={{ color: active ? "#ff8c00" : "#6b7280" }}
          >
            {weapon.name.split(" ").pop()}
          </div>

          {/* Ammo */}
          {weapon.isReloading ? (
            <div className="text-[7px] font-mono text-yellow-400 mt-0.5 animate-pulse">RELOAD</div>
          ) : (
            <div
              className="text-[9px] font-mono mt-0.5"
              style={{ color: ammoPct < 0.25 ? "#ef4444" : "#6b7280" }}
            >
              {weapon.ammo}<span className="text-[7px] opacity-50">/{weapon.maxAmmo}</span>
            </div>
          )}

          {/* Ammo bar */}
          <div className="w-full h-0.5 rounded-full overflow-hidden mt-1" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${ammoPct * 100}%`,
                background: ammoPct < 0.25 ? "#ef4444" : "#3b82f6",
              }}
            />
          </div>
        </>
      ) : (
        <div className="text-[8px] font-mono text-gray-700 mt-2">—</div>
      )}
    </div>
  );
}

// Fortnite-style ability icon with conic cooldown
function AbilityIcon({ name, type, keyLabel, cooldownLeft, max }: {
  name: string; type: string; keyLabel: string; cooldownLeft: number; max: number;
}) {
  const ready = cooldownLeft <= 0;
  const pct = max > 0 ? cooldownLeft / max : 0;
  const color = type === "passive" ? "#6b7280" : type === "tactical" ? "#60a5fa" : "#ff8c00";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative w-12 h-12 rounded flex items-center justify-center overflow-hidden"
        style={{
          background: ready ? `linear-gradient(135deg, ${color}30, ${color}15)` : "rgba(0,0,0,0.6)",
          border: `2px solid ${ready ? color : `${color}35`}`,
          boxShadow: ready ? `0 0 12px ${color}50, inset 0 1px 0 rgba(255,255,255,0.1)` : "none",
        }}
      >
        {/* Conic cooldown overlay */}
        {pct > 0 && (
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(rgba(0,0,0,0.75) ${pct * 360}deg, transparent ${pct * 360}deg)`,
            }}
          />
        )}
        <span
          className="text-sm font-display font-bold relative z-10"
          style={{ color: ready ? color : `${color}50` }}
        >
          {keyLabel}
        </span>
      </div>
      <div className="text-[7px] font-mono uppercase text-center leading-tight" style={{ color: `${color}70`, maxWidth: 48 }}>
        {ready ? name.split(" ")[0] : `${Math.ceil(cooldownLeft)}s`}
      </div>
    </div>
  );
}

// Fortnite kill feed
function KillFeed() {
  const killFeed = useGameStore(s => s.killFeed);
  const cleanKillFeed = useGameStore(s => s.cleanKillFeed);

  useEffect(() => {
    const id = setInterval(cleanKillFeed, 500);
    return () => clearInterval(id);
  }, [cleanKillFeed]);

  if (killFeed.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {killFeed.map((entry, i) => (
        <div
          key={entry.id}
          className="kill-feed-entry flex items-center gap-1.5 px-2.5 py-1.5 rounded"
          style={{
            background: entry.killer === "You" ? "rgba(255,140,0,0.12)" : "rgba(0,0,0,0.65)",
            border: `1px solid ${entry.killer === "You" ? "rgba(255,140,0,0.3)" : "rgba(255,255,255,0.07)"}`,
            opacity: Math.max(0.4, 1 - i * 0.18),
            backdropFilter: "blur(4px)",
          }}
        >
          <span
            className="text-[10px] font-display font-bold uppercase"
            style={{ color: entry.killer === "You" ? "#ff8c00" : "#9ca3af" }}
          >
            {entry.killer}
          </span>
          <span className="text-[8px]">💀</span>
          <span className="text-[10px] font-mono text-gray-400">{entry.victim}</span>
          <span
            className="text-[8px] font-mono ml-1 px-1 rounded"
            style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280" }}
          >
            {entry.weapon.split(" ").slice(0, 2).join(" ")}
          </span>
        </div>
      ))}
    </div>
  );
}

// Storm HUD — Fortnite style
function StormHUD() {
  const { stormPhase, stormTimeLeft, stormRadius, playerPosition, stormCenter, stormDamageActive } = useGameStore();
  const dx = playerPosition[0] - stormCenter[0];
  const dz = playerPosition[2] - stormCenter[1];
  const distFromCenter = Math.sqrt(dx * dx + dz * dz);
  const distToStorm = Math.max(0, distFromCenter - stormRadius);
  const inStorm = distFromCenter > stormRadius;
  const maxDuration = [90, 75, 60, 50, 40][stormPhase] ?? 90;

  return (
    <div
      className="flex flex-col gap-1.5 px-3.5 py-2.5 rounded"
      style={{
        background: inStorm ? "rgba(80,20,200,0.25)" : "rgba(0,0,0,0.65)",
        border: `1px solid ${inStorm ? "rgba(120,60,255,0.6)" : "rgba(80,40,180,0.3)"}`,
        backdropFilter: "blur(8px)",
        minWidth: 170,
        boxShadow: inStorm ? "0 0 20px rgba(100,60,255,0.3)" : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: "#7060cc" }}>
          ⚡ Storm · Phase {stormPhase + 1}
        </span>
        {inStorm && (
          <span className="text-[8px] font-mono text-red-400 font-bold animate-pulse">IN STORM</span>
        )}
      </div>

      {/* Big countdown */}
      <div
        className="font-display font-bold"
        style={{
          fontSize: "1.6rem",
          color: inStorm ? "#ef4444" : stormTimeLeft < 20 ? "#f59e0b" : "#a0a0ff",
          lineHeight: 1,
          textShadow: inStorm ? "0 0 12px rgba(239,68,68,0.6)" : "none",
        }}
      >
        {Math.floor(stormTimeLeft / 60)}:{String(Math.round(stormTimeLeft % 60)).padStart(2, "0")}
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(stormTimeLeft / maxDuration) * 100}%`,
            background: inStorm
              ? "linear-gradient(90deg, #ef4444, #dc2626)"
              : "linear-gradient(90deg, #6060cc, #a0a0ff)",
          }}
        />
      </div>

      <div className="text-[8px] font-mono" style={{ color: inStorm ? "#ef444480" : "#6060aa" }}>
        {inStorm ? "Move to safe zone!" : `Safe: ${Math.round(distToStorm)}m away`}
      </div>
    </div>
  );
}

// Material count pill — Fortnite style
function MatPill({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}30`,
      }}
    >
      <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
      <span className="text-[10px] font-display font-bold" style={{ color: value < 20 ? "#ef4444" : color }}>
        {value}
      </span>
    </div>
  );
}

export default function HUD() {
  const {
    playerHp, playerMaxHp, playerShield, playerMaxShield,
    playerArmor, weapons, activeWeaponIndex, kills,
    wood, stone, metal, buildMode, buildPiece, buildMaterial,
    bots, stormDamageActive, reload, switchWeapon,
  } = useGameStore();

  const selectedCharacter = useGameStore(s => s.selectedCharacter);
  const char = getCharacter(selectedCharacter);

  const [tacticalCd, setTacticalCd] = useState(0);
  const [ultimateCd, setUltimateCd] = useState(0);
  const [showDamageVignette, setShowDamageVignette] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const lastHp = useRef(playerHp);

  // Track pointer lock state
  useEffect(() => {
    const onChange = () => setPointerLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  // Damage vignette
  useEffect(() => {
    if (playerHp < lastHp.current) {
      setShowDamageVignette(true);
      setTimeout(() => setShowDamageVignette(false), 400);
    }
    lastHp.current = playerHp;
  }, [playerHp]);

  // Ability keys
  const handleAbilityKey = useCallback((e: KeyboardEvent) => {
    if (e.code === "KeyQ" && tacticalCd <= 0) setTacticalCd(char.tacticalCooldown);
    if (e.code === "KeyF" && ultimateCd <= 0) setUltimateCd(char.ultimateCooldown);
    if (e.code === "KeyR") reload();
    if (e.code.startsWith("Digit")) {
      const n = parseInt(e.code.replace("Digit", "")) - 1;
      if (n >= 0 && n < 5) switchWeapon(n);
    }
  }, [char, tacticalCd, ultimateCd, reload, switchWeapon]);

  useEffect(() => {
    window.addEventListener("keydown", handleAbilityKey);
    return () => window.removeEventListener("keydown", handleAbilityKey);
  }, [handleAbilityKey]);

  // Cooldown tick
  useEffect(() => {
    const id = setInterval(() => {
      setTacticalCd(c => Math.max(0, c - 0.1));
      setUltimateCd(c => Math.max(0, c - 0.1));
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Scroll to switch weapons
  useEffect(() => {
    const onScroll = (e: WheelEvent) => {
      const delta = e.deltaY > 0 ? 1 : -1;
      const current = useGameStore.getState().activeWeaponIndex;
      const count = useGameStore.getState().weapons.length;
      switchWeapon((current + delta + count) % count);
    };
    window.addEventListener("wheel", onScroll);
    return () => window.removeEventListener("wheel", onScroll);
  }, [switchWeapon]);

  const aliveBots = bots.filter(b => !b.isDead).length;
  const currentWeapon = weapons[activeWeaponIndex];
  const tacticalAbility = char.abilities.find(a => a.type === "tactical");
  const ultimateAbility = char.abilities.find(a => a.type === "ultimate");
  const passiveAbility = char.abilities.find(a => a.type === "passive");

  return (
    <>
      {/* Damage flash vignette */}
      {showDamageVignette && <div className="damage-vignette" />}
      {/* Storm vignette */}
      {stormDamageActive && <div className="storm-vignette" />}

      {/* ── CROSSHAIR ── */}
      {pointerLocked && (
        <div className="crosshair">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <line x1="14" y1="1" x2="14" y2="9" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            <line x1="14" y1="19" x2="14" y2="27" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            <line x1="1" y1="14" x2="9" y2="14" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            <line x1="19" y1="14" x2="27" y2="14" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            <circle cx="14" cy="14" r="1.5" fill="rgba(255,255,255,0.95)" />
          </svg>
        </div>
      )}

      {/* ── TOP LEFT — Squad count + kills ── */}
      <div
        className="fixed top-4 left-4 flex items-center gap-3 px-3 py-2 rounded"
        style={{
          background: "rgba(0,0,0,0.65)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Players alive */}
        <div className="text-center">
          <div className="font-display font-bold text-2xl text-white leading-none">{aliveBots + 1}</div>
          <div className="text-[8px] font-mono uppercase text-gray-500 tracking-widest">Alive</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        {/* Kills */}
        <div className="text-center">
          <div className="font-display font-bold text-2xl leading-none" style={{ color: "#ff8c00" }}>{kills}</div>
          <div className="text-[8px] font-mono uppercase text-gray-500 tracking-widest">Kills</div>
        </div>
      </div>

      {/* ── TOP CENTER — Storm ── */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2">
        <StormHUD />
      </div>

      {/* ── TOP RIGHT — Minimap + Kill feed ── */}
      <div className="fixed top-4 right-4 flex flex-col items-end gap-2">
        <Minimap />
        <KillFeed />
      </div>

      {/* ── BOTTOM LEFT — Health bars + Character ── */}
      <div
        className="fixed bottom-20 left-4 flex flex-col gap-1.5 p-3 rounded"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
          minWidth: 210,
        }}
      >
        {/* Character tag */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-display font-bold"
            style={{ background: `${char.color}30`, border: `1px solid ${char.color}50`, color: char.color }}
          >
            {char.name[0]}
          </div>
          <div>
            <div className="text-[9px] font-display font-bold uppercase leading-none" style={{ color: char.color }}>
              {char.name}
            </div>
            <div className="text-[7px] font-mono text-gray-600 uppercase">{char.role}</div>
          </div>
        </div>

        <VitalBar value={playerHp} max={playerMaxHp} color="linear-gradient(90deg,#dc2626,#ef4444)" bg="rgba(220,38,38,0.15)" icon="❤" />
        <VitalBar value={playerShield} max={playerMaxShield} color="linear-gradient(90deg,#2563eb,#3b82f6)" bg="rgba(59,130,246,0.12)" icon="🛡" />
        <VitalBar value={playerArmor} max={100} color="linear-gradient(90deg,#4b5563,#6b7280)" bg="rgba(107,114,128,0.12)" icon="⚔" />

        {/* Materials */}
        <div className="flex items-center gap-1.5 mt-1 pt-1.5 border-t border-white/5">
          <MatPill icon="W" value={wood} color="#a0783a" />
          <MatPill icon="S" value={stone} color="#8a8a9a" />
          <MatPill icon="M" value={metal} color="#6a8090" />
          {buildMode && (
            <span
              className="text-[8px] font-mono ml-auto px-1.5 py-0.5 rounded uppercase"
              style={{ background: "rgba(255,140,0,0.15)", color: "#ff8c00", border: "1px solid rgba(255,140,0,0.3)" }}
            >
              {buildPiece[0]}
            </span>
          )}
        </div>
      </div>

      {/* ── BOTTOM CENTER — Weapon hotbar ── */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1.5 px-3 py-2 rounded"
        style={{
          background: "rgba(0,0,0,0.7)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
        }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <WeaponSlot key={i} weapon={weapons[i]} active={i === activeWeaponIndex} index={i} />
        ))}

        {/* Current weapon ammo — big Fortnite style */}
        {currentWeapon && (
          <div
            className="ml-3 pl-3 flex flex-col justify-end"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", minWidth: 60 }}
          >
            <div
              className="font-display font-bold leading-none"
              style={{
                fontSize: "1.8rem",
                color: currentWeapon.ammo === 0 ? "#ef4444" : "#fff",
                textShadow: currentWeapon.ammo === 0 ? "0 0 10px rgba(239,68,68,0.6)" : "none",
              }}
            >
              {currentWeapon.isReloading ? "···" : currentWeapon.ammo}
            </div>
            <div className="text-[9px] font-mono text-gray-600">/ {currentWeapon.reserveAmmo}</div>
            <div
              className="text-[7px] font-mono uppercase mt-0.5"
              style={{ color: RARITY_COLORS[currentWeapon.rarity] ?? "#9ca3af" }}
            >
              {currentWeapon.type}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM RIGHT — Abilities ── */}
      <div
        className="fixed bottom-4 right-4 flex flex-col items-end gap-2"
      >
        <div className="flex items-end gap-2">
          {passiveAbility && (
            <AbilityIcon name={passiveAbility.name} type="passive" keyLabel="P" cooldownLeft={0} max={0} />
          )}
          {tacticalAbility && (
            <AbilityIcon name={tacticalAbility.name} type="tactical" keyLabel="Q" cooldownLeft={tacticalCd} max={char.tacticalCooldown} />
          )}
          {ultimateAbility && (
            <AbilityIcon name={ultimateAbility.name} type="ultimate" keyLabel="F" cooldownLeft={ultimateCd} max={char.ultimateCooldown} />
          )}
        </div>
      </div>

      {/* Build mode panel */}
      {buildMode && (
        <div
          className="fixed left-4 top-1/2 -translate-y-1/2 px-3 py-3 rounded flex flex-col gap-1"
          style={{
            background: "rgba(255,140,0,0.1)",
            border: "1px solid rgba(255,140,0,0.4)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="text-[8px] font-mono uppercase tracking-widest text-orange-400 mb-1">🔨 Build Mode</div>
          <div className="text-sm font-display font-bold text-orange-300 uppercase">{buildPiece}</div>
          <div
            className="text-[9px] font-mono capitalize"
            style={{ color: buildMaterial === "WOOD" ? "#a0783a" : buildMaterial === "STONE" ? "#8a8a9a" : "#6a8090" }}
          >
            {buildMaterial}
          </div>
          <div className="mt-2 space-y-0.5 text-[8px] font-mono text-gray-600">
            <div>[B] Exit</div>
            <div>[V] Piece</div>
            <div>[LMB] Place</div>
          </div>
        </div>
      )}

      {/* Click to play overlay */}
      {!pointerLocked && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
        >
          <div
            className="text-center px-10 py-6 rounded"
            style={{
              background: "rgba(5,5,15,0.95)",
              border: "1px solid rgba(255,140,0,0.4)",
              boxShadow: "0 0 40px rgba(255,140,0,0.15)",
            }}
          >
            <div className="text-3xl mb-3">🎮</div>
            <div className="font-display font-bold text-2xl uppercase tracking-widest" style={{ color: "#ff8c00" }}>
              Click to Play
            </div>
            <div className="text-xs font-mono text-gray-500 mt-2">Locks mouse for full control</div>
            <div className="mt-4 text-[10px] font-mono text-gray-700 space-y-0.5">
              <div>WASD Move · Shift Sprint · Space Jump</div>
              <div>LMB Shoot · E Pickup · B Build · R Reload</div>
              <div>Q Tactical · F Ultimate · 1-5 Weapons</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
