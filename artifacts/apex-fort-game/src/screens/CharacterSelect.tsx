import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { CHARACTERS } from "@/data/characters";

const RARITY_COLORS: Record<string, string> = {
  Legendary: "#fbbf24",
  Epic: "#a78bfa",
  Rare: "#60a5fa",
  Common: "#9ca3af",
};

const ROLE_ICONS: Record<string, string> = {
  Stealth: "👁",
  Tank: "🛡",
  Assault: "⚔",
  Recon: "📡",
  Support: "💚",
  Specialist: "🎯",
};

export default function CharacterSelect() {
  const { selectedCharacter, selectCharacter, setPhase, startGame } = useGameStore();
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const char = CHARACTERS.find(c => c.id === selectedCharacter) ?? CHARACTERS[2];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #060410 0%, #0a0818 40%, #060c18 100%)",
      }}
    >
      {/* Diagonal bg lines */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(-55deg, transparent, transparent 80px, rgba(255,140,0,0.018) 80px, rgba(255,140,0,0.018) 81px)`,
        }}
      />
      {/* Selected char color glow */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 70% 50%, ${char.color}18 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={() => setPhase("MENU")}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-gray-500 hover:text-orange-400 transition-colors"
          >
            ← Back
          </button>
          <h2 className="font-display font-bold uppercase tracking-[0.3em] text-xl text-white">
            Select <span style={{ color: "#ff8c00" }}>Operator</span>
          </h2>
          <button
            data-testid="btn-deploy"
            onClick={startGame}
            className="relative overflow-hidden px-6 py-2.5 font-display font-bold uppercase tracking-wider text-sm transition-all duration-150 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #ffaa00, #ff6600)",
              color: "#000",
              borderRadius: "3px",
              boxShadow: "0 4px 20px rgba(255,140,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            ▶ DEPLOY
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Character roster grid — left */}
          <div className="w-[45%] p-4 overflow-y-auto">
            <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-600 mb-3">
              {CHARACTERS.length} Operators Available
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTERS.map(c => {
                const isSelected = selectedCharacter === c.id;
                const isHovered = hoveredChar === c.id;
                return (
                  <button
                    key={c.id}
                    data-testid={`char-${c.id}`}
                    onClick={() => selectCharacter(c.id)}
                    onMouseEnter={() => setHoveredChar(c.id)}
                    onMouseLeave={() => setHoveredChar(null)}
                    className="relative flex flex-col items-center p-2 rounded transition-all duration-200"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${c.color}25, ${c.color}10)`
                        : isHovered ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                      border: isSelected
                        ? `1px solid ${c.color}80`
                        : `1px solid ${isHovered ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)"}`,
                      transform: isSelected ? "scale(1.06)" : isHovered ? "scale(1.03)" : "scale(1)",
                      boxShadow: isSelected ? `0 4px 20px ${c.color}35, 0 0 0 1px ${c.color}30` : "none",
                    }}
                  >
                    {/* Rarity strip top */}
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5 rounded-t"
                      style={{ background: RARITY_COLORS[c.rarity] ?? "#9ca3af" }}
                    />

                    {/* Avatar silhouette */}
                    <div
                      className="w-11 h-11 rounded flex items-center justify-center mb-1.5 mt-1"
                      style={{
                        background: `linear-gradient(135deg, ${c.color}50, ${c.color}15)`,
                        border: `1px solid ${c.color}40`,
                      }}
                    >
                      <span className="text-xl">{ROLE_ICONS[c.role] ?? "⚡"}</span>
                    </div>

                    <div
                      className="text-[9px] font-display font-bold uppercase leading-tight text-center"
                      style={{ color: isSelected ? c.color : "#d1d5db" }}
                    >
                      {c.name.split(" ")[0]}
                    </div>
                    <div
                      className="text-[7px] font-mono mt-0.5"
                      style={{ color: RARITY_COLORS[c.rarity] ?? "#9ca3af" }}
                    >
                      {c.rarity[0]}
                    </div>

                    {isSelected && (
                      <div
                        className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center"
                        style={{ background: c.color, fontSize: 7 }}
                      >✓</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-white/5 my-4" />

          {/* Character detail — right, Fortnite-style */}
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto">
            {/* Name header */}
            <div>
              <div
                className="text-[9px] font-mono uppercase tracking-[0.4em] mb-1"
                style={{ color: char.color }}
              >
                {ROLE_ICONS[char.role]} {char.role} · {char.archetype}
              </div>
              <h3
                className="font-display font-bold uppercase leading-tight"
                style={{
                  fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
                  background: `linear-gradient(135deg, #fff 40%, ${char.color})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: `drop-shadow(0 0 20px ${char.color}60)`,
                }}
              >
                {char.name}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{char.description}</p>
            </div>

            {/* Rarity badge */}
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-mono px-2.5 py-1 rounded uppercase tracking-widest"
                style={{
                  background: `${RARITY_COLORS[char.rarity]}18`,
                  color: RARITY_COLORS[char.rarity],
                  border: `1px solid ${RARITY_COLORS[char.rarity]}35`,
                }}
              >
                ◆ {char.rarity}
              </span>
            </div>

            {/* Stats — Fortnite-style horizontal bars */}
            <div
              className="p-3 rounded"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-600 mb-3">Operator Stats</div>
              {[
                { label: "Health", value: char.stats.health, color: "#ef4444", icon: "❤" },
                { label: "Armor", value: char.stats.armor, color: "#9ca3af", icon: "🛡" },
                { label: "Speed", value: char.stats.speed, color: "#22c55e", icon: "⚡" },
                { label: "Ability", value: char.stats.abilityPower, color: char.color, icon: "✦" },
                { label: "Accuracy", value: char.stats.accuracy, color: "#60a5fa", icon: "🎯" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] w-4">{s.icon}</span>
                  <span className="text-[9px] font-mono text-gray-500 w-14 uppercase">{s.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${s.value}%`,
                        background: `linear-gradient(90deg, ${s.color}cc, ${s.color})`,
                        boxShadow: `0 0 6px ${s.color}60`,
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 w-6 text-right">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Abilities */}
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-600 mb-2">Abilities</div>
              <div className="space-y-2">
                {char.abilities.map((ab) => {
                  const borderColor = ab.type === "passive" ? "#6b7280" : ab.type === "tactical" ? "#3b82f6" : "#ff8c00";
                  return (
                    <div
                      key={ab.name}
                      className="flex gap-3 p-2.5 rounded"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: `1px solid ${borderColor}25`,
                        borderLeft: `3px solid ${borderColor}`,
                      }}
                    >
                      {/* Key badge */}
                      <div
                        className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold"
                        style={{
                          background: ab.key ? `${borderColor}20` : "rgba(255,255,255,0.05)",
                          border: `1px solid ${borderColor}40`,
                          color: borderColor,
                        }}
                      >
                        {ab.key ?? "P"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-display font-bold uppercase text-white">{ab.name}</span>
                          <span
                            className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded"
                            style={{ background: `${borderColor}18`, color: borderColor }}
                          >
                            {ab.type}{ab.cooldown > 0 ? ` · ${ab.cooldown}s` : ""}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{ab.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
