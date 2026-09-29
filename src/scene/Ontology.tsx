import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { keepOnScreen } from "./Systems";
import {
  EDGES,
  NODES,
  focusSet,
  lerp,
  ontologyAppear,
  centreHold,
  ramp,
  type GraphNode,
} from "../story/model";
import { sectionEnd, sectionStart } from "../story/sections";
import { storyState } from "../story/state";

const Y_AXIS = new Vector3(0, 1, 0);
const nodeAt = new Map(NODES.map((node) => [node.id, node.at]));

function NodeMark({ node, index }: { node: GraphNode; index: number }) {
  const root = useRef<Group>(null);
  const card = useRef<HTMLDivElement>(null);
  const disc = useMemo(() => new MeshBasicMaterial({ color: "#243038", transparent: true, depthWrite: false }), []);
  const anchor = useMemo(() => new Vector3(...node.at), [node.at]);

  useFrame(({ camera, size }) => {
    const p = storyState.progress;
    const appear = ontologyAppear(p, index, NODES.length) * (1 - centreHold(p));
    const focus = focusSet(p);
    const hot = !focus || focus.has(node.id);
    const emphasis = focus ? (hot ? 1 : 0.16) : 1;
    const finale = sectionStart("SECTION_21_FINAL");
    const settle = p < finale ? 1 : lerp(1, 0.4, ramp(p, finale, 1));
    const opacity = appear * emphasis * (focus ? 1 : settle);
    disc.opacity = opacity;
    if (root.current) {
      root.current.visible = appear > 0.02;
      root.current.scale.setScalar(focus && hot ? 1.25 : 1);
    }
    if (card.current) {
      const inGraph = p >= sectionStart("SECTION_10_ONTOLOGY") && p < sectionEnd("SECTION_13_ANSWER");
      const shown = inGraph && appear > 0.35 && (!focus || hot);
      card.current.style.opacity = shown ? "1" : "0";
      keepOnScreen(card.current, anchor, camera, size.width, size.height, true);
    }
  });

  return (
    <group ref={root} position={node.at}>
      <mesh material={disc}>
        <sphereGeometry args={[0.07, 16, 12]} />
      </mesh>
      <Html position={[0, 0.16, 0]} center zIndexRange={[8, 0]} style={{ pointerEvents: "none" }}>
        <div ref={card} className="rel-tag">
          {node.label}
        </div>
      </Html>
    </group>
  );
}

function Edge({ a, b, index }: { a: string; b: string; index: number }) {
  const ref = useRef<Mesh>(null);
  const material = useMemo(
    () => new MeshBasicMaterial({ color: "#5e6872", transparent: true, depthWrite: false }),
    [],
  );
  const start = useMemo(() => new Vector3(...(nodeAt.get(a) ?? [0, 0, 0])), [a]);
  const end = useMemo(() => new Vector3(...(nodeAt.get(b) ?? [0, 0, 0])), [b]);
  const dir = useMemo(() => new Vector3(), []);
  const mid = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const p = storyState.progress;
    const drawn = ontologyAppear(p, index, EDGES.length) * (1 - centreHold(p));
    const focus = focusSet(p);
    const touched = !focus || focus.has(a) || focus.has(b);
    const emphasis = focus ? (touched ? 1 : 0.05) : 1;
    const finale = sectionStart("SECTION_21_FINAL");
    const settle = p < finale ? 0.55 : lerp(0.55, 0.16, ramp(p, finale, 1));
    material.opacity = drawn * emphasis * (focus ? 0.9 : settle);
    const length = start.distanceTo(end);
    dir.copy(end).sub(start).normalize();
    mid.copy(start).addScaledVector(dir, (length * drawn) / 2);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(Y_AXIS, dir);
    mesh.scale.set(1, Math.max(0.001, length * drawn), 1);
    mesh.visible = drawn > 0.02;
  });

  return (
    <mesh ref={ref} material={material}>
      <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
    </mesh>
  );
}

export function Ontology() {
  return (
    <group>
      {EDGES.map((edge, index) => (
        <Edge key={`${edge.a}-${edge.b}`} a={edge.a} b={edge.b} index={index} />
      ))}
      {NODES.map((node, index) => (
        <NodeMark key={node.id} node={node} index={index} />
      ))}
    </group>
  );
}
