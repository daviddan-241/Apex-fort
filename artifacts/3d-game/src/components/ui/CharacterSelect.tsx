import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { CHARACTERS } from "../../data/characters";
import { CharacterDef } from "../../types/game";

export default function CharacterSelect() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<CharacterDef>(CHARACTERS[0]);
  const setCharacter = useGameStore((s) => s.setCharacter);
  const setPhase = useGameStore((s) => s.setPhase);

  const handlePlay = () => {
    setCharacter(selected);
    setPhase("playing");
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(160deg, #050a14 0%, #0b1628 50%, #050a14 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", padding: "36px 0 28px" }}>
        <div style={{ color: "#00d4ff", fontSize: 10, letterSpacing: 6, textTransform: "uppercase", marginBottom: 6 }}>CHOOSE YOUR LEGEND</div>
        <div style={{ color: "#fff", fontSize: 34, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>CHARACTER SELECT</div>
      </div>

      <div style={{ display: "flex", gap: 24, width: "100%", maxWidth: 1100, padding: "0 24px", flex: 1, minHeight: 0 }}>
        {/* Character grid */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {CHARACTERS.map((char) => (
              <CharacterCard
                key={char.id}
                char={char}
                isSelected={selected.id === char.id}
                isHovered={hovered === char.id}
                onSelect={() => setSelected(char)}
                onHover={(v) => setHovered(v ? char.id : null)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <CharacterDetail char={selected} />
          <button
            onClick={handlePlay}
            style={{
              marginTop: 16, padding: "16px 0", fontSize: 16, fontWeight: 900,
              letterSpacing: 4, textTransform: "uppercase", cursor: "pointer",
              background: `linear-gradient(135deg, ${selected.color}, ${selected.accentColor})`,
              border: "none", borderRadius: 6, color: "#fff",
              boxShadow: `0 0 20px ${selected.color}88, 0 6px 20px rgba(0,0,0,0.5)`,
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = "scale(1.03)"; }}
            onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = "scale(1)"; }}
          >
            DEPLOY
          </button>
          <button
            onClick={() => setPhase("menu")}
            style={{
              marginTop: 8, padding: "10px 0", fontSize: 12, fontWeight: 700,
              letterSpacing: 3, textTransform: "uppercase", cursor: "pointer",
              background: "transparent", border: "2px solid rgba(255,255,255,0.15)", borderRadius: 5,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            BACK
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 0", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
        Each character has unique Tactical and Ultimate abilities
      </div>
    </div>
  );
}

function CharacterCard({ char, isSelected, isHovered, onSelect, onHover }: {
  char: CharacterDef;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (v: boolean) => void;
}) {
  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        background: isSelected
          ? `linear-gradient(160deg, ${char.color}44, ${char.accentColor}22)`
          : isHovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
        border: isSelected
          ? `2px solid ${char.color}`
          : isHovered ? "2px solid rgba(255,255,255,0.25)" : "2px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: 12, cursor: "pointer",
        transition: "all 0.15s", textAlign: "center",
        boxShadow: isSelected ? `0 0 20px ${char.color}44` : "none",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 60, height: 60, borderRadius: "50%", margin: "0 auto 8px",
        background: `radial-gradient(circle at 35% 35%, ${char.accentColor}, ${char.color})`,
        border: `3px solid ${isSelected ? char.accentColor : "rgba(255,255,255,0.1)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, boxShadow: isSelected ? `0 0 15px ${char.color}` : "none",
      }}>
        {CHAR_ICONS[char.id] ?? "⚔️"}
      </div>
      <div style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>{char.name}</div>
      {/* Stats mini */}
      <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "center" }}>
        <StatBar label="HP" value={char.maxHealth} max={200} color="#2ecc71" />
        <StatBar label="SP" value={char.maxShield} max={200} color="#5bc8ff" />
        <StatBar label="MV" value={char.moveSpeed * 10} max={160} color="#f39c12" />
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, textAlign: "center", marginBottom: 2 }}>{label}</div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color }} />
      </div>
    </div>
  );
}

function CharacterDetail({ char }: { char: CharacterDef }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: `2px solid ${char.color}55`, borderRadius: 10, padding: 20, flex: 1 }}>
      {/* Avatar large */}
      <div style={{
        width: 90, height: 90, borderRadius: "50%", margin: "0 auto 16px",
        background: `radial-gradient(circle at 35% 35%, ${char.accentColor}, ${char.color})`,
        border: `4px solid ${char.color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, boxShadow: `0 0 30px ${char.color}66`,
      }}>
        {CHAR_ICONS[char.id] ?? "⚔️"}
      </div>
      <div style={{ textAlign: "center", color: "#fff", fontSize: 20, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{char.name}</div>
      <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 16, lineHeight: 1.5 }}>{char.description}</div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Health", value: char.maxHealth, max: 200, color: "#2ecc71" },
          { label: "Shield", value: char.maxShield, max: 200, color: "#5bc8ff" },
          { label: "Speed", value: Math.round(char.moveSpeed * 10), max: 160, color: "#f39c12" },
        ].map(({ label, value, max, color }) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color, fontSize: 18, fontWeight: 900 }}>{value}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 3, overflow: "hidden" }}>
              <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Abilities */}
      <AbilityRow icon="⚡" label="TACTICAL [E]" name={char.tactical} color="#00d4ff" />
      <AbilityRow icon="💥" label="ULTIMATE [Q]" name={char.ultimate} color="#ffd700" />
    </div>
  );
}

function AbilityRow({ icon, label, name, color }: { icon: string; label: string; name: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, background: `${color}11`, border: `1px solid ${color}33`, borderRadius: 6, padding: "8px 10px" }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ color, fontSize: 9, letterSpacing: 2, fontWeight: 800, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{name}</div>
      </div>
    </div>
  );
}

const CHAR_ICONS: Record<string, string> = {
  soldier: "🪖", ninja: "🥷", cyber: "🤖", warrior: "⚔️",
  ghost: "👻", hero: "🦸", assassin: "🗡️", thief: "🎭",
};
