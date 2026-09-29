import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Text } from "@react-three/drei";
import {
  BoxGeometry,
  DoubleSide,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
} from "three";
import { ramp, whAmount } from "../story/model";
import { storyState } from "../story/state";
import type { Bucket, FloorGeo } from "./office";
import { BUCKETS, glassOffice, makeTiles, tileMat } from "./officeMaterials";
import { WH_D, WH_H, WH_W, buildForklift, buildWarehouse } from "./warehouse";

const FONT = "/fonts/ibm-plex-mono-500.woff";
const W = WH_W;
const D = WH_D;
const SLAB = 0.14;
const GLASS_H = WH_H / 2;
const FLOOR_Y = 0.5;

const slabGeo = new BoxGeometry(W, SLAB, D);
const glassGeo = new BoxGeometry(W, GLASS_H, D);
const slabEdges = new EdgesGeometry(slabGeo);
const glassEdges = new EdgesGeometry(glassGeo);
const tiles = makeTiles(WH_W, WH_D);
const slabMat = new MeshStandardMaterial({ color: "#e4e8ec", roughness: 0.75, metalness: 0.06 });
const edgeMat = new LineBasicMaterial({ color: "#3c444c", transparent: true, opacity: 0.7 });

type Tag = { side: "l" | "r"; y: number; name: string; record: string; lines: string[] };

const TAGS: Tag[] = [
  { side: "l", y: 3.3, name: "Raw materials", record: "RM-1832 · Helion Chemicals", lines: ["320 pallets · 18 lots", "CoA 7781 · released"] },
  { side: "l", y: 0.6, name: "Goods in", record: "Lot RM-1833 inbound", lines: ["Dock 1 · truck 3 of 6", "Inspect · scan · put away"] },
  { side: "r", y: 3.3, name: "Finished goods", record: "Northline Polymers · SO-5520", lines: ["1,240 drums in stock", "B-2046 · released"] },
  { side: "r", y: 0.6, name: "Quarantine", record: "B-2047 · 48 drums · HOLD", lines: ["Awaiting QC release", "DEV-2047"] },
];

function Meshes({ geos, glass, shadows = true }: { geos: FloorGeo; glass: MeshPhysicalMaterial; shadows?: boolean }) {
  return (
    <>
      {(Object.keys(geos) as Bucket[]).map((key) => (
        <mesh
          key={key}
          geometry={geos[key]}
          material={key === "glass" ? glass : BUCKETS[key]}
          castShadow={shadows && key !== "glass" && key !== "clear"}
          receiveShadow={key !== "glass"}
        />
      ))}
    </>
  );
}

const forkGeoLoaded = buildForklift(true, 5);
const forkGeoEmpty = buildForklift(false, 9);

/** A forklift working an aisle: down to one end, turn, and back. */
function Forklift({ z, loaded, speed, phase }: { z: number; loaded: boolean; speed: number; phase: number }) {
  const ref = useRef<Group>(null);
  const span = 11.6;
  const glass = useMemo(() => glassOffice.clone(), []);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = (clock.elapsedTime * speed + phase) % 1;
    let x: number;
    let yaw: number;
    if (t < 0.46) {
      x = -span + (t / 0.46) * span * 2;
      yaw = Math.PI / 2;
    } else if (t < 0.5) {
      x = span;
      yaw = Math.PI / 2 - ((t - 0.46) / 0.04) * Math.PI;
    } else if (t < 0.96) {
      x = span - ((t - 0.5) / 0.46) * span * 2;
      yaw = -Math.PI / 2;
    } else {
      x = -span;
      yaw = -Math.PI / 2 + ((t - 0.96) / 0.04) * Math.PI;
    }
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
  });
  return (
    <group ref={ref}>
      <Meshes geos={loaded ? forkGeoLoaded : forkGeoEmpty} glass={glass} />
    </group>
  );
}

