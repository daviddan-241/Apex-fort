import { useMemo } from "react";
import * as THREE from "three";
import { useGameStore } from "../../store/gameStore";

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

// Named POI zones
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
      <mesh geometry={geometry} receiveShadow>
        <meshLambertMaterial color="#4a8a28" />
      </mesh>

      {/* Water */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TERRAIN_SIZE * 1.6, TERRAIN_SIZE * 1.6]} />
        <meshLambertMaterial color="#1a5a80" transparent opacity={0.88} />
      </mesh>

      {/* Loot lake water */}
      <mesh position={[-40, 0.1, -30]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.65, 1]}>
        <circleGeometry args={[16, 24]} />
        <meshLambertMaterial color="#2266aa" transparent opacity={0.9} />
      </mesh>

      {/* Roads network */}
      <Road x1={-120} z1={0} x2={120} z2={0} />
      <Road x1={0} z1={-120} x2={0} z2={120} />
      <Road x1={-60} z1={-60} x2={60} z2={60} />
      <Road x1={60} z1={-60} x2={-60} z2={60} />

      {/* POI buildings */}
      <TiltedTowers />
      <RetailRow />
      <PleasantPark />
      <DustyDepot />

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
      {[[55, 30], [-25, -40], [30, 55], [-50, -55]].map(([x, z], i) => (
        <Haybale key={i} x={x} z={z} />
      ))}

      {/* Cliffs */}
      <Cliff x={-70} z={-50} />
      <Cliff x={60} z={40} />
    </>
  );
}

function Road({ x1, z1, x2, z2 }: { x1: number; z1: number; x2: number; z2: number }) {
  const dx = x2 - x1; const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);
  const cx = (x1 + x2) / 2; const cz = (z1 + z2) / 2;
  const y = getTerrainHeight(cx, cz) + 0.05;
  return (
    <mesh position={[cx, y, cz]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
      <planeGeometry args={[len, 7]} />
      <meshLambertMaterial color="#5a5248" />
    </mesh>
  );
}

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
              <meshLambertMaterial color={i % 2 === 0 ? "#a09070" : "#888070"} />
            </mesh>
            {/* Windows */}
            {Array.from({ length: Math.floor(b.h / 3) }, (_, row) =>
              [-b.d / 2 - 0.01].map((zOff, wi) => (
                <mesh key={`w_${row}_${wi}`} position={[0, 2 + row * 3, zOff]} castShadow>
                  <boxGeometry args={[b.w * 0.6, 1.5, 0.05]} />
                  <meshLambertMaterial color="#88aacc" emissive="#2244aa" emissiveIntensity={0.2} />
                </mesh>
              ))
            )}
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
              <meshLambertMaterial color={["#c47844", "#a06030", "#b07840", "#906020"][i % 4]} />
            </mesh>
            {/* Sign */}
            <mesh position={[0, s.h + 0.5, -s.d / 2 - 0.1]} castShadow>
              <boxGeometry args={[s.w * 0.7, 1, 0.1]} />
              <meshLambertMaterial color={["#cc2222","#2244cc","#22aa44","#cc8800"][i]} />
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
            <mesh castShadow receiveShadow position={[0, h.h / 2, 0]}>
              <boxGeometry args={[h.w, h.h, h.d]} />
              <meshLambertMaterial color={["#d4b896","#c4a880","#e4c8a0","#b49870"][i]} />
            </mesh>
            {/* Roof */}
            <mesh castShadow position={[0, h.h + 1.2, 0]}>
              <coneGeometry args={[Math.max(h.w, h.d) * 0.75, 2.5, 4]} />
              <meshLambertMaterial color="#884422" />
            </mesh>
          </group>
        );
      })}
      {/* Park green */}
      <mesh position={[-55, getTerrainHeight(-55, 42) + 0.02, 42]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8, 12]} />
        <meshLambertMaterial color="#5aaa30" />
      </mesh>
    </group>
  );
}

function DustyDepot() {
  const y = getTerrainHeight(40, -50);
  return (
    <group position={[40, y, -50]}>
      {/* Large warehouse */}
      <mesh castShadow receiveShadow position={[0, 5, 0]}>
        <boxGeometry args={[20, 10, 14]} />
        <meshLambertMaterial color="#888070" />
      </mesh>
      {/* Roof arch */}
      <mesh position={[0, 10.5, 0]}>
        <cylinderGeometry args={[7.5, 7.5, 20, 16, 1, true]} />
        <meshLambertMaterial color="#777060" side={THREE.DoubleSide} />
      </mesh>
      {/* Smaller depot */}
      <mesh castShadow receiveShadow position={[16, 3, -3]}>
        <boxGeometry args={[8, 6, 10]} />
        <meshLambertMaterial color="#998870" />
      </mesh>
    </group>
  );
}

