import { useGameStore } from "../../store/gameStore";
import { RARITY_COLORS } from "../../data/weapons";
import Minimap from "./Minimap";
import { useRef, useEffect, useState } from "react";

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

  // Compass heading based on a simple timer (in real use would track camera yaw)
  const [compassOffset, setCompassOffset] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      const yaw = (window as any).__playerYaw ?? 0;
      setCompassOffset(-(yaw * 180 / Math.PI) % 360);
    }, 50);
    return () => clearInterval(iv);
  }, []);

  const COMPASS_DIRS = ["N","NE","E","SE","S","SW","W","NW","N","NE","E","SE","S"];
  const compassItems = COMPASS_DIRS.map((d, i) => ({ d, deg: i * 45 }));

  return (
    <>
      {/* ── CROSSHAIR ── */}
      {!buildMode && (
        <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:50, pointerEvents:"none" }}>
          <svg width="28" height="28" viewBox="-14 -14 28 28">
            <line x1="-9" y1="0" x2="-3" y2="0" stroke="white" strokeWidth="1.5" opacity="0.85" />
            <line x1="3" y1="0" x2="9" y2="0" stroke="white" strokeWidth="1.5" opacity="0.85" />
            <line x1="0" y1="-9" x2="0" y2="-3" stroke="white" strokeWidth="1.5" opacity="0.85" />
            <line x1="0" y1="3" x2="0" y2="9" stroke="white" strokeWidth="1.5" opacity="0.85" />
            <circle cx="0" cy="0" r="1.5" fill="rgba(255,255,255,0.8)" />
          </svg>
        </div>
      )}

      {/* ── TOP: Compass bar ── */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:50, pointerEvents:"none" }}>
        {/* Compass strip */}
        <div style={{ display:"flex", justifyContent:"center" }}>
          <div style={{
            background:"rgba(0,0,0,0.55)", borderRadius:"0 0 8px 8px",
            padding:"4px 0 2px", width:340, overflow:"hidden", position:"relative",
          }}>
            {/* Center tick */}
            <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:2, height:"100%", background:"rgba(255,80,80,0.7)" }} />
            <div style={{ display:"flex", justifyContent:"center", gap:0, transform:`translateX(${compassOffset * 0.6}px)`, transition:"none" }}>
              {compassItems.map(({ d }, i) => (
                <span key={i} style={{
                  color: ["N","S","E","W"].includes(d) ? "#ff4444" : "rgba(255,255,255,0.55)",
                  fontSize: ["N","S","E","W"].includes(d) ? 13 : 9,
                  fontWeight: ["N","S","E","W"].includes(d) ? 900 : 400,
                  minWidth: 36, textAlign:"center", letterSpacing:1, lineHeight:"1.4",
                  fontFamily:"monospace",
                }}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Players alive — top center below compass */}
        <div style={{ display:"flex", justifyContent:"center", marginTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(0,0,0,0.6)", borderRadius:20, padding:"3px 12px", border:"1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontSize:12 }}>🚌</span>
            <span style={{ color:"#fff", fontSize:13, fontWeight:900, letterSpacing:1 }}>{playersAlive}</span>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:9, letterSpacing:2 }}>ALIVE</span>
          </div>
        </div>

        {/* Location name top center */}
        {locationName && (
          <div style={{ display:"flex", justifyContent:"center", marginTop:2, pointerEvents:"none" }}>
            <div style={{ background:"rgba(0,0,0,0.45)", borderRadius:4, padding:"2px 12px", color:"rgba(255,255,255,0.7)", fontSize:10, letterSpacing:2, fontWeight:700 }}>
              📍 {locationName}
            </div>
          </div>
        )}

        {/* Storm warning */}
        {inStorm && (
          <div style={{ display:"flex", justifyContent:"center", marginTop:3 }}>
            <div style={{ background:"rgba(160,0,160,0.85)", borderRadius:20, padding:"4px 18px", color:"#fff", fontSize:11, fontWeight:900, letterSpacing:3, animation:"pulse-ring 1s infinite" }}>
              ⚡ STORM DAMAGE — MOVE INSIDE THE CIRCLE ⚡
            </div>
          </div>
        )}

        {/* Top RIGHT — kills + time */}
        <div style={{ position:"absolute", top:4, right:14, display:"flex", gap:6 }}>
          <StatChip icon="⚔️" label="KILLS" value={kills} color="#ffd700" />
          <StatChip icon="⏱" label="TIME" value={`${minutes}:${seconds.toString().padStart(2,"0")}`} color="#fff" />
        </div>
      </div>

      {/* ── TOP LEFT: Minimap ── */}
      <Minimap />

      {/* ── Kill Feed — right side ── */}
      <div style={{ position:"fixed", top:90, right:14, zIndex:50, pointerEvents:"none", display:"flex", flexDirection:"column", gap:3, alignItems:"flex-end" }}>
        {killFeed.slice(0,5).map((entry) => (
          <div key={entry.id} style={{
            background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:3, padding:"3px 8px", fontSize:11, color:"#fff",
            display:"flex", gap:5, alignItems:"center",
            animation:"slide-in-right 0.2s ease-out",
          }}>
            <span style={{ color:"#ffd700", fontWeight:700 }}>{entry.killer}</span>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>✕</span>
            <span style={{ color:"#ff8888" }}>{entry.victim}</span>
          </div>
        ))}
      </div>

      {/* ── BOTTOM LEFT: Health/Shield + Abilities ── */}
      <div style={{ position:"fixed", bottom:120, left:14, zIndex:50, width:220 }}>
        {/* Shield bar */}
        <div style={{ marginBottom:5 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1 L11 3 L11 7 C11 9.5 6 11 6 11 C6 11 1 9.5 1 7 L1 3 Z" fill="#5bc8ff" opacity="0.9"/></svg>
              <span style={{ color:"#5bc8ff", fontSize:10, fontWeight:800, letterSpacing:1 }}>SHIELD</span>
            </div>
            <span style={{ color:"#5bc8ff", fontSize:12, fontWeight:900 }}>{Math.round(shield)}</span>
          </div>
          <div style={{ height:8, background:"rgba(0,0,0,0.5)", borderRadius:4, overflow:"hidden", border:"1px solid rgba(91,200,255,0.25)" }}>
            <div style={{ width:`${(shield/maxShield)*100}%`, height:"100%", background:"linear-gradient(90deg,#5bc8ff,#0088ff)", borderRadius:4, transition:"width 0.2s" }} />
          </div>
        </div>
        {/* Health bar */}
        <div style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:10 }}>❤️</span>
              <span style={{ color:"#ff6b6b", fontSize:10, fontWeight:800, letterSpacing:1 }}>HEALTH</span>
            </div>
            <span style={{ color:"#ff6b6b", fontSize:12, fontWeight:900 }}>{Math.round(health)}</span>
          </div>
          <div style={{ height:14, background:"rgba(0,0,0,0.5)", borderRadius:4, overflow:"hidden", border:"1px solid rgba(255,107,107,0.25)", position:"relative" }}>
            <div style={{ width:`${(health/maxHealth)*100}%`, height:"100%", background:health>50?"linear-gradient(90deg,#2ecc71,#27ae60)":"linear-gradient(90deg,#e74c3c,#c0392b)", borderRadius:4, transition:"width 0.2s" }} />
            {/* Notches every 25 */}
            {[25,50,75].map(n => (
              <div key={n} style={{ position:"absolute", top:0, bottom:0, left:`${n}%`, width:1, background:"rgba(0,0,0,0.4)" }} />
            ))}
          </div>
        </div>
        {/* Ability buttons */}
        <div style={{ display:"flex", gap:5 }}>
          <AbilityButton label="E" shortKey="E" name={selectedCharacter?.tactical ?? "Tactical"} cooldown={tacticalCooldown} max={15} color="#00d4ff" />
          <AbilityButton label="Q" shortKey="Q" name={selectedCharacter?.ultimate ?? "Ultimate"} cooldown={ultimateCooldown} max={60} color="#ffd700" />
        </div>
      </div>

      {/* ── BOTTOM CENTER: Weapon bar ── */}
      <div style={{ position:"fixed", bottom:16, left:"50%", transform:"translateX(-50%)", zIndex:50, display:"flex", gap:3 }}>
        {weapons.map((w, i) => {
          const active = activeSlot === i;
          const rarityColor = w ? RARITY_COLORS[w.rarity] : "rgba(255,255,255,0.1)";
          return (
            <div
              key={i}
              onClick={() => setActiveSlot(i)}
              style={{
                width:64, height:80,
                background: active ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.72)",
                border: active ? `2px solid ${rarityColor}` : `1.5px solid ${w ? rarityColor+"55" : "rgba(255,255,255,0.1)"}`,
                borderRadius:5, cursor:"pointer", position:"relative", overflow:"hidden",
                pointerEvents:"all", transition:"all 0.1s",
                transform: active ? "translateY(-4px)" : "none",
                boxShadow: active ? `0 0 16px ${rarityColor}55, 0 4px 12px rgba(0,0,0,0.5)` : "0 2px 6px rgba(0,0,0,0.4)",
              }}
            >
              {/* Rarity strip */}
              {w && <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:rarityColor }} />}
              {/* Slot num */}
              <div style={{ position:"absolute", top:2, left:4, color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:700 }}>{i+1}</div>
              {w ? (
                <>
                  <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:46, marginTop:10, paddingTop:2 }}>
                    <WeaponSVG type={w.type} color={rarityColor} active={active} />
                  </div>
                  <div style={{ textAlign:"center", lineHeight:1 }}>
                    <div style={{ color:"#fff", fontSize:11, fontWeight:900 }}>{w.type==="Pickaxe"?"∞":w.ammo}</div>
                    {w.type!=="Pickaxe" && <div style={{ color:"rgba(255,255,255,0.4)", fontSize:9 }}>/{w.maxAmmo}</div>}
                  </div>
                </>
              ) : (
                <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"100%", color:"rgba(255,255,255,0.1)", fontSize:22 }}>+</div>
              )}
              {/* Reload overlay */}
              {isReloading && active && (
                <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:3 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid #ffd700", borderTopColor:"transparent", animation:"spin-slow 0.7s linear infinite" }} />
                  <div style={{ color:"#ffd700", fontSize:8, fontWeight:800, letterSpacing:1 }}>RELOAD</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── BOTTOM RIGHT: Materials ── */}
      <div style={{ position:"fixed", bottom:110, right:14, zIndex:50, display:"flex", flexDirection:"column", gap:3 }}>
        {([["wood","#d4a054","🪵"],[  "stone","#9ca3af","🪨"],["metal","#60c8e8","⚙️"]] as const).map(([mat, color, icon]) => (
          <div key={mat}
            onClick={() => useGameStore.getState().setActiveMaterial(mat)}
            style={{
              display:"flex", alignItems:"center", gap:7,
              background: activeMaterial===mat ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.65)",
              border:`1.5px solid ${activeMaterial===mat ? color : "rgba(255,255,255,0.12)"}`,
              borderRadius:5, padding:"5px 10px", cursor:"pointer", pointerEvents:"all",
              minWidth:72, transition:"all 0.1s",
              boxShadow: activeMaterial===mat ? `0 0 10px ${color}44` : "none",
            }}>
            <span style={{ fontSize:13 }}>{icon}</span>
            <span style={{ color, fontWeight:900, fontSize:15, lineHeight:1 }}>{materials[mat]}</span>
          </div>
        ))}
      </div>

      {/* ── XP bar (above weapon bar) ── */}
      <div style={{ position:"fixed", bottom:102, left:"50%", transform:"translateX(-50%)", zIndex:50, pointerEvents:"none", display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ background:"linear-gradient(135deg,#ff8c00,#ff5500)", borderRadius:3, padding:"1px 6px", fontSize:9, fontWeight:900, color:"#fff" }}>LVL {level}</div>
        <div style={{ width:110, height:4, background:"rgba(255,255,255,0.12)", borderRadius:2, overflow:"hidden" }}>
          <div style={{ width:`${(xp%1000)/10}%`, height:"100%", background:"#ffd700", transition:"width 0.3s" }} />
        </div>
        <span style={{ color:"rgba(255,255,255,0.35)", fontSize:9 }}>{xp%1000}/1000</span>
      </div>

      {/* ── Build mode overlay ── */}
      {buildMode && (
        <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:50, background:"rgba(0,0,0,0.8)", border:"2px solid #ffd700", borderRadius:8, padding:"10px 22px", textAlign:"center", pointerEvents:"none" }}>
          <div style={{ color:"#ffd700", fontSize:12, letterSpacing:3, fontWeight:900, textTransform:"uppercase", marginBottom:8 }}>⚒ BUILD MODE</div>
          <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
            {(["wall","floor","ramp","roof","stair"] as const).map((p,i)=>(
              <div key={p} style={{ background:selectedBuildPiece===p?"#ffd700":"rgba(255,255,255,0.1)", color:selectedBuildPiece===p?"#000":"#fff", padding:"4px 7px", borderRadius:3, fontSize:10, fontWeight:700, textTransform:"capitalize" }}>
                <span style={{ opacity:0.6, fontSize:8 }}>{i+1} </span>{p}
              </div>
            ))}
          </div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, marginTop:6 }}>Click to place • B to exit build mode</div>
        </div>
      )}

      {/* ── Floating damage numbers ── */}
      {damageNumbers.map((dn) => (
        <div key={dn.id} style={{
          position:"fixed", left:dn.position.x, top:dn.position.y,
          color: dn.isCritical ? "#ff4444" : "#fff",
          fontSize: dn.isCritical ? 24 : 17,
          fontWeight:900,
          textShadow:"0 0 8px rgba(0,0,0,1), 2px 2px 4px rgba(0,0,0,1)",
          pointerEvents:"none", zIndex:60,
          transform:"translate(-50%,-50%)",
          fontFamily:"monospace",
        }}>
          {dn.isCritical && <span style={{ color:"#ff8c00" }}>★</span>}{Math.round(dn.value)}
        </div>
      ))}

      {/* ── Desktop controls hint ── */}
      <div style={{ position:"fixed", bottom:3, left:"50%", transform:"translateX(-50%)", color:"rgba(255,255,255,0.18)", fontSize:9, letterSpacing:0.5, zIndex:50, pointerEvents:"none", whiteSpace:"nowrap" }}>
        WASD Move · Click Shoot · Space Jump · R Reload · B Build · 1-5 Weapons · E Tactical · Q Ultimate
      </div>
    </>
  );
}

