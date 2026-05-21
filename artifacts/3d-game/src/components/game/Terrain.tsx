import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VehicleState } from "../../types/game";

const TERRAIN_SIZE = 240;
const GRID = 48;

function generateHeights() {
  const h: number[][] = [];
  for (let i = 0; i <= GRID; i++) {
    h[i] = [];
    for (let j = 0; j <= GRID; j++) {
      const nx = (i / GRID - 0.5) * 2;
      const nz = (j / GRID - 0.5) * 2;
      const dist = Math.sqrt(nx * nx + nz * nz);
      const val =
        Math.sin(nx * 3.2) * 2 +
        Math.cos(nz * 2.8) * 2.5 +
        Math.sin(nx * 7 + nz * 5) * 0.9 +
        Math.cos(nx * 2.1 - nz * 3.5) * 1.5 +
        Math.sin(nx * 12 + nz * 9) * 0.4 -
        dist * 2.5;
      h[i][j] = Math.max(-0.8, val);
    }
  }
  return h;
}

export function getTerrainHeight(x: number, z: number): number {
  const nx = (x / TERRAIN_SIZE + 0.5) * GRID;
  const nz = (z / TERRAIN_SIZE + 0.5) * GRID;
  const ix = Math.floor(Math.min(Math.max(nx, 0), GRID - 1));
  const iz = Math.floor(Math.min(Math.max(nz, 0), GRID - 1));
  const fx = nx - ix;
  const fz = nz - iz;
  const h00 = heights[ix]?.[iz] ?? 0;
  const h10 = heights[Math.min(ix + 1, GRID)]?.[iz] ?? 0;
  const h01 = heights[ix]?.[Math.min(iz + 1, GRID)] ?? 0;
  const h11 = heights[Math.min(ix + 1, GRID)]?.[Math.min(iz + 1, GRID)] ?? 0;
  return h00 * (1 - fx) * (1 - fz) + h10 * fx * (1 - fz) + h01 * (1 - fx) * fz + h11 * fx * fz;
}

const heights = generateHeights();

export const POI_ZONES = [
  { name: "Tilted Towers", x: 0, z: 0, radius: 30 },
  { name: "Loot Lake", x: -40, z: -30, radius: 25 },
  { name: "Retail Row", x: 45, z: 35, radius: 20 },
  { name: "Pleasant Park", x: -55, z: 40, radius: 22 },
  { name: "Dusty Depot", x: 40, z: -50, radius: 18 },
  { name: "Fatal Fields", x: -20, z: 65, radius: 20 },
  { name: "Salty Springs", x: 25, z: -20, radius: 16 },
  { name: "Snobby Shores", x: -70, z: 10, radius: 18 },
];

export function getLocationName(x: number, z: number): string {
  for (const poi of POI_ZONES) {
    const dx = x - poi.x;
    const dz = z - poi.z;
    if (Math.sqrt(dx * dx + dz * dz) < poi.radius) return poi.name;
  }
  return "The Island";
}

// Vehicle spawn positions — accessible globally for Player.tsx
export const VEHICLE_SPAWNS: VehicleState[] = [
  { id: "car1",   type: "car",   x: 14,  z: 8,   yaw: 0.4,  health: 400, occupied: false, speed: 0 },
  { id: "car2",   type: "car",   x: -32, z: 12,  yaw: -0.8, health: 400, occupied: false, speed: 0 },
  { id: "car3",   type: "car",   x: -42, z: 28,  yaw: 1.2,  health: 400, occupied: false, speed: 0 },
  { id: "truck1", type: "truck", x: 36,  z: -46, yaw: 0.2,  health: 600, occupied: false, speed: 0 },
  { id: "truck2", type: "truck", x: -8,  z: 62,  yaw: -1.0, health: 600, occupied: false, speed: 0 },
  { id: "bike1",  type: "bike",  x: -12, z: -22, yaw: 0.6,  health: 200, occupied: false, speed: 0 },
  { id: "bike2",  type: "bike",  x: 44,  z: 22,  yaw: -0.3, health: 200, occupied: false, speed: 0 },
  { id: "bike3",  type: "bike",  x: 22,  z: -55, yaw: 1.8,  health: 200, occupied: false, speed: 0 },
];

