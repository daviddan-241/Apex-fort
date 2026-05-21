import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";

const MAP_SIZE = 500;

// Biome zone colors
const BIOME_COLORS = {
  forest: new THREE.Color("#2d5a27"),
  urban: new THREE.Color("#4a4a5e"),
  desert: new THREE.Color("#c4a35a"),
  mountain: new THREE.Color("#6b5a4e"),
  industrial: new THREE.Color("#3d3d4f"),
  military: new THREE.Color("#4a5c3a"),
  default: new THREE.Color("#3d5c3a"),
};

function getBiomeColor(x: number, z: number): THREE.Color {
  const nx = x / MAP_SIZE;
  const nz = z / MAP_SIZE;
  if (nx < -0.2 && nz < -0.2) return BIOME_COLORS.forest;
  if (nx > 0.2 && nz < -0.2) return BIOME_COLORS.desert;
  if (nx < -0.2 && nz > 0.2) return BIOME_COLORS.industrial;
  if (nx > 0.2 && nz > 0.2) return BIOME_COLORS.mountain;
  if (Math.abs(nx) < 0.15 && Math.abs(nz) < 0.15) return BIOME_COLORS.military;
  return BIOME_COLORS.urban;
}

function TerrainMesh() {
  const geometry = useMemo(() => {
    const segs = 80;
    const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Simple terrain height variation
      const h =
        Math.sin(x * 0.03) * Math.cos(z * 0.025) * 4 +
        Math.sin(x * 0.07 + z * 0.05) * 2 +
        Math.cos(x * 0.015 + z * 0.02) * 6;
      pos.setY(i, Math.max(0, h));
      const c = getBiomeColor(x, z);
      // Darken peaks slightly
      const brightness = 0.85 + (Math.max(0, h) / 12) * 0.15;
      color.setRGB(c.r * brightness, c.g * brightness, c.b * brightness);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh receiveShadow geometry={geometry}>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

// Static building/structure
function Building({ pos, size, color }: { pos: [number, number, number]; size: [number, number, number]; color: string }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={pos}>
        <boxGeometry args={size} />
        <meshLambertMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

// Tree
function Tree({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh castShadow position={[0, 3, 0]}>
        <cylinderGeometry args={[0.3, 0.5, 6, 6]} />
        <meshLambertMaterial color="#5a3a2a" />
      </mesh>
      <mesh castShadow position={[0, 7, 0]}>
        <coneGeometry args={[3, 6, 7]} />
        <meshLambertMaterial color="#1a5c1a" />
      </mesh>
      <mesh castShadow position={[0, 5, 0]}>
        <coneGeometry args={[2.5, 5, 7]} />
        <meshLambertMaterial color="#1e6e1e" />
      </mesh>
    </group>
  );
}

// Rock
function Rock({ pos, scale }: { pos: [number, number, number]; scale: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh castShadow receiveShadow position={pos} scale={[scale, scale * 0.7, scale]}>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshLambertMaterial color="#6a6a7a" />
      </mesh>
    </RigidBody>
  );
}

// Building structures
const BUILDINGS: Array<{ pos: [number, number, number]; size: [number, number, number]; color: string }> = [
  // Military base center
  { pos: [0, 4, 0], size: [20, 8, 20], color: "#4a5c3a" },
  { pos: [15, 6, 5], size: [8, 12, 8], color: "#3d4a2d" },
  { pos: [-15, 5, -10], size: [10, 10, 12], color: "#4a5c3a" },
  { pos: [8, 2, -18], size: [6, 4, 6], color: "#5a6c4a" },
  // Urban east
  { pos: [60, 8, -40], size: [15, 16, 12], color: "#555570" },
  { pos: [80, 6, -30], size: [10, 12, 10], color: "#606080" },
  { pos: [70, 4, -60], size: [12, 8, 10], color: "#4a4a5e" },
  { pos: [50, 10, -50], size: [8, 20, 8], color: "#505065" },
  { pos: [90, 5, -50], size: [14, 10, 12], color: "#555570" },
  { pos: [65, 3, -20], size: [6, 6, 6], color: "#666680" },
  // Industrial west
  { pos: [-60, 7, 40], size: [25, 14, 20], color: "#3d3d4f" },
  { pos: [-80, 4, 60], size: [15, 8, 25], color: "#353545" },
  { pos: [-70, 9, 30], size: [8, 18, 8], color: "#404055" },
  { pos: [-50, 5, 65], size: [20, 10, 8], color: "#3a3a4a" },
  // Forest structures
  { pos: [-60, 3, -40], size: [8, 6, 10], color: "#4a5c3a" },
  { pos: [-80, 4, -60], size: [12, 8, 8], color: "#3d4a2d" },
  // Desert outpost
  { pos: [70, 4, 50], size: [12, 8, 15], color: "#b8943a" },
  { pos: [90, 3, 70], size: [8, 6, 8], color: "#c4a35a" },
  { pos: [60, 5, 80], size: [10, 10, 8], color: "#a88830" },
  // Mountain base
  { pos: [-20, 4, 80], size: [15, 8, 12], color: "#5a4a3e" },
  { pos: [20, 5, 90], size: [10, 10, 10], color: "#6b5a4e" },
  // Scattered walls
  { pos: [30, 1.5, 10], size: [15, 3, 0.6], color: "#555555" },
  { pos: [-30, 1.5, -10], size: [12, 3, 0.6], color: "#555555" },
  { pos: [10, 1.5, 35], size: [0.6, 3, 18], color: "#555555" },
  { pos: [-15, 1.5, -35], size: [0.6, 3, 12], color: "#555555" },
];

const TREES: Array<[number, number, number]> = Array.from({ length: 60 }, (_, i) => {
  const angle = (i / 60) * Math.PI * 2 + Math.random() * 0.5;
  const radius = 30 + Math.random() * 180;
  return [
    Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
    0,
    Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
  ];
});

const ROCKS: Array<{ pos: [number, number, number]; scale: number }> = Array.from({ length: 25 }, (_, i) => {
  const angle = (i / 25) * Math.PI * 2 + Math.random();
  const radius = 20 + Math.random() * 150;
  return {
    pos: [Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius],
    scale: 0.8 + Math.random() * 2,
  };
});

export default function Map() {
  return (
    <group>
      {/* Terrain — no physics body, use a separate flat physics collider */}
      <TerrainMesh />
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.5, 0]}>
        <mesh>
          <boxGeometry args={[MAP_SIZE, 1, MAP_SIZE]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

      {/* Buildings */}
      {BUILDINGS.map((b, i) => (
        <Building key={i} pos={b.pos} size={b.size} color={b.color} />
      ))}

      {/* Trees (no physics - decorative) */}
      {TREES.map((pos, i) => (
        <Tree key={i} pos={pos} />
      ))}

      {/* Rocks */}
      {ROCKS.map((r, i) => (
        <Rock key={i} pos={r.pos} scale={r.scale} />
      ))}

      {/* Road markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4, 60]} />
        <meshLambertMaterial color="#3a3a4a" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.02, 0]}>
        <planeGeometry args={[4, 60]} />
        <meshLambertMaterial color="#3a3a4a" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
