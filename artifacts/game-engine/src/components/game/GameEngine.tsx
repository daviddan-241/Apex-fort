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

// ─── WebGL availability pre-check (before any Canvas creation) ────────────────
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      typeof window !== 'undefined' &&
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// ─── Error Boundary (catches runtime Canvas errors) ───────────────────────────
class GameErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e: Error) { console.warn('[GameEngine] 3D error:', e.message); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// ─── WebGL / GPU Unavailable fallback screen ─────────────────────────────────
function WebGLFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#060810] relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,180,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'gridScroll 10s linear infinite',
        }}
      />
      <style>{`
        @keyframes gridScroll { from { background-position: 0 0; } to { background-position: 0 40px; } }
        @keyframes pulseGlow  { 0%,100% { box-shadow: 0 0 24px #00b4ff55; } 50% { box-shadow: 0 0 48px #00b4ffaa; } }
      `}</style>

      <div
        className="mb-6 p-5 rounded-full border-2 border-[#00b4ff]/50 bg-[#00b4ff]/10"
        style={{ animation: 'pulseGlow 2.5s ease infinite' }}
      >
        <Monitor className="w-12 h-12 text-[#00b4ff]" />
      </div>

      <h2 className="text-2xl font-black text-white mb-2 tracking-[0.2em] font-mono">GPU REQUIRED</h2>
      <p className="text-white/45 text-sm text-center max-w-sm font-mono mb-8 leading-relaxed">
        Apex-Fort's engine uses PBR rendering, Lumen-style global illumination,
        Nanite-style LOD, and real-time shadows. A GPU is required — not available
        in the Replit sandbox preview.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-10">
        {([
          { Icon: Gamepad2, label: 'PBR Shading',     color: '#00b4ff' },
          { Icon: Cpu,      label: 'Lumen-Style GI',  color: '#a855f7' },
          { Icon: Monitor,  label: 'Nanite LOD',      color: '#22c55e' },
        ] as const).map(({ Icon, label, color }) => (
          <div key={label} className="flex flex-col items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <Icon className="w-5 h-5" style={{ color }} />
            <span className="text-[11px] text-white/55 font-mono text-center">{label}</span>
          </div>
        ))}
      </div>

      <a
        href={window.location.href}
        target="_blank"
        rel="noopener noreferrer"
        className="px-9 py-3 rounded-full font-black font-mono tracking-widest text-sm text-black hover:scale-105 transition-transform"
        style={{ background: '#00b4ff', boxShadow: '0 0 30px #00b4ff66' }}
      >
        OPEN IN NEW TAB →
      </a>
      <p className="mt-3 text-white/25 text-xs font-mono">Deploy on Render for a public GPU-accelerated link</p>
    </div>
  );
}

// ─── Scene lighting ───────────────────────────────────────────────────────────
function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[120, 200, 80]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={800}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        color="#fff8e8"
      />
      <directionalLight position={[-80, 60, -80]} intensity={0.4} color="#8ab4ff" />
      <directionalLight position={[0, -10, -100]} intensity={0.15} color="#ffffff" />
    </>
  );
}

// ─── Floating dust particles ──────────────────────────────────────────────────
function DustParticles() {
  const count = 300;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = Math.random() * 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#cce8ff" transparent opacity={0.22} sizeAttenuation />
    </points>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────
function GameScene() {
  const uploadedModels = useGameStore((s) => s.uploadedModels);
  return (
    <>
      <Lights />
      <fog attach="fog" args={['#0a0c14', 90, 500]} />

      <Sky
        distance={450000}
        sunPosition={[120, 30, -200]}
        inclination={0.49}
        azimuth={0.25}
        rayleigh={0.8}
        turbidity={8}
        mieCoefficient={0.006}
        mieDirectionalG={0.85}
      />
      <Stars radius={400} depth={60} count={1500} factor={3} fade />
      <Environment preset="forest" />

      <Terrain />
      <SoldierCharacter />

      {uploadedModels.map((url, i) => (
        <UploadedAsset key={url} url={url} index={i} />
      ))}

      <DustParticles />
      <GameEffects />
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function GameEngine() {
  // Synchronous check — never creates Canvas if WebGL unavailable
  const [webglAvailable] = useState(isWebGLAvailable);

  if (!webglAvailable) return <WebGLFallback />;

  return (
    <GameErrorBoundary fallback={<WebGLFallback />}>
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ fov: 72, near: 0.2, far: 1500, position: [0, 6, 10] }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#060810' }}
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
    </GameErrorBoundary>
  );
}
