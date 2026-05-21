import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { CHARACTERS } from "../../data/characters";
import { CharacterDef } from "../../types/game";

const CHAR_ICONS: Record<string, string> = {
  soldier: "🪖", ninja: "🥷", cyber: "🤖", warrior: "⚔️",
  ghost: "👻", hero: "🦸", assassin: "🗡️", thief: "🎭",
};

const CHAR_RARITY: Record<string, string> = {
  soldier: "uncommon", ninja: "rare", cyber: "epic",
  warrior: "uncommon", ghost: "legendary", hero: "rare",
  assassin: "epic", thief: "legendary",
};

const RARITY_LABEL: Record<string, string> = {
  uncommon: "UNCOMMON", rare: "RARE", epic: "EPIC", legendary: "LEGENDARY",
};
const RARITY_COLOR: Record<string, string> = {
  uncommon: "#2ecc71", rare: "#3498db", epic: "#9b59b6", legendary: "#f39c12",
};
const RARITY_BG: Record<string, string> = {
  uncommon: "linear-gradient(160deg,#1a4a2a,#0d2a18)",
  rare: "linear-gradient(160deg,#1a2a4a,#0d1828)",
  epic: "linear-gradient(160deg,#2a1a4a,#180d28)",
  legendary: "linear-gradient(160deg,#4a2a00,#281800)",
};

