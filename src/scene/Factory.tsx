import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Vector3 } from "three";
import { SITE_AREAS, adminFocus, closingAmount, qcFocus, warehouseFocus, mfgFocus, plantSink, ramp, twinAmount, type Pt, type SiteArea } from "../story/model";
import { sectionById } from "../story/sections";
import { exploreState, storyState } from "../story/state";
import {
  hallAdmin,
  hallControl,
  deptGeo,
  hallLab,
  hallMaint,
  plantCompound,
  hallNorth,
  hallPack,
  hallProduction,
  hallUtility,
  hallWarehouse,
  hallWaste,
  largeTankGeo,
  drumGeo,
  rackEast,
  rackNorth,
  rackWest,
  siteDetailGeo,
  tankGeo,
  towerGeo,
  transformerGeo,
  type BuildingGeo,
} from "./build";
import {
  matCladding,
  matCladdingCool,
  matConcrete,
  matDark,
  matGalv,
  matGlass,
  matMarking,
  matPaint,
  matPaintCool,
  matSteel,
} from "./materials";
import { SiteFlows } from "./SiteFlows";

const capRects: DOMRect[] = [];
let capFrame = -1;

function captionRects(frame: number) {
  if (frame === capFrame) return capRects;
  capFrame = frame;
  capRects.length = 0;
  document.querySelectorAll<HTMLElement>(".cap").forEach((cap) => {
    const style = getComputedStyle(cap);
    if (style.visibility === "hidden" || Number(style.opacity) <= 0.05) return;
    if (cap.classList.contains("finale")) {
      for (const child of cap.children) capRects.push(child.getBoundingClientRect());
    } else {
      capRects.push(cap.getBoundingClientRect());
    }
  });
  return capRects;
}

function Built({
  geo,
  position,
  rotation = 0,
  cool = false,
}: {
  geo: BuildingGeo;
  position: Pt;
  rotation?: number;
  cool?: boolean;
}) {
  const wall = cool ? matCladdingCool : matCladding;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {geo.concrete ? <mesh geometry={geo.concrete} material={matConcrete} receiveShadow /> : null}
      {geo.wall ? <mesh geometry={geo.wall} material={wall} castShadow receiveShadow /> : null}
      {geo.metal ? <mesh geometry={geo.metal} material={matGalv} castShadow /> : null}
      {geo.dark ? <mesh geometry={geo.dark} material={matDark} /> : null}
      {geo.glass ? <mesh geometry={geo.glass} material={matGlass} /> : null}
    </group>
  );
}

function SiteDetail() {
  const geo = siteDetailGeo;
  return (
    <group>
      {geo.concrete ? <mesh geometry={geo.concrete} material={matConcrete} receiveShadow /> : null}
      {geo.marking ? <mesh geometry={geo.marking} material={matMarking} receiveShadow /> : null}
      {geo.container ? <mesh geometry={geo.container} material={matCladdingCool} castShadow receiveShadow /> : null}
      {geo.metal ? <mesh geometry={geo.metal} material={matGalv} castShadow /> : null}
      {geo.dark ? <mesh geometry={geo.dark} material={matDark} castShadow /> : null}
      {geo.glass ? <mesh geometry={geo.glass} material={matGlass} /> : null}
    </group>
  );
}

