import { useGameStore } from "../../store/gameStore";
import { RARITY_COLORS, RARITY_BG } from "../../data/weapons";
import Minimap from "./Minimap";
import { useRef } from "react";

export default function HUD() {
  const health = useGameStore((s) => s.health);
  const shield = useGameStore((s) => s.shield);
  const kills = useGameStore((s) => s.kills);
  const playersAlive = useGameStore((s) => s.playersAlive);
  const matchTime = useGameStore((s) => s.matchTime);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const weapons = useGameStore((s) => s.weapons);
  const activeSlot = useGameStore((s) => s.activeSlot);
  const isReloading = useGameStore((s) => s.isReloading);
  const buildMode = useGameStore((s) => s.buildMode);
  const selectedBuildPiece = useGameStore((s) => s.selectedBuildPiece);
  const stormRadius = useGameStore((s) => s.stormRadius);
  const inStorm = useGameStore((s) => s.inStorm);
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const tacticalCooldown = useGameStore((s) => s.tacticalCooldown);
  const ultimateCooldown = useGameStore((s) => s.ultimateCooldown);
  const materials = useGameStore((s) => s.materials);
  const activeMaterial = useGameStore((s) => s.activeMaterial);
  const killFeed = useGameStore((s) => s.killFeed);
  const damageNumbers = useGameStore((s) => s.damageNumbers);
  const locationName = useGameStore((s) => s.locationName);
  const setActiveSlot = useGameStore((s) => s.setActiveSlot);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);

  const maxHealth = selectedCharacter?.maxHealth ?? 100;
  const maxShield = selectedCharacter?.maxShield ?? 100;
  const minutes = Math.floor(matchTime / 60);
  const seconds = Math.floor(matchTime % 60);

  return (
    <>
      {/* Crosshair */}
      {!buildMode && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, pointerEvents: "none" }}>
          <svg width="24" height="24" viewBox="-12 -12 24 24">
            <line x1="-8" y1="0" x2="-3" y2="0" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <line x1="3" y1="0" x2="8" y2="0" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <line x1="0" y1="-8" x2="0" y2="-3" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <line x1="0" y1="3" x2="0" y2="8" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <circle cx="0" cy="0" r="1.5" fill="white" opacity="0.9" />
          </svg>
        </div>
      )}

      {/* TOP BAR — compass + stats */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, pointerEvents: "none" }}>
        {/* Compass */}
        <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 0" }}>
          <div style={{
            background: "rgba(0,0,0,0.55)", borderBottom: "2px solid rgba(255,255,255,0.12)",
            padding: "4px 20px", display: "flex", gap: 20, alignItems: "center", minWidth: 420, justifyContent: "center",
          }}>
            {["NW","N","NE","E","SE","S","SW","W","NW","N","NE"].map((d, i) => (
              <span key={i} style={{
                color: d === "N" || d === "S" || d === "E" || d === "W" ? "#ff4444" : "rgba(255,255,255,0.6)",
                fontSize: d === "N" || d === "S" || d === "E" || d === "W" ? 14 : 11,
                fontWeight: d === "N" || d === "S" || d === "E" || d === "W" ? 800 : 400,
                fontFamily: "monospace", letterSpacing: 1,
              }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Top right stats */}
        <div style={{ position: "absolute", top: 4, right: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, padding: "5px 12px", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Players</div>
            <div style={{ color: "#ff4444", fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{playersAlive}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, padding: "5px 12px", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Kills</div>
            <div style={{ color: "#ffd700", fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{kills}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4, padding: "5px 12px", textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>Time</div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{minutes}:{seconds.toString().padStart(2,"0")}</div>
          </div>
        </div>

        {/* Storm warning */}
        {inStorm && (
          <div style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)", background: "rgba(160,0,160,0.85)", borderRadius: 4, padding: "4px 18px", color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: 3, pointerEvents: "none" }}>
            ⚡ STORM DAMAGE — MOVE TO SAFETY ⚡
          </div>
        )}
      </div>

      {/* Kill Feed — top right below stats */}
      <div style={{ position: "fixed", top: 60, right: 16, zIndex: 50, pointerEvents: "none", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
        {killFeed.map((entry) => (
          <div key={entry.id} style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "4px 10px", fontSize: 12, color: "#fff", display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "#ffd700", fontWeight: 700 }}>{entry.killer}</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>🔫</span>
            <span style={{ color: "#ff8888" }}>{entry.victim}</span>
          </div>
        ))}
      </div>

      {/* Minimap — top left */}
      <Minimap />

      {/* Floating damage numbers */}
      {damageNumbers.map((dn) => (
        <div key={dn.id} style={{
          position: "fixed",
          left: dn.position.x,
          top: dn.position.y,
          color: dn.isCritical ? "#ff4444" : "#fff",
          fontSize: dn.isCritical ? 22 : 16,
          fontWeight: 900,
          textShadow: "0 0 8px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,0.9)",
          pointerEvents: "none",
          zIndex: 60,
          transform: "translate(-50%,-50%)",
          animation: "none",
          fontFamily: "monospace",
        }}>
          {dn.isCritical && "💥 "}{Math.round(dn.value)}
        </div>
      ))}

      {/* BOTTOM CENTER — Weapon slots bar */}
      <div style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 50, display: "flex", gap: 4 }}>
        {weapons.map((w, i) => (
          <div
            key={i}
            onClick={() => setActiveSlot(i)}
            style={{
              width: 70, height: 86,
              background: activeSlot === i ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.65)",
              border: activeSlot === i
                ? `3px solid ${w ? RARITY_COLORS[w.rarity] : "#fff"}`
                : `2px solid ${w ? RARITY_COLORS[w.rarity] + "88" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 4,
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              pointerEvents: "all",
              transition: "all 0.12s",
            }}
          >
            {/* Rarity bar at bottom */}
            {w && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: RARITY_COLORS[w.rarity] }} />
            )}
            {/* Slot number */}
            <div style={{ position: "absolute", top: 3, left: 5, color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700 }}>
              {i + 1}
            </div>
            {w ? (
              <>
                {/* Weapon icon (colored box representation) */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 50, marginTop: 10 }}>
                  <WeaponIcon type={w.type} color={RARITY_COLORS[w.rarity]} />
                </div>
                {/* Ammo */}
                <div style={{ textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
                  {w.type === "Pickaxe" ? "∞" : w.ammo}
                  {w.type !== "Pickaxe" && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>/{w.maxAmmo}</span>}
                </div>
              </>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "rgba(255,255,255,0.15)", fontSize: 20 }}>+</div>
            )}
            {/* Reload overlay */}
            {isReloading && activeSlot === i && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ color: "#ffd700", fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>RELOAD</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* BOTTOM LEFT — Health/Shield + Abilities */}
      <div style={{ position: "fixed", bottom: 16, left: 16, zIndex: 50, minWidth: 230 }}>
        {/* Shield */}
        <div style={{ marginBottom: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ color: "#5bc8ff", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>🛡 Shield</span>
            <span style={{ color: "#5bc8ff", fontSize: 11, fontWeight: 700 }}>{Math.round(shield)}/{maxShield}</span>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(91,200,255,0.3)" }}>
            <div style={{ width: `${(shield / maxShield) * 100}%`, height: "100%", background: "linear-gradient(90deg, #5bc8ff, #007bff)", transition: "width 0.15s" }} />
          </div>
        </div>
        {/* Health */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>❤ Health</span>
            <span style={{ color: "#ff6b6b", fontSize: 11, fontWeight: 700 }}>{Math.round(health)}/{maxHealth}</span>
          </div>
          <div style={{ height: 14, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", border: "1px solid rgba(255,107,107,0.3)" }}>
            <div style={{ width: `${(health / maxHealth) * 100}%`, height: "100%", background: health > 50 ? "linear-gradient(90deg, #2ecc71, #27ae60)" : "linear-gradient(90deg, #e74c3c, #c0392b)", transition: "width 0.15s" }} />
          </div>
        </div>
        {/* Abilities */}
        <div style={{ display: "flex", gap: 6 }}>
          <AbilityButton label="E" name={selectedCharacter?.tactical ?? "Tactical"} cooldown={tacticalCooldown} max={15} color="#00d4ff" />
          <AbilityButton label="Q" name={selectedCharacter?.ultimate ?? "Ultimate"} cooldown={ultimateCooldown} max={60} color="#ffd700" />
        </div>
      </div>

      {/* BOTTOM RIGHT — Materials */}
      <div style={{ position: "fixed", bottom: 120, right: 16, zIndex: 50, display: "flex", flexDirection: "column", gap: 4 }}>
        {([["wood","#c4883a","🪵"],["stone","#888","🪨"],["metal","#7ec8e3","⚙️"]] as const).map(([mat, color, icon]) => (
          <div key={mat} onClick={() => useGameStore.getState().setActiveMaterial(mat)} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: activeMaterial === mat ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.6)",
            border: `2px solid ${activeMaterial === mat ? color : "rgba(255,255,255,0.15)"}`,
            borderRadius: 4, padding: "5px 12px", cursor: "pointer", pointerEvents: "all", minWidth: 80,
          }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span style={{ color, fontWeight: 800, fontSize: 16 }}>{materials[mat]}</span>
          </div>
        ))}
      </div>

      {/* Build Mode Overlay */}
      {buildMode && (
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, background: "rgba(0,0,0,0.75)", border: "2px solid #ffd700", borderRadius: 8, padding: "10px 22px", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ color: "#ffd700", fontSize: 13, letterSpacing: 3, fontWeight: 800, textTransform: "uppercase" }}>BUILD MODE</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "center" }}>
            {(["wall","floor","ramp","roof","stair"] as const).map((p, i) => (
              <div key={p} style={{ background: selectedBuildPiece === p ? "#ffd700" : "rgba(255,255,255,0.1)", color: selectedBuildPiece === p ? "#000" : "#fff", padding: "4px 8px", borderRadius: 3, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
                {i + 1} {p}
              </div>
            ))}
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 5 }}>Click to place • B to exit</div>
        </div>
      )}

      {/* Level / XP bar */}
      <div style={{ position: "fixed", bottom: 108, left: "50%", transform: "translateX(-50%)", zIndex: 50, pointerEvents: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ color: "#ffd700", fontSize: 11, fontWeight: 800 }}>LVL {level}</div>
        <div style={{ width: 120, height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
          <div style={{ width: `${(xp % 1000) / 10}%`, height: "100%", background: "#ffd700", borderRadius: 2 }} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{xp % 1000}/1000</div>
      </div>

      {/* Controls hint */}
      <div style={{ position: "fixed", bottom: 4, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.2)", fontSize: 10, letterSpacing: 0.5, zIndex: 50, pointerEvents: "none", whiteSpace: "nowrap" }}>
        WASD Move · Click Shoot · R Reload · B Build · 1-5 Slots · F Harvest · E Tactical · Q Ultimate
      </div>
    </>
  );
}

function WeaponIcon({ type, color }: { type: string; color: string }) {
  const shapes: Record<string, React.ReactElement> = {
    AR: <svg width="40" height="20" viewBox="0 0 40 20"><rect x="2" y="7" width="28" height="7" rx="2" fill={color}/><rect x="30" y="8" width="8" height="4" rx="1" fill={color}/><rect x="10" y="14" width="8" height="5" rx="1" fill={color} opacity="0.7"/></svg>,
    Shotgun: <svg width="40" height="20" viewBox="0 0 40 20"><rect x="2" y="8" width="22" height="6" rx="2" fill={color}/><rect x="24" y="7" width="12" height="8" rx="2" fill={color}/><rect x="10" y="14" width="6" height="5" rx="1" fill={color} opacity="0.7"/></svg>,
    Sniper: <svg width="40" height="20" viewBox="0 0 40 20"><rect x="2" y="9" width="36" height="4" rx="1" fill={color}/><rect x="6" y="6" width="6" height="8" rx="1" fill={color} opacity="0.7"/><rect x="26" y="5" width="4" height="6" rx="1" fill={color}/></svg>,
    SMG: <svg width="40" height="20" viewBox="0 0 40 20"><rect x="2" y="7" width="20" height="7" rx="2" fill={color}/><rect x="22" y="8" width="10" height="5" rx="1" fill={color}/><rect x="8" y="14" width="6" height="5" rx="1" fill={color} opacity="0.7"/></svg>,
    Pistol: <svg width="40" height="20" viewBox="0 0 40 20"><rect x="8" y="7" width="16" height="7" rx="2" fill={color}/><rect x="24" y="8" width="10" height="4" rx="1" fill={color}/><rect x="12" y="14" width="6" height="5" rx="1" fill={color} opacity="0.7"/></svg>,
    RPG: <svg width="40" height="20" viewBox="0 0 40 20"><rect x="2" y="8" width="30" height="6" rx="3" fill={color}/><polygon points="32,7 40,11 32,15" fill={color}/></svg>,
    Pickaxe: <svg width="40" height="20" viewBox="0 0 40 20"><line x1="5" y1="15" x2="30" y2="5" stroke={color} strokeWidth="3" strokeLinecap="round"/><path d="M28,3 L36,8 L30,10 Z" fill={color}/></svg>,
  };
  return shapes[type] || <div style={{ width: 30, height: 14, background: color, borderRadius: 2 }} />;
}

function AbilityButton({ label, name, cooldown, max, color }: { label: string; name: string; cooldown: number; max: number; color: string }) {
  const ready = cooldown <= 0;
  return (
    <div style={{ background: ready ? `${color}22` : "rgba(0,0,0,0.5)", border: `2px solid ${ready ? color : "rgba(255,255,255,0.12)"}`, borderRadius: 5, padding: "5px 9px", textAlign: "center", minWidth: 58, position: "relative", overflow: "hidden" }}>
      {!ready && <div style={{ position: "absolute", bottom: 0, left: 0, height: `${((max - cooldown) / max) * 100}%`, width: "100%", background: `${color}22` }} />}
      <div style={{ color, fontSize: 12, fontWeight: 800, position: "relative" }}>{label}</div>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, position: "relative" }}>{ready ? name.split(" ")[0] : `${Math.ceil(cooldown)}s`}</div>
    </div>
  );
}
