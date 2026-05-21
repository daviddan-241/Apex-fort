import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './store';

const PLAYER_SPEED = 15;
const JUMP_FORCE = 10;
const GRAVITY = 25;

export function Player() {
  const playerRef = useRef<THREE.Group>(null);
  const [, get] = useKeyboardControls();
  const { camera } = useThree();
  const updatePlayerPos = useGameStore(state => state.updatePlayerPos);
  const fireWeapon = useGameStore(state => state.fireWeapon);
  const reloadWeapon = useGameStore(state => state.reloadWeapon);
  const currentWeapon = useGameStore(state => state.currentWeapon);
  const isBuildMode = useGameStore(state => state.isBuildMode);
  const placeStructure = useGameStore(state => state.placeStructure);
  const damagePlayer = useGameStore(state => state.damagePlayer);

  const [velocity, setVelocity] = useState(new THREE.Vector3(0, 0, 0));
  const lastFired = useRef(0);

  const [isGrounded, setIsGrounded] = useState(true);

  // Input handling
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        if (e.button === 0) { // Left click
          if (isBuildMode && playerRef.current) {
            const p = playerRef.current.position;
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            dir.y = 0;
            dir.normalize();
            
            const buildPos = p.clone().add(dir.multiplyScalar(3));
            buildPos.y = 1.5;
            
            placeStructure({
              id: `struct-${Date.now()}`,
              position: buildPos,
              rotation: new THREE.Euler(0, Math.atan2(dir.x, dir.z), 0),
              size: new THREE.Vector3(4, 3, 0.5),
              hp: 100
            });
          } else {
            // Shoot handled in useFrame for auto weapons if needed, 
            // but for semi-auto/first shot, handle here
            const now = performance.now() / 1000;
            if (now - lastFired.current >= currentWeapon.fireRate) {
              const dir = new THREE.Vector3();
              camera.getWorldDirection(dir);
              if (playerRef.current) {
                const origin = playerRef.current.position.clone().add(new THREE.Vector3(0, 0.5, 0));
                fireWeapon(dir, origin);
                lastFired.current = now;
              }
            }
          }
        }
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [camera, isBuildMode, currentWeapon, fireWeapon, placeStructure]);

  useFrame((state, delta) => {
    if (!playerRef.current) return;
    
    const { forward, backward, left, right, jump, reload, build } = get();
    
    // Reload
    if (reload) {
      reloadWeapon();
    }

    // Toggle build (handle debouncing to avoid flicker)
    // using keyboard events is better for toggles to avoid continuous firing
    
    const p = playerRef.current.position;
    
    // Movement relative to camera
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    const cameraRight = new THREE.Vector3().crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
    
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (forward) moveDir.add(cameraDirection);
    if (backward) moveDir.sub(cameraDirection);
    if (right) moveDir.add(cameraRight);
    if (left) moveDir.sub(cameraRight);
    
    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }
    
    // Apply movement
    p.x += moveDir.x * PLAYER_SPEED * delta;
    p.z += moveDir.z * PLAYER_SPEED * delta;
    
    // Jumping & Gravity
    if (jump && isGrounded) {
      velocity.y = JUMP_FORCE;
      setIsGrounded(false);
    }
    
    velocity.y -= GRAVITY * delta;
    p.y += velocity.y * delta;
    
    if (p.y < 1) { // Ground collision
      p.y = 1;
      velocity.y = 0;
      setIsGrounded(true);
    }
    
    // Bound to map
    p.x = Math.max(-100, Math.min(100, p.x));
    p.z = Math.max(-100, Math.min(100, p.z));

    // Continuous firing for auto weapons
    if (currentWeapon.name === 'AR' || currentWeapon.name === 'SMG') {
      // Need a way to check if mouse is held down. The browser doesn't natively provide "isMouseDown" synchronously.
      // We will skip full auto here for simplicity unless we track mouse state.
    }
    
    updatePlayerPos(p);
    
    // Camera follow (Third Person)
    const idealOffset = new THREE.Vector3(0, 2, 5); // Behind and above
    idealOffset.applyQuaternion(camera.quaternion); // Not quite right, we want it relative to player yaw.
    
    // Simple 3rd person camera:
    // Actually, PointerLockControls handles camera rotation. We just move the camera relative to its own look direction.
    // In PointerLock, the camera IS the pivot. We place the player mesh IN FRONT of the camera.
    // Wait, PointerLockControls moves the camera. If we want third person, we need custom logic or we put player model offset from camera.
    
    // We will place player model slightly in front of camera
    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);
    lookDir.y = 0;
    lookDir.normalize();
    
    // Align player model to look direction
    if (lookDir.lengthSq() > 0) {
      playerRef.current.rotation.y = Math.atan2(lookDir.x, lookDir.z);
    }
    
    // Move camera to follow player smoothly
    const cameraPos = p.clone().sub(lookDir.multiplyScalar(4)).add(new THREE.Vector3(0, 2, 0));
    camera.position.lerp(cameraPos, 0.2);
    
    // Storm Damage
    const store = useGameStore.getState();
    const distToCenter = Math.sqrt(p.x * p.x + p.z * p.z);
    if (distToCenter > store.stormRadius) {
      // 1 hp per second
      if (Math.random() < delta) { // crude timer
        damagePlayer(1);
      }
    }
  });

  // Handle Build mode toggle on keydown to avoid rapid flipping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyB') {
        useGameStore.getState().toggleBuildMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <group ref={playerRef} position={[0, 1, 0]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color="#00c8ff" />
      </mesh>
      {/* Direction indicator */}
      <mesh position={[0, 0.5, 0.6]}>
        <boxGeometry args={[0.2, 0.2, 0.5]} />
        <meshStandardMaterial color="#ffcc00" />
      </mesh>

      {/* Build Preview */}
      {isBuildMode && (
        <mesh position={[0, 0.5, 3]} transparent opacity={0.5}>
          <boxGeometry args={[4, 3, 0.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
