import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, Bullet } from './store';

export function Bullets() {
  const bullets = useGameStore(state => state.bullets);
  const updateBullets = useGameStore(state => state.updateBullets);
  const damageBot = useGameStore(state => state.damageBot);
  const damagePlayer = useGameStore(state => state.damagePlayer);
  const addDamageNumber = useGameStore(state => state.addDamageNumber);
  
  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    store.updateBullets(delta);

    // Collision detection
    // Very simplified O(N*M) - fine for small numbers
    const currentBullets = store.bullets;
    const bots = store.bots;
    const playerPos = store.playerPos;

    let hitBullets = new Set<string>();

    currentBullets.forEach(b => {
      // Check bot hits
      if (b.ownerId === 'player') {
        bots.forEach(bot => {
          if (b.position.distanceTo(bot.position) < 1.5) { // 1.5 hit radius
            damageBot(bot.id, b.damage);
            addDamageNumber(bot.position, b.damage);
            hitBullets.add(b.id);
          }
        });
      } else {
        // Check player hits
        if (b.position.distanceTo(playerPos) < 1.5) {
          damagePlayer(b.damage);
          hitBullets.add(b.id);
        }
      }
    });

    if (hitBullets.size > 0) {
      useGameStore.setState(s => ({
        bullets: s.bullets.filter(b => !hitBullets.has(b.id))
      }));
    }
  });

  return (
    <group>
      {bullets.map(b => (
        <mesh key={b.id} position={b.position}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color={b.ownerId === 'player' ? "#00c8ff" : "#ff0055"} />
          <pointLight color={b.ownerId === 'player' ? "#00c8ff" : "#ff0055"} intensity={2} distance={5} />
        </mesh>
      ))}
    </group>
  );
}
