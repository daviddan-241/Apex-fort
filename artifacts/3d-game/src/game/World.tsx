import React, { useMemo } from 'react';
import { useGameStore } from './store';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

export function World() {
  const stormRadius = useGameStore(s => s.stormRadius);

  const { trees, rocks, cityBuildings, forestTrees, supplyDrop } = useMemo(() => {
    const t: THREE.Vector3[] = [];
    const r: Array<{ pos: THREE.Vector3; scale: number }> = [];
    const city: Array<{ pos: THREE.Vector3; w: number; h: number; d: number }> = [];
    const forest: THREE.Vector3[] = [];

    // City zone - dense buildings northeast
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 0.8 + 0.1;
      const radius = 25 + (i % 3) * 12;
      const w = 4 + (i % 4) * 2;
      const h = 4 + (i % 5) * 2;
      city.push({ pos: new THREE.Vector3(Math.cos(angle) * radius + 30, h / 2, Math.sin(angle) * radius + 25), w, h, d: 4 + (i % 3) * 2 });
    }

    // Forest zone - trees southwest
    for (let i = 0; i < 35; i++) {
      const angle = (i * 2.6) + Math.PI;
      const radius = 20 + (i * 2.7) % 55;
      forest.push(new THREE.Vector3(Math.cos(angle) * radius - 20, 0, Math.sin(angle) * radius - 15));
    }

    // Scattered trees everywhere
    for (let i = 0; i < 30; i++) {
      const angle = i * 2.4;
      const radius = 15 + (i * 3.1) % 75;
      t.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }

    // Rocks
    for (let i = 0; i < 25; i++) {
      const angle = i * 3.7;
      const radius = 10 + (i * 4.1) % 80;
      const scale = 0.4 + (i % 4) * 0.35;
      r.push({ pos: new THREE.Vector3(Math.cos(angle) * radius, scale, Math.sin(angle) * radius), scale });
    }

    const sd = new THREE.Vector3(Math.cos(1.3) * 35, 0.5, Math.sin(1.3) * 35);

    return { trees: t, rocks: r, cityBuildings: city, forestTrees: forest, supplyDrop: sd };
  }, []);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.gameState === 'playing') store.updateStorm(delta);
  });

  return (
    <group>
      {/* Ground - main */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0d1824" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Grid overlay */}
      <gridHelper args={[200, 50, '#00c8ff22', '#1e293b44']} position={[0, 0.02, 0]} />

      {/* Water / River area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.05, 10]} receiveShadow>
        <planeGeometry args={[60, 12]} />
        <meshStandardMaterial color="#0d3b6e" transparent opacity={0.75} metalness={0.3} roughness={0.2} />
      </mesh>

      {/* Ridge / Elevated terrain */}
      <mesh position={[50, 1, -40]} receiveShadow castShadow>
        <boxGeometry args={[40, 2, 20]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[50, 2.5, -40]} receiveShadow castShadow>
        <boxGeometry args={[30, 1, 14]} />
        <meshStandardMaterial color="#243324" roughness={0.9} />
      </mesh>

      {/* Zone labels */}
      {[
        { pos: new THREE.Vector3(35, 6, 30), label: 'PLAZA' },
        { pos: new THREE.Vector3(-30, 4, -20), label: 'FOREST' },
        { pos: new THREE.Vector3(50, 6, -40), label: 'RIDGE' },
        { pos: new THREE.Vector3(-5, 4, -55), label: 'LOWLANDS' },
      ].map(z => (
        <Html key={z.label} position={z.pos} center>
          <div className="pointer-events-none text-[11px] font-black uppercase tracking-[0.3em] text-white/30 bg-black/20 px-2 py-0.5 rounded" style={{ fontFamily: 'Space Mono, monospace' }}>{z.label}</div>
        </Html>
      ))}

      {/* City buildings */}
      {cityBuildings.map((b, i) => (
        <group key={`city-${i}`} position={b.pos}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#1a2840" metalness={0.3} roughness={0.7} />
          </mesh>
          {/* Windows */}
          <mesh position={[0, 0, b.d / 2 + 0.05]}>
            <boxGeometry args={[b.w - 0.4, b.h - 0.4, 0.05]} />
            <meshStandardMaterial color="#001830" emissive="#003366" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Forest trees */}
      {forestTrees.map((pos, i) => (
        <group key={`ftree-${i}`} position={pos}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.3, 2.4, 6]} />
            <meshStandardMaterial color="#3d2b1f" />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.8, 4, 7]} />
            <meshStandardMaterial color="#1a3d1a" />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <coneGeometry args={[2.2, 3, 7]} />
            <meshStandardMaterial color="#224422" />
          </mesh>
        </group>
      ))}

      {/* Scattered trees */}
      {trees.map((pos, i) => (
        <group key={`tree-${i}`} position={pos}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 2]} />
            <meshStandardMaterial color="#4a3728" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <coneGeometry args={[1.4, 3, 7]} />
            <meshStandardMaterial color="#0f5e22" />
          </mesh>
        </group>
      ))}

      {/* Rocks */}
      {rocks.map((r, i) => (
        <mesh key={`rock-${i}`} position={r.pos} castShadow receiveShadow>
          <dodecahedronGeometry args={[r.scale, 0]} />
          <meshStandardMaterial color="#2d3d4a" roughness={0.85} />
        </mesh>
      ))}

      {/* Supply drop marker (glowing crate) */}
      <group position={supplyDrop}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} />
        </mesh>
        <pointLight color="#fbbf24" intensity={3} distance={8} position={[0, 1.5, 0]} />
        <Html position={[0, 2.2, 0]} center>
          <div className="pointer-events-none text-[11px] font-black text-yellow-300 uppercase tracking-widest animate-pulse bg-black/60 px-2 py-0.5 rounded" style={{ fontFamily: 'Space Mono, monospace' }}>SUPPLY DROP</div>
        </Html>
      </group>

      {/* Storm Ring */}
      <mesh position={[0, 25, 0]}>
        <cylinderGeometry args={[stormRadius, stormRadius, 50, 64, 1, true]} />
        <meshBasicMaterial color="#ff0055" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      {/* Storm wall inner glow */}
      <mesh position={[0, 25, 0]}>
        <cylinderGeometry args={[stormRadius - 0.5, stormRadius - 0.5, 50, 64, 1, true]} />
        <meshBasicMaterial color="#ff0055" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
