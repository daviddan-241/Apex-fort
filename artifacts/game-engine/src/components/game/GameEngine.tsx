import { Suspense, Component, ReactNode, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SoldierCharacter } from './SoldierCharacter';
import { Terrain } from './Terrain';
import { GameEffects } from './GameEffects';
import { UploadedAsset } from './UploadedAsset';
import { useGameStore } from '@/store/gameStore';
import { Monitor, Cpu, Gamepad2 } from 'lucide-react';

// ─── WebGL pre-check ──────────────────────────────────────────────
function isWebGLAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch { return false; }
}

// ─── Error Boundary ───────────────────────────────────────────────
class GameErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.warn('[3D] Error:', e.message); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// ─── Fallback ─────────────────────────────────────────────────────
function GPUFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#060810] relative overflow-hidden">
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,180,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px', animation: 'gScroll 10s linear infinite',
        }} />
      <style>{`@keyframes gScroll{from{background-position:0 0}to{background-position:0 40px}}@keyframes pGlow{0%,100%{box-shadow:0 0 24px #00b4ff55}50%{box-shadow:0 0 48px #00b4ffaa}}`}</style>
      <div className="mb-5 p-5 rounded-full border-2 border-[#00b4ff]/50 bg-[#00b4ff]/10" style={{ animation: 'pGlow 2.5s ease infinite' }}>
        <Monitor className="w-10 h-10 text-[#00b4ff]" />
      </div>
      <h2 className="text-xl font-black text-white mb-1 tracking-widest font-mono">GPU REQUIRED</h2>
      <p className="text-white/40 text-sm text-center max-w-xs px-4 mb-6 leading-relaxed">
        The 3D engine uses PBR rendering, Lumen GI and real-time shadows.<br />
        Open in a real browser or deploy for full GPU access.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-8 px-4">
        {[['#00b4ff', Gamepad2,'PBR Shading'],['#a855f7',Cpu,'Lumen GI'],['#22c55e',Monitor,'Nanite LOD']].map(([c, Icon, l]) => (
          <div key={l as string} className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
            {/* @ts-expect-error dynamic icon */}
            <Icon className="w-5 h-5" style={{ color: c }} />
            <span className="text-[10px] text-white/50 font-mono text-center">{l as string}</span>
          </div>
        ))}
      </div>
      <a href={window.location.href} target="_blank" rel="noopener noreferrer"
        className="px-8 py-3 rounded-full font-black tracking-widest text-sm text-black active:scale-95 transition-transform"
        style={{ background: '#00b4ff', boxShadow: '0 0 28px #00b4ff55' }}>
        OPEN IN BROWSER →
      </a>
    </div>
  );
}

// ─── Lighting ─────────────────────────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} color="#e8f4ff" />
      <directionalLight
        position={[80, 150, 60]} intensity={2.5} castShadow color="#fff5e0"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5} shadow-camera-far={600}
        shadow-camera-left={-150} shadow-camera-right={150}
        shadow-camera-top={150} shadow-camera-bottom={-150}
      />
      <directionalLight position={[-60, 40, -60]} intensity={0.5} color="#90b4ff" />
      <hemisphereLight args={['#87ceeb', '#2d3a1e', 0.4]} />
    </>
  );
}

// ─── Dust particles ───────────────────────────────────────────────
function Dust() {
  const positions = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) {
    positions[i*3]   = (Math.random()-.5)*80;
    positions[i*3+1] = Math.random()*25;
    positions[i*3+2] = (Math.random()-.5)*80;
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#cce8ff" transparent opacity={0.2} sizeAttenuation />
    </points>
  );
}

// ─── Scene ────────────────────────────────────────────────────────
function GameScene() {
  const uploadedModels = useGameStore(s => s.uploadedModels);
  return (
    <>
      <Lights />
      <fog attach="fog" args={['#0a0c14', 100, 500]} />
      <Sky distance={450000} sunPosition={[100, 25, -180]}
        inclination={0.49} azimuth={0.25} rayleigh={0.7}
        turbidity={6} mieCoefficient={0.005} mieDirectionalG={0.82} />
      <Stars radius={400} depth={60} count={1200} factor={3} fade />
      <Environment preset="sunset" />
      <Terrain />
      <SoldierCharacter />
      {uploadedModels.map((url, i) => <UploadedAsset key={url} url={url} index={i} />)}
      <Dust />
      <GameEffects />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────
export function GameEngine() {
  const [webgl] = useState(isWebGLAvailable);
  if (!webgl) return <GPUFallback />;
  return (
    <GameErrorBoundary fallback={<GPUFallback />}>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ fov: 72, near: 0.2, far: 1500, position: [0, 8, 12] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2, powerPreference: 'high-performance' }}
        style={{ background: '#060810', touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
    </GameErrorBoundary>
  );
}
