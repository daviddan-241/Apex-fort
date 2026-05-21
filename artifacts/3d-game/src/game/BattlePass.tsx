import React from 'react';
import { useGameStore } from './store';

export function BattlePass() {
  const setGameState = useGameStore(s => s.setGameState);
  const challenges = useGameStore(s => s.challenges);
  const level = useGameStore(s => s.level);
  const xp = useGameStore(s => s.xp);

  const completed = challenges.filter(c => c.completed).length;
  const xpPct = (xp / 1000) * 100;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#05080f] overflow-y-auto" style={{ fontFamily: "'Space Mono', monospace" }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-2xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Season 1</div>
            <h1 className="text-3xl font-black text-yellow-400 uppercase tracking-tight">Battle Pass</h1>
            <div className="text-xs text-gray-400 mt-1">{completed} / {challenges.length} Challenges Complete</div>
          </div>
          <button
            onClick={() => setGameState('menu')}
            className="px-4 py-2 bg-black/50 border border-white/20 rounded text-xs text-gray-300 hover:border-white/40 hover:text-white transition-all uppercase tracking-widest"
          >
            Back
          </button>
        </div>

        {/* Level progress */}
        <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Level {level}</span>
            <span className="text-xs text-gray-400">{xp} / 1000 XP</span>
          </div>
          <div className="h-3 bg-black/60 rounded-full overflow-hidden border border-yellow-500/20">
            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
          </div>
          <div className="text-[10px] text-gray-600 mt-1">Complete challenges to earn XP and level up</div>
        </div>

        {/* Challenges */}
        <div className="flex flex-col gap-3">
          {challenges.map((c, i) => {
            const pct = Math.min(100, (c.progress / c.target) * 100);
            return (
              <div
                key={c.id}
                className={`bg-black/40 border rounded-lg p-4 transition-all ${
                  c.completed
                    ? 'border-yellow-500/40 bg-yellow-500/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 ${
                      c.completed
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                        : 'border-white/20 text-gray-500'
                    }`}>
                      {c.completed ? '✓' : i + 1}
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${c.completed ? 'text-yellow-300' : 'text-white'}`}>{c.description}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {Math.min(c.progress, c.target)} / {c.target} · Reward: {c.xpReward} XP
                      </div>
                    </div>
                  </div>
                  {c.completed && (
                    <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest whitespace-nowrap">Complete!</div>
                  )}
                </div>
                <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${c.completed ? 'bg-yellow-400' : 'bg-[#00c8ff]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
