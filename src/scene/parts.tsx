import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { DIM, P, incidentTint, type Pt } from "../story/model";
import { storyState } from "../story/state";
import { matDark, matGalv, matGlass, matPaint, matPaintCool, matStainless, matSteel } from "./materials";

export function Agitator({ slow = false }: { slow?: boolean }) {
  const spin = useRef<Group>(null);
  const y = DIM.reactorSkirt + DIM.reactorShell + DIM.reactorR * 0.4 + 0.21;
  useFrame((_, delta) => {
    if (!spin.current) return;
    const drag = slow ? 1 - incidentTint(storyState.progress) * 0.45 : 1;
    spin.current.rotation.y += delta * 0.85 * drag;
  });
  return (
    <group position={[0, y, 0]}>
      <mesh material={matGalv} position={[0, 0.005, 0]} castShadow>
        <cylinderGeometry args={[0.31, 0.31, 0.05, 20]} />
      </mesh>
      <mesh material={matSteel} position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.26, 0.28, 18]} />
      </mesh>
      <group ref={spin} position={[0, 0.48, 0]}>
        <mesh material={matDark} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.46, 20]} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} material={matSteel} position={[0, -0.12 + i * 0.07, 0]}>
            <torusGeometry args={[0.285, 0.008, 5, 16]} />
          </mesh>
        ))}
        <mesh material={matSteel} position={[0.3, 0.02, 0]} castShadow>
          <boxGeometry args={[0.12, 0.1, 0.08]} />
        </mesh>
        <mesh material={matSteel} position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.12, 12]} />
        </mesh>
        <mesh material={matGalv} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.3, 0.012, 6, 18]} />
        </mesh>
      </group>
    </group>
  );
}

export function Pump({ position, phase = 0 }: { position: Pt; phase?: number }) {
  const motor = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (motor.current) motor.current.rotation.x = clock.elapsedTime * 2.4 + phase;
  });
  return (
    <group position={position}>
      <mesh material={matGalv} position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.35, 0.1, 0.68]} />
      </mesh>
      <mesh material={matSteel} position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[1.05, 0.07, 0.48]} />
      </mesh>
      {[
        [-0.48, 0.28],
        [0.48, 0.28],
        [-0.48, -0.28],
        [0.48, -0.28],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} material={matSteel} position={[x, 0.08, z]}>
          <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
        </mesh>
      ))}
      <mesh material={matPaint} position={[-0.12, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.22, 18, 14]} />
      </mesh>
      <mesh material={matStainless} position={[-0.12, 0.42, 0.26]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.16, 12]} />
      </mesh>
      <mesh material={matSteel} position={[-0.12, 0.42, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.04, 12]} />
      </mesh>
      <mesh material={matStainless} position={[0.16, 0.58, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.26, 12]} />
      </mesh>
      <mesh material={matDark} position={[0.28, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.14, 12]} />
      </mesh>
      <mesh material={matGalv} position={[0.32, 0.42, 0]} castShadow>
        <boxGeometry args={[0.16, 0.22, 0.22]} />
      </mesh>
      <group ref={motor} position={[0.62, 0.42, 0]}>
        <mesh material={matSteel} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.52, 18]} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} material={matDark} position={[-0.18 + i * 0.07, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.168, 0.009, 5, 14]} />
          </mesh>
        ))}
        <mesh material={matDark} position={[0.3, 0.12, 0]}>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
        </mesh>
      </group>
    </group>
  );
}

export function Valve({ position, rotation = [0, 0, 0] }: { position: Pt; rotation?: Pt }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={matStainless} castShadow>
        <sphereGeometry args={[0.085, 14, 12]} />
      </mesh>
      <mesh material={matSteel} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.2, 10]} />
      </mesh>
      <mesh material={matSteel} position={[-0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.03, 12]} />
      </mesh>
      <mesh material={matSteel} position={[0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.03, 12]} />
      </mesh>
      <mesh material={matSteel} position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.16, 8]} />
      </mesh>
      <mesh material={matGalv} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.04, 10]} />
      </mesh>
      <mesh material={matDark} position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.07, 0.008, 6, 16]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={matDark} position={[0, 0.24, 0]} rotation={[0, (i * Math.PI) / 4, 0]}>
          <boxGeometry args={[0.13, 0.012, 0.012]} />
        </mesh>
      ))}
    </group>
  );
}

