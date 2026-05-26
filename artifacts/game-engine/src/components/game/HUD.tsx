import { useGameStore, GAME_MODES, GAME_MODE_LABELS, GAME_MODE_COLORS } from '@/store/gameStore';
import { MessageSquare, Map, Crosshair, Upload, Skull, Target } from 'lucide-react';

export function HUD() {
  const {
    health, maxHealth, shield, maxShield,
    ammo, maxAmmo, kills, deaths,
    toggleChat, toggleUploader, gameModeIndex, killFeed,
  } = useGameStore();

  const healthPct = Math.max(0, (health / maxHealth) * 100);
  const shieldPct = Math.max(0, (shield / maxShield) * 100);

  const mode = GAME_MODES[gameModeIndex];
  const modeLabel = GAME_MODE_LABELS[mode];
  const modeColor = GAME_MODE_COLORS[mode];
  const kd = deaths === 0 ? kills.toFixed(1) : (kills / deaths).toFixed(2);

  return (
    <div className="relative w-full h-full pointer-events-none select-none font-mono text-white">

      {/* ── Crosshair ───────────────────────────────────────────────────── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Crosshair className="w-5 h-5 text-white/80 stroke-[1.5]" />
      </div>

      {/* ── Top-left: Health / Shield ────────────────────────────────────── */}
      <div className="absolute top-6 left-6 w-56 space-y-2">
        <div className="bg-black/65 backdrop-blur-md rounded-xl border border-white/10 p-3 shadow-xl">
          <div className="space-y-1 mb-2.5">
            <div className="flex justify-between text-[11px] font-bold tracking-widest text-blue-300">
              <span>SHIELD</span><span>{Math.round(shield)}</span>
            </div>
            <div className="h-2 w-full bg-blue-950/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${shieldPct}%`, background: 'linear-gradient(90deg, #1d4ed8, #38bdf8)' }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold tracking-widest text-green-300">
              <span>HEALTH</span><span>{Math.round(health)}</span>
            </div>
            <div className="h-2 w-full bg-green-950/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${healthPct}%`,
                  background: healthPct > 60
                    ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                    : healthPct > 30
                    ? 'linear-gradient(90deg, #ca8a04, #facc15)'
                    : 'linear-gradient(90deg, #dc2626, #f87171)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2">
          <div className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-center">
            <div className="text-[10px] text-white/40 tracking-widest">KILLS</div>
            <div className="text-sm font-bold text-[#00b4ff]">{kills}</div>
          </div>
          <div className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-center">
            <div className="text-[10px] text-white/40 tracking-widest">K/D</div>
            <div className="text-sm font-bold text-white">{kd}</div>
          </div>
          <div className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-center">
            <div className="text-[10px] text-white/40 tracking-widest">DEATHS</div>
            <div className="text-sm font-bold text-red-400">{deaths}</div>
          </div>
        </div>
      </div>

      {/* ── Top-right: Minimap ───────────────────────────────────────────── */}
      <div className="absolute top-6 right-6">
        <div className="w-36 h-36 rounded-full bg-black/70 backdrop-blur-md border-2 border-white/15 flex items-center justify-center shadow-xl overflow-hidden relative">
          <Map className="w-10 h-10 text-white/15" />
          <div
            className="absolute rounded-full"
            style={{ width: 8, height: 8, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: modeColor, boxShadow: `0 0 10px ${modeColor}` }}
          />
          {['N','S','W','E'].map((d, i) => {
            const positions = [
              { top: 4, left: '50%', transform: 'translateX(-50%)' },
              { bottom: 4, left: '50%', transform: 'translateX(-50%)' },
              { left: 4, top: '50%', transform: 'translateY(-50%)' },
              { right: 4, top: '50%', transform: 'translateY(-50%)' },
            ];
            return (
              <div key={d} className="absolute text-[9px] font-bold text-white/40" style={{ position: 'absolute', ...positions[i] }}>{d}</div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom-right: Ammo ───────────────────────────────────────────── */}
      <div className="absolute bottom-8 right-6">
        <div className="bg-black/70 backdrop-blur-md border border-white/15 rounded-xl px-5 py-3 text-right shadow-xl">
          <div className="text-[10px] text-white/40 tracking-widest mb-0.5">AMMO</div>
          <div className="flex items-end gap-1 justify-end">
            <span className="text-5xl font-black leading-none" style={{ color: ammo < 6 ? '#ef4444' : '#ffffff' }}>
              {ammo}
            </span>
            <span className="text-lg text-white/35 font-medium mb-0.5">/ {maxAmmo}</span>
          </div>
        </div>
      </div>

      {/* ── Bottom-left: Controls ────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-6 flex gap-2 pointer-events-auto">
        <button
          onClick={toggleChat}
          className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white shadow-xl h-10 rounded-full px-4 flex items-center gap-2 transition-all hover:scale-105 text-[11px] font-bold tracking-wider"
        >
          <MessageSquare className="w-4 h-4 text-[#00b4ff]" />
          AI CHAT
        </button>
        <button
          onClick={toggleUploader}
          className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white shadow-xl h-10 rounded-full px-4 flex items-center gap-2 transition-all hover:scale-105 text-[11px] font-bold tracking-wider"
        >
          <Upload className="w-4 h-4 text-purple-400" />
          UE5 ASSET
        </button>
      </div>

      {/* Controls hint (fades after load) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-white/25 tracking-widest">
        WASD · SPACE · MOUSE LOOK · CLICK TO LOCK
      </div>

      {/* ── Kill Feed (right side) ───────────────────────────────────────── */}
      <div className="absolute top-48 right-6 flex flex-col gap-1.5 items-end">
        {killFeed.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[11px] shadow-xl"
            style={{ animation: 'fadeSlide 0.3s ease' }}
          >
            <span className="font-bold" style={{ color: modeColor }}>{entry.killer}</span>
            <Target className="w-3 h-3 text-white/40" />
            <span className="text-white/60">{entry.victim}</span>
            <Skull className="w-3 h-3 text-red-400" />
            <span className="text-white/30">{entry.weapon}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