function Tanks({ position }: { position: Pt }) {
  return (
    <group position={position}>
      <mesh material={matConcrete} position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[9.6, 0.12, 8.6]} />
      </mesh>
      <mesh material={matConcrete} position={[0, 0.48, 4.15]}>
        <boxGeometry args={[9.6, 0.72, 0.16]} />
      </mesh>
      <mesh material={matConcrete} position={[0, 0.48, -4.15]}>
        <boxGeometry args={[9.6, 0.72, 0.16]} />
      </mesh>
      <mesh material={matConcrete} position={[4.75, 0.48, 0]}>
        <boxGeometry args={[0.16, 0.72, 8.3]} />
      </mesh>
      <mesh material={matConcrete} position={[-4.75, 0.48, 0]}>
        <boxGeometry args={[0.16, 0.72, 8.3]} />
      </mesh>
      <mesh material={matGalv} position={[0, 0.5, 0.1]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 8.4, 12]} />
      </mesh>
      {[-3.4, 0, 3.4].map((x) => (
        <mesh key={x} material={matConcrete} position={[x, 0.2, 0.1]}>
          <boxGeometry args={[0.3, 0.28, 0.7]} />
        </mesh>
      ))}
      {[
        [-3.2, -2.0],
        [3.2, -2.0],
        [-3.2, 2.2],
        [3.2, 2.2],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} material={matGalv} position={[x, 0.5, (z + 0.1) / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, Math.abs(z - 0.1), 10]} />
        </mesh>
      ))}
      <mesh material={matPaintCool} position={[4.05, 0.45, 0.1]} castShadow>
        <boxGeometry args={[0.7, 0.6, 0.9]} />
      </mesh>
      {[[-3.2, 0, -2.4], [3.2, 0, -2.4], [-3.2, 0, 2.6], [3.2, 0, 2.6]].map((at) => (
        <group key={at.join()} position={at as Pt}>
          {tankGeo.paint ? <mesh geometry={tankGeo.paint} material={matPaint} castShadow receiveShadow /> : null}
          {tankGeo.steel ? <mesh geometry={tankGeo.steel} material={matGalv} castShadow /> : null}
          {tankGeo.stainless ? <mesh geometry={tankGeo.stainless} material={matSteel} /> : null}
        </group>
      ))}
    </group>
  );
}

const STORE_X = [-4.6, 0, 4.6];

/** Finished-product storage: three large tanks in a bund with a tank-top walkway, manifold and transfer pumps. */
function ProductStorage({ position }: { position: Pt }) {
  const wall = (x: number, z: number, w: number, d: number) => (
    <mesh material={matConcrete} position={[x, 0.55, z]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.95, d]} />
    </mesh>
  );
  return (
    <group position={position}>
      <mesh material={matConcrete} position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[15, 0.12, 10.4]} />
      </mesh>
      {wall(0, 5.1, 15, 0.2)}
      {wall(0, -5.1, 15, 0.2)}
      {wall(7.4, 0, 0.2, 10.2)}
      {wall(-7.4, 0, 0.2, 10.2)}
      {STORE_X.map((x) => (
        <group key={x} position={[x, 0, -0.6]} scale={1.22}>
          <mesh material={matConcrete} position={[0, 0.16, 0]} receiveShadow>
            <cylinderGeometry args={[1.9, 2.0, 0.3, 28]} />
          </mesh>
          {largeTankGeo.paint ? <mesh geometry={largeTankGeo.paint} material={matPaintCool} castShadow receiveShadow /> : null}
          {largeTankGeo.steel ? <mesh geometry={largeTankGeo.steel} material={matGalv} castShadow /> : null}
          {largeTankGeo.stainless ? <mesh geometry={largeTankGeo.stainless} material={matSteel} /> : null}
        </group>
      ))}
      {[-2.3, 2.3].map((x) => (
        <group key={`bridge${x}`}>
          <mesh material={matGalv} position={[x, 6.55, -0.6]} castShadow>
            <boxGeometry args={[2.6, 0.08, 0.7]} />
          </mesh>
          <mesh material={matGalv} position={[x, 7.05, -0.28]}>
            <boxGeometry args={[2.6, 0.04, 0.04]} />
          </mesh>
          <mesh material={matGalv} position={[x, 6.8, -0.28]}>
            <boxGeometry args={[2.6, 0.03, 0.03]} />
          </mesh>
        </group>
      ))}
      <mesh material={matGalv} position={[0, 0.5, 2.9]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 10.6, 14]} />
      </mesh>
      {STORE_X.map((x) => (
        <mesh key={`drop${x}`} material={matGalv} position={[x, 0.5, 1.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 3.0, 12]} />
        </mesh>
      ))}
      {[-3.2, 3.2].map((x) => (
        <group key={`pump${x}`} position={[x, 0, 3.9]}>
          <mesh material={matConcrete} position={[0, 0.1, 0]} receiveShadow>
            <boxGeometry args={[1.9, 0.2, 1.1]} />
          </mesh>
          <mesh material={matPaintCool} position={[-0.45, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.85, 16]} />
          </mesh>
          <mesh material={matSteel} position={[0.35, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.28, 0.4, 16]} />
          </mesh>
          <mesh material={matGalv} position={[0.35, 0.95, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.7, 10]} />
          </mesh>
        </group>
      ))}
      <group position={[6.6, 0, 3.6]}>
        <mesh material={matPaint} position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 1.7, 1.0]} />
        </mesh>
        <mesh material={matGalv} position={[0, 1.8, 0]}>
          <boxGeometry args={[1.3, 0.08, 1.1]} />
        </mesh>
        <mesh material={matDark} position={[0, 1.0, 0.51]}>
          <boxGeometry args={[0.5, 1.1, 0.02]} />
        </mesh>
      </group>
      <group position={[-6.2, 0, -3.6]} scale={0.8}>
        {drumGeo.paint ? <mesh geometry={drumGeo.paint} material={matPaintCool} castShadow receiveShadow /> : null}
        {drumGeo.steel ? <mesh geometry={drumGeo.steel} material={matGalv} castShadow /> : null}
        {drumGeo.stainless ? <mesh geometry={drumGeo.stainless} material={matSteel} /> : null}
      </group>
    </group>
  );
}