function Tree({ x, z, scale, variant = 0 }: { x: number; z: number; scale: number; variant?: number }) {
  const y = getTerrainHeight(x, z);
  const treeColor = variant === 0 ? "#2a5a18" : variant === 1 ? "#336620" : "#3d7a25";
  return (
    <group position={[x, y, z]}>
      {variant === 2 ? (
        // Palm tree style
        <>
          <mesh position={[0, scale * 1.8, 0]} castShadow>
            <sphereGeometry args={[scale * 0.9, 6, 5]} />
            <meshLambertMaterial color="#3a7a20" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, scale * 1.8, 0]} castShadow>
            <coneGeometry args={[scale * 0.75, scale * 2.8, 7]} />
            <meshLambertMaterial color={treeColor} />
          </mesh>
          <mesh position={[0, scale * 2.8, 0]} castShadow>
            <coneGeometry args={[scale * 0.55, scale * 2, 6]} />
            <meshLambertMaterial color={treeColor} />
          </mesh>
        </>
      )}
      <mesh position={[0, scale * 0.45, 0]} castShadow>
        <cylinderGeometry args={[scale * 0.12, scale * 0.18, scale * 0.9, 5]} />
        <meshLambertMaterial color="#5a3818" />
      </mesh>
    </group>
  );
}

function Rock({ x, z, scale }: { x: number; z: number; scale: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <mesh position={[x, y + scale * 0.3, z]} castShadow>
      <dodecahedronGeometry args={[scale * 0.65, 0]} />
      <meshLambertMaterial color="#7a7a72" />
    </mesh>
  );
}

function Bush({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <mesh position={[x, y + 0.5, z]} castShadow>
      <sphereGeometry args={[0.8, 5, 4]} />
      <meshLambertMaterial color="#2a6a18" />
    </mesh>
  );
}

function Haybale({ x, z }: { x: number; z: number }) {
  const y = getTerrainHeight(x, z);
  return (
    <mesh position={[x, y + 1, z]} castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[1.2, 1.2, 2.5, 8]} />
      <meshLambertMaterial color="#d4aa44" />
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
          <meshLambertMaterial color="#787068" />
        </mesh>
      ))}
    </group>
  );
}

const TREE_POSITIONS: [number, number, number, number][] = [
  [-62,-42,1.4,0],[-57,-36,1.1,1],[-67,-31,1.6,0],[-52,-52,1.2,2],
  [62,42,1.5,1],[67,37,1.0,0],[57,47,1.8,0],[72,32,1.3,2],
  [-62,42,1.2,0],[-57,52,1.5,1],[-72,37,1.0,2],[-47,57,1.7,0],
  [62,-42,1.4,1],[67,-52,1.1,0],[57,-37,1.6,2],[72,-47,1.2,0],
  [22,-72,1.3,0],[27,-67,1.5,1],[17,-77,1.0,0],[32,-62,1.7,2],
  [-22,72,1.2,0],[-27,67,1.4,1],[-17,77,1.6,0],[-32,62,1.1,2],
  [-82,2,1.6,0],[-87,7,1.3,1],[-77,-7,1.1,0],[-92,12,1.8,2],
  [82,2,1.4,1],[87,7,1.2,0],[77,-7,1.5,2],[92,-12,1.0,0],
  [37,57,1.3,0],[47,62,1.6,1],[32,67,1.1,0],[52,52,1.4,2],
  [-37,-57,1.2,1],[-47,-62,1.5,0],[-32,-67,1.0,2],[-52,-52,1.7,0],
  [15,80,1.3,2],[-15,85,1.5,0],[25,75,1.1,1],[-25,-80,1.4,0],
  [70,-20,1.2,2],[-70,20,1.5,1],[75,10,1.0,0],[-75,-10,1.3,2],
];

const ROCK_POSITIONS: [number, number, number][] = [
  [-18,12,2.2],[-8,-32,1.8],[28,-18,2.5],
  [47,-12,1.6],[-12,-32,2.0],[27,37,1.7],
  [-42,-22,2.3],[17,47,1.9],[-7,-47,2.1],
  [55,-8,1.5],[-55,8,2.4],[30,-45,1.8],
  [-35,30,2.0],[45,20,1.7],[-20,50,1.5],
];

const BUSH_POSITIONS: [number, number][] = [
  [5,15],[-10,8],[20,-8],[-15,22],[8,-20],
  [18,12],[-22,-5],[12,28],[-8,35],[25,-15],
  [-30,5],[35,18],[-18,-28],[28,8],[-5,40],
];
