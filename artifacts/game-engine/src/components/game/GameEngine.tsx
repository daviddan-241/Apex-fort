import { Suspense, Component, ReactNode, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SoldierCharacter } from './SoldierCharacter';
import { Terrain } from './Terrain';
import { GameEffects } from './GameEffects';
import { UploadedAsset } from './UploadedAsset';
import { NPCManager } from './NPCManager';
import { GameEnvironment } from './GameEnvironment';
import { useGameStore } from '@/store/gameStore';

// ─── WebGL check ──────────────────────────────────────────────────
function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
}

// ─── Error boundary ───────────────────────────────────────────────
class GameErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { err: boolean }
> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}

// ─── GPU fallback ─────────────────────────────────────────────────
function GPUFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#04060e] select-none">
      <div className="absolute inset-0 opacity-8"
        style={{
          backgroundImage:'linear-gradient(rgba(0,180,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.3) 1px,transparent 1px)',
          backgroundSize:'40px 40px',
          animation:'gScroll 12s linear infinite',
        }}
      />
      <style>{`@keyframes gScroll{from{background-position:0 0}to{background-position:0 40px}}@keyframes pulse{0%,100%{box-shadow:0 0 20px #00b4ff44}50%{box-shadow:0 0 50px #00b4ff99}}`}</style>
      <div className="relative z-10 text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-[#00b4ff]/10 border border-[#00b4ff]/40 flex items-center justify-center mx-auto mb-5" style={{animation:'pulse 2.5s ease infinite'}}>
          <svg className="w-10 h-10 text-[#00b4ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-black tracking-widest text-white font-mono mb-2">GPU REQUIRED</h2>
        <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto mb-6">
          Apex-Fort runs PBR rendering, real-time shadows and 20 live AI soldiers.<br/>
          Deploy on Render for the full experience.
        </p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[['PBR','#00b4ff'],['Lumen GI','#a855f7'],['16 vs AI','#22c55e']].map(([l,c])=>(
            <div key={l as string} className="rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] font-mono text-center" style={{color:c as string}}>{l}</div>
          ))}
        </div>
        <a href={window.location.href} target="_blank" rel="noopener noreferrer"
          className="inline-block px-8 py-3 rounded-full font-black text-sm text-black transition-transform active:scale-95"
          style={{background:'#00b4ff',boxShadow:'0 0 28px #00b4ff55'}}>
          OPEN IN BROWSER →
        </a>
      </div>
    </div>
  );
}

// ─── Scene lighting ───────────────────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} color="#d8eaff" />
      <directionalLight
        position={[80, 160, 60]} intensity={3} color="#fff8e8" castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5} shadow-camera-far={800}
        shadow-camera-left={-200} shadow-camera-right={200}
        shadow-camera-top={200} shadow-camera-bottom={-200}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-80, 50, -60]} intensity={0.6} color="#6080ff" />
      <hemisphereLight args={['#87ceeb','#2a3820',0.45]} />
      {/* Battle zone fill light */}
      <pointLight position={[0, 30, 0]} intensity={0.8} color="#ffcc88" distance={200} decay={1} />
    </>
  );
}

// ─── Atmospheric dust ─────────────────────────────────────────────
function Atmosphere() {
  const positions = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    positions[i*3]   = (Math.random()-.5)*300;
    positions[i*3+1] = Math.random()*40;
    positions[i*3+2] = (Math.random()-.5)*300;
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color="#cce8ff" transparent opacity={0.18} sizeAttenuation />
    </points>
  );
}

// ─── Main 3D scene ────────────────────────────────────────────────
function GameScene() {
  const uploadedModels = useGameStore(s => s.uploadedModels);
  return (
    <>
      <Lights />
      <fog attach="fog" args={['#0c1020', 200, 600]} />
      <Sky
        distance={450000}
        sunPosition={[100, 25, -180]}
        inclination={0.49}
        azimuth={0.25}
        rayleigh={0.6}
        turbidity={8}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
      />
      <Stars radius={500} depth={80} count={2000} factor={4} fade />
      <Environment preset="sunset" />

      <Terrain />
      <GameEnvironment />
      <NPCManager />
      <SoldierCharacter />

      {uploadedModels.map((url, i) => <UploadedAsset key={url} url={url} index={i} />)}
      <Atmosphere />
      <GameEffects />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────
export function GameEngine() {
  const [webgl] = useState(hasWebGL);
  if (!webgl) return <GPUFallback />;

  return (
    <GameErrorBoundary fallback={<GPUFallback />}>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ fov: 70, near: 0.2, far: 1500, position: [0, 60, 150] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#04060e', touchAction: 'none' }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
    </GameErrorBoundary>
  );
}