const projected = new Vector3();

type TagSlot = {
  el: HTMLDivElement;
  left: number;
  top: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  opacity: number;
  rank: number;
};

const tagSlots: TagSlot[] = [];
let tagQueued = false;

function queueTag(slot: TagSlot) {
  tagSlots.push(slot);
  if (tagQueued) return;
  tagQueued = true;
  queueMicrotask(resolveTags);
}

/** Supplier, customer and batch-chain tags hold their place; the rest lift above them or step aside. */
function resolveTags() {
  tagQueued = false;
  const caps = captionRects(Math.floor(performance.now() / 16));
  const placed: { l: number; t: number; r: number; b: number }[] = [];
  const gap = 6;
  const hits = (l: number, t: number, r: number, b: number) =>
    placed.some((o) => l < o.r + gap && r > o.l - gap && b > o.t - gap && t < o.b + gap);
  tagSlots.sort((a, b) => a.rank - b.rank);
  const width = window.innerWidth;
  for (const slot of tagSlots) {
    let { opacity, top, left } = slot;
    const { el, w, h } = slot;
    if (opacity > 0.01) {
      const blocker = placed.find((o) => left < o.r + gap && left + w > o.l - gap && top + h > o.t - gap && top < o.b + gap);
      if (blocker) {
        const sides = [blocker.r + gap, blocker.l - gap - w]
          .filter((l) => l >= 36 && l + w <= width - 36 && !hits(l, top, l + w, top + h))
          .sort((a, b) => Math.abs(a - left) - Math.abs(b - left));
        if (sides.length && Math.abs(sides[0] - left) < w * 0.9) left = sides[0];
      }
      const blocked =
        top < 64 ||
        hits(left, top, left + w, top + h) ||
        caps.some((cap) => left < cap.right + 12 && left + w > cap.left - 12 && top + h > cap.top - 12 && top < cap.bottom + 12);
      if (blocked) opacity = 0;
      else placed.push({ l: left, t: top, r: left + w, b: top + h });
    }
    const dx = slot.dx + (left - slot.left);
    const dy = slot.dy + (top - slot.top);
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.setProperty("--stem", `${Math.min(w - 8, Math.max(8, -dx))}px`);
    el.style.opacity = String(opacity);
  }
  tagSlots.length = 0;
}

