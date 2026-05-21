import React, { useMemo } from 'react';
import { useGameStore } from './store';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function World() {
  const stormRadius = useGameStore(state => state.stormRadius);

  // Pre-calculate scenery
  const { trees, rocks, buildings } = useMemo(() => {
    const t = [];
    const r = [];
    const b = [];
    
    // Generate deterministic scenery
    for (let i = 0; i < 50; i++) {
      const angle = i * 2.4;
      const radius = 20 + (i * 3) % 80;
      t.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    
    for (let i = 0; i < 30; i++) {
      const angle = i * 3.1;
      const radius = 10 + (i * 5) % 90;
      const scale = 0.5 + (i % 3) * 0.5;
      r.push({ pos: new THREE.Vector3(Math.cos(angle) * radius, scale, Math.sin(angle) * radius), scale });
    }

    for (let i = 0; i < 10; i++) {
      const angle = i * 1.7;
      const radius = 30 + (i * 8) % 70;
      b.push(new THREE.Vector3(Math.cos(angle) * radius, 2.5, Math.sin(angle) * radius));
    }

    return { trees: t, rocks: r, buildings: b };
  }, []);

  const stormRef = React.useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    // Update storm
    const store = useGameStore.getState();
    if (store.gameState === 'playing') {
      store.updateStorm(delta);
    }
  });

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Grid helper for tech vibe */}
      <gridHelper args={[200, 40, '#00c8ff', '#1e293b']} position={[0, 0.01, 0]} />

      {/* Scenery */}
      {trees.map((pos, i) => (
        <group key={`tree-${i}`} position={pos}>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 2]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow receiveShadow>
            <coneGeometry args={[1.5, 3]} />
            <meshStandardMaterial color="#0f766e" />
          </mesh>
        </group>
      ))}

      {rocks.map((rock, i) => (
        <mesh key={`rock-${i}`} position={rock.pos} castShadow receiveShadow>
          <dodecahedronGeometry args={[rock.scale, 0]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
      ))}

      {buildings.map((pos, i) => (
        <mesh key={`bldg-${i}`} position={pos} castShadow receiveShadow>
          <boxGeometry args={[5, 5, 5]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}

      {/* Storm Ring */}
      <mesh ref={stormRef} rotation={[0, 0, 0]} position={[0, 25, 0]}>
        <cylinderGeometry args={[stormRadius, stormRadius, 50, 64, 1, true]} />
        <meshBasicMaterial color="#ff0055" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Storm outer bounds (darkness outside ring) */}
      <mesh rotation={[0, 0, 0]} position={[0, 25, 0]}>
        <cylinderGeometry args={[200, stormRadius + 0.1, 50, 64, 1, true]} />
        <meshBasicMaterial color="#ff0055" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}
