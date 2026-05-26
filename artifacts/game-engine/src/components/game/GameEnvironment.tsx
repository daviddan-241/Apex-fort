/**
 * Military base environment: buildings, walls, watchtowers, rocks, trees.
 * All geometry is static — no re-renders needed.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '@/utils/terrain';

const CONCRETE = '#5a5a50';
const DARK_CONCRETE = '#3a3a32';
const METAL = '#6a6a60';
const RUST = '#7a4a30';
const SANDBAG = '#b8a070';
const WOOD = '#5a3a20';
const GLASS = '#203040';

function Building({ position, size, color = CONCRETE, roofColor = DARK_CONCRETE }: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  roofColor?: string;
}) {
  const [x, , z] = position;
  const groundY = getTerrainHeight(x, z);
  const [w, h, d] = size;
  return (
    <group position={[x, groundY + h / 2, z]}>
      {/* Main walls */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h / 2 + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.2, 0.3, d + 0.2]} />
        <meshStandardMaterial color={roofColor} roughness={0.95} />
      </mesh>
      {/* Windows — dark glass recesses */}
      {[-w * 0.25, w * 0.25].map((wx, i) => (
        <mesh key={i} position={[wx, 0, d / 2 + 0.05]}>
          <boxGeometry args={[1.2, 1.4, 0.1]} />
          <meshStandardMaterial color={GLASS} roughness={0.1} metalness={0.8} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Wall({ x1, z1, x2, z2, height = 3, thickness = 0.6, color = CONCRETE }: {
  x1: number; z1: number; x2: number; z2: number;
  height?: number; thickness?: number; color?: string;
}) {
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  const angle = Math.atan2(x2 - x1, z2 - z1);
  const groundY = getTerrainHeight(cx, cz);
  return (
    <mesh position={[cx, groundY + height / 2, cz]} rotation={[0, angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[thickness, height, len]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

function Watchtower({ x, z }: { x: number; z: number }) {
  const groundY = getTerrainHeight(x, z);
  return (
    <group position={[x, groundY, z]}>
      {/* 4 legs */}
      {[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 5, lz]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 10, 8]} />
          <meshStandardMaterial color={METAL} roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
      {/* Platform */}
      <mesh position={[0, 10.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 0.3, 4.5]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} />
      </mesh>
      {/* Guard post walls */}
      {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((rot, i) => (
        <mesh key={i} position={[Math.sin(rot)*2, 11.3, Math.cos(rot)*2]} rotation={[0, rot, 0]} castShadow>
          <boxGeometry args={[0.2, 2, 4]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      ))}
      {/* Roof */}
      <mesh position={[0, 12.5, 0]} castShadow>
        <boxGeometry args={[5, 0.2, 5]} />
        <meshStandardMaterial color={RUST} roughness={0.8} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale }: { position: [number, number, number]; scale: number }) {
  const [x, , z] = position;
  const groundY = getTerrainHeight(x, z);
  return (
    <mesh position={[x, groundY + scale * 0.4, z]} castShadow receiveShadow>
      <dodecahedronGeometry args={[scale, 0]} />
      <meshStandardMaterial color="#706860" roughness={0.95} metalness={0.02} />
    </mesh>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  const [x, , z] = position;
  const groundY = getTerrainHeight(x, z);
  return (
    <group position={[x, groundY, z]}>
      {/* Trunk */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 4, 8]} />
        <meshStandardMaterial color="#3a2010" roughness={0.95} />
      </mesh>
      {/* Canopy layers */}
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[2.2, 3.5, 8]} />
        <meshStandardMaterial color="#1a3a10" roughness={0.9} />
      </mesh>
      <mesh position={[0, 7.5, 0]} castShadow>
        <coneGeometry args={[1.6, 3, 8]} />
        <meshStandardMaterial color="#204020" roughness={0.9} />
      </mesh>
      <mesh position={[0, 9, 0]} castShadow>
        <coneGeometry args={[1, 2.5, 8]} />
        <meshStandardMaterial color="#1a4a15" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Crate({ position }: { position: [number, number, number] }) {
  const [x, , z] = position;
  const groundY = getTerrainHeight(x, z);
  return (
    <group position={[x, groundY + 0.5, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#5a4020" roughness={0.9} />
      </mesh>
      {/* Straps */}
      <mesh position={[0, 0, 0.51]}>
        <boxGeometry args={[1, 0.08, 0.02]} />
        <meshStandardMaterial color="#303020" roughness={0.9} />
      </mesh>
    </group>
  );
}

function SandbagWall({ x, z, angle = 0 }: { x: number; z: number; angle?: number }) {
  const groundY = getTerrainHeight(x, z);
  return (
    <group position={[x, groundY + 0.3, z]} rotation={[0, angle, 0]}>
      {[-1.2, 0, 1.2].map((ox, i) => (
        <mesh key={i} position={[ox, 0, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
          <meshStandardMaterial color={SANDBAG} roughness={0.95} />
        </mesh>
      ))}
      {[-0.6, 0.6].map((ox, i) => (
        <mesh key={i} position={[ox, 0.55, 0]} castShadow>
          <capsuleGeometry args={[0.28, 0.7, 4, 8]} />
          <meshStandardMaterial color="#a89060" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export function GameEnvironment() {
  return (
    <group>
      {/* ─── CENTRAL COMMAND BASE ───────────────────────────────── */}
      <Building position={[0, 0, 0]}     size={[14, 6, 10]} color="#4a4a40" />
      <Building position={[-18, 0, -5]}  size={[8, 4, 6]}   color={CONCRETE} />
      <Building position={[18, 0, 5]}    size={[8, 4, 6]}   color={CONCRETE} />
      <Building position={[0, 0, -20]}   size={[10, 3.5, 7]} color={DARK_CONCRETE} />
      <Building position={[0, 0, 22]}    size={[10, 3.5, 7]} color={DARK_CONCRETE} />

      {/* ─── PERIMETER WALLS ────────────────────────────────────── */}
      <Wall x1={-30} z1={-30} x2={30} z2={-30} height={3.5} />
      <Wall x1={30}  z1={-30} x2={30} z2={30}  height={3.5} />
      <Wall x1={30}  z1={30}  x2={-30} z2={30} height={3.5} />
      <Wall x1={-30} z1={30}  x2={-30} z2={-30} height={3.5} />

      {/* ─── WATCHTOWERS ────────────────────────────────────────── */}
      <Watchtower x={0}   z={60}  />
      <Watchtower x={0}   z={-60} />
      <Watchtower x={70}  z={0}   />
      <Watchtower x={-70} z={0}   />

      {/* ─── FORWARD BUNKERS ────────────────────────────────────── */}
      <Building position={[-55, 0, -55]} size={[6, 2.5, 5]} color={DARK_CONCRETE} />
      <Building position={[55, 0, 55]}   size={[6, 2.5, 5]} color={DARK_CONCRETE} />
      <Building position={[-55, 0, 55]}  size={[6, 2.5, 5]} color={DARK_CONCRETE} />
      <Building position={[55, 0, -55]}  size={[6, 2.5, 5]} color={DARK_CONCRETE} />

      {/* ─── SANDBAG POSITIONS ──────────────────────────────────── */}
      <SandbagWall x={-15} z={0}  angle={Math.PI / 2} />
      <SandbagWall x={15}  z={0}  angle={Math.PI / 2} />
      <SandbagWall x={0}   z={-15} />
      <SandbagWall x={0}   z={15}  />
      <SandbagWall x={-40} z={-20} angle={0.4} />
      <SandbagWall x={40}  z={20}  angle={-0.4} />
      <SandbagWall x={-40} z={20}  angle={-0.4} />
      <SandbagWall x={40}  z={-20} angle={0.4} />

      {/* ─── SUPPLY CRATES ──────────────────────────────────────── */}
      {[[-8,-8],[-8,8],[8,-8],[8,8],[-20,0],[20,0],[0,-25],[0,25],
        [-45,-10],[45,10],[-45,10],[45,-10]].map(([x, z], i) => (
        <Crate key={i} position={[x, 0, z]} />
      ))}

      {/* ─── ROCKS ──────────────────────────────────────────────── */}
      {[[-35,-45,2.5],[-38,-43,1.8],[35,45,2.2],[38,43,1.6],
        [48,-35,2],[50,-32,1.4],[-48,35,2.3],[-50,32,1.6],
        [-70,-20,3],[70,20,2.8],[-20,-70,2.2],[20,70,2.5],
        [-80,50,3.5],[80,-50,3],[0,-80,2.8],[0,80,3.2]].map(([x, z, s], i) => (
        <Rock key={i} position={[x, 0, z]} scale={s} />
      ))}

      {/* ─── TREES (forest edges) ───────────────────────────────── */}
      {[[-90,-30],[-95,-10],[-88,15],[-92,35],[-85,55],
        [90,30],[95,10],[88,-15],[92,-35],[85,-55],
        [-30,-90],[-10,-95],[15,-88],[35,-92],[55,-85],
        [30,90],[10,95],[-15,88],[-35,92],[-55,85],
        [-110,-50],[-110,0],[-110,50],[110,-50],[110,0],[110,50],
        [-50,-110],[0,-110],[50,-110],[-50,110],[0,110],[50,110]].map(([x, z], i) => (
        <Tree key={i} position={[x, 0, z]} />
      ))}

      {/* ─── RUINED WALL SECTIONS ───────────────────────────────── */}
      <Wall x1={-55} z1={-30} x2={-55} z2={30} height={4} color={DARK_CONCRETE} />
      <Wall x1={55}  z1={30}  x2={55}  z2={-30} height={4} color={DARK_CONCRETE} />
    </group>
  );
}
