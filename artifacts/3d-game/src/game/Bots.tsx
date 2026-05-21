import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './store';

export function Bots() {
  const bots = useGameStore(s => s.bots);
  const playerPos = useGameStore(s => s.playerPos);
  const updateBots = useGameStore(s => s.updateBots);

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    let changed = false;
    const newBots = bots.map(bot => {
      const bPos = bot.position;
      const dist = bPos.distanceTo(playerPos);
      let newPos = bPos.clone();
      let lastFired = bot.lastFired;
      let target = bot.targetPos;

      if (dist < 40 && dist > 3) {
        const dir = playerPos.clone().sub(bPos).normalize();
        // Slight lateral movement when shot at (simulate cover)
        const lateral = new THREE.Vector3(-dir.z, 0, dir.x);
        const dodgeAngle = Math.sin(state.clock.elapsedTime * 2 + parseInt(bot.id.slice(-1))) * 0.4;
        const moveDir = dir.clone().addScaledVector(lateral, dodgeAngle).normalize();
        newPos.addScaledVector(moveDir, 6 * delta);
        changed = true;
      } else if (dist >= 40) {
        if (!target || bPos.distanceTo(target) < 2) {
          const angle = state.clock.elapsedTime * 0.5 + parseInt(bot.id.slice(-1)) * 7.3;
          const r = 15 + (parseInt(bot.id.slice(-1)) * 13) % 30;
          target = new THREE.Vector3(
            bPos.x + Math.cos(angle) * r,
            1,
            bPos.z + Math.sin(angle) * r,
          );
          target.x = Math.max(-95, Math.min(95, target.x));
          target.z = Math.max(-95, Math.min(95, target.z));
        }
        const dir = target.clone().sub(bPos).normalize();
        newPos.addScaledVector(dir, 4 * delta);
        changed = true;
      }

      newPos.y = 1;

      if (dist < 22) {
        const now = state.clock.elapsedTime;
        if (now - lastFired > 1.4) {
          const dir = playerPos.clone().sub(bPos).normalize();
          const spread = new THREE.Vector3((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.08);
          store.addBullet({
            id: `bot-bullet-${Date.now()}-${Math.random()}`,
            position: bPos.clone().add(new THREE.Vector3(0, 0.8, 0)),
            direction: dir.add(spread).normalize(),
            speed: 32,
            damage: 8 + Math.floor(Math.random() * 8),
            ownerId: bot.id,
            distanceTraveled: 0,
            maxRange: 55,
          });
          lastFired = now;
          changed = true;
        }
      }

      return { ...bot, position: newPos, lastFired, targetPos: target };
    });

    if (changed) updateBots(newBots);
  });

  return (
    <group>
      {bots.map(bot => (
        <group key={bot.id} position={bot.position}>
          {/* Body */}
          <mesh castShadow>
            <capsuleGeometry args={[0.45, 1, 4, 8]} />
            <meshStandardMaterial color={bot.color} emissive={bot.color} emissiveIntensity={0.15} />
          </mesh>
          {/* Head direction indicator */}
          <mesh position={[0, 0.7, 0.5]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color={bot.color} />
          </mesh>
          <pointLight color={bot.color} intensity={0.8} distance={3} position={[0, 0.5, 0]} />
          <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
            <div className="pointer-events-none flex flex-col items-center gap-0.5" style={{ fontFamily: 'Space Mono, monospace' }}>
              <div className="text-[10px] text-white font-bold whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">{bot.name}</div>
              <div className="w-16 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${(bot.hp / bot.maxHp) * 100}%`,
                    backgroundColor: bot.hp > 60 ? '#4ade80' : bot.hp > 30 ? '#facc15' : '#ef4444',
                  }}
                />
              </div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
