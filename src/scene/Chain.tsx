import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Mesh, MeshBasicMaterial, Object3D, QuadraticBezierCurve3, TubeGeometry, Vector3 } from "three";
import { BUILDINGS, INSPECT } from "../story/explore";
import { closingAmount, ramp, twinAmount, type Pt } from "../story/model";
import { sectionEnd, sectionStart } from "../story/sections";
import { exploreState, storyState } from "../story/state";

/** Roof-level anchor for each node: buildings from their footprint, the plant above its compound. */
const ANCHOR: Record<string, Pt> = {
  "U-200": [0, 13.4, 0],
  SUP: [-44, 1.6, -30],
  CUS: [-64, 1.6, 58],
};
for (const b of BUILDINGS) {
  if (!ANCHOR[b.code]) ANCHOR[b.code] = [b.at[0], b.at[1] + b.size[1] / 2 + 0.7, b.at[2]];
}

const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Every relationship the site knows about: the inspector's links, plus the outside world. */
const EDGES: string[] = (() => {
  const set = new Set<string>();
  for (const [code, info] of Object.entries(INSPECT)) {
    for (const link of info.links) if (ANCHOR[code] && ANCHOR[link]) set.add(key(code, link));
  }
  // Neighbours on the ground are linked too: everything on the site is connected to what is next to it.
  const codes = BUILDINGS.map((b) => b.code);
  for (const code of codes) {
    const [x, , z] = ANCHOR[code];
    codes
      .filter((other) => other !== code)
      .sort((p, q) => Math.hypot(ANCHOR[p][0] - x, ANCHOR[p][2] - z) - Math.hypot(ANCHOR[q][0] - x, ANCHOR[q][2] - z))
      .slice(0, 2)
      .forEach((other) => set.add(key(code, other)));
  }
  set.add(key("SUP", "T-01"));
  set.add(key("B-05", "CUS"));
  return [...set];
})();

/** Batch B-2047's own path through the site, drawn last and heavier. */
const CHAIN: [string, string][] = [
  ["SUP", "T-01"],
  ["T-01", "B-04"],
  ["B-04", "U-200"],
  ["U-200", "B-03"],
  ["B-03", "B-04"],
  ["B-03", "B-10"],
  ["B-04", "B-05"],
  ["B-05", "CUS"],
];
for (const [a, b] of CHAIN) if (!EDGES.includes(key(a, b))) EDGES.push(key(a, b));

const meshMat = new MeshBasicMaterial({ color: "#5e6872", transparent: true, opacity: 0, depthWrite: false });
const chainMat = new MeshBasicMaterial({ color: "#7a624c", transparent: true, opacity: 0, depthWrite: false });
const nodeMat = new MeshBasicMaterial({ color: "#1c2127", transparent: true, opacity: 0, depthWrite: false });
const pulseMat = new MeshBasicMaterial({ color: "#1c2127", transparent: true, opacity: 0 });
const chainPulseMat = new MeshBasicMaterial({ color: "#7a624c", transparent: true, opacity: 0 });

function section() {
  const a = sectionStart("SECTION_20_DIGITAL_TWIN");
  return { a, span: sectionEnd("SECTION_20_DIGITAL_TWIN") - a };
}

/** The whole mesh appears first, then the batch path; same timing across the twin section. */
function meshWindow(index: number, count: number) {
  const { a, span } = section();
  const from = 0.05 + (index / count) * 0.36;
  return { from: a + span * from, to: a + span * (from + 0.2) };
}

function chainWindow(index: number) {
  const { a, span } = section();
  const from = 0.58 + index * 0.05;
  return { from: a + span * from, to: a + span * (from + 0.1) };
}

/** Visibility of the connections: through the twin section, quieter in the finale, steady while exploring. */
function overall(p: number) {
  if (exploreState.on) return 0.7;
  return twinAmount(p) * (1 - closingAmount(p) * 0.4);
}

type Edge = { curve: QuadraticBezierCurve3; a: string; b: string };

function curveFor(a: string, b: string) {
  const from = new Vector3(...ANCHOR[a]);
  const to = new Vector3(...ANCHOR[b]);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  mid.y += 3 + from.distanceTo(to) * 0.2;
  return new QuadraticBezierCurve3(from, mid, to);
}

