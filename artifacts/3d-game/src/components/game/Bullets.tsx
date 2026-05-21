import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "./Terrain";

interface BulletData {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  fromPlayer: boolean;
  lifetime?: number;
}

interface BulletsProps {
  bulletsRef: React.MutableRefObject<BulletData[]>;
}

const MAX_BULLETS = 120;
const MAX_LIFETIME = 2.2;
const BULLET_SPEED = 90;

export default function Bullets({ bulletsRef }: BulletsProps) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const toRemove: string[] = [];

    bulletsRef.current.forEach((bullet) => {
      bullet.position.addScaledVector(bullet.direction, bullet.speed * dt);
      bullet.lifetime = (bullet.lifetime ?? 0) + dt;

      const terrH = getTerrainHeight(bullet.position.x, bullet.position.z);
      if (
        bullet.position.y < terrH ||
        bullet.lifetime > MAX_LIFETIME ||
        Math.abs(bullet.position.x) > 130 ||
        Math.abs(bullet.position.z) > 130
      ) {
        toRemove.push(bullet.id);
      }
    });

    if (toRemove.length > 0) {
      bulletsRef.current = bulletsRef.current.filter((b) => !toRemove.includes(b.id));
    }

    // Limit bullets
    if (bulletsRef.current.length > MAX_BULLETS) {
      bulletsRef.current = bulletsRef.current.slice(-MAX_BULLETS);
    }

    // Sync mesh positions
    bulletsRef.current.forEach((bullet, i) => {
      const mesh = meshRefs.current[i];
      if (mesh) mesh.position.copy(bullet.position);
    });
  });

  return (
    <group>
      {Array.from({ length: MAX_BULLETS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el; }}
          visible={i < (bulletsRef.current?.length ?? 0)}
        >
          <sphereGeometry args={[0.07, 4, 4]} />
          <meshBasicMaterial color="#ffdd44" />
        </mesh>
      ))}
    </group>
  );
}

export function createBullet(
  pos: THREE.Vector3,
  dir: THREE.Vector3,
  damage: number,
  fromPlayer: boolean
): BulletData {
  return {
    id: `b_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    position: pos.clone(),
    direction: dir.clone().normalize(),
    speed: BULLET_SPEED,
    damage,
    fromPlayer,
    lifetime: 0,
  };
}
