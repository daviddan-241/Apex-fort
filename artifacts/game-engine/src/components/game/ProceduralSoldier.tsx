import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  position: THREE.Vector3;
  rotationY: number;
  moving: boolean;
  running: boolean;
}

const SKIN    = '#c4956a';
const UNIFORM = '#3d4a28';
const ARMOR   = '#2a3020';
const BOOTS   = '#1a120a';
const HELMET  = '#2d3820';
const GUN     = '#1a1a1a';
const GLOVES  = '#1e1208';

export function ProceduralSoldier({ position, rotationY, moving, running }: Props) {
  const groupRef  = useRef<THREE.Group>(null);
  const limbsRef  = useRef({ time: 0 });
  const lArmRef   = useRef<THREE.Group>(null);
  const rArmRef   = useRef<THREE.Group>(null);
  const lLegRef   = useRef<THREE.Group>(null);
  const rLegRef   = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(position);
    groupRef.current.rotation.y = rotationY;

    if (moving) {
      const speed = running ? 8 : 5;
      limbsRef.current.time += delta * speed;
    }
    const t = limbsRef.current.time;
    const swing = moving ? Math.sin(t) * 0.5 : 0;

    if (lArmRef.current) lArmRef.current.rotation.x = swing;
    if (rArmRef.current) rArmRef.current.rotation.x = -swing;
    if (lLegRef.current) lLegRef.current.rotation.x = -swing;
    if (rLegRef.current) rLegRef.current.rotation.x = swing;
  });

  return (
    <group ref={groupRef}>
      {/* ── HEAD ──────────────────────────────────────────────── */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.155, 16, 16]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>

      {/* HELMET */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.175, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={HELMET} roughness={0.85} metalness={0.15} />
      </mesh>
      {/* Helmet brim */}
      <mesh position={[0, 1.75, 0.1]} castShadow rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.32, 0.04, 0.12]} />
        <meshStandardMaterial color={HELMET} roughness={0.85} />
      </mesh>

      {/* ── NECK ─────────────────────────────────────────────── */}
      <mesh position={[0, 1.52, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.12, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.8} />
      </mesh>

      {/* ── TORSO ────────────────────────────────────────────── */}
      {/* Main body */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[0.42, 0.52, 0.22]} />
        <meshStandardMaterial color={UNIFORM} roughness={0.88} />
      </mesh>
      {/* Tactical vest */}
      <mesh position={[0, 1.22, 0.01]} castShadow>
        <boxGeometry args={[0.38, 0.4, 0.24]} />
        <meshStandardMaterial color={ARMOR} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Vest pockets */}
      <mesh position={[-0.13, 1.3, 0.13]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.04]} />
        <meshStandardMaterial color="#1e2516" roughness={0.9} />
      </mesh>
      <mesh position={[0.13, 1.3, 0.13]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.04]} />
        <meshStandardMaterial color="#1e2516" roughness={0.9} />
      </mesh>

      {/* ── ARMS ──────────────────────────────────────────────── */}
      {/* Left arm */}
      <group ref={lArmRef} position={[-0.27, 1.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.06, 0.28, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Left forearm */}
        <mesh position={[0, -0.34, 0.04]} castShadow rotation={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.24, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Left hand */}
        <mesh position={[0, -0.48, 0.07]} castShadow>
          <boxGeometry args={[0.09, 0.08, 0.06]} />
          <meshStandardMaterial color={GLOVES} roughness={0.9} />
        </mesh>
      </group>

      {/* Right arm (holds weapon) */}
      <group ref={rArmRef} position={[0.27, 1.28, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.06, 0.28, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Right forearm */}
        <mesh position={[0, -0.34, 0.04]} castShadow rotation={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.05, 0.24, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.48, 0.07]} castShadow>
          <boxGeometry args={[0.09, 0.08, 0.06]} />
          <meshStandardMaterial color={GLOVES} roughness={0.9} />
        </mesh>
        {/* ── ASSAULT RIFLE ──────────────────────────── */}
        <group position={[0.04, -0.42, 0.25]} rotation={[-0.1, 0, 0]}>
          {/* Main body */}
          <mesh castShadow>
            <boxGeometry args={[0.04, 0.07, 0.38]} />
            <meshStandardMaterial color={GUN} roughness={0.6} metalness={0.6} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0, 0.01, 0.28]} castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.014, 0.22, 8]} />
            <meshStandardMaterial color={GUN} roughness={0.5} metalness={0.8} />
          </mesh>
          {/* Stock */}
          <mesh position={[0, -0.02, -0.22]} castShadow>
            <boxGeometry args={[0.03, 0.05, 0.14]} />
            <meshStandardMaterial color="#222222" roughness={0.9} />
          </mesh>
          {/* Grip */}
          <mesh position={[0, -0.06, -0.04]} castShadow rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.028, 0.08, 0.032]} />
            <meshStandardMaterial color="#111111" roughness={0.95} />
          </mesh>
          {/* Scope */}
          <mesh position={[0, 0.05, 0.05]} castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.9} />
          </mesh>
          {/* Muzzle flash light (subtle) */}
          <pointLight position={[0, 0, 0.4]} intensity={0} color="#ff8800" distance={2} />
        </group>
      </group>

      {/* ── PELVIS / HIP ─────────────────────────────────────── */}
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[0.38, 0.14, 0.2]} />
        <meshStandardMaterial color={UNIFORM} roughness={0.88} />
      </mesh>

      {/* ── LEGS ──────────────────────────────────────────────── */}
      {/* Left leg */}
      <group ref={lLegRef} position={[-0.12, 0.82, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.072, 0.4, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Left shin */}
        <mesh position={[0, -0.48, 0.02]} castShadow rotation={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.38, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Left boot */}
        <mesh position={[0, -0.7, 0.04]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshStandardMaterial color={BOOTS} roughness={0.85} metalness={0.05} />
        </mesh>
      </group>

      {/* Right leg */}
      <group ref={rLegRef} position={[0.12, 0.82, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.072, 0.4, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Right shin */}
        <mesh position={[0, -0.48, 0.02]} castShadow rotation={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.38, 8]} />
          <meshStandardMaterial color={UNIFORM} roughness={0.88} />
        </mesh>
        {/* Right boot */}
        <mesh position={[0, -0.7, 0.04]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshStandardMaterial color={BOOTS} roughness={0.85} metalness={0.05} />
        </mesh>
      </group>
    </group>
  );
}
