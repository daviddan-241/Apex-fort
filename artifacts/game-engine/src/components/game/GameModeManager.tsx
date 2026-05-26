import { useEffect, useState, useCallback } from 'react';
import { useGameStore, GAME_MODES, GAME_MODE_LABELS, GAME_MODE_COLORS } from '@/store/gameStore';
import { Zap } from 'lucide-react';

const MODE_DURATION_SECONDS = 5 * 60; // 5 minutes per mode

const MODE_DESCRIPTIONS: Record<string, string> = {
  battle_royale: '100 players · Shrinking zone · Last one standing',
  team_deathmatch: '6v6 · Score 50 kills · No respawn delay',
  free_for_all: '12 players · First to 30 kills wins',
  squads: '4-man squads · Revive teammates · Strategic play',
};

export function GameModeManager() {
  const { gameModeIndex, nextGameMode } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(MODE_DURATION_SECONDS);
  const [announcing, setAnnouncing] = useState(true);

  const currentMode = GAME_MODES[gameModeIndex];
  const label = GAME_MODE_LABELS[currentMode];
  const color = GAME_MODE_COLORS[currentMode];
  const description = MODE_DESCRIPTIONS[currentMode];

  const rotateModeCallback = useCallback(() => {
    nextGameMode();
    setTimeLeft(MODE_DURATION_SECONDS);
    setAnnouncing(true);
  }, [nextGameMode]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          rotateModeCallback();
          return MODE_DURATION_SECONDS;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rotateModeCallback]);

  // Hide announcement after 4 seconds
  useEffect(() => {
    setAnnouncing(true);
    const t = setTimeout(() => setAnnouncing(false), 4000);
    return () => clearTimeout(t);
  }, [gameModeIndex]);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <>
      {/* Mode announcement overlay */}
      {announcing && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
          style={{ animation: 'fadeInOut 4s ease forwards' }}
        >
          <style>{`
            @keyframes fadeInOut {
              0%   { opacity: 0; transform: scale(0.9); }
              15%  { opacity: 1; transform: scale(1); }
              75%  { opacity: 1; transform: scale(1); }
              100% { opacity: 0; transform: scale(1.05); }
            }
          `}</style>
          <div className="text-center">
            <div
              className="text-xs font-bold tracking-[0.3em] mb-2 font-mono"
              style={{ color }}
            >
              ◆ NEW GAME MODE ◆
            </div>
            <div
              className="text-6xl font-black tracking-wide uppercase font-mono mb-3"
              style={{
                color,
                textShadow: `0 0 40px ${color}, 0 0 80px ${color}88`,
              }}
            >
              {label}
            </div>
            <div className="text-white/60 text-sm font-mono">{description}</div>
          </div>
        </div>
      )}

      {/* Persistent mode indicator (top center) */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        <div
          className="flex items-center gap-2 bg-black/70 backdrop-blur-md border rounded-full px-4 py-1.5 font-mono"
          style={{ borderColor: `${color}60` }}
        >
          <Zap className="w-3 h-3" style={{ color }} />
          <span className="text-xs font-bold tracking-widest" style={{ color }}>
            {label.toUpperCase()}
          </span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/60 text-xs">{mm}:{ss}</span>
        </div>
      </div>
    </>
  );
}