export default function CharacterSelect() {
  const [selected, setSelected] = useState<CharacterDef>(CHARACTERS[0]);
  const [activeTab, setActiveTab] = useState<"skins" | "back" | "pickaxe">("skins");
  const setCharacter = useGameStore((s) => s.setCharacter);
  const setPhase = useGameStore((s) => s.setPhase);

  const rarity = CHAR_RARITY[selected.id] ?? "uncommon";

  const handlePlay = () => {
    setCharacter(selected);
    setPhase("dropping");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Background — character art with color overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "url('/chars-art.jpg')",
        backgroundSize: "cover", backgroundPosition: "center 20%",
        filter: "brightness(0.45) saturate(0.8)",
      }} />

      {/* Color tint from selected character rarity */}
      <div style={{
        position: "absolute", inset: 0,
        background: RARITY_BG[rarity],
        opacity: 0.7,
      }} />

      {/* Top gradient */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)" }} />
      {/* Bottom gradient */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 220, background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)" }} />

      {/* ── TOP BAR ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        {/* Back */}
        <button
          onClick={() => setPhase("menu")}
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "7px 18px", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          ← BACK
        </button>

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, letterSpacing: 6, fontWeight: 700, textTransform: "uppercase" }}>CHOOSE YOUR OUTFIT</div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1 }}>LOCKER</div>
        </div>

        {/* Deploy */}
        <button
          onClick={handlePlay}
          style={{
            background: "linear-gradient(135deg, #ff8c00, #ff5500)",
            border: "2px solid rgba(255,255,255,0.3)",
            borderRadius: 6, padding: "8px 24px",
            color: "#fff", fontSize: 13, fontWeight: 900, letterSpacing: 3, cursor: "pointer",
            textTransform: "uppercase",
            boxShadow: "0 0 20px rgba(255,120,0,0.5)",
          }}
        >
          DEPLOY
        </button>
      </div>

      {/* ── CENTER SHOWCASE ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Large character display */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Glow circle behind character */}
          <div style={{
            position: "absolute", width: 280, height: 280,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${RARITY_COLOR[rarity]}33, transparent 70%)`,
            filter: "blur(20px)", top: "10%",
          }} />

          {/* Character figure */}
          <div style={{ position: "relative", animation: "lobby-float 3s ease-in-out infinite" }}>
            {/* Particle ring */}
            <div style={{
              position: "absolute", inset: -30,
              borderRadius: "50%",
              border: `1px solid ${RARITY_COLOR[rarity]}33`,
              animation: "pulse-ring 2.5s infinite",
            }} />

            {/* Character body */}
            <div style={{ position: "relative", width: 160, height: 240 }}>
              {/* Shadow */}
              <div style={{
                position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)",
                width: 140, height: 18, borderRadius: "50%",
                background: `radial-gradient(ellipse, rgba(0,0,0,0.5), transparent 70%)`,
              }} />
              {/* Legs */}
              {[-18, 18].map((x, i) => (
                <div key={i} style={{
                  position: "absolute", left: `calc(50% + ${x}px)`, bottom: 0,
                  width: 30, height: 80, borderRadius: "0 0 12px 12px",
                  background: `linear-gradient(160deg, ${selected.color}cc, ${selected.color}88)`,
                  transform: `rotate(${i===0?"-1deg":"1deg"})`,
                }} />
              ))}
              {/* Torso */}
              <div style={{
                position: "absolute", left: "50%", top: 80, transform: "translateX(-50%)",
                width: 86, height: 120, borderRadius: "30% 30% 15% 15% / 25% 25% 15% 15%",
                background: `linear-gradient(160deg, ${selected.accentColor}, ${selected.color})`,
                boxShadow: `0 0 40px ${selected.color}66, 0 20px 40px rgba(0,0,0,0.5)`,
              }}>
                {/* Armor details */}
                <div style={{ position: "absolute", top: 10, left: 10, right: 10, height: 25, borderRadius: 4, background: `${selected.accentColor}88`, border: `1px solid ${selected.accentColor}` }} />
                <div style={{ position: "absolute", bottom: 10, left: 14, right: 14, height: 16, borderRadius: 3, background: `rgba(255,255,255,0.08)`, border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {/* Arms */}
              {[-46, 46].map((x, i) => (
                <div key={i} style={{
                  position: "absolute", left: `calc(50% + ${x}px)`, top: 88,
                  width: 22, height: 75, borderRadius: "40% 40% 30% 30%",
                  background: `linear-gradient(160deg, ${selected.accentColor}, ${selected.color})`,
                  transform: `translateX(-50%) rotate(${i===0?"-8deg":"8deg"})`,
                }}>
                  {/* Hand */}
                  <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 18, height: 20, borderRadius: "50% 50% 40% 40%", background: selected.accentColor }} />
                </div>
              ))}
              {/* Head */}
              <div style={{
                position: "absolute", left: "50%", top: 20, transform: "translateX(-50%)",
                width: 66, height: 66, borderRadius: "50%",
                background: `radial-gradient(circle at 35% 28%, ${selected.accentColor}, ${selected.color})`,
                border: `3px solid ${RARITY_COLOR[rarity]}`,
                boxShadow: `0 0 25px ${selected.color}88`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26,
              }}>
                {CHAR_ICONS[selected.id]}
                {/* Helmet visor glint */}
                <div style={{ position: "absolute", top: 10, left: 12, width: 16, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)", transform: "rotate(-15deg)" }} />
              </div>
              {/* Weapon (right hand) */}
              <div style={{
                position: "absolute", right: -18, top: 95,
                width: 16, height: 65, borderRadius: 4,
                background: `linear-gradient(160deg, #555, #222)`,
                transform: "rotate(12deg)",
                boxShadow: "0 0 8px rgba(0,0,0,0.6)",
              }} />
            </div>
          </div>

          {/* Name + rarity badge */}
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(0,0,0,0.7)", border: `2px solid ${RARITY_COLOR[rarity]}`,
              borderRadius: 6, padding: "5px 20px", marginBottom: 6,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: RARITY_COLOR[rarity], boxShadow: `0 0 8px ${RARITY_COLOR[rarity]}` }} />
              <span style={{ color: RARITY_COLOR[rarity], fontSize: 10, fontWeight: 900, letterSpacing: 3 }}>{RARITY_LABEL[rarity]}</span>
            </div>
            <div style={{ color: "#fff", fontSize: 26, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", textShadow: `0 0 20px ${selected.color}88` }}>
              {selected.name}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4, maxWidth: 260 }}>{selected.description}</div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 14, marginTop: 10, justifyContent: "center" }}>
              {[
                { label: "HP", value: selected.maxHealth, max: 200, color: "#2ecc71" },
                { label: "SP", value: selected.maxShield, max: 200, color: "#5bc8ff" },
                { label: "SPD", value: Math.round(selected.moveSpeed * 10), max: 160, color: "#f39c12" },
              ].map(({ label, value, max, color }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ color, fontSize: 16, fontWeight: 900, lineHeight: 1 }}>{value}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, letterSpacing: 2 }}>{label}</div>
                  <div style={{ width: 36, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 1, marginTop: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(value/max)*100}%`, height: "100%", background: color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Ability pills */}
            <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center" }}>
              <AbilityPill icon="⚡" label="TACTICAL" name={selected.tactical} color="#00d4ff" key_label="E" />
              <AbilityPill icon="💥" label="ULTIMATE" name={selected.ultimate} color="#ffd700" key_label="Q" />
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM: Character Grid ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          {[
            { id: "skins" as const, label: "OUTFITS", icon: "👤" },
            { id: "back" as const, label: "BACK BLING", icon: "🎒" },
            { id: "pickaxe" as const, label: "HARVESTING", icon: "⛏️" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab===tab.id ? "rgba(255,255,255,0.08)" : "transparent",
              borderTop: activeTab===tab.id ? `2px solid #ff8c00` : "2px solid transparent",
              border: "none", padding: "8px 28px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span style={{ fontSize: 14 }}>{tab.icon}</span>
              <span style={{ color: activeTab===tab.id ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 800, letterSpacing: 2 }}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Character scroll row */}
        <div style={{ background: "rgba(0,0,0,0.85)", padding: "14px 20px 24px", display: "flex", gap: 8, justifyContent: "center", overflowX: "auto" }}>
          {CHARACTERS.map((char) => {
            const r = CHAR_RARITY[char.id] ?? "uncommon";
            const isSelected = selected.id === char.id;
            return (
              <div
                key={char.id}
                onClick={() => setSelected(char)}
                style={{
                  width: 72, flexShrink: 0, cursor: "pointer",
                  background: isSelected ? `linear-gradient(160deg, ${char.color}44, ${char.color}22)` : "rgba(255,255,255,0.04)",
                  border: `2px solid ${isSelected ? char.color : RARITY_COLOR[r]+"44"}`,
                  borderRadius: 6, padding: "8px 4px",
                  transition: "all 0.15s",
                  transform: isSelected ? "translateY(-4px)" : "none",
                  boxShadow: isSelected ? `0 0 20px ${char.color}55, 0 8px 16px rgba(0,0,0,0.5)` : "0 2px 6px rgba(0,0,0,0.3)",
                  textAlign: "center",
                }}
              >
                {/* Mini avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", margin: "0 auto 5px",
                  background: `radial-gradient(circle at 35% 35%, ${char.accentColor}, ${char.color})`,
                  border: `2px solid ${isSelected ? char.accentColor : RARITY_COLOR[r]+"66"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, boxShadow: isSelected ? `0 0 12px ${char.color}` : "none",
                }}>
                  {CHAR_ICONS[char.id] ?? "⚔️"}
                </div>
                <div style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", lineHeight: 1.2 }}>{char.name}</div>
                {/* Rarity dot */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: RARITY_COLOR[r] }} />
                </div>
                {/* Rarity strip at bottom */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: RARITY_COLOR[r] + "88", borderRadius: "0 0 4px 4px" }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AbilityPill({ icon, label, name, color, key_label }: { icon: string; label: string; name: string; color: string; key_label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: `${color}11`, border: `1px solid ${color}44`,
      borderRadius: 20, padding: "5px 12px",
    }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <div>
        <div style={{ color, fontSize: 8, fontWeight: 900, letterSpacing: 2 }}>{label} [{key_label}]</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10 }}>{name}</div>
      </div>
    </div>
  );
}
