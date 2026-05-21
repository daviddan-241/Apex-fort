import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './store';
import { sounds } from './Sounds';

export function Bullets() {
  const bullets = useGameStore(s => s.bullets);

  useFrame((_, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;

    store.updateBullets(delta);

    const current = store.bullets;
    const bots = store.bots;
    const playerPos = store.playerPos;
    const hitBullets = new Set<string>();

    current.forEach(b => {
      if (b.ownerId === 'player') {
        bots.forEach(bot => {
          if (hitBullets.has(b.id)) return;
          const dist = b.position.distanceTo(bot.position);
          const hitRadius = b.isExplosive ? 5 : 1.5;
          if (dist < hitRadius) {
            const isHeadshot = !b.isExplosive && Math.random() < 0.2;
            if (b.isExplosive) {
              // Area damage
              bots.forEach(nearBot => {
                if (nearBot.position.distanceTo(b.position) < 5) {
                  const falloff = 1 - nearBot.position.distanceTo(b.position) / 5;
                  store.damageBot(nearBot.id, Math.round(b.damage * falloff), false);
                  store.addDamageNumber(nearBot.position, Math.round(b.damage * falloff), false);
                }
              });
            } else {
              store.damageBot(bot.id, b.damage, isHeadshot);
              store.addDamageNumber(bot.position, isHeadshot ? Math.round(b.damage * 1.5) : b.damage, isHeadshot);
              if (isHeadshot) sounds.playHit();
            }
            hitBullets.add(b.id);
          }
        });
      } else {
        if (!hitBullets.has(b.id) && b.position.distanceTo(playerPos) < 1.5) {
          store.damagePlayer(b.damage);
          hitBullets.add(b.id);
          sounds.playHit();
        }
      }
    });

    if (hitBullets.size > 0) {
      useGameStore.setState(s => ({
        bullets: s.bullets.filter(b => !hitBullets.has(b.id)),
      }));
    }
  });

  return (
    <group>
      {bullets.map(b => (
        <group key={b.id}>
          <mesh position={b.position}>
            <sphereGeometry args={[b.isExplosive ? 0.4 : 0.18, 8, 8]} />
            <meshBasicMaterial color={
              b.isExplosive ? '#c084fc' :
              b.ownerId === 'player' ? '#00c8ff' : '#ff4444'
            } />
          </mesh>
          <pointLight
            position={b.position}
            color={b.isExplosive ? '#c084fc' : b.ownerId === 'player' ? '#00c8ff' : '#ff4444'}
            intensity={b.isExplosive ? 4 : 2}
            distance={b.isExplosive ? 8 : 4}
          />
        </group>
      ))}
    </group>
  );
}
