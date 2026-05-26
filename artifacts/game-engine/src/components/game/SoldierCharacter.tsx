import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { getTerrainHeight } from '@/utils/terrain';
import { useGameStore } from '@/store/gameStore';

const MODEL_URL = '/models/Soldier.glb';
const CAMERA_DISTANCE = 5.5;
const CAMERA_HEIGHT = 1.8;

type AnimName = 'Idle' | 'Walk' | 'Run';

export function SoldierCharacter() {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const setAmmo = useGameStore((s) => s.setAmmo);
  const setHealth = useGameStore((s) => s.setHealth);
  const addKillFeedEntry = useGameStore((s) => s.addKillFeedEntry);

  const keys = useRef({ w: false, a: false, s: false, d: false, space: false, shift: false });
  const yaw = useRef(0);
  const pitch = useRef(0.15);
  const position = useRef(new THREE.Vector3(0, 10, 0));
  const velocity = useRef(new THREE.Vector3());
  const isGrounded = useRef(false);
  const isShooting = useRef(false);
  const lastShot = useRef(0);
  const currentAnim = useRef<AnimName>('Idle');

  const { scene, animations } = useGLTF(MODEL_URL);
  const clonedScene = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    const a = actions as Record<string, THREE.AnimationAction | null>;
    a['Idle']?.play();
  }, [actions]);

  useEffect(() => {
    const k = keys.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') k.w = true;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') k.s = true;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') k.a = true;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') k.d = true;
      if (e.key === ' ') { k.space = true; e.preventDefault(); }
      if (e.key === 'Shift') k.shift = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') k.w = false;
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') k.s = false;
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') k.a = false;
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') k.d = false;
      if (e.key === ' ') k.space = false;
      if (e.key === 'Shift') k.shift = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        yaw.current -= e.movementX * 0.0022;
        pitch.current -= e.movementY * 0.0022;
        pitch.current = Math.max(-0.45, Math.min(0.65, pitch.current));
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!document.pointerLockElement) {
        document.body.requestPointerLock();
      } else {
        isShooting.current = true;
      }
    };
    const onMouseUp = () => { isShooting.current = false; };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const playAnim = (name: AnimName) => {
    if (currentAnim.current === name) return;
    const a = actions as Record<string, THREE.AnimationAction | null>;
    a[currentAnim.current]?.fadeOut(0.18);
    a[name]?.reset().fadeIn(0.18).play();
    currentAnim.current = name;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const k = keys.current;
    const isMoving = k.w || k.s || k.a || k.d;
    const speed = k.shift ? 11 : 5.5;

    // Movement
    if (isMoving) {
      const dir = new THREE.Vector3();
      if (k.w) dir.z -= 1;
      if (k.s) dir.z += 1;
      if (k.a) dir.x -= 1;
      if (k.d) dir.x += 1;
      dir.normalize().multiplyScalar(speed * Math.min(delta, 0.05));
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      position.current.add(dir);
    }

    // Gravity
    velocity.current.y -= 22 * Math.min(delta, 0.05);
    position.current.y += velocity.current.y * Math.min(delta, 0.05);

    // Terrain collision
    const groundY = getTerrainHeight(position.current.x, position.current.z);
    if (position.current.y <= groundY + 1.05) {
      position.current.y = groundY + 1.05;
      velocity.current.y = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }

    // Jump
    if (k.space && isGrounded.current) {
      velocity.current.y = 9;
      isGrounded.current = false;
    }

    // Shoot
    if (isShooting.current) {
      const now = state.clock.elapsedTime;
      if (now - lastShot.current > 0.09) {
        lastShot.current = now;
        const cur = useGameStore.getState().ammo;
        if (cur > 0) {
          setAmmo(cur - 1);
          // Occasionally trigger a kill feed entry as demo
          if (Math.random() < 0.05) {
            const victims = ['Ghost', 'Shadow', 'Apex_01', 'Player_7', 'Wraith'];
            const weapons = ['AR', 'SMG', 'Sniper', 'Shotgun'];
            addKillFeedEntry({
              killer: 'YOU',
              victim: victims[Math.floor(Math.random() * victims.length)],
              weapon: weapons[Math.floor(Math.random() * weapons.length)],
            });
          }
        }
      }
    }

    // Update mesh
    groupRef.current.position.copy(position.current);
    groupRef.current.rotation.y = yaw.current + Math.PI;

    // Third-person camera
    const cosPitch = Math.cos(pitch.current);
    const sinPitch = Math.sin(pitch.current);
    const cx = position.current.x + Math.sin(yaw.current) * CAMERA_DISTANCE * cosPitch;
    const cy = position.current.y + CAMERA_HEIGHT + sinPitch * CAMERA_DISTANCE;
    const cz = position.current.z + Math.cos(yaw.current) * CAMERA_DISTANCE * cosPitch;
    camera.position.lerp(new THREE.Vector3(cx, cy, cz), 0.12);
    camera.lookAt(position.current.x, position.current.y + 1.4, position.current.z);

    // Animations
    if (isMoving) {
      playAnim(k.shift ? 'Run' : 'Walk');
    } else {
      playAnim('Idle');
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
