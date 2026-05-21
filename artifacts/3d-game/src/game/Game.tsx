import React from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls, PointerLockControls, Stars } from '@react-three/drei';
import { useGameStore } from './store';
import { Menu } from './Menu';
import { World } from './World';
import { Player } from './Player';
import { Bots } from './Bots';
import { Loot } from './Loot';
import { Bullets } from './Bullets';
import { HUD } from './HUD';
import { Structures } from './Structures';
import { DamageNumbers } from './DamageNumbers';
import { Vehicles } from './Vehicle';
import { BattlePass } from './BattlePass';
import { Locker } from './Locker';

const KeyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'reload', keys: ['KeyR'] },
  { name: 'build', keys: ['KeyB'] },
];

function GameOverScreen() {
  const gameState = useGameStore(s => s.gameState);
  const playerKills = useGameStore(s => s.playerKills);
  const gameTime = useGameStore(s => s.gameTime);
  const damageDealt = useGameStore(s => s.damageDealtThisMatch);
  const headshots = useGameStore(s => s.headshotsThisMatch);
  const setGameState = useGameStore(s => s.setGameState);

  if (gameState !== 'game-over' && gameState !== 'victory') return null;

  const isVictory = gameState === 'victory';
  const xpEarned = playerKills * 50 + headshots * 25 + Math.floor(gameTime) + (isVictory ? 500 : 0);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md select-none" style={{ fontFamily: "'Space Mono', monospace", background: isVictory ? 'radial-gradient(ellipse at center, #fbbf2422 0%, #050810 60%)' : 'rgba(5,8,16,0.95)' }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg w-full px-6">
        {isVictory ? (
          <div className="text-center">
            <div className="text-sm text-yellow-400 uppercase tracking-[0.4em] mb-2">Season 1</div>
            <h1 className="text-6xl font-black uppercase tracking-tight" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.6))' }}>
              Victory Royale
            </h1>
            <div className="text-sm text-yellow-300/60 mt-1 uppercase tracking-widest">#1 Winner</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-sm text-gray-500 uppercase tracking-[0.4em] mb-2">Better luck next time</div>
            <h1 className="text-6xl font-black text-white uppercase tracking-tight" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.1))' }}>
              Eliminated
            </h1>
          </div>
        )}

        {/* Stats grid */}
        <div className="w-full grid grid-cols-2 gap-3">
          {[
            { label: 'Eliminations', value: playerKills, color: '#ff0055' },
            { label: 'Headshots', value: headshots, color: '#fbbf24' },
            { label: 'Damage Dealt', value: damageDealt, color: '#00c8ff' },
            { label: 'Survival', value: `${Math.floor(gameTime)}s`, color: '#4ade80' },
          ].map(stat => (
            <div key={stat.label} className="bg-black/40 border border-white/10 rounded-lg p-3 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* XP earned */}
        <div className="w-full bg-black/40 border border-yellow-500/20 rounded-lg p-3 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">XP Earned This Match</div>
          <div className="text-3xl font-bold text-yellow-400">+{xpEarned} XP</div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 w-full">
          <button
            onClick={() => useGameStore.getState().startGame()}
            className="flex-1 py-4 font-black uppercase tracking-[0.2em] border-2 rounded transition-all duration-300"
            style={{ borderColor: isVictory ? '#fbbf24' : '#00c8ff', color: isVictory ? '#fbbf24' : '#00c8ff', background: isVictory ? '#fbbf2411' : '#00c8ff11' }}
          >
            Play Again
          </button>
          <button
            onClick={() => setGameState('menu')}
            className="flex-1 py-4 font-black uppercase tracking-[0.2em] border-2 border-white/20 rounded text-gray-400 hover:border-white/40 hover:text-white transition-all"
          >
            Lobby
          </button>
        </div>
      </div>
    </div>
  );
}

function MainGame() {
  const gameState = useGameStore(s => s.gameState);

  return (
    <div className="w-full h-screen bg-[#050810] overflow-hidden relative text-white" style={{ fontFamily: "'Space Mono', monospace" }}>
      {gameState === 'menu' && <Menu />}
      {gameState === 'locker' && <Locker />}
      {gameState === 'battlepass' && <BattlePass />}
      {(gameState === 'game-over' || gameState === 'victory') && <GameOverScreen />}

      <KeyboardControls map={KeyboardMap}>
        <Canvas
          shadows
          camera={{ fov: 75, near: 0.1, far: 1000 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#050810']} />
          <fog attach="fog" args={['#050810', 15, 160]} />

          <ambientLight intensity={0.25} />
          <directionalLight
            castShadow
            position={[60, 120, 30]}
            intensity={1.8}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-120}
            shadow-camera-right={120}
            shadow-camera-top={120}
            shadow-camera-bottom={-120}
            shadow-bias={-0.0001}
          />
          <hemisphereLight args={['#1a2a4a', '#0a0d14', 0.4]} />

          <Stars radius={120} depth={60} count={4000} factor={4} saturation={0} fade speed={0.5} />

          {gameState === 'playing' && (
            <>
              <World />
              <Player />
              <Bots />
              <Loot />
              <Bullets />
              <Structures />
              <DamageNumbers />
              <Vehicles />
              <PointerLockControls selector="canvas" />
            </>
          )}
        </Canvas>
      </KeyboardControls>

      <HUD />
    </div>
  );
}

export default MainGame;