// Global vehicle state — updated by Player.tsx
if (!(window as any).__vehicleStates) {
  (window as any).__vehicleStates = VEHICLE_SPAWNS.map(v => ({ ...v }));
}

export default function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, GRID, GRID);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i <= GRID; i++) {
      for (let j = 0; j <= GRID; j++) {
        pos.setY(i * (GRID + 1) + j, heights[i]?.[j] ?? 0);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <>
      {/* Terrain — vibrant green like reference screenshots */}
      <mesh geometry={geometry} receiveShadow>
        <meshLambertMaterial color="#5aaa2a" />
      </mesh>

      {/* Open ocean */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TERRAIN_SIZE * 1.6, TERRAIN_SIZE * 1.6]} />
        <meshLambertMaterial color="#1a6a9a" transparent opacity={0.88} />
      </mesh>

      {/* Loot Lake */}
      <mesh position={[-40, 0.1, -30]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.65, 1]}>
        <circleGeometry args={[16, 24]} />
        <meshLambertMaterial color="#1a88cc" transparent opacity={0.9} />
      </mesh>

      {/* Roads */}
      <Road x1={-120} z1={0} x2={120} z2={0} />
      <Road x1={0} z1={-120} x2={0} z2={120} />
      <Road x1={-60} z1={-60} x2={60} z2={60} />
      <Road x1={60} z1={-60} x2={-60} z2={60} />
      <Road x1={-20} z1={65} x2={20} z2={0} />
      <Road x1={40} z1={-50} x2={0} z2={-20} />

      {/* POI buildings */}
      <TiltedTowers />
      <RetailRow />
      <PleasantPark />
      <DustyDepot />
      <FatalFields />
      <SaltySprings />

      {/* Trees */}
      {TREE_POSITIONS.map((t, i) => (
        <Tree key={i} x={t[0]} z={t[1]} scale={t[2]} variant={t[3]} />
      ))}

      {/* Rocks */}
      {ROCK_POSITIONS.map((r, i) => (
        <Rock key={i} x={r[0]} z={r[1]} scale={r[2]} />
      ))}

      {/* Bushes */}
      {BUSH_POSITIONS.map((b, i) => (
        <Bush key={i} x={b[0]} z={b[1]} />
      ))}

      {/* Haybales */}
      {([[55, 30], [-25, -40], [30, 55], [-50, -55]] as [number, number][]).map(([x, z], i) => (
        <Haybale key={i} x={x} z={z} />
      ))}

      {/* Cliffs */}
      <Cliff x={-70} z={-50} />
      <Cliff x={60} z={40} />

      {/* ── VEHICLES ── */}
      <Vehicles />
    </>
  );
}