function WarehouseFloor() {
  const root = useRef<Group>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const geos = useMemo(() => buildWarehouse(), []);
  const glass = useMemo(
    () => new MeshPhysicalMaterial({ color: "#dbe3ea", metalness: 0.05, roughness: 0.08, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide }),
    [],
  );
  const office = useMemo(() => glassOffice.clone(), []);

  useFrame(() => {
    const appear = ramp(whAmount(storyState.progress), 0.02, 0.7);
    const group = root.current;
    if (group) {
      group.visible = appear > 0.01;
      group.position.y = FLOOR_Y * appear + 0.12 * (1 - appear);
      group.scale.set(0.94 + 0.06 * appear, 0.85 + 0.15 * appear, 0.94 + 0.06 * appear);
    }
    glass.opacity = appear * 0.07;
    office.opacity = 0.2 * appear;
    cards.current.forEach((card) => {
      if (card) card.style.opacity = appear > 0.9 ? String((appear - 0.9) / 0.1) : "0";
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
        <Meshes geos={geos} glass={office} />
        <Forklift z={-6.4} loaded speed={0.012} phase={0.1} />
        <Forklift z={-1.6} loaded={false} speed={0.016} phase={0.62} />
      </group>
      {TAGS.map((tag, i) => (
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

const STOCK: { label: string; value: number; note: string; warm?: boolean }[] = [
  { label: "Raw materials", value: 0.78, note: "78%" },
  { label: "Finished goods", value: 0.64, note: "64%" },
  { label: "Hazmat store", value: 0.41, note: "41%" },
  { label: "Quarantine", value: 0.04, note: "48 drums", warm: true },
];

const panelMat = new MeshBasicMaterial({ color: "#f3f4f6", transparent: true, opacity: 0, depthWrite: false });
const panelEdges = new EdgesGeometry(new BoxGeometry(7.4, 3.3, 0.04));
const trackMat = new MeshBasicMaterial({ color: "#d5dae1" });
const fillMat = new MeshBasicMaterial({ color: "#3c444c" });
const warmMat = new MeshBasicMaterial({ color: "#7a624c" });

/** Stock levels floating above the warehouse. */
function Panel() {
  const root = useRef<Group>(null);
  const fills = useRef<(Mesh | null)[]>([]);
  const text = useRef<Group>(null);
  useFrame(() => {
    const u = whAmount(storyState.progress);
    const on = ramp(u, 0.55, 0.85);
    const draw = ramp(u, 0.7, 0.98);
    panelMat.opacity = on * 0.85;
    if (root.current) root.current.visible = on > 0.01;
    if (text.current) text.current.visible = draw > 0.6;
    fills.current.forEach((mesh, i) => {
      if (!mesh) return;
      const w = Math.max(0.001, STOCK[i].value * draw);
      mesh.scale.x = w;
      mesh.position.x = -1.2 + (w * 4.6) / 2;
    });
  });
  return (
    <group ref={root} position={[0.2, 8.6, -1.2]} visible={false}>
      <mesh material={panelMat}>
        <boxGeometry args={[7.4, 3.3, 0.04]} />
      </mesh>
      <lineSegments geometry={panelEdges} material={edgeMat} />
      <Text position={[-3.4, 1.3, 0.05]} fontSize={0.24} color="#3c444c" anchorX="left" letterSpacing={0.08} font={FONT}>
        STOCK · B-04 WAREHOUSE
      </Text>
      {STOCK.map((row, i) => (
        <group key={row.label} position={[0, 0.5 - i * 0.62, 0.05]}>
          <Text position={[-3.4, 0, 0]} fontSize={0.19} color="#5e6872" anchorX="left" font={FONT}>
            {row.label}
          </Text>
          <mesh material={trackMat} position={[1.1, 0, 0]}>
            <boxGeometry args={[4.6, 0.16, 0.01]} />
          </mesh>
          <mesh
            ref={(m) => {
              fills.current[i] = m;
            }}
            material={row.warm ? warmMat : fillMat}
            position={[-1.2, 0, 0.01]}
            scale={[0.001, 1, 1]}
          >
            <boxGeometry args={[4.6, 0.16, 0.01]} />
          </mesh>
        </group>
      ))}
      <group ref={text}>
        {STOCK.map((row, i) => (
          <Text key={row.label} position={[3.55, 0.5 - i * 0.62, 0.06]} fontSize={0.19} color={row.warm ? "#7a624c" : "#1c2127"} anchorX="right" font={FONT}>
            {row.note}
          </Text>
        ))}
      </group>
    </group>
  );
}

const plinthMat = new MeshStandardMaterial({ color: "#d8dee4", roughness: 0.85, metalness: 0.05 });
const plinthGeo = new BoxGeometry(W + 2.6, 0.12, D + 2.6);
const plinthEdges = new EdgesGeometry(plinthGeo);
const RINGS = 3;
const ringMats = Array.from({ length: RINGS }, () => new MeshBasicMaterial({ color: "#5e6872", transparent: true, opacity: 0, depthWrite: false }));

function Ground() {
  const plinth = useRef<Group>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const u = whAmount(storyState.progress);
    const base = ramp(u, 0, 0.2);
    if (plinth.current) {
      plinth.current.visible = base > 0.01;
      plinth.current.scale.set(Math.max(0.001, base), 1, Math.max(0.001, base));
    }
    const on = ramp(u, 0.35, 0.8);
    rings.current.forEach((mesh, i) => {
      if (!mesh) return;
      const t = (clock.elapsedTime * 0.12 + i / RINGS) % 1;
      const r = 10 + t * 8;
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
        <Text rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, D / 2 + 1.05]} fontSize={0.4} color="#8b939c" anchorX="center" letterSpacing={0.22} font={FONT}>
          B-04 WAREHOUSE
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

/** The warehouse twin: raw-material racking, finished drums, quarantine, docks and live stock. */
export function WarehouseTwin() {
  return (
    <group>
      <Ground />
      <Panel />
      <WarehouseFloor />
    </group>
  );
}
