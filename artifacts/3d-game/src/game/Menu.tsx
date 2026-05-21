import React from 'react';
import { useGameStore } from './store';

export function Menu() {
  const setGameState = useGameStore(s => s.setGameState);
  const setGameMode = useGameStore(s => s.setGameMode);
  const gameMode = useGameStore(s => s.gameMode);
  const startGame = useGameStore(s => s.startGame);
  const level = useGameStore(s => s.level);
  const xp = useGameStore(s => s.xp);
  const careerStats = useGameStore(s => s.careerStats);

  const xpPct = (xp / 1000) * 100;

  const modes = [
    { id: 'solo', label: 'Solo' },
    { id: 'duo', label: 'Duo' },
    { id: 'squad', label: 'Squad' },
    { id: 'bot-deathmatch', label: 'Bot Deathmatch' },
  ] as const;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none" style={{ fontFamily: "'Space Mono', monospace" }}>
      {/* Animated dark background */}
      <div className="absolute inset-0 bg-[#050810]">
        <div className="absolute inset-0 bg-gradient-radial from-[#00c8ff]/5 via-transparent to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #00c8ff08 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 20% 80%, #ff005508 0%, transparent 50%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Level badge top-right */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
        <div className="bg-black/50 border border-yellow-500/30 rounded-lg px-4 py-2 text-right">
          <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest">Level {level}</div>
          <div className="w-32 h-1.5 bg-black/60 rounded-full overflow-hidden border border-yellow-500/20 mt-1">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="text-[10px] text-yellow-600 mt-0.5">{xp} / 1000 XP</div>
        </div>
        {careerStats.totalGames > 0 && (
          <div className="text-[10px] text-gray-500 text-right">
            W: {careerStats.totalWins} · K: {careerStats.totalKills} · Games: {careerStats.totalGames}
          </div>
        )}
      </div>

      {/* Logo */}
      <div className="relative z-10 text-center mb-10">
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#00c8ff]/60 mb-3">Season 1</div>
        <h1
          className="text-7xl font-black tracking-tighter mb-2 uppercase"
          style={{
            background: 'linear-gradient(135deg, #00c8ff 0%, #ffffff 40%, #ff0055 70%, #fbbf24 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 30px rgba(0,200,255,0.4))',
          }}
        >
          APEX STORM
        </h1>
        <p className="text-sm text-gray-400 uppercase tracking-[0.3em]">Next-Gen Battle Royale</p>
      </div>

      {/* Mode select */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="w-full">
          <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500 text-center mb-3">Select Mode</div>
          <div className="grid grid-cols-2 gap-2">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => setGameMode(m.id)}
                className={`py-3 text-xs font-bold uppercase tracking-widest border rounded transition-all duration-200 ${
                  gameMode === m.id
                    ? 'bg-[#00c8ff]/15 border-[#00c8ff]/60 text-[#00c8ff]'
                    : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={startGame}
          className="w-full py-5 text-lg font-black uppercase tracking-[0.3em] border-2 rounded transition-all duration-300 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #00c8ff22, #00c8ff11)',
            borderColor: '#00c8ff',
            color: '#00c8ff',
            boxShadow: '0 0 30px rgba(0,200,255,0.2), inset 0 1px 0 rgba(0,200,255,0.2)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 50px rgba(0,200,255,0.5), inset 0 1px 0 rgba(0,200,255,0.3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(0,200,255,0.2), inset 0 1px 0 rgba(0,200,255,0.2)'; }}
        >
          DEPLOY
        </button>

        {/* Secondary buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setGameState('locker')}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-black/30 border border-white/10 rounded text-gray-400 hover:border-[#c084fc]/50 hover:text-[#c084fc] transition-all"
          >
            Locker
          </button>
          <button
            onClick={() => setGameState('battlepass')}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-black/30 border border-white/10 rounded text-gray-400 hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
          >
            Battle Pass
          </button>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-5 text-[10px] text-gray-600 uppercase tracking-[0.2em] z-10">
        WASD Move · Mouse Aim/Shoot · Space Jump · R Reload · B Build · E Vehicle
      </div>
    </div>
  );
}
