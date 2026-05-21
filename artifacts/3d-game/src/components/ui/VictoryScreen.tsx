import { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";

export default function VictoryScreen() {
  const phase = useGameStore((s) => s.phase);
  const kills = useGameStore((s) => s.kills);
  const matchTime = useGameStore((s) => s.matchTime);
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const setPhase = useGameStore((s) => s.setPhase);
  const reset = useGameStore((s) => s.reset);
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"recap" | "stats">("recap");

  const isVictory = phase === "victory";
  const minutes = Math.floor(matchTime / 60);
  const seconds = Math.floor(matchTime % 60);

  const combatXP = kills * 250;
  const matchXP = isVictory ? 1200 : Math.floor(matchTime * 3);
  const questXP = 9649;
  const totalXP = isVictory ? 1600 + combatXP : combatXP + matchXP;
  const placement = isVictory ? 1 : Math.max(2, 30 - kills + 1);
  const xpToNext = 30737;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  const handlePlayAgain = () => { reset(); setPhase("character-select"); };
  const handleLobby = () => { reset(); setPhase("menu"); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "linear-gradient(160deg, #0d1b3e 0%, #1a0a3a 40%, #0a1a2e 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      opacity: visible ? 1 : 0, transition: "opacity 0.5s",
      overflow: "hidden",
    }}>
      {/* Animated light streaks behind */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${10 + i * 12}%`, top: 0,
            width: 1.5, height: "100%",
            background: `linear-gradient(to bottom, transparent, rgba(0,160,255,${0.05 + i * 0.02}), transparent)`,
            transform: `rotate(${-15 + i * 5}deg)`,
            animation: `shimmer ${2 + i * 0.3}s infinite linear`,
          }} />
        ))}
      </div>

      {/* ── TOP BAR ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 50, background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {([["recap", "MATCH RECAP"], ["stats", "MATCH STATS"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              background: activeTab === id ? "rgba(255,255,255,0.1)" : "transparent",
              border: "none", borderBottom: activeTab === id ? "2px solid #fff" : "2px solid transparent",
              color: activeTab === id ? "#fff" : "rgba(255,255,255,0.45)",
              fontSize: 12, fontWeight: 900, letterSpacing: 2, padding: "0 18px", height: 50,
              cursor: "pointer", textTransform: "uppercase",
            }}>{label}</button>
          ))}
        </div>
        {/* Level progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "linear-gradient(135deg, #ff8c00, #ff5500)", borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 900, color: "#fff" }}>LVL {level}</div>
          <div style={{ width: 140, height: 6, background: "rgba(255,255,255,0.12)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg, #00d4ff, #0088ff)", transition: "width 1.5s ease" }} />
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>{xpToNext.toLocaleString()} XP to LVL {level + 1}</span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ display: "flex", height: "calc(100% - 50px)", padding: "16px 20px", gap: 20 }}>

        {/* ── LEFT PANEL: Quests / XP breakdown ── */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Victory Wings bonus */}
          {isVictory && (
            <div style={{ background: "rgba(155,89,182,0.15)", border: "1px solid rgba(155,89,182,0.4)", borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #9b59b6, #6c3483)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🪽</div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>3X QUEST BONUS</div>
                  <div style={{ color: "#f39c12", fontSize: 11, fontWeight: 900 }}>EPIC VICTORY WINGS</div>
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9 }}>14 wins to advance</div>
            </div>
          )}

          {/* Quest Complete heading */}
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>QUEST COMPLETE</div>

          {/* Quest cards */}
          {[
            { title: "Win a Battle Royale match", sub: "earn bonus win credit", color: "#2ecc71", icon: "✅" },
            { title: "Eliminate players", sub: `${kills} eliminated this match`, color: "#e74c3c", icon: "🎯" },
            { title: "Complete Evolution Quests", sub: "3/5 quests done", color: "#3498db", icon: "⬆️" },
          ].map((q, i) => (
            <div key={i} style={{
              background: `${q.color}15`, border: `1px solid ${q.color}33`,
              borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: q.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{q.icon}</div>
              <div>
                <div style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>{q.title}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, marginTop: 1 }}>{q.sub}</div>
              </div>
              <div style={{ marginLeft: "auto", width: 22, height: 22, borderRadius: "50%", background: q.color + "44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>›</div>
            </div>
          ))}
        </div>

        {/* ── CENTER: Victory display ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 8 }}>
          {/* Victory / Defeat heading */}
          {isVictory ? (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, letterSpacing: 6, color: "rgba(255,255,255,0.6)", marginBottom: 4, textTransform: "uppercase" }}>🏆 #1</div>
              <div style={{
                fontSize: 52, fontWeight: 900, lineHeight: 1,
                background: "linear-gradient(135deg, #fff 30%, #ffd700 70%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                textShadow: "none",
                filter: "drop-shadow(0 0 20px rgba(255,215,0,0.5))",
                letterSpacing: -1,
              }}>VICTORY<br />ROYALE</div>
            </div>
          ) : (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, letterSpacing: 6, color: "#ff4444", marginBottom: 4 }}>ELIMINATED</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: "#ff4444", lineHeight: 1, filter: "drop-shadow(0 0 20px rgba(255,68,68,0.5))" }}>#{placement}</div>
            </div>
          )}

          {/* XP earned */}
          <div style={{ marginBottom: 18, textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>SURVIVAL</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>
              {totalXP.toLocaleString()} <span style={{ color: "#ffd700", fontSize: 22 }}>XP</span>
            </div>
          </div>

          {/* Character celebrating */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <CelebrationCharacter isVictory={isVictory} char={selectedCharacter} />
          </div>

          {/* XP breakdown */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 20px", width: "100%", maxWidth: 280 }}>
            {[
              { label: "COMBAT",   value: combatXP, color: "#e74c3c" },
              { label: "MATCH",    value: matchXP,  color: "#3498db" },
              { label: "QUEST",    value: questXP,  color: "#9b59b6" },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: 2 }}>{row.label}</span>
                <span style={{ color: row.color, fontSize: 13, fontWeight: 900 }}>{row.value.toLocaleString()} XP</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0 0" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>TOTAL</span>
              <span style={{ color: "#ffd700", fontSize: 15, fontWeight: 900 }}>{totalXP.toLocaleString()} XP</span>
            </div>
          </div>

          {/* Match stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14, width: "100%", maxWidth: 320 }}>
            <StatBox label="ELIMINATIONS" value={kills} color="#ffd700" icon="⚔️" />
            <StatBox label="SURVIVED" value={`${minutes}:${seconds.toString().padStart(2,"0")}`} color="#2ecc71" icon="⏱️" />
            <StatBox label="PLACEMENT" value={`#${placement}`} color="#00d4ff" icon="🏆" />
          </div>
        </div>

        {/* ── RIGHT PANEL: Action buttons ── */}
        <div style={{ width: 190, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
          <ActionBtn label="PLAY AGAIN" color="yellow" onClick={handlePlayAgain} />
          <ActionBtn label="REPORT PLAYER" color="dark" onClick={() => {}} />
          <ActionBtn label="RETURN TO LOBBY" color="dark" onClick={handleLobby} />
        </div>
      </div>
    </div>
  );
}

function CelebrationCharacter({ isVictory, char }: { isVictory: boolean; char: any }) {
  const color = char?.accentColor ?? "#00d4ff";
  const bodyColor = char?.color ?? "#1a88ff";
  return (
    <div style={{ animation: isVictory ? "lobby-float 1.8s ease-in-out infinite" : "none" }}>
      <div style={{ position: "relative", width: 100, height: 160 }}>
        {/* Glow */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle, ${color}33, transparent 70%)`, filter: "blur(10px)" }} />
        {/* Body */}
        <div style={{ position: "absolute", left: "50%", top: 55, transform: "translateX(-50%)", width: 56, height: 75, borderRadius: "20% 20% 10% 10%", background: `linear-gradient(160deg, ${color}, ${bodyColor})`, boxShadow: `0 0 20px ${color}66` }} />
        {/* Head */}
        <div style={{ position: "absolute", left: "50%", top: 12, transform: "translateX(-50%)", width: 44, height: 46, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${color}, ${bodyColor})`, border: `2px solid ${color}`, boxShadow: `0 0 16px ${color}88`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {char?.id ? (({ soldier:"🪖",ninja:"🥷",cyber:"🤖",warrior:"⚔️",ghost:"👻",hero:"🦸",assassin:"🗡️",thief:"🎭" } as Record<string,string>)[char.id] ?? "🎮") : "🎮"}
        </div>
        {/* Arms raised in victory */}
        {isVictory && [-38, 38].map((x, i) => (
          <div key={i} style={{
            position: "absolute", left: `calc(50% + ${x}px)`, top: 55, transform: `translateX(-50%) rotate(${i===0?"-35deg":"35deg"})`,
            width: 14, height: 52, borderRadius: "30% 30% 20% 20%",
            background: `linear-gradient(160deg, ${color}, ${bodyColor})`,
          }} />
        ))}
        {/* Legs */}
        {[-12, 12].map((x, i) => (
          <div key={i} style={{ position: "absolute", left: `calc(50% + ${x}px)`, bottom: 0, transform: "translateX(-50%)", width: 18, height: 55, borderRadius: "0 0 8px 8px", background: `linear-gradient(160deg, ${bodyColor}, ${bodyColor}88)` }} />
        ))}
        {/* Victory particles */}
        {isVictory && [[-35,-20],[35,-15],[-20,-45],[20,-40],[0,-55]].map(([px,py],i)=>(
          <div key={i} style={{ position: "absolute", left: `calc(50% + ${px}px)`, top: `calc(50% + ${py}px)`, width: 6, height: 6, borderRadius: "50%", background: ["#ffd700","#00d4ff","#ff4444","#2ecc71","#ff8c00"][i], animation: `pulse-ring ${1+i*0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 16 }}>{icon}</div>
      <div style={{ color, fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 8, letterSpacing: 1.5, marginTop: 3, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: "yellow" | "dark"; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "14px 0", width: "100%", fontSize: 12, fontWeight: 900,
      letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
      background: color === "yellow"
        ? "linear-gradient(135deg, #f1c40f, #f39c12)"
        : "rgba(255,255,255,0.07)",
      border: color === "yellow" ? "none" : "1px solid rgba(255,255,255,0.15)",
      borderRadius: 6,
      color: color === "yellow" ? "#000" : "rgba(255,255,255,0.8)",
      boxShadow: color === "yellow" ? "0 0 16px rgba(241,196,15,0.35)" : "none",
      transition: "transform 0.1s",
    }}
    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
    >{label}</button>
  );
}
