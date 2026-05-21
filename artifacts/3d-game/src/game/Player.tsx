import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, SKINS } from './store';
import { sounds } from './Sounds';

const PLAYER_SPEED = 14;
const JUMP_FORCE = 10;
const GRAVITY = 26;

export function Player() {
  const playerRef = useRef<THREE.Group>(null);
  const [, get] = useKeyboardControls();
  const { camera } = useThree();

  const updatePlayerPos = useGameStore(s => s.updatePlayerPos);
  const fireWeapon = useGameStore(s => s.fireWeapon);
  const reloadWeapon = useGameStore(s => s.reloadWeapon);
  const currentWeapon = useGameStore(s => s.currentWeapon);
  const isBuildMode = useGameStore(s => s.isBuildMode);
  const placeStructure = useGameStore(s => s.placeStructure);
  const damagePlayer = useGameStore(s => s.damagePlayer);
  const inVehicle = useGameStore(s => s.inVehicle);
  const selectedSkin = useGameStore(s => s.selectedSkin);

  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const lastFired = useRef(0);
  const isMouseDown = useRef(false);

  const skin = SKINS.find(s => s.id === selectedSkin) ?? SKINS[0];

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      isMouseDown.current = true;
      if (!document.pointerLockElement) return;
      if (e.button === 0 && isBuildMode && playerRef.current) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
        const p = playerRef.current.position;
        const buildPos = p.clone().addScaledVector(dir, 3);
        buildPos.y = 1.5;
        placeStructure({
          id: `struct-${Date.now()}`,
          position: buildPos,
          rotation: new THREE.Euler(0, Math.atan2(dir.x, dir.z), 0),
          size: new THREE.Vector3(4, 3, 0.5),
          hp: 100,
        });
      }
    };
    const onUp = () => { isMouseDown.current = false; };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); };
  }, [camera, isBuildMode, placeStructure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyB') useGameStore.getState().toggleBuildMode();
      if (e.code === 'KeyR') reloadWeapon();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reloadWeapon]);

  useFrame((_, delta) => {
    if (!playerRef.current) return;
    const store = useGameStore.getState();
    if (store.gameState !== 'playing') return;
    if (store.inVehicle) {
      // Hide player while in vehicle
      playerRef.current.visible = false;
      return;
    }
    playerRef.current.visible = true;

    const { forward, backward, left, right, jump } = get();
    const p = playerRef.current.position;

    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();
    const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (forward) move.add(camDir);
    if (backward) move.sub(camDir);
    if (right) move.add(camRight);
    if (left) move.sub(camRight);
    if (move.lengthSq() > 0) move.normalize();

    p.x += move.x * PLAYER_SPEED * delta;
    p.z += move.z * PLAYER_SPEED * delta;

    if (jump && isGrounded.current) {
      velocityY.current = JUMP_FORCE;
      isGrounded.current = false;
    }
    velocityY.current -= GRAVITY * delta;
    p.y += velocityY.current * delta;
    if (p.y <= 1) {
      p.y = 1;
      velocityY.current = 0;
      isGrounded.current = true;
    }

    p.x = Math.max(-98, Math.min(98, p.x));
    p.z = Math.max(-98, Math.min(98, p.z));

    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);
    lookDir.y = 0;
    if (lookDir.lengthSq() > 0.01) {
      playerRef.current.rotation.y = Math.atan2(lookDir.x, lookDir.z);
    }

    // Camera follow
    const back = lookDir.clone().negate().multiplyScalar(4.5);
    const camTarget = p.clone().add(back).add(new THREE.Vector3(0, 2.2, 0));
    camera.position.lerp(camTarget, 0.18);

    updatePlayerPos(p.clone());

    // Storm damage
    const distToCenter = Math.sqrt(p.x * p.x + p.z * p.z);
    if (distToCenter > store.stormRadius && Math.random() < delta) {
      damagePlayer(1);
    }

    // Auto-fire for AR and SMG
    if (isMouseDown.current && document.pointerLockElement && !isBuildMode) {
      const now = performance.now() / 1000;
      if (now - lastFired.current >= currentWeapon.fireRate) {
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const origin = p.clone().add(new THREE.Vector3(0, 0.6, 0));
        fireWeapon(dir, origin);
        sounds.playGunshot(currentWeapon.name);
        lastFired.current = now;
      }
    }
  });

  return (
    <group ref={playerRef} position={[0, 1, 0]}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.45, 1, 4, 8]} />
        <meshStandardMaterial color={skin.color} emissive={skin.emissive} emissiveIntensity={0.4} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.3, 10, 10]} />
        <meshStandardMaterial color={skin.color} emissive={skin.emissive} emissiveIntensity={0.5} />
      </mesh>
      {/* Weapon indicator */}
      <mesh position={[0.5, 0.2, 0.3]}>
        <boxGeometry args={[0.15, 0.12, 0.7]} />
        <meshStandardMaterial color={currentWeapon.color} emissive={currentWeapon.color} emissiveIntensity={0.6} />
      </mesh>
      {/* Direction dot */}
      <mesh position={[0, 0.5, 0.55]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Player glow */}
      <pointLight color={skin.color} intensity={1.5} distance={4} position={[0, 0.5, 0]} />
      {/* Build preview */}
      {isBuildMode && (
        <mesh position={[0, 0.5, 3]}>
          <boxGeometry args={[4, 3, 0.5]} />
          <meshBasicMaterial color="#00c8ff" transparent opacity={0.35} wireframe />
        </mesh>
      )}
    </group>
  );
}
