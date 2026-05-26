import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight } from '@/utils/terrain';

export function Terrain() {
  const geometry = useMemo(() => {
    const SIZE = 600;
    const SEGS = 120;
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGS, SEGS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getTerrainHeight(x, z);
      pos.setY(i, h);

      // Vertex color based on height
      let r: number, g: number, b: number;
      if (h < -2)      { r = 0.08; g = 0.14; b = 0.55; } // deep water
      else if (h < 0)  { r = 0.12; g = 0.22; b = 0.65; } // shallow water
      else if (h < 1)  { r = 0.76; g = 0.70; b = 0.50; } // sand / beach
      else if (h < 5)  { r = 0.15; g = 0.48; b = 0.12; } // grass
      else if (h < 10) { r = 0.32; g = 0.27; b = 0.18; } // dirt / forest floor
      else if (h < 15) { r = 0.48; g = 0.44; b = 0.40; } // rock / stone
      else             { r = 0.92; g = 0.94; b = 0.98; } // snow

      colors.push(r, g, b);
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.88}
        metalness={0.02}
        envMapIntensity={0.4}
      />
    </mesh>
  );
}
