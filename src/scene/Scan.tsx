import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Group, MeshBasicMaterial } from "three";
import { storyState } from "../story/state";

const glowMat = new MeshBasicMaterial({ color: "#7a624c", transparent: true, opacity: 0, depthWrite: false });

/**
 * A scan line sweeping up a twin's footprint as it materialises, and back down as it leaves.
 * `amount` is the same 0–1 value that builds the twin, so the sweep and the build stay in step.
 */
export function Scan({
  center,
  w,
  d,
  h,
  amount,
}: {
  center: [number, number];
  w: number;
  d: number;
  h: number;
  amount: (p: number) => number;
}) {
  const root = useRef<Group>(null);
  const line = useRef<{ material: { opacity: number } } | null>(null);
  const glow = useMaterialFor();
  const hw = w / 2;
  const hd = d / 2;

  useFrame(() => {
    const a = amount(storyState.progress);
    const group = root.current;
    if (!group) return;
    const live = a > 0.02 && a < 0.985;
    group.visible = live;
    if (!live) return;
    group.position.y = 0.3 + a * h;
    const fade = Math.sqrt(Math.sin(Math.PI * a));
    if (line.current) line.current.material.opacity = fade * 0.95;
    glow.opacity = fade * 0.1;
  });

  return (
    <group ref={root} position={[center[0], 0, center[1]]} visible={false}>
      <Line
        ref={line as never}
        points={[
          [-hw, 0, -hd],
          [hw, 0, -hd],
          [hw, 0, hd],
          [-hw, 0, hd],
          [-hw, 0, -hd],
        ]}
        color="#7a624c"
        lineWidth={2.2}
        transparent
        opacity={0}
        depthWrite={false}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={glow}>
        <planeGeometry args={[w, d]} />
      </mesh>
    </group>
  );
}

function useMaterialFor() {
  const ref = useRef<MeshBasicMaterial | null>(null);
  if (!ref.current) ref.current = glowMat.clone();
  return ref.current;
}
