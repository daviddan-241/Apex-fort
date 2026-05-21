import { useRef, useCallback, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, Stars, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";
import { BuildPieceType, MaterialType } from "../../types/game";
import Player from "./Player";
import Terrain from "./Terrain";
import Storm from "./Storm";
import Bots from "./Bots";
import Bullets, { createBullet } from "./Bullets";
import BuildingSystem from "./BuildingSystem";
import LootItems from "./LootItems";
import HUD from "../ui/HUD";

export default function Game() {
  const bulletsRef = useRef<ReturnType<typeof createBullet>[]>([]);
  const playerPosRef = useRef(new THREE.Vector3(0, 2, 0));
  const newBuildPieceRef = useRef<{ position: THREE.Vector3; type: BuildPieceType; material: MaterialType } | null>(null);

  const buildMode = useGameStore((s) => s.buildMode);
  const selectedBuildPiece = useGameStore((s) => s.selectedBuildPiece);
  const activeMaterial = useGameStore((s) => s.activeMaterial);
  const tick = useGameStore((s) => s.tick);

  const handleShoot = useCallback((pos: THREE.Vector3, dir: THREE.Vector3, damage: number, fromPlayer: boolean) => {
    bulletsRef.current.push(createBullet(pos, dir, damage, fromPlayer));
  }, []);

  const handleHarvest = useCallback((_mat: "wood" | "stone" | "metal") => {}, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#1a2a3a" }}>
      <Canvas
        shadows
        camera={{ fov: 80, near: 0.1, far: 1200 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        {/* Frame ticker */}
        <FrameTicker tick={tick} playerPosRef={playerPosRef} />

        {/* Lighting */}
        <ambientLight intensity={0.55} color="#b0c8e8" />
        <directionalLight
          position={[60, 90, 40]}
          intensity={1.6}
          color="#fff8e0"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-180}
          shadow-camera-right={180}
          shadow-camera-top={180}
          shadow-camera-bottom={-180}
          shadow-camera-near={1}
          shadow-camera-far={400}
        />
        <directionalLight position={[-30, 50, -60]} intensity={0.4} color="#a0c0ff" />
        <hemisphereLight args={["#87ceeb", "#4a8a28", 0.5]} />
        <fogExp2 attach="fog" args={["#c8dff0", 0.0025]} />

        {/* Sky */}
        <Sky
          distance={1800}
          sunPosition={[80, 40, -60]}
          inclination={0.52}
          azimuth={0.28}
          turbidity={5}
          rayleigh={1.2}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
        <Stars radius={400} depth={80} count={2000} factor={4} fade />

        <Suspense fallback={null}>
          <Terrain />
          <LootItems />
          <Storm playerPosition={playerPosRef} />
          <Bots onShoot={handleShoot} playerRef={playerPosRef} bulletsRef={bulletsRef} />
          <BuildingSystem newPiece={newBuildPieceRef} />
          <Bullets bulletsRef={bulletsRef} />
          <Player
            onShoot={handleShoot}
            onHarvest={handleHarvest}
          />
          <PlayerPosTracker playerPosRef={playerPosRef} />
          {buildMode && (
            <BuildPlacer
              newBuildPieceRef={newBuildPieceRef}
              selectedBuildPiece={selectedBuildPiece}
              activeMaterial={activeMaterial}
            />
          )}
        </Suspense>
      </Canvas>

      <HUD />
    </div>
  );
}

import { useFrame } from "@react-three/fiber";

function FrameTicker({ tick, playerPosRef }: { tick: (dt: number) => void; playerPosRef: React.MutableRefObject<THREE.Vector3> }) {
  useFrame((state, delta) => {
    tick(Math.min(delta, 0.05));
    playerPosRef.current.copy(state.camera.position);
    playerPosRef.current.y -= 1.75;
  });
  return null;
}

function PlayerPosTracker({ playerPosRef }: { playerPosRef: React.MutableRefObject<THREE.Vector3> }) {
  useFrame((state) => {
    playerPosRef.current.copy(state.camera.position);
    playerPosRef.current.y -= 1.75;
  });
  return null;
}

function BuildPlacer({
  newBuildPieceRef,
  selectedBuildPiece,
  activeMaterial,
}: {
  newBuildPieceRef: React.MutableRefObject<{ position: THREE.Vector3; type: BuildPieceType; material: MaterialType } | null>;
  selectedBuildPiece: BuildPieceType;
  activeMaterial: MaterialType;
}) {
  useFrame((state) => {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const pos = state.camera.position.clone().add(dir.multiplyScalar(6));
    const snap = 2;
    pos.x = Math.round(pos.x / snap) * snap;
    pos.z = Math.round(pos.z / snap) * snap;
    pos.y = Math.max(0.1, Math.round(pos.y / snap) * snap);
    newBuildPieceRef.current = { position: pos, type: selectedBuildPiece, material: activeMaterial };
  });
  return null;
}
