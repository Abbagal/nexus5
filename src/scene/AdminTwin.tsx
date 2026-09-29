import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
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
import { ORG_TREE, orgAmount, ramp } from "../story/model";
import { storyState } from "../story/state";
import { buildFloor, type Bucket } from "./office";
import { BUCKETS, glassOffice, ledAMat, ledBMat, screenMat, tileGeo, tileMat } from "./officeMaterials";

const FONT = "/fonts/ibm-plex-mono-500.woff";

const W = 9;
const D = 6;
const SLAB = 0.14;
const PITCH = 2.35;

const slabGeo = new BoxGeometry(W, SLAB, D);
const GLASS_H = 1.32;
const glassGeo = new BoxGeometry(W, GLASS_H, D);
const slabEdges = new EdgesGeometry(slabGeo);
const glassEdges = new EdgesGeometry(glassGeo);
const plinthGeo = new BoxGeometry(W + 2.2, 0.12, D + 2.2);
const plinthEdges = new EdgesGeometry(plinthGeo);

const slabMat = new MeshStandardMaterial({ color: "#e9ecf0", roughness: 0.7, metalness: 0.08 });
const edgeMat = new LineBasicMaterial({ color: "#3c444c", transparent: true, opacity: 0.75 });
const coreMat = new MeshPhysicalMaterial({
  color: "#c9d1d8",
  metalness: 0.5,
  roughness: 0.2,
  transparent: true,
  opacity: 0.45,
  side: DoubleSide,
  depthWrite: false,
});

const FLOORS = ORG_TREE.map((dept, index) => ({ ...dept, index, y: index * PITCH + 0.5 }));
const HEIGHT = FLOORS[FLOORS.length - 1].y;
const CORE_H = HEIGHT + 1.4;

