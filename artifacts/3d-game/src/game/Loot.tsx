import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from './store';

export function Loot() {
  const loot = useGameStore(state => state.loot);
  const playerPos = useGameStore(state => state.playerPos);
  const collectLoot = useGameStore(state => state.collectLoot);
  
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slowly rotate crates
      groupRef.current.children.forEach((child) => {
        child.rotation.y += 0.02;
      });
    }

    // Auto-collect if near
    loot.forEach(l => {
      if (l.position.distanceTo(playerPos) < 2) {
        collectLoot(l.id);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {loot.map(l => (
        <group key={l.id} position={l.position}>
          <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
              color={l.type === 'weapon' ? '#ffcc00' : l.type === 'health' ? '#00ff55' : '#00c8ff'} 
              emissive={l.type === 'weapon' ? '#ffcc00' : l.type === 'health' ? '#00ff55' : '#00c8ff'}
              emissiveIntensity={0.5}
            />
          </mesh>
          <pointLight color={l.type === 'weapon' ? '#ffcc00' : l.type === 'health' ? '#00ff55' : '#00c8ff'} intensity={1} distance={3} position={[0, 1, 0]} />
        </group>
      ))}
    </group>
  );
}
