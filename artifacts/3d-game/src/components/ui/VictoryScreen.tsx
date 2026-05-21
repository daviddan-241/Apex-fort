import { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";

export default function VictoryScreen() {
  const phase = useGameStore((s) => s.phase);
  const kills = useGameStore((s) => s.kills);
  const matchTime = useGameStore((s) => s.matchTime);
  const selectedCharacter = useGameStore((s) => s.selectedCharacter);
  const materials = useGameStore((s) => s.materials);
  const setPhase = useGameStore((s) => s.setPhase);
  const reset = useGameStore((s) => s.reset);
  const [visible, setVisible] = useState(false);
  const [confetti, setConfetti] = useState<{ x: number; y: number; color: string; angle: number }[]>([]);

  const isVictory = phase === "victory";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    if (isVictory) {
      setConfetti(Array.from({ length: 50 }, () => ({
        x: Math.random() * 100,
        y: -10 - Math.random() * 40,
        color: ["#ffd700","#00d4ff","#ff4444","#2ecc71","#ff8c00"][Math.floor(Math.random() * 5)],
        angle: (Math.random() - 0.5) * 30,
      })));
    }
    return () => clearTimeout(t);
  }, [isVictory]);

  const minutes = Math.floor(matchTime / 60);
  const seconds = Math.floor(matchTime % 60);
  const accuracy = Math.min(99, 30 + kills * 8 + Math.floor(Math.random() * 15));
  const xpEarned = kills * 100 + (isVictory ? 500 : 50) + Math.floor(matchTime / 10) * 10;

  const handlePlayAgain = () => { reset(); setPhase("character-select"); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: isVictory
        ? "radial-gradient(ellipse at center, rgba(255,180,0,0.2) 0%, rgba(0,0,0,0.92) 70%)"
        : "radial-gradient(ellipse at center, rgba(200,0,0,0.2) 0%, rgba(0,0,0,0.94) 70%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      opacity: visible ? 1 : 0, transition: "opacity 0.6s",
    }}>
      {isVictory && confetti.map((c, i) => (
        <div key={i} style={{
          position: "absolute", left: `${c.x}%`, top: `${c.y}%`,
          width: 8, height: 14, background: c.color,
          transform: `rotate(${c.angle}deg)`,
          animationDelay: `${Math.random() * 1.5}s`,
        }} />
      ))}

      <div style={{ textAlign: "center", maxWidth: 600, width: "100%", padding: "0 24px" }}>
        {isVictory ? (
          <>
            <div style={{ fontSize: 14, letterSpacing: 8, color: "#ffd700", marginBottom: 8, textTransform: "uppercase" }}>VICTORY ROYALE</div>
            <div style={{ fontSize: 76, fontWeight: 900, color: "#ffd700", textShadow: "0 0 60px rgba(255,215,0,0.8), 0 4px 30px rgba(0,0,0,0.9)", lineHeight: 1 }}>
              #1
            </div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", marginTop: 8, marginBottom: 32 }}>
              You outlasted all opponents!
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, letterSpacing: 8, color: "#ff4444", marginBottom: 8, textTransform: "uppercase" }}>ELIMINATED</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: "#ff4444", textShadow: "0 0 40px rgba(255,68,68,0.7), 0 4px 20px rgba(0,0,0,0.9)", lineHeight: 1 }}>
              #{Math.max(2, 30 - kills + 1)}
            </div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", marginTop: 8, marginBottom: 32 }}>
              Defeated as {selectedCharacter?.name ?? "Unknown"}
            </div>
          </>
        )}

        <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "24px 32px", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 20 }}>
            <StatBox label="Eliminations" value={kills} color="#ffd700" />
            <StatBox label="Accuracy" value={`${accuracy}%`} color="#00d4ff" />
            <StatBox label="Survived" value={`${minutes}:${seconds.toString().padStart(2, "0")}`} color="#2ecc71" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            <StatBox label="Wood" value={materials.wood} color="#c4883a" />
            <StatBox label="Stone" value={materials.stone} color="#888" />
            <StatBox label="Metal" value={materials.metal} color="#7ec8e3" />
          </div>
        </div>

        <div style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 8, padding: "12px 24px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#ffd700", fontWeight: 800, fontSize: 14, letterSpacing: 2 }}>XP EARNED</span>
          <span style={{ color: "#ffd700", fontSize: 22, fontWeight: 900 }}>+{xpEarned.toLocaleString()}</span>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={handlePlayAgain}
            style={{
              padding: "16px 40px", fontSize: 15, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase",
              cursor: "pointer",
              background: isVictory ? "linear-gradient(135deg, #ffd700, #ffaa00)" : "linear-gradient(135deg, #0088ff, #00d4ff)",
              border: "none", borderRadius: 6, color: "#000",
              boxShadow: isVictory ? "0 0 20px rgba(255,215,0,0.5)" : "0 0 20px rgba(0,180,255,0.5)",
            }}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => { reset(); setPhase("menu"); }}
            style={{
              padding: "16px 40px", fontSize: 15, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase",
              cursor: "pointer", background: "transparent", border: "2px solid rgba(255,255,255,0.25)", borderRadius: 6, color: "rgba(255,255,255,0.7)",
            }}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ color, fontSize: 26, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>{label}</div>
    </div>
  );
}