/* ── Stat Chip ── */
function StatChip({ icon, label, value, color }: { icon:string; label:string; value:any; color:string }) {
  return (
    <div style={{ background:"rgba(0,0,0,0.65)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:5, padding:"4px 10px", textAlign:"center", minWidth:50 }}>
      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:8, letterSpacing:1, textTransform:"uppercase" }}>{icon} {label}</div>
      <div style={{ color, fontSize:16, fontWeight:900, lineHeight:1.1 }}>{value}</div>
    </div>
  );
}

/* ── Ability Button ── */
function AbilityButton({ label, shortKey, name, cooldown, max, color }: { label:string; shortKey:string; name:string; cooldown:number; max:number; color:string }) {
  const ready = cooldown <= 0;
  return (
    <div style={{
      background: ready ? `${color}18` : "rgba(0,0,0,0.55)",
      border:`2px solid ${ready ? color : "rgba(255,255,255,0.1)"}`,
      borderRadius:6, padding:"6px 10px", textAlign:"center", minWidth:62, position:"relative", overflow:"hidden",
      transition:"all 0.2s",
    }}>
      {!ready && (
        <div style={{ position:"absolute", bottom:0, left:0, height:`${((max-cooldown)/max)*100}%`, width:"100%", background:`${color}22` }} />
      )}
      <div style={{ color, fontSize:13, fontWeight:900, position:"relative", lineHeight:1 }}>[{shortKey}]</div>
      <div style={{ color: ready ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)", fontSize:8, position:"relative", marginTop:2, lineHeight:1 }}>
        {ready ? name.split(" ")[0] : `${Math.ceil(cooldown)}s`}
      </div>
    </div>
  );
}

/* ── Weapon SVG Icons ── */
function WeaponSVG({ type, color, active }: { type:string; color:string; active:boolean }) {
  const s = active ? 1.15 : 1;
  const shapes: Record<string, React.ReactElement> = {
    AR: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><rect x="2" y="7" width="28" height="7" rx="2" fill={color}/><rect x="30" y="8" width="8" height="4" rx="1" fill={color}/><rect x="10" y="14" width="8" height="5" rx="1" fill={color} opacity="0.7"/><rect x="14" y="5" width="4" height="3" rx="1" fill={color} opacity="0.8"/></svg>,
    Shotgun: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><rect x="2" y="8" width="20" height="6" rx="2" fill={color}/><rect x="22" y="6" width="14" height="10" rx="2" fill={color}/><rect x="8" y="14" width="7" height="5" rx="1" fill={color} opacity="0.7"/></svg>,
    Sniper: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><rect x="2" y="9" width="36" height="4" rx="1" fill={color}/><rect x="6" y="5" width="5" height="9" rx="1" fill={color} opacity="0.8"/><rect x="25" y="4" width="5" height="7" rx="1" fill={color}/><circle cx="34" cy="11" r="2" fill={color} opacity="0.6"/></svg>,
    SMG: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><rect x="2" y="7" width="22" height="7" rx="2" fill={color}/><rect x="24" y="8" width="10" height="5" rx="1" fill={color}/><rect x="6" y="14" width="8" height="5" rx="1" fill={color} opacity="0.7"/><rect x="8" y="5" width="3" height="3" rx="1" fill={color} opacity="0.8"/></svg>,
    Pistol: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><rect x="10" y="7" width="16" height="7" rx="2" fill={color}/><rect x="26" y="8" width="10" height="4" rx="1" fill={color}/><rect x="13" y="14" width="6" height="5" rx="1" fill={color} opacity="0.7"/></svg>,
    RPG: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><rect x="2" y="8" width="30" height="6" rx="3" fill={color}/><polygon points="32,6 40,11 32,16" fill={color}/><rect x="8" y="5" width="5" height="4" rx="1" fill={color} opacity="0.6"/></svg>,
    Grenade: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><circle cx="18" cy="11" r="7" fill={color}/><rect x="15" y="2" width="6" height="5" rx="1" fill={color} opacity="0.8"/><line x1="18" y1="2" x2="24" y2="0" stroke={color} strokeWidth="2"/></svg>,
    Pickaxe: <svg width={40*s} height={20*s} viewBox="0 0 40 20"><line x1="5" y1="16" x2="28" y2="5" stroke={color} strokeWidth="3" strokeLinecap="round"/><path d="M26,3 L36,7 L28,11 Z" fill={color}/><line x1="5" y1="16" x2="14" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>,
  };
  return shapes[type] ?? <div style={{ width:32, height:14, background:color, borderRadius:2 }} />;
}
