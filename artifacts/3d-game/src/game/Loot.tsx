import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './store';
import { RARITY_COLORS, WEAPONS } from './store';

export function Loot() {
  const loot = useGameStore(state => state.loot);
  const playerPos = useGameStore(state => state.playerPos);
  const collectLoot = useGameStore(state => state.collectLoot);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child: THREE.Object3D) => {
        child.rotation.y += 0.02;
      });
    }
    loot.forEach(l => {
      if (l.position.distanceTo(playerPos) < 2) {
        collectLoot(l.id);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {loot.map(l => {
        const isMythic = l.weaponType === 'MythicAR' || l.weaponType === 'InfinityCannon';
        const color = l.type === 'weapon'
          ? (l.weaponType ? RARITY_COLORS[WEAPONS[l.weaponType].rarity] : '#60a5fa')
          : l.type === 'health' ? '#4ade80' : '#00c8ff';
        return (
          <group key={l.id} position={l.position}>
            <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
              <boxGeometry args={isMythic ? [1.3, 1.3, 1.3] : [0.9, 0.9, 0.9]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={isMythic ? 0.9 : 0.5} />
            </mesh>
            <pointLight color={color} intensity={isMythic ? 2.5 : 1.2} distance={isMythic ? 6 : 3.5} position={[0, 1, 0]} />
          </group>
        );
      })}
    </group>
  );
}
