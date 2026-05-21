import React, { useEffect } from 'react';
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

const KeyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'reload', keys: ['KeyR'] },
  { name: 'build', keys: ['KeyB'] },
];

function MainGame() {
  const gameState = useGameStore(state => state.gameState);

  return (
    <div className="w-full h-screen bg-[#0a0d14] overflow-hidden relative font-mono text-white">
      {gameState === 'menu' && <Menu />}
      {gameState === 'game-over' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 flex-col backdrop-blur-md">
          <h1 className="text-7xl font-bold mb-4 text-[#ff0055] tracking-tighter" style={{ fontFamily: 'Space Mono' }}>GAME OVER</h1>
          <div className="flex gap-12 text-2xl mb-12 text-gray-300">
            <div className="text-center">
              <div className="text-sm uppercase tracking-widest text-gray-500">Kills</div>
              <div className="text-[#00c8ff] font-bold">{useGameStore.getState().playerKills}</div>
            </div>
            <div className="text-center">
              <div className="text-sm uppercase tracking-widest text-gray-500">Survival Time</div>
              <div className="text-[#ffcc00] font-bold">{Math.floor(useGameStore.getState().gameTime)}s</div>
            </div>
          </div>
          <button 
            onClick={() => useGameStore.getState().setGameState('menu')}
            className="px-12 py-4 bg-[#00c8ff] text-black font-bold uppercase tracking-widest hover:bg-[#00c8ff]/80 hover:shadow-[0_0_30px_rgba(0,200,255,0.6)] transition-all duration-300"
          >
            Return to Lobby
          </button>
        </div>
      )}
      
      <KeyboardControls map={KeyboardMap}>
        <Canvas shadows camera={{ fov: 75, near: 0.1, far: 1000 }} className="w-full h-full">
          <color attach="background" args={['#0a0d14']} />
          <fog attach="fog" args={['#0a0d14', 10, 150]} />
          
          <ambientLight intensity={0.3} />
          <directionalLight 
            castShadow 
            position={[50, 100, 20]} 
            intensity={1.5} 
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
            shadow-bias={-0.0001}
          />
          
          <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

          {gameState === 'playing' && (
            <>
              <World />
              <Player />
              <Bots />
              <Loot />
              <Bullets />
              <Structures />
              <DamageNumbers />
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
