import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Sky, Stars } from "@react-three/drei";
import { Suspense } from "react";
import Map from "./Map";
import Player from "./Player";
import Storm from "./Storm";
import LootSystem from "./Loot";
import BotSystem from "./Bots";
import BuildingSystem from "./Building";
import HUD from "./HUD";
import SoundSystem from "./SoundSystem";
import { useGameStore } from "@/store/gameStore";

export default function GameScene() {
  const buildings = useGameStore(s => s.buildings);

  return (
    <div className="game-container" style={{ background: "#0a0c12" }}>
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 1200 }}
        gl={{ antialias: true, toneMapping: 4, toneMappingExposure: 0.8 }}
        style={{ width: "100vw", height: "100vh" }}
      >
        <fog attach="fog" args={["#0a0c18", 80, 500]} />
        <ambientLight intensity={0.3} color="#8090b0" />
        <directionalLight
          castShadow
          position={[80, 120, 60]}
          intensity={2.5}
          color="#ffe8c0"
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={600}
          shadow-camera-left={-300}
          shadow-camera-right={300}
          shadow-camera-top={300}
          shadow-camera-bottom={-300}
        />
        <directionalLight position={[-50, 40, -80]} intensity={0.4} color="#4060a0" />
        <Sky sunPosition={[80, 30, -50]} turbidity={4} rayleigh={0.5} />
        <Stars radius={400} depth={60} count={3000} factor={3} saturation={0} fade />

        <Physics gravity={[0, -28, 0]} timeStep="vary">
          <Suspense fallback={null}>
            <Map />
            <Player />
            <Storm />
            <LootSystem />
            <BotSystem />
            <BuildingSystem pieces={buildings} />
          </Suspense>
        </Physics>
      </Canvas>

      <HUD />
      <SoundSystem />
    </div>
  );
}
