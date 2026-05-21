import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

const MINIMAP_SIZE = 160;
const MAP_WORLD_SIZE = 500;

function worldToMinimap(wx: number, wz: number): [number, number] {
  const scale = MINIMAP_SIZE / MAP_WORLD_SIZE;
  return [
    MINIMAP_SIZE / 2 + wx * scale,
    MINIMAP_SIZE / 2 + wz * scale,
  ];
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { playerPosition, bots, loot, stormRadius, stormCenter, stormTargetRadius, stormPhase } = useGameStore.getState();
      const scale = MINIMAP_SIZE / MAP_WORLD_SIZE;

      ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

      // Background
      const grad = ctx.createRadialGradient(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, 0, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2);
      grad.addColorStop(0, "#0d1018");
      grad.addColorStop(1, "#060810");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // Biome zones (simplified colored sectors)
      const biomeZones = [
        { x: -100, z: -100, r: 80, color: "rgba(45,90,39,0.35)" },   // forest
        { x: 100,  z: -80,  r: 70, color: "rgba(196,163,90,0.35)" },  // desert
        { x: -90,  z: 80,   r: 75, color: "rgba(61,61,79,0.35)" },    // industrial
        { x: 90,   z: 90,   r: 70, color: "rgba(107,90,78,0.35)" },   // mountain
        { x: 0,    z: 0,    r: 40, color: "rgba(74,92,58,0.5)" },     // military base
        { x: 65,   z: -40,  r: 65, color: "rgba(74,74,94,0.35)" },    // urban
      ];
      ctx.save();
      ctx.beginPath();
      ctx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
      for (const zone of biomeZones) {
        const [mx, mz] = worldToMinimap(zone.x, zone.z);
        const r = zone.r * scale;
        const g = ctx.createRadialGradient(mx, mz, 0, mx, mz, r);
        g.addColorStop(0, zone.color);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
      }

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * MINIMAP_SIZE;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MINIMAP_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, x); ctx.lineTo(MINIMAP_SIZE, x); ctx.stroke();
      }

      // Current storm circle
      const stormX = MINIMAP_SIZE / 2 + stormCenter[0] * scale;
      const stormZ = MINIMAP_SIZE / 2 + stormCenter[1] * scale;
      ctx.beginPath();
      ctx.arc(stormX, stormZ, stormRadius * scale, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,120,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Storm outside fill
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
      ctx.arc(stormX, stormZ, stormRadius * scale, 0, Math.PI * 2, true);
      ctx.fillStyle = "rgba(60,60,150,0.25)";
      ctx.fill();
      ctx.restore();

      // Next circle
      const nextPhase = Math.min(4, stormPhase + 1);
      const nextRadii = [250, 180, 120, 70, 35, 8];
      ctx.beginPath();
      ctx.arc(stormX, stormZ, nextRadii[nextPhase] * scale, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(180,80,80,0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Loot dots (uncollected)
      ctx.restore && ctx.restore();
      const uncollectedLoot = useGameStore.getState().loot.filter(l => !l.collected);
      for (const item of uncollectedLoot) {
        const [mx, mz] = worldToMinimap(item.position[0], item.position[2]);
        if (mx < 0 || mx > MINIMAP_SIZE || mz < 0 || mz > MINIMAP_SIZE) continue;
        ctx.beginPath();
        ctx.arc(mx, mz, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = item.rarity === "Legendary" ? "#fbbf24" : item.rarity === "Epic" ? "#a78bfa" : "#4a5c6a";
        ctx.fill();
      }

      // Bot dots
      for (const bot of bots) {
        if (bot.isDead) continue;
        const [mx, mz] = worldToMinimap(bot.position[0], bot.position[2]);
        if (mx < 0 || mx > MINIMAP_SIZE || mz < 0 || mz > MINIMAP_SIZE) continue;
        ctx.beginPath();
        ctx.arc(mx, mz, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = bot.state === "ENGAGING" ? "#ef4444" : "#f59e0b";
        ctx.fill();
      }

      // Player dot (always center-ish, or at actual position)
      const [px, pz] = worldToMinimap(playerPosition[0], playerPosition[2]);
      // Player arrow
      ctx.save();
      ctx.translate(px, pz);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fillStyle = "#ff8c00";
      ctx.shadowColor = "#ff8c00";
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();

      // Clip mask (circle)
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      ctx.arc(MINIMAP_SIZE / 2, MINIMAP_SIZE / 2, MINIMAP_SIZE / 2 - 1, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="minimap-container"
      style={{ width: MINIMAP_SIZE, height: MINIMAP_SIZE }}
    >
      <canvas ref={canvasRef} width={MINIMAP_SIZE} height={MINIMAP_SIZE} />
    </div>
  );
}