/* ── VEHICLES RENDERER ── */
function Vehicles() {
  const groupRefs = useRef<(THREE.Group | null)[]>(
    VEHICLE_SPAWNS.map(() => null)
  );

  useFrame(() => {
    const states: VehicleState[] = (window as any).__vehicleStates ?? [];
    states.forEach((v, i) => {
      const g = groupRefs.current[i];
      if (!g) return;
      const y = getTerrainHeight(v.x, v.z);
      g.position.set(v.x, y, v.z);
      g.rotation.y = v.yaw;
    });
  });

  return (
    <group>
      {VEHICLE_SPAWNS.map((spawn, i) => {
        const y = getTerrainHeight(spawn.x, spawn.z);
        return (
          <group
            key={spawn.id}
            ref={el => { groupRefs.current[i] = el; }}
            position={[spawn.x, y, spawn.z]}
            rotation={[0, spawn.yaw, 0]}
          >
            {spawn.type === "car" && <CarMesh color={CAR_COLORS[i % CAR_COLORS.length]} />}
            {spawn.type === "truck" && <TruckMesh />}
            {spawn.type === "bike" && <BikeMesh />}

            {/* Enter hint — small "E" marker above vehicle */}
            <mesh position={[0, spawn.type === "truck" ? 4 : 2.8, 0]}>
              <sphereGeometry args={[0.25, 6, 6]} />
              <meshLambertMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

const CAR_COLORS = ["#2255cc", "#cc3322", "#22aa44", "#cc8811", "#8822cc"];

/* ── CAR MESH ── (matches the blue car in IMG_5042) */
function CarMesh({ color = "#2255cc" }: { color?: string }) {
  return (
    <group>
      {/* Main body */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.9, 2.0]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Cab / upper body */}
      <mesh position={[0.1, 1.28, 0]} castShadow>
        <boxGeometry args={[2.3, 0.85, 1.8]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Windshield front */}
      <mesh position={[1.1, 1.32, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.05, 0.75, 1.6]} />
        <meshLambertMaterial color="#88ccee" transparent opacity={0.6} />
      </mesh>
      {/* Windshield rear */}
      <mesh position={[-1.0, 1.32, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.05, 0.75, 1.6]} />
        <meshLambertMaterial color="#88ccee" transparent opacity={0.6} />
      </mesh>
      {/* Bumpers */}
      <mesh position={[2.18, 0.45, 0]} castShadow>
        <boxGeometry args={[0.18, 0.35, 2.1]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      <mesh position={[-2.18, 0.45, 0]} castShadow>
        <boxGeometry args={[0.18, 0.35, 2.1]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      {/* Headlights */}
      <mesh position={[2.12, 0.6, 0.65]}>
        <boxGeometry args={[0.1, 0.22, 0.4]} />
        <meshLambertMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[2.12, 0.6, -0.65]}>
        <boxGeometry args={[0.1, 0.22, 0.4]} />
        <meshLambertMaterial color="#ffffcc" emissive="#ffff88" emissiveIntensity={0.8} />
      </mesh>
      {/* Taillights */}
      <mesh position={[-2.12, 0.6, 0.65]}>
        <boxGeometry args={[0.1, 0.22, 0.4]} />
        <meshLambertMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-2.12, 0.6, -0.65]}>
        <boxGeometry args={[0.1, 0.22, 0.4]} />
        <meshLambertMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={0.6} />
      </mesh>
      {/* Wheels — 4 cylinders */}
      {([
        [1.4,  0, 1.1],
        [1.4,  0, -1.1],
        [-1.4, 0, 1.1],
        [-1.4, 0, -1.1],
      ] as [number, number, number][]).map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.44, 0.44, 0.26, 12]} />
            <meshLambertMaterial color="#111" />
          </mesh>
          {/* Rim */}
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.28, 8]} />
            <meshLambertMaterial color="#888" />
          </mesh>
        </group>
      ))}
      {/* Side mirrors */}
      <mesh position={[0.8, 1.1, 1.08]}>
        <boxGeometry args={[0.3, 0.12, 0.15]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0.8, 1.1, -1.08]}>
        <boxGeometry args={[0.3, 0.12, 0.15]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

/* ── TRUCK MESH ── */
function TruckMesh() {
  return (
    <group>
      {/* Cargo bed */}
      <mesh position={[-1.2, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 1.0, 2.4]} />
        <meshLambertMaterial color="#776644" />
      </mesh>
      {/* Cab */}
      <mesh position={[1.8, 0.9, 0]} castShadow>
        <boxGeometry args={[1.8, 1.5, 2.2]} />
        <meshLambertMaterial color="#886633" />
      </mesh>
      {/* Cab roof */}
      <mesh position={[1.8, 1.78, 0]} castShadow>
        <boxGeometry args={[1.6, 0.22, 2.0]} />
        <meshLambertMaterial color="#775522" />
      </mesh>
      {/* Windshield */}
      <mesh position={[2.68, 1.0, 0]}>
        <boxGeometry args={[0.06, 1.0, 1.9]} />
        <meshLambertMaterial color="#88ccee" transparent opacity={0.6} />
      </mesh>
      {/* Cargo walls */}
      {[
        [0.05, 1.55, 1.25, 3.7, 1.6, 0.1],
        [0.05, 1.55, -1.25, 3.7, 1.6, 0.1],
        [-2.9, 1.55, 0, 0.12, 1.6, 2.5],
      ].map(([cx, cy, cz, cw, ch, cd], i) => (
        <mesh key={i} position={[cx, cy, cz]} castShadow>
          <boxGeometry args={[cw, ch, cd]} />
          <meshLambertMaterial color="#887755" />
        </mesh>
      ))}
      {/* 6 wheels */}
      {([
        [1.8, 0, 1.25],
        [1.8, 0, -1.25],
        [-0.5, 0, 1.25],
        [-0.5, 0, -1.25],
        [-2.1, 0, 1.25],
        [-2.1, 0, -1.25],
      ] as [number, number, number][]).map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.52, 0.52, 0.3, 12]} />
            <meshLambertMaterial color="#111" />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.32, 0.32, 0.32, 8]} />
            <meshLambertMaterial color="#777" />
          </mesh>
        </group>
      ))}
      {/* Exhaust pipe */}
      <mesh position={[-2.8, 1.5, -1.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 6]} />
        <meshLambertMaterial color="#555" />
      </mesh>
    </group>
  );
}

