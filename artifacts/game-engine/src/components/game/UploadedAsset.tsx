import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface Props {
  url: string;
  index: number;
}

export function UploadedAsset({ url, index }: Props) {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);

  return (
    <group ref={ref} position={[index * 6 - 12, 2, -20]}>
      <primitive object={scene.clone(true)} />
    </group>
  );
}
