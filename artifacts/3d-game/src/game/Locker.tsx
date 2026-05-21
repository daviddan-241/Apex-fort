import React from 'react';
import { useGameStore, SKINS } from './store';

export function Locker() {
  const setGameState = useGameStore(s => s.setGameState);
  const selectedSkin = useGameStore(s => s.selectedSkin);
  const setSelectedSkin = useGameStore(s => s.setSelectedSkin);
  const level = useGameStore(s => s.level);

  const activeSkin = SKINS.find(s => s.id === selectedSkin) ?? SKINS[0];

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#05080f]" style={{ fontFamily: "'Space Mono', monospace" }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-3xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Customize</div>
            <h1 className="text-3xl font-black text-[#c084fc] uppercase tracking-tight">Locker</h1>
          </div>
          <button
            onClick={() => setGameState('menu')}
            className="px-4 py-2 bg-black/50 border border-white/20 rounded text-xs text-gray-300 hover:border-white/40 hover:text-white transition-all uppercase tracking-widest"
          >
            Back
          </button>
        </div>

        <div className="flex gap-6">
          {/* Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Preview</div>
            <div
              className="w-32 h-48 rounded-xl border-2 flex items-center justify-center relative overflow-hidden"
              style={{ borderColor: activeSkin.color, background: `linear-gradient(180deg, ${activeSkin.color}22, ${activeSkin.emissive}44)` }}
            >
              {/* Character silhouette */}
              <div className="flex flex-col items-center gap-0.5">
                {/* Head */}
                <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: activeSkin.color, borderColor: activeSkin.emissive, boxShadow: `0 0 15px ${activeSkin.color}` }} />
                {/* Body */}
                <div className="w-10 h-14 rounded-sm border-2" style={{ backgroundColor: activeSkin.color, borderColor: activeSkin.emissive, boxShadow: `0 0 10px ${activeSkin.color}` }} />
                {/* Legs */}
                <div className="flex gap-1.5">
                  <div className="w-4 h-10 rounded-sm" style={{ backgroundColor: activeSkin.color, opacity: 0.8 }} />
                  <div className="w-4 h-10 rounded-sm" style={{ backgroundColor: activeSkin.color, opacity: 0.8 }} />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: activeSkin.color }}>{activeSkin.name}</div>
              <div className="text-[10px] text-gray-500">Level {activeSkin.requiredLevel}+</div>
            </div>
          </div>

          {/* Skin grid */}
          <div className="flex-1">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Select Skin</div>
            <div className="grid grid-cols-3 gap-3">
              {SKINS.map(skin => {
                const isUnlocked = level >= skin.requiredLevel;
                const isSelected = selectedSkin === skin.id;

                return (
                  <button
                    key={skin.id}
                    onClick={() => isUnlocked && setSelectedSkin(skin.id)}
                    disabled={!isUnlocked}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 relative overflow-hidden text-left ${
                      isSelected
                        ? 'border-current'
                        : isUnlocked
                          ? 'border-white/10 hover:border-white/30'
                          : 'border-white/5 opacity-50'
                    }`}
                    style={{
                      borderColor: isSelected ? skin.color : undefined,
                      background: isSelected ? `${skin.color}18` : 'rgba(0,0,0,0.4)',
                      boxShadow: isSelected ? `0 0 20px ${skin.color}33` : undefined,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg mb-2 mx-auto"
                      style={{
                        backgroundColor: skin.color,
                        boxShadow: isUnlocked ? `0 0 12px ${skin.color}80` : 'none',
                      }}
                    />
                    <div className="text-[11px] font-bold text-center" style={{ color: isUnlocked ? skin.color : '#6b7280' }}>
                      {skin.name}
                    </div>
                    {!isUnlocked && (
                      <div className="text-[9px] text-gray-500 text-center mt-0.5">Lvl {skin.requiredLevel}</div>
                    )}
                    {isSelected && (
                      <div className="absolute top-1 right-1.5 text-[10px] font-bold" style={{ color: skin.color }}>ON</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
