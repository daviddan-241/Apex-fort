import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";
import { getTerrainHeight } from "./Terrain";
import Terrain from "./Terrain";

// Bus travels from (-130, 75, -130) to (130, 75, 130)
const BUS_START = new THREE.Vector3(-130, 75, -130);
const BUS_END = new THREE.Vector3(130, 75, 130);
const BUS_SPEED = 22;
const BUS_TOTAL_TIME = BUS_START.distanceTo(BUS_END) / BUS_SPEED; // ~16.7s
const GLIDER_DEPLOY_HEIGHT = 55;
const GLIDER_FALL_SPEED = 12;
const FREEFALL_SPEED = 38;
const GLIDER_FOLD_HEIGHT = 25;

type DropState = "on-bus" | "gliding" | "freefalling" | "landed";

export default function BattleBus() {
  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 1500 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.7} color="#b0d0ff" />
        <directionalLight position={[80, 120, 60]} intensity={1.8} color="#fff8e0" />
        <hemisphereLight args={["#87ceeb", "#4a8a28", 0.6]} />
        <fogExp2 attach="fog" args={["#c8e8ff", 0.002]} />
        <Sky distance={1800} sunPosition={[80, 40, -60]} inclination={0.52} azimuth={0.28} turbidity={4} rayleigh={1.4} />
        <Stars radius={400} depth={60} count={1500} factor={4} fade />
        <Terrain />
        <BusScene />
      </Canvas>
      <DropUI />
    </div>
  );
}