/* ── BIKE MESH ── */
function BikeMesh() {
  return (
    <group>
      {/* Main frame */}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0.15]} castShadow>
        <boxGeometry args={[1.6, 0.12, 0.2]} />
        <meshLambertMaterial color="#cc4400" />
      </mesh>
      {/* Seat */}
      <mesh position={[-0.35, 1.05, 0]} castShadow>
        <boxGeometry args={[0.7, 0.12, 0.38]} />
        <meshLambertMaterial color="#111" />
      </mesh>
      {/* Fuel tank */}
      <mesh position={[0.15, 1.0, 0]} castShadow>
        <boxGeometry args={[0.55, 0.3, 0.3]} />
        <meshLambertMaterial color="#cc4400" />
      </mesh>
      {/* Handlebars */}
      <mesh position={[0.75, 1.12, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.7]} />
        <meshLambertMaterial color="#777" />
      </mesh>
      {/* Front fork */}
      <mesh position={[0.78, 0.7, 0]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshLambertMaterial color="#888" />
      </mesh>
      {/* Engine block */}
      <mesh position={[0.1, 0.72, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.35]} />
        <meshLambertMaterial color="#555" />
      </mesh>
      {/* Exhaust */}
      <mesh position={[0.0, 0.55, -0.25]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.04, 1.0, 6]} />
        <meshLambertMaterial color="#888" />
      </mesh>
      {/* 2 wheels */}
      {([
        [0.85, 0, 0],
        [-0.75, 0, 0],
      ] as [number, number, number][]).map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.48, 0.48, 0.16, 14]} />
            <meshLambertMaterial color="#111" />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.28, 0.28, 0.18, 8]} />
            <meshLambertMaterial color="#666" />
          </mesh>
          {/* Spokes */}
          {[0, 1, 2, 3].map(s => (
            <mesh key={s} rotation={[0, s * Math.PI / 4, 0]}>
              <boxGeometry args={[0.04, 0.19, 0.56]} />
              <meshLambertMaterial color="#888" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Road({ x1, z1, x2, z2 }: { x1: number; z1: number; x2: number; z2: number }) {
  const dx = x2 - x1; const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const cx = (x1 + x2) / 2; const cz = (z1 + z2) / 2;
  const y = getTerrainHeight(cx, cz) + 0.05;
  return (
    <group>
      <mesh position={[cx, y, cz]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
        <planeGeometry args={[len, 7]} />
        <meshLambertMaterial color="#5a5248" />
      </mesh>
      {/* Road markings */}
      <mesh position={[cx, y + 0.01, cz]} rotation={[-Math.PI / 2, 0, -angle]}>
        <planeGeometry args={[len, 0.3]} />
        <meshLambertMaterial color="#e0d060" />
      </mesh>
    </group>
  );
}

/* ── POI BUILDINGS ── (styled like IMG_5047 — real barn/houses) */
function TiltedTowers() {
  const buildings = [
    { x: -8, z: -8, w: 10, d: 10, h: 14 },
    { x: 4, z: -4, w: 7, d: 9, h: 18 },
    { x: -4, z: 8, w: 8, d: 6, h: 10 },
    { x: 8, z: 6, w: 6, d: 8, h: 22 },
    { x: 0, z: -12, w: 9, d: 7, h: 8 },
  ];
  return (
    <group>
      {buildings.map((b, i) => {
        const y = getTerrainHeight(b.x, b.z);
        return (
          <group key={i} position={[b.x, y, b.z]}>
            <mesh castShadow receiveShadow position={[0, b.h / 2, 0]}>
              <boxGeometry args={[b.w, b.h, b.d]} />
              <meshLambertMaterial color={i % 2 === 0 ? "#c4aa88" : "#a89878"} />
            </mesh>
            {/* Windows */}
            {Array.from({ length: Math.floor(b.h / 3) }, (_, row) =>
              [-b.d / 2 - 0.01].map((zOff, wi) => (
                <mesh key={`w_${row}_${wi}`} position={[0, 2 + row * 3, zOff]}>
                  <boxGeometry args={[b.w * 0.5, 1.4, 0.05]} />
                  <meshLambertMaterial color="#88aacc" emissive="#4466aa" emissiveIntensity={0.25} transparent opacity={0.8} />
                </mesh>
              ))
            )}
            {/* Flat roof edge */}
            <mesh position={[0, b.h + 0.2, 0]}>
              <boxGeometry args={[b.w + 0.4, 0.4, b.d + 0.4]} />
              <meshLambertMaterial color="#888878" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function RetailRow() {
  const shops = [
    { x: 42, z: 30, w: 10, d: 8, h: 6 },
    { x: 52, z: 30, w: 10, d: 8, h: 7 },
    { x: 42, z: 40, w: 10, d: 8, h: 6 },
    { x: 52, z: 40, w: 10, d: 8, h: 6 },
  ];
  return (
    <group>
      {shops.map((s, i) => {
        const y = getTerrainHeight(s.x, s.z);
        return (
          <group key={i} position={[s.x, y, s.z]}>
            <mesh castShadow receiveShadow position={[0, s.h / 2, 0]}>
              <boxGeometry args={[s.w, s.h, s.d]} />
              <meshLambertMaterial color={["#c88044", "#b06030", "#c07840", "#906020"][i % 4]} />
            </mesh>
            {/* Storefront windows */}
            <mesh position={[0, s.h * 0.35, -s.d / 2 - 0.05]}>
              <boxGeometry args={[s.w * 0.65, s.h * 0.5, 0.1]} />
              <meshLambertMaterial color="#88ccdd" transparent opacity={0.7} emissive="#334466" emissiveIntensity={0.15} />
            </mesh>
            {/* Sign */}
            <mesh position={[0, s.h + 0.5, -s.d / 2 - 0.1]} castShadow>
              <boxGeometry args={[s.w * 0.7, 1, 0.1]} />
              <meshLambertMaterial color={["#cc2222","#2244cc","#22aa44","#cc8800"][i]} />
            </mesh>
            {/* Flat roof */}
            <mesh position={[0, s.h + 0.18, 0]}>
              <boxGeometry args={[s.w + 0.3, 0.35, s.d + 0.3]} />
              <meshLambertMaterial color="#888" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function PleasantPark() {
  const houses = [
    { x: -52, z: 37, w: 9, d: 8, h: 5 },
    { x: -62, z: 37, w: 8, d: 7, h: 5 },
    { x: -58, z: 47, w: 8, d: 8, h: 6 },
    { x: -48, z: 44, w: 7, d: 7, h: 5 },
  ];
  return (
    <group>
      {houses.map((h, i) => {
        const y = getTerrainHeight(h.x, h.z);
        return (
          <group key={i} position={[h.x, y, h.z]}>
            {/* Walls */}
            <mesh castShadow receiveShadow position={[0, h.h / 2, 0]}>
              <boxGeometry args={[h.w, h.h, h.d]} />
              <meshLambertMaterial color={["#e4c8a0", "#d4b488", "#f0d8b0", "#c8a878"][i % 4]} />
            </mesh>
            {/* Pitched roof */}
            <mesh castShadow position={[0, h.h + 1.2, 0]}>
              <coneGeometry args={[Math.max(h.w, h.d) * 0.76, 2.6, 4]} />
              <meshLambertMaterial color="#8a4020" />
            </mesh>
            {/* Door */}
            <mesh position={[0, 1.1, -h.d / 2 - 0.06]}>
              <boxGeometry args={[1.0, 2.2, 0.12]} />
              <meshLambertMaterial color="#6a3a18" />
            </mesh>
            {/* Side window */}
            <mesh position={[h.w / 2 + 0.06, h.h * 0.55, 0]}>
              <boxGeometry args={[0.12, 1.1, 1.2]} />
              <meshLambertMaterial color="#88aacc" transparent opacity={0.75} />
            </mesh>
          </group>
        );
      })}
      {/* Park grass disc */}
      <mesh position={[-55, getTerrainHeight(-55, 42) + 0.02, 42]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 12]} />
        <meshLambertMaterial color="#66bb33" />
      </mesh>
    </group>
  );
}

/* Large wooden barn + smaller depot — matches IMG_5047 barn */
function DustyDepot() {
  const y = getTerrainHeight(40, -50);
  return (
    <group position={[40, y, -50]}>
      {/* Main barn body */}
      <mesh castShadow receiveShadow position={[0, 5, 0]}>
        <boxGeometry args={[22, 10, 14]} />
        <meshLambertMaterial color="#8a7055" />
      </mesh>
      {/* Barn roof arch (cylindrical) */}
      <mesh position={[0, 10.8, 0]}>
        <cylinderGeometry args={[8, 8, 22, 16, 1, true]} />
        <meshLambertMaterial color="#7a6045" side={THREE.DoubleSide} />
      </mesh>
      {/* Barn doors (large, dark) */}
      <mesh position={[0, 4.5, -7.1]} castShadow>
        <boxGeometry args={[8, 9, 0.25]} />
        <meshLambertMaterial color="#4a3020" />
      </mesh>
      {/* Barn side windows (large open frames) */}
      {[-5, 5].map((xOff, i) => (
        <mesh key={i} position={[xOff, 6.5, -7.12]}>
          <boxGeometry args={[2.5, 2.5, 0.1]} />
          <meshLambertMaterial color="#1a1008" />
        </mesh>
      ))}
      {/* Smaller shed */}
      <mesh castShadow receiveShadow position={[16, 3, -3]}>
        <boxGeometry args={[8, 6, 10]} />
        <meshLambertMaterial color="#998870" />
      </mesh>
      <mesh position={[16, 6.4, -3]}>
        <boxGeometry args={[8.4, 0.8, 10.4]} />
        <meshLambertMaterial color="#887755" />
      </mesh>
      {/* Trash cans near barn */}
      {[-6, -4, -2].map((xo, i) => (
        <mesh key={i} position={[xo, 0.8, -8]} castShadow>
          <cylinderGeometry args={[0.35, 0.3, 1.6, 8]} />
          <meshLambertMaterial color="#556644" />
        </mesh>
      ))}
    </group>
  );
}

/* Fatal Fields — farmland matching open grassy areas in screenshots */
function FatalFields() {
  const y = getTerrainHeight(-20, 65);
  return (
    <group position={[-20, y, 65]}>
      {/* Main farmhouse */}
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <boxGeometry args={[11, 6, 9]} />
        <meshLambertMaterial color="#e0c898" />
      </mesh>
      <mesh castShadow position={[0, 6.8, 0]}>
        <coneGeometry args={[8, 3.5, 4]} />
        <meshLambertMaterial color="#8a3a18" />
      </mesh>
      {/* Silo */}
      <mesh position={[9, 4, 3]} castShadow>
        <cylinderGeometry args={[1.6, 1.6, 8, 10]} />
        <meshLambertMaterial color="#d8c090" />
      </mesh>
      <mesh position={[9, 8.3, 3]}>
        <coneGeometry args={[1.9, 2.2, 10]} />
        <meshLambertMaterial color="#777" />
      </mesh>
      {/* Fence posts */}
      {[-8, -4, 0, 4, 8].map((xo, i) => (
        <mesh key={i} position={[xo, 0.8, 7]} castShadow>
          <boxGeometry args={[0.18, 1.6, 0.18]} />
          <meshLambertMaterial color="#8a6030" />
        </mesh>
      ))}
      {/* Fence rail */}
      <mesh position={[0, 1.35, 7]}>
        <boxGeometry args={[17, 0.14, 0.14]} />
        <meshLambertMaterial color="#8a6030" />
      </mesh>
    </group>
  );
}

/* Salty Springs — suburban area */
function SaltySprings() {
  const house = { x: 25, z: -22, w: 8, d: 8, h: 5 };
  const y = getTerrainHeight(house.x, house.z);
  return (
    <group position={[house.x, y, house.z]}>
      <mesh castShadow receiveShadow position={[0, house.h / 2, 0]}>
        <boxGeometry args={[house.w, house.h, house.d]} />
        <meshLambertMaterial color="#ddeeff" />
      </mesh>
      <mesh castShadow position={[0, house.h + 1.3, 0]}>
        <coneGeometry args={[6.5, 2.8, 4]} />
        <meshLambertMaterial color="#446688" />
      </mesh>
      {/* Porch */}
      <mesh position={[0, 0.25, house.d / 2 + 1.5]} receiveShadow>
        <boxGeometry args={[house.w, 0.4, 2.8]} />
        <meshLambertMaterial color="#ccbbaa" />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.2, house.d / 2 + 0.05]}>
        <boxGeometry args={[1.1, 2.4, 0.12]} />
        <meshLambertMaterial color="#5a7a4a" />
      </mesh>
    </group>
  );
}

function Tree({ x, z, scale, variant = 0 }: { x: number; z: number; scale: number; variant?: number }) {
  const y = getTerrainHeight(x, z);
  const treeColor = variant === 0 ? "#2a6618" : variant === 1 ? "#387820" : "#4d9030";
  return (
    <group position={[x, y, z]}>
      {variant === 2 ? (
        // Round canopy (like in IMG_5042 and IMG_5045)
        <>
          <mesh position={[0, scale * 2.2, 0]} castShadow>
            <sphereGeometry args={[scale * 1.05, 8, 6]} />
            <meshLambertMaterial color="#3a8a1a" />
          </mesh>
          <mesh position={[0, scale * 1.4, 0]} castShadow>
            <sphereGeometry args={[scale * 0.75, 7, 5]} />
            <meshLambertMaterial color="#328018" />
          </mesh>
        </>
      ) : (
        // Pine/conical tree
        <>
          <mesh position={[0, scale * 1.8, 0]} castShadow>
            <coneGeometry args={[scale * 0.8, scale * 3.0, 7]} />
            <meshLambertMaterial color={treeColor} />
          </mesh>
          <mesh position={[0, scale * 2.9, 0]} castShadow>
            <coneGeometry args={[scale * 0.58, scale * 2.2, 6]} />
            <meshLambertMaterial color={treeColor} />
          </mesh>
          <mesh position={[0, scale * 3.7, 0]} castShadow>
            <coneGeometry args={[scale * 0.36, scale * 1.5, 5]} />
            <meshLambertMaterial color={treeColor} />
          </mesh>
        </>
      )}
      <mesh position={[0, scale * 0.45, 0]} castShadow>
        <cylinderGeometry args={[scale * 0.13, scale * 0.2, scale * 0.9, 5]} />
        <meshLambertMaterial color="#6a4020" />
      </mesh>
    </group>
  );
}

function Rock({ x, z, scale }: { x: number; z: number; scale: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <mesh position={[x, y + scale * 0.3, z]} castShadow>
      <dodecahedronGeometry args={[scale * 0.65, 0]} />
      <meshLambertMaterial color="#8a8880" />
    </mesh>
  );
}

function Bush({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.85, 6, 5]} />
        <meshLambertMaterial color="#3a8020" />
      </mesh>
      <mesh position={[0.5, 0.4, 0.3]} castShadow>
        <sphereGeometry args={[0.55, 5, 4]} />
        <meshLambertMaterial color="#448822" />
      </mesh>
    </group>
  );
}

function Haybale({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <mesh position={[x, y + 1, z]} castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[1.2, 1.2, 2.5, 8]} />
      <meshLambertMaterial color="#d4b050" />
    </mesh>
  );
}

function Cliff({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <group position={[x, y, z]}>
      {[0, 1, 2].map(i => (
        <mesh key={i} castShadow position={[i * 3 - 3, i * 1.5 + 2, i * 1.5]} receiveShadow>
          <boxGeometry args={[5, 3 + i, 3]} />
          <meshLambertMaterial color="#8a8070" />
        </mesh>
      ))}
    </group>
  );
}

const TREE_POSITIONS: [number, number, number, number][] = [
  [-62,-42,1.4,0],[-57,-36,1.1,1],[-67,-31,1.6,0],[-52,-52,1.2,2],
  [62,42,1.5,1],[67,37,1.0,0],[57,47,1.8,2],[72,32,1.3,2],
  [-62,42,1.2,0],[-57,52,1.5,1],[-72,37,1.0,2],[-47,57,1.7,0],
  [62,-42,1.4,1],[67,-52,1.1,0],[57,-37,1.6,2],[72,-47,1.2,0],
  [22,-72,1.3,0],[27,-67,1.5,1],[17,-77,1.0,0],[32,-62,1.7,2],
  [-22,72,1.2,0],[-27,67,1.4,1],[-17,77,1.6,0],[-32,62,1.1,2],
  [-82,2,1.6,0],[-87,7,1.3,1],[-77,-7,1.1,0],[-92,12,1.8,2],
  [82,2,1.4,1],[87,7,1.2,0],[77,-7,1.5,2],[92,-12,1.0,0],
  [37,57,1.3,0],[47,62,1.6,1],[32,67,1.1,2],[52,52,1.4,2],
  [-37,-57,1.2,1],[-47,-62,1.5,0],[-32,-67,1.0,2],[-52,-52,1.7,0],
  [15,80,1.3,2],[-15,85,1.5,0],[25,75,1.1,1],[-25,-80,1.4,0],
  [70,-20,1.2,2],[-70,20,1.5,1],[75,10,1.0,0],[-75,-10,1.3,2],
  // Extra trees for denser world
  [-30,20,1.1,2],[10,-35,1.3,0],[50,-20,1.4,1],[-5,50,1.2,2],
  [30,-70,1.3,0],[-60,-10,1.5,1],[20,35,1.1,2],[-35,-5,1.4,0],
];

const ROCK_POSITIONS: [number, number, number][] = [
  [-18,12,2.2],[-8,-32,1.8],[28,-18,2.5],
  [47,-12,1.6],[-12,-32,2.0],[27,37,1.7],
  [-42,-22,2.3],[17,47,1.9],[-7,-47,2.1],
  [55,-8,1.5],[-55,8,2.4],[30,-45,1.8],
  [-35,30,2.0],[45,20,1.7],[-20,50,1.5],
  [15,-60,1.8],[-50,55,2.0],[60,-30,1.6],
];

const BUSH_POSITIONS: [number, number][] = [
  [5,15],[-10,8],[20,-8],[-15,22],[8,-20],
  [18,12],[-22,-5],[12,28],[-8,35],[25,-15],
  [-30,5],[35,18],[-18,-28],[28,8],[-5,40],
  [40,5],[-40,35],[15,-45],[-25,10],[50,30],
];
