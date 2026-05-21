import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameStore } from './store';

export function DamageNumbers() {
  const damageNumbers = useGameStore(s => s.damageNumbers);
  const removeOld = useGameStore(s => s.removeOldDamageNumbers);

  useFrame(() => {
    removeOld(useGameStore.getState().gameTime);
  });

  return (
    <group>
      {damageNumbers.map(dn => {
        const age = Math.max(0, useGameStore.getState().gameTime - dn.createdAt);
        const opacity = Math.max(0, 1 - age / 1.5);
        return (
          <Html key={dn.id} position={[dn.position.x, dn.position.y + age * 2, dn.position.z]} center zIndexRange={[200, 0]}>
            <div
              className="pointer-events-none font-black whitespace-nowrap"
              style={{
                opacity,
                fontSize: dn.isHeadshot ? '18px' : '14px',
                color: dn.isHeadshot ? '#fbbf24' : '#ff4444',
                textShadow: dn.isHeadshot ? '0 0 10px #fbbf24' : '0 0 4px rgba(0,0,0,0.9)',
                fontFamily: 'Space Mono, monospace',
              }}
            >
              {dn.isHeadshot ? `HEADSHOT ${dn.amount}` : String(dn.amount)}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
