import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BuildPiece, BuildPieceType, MaterialType } from "../../types/game";
import { useGameStore } from "../../store/gameStore";
import { getTerrainHeight } from "./Terrain";

const MATERIAL_COSTS: Record<BuildPieceType, number> = {
  wall: 10, floor: 10, ramp: 10, roof: 10, stair: 10,
};

const PIECE_COLORS: Record<MaterialType, string> = {
  wood: "#c4883a",
  stone: "#888880",
  metal: "#7ec8e3",
};

const PIECE_HEALTH: Record<MaterialType, number> = {
  wood: 150, stone: 300, metal: 500,
};

export default function BuildingSystem({
  newPiece,
}: {
  newPiece: React.MutableRefObject<{ position: THREE.Vector3; type: BuildPieceType; material: MaterialType } | null>;
}) {
  const [pieces, setPieces] = useState<BuildPiece[]>([]);
  const lastKey = useRef<string | null>(null);
  const { camera } = useThree();
  const previewRef = useRef<THREE.Mesh>(null);
  const buildMode = useGameStore((s) => s.buildMode);
  const selectedPiece = useGameStore((s) => s.selectedBuildPiece);
  const activeMaterial = useGameStore((s) => s.activeMaterial);
  const spendMaterial = useGameStore((s) => s.spendMaterial);
  const previewPosRef = useRef(new THREE.Vector3());

  useFrame(() => {
    // Calculate preview position based on camera ray
    if (buildMode) {
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const targetPos = camera.position.clone().add(dir.multiplyScalar(6));
      const snap = 2;
      targetPos.x = Math.round(targetPos.x / snap) * snap;
      targetPos.z = Math.round(targetPos.z / snap) * snap;
      targetPos.y = Math.max(getTerrainHeight(targetPos.x, targetPos.z) + 0.05, Math.round(targetPos.y / snap) * snap);
      previewPosRef.current.copy(targetPos);
      if (previewRef.current) previewRef.current.position.copy(targetPos);
    }

    const np = newPiece.current;
    if (!np) return;
    const key = `${np.position.x.toFixed(1)}_${np.position.z.toFixed(1)}_${np.type}_${np.material}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    const cost = MATERIAL_COSTS[np.type];
    if (!spendMaterial(np.material, cost)) return;

    const piece: BuildPiece = {
      id: `bp_${Date.now()}`,
      type: np.type,
      position: np.position.clone(),
      rotation: 0,
      material: np.material,
      health: PIECE_HEALTH[np.material],
    };
    setPieces((prev) => [...prev.slice(-200), piece]);
  });

  return (
    <>
      {/* Build preview ghost */}
      {buildMode && (
        <mesh ref={previewRef} position={previewPosRef.current}>
          <PieceGeometry type={selectedPiece} />
          <meshBasicMaterial color={PIECE_COLORS[activeMaterial]} transparent opacity={0.45} wireframe />
        </mesh>
      )}

      {/* Placed pieces */}
      {pieces.map((piece) => (
        <PlacedPiece key={piece.id} piece={piece} />
      ))}
    </>
  );
}

function PlacedPiece({ piece }: { piece: BuildPiece }) {
  const color = PIECE_COLORS[piece.material];
  return (
    <mesh
      position={piece.position.toArray()}
      rotation={[0, piece.rotation, 0]}
      castShadow
      receiveShadow
    >
      <PieceGeometry type={piece.type} />
      <meshLambertMaterial color={color} />
    </mesh>
  );
}

function PieceGeometry({ type }: { type: BuildPieceType }) {
  switch (type) {
    case "wall":
      return <boxGeometry args={[4, 4, 0.3]} />;
    case "floor":
      return <boxGeometry args={[4, 0.25, 4]} />;
    case "ramp":
      return <RampGeometry />;
    case "roof":
      return <boxGeometry args={[4.1, 0.2, 4.1]} />;
    case "stair":
      return <StairGeometry />;
    default:
      return <boxGeometry args={[4, 4, 0.3]} />;
  }
}

function RampGeometry() {
  const geom = new THREE.BufferGeometry();
  const v = new Float32Array([
    -2, 0, 2,  2, 0, 2,  2, 4, -2,
    -2, 0, 2,  2, 4, -2, -2, 4, -2,
    -2, 0, 2, -2, 4, -2,  2, 4, -2,
    -2, 0, 2,  2, 0, 2,  2, 4, -2,
  ]);
  geom.setAttribute("position", new THREE.BufferAttribute(v, 3));
  geom.computeVertexNormals();
  return <primitive object={geom} />;
}

function StairGeometry() {
  return (
    <group>
      {[0,1,2,3].map(i => (
        <mesh key={i} position={[-1.5 + i * 1, i * 0.5, 0]}>
          <boxGeometry args={[1, 0.5, 4]} />
        </mesh>
      ))}
    </group>
  );
}
