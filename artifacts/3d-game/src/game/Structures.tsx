import React from 'react';
import { useGameStore } from './store';

export function Structures() {
  const structures = useGameStore(state => state.structures);

  return (
    <group>
      {structures.map(s => (
        <mesh key={s.id} position={s.position} rotation={s.rotation} castShadow receiveShadow>
          <boxGeometry args={[s.size.x, s.size.y, s.size.z]} />
          {/* Wood-like color */}
          <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
