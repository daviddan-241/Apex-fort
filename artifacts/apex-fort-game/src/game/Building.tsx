import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useGameStore, type BuildingPiece, type BuildPiece } from "@/store/gameStore";

const MAT_COLORS: Record<string, string> = {
  WOOD: "#a0783a",
  STONE: "#8a8a9a",
  METAL: "#6a8090",
};

const MAT_DAMAGED_COLORS: Record<string, string> = {
  WOOD: "#7a5020",
  STONE: "#606070",
  METAL: "#4a6070",
};

function PlacedPiece({ piece }: { piece: BuildingPiece }) {
  const hpRatio = piece.hp / piece.maxHp;
  const color = hpRatio > 0.5
    ? MAT_COLORS[piece.material]
    : MAT_DAMAGED_COLORS[piece.material];

  const size: [number, number, number] =
    piece.type === "WALL" ? [6, 4, 0.4] :
    piece.type === "FLOOR" ? [6, 0.4, 6] :
    [6, 0.4, 6]; // RAMP uses same base, rotated

  return (
    <RigidBody type="fixed" colliders="cuboid" position={piece.position} rotation={piece.rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshLambertMaterial color={color} transparent opacity={0.9} />
      </mesh>
      {/* HP overlay */}
      {hpRatio < 1 && (
        <mesh position={[0, size[1] / 2 + 0.05, 0]}>
          <planeGeometry args={[size[0] * hpRatio, 0.1]} />
          <meshBasicMaterial color="#ef4444" depthTest={false} />
        </mesh>
      )}
    </RigidBody>
  );
}

function GhostPreview() {
  const ghostRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const { buildMode, buildPiece, buildMaterial, placeBuildingPiece } = useGameStore();
  const [ghostPos, setGhostPos] = useState<[number, number, number]>([0, 0, 0]);
  const [ghostRot, setGhostRot] = useState<[number, number, number]>([0, 0, 0]);

  // Get placement position in front of player
  useFrame(() => {
    if (!buildMode) return;
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
    dir.y = 0;
    dir.normalize();
    const base = camera.position.clone().add(dir.multiplyScalar(6));
    // Snap to grid
    const snapSize = 6;
    base.x = Math.round(base.x / snapSize) * snapSize;
    base.z = Math.round(base.z / snapSize) * snapSize;

    const y = buildPiece === "FLOOR" ? 0.2 :
               buildPiece === "RAMP" ? 0.2 :
               2; // wall at ground level, center at 2m

    setGhostPos([base.x, y, base.z]);

    // Align rotation to player facing
    const yaw = camera.rotation.y;
    const snapAngle = Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2);
    setGhostRot([0, snapAngle, 0]);
  });

  // Place on left click when in build mode
  useEffect(() => {
    const onClick = () => {
      if (!buildMode) return;
      placeBuildingPiece(ghostPos, ghostRot);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [buildMode, ghostPos, ghostRot, placeBuildingPiece]);

  if (!buildMode) return null;

  const size: [number, number, number] =
    buildPiece === "WALL" ? [6, 4, 0.4] :
    buildPiece === "FLOOR" ? [6, 0.4, 6] :
    [6, 0.4, 6];

  return (
    <mesh ref={ghostRef} position={ghostPos} rotation={ghostRot} castShadow>
      <boxGeometry args={size} />
      <meshBasicMaterial
        color={MAT_COLORS[buildMaterial]}
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function BuildingSystem({ pieces }: { pieces: BuildingPiece[] }) {
  return (
    <group>
      {pieces.map(p => (
        <PlacedPiece key={p.id} piece={p} />
      ))}
      <GhostPreview />
    </group>
  );
}
