import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/gameStore";

export default function Storm() {
  const ringRef = useRef<THREE.Mesh>(null);
  const wallRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const { stormRadius } = useGameStore.getState();
    if (ringRef.current) {
      ringRef.current.scale.set(stormRadius, 1, stormRadius);
    }
    if (wallRef.current) {
      wallRef.current.scale.set(stormRadius, 1, stormRadius);
    }
  });

  return (
    <group>
      {/* Storm wall cylinder */}
      <mesh ref={wallRef} position={[0, 75, 0]}>
        <cylinderGeometry args={[1, 1, 150, 64, 1, true]} />
        <meshBasicMaterial
          color="#4040dd"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer fog / edge glow */}
      <mesh position={[0, 75, 0]}>
        <cylinderGeometry args={[500, 500, 150, 32, 1, true]} />
        <meshBasicMaterial
          color="#1a1a4a"
          transparent
          opacity={0.55}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Ground ring indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <ringGeometry args={[0.97, 1, 128]} />
        <meshBasicMaterial color="#6060ff" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}
