import React from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useGameStore } from './store';

export function DamageNumbers() {
  const damageNumbers = useGameStore(state => state.damageNumbers);
  const removeOld = useGameStore(state => state.removeOldDamageNumbers);

  useFrame(() => {
    const store = useGameStore.getState();
    removeOld(store.gameTime);
  });

  return (
    <group>
      {damageNumbers.map(dn => (
        <Html key={dn.id} position={dn.position} center zIndexRange={[100, 0]}>
          <div className="text-white font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-bounce font-mono">
            {dn.amount}
          </div>
        </Html>
      ))}
    </group>
  );
}
