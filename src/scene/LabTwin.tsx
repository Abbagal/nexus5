import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line, Text } from "@react-three/drei";
import {
  BoxGeometry,
  DoubleSide,
  EdgesGeometry,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { labAmount, ramp } from "../story/model";
import { storyState } from "../story/state";
import { LAB_D, LAB_W, buildLabFloor } from "./lab";
import type { Bucket } from "./office";
import { BUCKETS, glassOffice, makeTiles, tileMat } from "./officeMaterials";

const FONT = "/fonts/ibm-plex-mono-500.woff";
const W = LAB_W;
const D = LAB_D;
const SLAB = 0.14;
const PITCH = 3.3;
const GLASS_H = 1.32;

const slabGeo = new BoxGeometry(W, SLAB, D);
const glassGeo = new BoxGeometry(W, GLASS_H, D);
const slabEdges = new EdgesGeometry(slabGeo);
const glassEdges = new EdgesGeometry(glassGeo);
const tiles = makeTiles(LAB_W, LAB_D);
const slabMat = new MeshStandardMaterial({ color: "#e9ecf0", roughness: 0.7, metalness: 0.08 });
const edgeMat = new LineBasicMaterial({ color: "#3c444c", transparent: true, opacity: 0.75 });

type Tag = { floor: 0 | 1; side: "l" | "r"; y: number; name: string; record: string; lines: string[] };

const TAGS: Tag[] = [
  { floor: 0, side: "l", y: 2.2, name: "Sample receiving", record: "S-7721 · Batch B-2047", lines: ["Logged 08:12", "Chain of custody OK"] },
  { floor: 0, side: "l", y: 0.3, name: "Preparation", record: "Weigh · dilute · filter", lines: ["1.0002 g · hood 2"] },
  { floor: 0, side: "r", y: 0.75, name: "Instruments", record: "HPLC assay 97.4%", lines: ["GC solvent 0.04%", "FTIR ID match 99.1%"] },
  { floor: 1, side: "l", y: 1.0, name: "LIMS review", record: "Spec 99.0–100.5%", lines: ["Result outside spec", "DEV-2047 raised"] },
  { floor: 1, side: "r", y: 1.0, name: "QA release", record: "Status · HOLD", lines: ["Batch B-2047", "CoA not issued"] },
];

const FLOOR_Y = [0.5, 0.5 + PITCH];
const WINDOW: [number, number][] = [
  [0.02, 0.5],
  [0.3, 0.8],
];

function LabFloor({ index }: { index: 0 | 1 }) {
  const root = useRef<Group>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const geos = useMemo(() => buildLabFloor(index), [index]);
  const glass = useMemo(
    () => new MeshPhysicalMaterial({ color: "#dbe3ea", metalness: 0.05, roughness: 0.08, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide }),
    [],
  );
  const office = useMemo(() => glassOffice.clone(), []);
  const [from, to] = WINDOW[index];
  const tags = TAGS.filter((tag) => tag.floor === index);

  useFrame(() => {
    const appear = ramp(labAmount(storyState.progress), from, to);
    const group = root.current;
    if (group) {
      group.visible = appear > 0.01;
      group.position.y = FLOOR_Y[index] * appear + 0.12 * (1 - appear);
      group.scale.set(0.92 + 0.08 * appear, 1, 0.92 + 0.08 * appear);
    }
    glass.opacity = appear * 0.12;
    office.opacity = 0.2 * appear;
    cards.current.forEach((card) => {
      if (card) card.style.opacity = appear > 0.85 ? String((appear - 0.85) / 0.15) : "0";
    });
  });

  return (
    <group ref={root} visible={false}>
      <mesh geometry={slabGeo} material={slabMat} castShadow receiveShadow />
      <lineSegments geometry={slabEdges} material={edgeMat} />
      <mesh geometry={glassGeo} material={glass} position={[0, GLASS_H / 2 + SLAB / 2, 0]} />
      <lineSegments geometry={glassEdges} material={edgeMat} position={[0, GLASS_H / 2 + SLAB / 2, 0]} />
      <group position={[0, SLAB / 2, 0]} scale={0.5}>
        <lineSegments geometry={tiles} material={tileMat} />
        {(Object.keys(geos) as Bucket[]).map((key) => (
          <mesh
            key={key}
            geometry={geos[key]}
            material={key === "glass" ? office : BUCKETS[key]}
            castShadow={key !== "glass" && key !== "clear"}
            receiveShadow={key !== "glass"}
          />
        ))}
      </group>
      {tags.map((tag, i) => (
        <Html key={tag.name} position={[tag.side === "r" ? W / 2 : -W / 2, tag.y, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={`org-tag ${tag.side === "r" ? "side-r" : "side-l"}`}
          >
            <span>{tag.name}</span>
            <b>{tag.record}</b>
            {tag.lines.map((line) => (
              <i key={line}>{line}</i>
            ))}
          </div>
        </Html>
      ))}
    </group>
  );
}

const RISER = { x: 0.2, z: -3.15 };
const riserMat = new MeshPhysicalMaterial({ color: "#c9d1d8", metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.4, side: DoubleSide, depthWrite: false });

/** Results leave the instruments and rise to the review floor. */
function Riser() {
  const tube = useRef<Mesh>(null);
  const pulses = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const count = 26;
  const height = PITCH + 1.4;

  useFrame(({ clock }) => {
    const u = labAmount(storyState.progress);
    const on = ramp(u, 0.25, 0.6);
    if (tube.current) {
      tube.current.visible = on > 0.01;
      tube.current.scale.set(1, Math.max(0.001, on), 1);
      tube.current.position.set(RISER.x, 0.4 + (height * on) / 2, RISER.z);
    }
    const inst = pulses.current;
    if (!inst) return;
    inst.visible = u > 0.6;
    if (!inst.visible) return;
    const live = ramp(u, 0.6, 0.9);
    for (let i = 0; i < count; i += 1) {
      const t = (clock.elapsedTime * (0.18 + (i % 4) * 0.02) + i * 0.211) % 1;
      const a = i * 2.3 + clock.elapsedTime;
      dummy.position.set(RISER.x + Math.cos(a) * 0.12, 0.6 + t * (height - 0.4), RISER.z + Math.sin(a) * 0.12);
      dummy.scale.setScalar(Math.max(0.001, Math.sin(t * Math.PI) * live));
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={tube} material={riserMat} visible={false}>
        <cylinderGeometry args={[0.24, 0.24, height, 20, 1, true]} />
      </mesh>
      <instancedMesh ref={pulses} args={[undefined, undefined, count]} visible={false} frustumCulled={false}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshStandardMaterial color="#8a7360" roughness={0.35} metalness={0.3} emissive="#7a624c" emissiveIntensity={0.55} />
      </instancedMesh>
    </group>
  );
}

/** A retention-time trace: baseline, solvent front, the main peak and two small impurities. */
const TRACE: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  const peaks = [
    { at: 0.14, h: 0.32, w: 0.012 },
    { at: 0.42, h: 0.62, w: 0.02 },
    { at: 0.5, h: 0.2, w: 0.012 },
    { at: 0.71, h: 0.13, w: 0.014 },
  ];
  for (let i = 0; i <= 260; i += 1) {
    const x = i / 260;
    let y = 0.04 + Math.sin(x * 40) * 0.004;
    for (const peak of peaks) y += peak.h * Math.exp(-((x - peak.at) ** 2) / (2 * peak.w * peak.w));
    pts.push([x * 6.2, y * 2.0, 0]);
  }
  return pts;
})();

const panelMat = new MeshBasicMaterial({ color: "#f3f4f6", transparent: true, opacity: 0, depthWrite: false });
const panelEdges = new EdgesGeometry(new BoxGeometry(7.0, 3.3, 0.04));

/** The analysis result floating above the lab: chromatogram, specification and the release decision. */
function Panel() {
  const root = useRef<Group>(null);
  const sweep = useRef<Group>(null);
  const text = useRef<Group>(null);
  useFrame(() => {
    const u = labAmount(storyState.progress);
    const on = ramp(u, 0.55, 0.85);
    const draw = ramp(u, 0.7, 0.98);
    panelMat.opacity = on * 0.85;
    if (root.current) root.current.visible = on > 0.01;
    if (sweep.current) sweep.current.scale.set(Math.max(0.001, draw), 1, 1);
    if (text.current) text.current.visible = draw > 0.6;
  });
  return (
    <group ref={root} position={[0.3, 8.6, -1.2]} visible={false}>
      <mesh material={panelMat}>
        <boxGeometry args={[7.0, 3.3, 0.04]} />
      </mesh>
      <lineSegments geometry={panelEdges} material={edgeMat} />
      <Text position={[-3.25, 1.35, 0.05]} fontSize={0.24} color="#3c444c" anchorX="left" letterSpacing={0.08} font={FONT}>
        HPLC · SAMPLE S-7721 · BATCH B-2047
      </Text>
      <group position={[-3.1, -1.25, 0.05]}>
        <group ref={sweep}>
          <Line points={TRACE} color="#1c2127" lineWidth={1.8} />
        </group>
        <Line points={[[0, 0, 0], [6.2, 0, 0]]} color="#8b939c" lineWidth={1} />
        <group ref={text}>
          <Line points={[[6.2 * 0.42, 0, 0], [6.2 * 0.42, 1.4, 0]]} color="#7a624c" lineWidth={1.4} dashed dashSize={0.08} gapSize={0.06} />
          <Text position={[6.2 * 0.42 + 0.1, 1.42, 0]} fontSize={0.22} color="#7a624c" anchorX="left" font={FONT}>
            Assay 97.4%
          </Text>
          <Text position={[6.2 * 0.42 + 0.1, 1.04, 0]} fontSize={0.17} color="#5e6872" anchorX="left" font={FONT}>
            spec 99.0–100.5%
          </Text>
          <Text position={[4.6, 1.35, 0]} fontSize={0.34} color="#7a624c" anchorX="left" letterSpacing={0.14} font={FONT}>
            HOLD
          </Text>
        </group>
      </group>
    </group>
  );
}

const plinthMat = new MeshStandardMaterial({ color: "#d8dee4", roughness: 0.85, metalness: 0.05 });
const plinthGeo = new BoxGeometry(W + 2.4, 0.12, D + 2.4);
const plinthEdges = new EdgesGeometry(plinthGeo);
const RINGS = 3;
const ringMats = Array.from({ length: RINGS }, () => new MeshBasicMaterial({ color: "#5e6872", transparent: true, opacity: 0, depthWrite: false }));

function Ground() {
  const plinth = useRef<Group>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const u = labAmount(storyState.progress);
    const base = ramp(u, 0, 0.2);
    if (plinth.current) {
      plinth.current.visible = base > 0.01;
      plinth.current.scale.set(Math.max(0.001, base), 1, Math.max(0.001, base));
    }
    const on = ramp(u, 0.35, 0.8);
    rings.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = (clock.elapsedTime * 0.12 + i / RINGS) % 1;
      const r = 8.4 + t * 8.5;
      mesh.scale.set(r, r, 1);
      mesh.visible = on > 0.01;
      ringMats[i].opacity = on * Math.sin(t * Math.PI) * 0.6;
    });
  });
  return (
    <>
      <group ref={plinth} visible={false}>
        <mesh geometry={plinthGeo} material={plinthMat} position={[0, 0.06, 0]} receiveShadow castShadow />
        <lineSegments geometry={plinthEdges} material={edgeMat} position={[0, 0.06, 0]} />
        <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, D / 2 + 0.95]} fontSize={0.4} color="#8b939c" anchorX="center" letterSpacing={0.22} font={FONT}>
          B-03 QUALITY CONTROL LAB
        </Text>
      </group>
      {ringMats.map((mat, i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m;
          }}
          material={mat}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.2, 0]}
          visible={false}
        >
          <ringGeometry args={[0.985, 1, 96]} />
        </mesh>
      ))}
    </>
  );
}

/** The QC laboratory's twin: sample receiving, preparation, instruments, LIMS review and release. */
export function LabTwin() {
  return (
    <group>
      <Ground />
      <Riser />
      <Panel />
      <LabFloor index={0} />
      <LabFloor index={1} />
    </group>
  );
}
