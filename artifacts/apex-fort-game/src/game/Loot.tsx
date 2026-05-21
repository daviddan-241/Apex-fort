import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

const RARITY_COLORS: Record<string, string> = {
  Mythic: "#e879f9",
  Legendary: "#fbbf24",
  Epic: "#a78bfa",
  Rare: "#60a5fa",
  Common: "#9ca3af",
};

const RARITY_EMISSIVE: Record<string, string> = {
  Mythic: "#c026d3",
  Legendary: "#d97706",
  Epic: "#7c3aed",
  Rare: "#2563eb",
  Common: "#4b5563",
};

function LootPickup({ id, position, name, rarity, collected }: {
  id: string; position: [number, number, number]; name: string; rarity: string; collected: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (collected) return;
    t.current += delta * 1.5;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t.current) * 0.3;
      meshRef.current.rotation.y += delta * 1.2;
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t.current * 2) * 0.15;
      glowRef.current.scale.set(s, s, s);
      glowRef.current.rotation.y -= delta * 0.5;
    }
  });

  if (collected) return null;

  const color = RARITY_COLORS[rarity] ?? "#9ca3af";
  const emissive = RARITY_EMISSIVE[rarity] ?? "#4b5563";

  return (
    <group position={position}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>

      {/* Main item */}
      <mesh ref={meshRef} castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.6}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Ground beam */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.02, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function LootSystem() {
  const loot = useGameStore(s => s.loot);

  return (
    <group>
      {loot.map(item => (
        <LootPickup
          key={item.id}
          id={item.id}
          position={item.position}
          name={item.name}
          rarity={item.rarity}
          collected={item.collected}
        />
      ))}
    </group>
  );
}