function Floor({ floor }: { floor: (typeof FLOORS)[number] }) {
  const root = useRef<Group>(null);
  const card = useRef<HTMLDivElement>(null);
  const glass = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: "#dbe3ea",
        metalness: 0.05,
        roughness: 0.08,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  );
  const geos = useMemo(() => buildFloor(floor.index), [floor.index]);
  const office = useMemo(() => glassOffice.clone(), []);
  const top = floor.index === FLOORS.length - 1;
  const right = floor.index !== 3 && floor.index !== 5;
  const start = 0.02 + floor.index * 0.085;
  const end = start + 0.32;

  useFrame(() => {
    const appear = ramp(orgAmount(storyState.progress), start, end);
    const group = root.current;
    if (group) {
      group.visible = appear > 0.01;
      group.position.y = floor.y * appear + 0.12 * (1 - appear);
      group.scale.set(0.9 + 0.1 * appear, 1, 0.9 + 0.1 * appear);
    }
    glass.opacity = appear * 0.12;
    office.opacity = 0.2 * appear;
    if (card.current) card.current.style.opacity = appear > 0.85 ? String((appear - 0.85) / 0.15) : "0";
  });

  return (
    <group ref={root} visible={false}>
      <mesh geometry={slabGeo} material={slabMat} castShadow receiveShadow />
      <lineSegments geometry={slabEdges} material={edgeMat} />
      <mesh geometry={glassGeo} material={glass} position={[0, GLASS_H / 2 + SLAB / 2, 0]} />
      <lineSegments geometry={glassEdges} material={edgeMat} position={[0, GLASS_H / 2 + SLAB / 2, 0]} />
      <group position={[0, SLAB / 2, 0]} scale={0.5}>
        <lineSegments geometry={tileGeo} material={tileMat} />
        {(Object.keys(geos) as Bucket[]).map((key) => (
          <mesh
            key={key}
            geometry={geos[key]}
            material={key === "glass" ? office : BUCKETS[key]}
            castShadow={key !== "glass" && key !== "carpet"}
            receiveShadow={key !== "glass"}
          />
        ))}
      </group>
      <Html position={[right ? W / 2 : -W / 2, 0.5, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div ref={card} className={`org-tag ${right ? "side-r" : "side-l"}${top ? " is-top" : ""}`}>
          <span>{floor.name}</span>
          <b>{floor.record}</b>
          <i>{floor.teams.map(([team]) => team).join(" · ")}</i>
        </div>
      </Html>
    </group>
  );
}

/** The data core: every floor's records rise to the top and the reports come back down. */
function Core() {
  const shell = useRef<Mesh>(null);
  const pulses = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const count = 46;

  useFrame(({ clock }) => {
    const u = orgAmount(storyState.progress);
    screenMat.emissiveIntensity = 0.5 + Math.sin(clock.elapsedTime * 1.3) * 0.12;
    ledAMat.color.set(Math.sin(clock.elapsedTime * 5) > 0.2 ? "#d1a877" : "#8f7455");
    ledBMat.color.set(Math.sin(clock.elapsedTime * 3.1 + 1) > -0.1 ? "#e3ecf3" : "#a9b6c1");
    const on = ramp(u, 0.1, 0.55);
    if (shell.current) {
      shell.current.visible = on > 0.01;
      shell.current.scale.set(1, Math.max(0.001, on), 1);
      shell.current.position.y = (CORE_H * on) / 2;
    }
    const inst = pulses.current;
    if (!inst) return;
    inst.visible = u > 0.55;
    if (!inst.visible) return;
    const live = ramp(u, 0.55, 0.9);
    for (let i = 0; i < count; i += 1) {
      const up = i % 2 === 0;
      const t = (clock.elapsedTime * (0.16 + (i % 5) * 0.02) + i * 0.173) % 1;
      const y = 0.3 + (up ? t : 1 - t) * (CORE_H - 0.6);
      const a = i * 2.4 + clock.elapsedTime * 0.6;
      dummy.position.set(Math.cos(a) * 0.32, y, Math.sin(a) * 0.32);
      dummy.scale.setScalar(Math.max(0.001, Math.sin(t * Math.PI) * live));
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={shell} material={coreMat} visible={false}>
        <cylinderGeometry args={[0.55, 0.55, CORE_H, 24, 1, true]} />
      </mesh>
      <instancedMesh ref={pulses} args={[undefined, undefined, count]} visible={false} frustumCulled={false}>
        <sphereGeometry args={[0.07, 10, 8]} />
        <meshStandardMaterial color="#8a7360" roughness={0.35} metalness={0.3} emissive="#7a624c" emissiveIntensity={0.55} />
      </instancedMesh>
    </group>
  );
}

const RINGS = 3;
const ringMats = Array.from({ length: RINGS }, () => new MeshBasicMaterial({ color: "#5e6872", transparent: true, opacity: 0, depthWrite: false }));

/** Rings leave the tower across the pad, the way the twin reaches out to the rest of the site. */
function Rings() {
  const refs = useRef<(Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const on = ramp(orgAmount(storyState.progress), 0.35, 0.8);
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = (clock.elapsedTime * 0.12 + i / RINGS) % 1;
      const r = 6.4 + t * 8.5;
      mesh.scale.set(r, r, 1);
      mesh.visible = on > 0.01;
      ringMats[i].opacity = on * Math.sin(t * Math.PI) * 0.6;
    });
  });
  return (
    <>
      {ringMats.map((mat, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
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

const plinthMat = new MeshStandardMaterial({ color: "#d8dee4", roughness: 0.85, metalness: 0.05 });

function Plinth() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const on = ramp(orgAmount(storyState.progress), 0, 0.2);
    if (ref.current) {
      ref.current.visible = on > 0.01;
      ref.current.scale.set(Math.max(0.001, on), 1, Math.max(0.001, on));
    }
  });
  return (
    <group ref={ref} visible={false}>
      <mesh geometry={plinthGeo} material={plinthMat} position={[0, 0.06, 0]} receiveShadow castShadow />
      <lineSegments geometry={plinthEdges} material={edgeMat} position={[0, 0.06, 0]} />
      <Text
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.14, D / 2 + 0.85]}
        fontSize={0.4}
        color="#8b939c"
        anchorX="center"
        letterSpacing={0.22}
        font={FONT}
      >
        B-10 ADMINISTRATION
      </Text>
    </group>
  );
}

/** The administration building's twin: one glass floor per department, executive on top, a data core through the middle. */
export function AdminTwin() {
  return (
    <group>
      <Plinth />
      <Rings />
      <Core />
      {FLOORS.map((floor) => (
        <Floor key={floor.name} floor={floor} />
      ))}
    </group>
  );
}