export function Sensor({ position, rotation = [0, 0, 0] }: { position: Pt; rotation?: Pt }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={matSteel} position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.1, 8]} />
      </mesh>
      <mesh material={matStainless} position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
      </mesh>
      <mesh material={matDark} position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.055]} />
      </mesh>
      <mesh material={matStainless} position={[0, 0.18, 0.03]}>
        <circleGeometry args={[0.016, 12]} />
      </mesh>
      <mesh material={matSteel} position={[0.05, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
      </mesh>
    </group>
  );
}

export function Utilities() {
  const louvers = [0, 1, 2];
  return (
    <group>
      <group position={P.shelter}>
        <mesh material={matPaint} castShadow receiveShadow position={[0, 1.3, 0]}>
          <boxGeometry args={[3.6, 2.6, 2.7]} />
        </mesh>
        <mesh material={matGalv} position={[0, 2.64, 0]} castShadow>
          <boxGeometry args={[3.85, 0.08, 2.95]} />
        </mesh>
        <mesh material={matGalv} position={[0, 2.72, 0]}>
          <boxGeometry args={[3.95, 0.05, 3.05]} />
        </mesh>
        <mesh material={matGlass} position={[0, 1.55, 1.36]}>
          <boxGeometry args={[2.25, 0.7, 0.03]} />
        </mesh>
        <mesh material={matDark} position={[-1.22, 0.72, 1.36]}>
          <boxGeometry args={[0.58, 1.35, 0.04]} />
        </mesh>
        <mesh material={matGalv} position={[-1.22, 1.45, 1.62]}>
          <boxGeometry args={[0.75, 0.05, 0.55]} />
        </mesh>
        {[ -1.2, 0, 1.2 ].map((x) => (
          <mesh key={x} material={matGalv} position={[x, 2.82, 0.4]}>
            <cylinderGeometry args={[0.16, 0.16, 0.22, 12]} />
          </mesh>
        ))}
        <mesh material={matSteel} position={[1.85, 1.3, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.6, 8]} />
        </mesh>
      </group>
      <group position={P.mcc}>
        {louvers.map((i) => (
          <mesh key={i} material={matPaintCool} castShadow receiveShadow position={[0, 1.15, -1.15 + i * 1.15]}>
            <boxGeometry args={[0.82, 2.3, 1.02]} />
          </mesh>
        ))}
        {louvers.map((i) => (
          <group key={`vent-${i}`} position={[0.42, 1.4, -1.15 + i * 1.15]}>
            <mesh material={matDark}>
              <boxGeometry args={[0.015, 1.35, 0.62]} />
            </mesh>
            {[0, 1, 2, 3, 4].map((k) => (
              <mesh key={k} material={matSteel} position={[0.012, -0.5 + k * 0.24, 0]}>
                <boxGeometry args={[0.02, 0.03, 0.56]} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh material={matGalv} position={[0, 0.06, 0]} receiveShadow>
          <boxGeometry args={[1.1, 0.1, 3.6]} />
        </mesh>
        <mesh material={matGalv} position={[0, 2.36, 0]}>
          <boxGeometry args={[0.9, 0.06, 3.5]} />
        </mesh>
      </group>
      <mesh material={matSteel} castShadow position={[8.15, 0.55, -0.35]}>
        <boxGeometry args={[1.1, 1.1, 0.85]} />
      </mesh>
      <mesh material={matGalv} position={[8.15, 1.16, -0.35]}>
        <boxGeometry args={[1.18, 0.08, 0.92]} />
      </mesh>
      <mesh material={matDark} position={[8.15, 0.7, 0.1]}>
        <boxGeometry args={[0.7, 0.7, 0.04]} />
      </mesh>
    </group>
  );
}
