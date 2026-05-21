import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../store/gameStore";

const TIPS = [
  "Gather materials by harvesting trees, rocks and metal objects.",
  "Build walls quickly when under fire — it absorbs damage!",
  "Open chests (golden glow) for rare and epic weapons.",
  "The storm shrinks over time — stay inside the circle.",
  "Shields regenerate with Tactical ability (E key).",
  "SMGs are great for close range, Snipers for long range.",
  "Crouch and ADS (right-click) for better accuracy.",
  "You can stack multiple walls to create a fort.",
];

export default function MainMenu() {
  const setPhase = useGameStore((s) => s.setPhase);
  const reset = useGameStore((s) => s.reset);
  const [tipIndex, setTipIndex] = useState(0);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const p = Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      speed: 0.01 + Math.random() * 0.02,
      opacity: 0.1 + Math.random() * 0.4,
    }));
    setParticles(p);
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePlay = () => {
    reset();
    setPhase("character-select");
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "linear-gradient(160deg, #050a14 0%, #0b1628 40%, #0e1f3a 70%, #05080f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden",
    }}>
      {/* Floating particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "#00d4ff", opacity: p.opacity,
          animation: `float ${3 + p.speed * 100}s ease-in-out infinite alternate`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Background glow */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,100,200,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48, position: "relative" }}>
        <div style={{ fontSize: 11, letterSpacing: 8, color: "#00d4ff", marginBottom: 8, textTransform: "uppercase", fontWeight: 600 }}>
          BATTLE ROYALE
        </div>
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.9, letterSpacing: -2, textTransform: "uppercase" }}>
          <span style={{ color: "#ffffff", display: "block", textShadow: "0 0 40px rgba(0,180,255,0.5), 0 4px 20px rgba(0,0,0,0.8)" }}>APEX</span>
          <span style={{ color: "#00d4ff", display: "block", textShadow: "0 0 30px rgba(0,212,255,0.7), 0 4px 20px rgba(0,0,0,0.8)" }}>FORT</span>
        </div>
        <div style={{ marginTop: 12, color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: 4, textTransform: "uppercase" }}>
          30 PLAYERS · ONE SURVIVOR · BUILD TO WIN
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", width: 320 }}>
        <button
          onClick={handlePlay}
          style={{
            width: "100%", padding: "18px 0", fontSize: 18, fontWeight: 900,
            letterSpacing: 4, textTransform: "uppercase", cursor: "pointer",
            background: "linear-gradient(135deg, #0088ff, #00d4ff)",
            border: "none", borderRadius: 6, color: "#000",
            boxShadow: "0 0 30px rgba(0,200,255,0.5), 0 6px 20px rgba(0,0,0,0.4)",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          PLAY NOW
        </button>
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <OutlineButton>SETTINGS</OutlineButton>
          <OutlineButton>HOW TO PLAY</OutlineButton>
        </div>
      </div>

      {/* Tip of the day */}
      <div style={{ marginTop: 52, textAlign: "center", maxWidth: 480 }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 3, textTransform: "uppercase", marginBottom: 6 }}>TIP</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.6, transition: "opacity 0.5s" }}>
          {TIPS[tipIndex]}
        </div>
      </div>

      {/* Controls reference */}
      <div style={{ marginTop: 36, display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 600 }}>
        {[
          ["WASD", "Move"], ["Mouse", "Aim"], ["Click", "Shoot"], ["Space", "Jump"],
          ["Shift", "Sprint"], ["R", "Reload"], ["B", "Build"], ["E", "Tactical"],
          ["Q", "Ultimate"], ["F", "Harvest"], ["1-5", "Slots"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <kbd style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 3, padding: "2px 7px", color: "#fff", fontSize: 11, fontFamily: "monospace" }}>{k}</kbd>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Version */}
      <div style={{ position: "absolute", bottom: 16, right: 20, color: "rgba(255,255,255,0.2)", fontSize: 11 }}>v1.0.0</div>
    </div>
  );
}

function OutlineButton({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      flex: 1, padding: "12px 0", fontSize: 12, fontWeight: 700, letterSpacing: 2,
      textTransform: "uppercase", cursor: "pointer",
      background: "transparent", border: "2px solid rgba(255,255,255,0.2)", borderRadius: 5,
      color: "rgba(255,255,255,0.6)", transition: "all 0.15s",
    }}
      onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.5)"; (e.target as HTMLButtonElement).style.color = "#fff"; }}
      onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"; (e.target as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
    >
      {children}
    </button>
  );
}