function AreaLabel({ area }: { area: SiteArea }) {
  const { name, code, at, record, linked, external } = area;
  const ref = useRef<HTMLDivElement>(null);
  const anchor = useRef(new Vector3(at[0], at[1], at[2]));
  useFrame(({ camera, size }) => {
    const el = ref.current;
    if (!el) return;
    const p = storyState.progress;
    const site = 1 - ramp(p, sectionById("SECTION_02_FACTORY_INTERIOR").end - 0.03, sectionById("SECTION_02_FACTORY_INTERIOR").end);
    const twin = twinAmount(p) * (1 - closingAmount(p));
    const focus = code === "B-10" ? adminFocus(p) : code === "B-03" ? qcFocus(p) : code === "B-04" ? warehouseFocus(p) : code === "B-01" ? mfgFocus(p) : 0;
    let opacity = external ? twin : Math.max(site, twin, focus);
    if (code === "U-200") opacity *= 1 - plantSink(p);
    if (exploreState.on) opacity = external ? 0.85 : 1;
    el.classList.toggle("is-twin", exploreState.on || Math.max(twin, focus) > 0.5);
    projected.copy(anchor.current).project(camera);
    if (projected.z > 1 || Math.abs(projected.x) > 1.02 || Math.abs(projected.y) > 1.02) opacity = 0;
    const x = (projected.x * 0.5 + 0.5) * size.width;
    const y = (-projected.y * 0.5 + 0.5) * size.height;
    const w = el.offsetWidth || 160;
    const h = el.offsetHeight || 22;
    const padX = 36;
    const padTop = 64;
    let dx = -w / 2;
    if (x + dx < padX) dx = padX - x;
    else if (x + dx + w > size.width - padX) dx = size.width - padX - w - x;
    let dy = external ? 18 : -(h + 18);
    if (y + dy < padTop) dy = padTop - y;
    queueTag({
      el,
      left: x + dx,
      top: y + dy,
      w,
      h,
      dx,
      dy,
      opacity,
      rank: (external ? 0 : linked ? 1 : 2) + projected.z,
    });
  });
  return (
    <Html position={at} zIndexRange={[12, 0]} style={{ pointerEvents: "none" }}>
      <div ref={ref} className={`area-tag${linked ? " is-linked" : ""}${external ? " is-below" : ""}`}>
        <span className="area-head">
          <span className="area-code">{code}</span>
          {name}
        </span>
        <span className="area-record">{record}</span>
      </div>
    </Html>
  );
}

function Wheel({ position }: { position: Pt }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.x = -clock.elapsedTime * 1.6;
  });
  return (
    <group ref={ref} position={position}>
      <mesh material={matDark} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.16, 12]} />
      </mesh>
    </group>
  );
}