function Tube({ edge, mat, radius, window }: { edge: Edge; mat: MeshBasicMaterial; radius: number; window: { from: number; to: number } }) {
  const ref = useRef<Mesh>(null);
  const geo = useMemo(() => new TubeGeometry(edge.curve, 56, radius, 5, false), [edge, radius]);
  const total = geo.index?.count ?? 0;
  useFrame(() => {
    const p = storyState.progress;
    const drawn = exploreState.on ? 1 : ramp(p, window.from, window.to);
    geo.setDrawRange(0, Math.floor((drawn * total) / 3) * 3);
    if (ref.current) ref.current.visible = drawn > 0.002;
  });
  return <mesh ref={ref} geometry={geo} material={mat} renderOrder={4} />;
}

function Nodes() {
  const mesh = useRef<InstancedMesh>(null);
  const codes = Object.keys(ANCHOR);
  const dummy = useMemo(() => new Object3D(), []);
  useFrame(() => {
    const inst = mesh.current;
    if (!inst) return;
    const level = overall(storyState.progress);
    nodeMat.opacity = level;
    inst.visible = level > 0.02;
    if (!inst.visible) return;
    const appear = exploreState.on ? 1 : ramp(storyState.progress, section().a, section().a + section().span * 0.2);
    codes.forEach((code, i) => {
      dummy.position.set(...ANCHOR[code]);
      dummy.scale.setScalar(Math.max(0.001, appear));
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, codes.length]} material={nodeMat} frustumCulled={false} visible={false}>
      <sphereGeometry args={[0.42, 14, 10]} />
    </instancedMesh>
  );
}

/** Records moving along the connections once they are drawn. */
function Pulses({ edges, windows, mat, per, speed, size }: { edges: Edge[]; windows: { from: number; to: number }[]; mat: MeshBasicMaterial; per: number; speed: number; size: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const count = edges.length * per;
  useFrame(({ clock }) => {
    const inst = mesh.current;
    if (!inst) return;
    const p = storyState.progress;
    const level = overall(p);
    mat.opacity = level;
    inst.visible = level > 0.02;
    if (!inst.visible) return;
    for (let i = 0; i < count; i += 1) {
      const e = i % edges.length;
      const done = exploreState.on ? 1 : ramp(p, windows[e].from, windows[e].to);
      const t = (clock.elapsedTime * speed + Math.floor(i / edges.length) / per + e * 0.137) % 1;
      dummy.position.copy(edges[e].curve.getPoint(t));
      dummy.scale.setScalar(Math.max(0.001, Math.sin(t * Math.PI) * (done > 0.98 ? 1 : 0)));
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={mat} frustumCulled={false} visible={false}>
      <sphereGeometry args={[size, 10, 8]} />
    </instancedMesh>
  );
}

/** A digital twin is linked to everything: every relationship on the site, then Batch B-2047's path through it. */
export function Chain() {
  const mesh = useMemo<Edge[]>(
    () =>
      EDGES.filter((e) => !CHAIN.some(([a, b]) => key(a, b) === e)).map((e) => {
        const [a, b] = e.split("|");
        return { a, b, curve: curveFor(a, b) };
      }),
    [],
  );
  const chain = useMemo<Edge[]>(() => CHAIN.map(([a, b]) => ({ a, b, curve: curveFor(a, b) })), []);
  const meshWin = useMemo(() => mesh.map((_, i) => meshWindow(i, mesh.length)), [mesh]);
  const chainWin = useMemo(() => chain.map((_, i) => chainWindow(i)), [chain]);

  useFrame(() => {
    const level = overall(storyState.progress);
    meshMat.opacity = level * 0.85;
    chainMat.opacity = level;
  });

  return (
    <group>
      {mesh.map((edge, i) => (
        <Tube key={`${edge.a}-${edge.b}`} edge={edge} mat={meshMat} radius={0.06} window={meshWin[i]} />
      ))}
      {chain.map((edge, i) => (
        <Tube key={`c-${edge.a}-${edge.b}`} edge={edge} mat={chainMat} radius={0.13} window={chainWin[i]} />
      ))}
      <Nodes />
      <Pulses edges={mesh} windows={meshWin} mat={pulseMat} per={1} speed={0.06} size={0.2} />
      <Pulses edges={chain} windows={chainWin} mat={chainPulseMat} per={3} speed={0.09} size={0.3} />
    </group>
  );
}

