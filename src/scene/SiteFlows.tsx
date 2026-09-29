import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Mesh, MeshBasicMaterial, Vector3 } from "three";
import { SITE_FLOWS, adminLink, closingAmount, qcLink, whLink, mfgLink, twinAmount, type SiteFlow } from "../story/model";
import { storyState } from "../story/state";

const FLOW_Y = 0.16;
const INK = "#1c2127";
const MUTED = "#5e6872";
const WARM = "#7a624c";

const pulseMuted = new MeshBasicMaterial({ color: MUTED, transparent: true, opacity: 0, depthWrite: false });
const pulseWarm = new MeshBasicMaterial({ color: WARM, transparent: true, opacity: 0, depthWrite: false });
const nodeMat = new MeshBasicMaterial({ color: INK, transparent: true, opacity: 0, depthWrite: false });

function Flow({ flow }: { flow: SiteFlow }) {
  const line = useRef<{ material: { opacity: number } } | null>(null);
  const pulses = useRef<(Mesh | null)[]>([]);
  const { points, lengths, total } = useMemo(() => {
    const pts = flow.points.map(([x, z]) => new Vector3(x, FLOW_Y, z));
    const segs = pts.slice(1).map((pt, i) => pt.distanceTo(pts[i]));
    return { points: pts, lengths: segs, total: segs.reduce((a, b) => a + b, 0) };
  }, [flow]);
  const count = Math.max(1, Math.round(total / 18));

  useFrame(({ clock }) => {
    const p = storyState.progress;
    const twin = Math.max(twinAmount(p) * (1 - closingAmount(p)), flow.id === "planning" ? adminLink(p) : flow.id === "sample" ? qcLink(p) : flow.id === "product" ? whLink(p) : flow.id === "manufacturing" ? mfgLink(p) : 0);
    if (line.current) line.current.material.opacity = twin * (flow.linked ? 0.9 : 0.55);
    const speed = 7;
    pulses.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.visible = twin > 0.02;
      let d = (clock.elapsedTime * speed + (i / count) * total) % total;
      let s = 0;
      while (s < lengths.length - 1 && d > lengths[s]) {
        d -= lengths[s];
        s += 1;
      }
      mesh.position.lerpVectors(points[s], points[s + 1], Math.min(1, d / lengths[s]));
    });
  });

  return (
    <group>
      <Line
        ref={line as never}
        points={points}
        color={flow.linked ? WARM : MUTED}
        lineWidth={flow.linked ? 2.6 : 1.6}
        transparent
        opacity={0}
        depthWrite={false}
      />
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            pulses.current[i] = m;
          }}
          material={flow.linked ? pulseWarm : pulseMuted}
          visible={false}
        >
          <sphereGeometry args={[0.5, 10, 8]} />
        </mesh>
      ))}
      {[points[0], points[points.length - 1]].map((pt, i) => (
        <mesh key={i} position={pt} material={nodeMat} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.75, 20]} />
        </mesh>
      ))}
    </group>
  );
}

/** Relationships between every building on the site, shown once the twin opens. */
export function SiteFlows() {
  useFrame(() => {
    const twin = twinAmount(storyState.progress) * (1 - closingAmount(storyState.progress));
    pulseMuted.opacity = twin * 0.8;
    pulseWarm.opacity = twin * 0.95;
    nodeMat.opacity = twin * 0.7;
  });
  return (
    <group>
      {SITE_FLOWS.map((flow) => (
        <Flow key={flow.id} flow={flow} />
      ))}
    </group>
  );
}