function Tanker() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const u = (clock.elapsedTime * 0.018) % 1;
    ref.current.position.set(28 - u * 52, 0, 20.5);
  });
  const axles = [-1.7, -0.15, 1.4, 1.95];
  return (
    <group ref={ref}>
      <mesh material={matSteel} position={[0.15, 0.42, 0]} castShadow>
        <boxGeometry args={[4.6, 0.16, 1.15]} />
      </mesh>
      <mesh material={matDark} position={[-1.55, 0.95, 0]} castShadow>
        <boxGeometry args={[1.15, 0.95, 1.2]} />
      </mesh>
      <mesh material={matGlass} position={[-1.35, 1.15, 0.62]}>
        <boxGeometry args={[0.55, 0.38, 0.03]} />
      </mesh>
      <mesh material={matDark} position={[-2.12, 0.72, 0]} castShadow>
        <boxGeometry args={[0.12, 0.28, 1.18]} />
      </mesh>
      <mesh material={matSteel} position={[-1.55, 1.18, 0.68]}>
        <boxGeometry args={[0.08, 0.22, 0.16]} />
      </mesh>
      <mesh material={matPaint} position={[0.85, 1.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.48, 0.48, 2.7, 18]} />
      </mesh>
      {[-0.15, 0.55, 1.25, 1.85].map((x) => (
        <mesh key={x} material={matGalv} position={[x, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.5, 0.5, 0.04, 16]} />
        </mesh>
      ))}
      <mesh material={matGalv} position={[-0.45, 1.05, 0]}>
        <sphereGeometry args={[0.46, 14, 10]} />
      </mesh>
      <mesh material={matSteel} position={[2.15, 0.55, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
      </mesh>
      <mesh material={matSteel} position={[0.85, 1.62, 0]}>
        <boxGeometry args={[0.35, 0.12, 0.22]} />
      </mesh>
      {axles.flatMap((x) => [
        <Wheel key={`${x}-a`} position={[x, 0.28, 0.62]} />,
        <Wheel key={`${x}-b`} position={[x, 0.28, -0.62]} />,
      ])}
    </group>
  );
}

function Road({ position, size }: { position: Pt; size: [number, number] }) {
  return (
    <group position={position}>
      <mesh material={matConcrete} receiveShadow>
        <boxGeometry args={[size[0], 0.08, size[1]]} />
      </mesh>
      <mesh material={matGalv} position={[0, 0.02, size[1] / 2]}>
        <boxGeometry args={[size[0], 0.06, 0.12]} />
      </mesh>
      <mesh material={matGalv} position={[0, 0.02, -size[1] / 2]}>
        <boxGeometry args={[size[0], 0.06, 0.12]} />
      </mesh>
    </group>
  );
}

export function Factory() {
  return (
    <group>
      <Built geo={hallWarehouse} position={[-46, 0, 34]} />
      <Built geo={hallProduction} position={[6, 0, -48]} cool />
      <Built geo={hallNorth} position={[-30, 0, -38]} />
      <Built geo={hallLab} position={[34, 0, 28]} />
      <Built geo={hallPack} position={[-2, 0, 42]} />
      <Built geo={hallUtility} position={[48, 0, -6]} cool />
      <Built geo={hallWaste} position={[40, 0, -42]} />
      <Built geo={hallControl} position={[-21.5, 0, -7]} rotation={Math.PI / 2} cool />
      <Built geo={hallAdmin} position={[16, 0, 31]} />
      <Built geo={hallMaint} position={[-38, 0, -20]} />
      <Built geo={deptGeo} position={[0, 0, 0]} />
      <Built geo={plantCompound} position={[0, 0, 0]} />

      <Tanks position={[-44, 0, -4]} />
      <ProductStorage position={[-41, 0, 10.5]} />
      <Tanks position={[36, 0, -34]} />
      <Built geo={towerGeo} position={[18, 0, -24]} cool />
      <Built geo={towerGeo} position={[22.6, 0, -24]} cool />
      <Built geo={towerGeo} position={[20.3, 0, -19]} cool />

      <Built geo={transformerGeo} position={[52, 0, -8]} />
      <Built geo={transformerGeo} position={[52, 0, -11.2]} rotation={Math.PI} />

      <Built geo={rackWest} position={[0, 0, 0]} />
      <Built geo={rackEast} position={[0, 0, 0]} />
      <Built geo={rackNorth} position={[0, 0, 0]} />

      <Road position={[-8, 0.04, 20]} size={[78, 3.6]} />
      <Road position={[18, 0.04, 5.5]} size={[3.6, 43]} />
      <Road position={[-57.5, 0.04, 20]} size={[21, 3.6]} />
      <SiteDetail />

      <Tanker />
      <SiteFlows />
      {SITE_AREAS.map((area) => (
        <AreaLabel key={area.code} area={area} />
      ))}
    </group>
  );
}