function BusScene() {
  const { camera } = useThree();
  const busPos = useRef(BUS_START.clone());
  const busDir = useRef(BUS_END.clone().sub(BUS_START).normalize());
  const busTime = useRef(0);
  const dropState = useRef<DropState>("on-bus");
  const playerPos = useRef(BUS_START.clone().add(new THREE.Vector3(0, -2, 0)));
  const playerVel = useRef(new THREE.Vector3());
  const jumped = useRef(false);
  const yaw = useRef(Math.atan2(busDir.current.x, busDir.current.z));
  const pitch = useRef(-0.3);
  const mouseLocked = useRef(false);
  const busMeshRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const gliderRef = useRef<THREE.Group>(null);
  const setPhase = useGameStore((s) => s.setPhase);
  const busProgress = useRef(0);

  // Expose drop state and bus progress for UI
  useEffect(() => {
    (window as any).__dropState = dropState;
    (window as any).__busProgress = busProgress;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && dropState.current === "on-bus") {
        e.preventDefault();
        jumped.current = true;
        dropState.current = "gliding";
        playerPos.current.copy(busPos.current).add(new THREE.Vector3(0, -2, 0));
        playerVel.current.set(busDir.current.x * 8, 0, busDir.current.z * 8);
        (window as any).__dropStateVal = "gliding";
      }
    };
    const onMouse = (e: MouseEvent) => {
      if (!mouseLocked.current) return;
      yaw.current -= e.movementX * 0.003;
      pitch.current -= e.movementY * 0.003;
      pitch.current = Math.max(-1.2, Math.min(0.5, pitch.current));
    };
    const onPointerLock = () => { mouseLocked.current = !!document.pointerLockElement; };
    const canvas = document.querySelector("canvas");
    canvas?.addEventListener("click", () => canvas.requestPointerLock());

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", onMouse);
    document.addEventListener("pointerlockchange", onPointerLock);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("pointerlockchange", onPointerLock);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const state = dropState.current;

    // ── ON BUS ──
    if (state === "on-bus") {
      busTime.current += dt;
      busProgress.current = Math.min(1, busTime.current / BUS_TOTAL_TIME);
      busPos.current.lerpVectors(BUS_START, BUS_END, busProgress.current);
      playerPos.current.copy(busPos.current).add(new THREE.Vector3(0, -2, 0));

      // Auto-jump at end of route
      if (busProgress.current >= 1) {
        jumped.current = true;
        dropState.current = "gliding";
        playerVel.current.set(busDir.current.x * 6, 0, busDir.current.z * 6);
        (window as any).__dropStateVal = "gliding";
      }

      // Camera: slightly behind the bus, looking forward-down
      const behind = busDir.current.clone().multiplyScalar(-18);
      camera.position.copy(busPos.current).add(behind).add(new THREE.Vector3(0, 5, 0));
      camera.lookAt(busPos.current.clone().add(busDir.current.clone().multiplyScalar(10)));

      // Bus mesh
      if (busMeshRef.current) {
        busMeshRef.current.position.copy(busPos.current);
        busMeshRef.current.rotation.y = -yaw.current + Math.PI / 4;
      }
    }

    // ── GLIDING ──
    if (state === "gliding") {
      const th = getTerrainHeight(playerPos.current.x, playerPos.current.z);
      const speed = playerPos.current.y > GLIDER_FOLD_HEIGHT + th ? GLIDER_FALL_SPEED : FREEFALL_SPEED;
      const isFreefall = playerPos.current.y <= GLIDER_FOLD_HEIGHT + th;
      if (isFreefall && dropState.current === "gliding") {
        dropState.current = "freefalling";
        (window as any).__dropStateVal = "freefalling";
      }

      playerVel.current.y -= (isFreefall ? 30 : 8) * dt;
      playerPos.current.add(playerVel.current.clone().multiplyScalar(dt));

      // Slow horizontal drift
      playerVel.current.x *= 0.97;
      playerVel.current.z *= 0.97;

      // Glider sway
      if (gliderRef.current) {
        gliderRef.current.position.copy(playerPos.current).add(new THREE.Vector3(0, 1.5, 0));
        gliderRef.current.rotation.x = Math.sin(Date.now() * 0.002) * 0.08;
        gliderRef.current.visible = !isFreefall;
      }

      // Land check
      const terrainH = getTerrainHeight(playerPos.current.x, playerPos.current.z);
      if (playerPos.current.y <= terrainH + 1) {
        playerPos.current.y = terrainH + 1;
        dropState.current = "landed";
        (window as any).__dropStateVal = "landed";
        setTimeout(() => setPhase("playing"), 800);
      }

      // Camera: behind & above player
      const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
      const back = new THREE.Vector3(0, 0, 12).applyEuler(euler);
      camera.position.copy(playerPos.current).add(new THREE.Vector3(0, 3, 0)).add(back);
      camera.lookAt(playerPos.current);

      // Arrow key / WASD steering
    }

    // ── FREEFALLING ──
    if (state === "freefalling") {
      const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
      const back = new THREE.Vector3(0, 0, 8).applyEuler(euler);
      camera.position.copy(playerPos.current).add(new THREE.Vector3(0, 2, 0)).add(back);
      camera.lookAt(playerPos.current.clone().add(new THREE.Vector3(0, 0.5, 0)));

      // Steer
      const steerFwd = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
      const steerRgt = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
      if ((window as any).__keys) {
        const k = (window as any).__keys;
        if (k["w"]) playerVel.current.addScaledVector(steerFwd, 12 * dt);
        if (k["s"]) playerVel.current.addScaledVector(steerFwd, -8 * dt);
        if (k["a"]) playerVel.current.addScaledVector(steerRgt, -8 * dt);
        if (k["d"]) playerVel.current.addScaledVector(steerRgt, 8 * dt);
      }
    }

    (window as any).__dropStateVal = state;
    (window as any).__busProgress = busProgress.current;
  });

  // Key tracking
  useEffect(() => {
    (window as any).__keys = {};
    const dn = (e: KeyboardEvent) => { (window as any).__keys[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { (window as any).__keys[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  return (
    <>
      {/* Battle Bus mesh */}
      <group ref={busMeshRef}>
        <BusMesh />
        {/* Exhaust trail */}
        <pointLight color="#00aaff" intensity={2} distance={20} position={[0, 0, 0]} />
      </group>

      {/* Glider */}
      <group ref={gliderRef} visible={false}>
        <GliderMesh />
      </group>

      {/* Drop trajectory line */}
      <TrajectoryLine busStart={BUS_START} busEnd={BUS_END} />
    </>
  );
}

function BusMesh() {
  const t = useRef(0);
  const meshRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    t.current += delta;
    if (meshRef.current) meshRef.current.rotation.z = Math.sin(t.current * 0.8) * 0.04;
  });
  return (
    <group ref={meshRef}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[12, 5, 5]} />
        <meshLambertMaterial color="#1a88ff" />
      </mesh>
      {/* Top dome */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <cylinderGeometry args={[2.2, 3.5, 2.5, 16, 1, false]} />
        <meshLambertMaterial color="#2299ff" />
      </mesh>
      {/* Windows */}
      {[-3.5, -1, 1.5, 4].map((x, i) => (
        <mesh key={i} position={[x, 1, 2.6]} castShadow>
          <boxGeometry args={[2, 1.8, 0.1]} />
          <meshLambertMaterial color="#aaddff" emissive="#3388ff" emissiveIntensity={0.4} transparent opacity={0.85} />
        </mesh>
      ))}
      {/* Left wing */}
      <mesh position={[-5, -1.5, 0]} rotation={[0, 0, -0.15]} castShadow>
        <boxGeometry args={[4, 0.4, 10]} />
        <meshLambertMaterial color="#1166cc" />
      </mesh>
      {/* Right wing */}
      <mesh position={[5, -1.5, 0]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[4, 0.4, 10]} />
        <meshLambertMaterial color="#1166cc" />
      </mesh>
      {/* Propellers (front) */}
      {[-4, 4].map((x, i) => (
        <PropellerMesh key={i} x={x} />
      ))}
      {/* Rope / balloon string */}
      <mesh position={[0, 8, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 12, 4]} />
        <meshLambertMaterial color="#888" />
      </mesh>
      {/* Balloon */}
      <mesh position={[0, 18, 0]} castShadow>
        <sphereGeometry args={[6, 12, 10]} />
        <meshLambertMaterial color="#ff3300" emissive="#ff1100" emissiveIntensity={0.2} />
      </mesh>
      {/* APEX FORT text band */}
      <mesh position={[0, 0.8, 2.55]}>
        <boxGeometry args={[10, 1.2, 0.05]} />
        <meshLambertMaterial color="#ff8c00" emissive="#ff6600" emissiveIntensity={0.5} />
      </mesh>
      {/* Exhaust */}
      <pointLight color="#00aaff" intensity={1.5} distance={15} position={[-6, -1, 0]} />
    </group>
  );
}

function PropellerMesh({ x }: { x: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 15;
  });
  return (
    <mesh ref={ref} position={[x, -2, 0]} castShadow>
      <boxGeometry args={[0.3, 0.3, 5]} />
      <meshLambertMaterial color="#aaa" />
    </mesh>
  );
}

function GliderMesh() {
  const t = useRef(0);
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    t.current += delta;
    if (ref.current) {
      ref.current.rotation.z = Math.sin(t.current * 1.5) * 0.06;
    }
  });
  return (
    <group ref={ref}>
      {/* Glider canopy */}
      {[-2.5, 0, 2.5].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 0.15, 1.8]} />
          <meshLambertMaterial color={["#ff3300","#ff8c00","#ffdd00"][i]} />
        </mesh>
      ))}
      {/* Strings */}
      {[-2, 0, 2].map((x, i) => (
        <mesh key={i} position={[x, -0.8, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 4]} />
          <meshLambertMaterial color="#ccc" />
        </mesh>
      ))}
      {/* Player silhouette */}
      <mesh position={[0, -2.2, 0]} castShadow>
        <capsuleGeometry args={[0.35, 1.2, 4, 8]} />
        <meshLambertMaterial color="#4488ff" />
      </mesh>
    </group>
  );
}

