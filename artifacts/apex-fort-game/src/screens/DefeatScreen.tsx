import { useGameStore } from "@/store/gameStore";
import { useEffect, useRef } from "react";

export default function DefeatScreen() {
  const { kills, matchStartTime, matchEndTime, shotsFired, shotsHit, damageDealt, resetGame, startGame } = useGameStore();
  const survivalMs = matchEndTime - matchStartTime;
  const survivalMin = Math.floor(survivalMs / 60000);
  const survivalSec = Math.floor((survivalMs % 60000) / 1000);
  const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    // Falling ash particles
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.3 + Math.random() * 0.5,
      r: 1 + Math.random() * 2,
      a: Math.random() * 0.4,
    }));
    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,60,60,${p.a})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.y > canvas.height + 5) { p.y = -5; p.x = Math.random() * canvas.width; }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #080205 0%, #140508 50%, #0c0208 100%)" }}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(180,0,0,0.18) 0%, transparent 60%)" }} />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <div className="relative z-10 text-center px-6 w-full max-w-lg">
        {/* Skull */}
        <div className="text-5xl mb-2" style={{ filter: "drop-shadow(0 0 20px rgba(220,38,38,0.8))" }}>💀</div>

        <div
          className="font-display font-bold uppercase leading-none"
          style={{
            fontSize: "clamp(2.5rem, 10vw, 4.5rem)",
            color: "#ef4444",
            textShadow: "0 0 50px rgba(239,68,68,0.7), 0 0 100px rgba(239,68,68,0.3)",
            letterSpacing: "-0.02em",
          }}
        >
          ELIMINATED
        </div>
        <div className="mt-3 mb-6 text-xs font-mono uppercase tracking-[0.3em]" style={{ color: "rgba(239,68,68,0.5)" }}>
          Operator Down · You were eliminated
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { label: "Eliminations", value: kills, color: "#ef4444", icon: "💀" },
            { label: "Survived", value: `${survivalMin}m ${survivalSec}s`, color: "#f59e0b", icon: "⏱" },
            { label: "Accuracy", value: `${accuracy}%`, color: "#60a5fa", icon: "🎯" },
            { label: "Damage", value: Math.round(damageDealt), color: "#a78bfa", icon: "⚡" },
          ].map(s => (
            <div
              key={s.label}
              className="p-3 rounded text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${s.color}20`,
                borderTop: `2px solid ${s.color}50`,
              }}
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP */}
        <div
          className="mb-5 p-3 rounded"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <div className="text-[9px] font-mono uppercase tracking-widest text-red-500/50 mb-1">⭐ XP Earned</div>
          <div className="font-display font-bold text-xl text-red-400">+{500 + kills * 150} XP</div>
          <div className="text-[9px] font-mono text-gray-600 mt-1">Participation +500 · Kills ×{kills}</div>
        </div>

        <div className="flex gap-3">
          <button
            data-testid="btn-respawn"
            onClick={startGame}
            className="flex-1 py-3.5 font-display font-bold uppercase tracking-wider transition-all duration-150 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #dc2626, #991b1b)",
              color: "#fff",
              borderRadius: "3px",
              boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
              fontSize: "1rem",
            }}
          >
            ▶ REDEPLOY
          </button>
          <button
            data-testid="btn-menu-defeat"
            onClick={resetGame}
            className="flex-1 py-3.5 font-display font-bold uppercase tracking-wider transition-all duration-150 hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#9ca3af",
              border: "1px solid rgba(255,255,255,0.1)",
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
