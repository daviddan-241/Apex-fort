import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

export default function VictoryScreen() {
  const { kills, matchStartTime, matchEndTime, shotsFired, shotsHit, damageDealt, resetGame, startGame } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const survivalMs = matchEndTime - matchStartTime;
  const survivalMin = Math.floor(survivalMs / 60000);
  const survivalSec = Math.floor((survivalMs % 60000) / 1000);
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; rot: number; rotV: number; type: string }[] = [];
    const colors = ["#ffd700", "#ff8c00", "#fff", "#ffcc00", "#ff6600", "#fffbe0"];
    for (let i = 0; i < 180; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 1.5 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 10,
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.25,
        type: Math.random() > 0.5 ? "rect" : "star",
      });
    }
    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
        if (p.type === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          for (let j = 0; j < 5; j++) {
            const a = (j * Math.PI * 2) / 5 - Math.PI / 2;
            const r = j % 2 === 0 ? p.size / 2 : p.size / 4;
            j === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
      }
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #060208 0%, #0d0a00 50%, #100800 100%)" }}
    >
      {/* Gold glow */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(255,180,0,0.15) 0%, transparent 60%)" }} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <div className="relative z-10 text-center px-6 w-full max-w-lg">
        {/* Crown */}
        <div className="text-5xl mb-2" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,0,0.8))" }}>👑</div>

        {/* Victory text — Fortnite style */}
        <div
          className="font-display font-bold uppercase leading-none"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 4.5rem)",
            background: "linear-gradient(180deg, #fffbe0 0%, #ffd700 30%, #ff8c00 80%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 40px rgba(255,200,0,0.7)) drop-shadow(0 4px 20px rgba(255,100,0,0.5))",
            letterSpacing: "-0.02em",
          }}
        >
          VICTORY
        </div>
        <div
          className="font-display font-bold uppercase leading-none -mt-2"
          style={{
            fontSize: "clamp(2rem, 8vw, 3.5rem)",
            color: "#fff",
            letterSpacing: "0.5em",
            textShadow: "0 0 30px rgba(255,255,255,0.3)",
          }}
        >
          ROYALE!
        </div>

        <div className="mt-2 mb-6 text-xs font-mono text-yellow-500/60 uppercase tracking-[0.3em]">
          Last Operator Standing
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {[
            { label: "Eliminations", value: kills, color: "#ef4444", icon: "💀" },
            { label: "Survived", value: `${survivalMin}m ${survivalSec}s`, color: "#22c55e", icon: "⏱" },
            { label: "Accuracy", value: `${accuracy}%`, color: "#60a5fa", icon: "🎯" },
            { label: "Damage", value: Math.round(damageDealt), color: "#ff8c00", icon: "⚡" },
          ].map(s => (
            <div
              key={s.label}
              className="p-3 rounded text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${s.color}25`,
                borderTop: `2px solid ${s.color}60`,
              }}
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP gained */}
        <div
          className="mb-5 p-3 rounded"
          style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)" }}
        >
          <div className="text-[9px] font-mono uppercase tracking-widest text-yellow-500/60 mb-1">⭐ XP Earned</div>
          <div className="font-display font-bold text-xl text-yellow-400">+{2500 + kills * 200} XP</div>
          <div className="text-[9px] font-mono text-gray-600 mt-1">Victory Bonus +1000 · Kills ×{kills}</div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            data-testid="btn-play-again"
            onClick={startGame}
            className="flex-1 py-3.5 font-display font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #ffaa00, #ff6600)",
              color: "#000",
              borderRadius: "3px",
              boxShadow: "0 4px 20px rgba(255,140,0,0.5)",
              fontSize: "1rem",
            }}
          >
            ▶ PLAY AGAIN
          </button>
          <button
            data-testid="btn-menu"
            onClick={resetGame}
            className="flex-1 py-3.5 font-display font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "#9ca3af",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "3px",
              fontSize: "1rem",
            }}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
