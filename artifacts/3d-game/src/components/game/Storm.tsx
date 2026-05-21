import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";

// Storm phases like Fortnite
const STORM_PHASES = [
  { duration: 60, endRadius: 100 },
  { duration: 30, waitDuration: 20, endRadius: 70 },
  { duration: 25, waitDuration: 15, endRadius: 48 },
  { duration: 25, waitDuration: 12, endRadius: 30 },
  { duration: 20, waitDuration: 10, endRadius: 18 },
  { duration: 15, waitDuration: 8, endRadius: 10 },
  { duration: 12, waitDuration: 6, endRadius: 5 },
];

const INITIAL_RADIUS = 120;

export default function Storm({ playerPosition }: { playerPosition: React.MutableRefObject<THREE.Vector3> }) {
  const setStorm = useGameStore((s) => s.setStorm);
  const stormRadius = useGameStore((s) => s.stormRadius);

  const elapsed = useRef(0);
  const wallRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const stormCenter = useRef(new THREE.Vector2(0, 0));
  const phaseRef = useRef(0);
  const waitRef = useRef(0);
  const inWaitRef = useRef(true);
  const currentRadius = useRef(INITIAL_RADIUS);
  const nextRadius = useRef(INITIAL_RADIUS);

  useEffect(() => {
    setStorm(INITIAL_RADIUS, stormCenter.current);
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const phase = STORM_PHASES[Math.min(phaseRef.current, STORM_PHASES.length - 1)];

    if (inWaitRef.current) {
      // Waiting phase — show storm but not moving
      waitRef.current -= delta;
      if (waitRef.current <= 0) {
        inWaitRef.current = false;
        elapsed.current = 0;
        nextRadius.current = phase.endRadius;
      }
    } else {
      // Shrinking phase
      const t = Math.min(elapsed.current / phase.duration, 1);
      currentRadius.current = THREE.MathUtils.lerp(currentRadius.current, nextRadius.current, delta / phase.duration * 2);

      if (t >= 1) {
        currentRadius.current = nextRadius.current;
        phaseRef.current = Math.min(phaseRef.current + 1, STORM_PHASES.length - 1);
        inWaitRef.current = true;
        waitRef.current = STORM_PHASES[phaseRef.current]?.waitDuration ?? 0;
        elapsed.current = 0;
      }
    }

    const r = currentRadius.current;
    setStorm(r, stormCenter.current);

    // Update visual
    if (wallRef.current) {
      wallRef.current.scale.setScalar(r / 50);
    }
    if (innerRef.current) {
      innerRef.current.scale.setScalar(r / 50);
    }
  });

  return (
    <group>
      {/* Storm wall — outer cylinder */}
      <mesh ref={wallRef} position={[stormCenter.current.x, 0, stormCenter.current.y]}>
        <cylinderGeometry args={[50, 50, 80, 40, 1, true]} />
        <meshBasicMaterial
          color="#7700cc"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Storm inner glow ring */}
      <mesh ref={innerRef} position={[stormCenter.current.x, 0, stormCenter.current.y]}>
        <cylinderGeometry args={[50, 50, 80, 40, 1, true]} />
        <meshBasicMaterial
          color="#cc44ff"
          transparent
          opacity={0.08}
          side={THREE.FrontSide}
        />
      </mesh>
      {/* Storm floor ring effect */}
      <StormRing radius={stormRadius} cx={stormCenter.current.x} cz={stormCenter.current.y} />
    </group>
  );
}

function StormRing({ radius, cx, cz }: { radius: number; cx: number; cz: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={[cx, 0.3, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 1.5, radius + 1.5, 64]} />
      <meshBasicMaterial color="#aa22ee" transparent opacity={0.55} />
    </mesh>
  );
}