function TrajectoryLine({ busStart, busEnd }: { busStart: THREE.Vector3; busEnd: THREE.Vector3 }) {
  const points = [
    busStart.clone().add(new THREE.Vector3(0, 2, 0)),
    busEnd.clone().add(new THREE.Vector3(0, 2, 0)),
  ];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line>
      <primitive object={geom} />
      <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </line>
  );
}

/* ── DROP UI OVERLAY ── */
function DropUI() {
  const [dropState, setDropStateLocal] = useState<string>("on-bus");
  const [busProgress, setBusProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDropStateLocal((window as any).__dropStateVal ?? "on-bus");
      setBusProgress((window as any).__busProgress ?? 0);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Bus route progress bar */}
      {dropState === "on-bus" && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 340, textAlign: "center" }}>
          <div style={{ color: "#fff", fontSize: 11, letterSpacing: 3, fontWeight: 800, textTransform: "uppercase", marginBottom: 5, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
            BATTLE BUS ROUTE
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ width: `${busProgress * 100}%`, height: "100%", background: "linear-gradient(90deg, #00d4ff, #0088ff)", transition: "width 0.1s" }} />
          </div>
          {/* Bus icon along the bar */}
          <div style={{ position: "absolute", top: 22, left: `${busProgress * 100}%`, transform: "translateX(-50%)", fontSize: 14, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}>🚌</div>
        </div>
      )}

      {/* Jump prompt */}
      {dropState === "on-bus" && (
        <div style={{ position: "absolute", bottom: "30%", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ animation: "pulse-ring 1.5s infinite" }}>
            <div style={{
              background: "rgba(0,0,0,0.75)", border: "2px solid rgba(255,255,255,0.5)",
              borderRadius: 10, padding: "14px 32px",
            }}>
              <div style={{ color: "#fff", fontSize: 11, letterSpacing: 4, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>JUMP FROM BUS</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <kbd style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)", borderRadius: 5, padding: "5px 18px", color: "#fff", fontSize: 16, fontWeight: 900 }}>SPACE</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gliding UI */}
      {(dropState === "gliding" || dropState === "freefalling") && (
        <>
          {/* Altitude indicator */}
          <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, letterSpacing: 2, fontWeight: 700 }}>ALT</div>
            <div style={{ width: 6, height: 160, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
              <AltitudeBar />
            </div>
          </div>

          {/* Glider status */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
            {dropState === "gliding" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, animation: "glider-drop 0.8s infinite ease-in-out" }}>🪂</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, letterSpacing: 3, marginTop: 4 }}>GLIDING</div>
              </div>
            )}
            {dropState === "freefalling" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, animation: "float-up 0.5s infinite" }}>💨</div>
                <div style={{ color: "#ff8c00", fontSize: 10, letterSpacing: 3, fontWeight: 900, marginTop: 4 }}>FREE FALL</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Landing flash */}
      {dropState === "landed" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(255,255,255,0.7)",
          animation: "landing-impact 0.8s forwards",
        }} />
      )}

      {/* Controls hint */}
      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 1, textAlign: "center" }}>
        {dropState === "on-bus" ? "Ride the bus across the island — press SPACE to jump anytime" : "WASD to steer · Mouse to look"}
      </div>
    </div>
  );
}

function AltitudeBar() {
  const [alt, setAlt] = useState(75);
  useEffect(() => {
    const iv = setInterval(() => {
      const state = (window as any).__dropStateVal;
      if (state === "gliding" || state === "freefalling") {
        setAlt((a) => Math.max(0, a - 0.8));
      }
    }, 80);
    return () => clearInterval(iv);
  }, []);
  const pct = Math.min(100, (alt / 80) * 100);
  const color = pct > 50 ? "#00ff88" : pct > 20 ? "#ffdd00" : "#ff4444";
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${pct}%`, background: color, transition: "height 0.1s, background 0.3s" }} />
  );
}
