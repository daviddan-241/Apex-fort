import React from 'react';
import { useGameStore, RARITY_COLORS } from './store';

export function HUD() {
  const gameState = useGameStore(s => s.gameState);
  const playerHp = useGameStore(s => s.playerHp);
  const playerShield = useGameStore(s => s.playerShield);
  const currentWeapon = useGameStore(s => s.currentWeapon);
  const isReloading = useGameStore(s => s.isReloading);
  const isBuildMode = useGameStore(s => s.isBuildMode);
  const bots = useGameStore(s => s.bots);
  const playerKills = useGameStore(s => s.playerKills);
  const stormTimeLeft = useGameStore(s => s.stormTimeLeft);
  const playerPos = useGameStore(s => s.playerPos);
  const stormRadius = useGameStore(s => s.stormRadius);
  const loot = useGameStore(s => s.loot);
  const vehicles = useGameStore(s => s.vehicles);
  const xp = useGameStore(s => s.xp);
  const level = useGameStore(s => s.level);
  const levelUpFlash = useGameStore(s => s.levelUpFlash);
  const killFeed = useGameStore(s => s.killFeed);
  const inVehicle = useGameStore(s => s.inVehicle);

  if (gameState !== 'playing') return null;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const distToCenter = Math.sqrt(playerPos.x * playerPos.x + playerPos.z * playerPos.z);
  const inStorm = distToCenter > stormRadius;
  const xpPct = (xp / 1000) * 100;
  const rarityColor = RARITY_COLORS[currentWeapon.rarity];
  const now = Date.now();
  const showLevelUp = now - levelUpFlash < 2500;

  const scale = 0.75;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 select-none text-white" style={{ fontFamily: "'Space Mono', monospace" }}>

      {/* Top-left: Storm timer + alive count */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="bg-black/50 border border-white/10 rounded px-3 py-1.5 backdrop-blur-sm text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">Storm</div>
          <div className={`text-2xl font-bold tabular-nums ${stormTimeLeft < 30 ? 'text-red-400 animate-pulse' : 'text-yellow-300'}`}>{fmt(stormTimeLeft)}</div>
        </div>
        {inStorm && (
          <div className="bg-red-900/70 border border-red-500/50 rounded px-3 py-1 text-center animate-pulse">
            <div className="text-xs font-bold text-red-300 uppercase tracking-widest">Outside Storm</div>
          </div>
        )}
      </div>

      {/* Top-right: Alive + Kills */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="bg-black/50 border border-white/10 rounded px-4 py-2 backdrop-blur-sm text-right">
          <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400">Players</div>
          <div className="text-3xl font-bold tabular-nums">{bots.length + 1}</div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 mt-1">Kills</div>
          <div className="text-xl font-bold text-[#ff0055]">{playerKills}</div>
        </div>

        {/* Kill feed */}
        {killFeed.slice(0, 3).map(e => (
          <div key={e.id} className="bg-black/60 border border-white/10 rounded px-3 py-1 text-xs text-right backdrop-blur-sm">
            <span className="text-[#00c8ff]">{e.killer}</span>
            <span className="text-gray-400 mx-1">eliminated</span>
            <span className="text-[#ff0055]">{e.victim}</span>
          </div>
        ))}
      </div>

      {/* Vehicle indicator */}
      {inVehicle && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] text-center">
          <div className="bg-orange-900/70 border border-orange-500/50 rounded px-4 py-1 text-sm font-bold text-orange-300 uppercase tracking-widest">
            In Vehicle — Press E to Exit
          </div>
        </div>
      )}

      {/* Build mode */}
      {isBuildMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%]">
          <div className="bg-blue-900/70 border border-[#00c8ff]/50 rounded px-4 py-1 text-sm font-bold text-[#00c8ff] uppercase tracking-widest animate-pulse">
            Build Mode — Click to Place
          </div>
        </div>
      )}

      {/* Level up flash */}
      {showLevelUp && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center animate-bounce">
          <div className="text-3xl font-bold text-yellow-300 uppercase tracking-widest" style={{ textShadow: '0 0 20px #fbbf24' }}>
            Level Up! Level {level}
          </div>
        </div>
      )}

      {/* Crosshair */}
      {!isBuildMode && !inVehicle && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-80">
          <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-white -translate-x-1/2 shadow-[0_0_4px_white]" />
          <div className="absolute bottom-0 left-1/2 w-0.5 h-3 bg-white -translate-x-1/2 shadow-[0_0_4px_white]" />
          <div className="absolute top-1/2 left-0 w-3 h-0.5 bg-white -translate-y-1/2 shadow-[0_0_4px_white]" />
          <div className="absolute top-1/2 right-0 w-3 h-0.5 bg-white -translate-y-1/2 shadow-[0_0_4px_white]" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
      )}

      {/* Bottom-center: HP + Shield + XP */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 w-80">
        {/* XP bar */}
        <div className="w-full flex items-center gap-2 mb-1">
          <span className="text-[10px] text-yellow-300 font-bold uppercase tracking-wider w-14 text-right">LVL {level}</span>
          <div className="flex-1 h-1.5 bg-black/60 rounded-full overflow-hidden border border-yellow-500/30">
            <div className="h-full bg-yellow-400 transition-all duration-500" style={{ width: `${xpPct}%` }} />
          </div>
          <span className="text-[10px] text-yellow-500 w-10">{xp}/1000</span>
        </div>

        {/* Shield */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] mb-0.5 px-0.5">
            <span className="text-[#00c8ff] font-bold uppercase tracking-wider">Shield</span>
            <span className="tabular-nums font-bold">{Math.ceil(playerShield)}</span>
          </div>
          <div className="h-3 w-full bg-black/70 rounded overflow-hidden border border-[#00c8ff]/20">
            <div className="h-full bg-[#00c8ff] transition-all duration-200 rounded" style={{ width: `${playerShield}%`, boxShadow: '0 0 8px #00c8ff' }} />
          </div>
        </div>

        {/* HP */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] mb-0.5 px-0.5">
            <span className="text-[#4ade80] font-bold uppercase tracking-wider">Health</span>
            <span className="tabular-nums font-bold">{Math.ceil(playerHp)}</span>
          </div>
          <div className="h-4 w-full bg-black/70 rounded overflow-hidden border border-[#4ade80]/20">
            <div className="h-full bg-[#4ade80] transition-all duration-200 rounded" style={{ width: `${playerHp}%`, boxShadow: '0 0 8px #4ade80' }} />
          </div>
        </div>
      </div>

      {/* Bottom-right: Weapon */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-1.5 bg-black/50 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm" style={{ borderColor: rarityColor + '44' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: rarityColor, boxShadow: `0 0 6px ${rarityColor}` }} />
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: rarityColor }}>{currentWeapon.rarity}</span>
        </div>
        <div className="text-sm font-bold" style={{ color: rarityColor }}>{currentWeapon.displayName}</div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold tabular-nums ${isReloading ? 'text-red-400 animate-pulse' : 'text-white'}`}>{currentWeapon.ammo}</span>
          <span className="text-lg text-gray-500 tabular-nums">/ {currentWeapon.maxAmmo}</span>
        </div>
        {isReloading && <div className="text-red-400 text-xs tracking-widest font-bold uppercase animate-pulse">Reloading...</div>}
      </div>

      {/* Bottom-left: Minimap */}
      <div className="absolute bottom-8 left-8 w-36 h-36 bg-black/70 border border-white/15 rounded-full overflow-hidden" style={{ boxShadow: '0 0 20px rgba(0,200,255,0.1)' }}>
        <div className="absolute inset-0 rounded-full border border-[#00c8ff]/10 m-3" />
        <div className="absolute inset-0 rounded-full border border-[#00c8ff]/10 m-9" />
        <div className="absolute w-full h-px bg-[#00c8ff]/15 top-1/2" />
        <div className="absolute h-full w-px bg-[#00c8ff]/15 left-1/2" />
        <MiniMapDots scale={scale} />
      </div>

      {/* Keybinds */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 uppercase tracking-widest whitespace-nowrap">
        WASD Move · Mouse Aim/Shoot · Space Jump · R Reload · B Build · E Vehicle
      </div>
    </div>
  );
}

function MiniMapDots({ scale }: { scale: number }) {
  const playerPos = useGameStore(s => s.playerPos);
  const bots = useGameStore(s => s.bots);
  const loot = useGameStore(s => s.loot);
  const stormRadius = useGameStore(s => s.stormRadius);
  const vehicles = useGameStore(s => s.vehicles);

  return (
    <>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#ff0055] rounded-full opacity-60"
        style={{ width: stormRadius * 2 * scale, height: stormRadius * 2 * scale }}
      />
      {vehicles.map(v => (
        <div key={v.id}
          className="absolute w-2 h-1 bg-orange-400 rounded-sm -translate-x-1/2 -translate-y-1/2"
          style={{ left: `calc(50% + ${v.position.x * scale}px)`, top: `calc(50% + ${v.position.z * scale}px)` }}
        />
      ))}
      {bots.map(b => (
        <div key={b.id}
          className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{ left: `calc(50% + ${b.position.x * scale}px)`, top: `calc(50% + ${b.position.z * scale}px)`, backgroundColor: '#ff0055', boxShadow: '0 0 4px #ff0055' }}
        />
      ))}
      {loot.map(l => (
        <div key={l.id}
          className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{ left: `calc(50% + ${l.position.x * scale}px)`, top: `calc(50% + ${l.position.z * scale}px)`, backgroundColor: '#fbbf24' }}
        />
      ))}
      <div
        className="absolute w-2.5 h-2.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ left: `calc(50% + ${playerPos.x * scale}px)`, top: `calc(50% + ${playerPos.z * scale}px)`, boxShadow: '0 0 6px white' }}
      />
    </>
  );
}
