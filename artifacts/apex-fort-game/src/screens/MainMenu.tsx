import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

// Fortnite-style animated background particles
function BattleParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; color: string }[] = [];
    const colors = ["#ff8c00", "#ffa500", "#ffcc00", "#fff8e7", "#ff6600"];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.6,
        r: 1 + Math.random() * 2.5,
        a: Math.random(),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.a * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
        p.x += p.vx; p.y += p.vy;
        p.a += (Math.random() - 0.5) * 0.02;
        p.a = Math.max(0.1, Math.min(1, p.a));
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

export default function MainMenu() {
  const setPhase = useGameStore(s => s.setPhase);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0a0510 0%, #0d0a1a 30%, #0a0c1a 60%, #060810 100%)",
      }}
    >
      {/* Diagonal stripe bg — Fortnite tilted feel */}
      <div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            -55deg,
            transparent,
            transparent 60px,
            rgba(255,140,0,0.025) 60px,
            rgba(255,140,0,0.025) 61px
          )`,
        }}
      />

      {/* Glow orb top-right */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,120,0,0.12) 0%, rgba(255,60,0,0.06) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Glow orb bottom-left */}
      <div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(80,0,200,0.1) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <BattleParticles />

      {/* Main layout — tilted card in center, Fortnite style */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-[10px] font-mono tracking-[0.4em] text-orange-500/50 uppercase">
            Season 1 • Chapter 1
          </div>
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded"
              style={{ background: "rgba(255,140,0,0.1)", border: "1px solid rgba(255,140,0,0.3)", color: "#ff8c00" }}
            >
              🎮 Free to Play
            </div>
          </div>
        </div>

        {/* Hero area */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div
            className="w-full max-w-sm"
            style={{
              transform: mounted ? "perspective(800px) rotateX(2deg) rotateY(-4deg) translateY(0px)" : "perspective(800px) rotateX(2deg) rotateY(-4deg) translateY(30px)",
              opacity: mounted ? 1 : 0,
              transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Logo card — Fortnite style big bold */}
            <div className="text-center mb-8">
              <div
                className="font-display font-bold uppercase leading-none"
                style={{
                  fontSize: "clamp(4.5rem, 20vw, 7rem)",
                  background: "linear-gradient(180deg, #fff8e0 0%, #ffcc00 30%, #ff8c00 70%, #ff4400 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 4px 30px rgba(255,140,0,0.7)) drop-shadow(0 0 60px rgba(255,80,0,0.4))",
                  textStroke: "2px rgba(255,180,0,0.3)",
                  letterSpacing: "-0.02em",
                }}
              >
                APEX
              </div>
              <div
                className="font-display font-bold uppercase leading-none -mt-3"
                style={{
                  fontSize: "clamp(2rem, 9vw, 3.5rem)",
                  color: "#fff",
                  letterSpacing: "0.7em",
                  textShadow: "0 0 30px rgba(255,255,255,0.3)",
                }}
              >
                FORT
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-orange-500/60" />
                <div className="text-[9px] font-mono tracking-[0.4em] text-orange-400/60 uppercase">Battle Royale</div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-orange-500/60" />
              </div>
            </div>

            {/* PLAY button — big Fortnite-style */}
            <button
              data-testid="btn-play"
              onClick={() => setPhase("CHARACTER_SELECT")}
              onMouseEnter={() => setHovered("play")}
              onMouseLeave={() => setHovered(null)}
              className="w-full relative overflow-hidden mb-3 group"
              style={{
                padding: "18px 24px",
                background: hovered === "play"
                  ? "linear-gradient(135deg, #ffcc00, #ff8c00, #ff4400)"
                  : "linear-gradient(135deg, #ffaa00, #ff7700, #ff3300)",
                borderRadius: "4px",
                transform: `perspective(600px) rotateX(${hovered === "play" ? "-2deg" : "0deg"}) scale(${hovered === "play" ? 1.03 : 1})`,
                transition: "all 0.15s ease",
                boxShadow: hovered === "play"
                  ? "0 12px 40px rgba(255,140,0,0.6), 0 4px 15px rgba(255,80,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
                  : "0 8px 25px rgba(255,100,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                border: "none",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)" }}
              />
              <div className="relative flex items-center justify-center gap-3">
                <span className="text-2xl font-display font-bold uppercase tracking-widest text-black" style={{ letterSpacing: "0.2em" }}>
                  ▶ PLAY NOW
                </span>
              </div>
              <div className="text-[10px] font-mono text-black/60 uppercase tracking-widest mt-1">
                Solo vs 15 Bots · Battle Royale
              </div>
            </button>

            {/* Secondary buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: "locker", label: "LOCKER", sub: "Operators" },
                { id: "gdd", label: "GAME BIBLE", sub: "Full GDD", action: () => window.open("/") },
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={btn.action}
                  onMouseEnter={() => setHovered(btn.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="p-3 text-center transition-all duration-150"
                  style={{
                    background: hovered === btn.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${hovered === btn.id ? "rgba(255,140,0,0.5)" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: "3px",
                    transform: hovered === btn.id ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <div className="text-xs font-display font-bold uppercase tracking-wider text-white">{btn.label}</div>
                  <div className="text-[9px] font-mono text-gray-500 mt-0.5">{btn.sub}</div>
                </button>
              ))}
            </div>

            {/* Season battle pass bar — Fortnite style */}
            <div
              className="p-3 rounded"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-yellow-400">⭐ Battle Pass — Season 1</span>
                <span className="text-[9px] font-mono text-gray-500">LVL 1 / 100</span>
              </div>
              <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: "4%",
                    background: "linear-gradient(90deg, #ffcc00, #ff8c00)",
                    boxShadow: "0 0 8px rgba(255,140,0,0.6)",
                  }}
                />
              </div>
              <div className="text-[8px] font-mono text-gray-600 mt-1">Play matches to earn XP and unlock rewards</div>
            </div>
          </div>
        </div>

        {/* Bottom controls strip */}
        <div
          className="flex items-center justify-center gap-4 px-6 py-3 text-[9px] font-mono text-gray-700 uppercase tracking-widest"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <span>WASD Move</span><span>·</span>
          <span>Mouse Aim</span><span>·</span>
          <span>LMB Shoot</span><span>·</span>
          <span>B Build</span><span>·</span>
          <span>E Pickup</span><span>·</span>
          <span>Q Tactical</span><span>·</span>
          <span>F Ultimate</span>
        </div>
      </div>
    </div>
  );
}
