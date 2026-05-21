import React from 'react';
import { useGameStore } from './store';

export function HUD() {
  const gameState = useGameStore(state => state.gameState);
  if (gameState !== 'playing') return null;

  const playerHp = useGameStore(state => state.playerHp);
  const playerShield = useGameStore(state => state.playerShield);
  const currentWeapon = useGameStore(state => state.currentWeapon);
  const isReloading = useGameStore(state => state.isReloading);
  const isBuildMode = useGameStore(state => state.isBuildMode);
  
  const bots = useGameStore(state => state.bots);
  const playerKills = useGameStore(state => state.playerKills);
  const stormTimeLeft = useGameStore(state => state.stormTimeLeft);
  
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 select-none font-mono text-white">
      
      {/* Top Left: HP / Shield */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 w-64 bg-black/40 p-4 border border-white/10 rounded">
        <div className="flex justify-between items-center text-sm font-bold tracking-wider">
          <span className="text-[#00c8ff]">SHIELD</span>
          <span>{Math.ceil(playerShield)}</span>
        </div>
        <div className="h-4 w-full bg-black/60 rounded overflow-hidden border border-[#00c8ff]/30">
          <div className="h-full bg-[#00c8ff] transition-all duration-200" style={{ width: `${playerShield}%` }} />
        </div>
        
        <div className="flex justify-between items-center text-sm font-bold tracking-wider mt-2">
          <span className="text-[#00ff55]">HEALTH</span>
          <span>{Math.ceil(playerHp)}</span>
        </div>
        <div className="h-4 w-full bg-black/60 rounded overflow-hidden border border-[#00ff55]/30">
          <div className="h-full bg-[#00ff55] transition-all duration-200" style={{ width: `${playerHp}%` }} />
        </div>
      </div>

      {/* Top Right: Match Info */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 bg-black/40 p-4 border border-white/10 rounded min-w-[200px] text-right">
        <div className="text-sm text-gray-400 uppercase tracking-widest">Alive</div>
        <div className="text-3xl font-bold">{bots.length + 1}</div>
        
        <div className="text-sm text-gray-400 uppercase tracking-widest mt-2">Kills</div>
        <div className="text-xl font-bold text-[#ff0055]">{playerKills}</div>
        
        <div className="text-sm text-[#ffcc00] uppercase tracking-widest mt-2">Storm Shrink</div>
        <div className="text-2xl font-bold">{formatTime(stormTimeLeft)}</div>
      </div>

      {/* Bottom Right: Ammo & Weapon */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-2 bg-black/40 p-4 border border-white/10 rounded">
        <div className="text-lg font-bold" style={{ color: currentWeapon.color }}>{currentWeapon.name}</div>
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold ${isReloading ? 'text-red-500 animate-pulse' : ''}`}>
            {currentWeapon.ammo}
          </span>
          <span className="text-xl text-gray-500">/ {currentWeapon.maxAmmo}</span>
        </div>
        {isReloading && <div className="text-red-500 text-sm tracking-widest animate-pulse">RELOADING...</div>}
      </div>

      {/* Build Mode Indicator */}
      {isBuildMode && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-2xl font-bold text-[#00c8ff] tracking-widest animate-pulse">
          BUILD MODE
        </div>
      )}

      {/* Crosshair */}
      {!isBuildMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-70">
          <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-white -translate-x-1/2 shadow-[0_0_5px_white]" />
          <div className="absolute bottom-0 left-1/2 w-0.5 h-3 bg-white -translate-x-1/2 shadow-[0_0_5px_white]" />
          <div className="absolute top-1/2 left-0 w-3 h-0.5 bg-white -translate-y-1/2 shadow-[0_0_5px_white]" />
          <div className="absolute top-1/2 right-0 w-3 h-0.5 bg-white -translate-y-1/2 shadow-[0_0_5px_white]" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_5px_white]" />
        </div>
      )}

      {/* Mini-map */}
      {/* We can do a simple CSS/SVG minimap by mapping positions */}
      <div className="absolute bottom-8 left-8 w-40 h-40 bg-black/60 border border-white/20 rounded-full overflow-hidden flex items-center justify-center">
        {/* Radar lines */}
        <div className="absolute inset-0 rounded-full border border-[#00c8ff]/20 m-4"></div>
        <div className="absolute inset-0 rounded-full border border-[#00c8ff]/20 m-10"></div>
        <div className="w-full h-px bg-[#00c8ff]/20 absolute top-1/2"></div>
        <div className="h-full w-px bg-[#00c8ff]/20 absolute left-1/2"></div>
        
        <div className="relative w-full h-full">
           <MapDots />
        </div>
      </div>
    </div>
  );
}

function MapDots() {
  const playerPos = useGameStore(state => state.playerPos);
  const bots = useGameStore(state => state.bots);
  const loot = useGameStore(state => state.loot);
  const stormRadius = useGameStore(state => state.stormRadius);

  // Map 200x200 world to 160x160 px mini map (scale = 0.8)
  const scale = 0.8;

  return (
    <>
      {/* Storm Ring on map */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#ff0055] rounded-full opacity-50"
        style={{ 
          width: stormRadius * 2 * scale, 
          height: stormRadius * 2 * scale 
        }}
      />

      {/* Player (Center) - minimap is centered on world center for simplicity, not player relative */}
      <div 
        className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_4px_white] -translate-x-1/2 -translate-y-1/2"
        style={{ 
          left: `calc(50% + ${playerPos.x * scale}px)`, 
          top: `calc(50% + ${playerPos.z * scale}px)` 
        }}
      />

      {/* Bots */}
      {bots.map(b => (
        <div 
          key={b.id}
          className="absolute w-2 h-2 bg-[#ff0055] rounded-full shadow-[0_0_4px_#ff0055] -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `calc(50% + ${b.position.x * scale}px)`, 
            top: `calc(50% + ${b.position.z * scale}px)` 
          }}
        />
      ))}

      {/* Loot */}
      {loot.map(l => (
        <div 
          key={l.id}
          className="absolute w-1.5 h-1.5 bg-[#ffcc00] rounded-full shadow-[0_0_4px_#ffcc00] -translate-x-1/2 -translate-y-1/2"
          style={{ 
            left: `calc(50% + ${l.position.x * scale}px)`, 
            top: `calc(50% + ${l.position.z * scale}px)` 
          }}
        />
      ))}
    </>
  );
}
