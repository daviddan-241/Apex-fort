import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, Bot } from './store';

export function Bots() {
  const bots = useGameStore(state => state.bots);
  const playerPos = useGameStore(state => state.playerPos);
  const updateBots = useGameStore(state => state.updateBots);
  const fireWeapon = useGameStore(state => state.fireWeapon);
  
  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    let updated = false;
    const newBots = bots.map(bot => {
      const bPos = bot.position;
      const distToPlayer = bPos.distanceTo(playerPos);
      let newPos = bPos.clone();
      let lastFired = bot.lastFired;

      // Simple AI
      if (distToPlayer < 40 && distToPlayer > 10) {
        // Move towards player
        const dir = playerPos.clone().sub(bPos).normalize();
        newPos.add(dir.multiplyScalar(5 * delta)); // Speed 5
        updated = true;
      } else if (distToPlayer > 40) {
        // Wander randomly (simplified)
        if (!bot.targetPos || bPos.distanceTo(bot.targetPos) < 2) {
          bot.targetPos = new THREE.Vector3(
            bPos.x + (Math.random() - 0.5) * 20,
            1,
            bPos.z + (Math.random() - 0.5) * 20
          );
          bot.targetPos.x = Math.max(-100, Math.min(100, bot.targetPos.x));
          bot.targetPos.z = Math.max(-100, Math.min(100, bot.targetPos.z));
        }
        const dir = bot.targetPos.clone().sub(bPos).normalize();
        newPos.add(dir.multiplyScalar(3 * delta)); // Wander speed 3
        updated = true;
      }

      // Keep on ground
      newPos.y = 1;

      // Shoot
      if (distToPlayer < 20) {
        const now = state.clock.elapsedTime;
        if (now - lastFired > 1.5) {
          // Fire at player
          const dir = playerPos.clone().sub(bPos).normalize();
          // We bypass fireWeapon constraints for bots, or we can use a direct bullet addition
          store.addBullet({
            id: `bot-bullet-${Date.now()}-${Math.random()}`,
            position: bPos.clone().add(new THREE.Vector3(0, 0.5, 0)),
            direction: dir,
            speed: 30,
            damage: 10,
            ownerId: bot.id,
            distanceTraveled: 0,
            maxRange: 50
          });
          lastFired = now;
          updated = true;
        }
      }

      return { ...bot, position: newPos, lastFired };
    });

    if (updated) {
      updateBots(newBots);
    }
  });

  return (
    <group>
      {bots.map(bot => (
        <group key={bot.id} position={bot.position}>
          <mesh castShadow>
            <boxGeometry args={[1, 2, 1]} />
            <meshStandardMaterial color={bot.color} />
          </mesh>
          <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]}>
            <div className="bg-black/50 text-white px-2 py-1 rounded text-xs whitespace-nowrap font-mono pointer-events-none">
              {bot.name} <span className={bot.hp > 50 ? "text-green-400" : "text-red-400"}>{Math.ceil(bot.hp)}HP</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
