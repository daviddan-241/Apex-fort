import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from './store';

const VEHICLE_SPEED = 28;
const VEHICLE_TURN_SPEED = 2.0;

export function Vehicles() {
  const vehicles = useGameStore(s => s.vehicles);
  const playerPos = useGameStore(s => s.playerPos);
  const inVehicle = useGameStore(s => s.inVehicle);
  const enterVehicle = useGameStore(s => s.enterVehicle);
  const exitVehicle = useGameStore(s => s.exitVehicle);
  const updateVehicles = useGameStore(s => s.updateVehicles);
  const updatePlayerPos = useGameStore(s => s.updatePlayerPos);

  const vehicleRotationsRef = useRef<Record<string, number>>({});
  const [, getKeys] = useKeyboardControls();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      const store = useGameStore.getState();
      if (store.inVehicle) {
        exitVehicle();
        const updated = store.vehicles.map(v =>
          v.occupiedBy === 'player' ? { ...v, occupiedBy: null } : v
        );
        updateVehicles(updated);
      } else {
        const nearby = store.vehicles.find(v =>
          v.position.distanceTo(store.playerPos) < 4 && v.occupiedBy === null
        );
        if (nearby) {
          enterVehicle(nearby.id);
          const updated = store.vehicles.map(v =>
            v.id === nearby.id ? { ...v, occupiedBy: 'player' } : v
          );
          updateVehicles(updated);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterVehicle, exitVehicle, updateVehicles]);

  useFrame((state, delta) => {
    const store = useGameStore.getState();
    if (store.gameState !== 'playing' || !store.inVehicle || !store.currentVehicleId) return;

    const vId = store.currentVehicleId;
    const vehicle = store.vehicles.find(v => v.id === vId);
    if (!vehicle) return;

    const { forward, backward, left, right } = getKeys() as {
      forward: boolean; backward: boolean; left: boolean; right: boolean; jump: boolean;
    };

    let rot = vehicleRotationsRef.current[vId] ?? vehicle.rotation;
    if (left) rot -= VEHICLE_TURN_SPEED * delta;
    if (right) rot += VEHICLE_TURN_SPEED * delta;
    vehicleRotationsRef.current[vId] = rot;

    const dir = new THREE.Vector3(Math.sin(rot), 0, Math.cos(rot));
    const newPos = vehicle.position.clone();
    if (forward) newPos.addScaledVector(dir, VEHICLE_SPEED * delta);
    if (backward) newPos.addScaledVector(dir, -VEHICLE_SPEED * 0.6 * delta);
    newPos.x = Math.max(-98, Math.min(98, newPos.x));
    newPos.y = 0.5;
    newPos.z = Math.max(-98, Math.min(98, newPos.z));

    const updated = store.vehicles.map(v =>
      v.id === vId ? { ...v, position: newPos, rotation: rot } : v
    );
    updateVehicles(updated);
    updatePlayerPos(newPos.clone().add(new THREE.Vector3(0, 1, 0)));

    const cam = state.camera;
    const camOffset = new THREE.Vector3(-dir.x * 8, 4, -dir.z * 8);
    cam.position.lerp(newPos.clone().add(camOffset), 0.1);
    cam.lookAt(newPos);
  });

  return (
    <group>
      {vehicles.map(v => {
        const rot = vehicleRotationsRef.current[v.id] ?? v.rotation;
        const isCar = v.type === 'car';
        return (
          <group key={v.id} position={v.position} rotation={[0, rot, 0]}>
            {/* Body */}
            <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
              <boxGeometry args={isCar ? [2.2, 0.8, 4] : [1.4, 0.6, 2.5]} />
              <meshStandardMaterial color={isCar ? '#1e3a5f' : '#3b1a1a'} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Cab */}
            <mesh castShadow position={[0, 0.9, isCar ? -0.3 : -0.1]}>
              <boxGeometry args={isCar ? [1.8, 0.7, 2] : [1.2, 0.6, 1.2]} />
              <meshStandardMaterial color={isCar ? '#0f2740' : '#2a1010'} metalness={0.4} roughness={0.5} />
            </mesh>
            {/* Wheels */}
            {([-1, 1] as const).flatMap(wx =>
              ([isCar ? 1.2 : 0.7, isCar ? -1.2 : -0.7] as const).map((wz, wi) => (
                <mesh key={`${wx}-${wi}`} position={[wx, -0.2, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.4, 0.4, 0.3, 12]} />
                  <meshStandardMaterial color="#1a1a1a" />
                </mesh>
              ))
            )}
            {/* Glow */}
            <pointLight color={isCar ? '#00c8ff' : '#ff6600'} intensity={1.5} distance={5} position={[0, 0.5, 0]} />
            {/* HP bar + Enter prompt */}
            <Html position={[0, 2.2, 0]} center>
              <div className="pointer-events-none text-center" style={{ fontFamily: 'Space Mono, monospace' }}>
                <div className="text-[10px] text-orange-300 font-bold mb-0.5 whitespace-nowrap">
                  {v.type.toUpperCase()} {Math.ceil(v.hp)}/{v.maxHp}
                </div>
                {!v.occupiedBy && playerPos.distanceTo(v.position) < 6 && (
                  <div className="text-[10px] text-white bg-black/60 rounded px-1.5 py-0.5 whitespace-nowrap border border-white/20">
                    Press E to Drive
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
