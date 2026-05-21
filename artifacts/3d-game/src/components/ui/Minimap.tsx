import { useEffect, useRef } from "react";
import { useGameStore } from "../../store/gameStore";

const MAP_SIZE = 160;
const WORLD_SIZE = 240;
const CANVAS_SIZE = 160;

// POI positions and names
const POIS = [
  { name: "Tilted Towers", x: 0, z: 0 },
  { name: "Loot Lake", x: -40, z: -30 },
  { name: "Retail Row", x: 45, z: 35 },
  { name: "Pleasant Park", x: -55, z: 40 },
  { name: "Dusty Depot", x: 40, z: -50 },
  { name: "Fatal Fields", x: -20, z: 65 },
  { name: "Salty Springs", x: 25, z: -20 },
  { name: "Snobby Shores", x: -70, z: 10 },
];

interface MinimapProps {
  playerPos?: { x: number; z: number };
  playerRotation?: number;
  botPositions?: { x: number; z: number; isAlive: boolean }[];
}

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stormRadius = useGameStore((s) => s.stormRadius);
  const stormCenter = useGameStore((s) => s.stormCenter);
  const locationName = useGameStore((s) => s.locationName);
  const kills = useGameStore((s) => s.kills);
  const playersAlive = useGameStore((s) => s.playersAlive);
  const matchTime = useGameStore((s) => s.matchTime);

  // Draw minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = CANVAS_SIZE / WORLD_SIZE;

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background terrain (green tones)
    ctx.fillStyle = "#2a4a18";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Water areas
    ctx.fillStyle = "#1a3a5c";
    ctx.beginPath();
    ctx.ellipse(CANVAS_SIZE * 0.3, CANVAS_SIZE * 0.4, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Roads
    ctx.strokeStyle = "#5a5040";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(CANVAS_SIZE * 0.5, 0); ctx.lineTo(CANVAS_SIZE * 0.5, CANVAS_SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, CANVAS_SIZE * 0.5); ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE * 0.5); ctx.stroke();

    // POI dots
    for (const poi of POIS) {
      const mx = (poi.x / WORLD_SIZE + 0.5) * CANVAS_SIZE;
      const mz = (poi.z / WORLD_SIZE + 0.5) * CANVAS_SIZE;
      ctx.fillStyle = "rgba(255,255,200,0.5)";
      ctx.beginPath();
      ctx.arc(mx, mz, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Storm circle
    const sx = (stormCenter.x / WORLD_SIZE + 0.5) * CANVAS_SIZE;
    const sz = (stormCenter.y / WORLD_SIZE + 0.5) * CANVAS_SIZE;
    const sr = (stormRadius / WORLD_SIZE) * CANVAS_SIZE;

    // Outside storm (purple overlay)
    ctx.fillStyle = "rgba(120,0,180,0.35)";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(sx, sz, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";

    // Storm ring
    ctx.strokeStyle = "#cc44ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sz, sr, 0, Math.PI * 2);
    ctx.stroke();

    // Player dot (center) — always drawn at center of minimap
    const cx = CANVAS_SIZE / 2;
    const cy = CANVAS_SIZE / 2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    // Player outline
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.stroke();

  }, [stormRadius, stormCenter]);

  const minutes = Math.floor(matchTime / 60);
  const seconds = Math.floor(matchTime % 60);

  return (
    <div style={{
      position: "fixed", top: 8, left: 8, zIndex: 50,
      background: "rgba(0,0,0,0.7)", borderRadius: 4, overflow: "hidden",
      border: "2px solid rgba(255,255,255,0.2)", userSelect: "none",
    }}>
      {/* Canvas map */}
      <div style={{ position: "relative", width: CANVAS_SIZE, height: CANVAS_SIZE }}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ display: "block" }} />
        {/* Location name overlay */}
        <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textShadow: "0 0 4px rgba(0,0,0,0.9)", textTransform: "uppercase" }}>
          {locationName}
        </div>
      </div>
      {/* Stats bar below map */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 8px", background: "rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: "#ff4444", fontSize: 10, fontWeight: 700 }}>👤 {playersAlive}</span>
          <span style={{ color: "#ffd700", fontSize: 10, fontWeight: 700 }}>💀 {kills}</span>
        </div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
