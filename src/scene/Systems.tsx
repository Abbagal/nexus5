import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, Group, Mesh, MeshStandardMaterial, Vector3, type Camera } from "three";
import { NEXUS, SYSTEMS, activeSystem, band, nexusAmount, ramp, type SystemNode } from "../story/model";
import { sectionEnd, sectionStart } from "../story/sections";
import { storyState } from "../story/state";

const Y_AXIS = new Vector3(0, 1, 0);
const projected = new Vector3();

type CardSlot = {
  el: HTMLElement;
  left: number;
  top: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  lift: boolean;
  z: number;
};

const slots: CardSlot[] = [];
let collecting = false;

function hitsCaption(left: number, top: number, w: number, h: number, height: number) {
  const forbidRight = CAP_ZONE_RIGHT + CAP_ZONE_PAD;
  const forbidTop = height - CAP_ZONE_HEIGHT - CAP_ZONE_PAD;
  return left < forbidRight && left + w > 0 && top + h > forbidTop && top < height;
}

function applySlot(slot: CardSlot) {
  slot.el.style.visibility = "visible";
  slot.el.style.transform = slot.lift
    ? `translate(${slot.dx}px, calc(-100% - 14px + ${slot.dy}px))`
    : `translate(${slot.dx}px, ${slot.dy}px)`;
}

function shiftSlot(slot: CardSlot, axis: "x" | "y", delta: number, width: number, height: number) {
  const padX = 28;
  const padTop = 72;
  const padBottom = Math.max(210, height * 0.3);
  if (axis === "y") {
    const top = slot.top + delta;
    if (top < padTop || top + slot.h > height - padBottom) return false;
    if (hitsCaption(slot.left, top, slot.w, slot.h, height)) return false;
    slot.top = top;
    slot.dy += delta;
    return true;
  }
  const left = slot.left + delta;
  if (left < padX || left + slot.w > width - padX) return false;
  if (hitsCaption(left, slot.top, slot.w, slot.h, height)) return false;
  slot.left = left;
  slot.dx += delta;
  return true;
}

function resolveOverlaps(width: number, height: number) {
  const live = slots.filter((slot) => Number(slot.el.style.opacity) > 0.08);
  slots.length = 0;
  live.sort((a, b) => a.z - b.z);
  const gap = 10;
  for (let i = 1; i < live.length; i += 1) {
    const card = live[i];
    if (Number(card.el.style.opacity) <= 0.08) continue;
    for (let pass = 0; pass < 4; pass += 1) {
      let blocked = false;
      for (let j = 0; j < i; j += 1) {
        const other = live[j];
        if (Number(other.el.style.opacity) <= 0.08) continue;
        const overlapX = Math.min(card.left + card.w, other.left + other.w) - Math.max(card.left, other.left);
        const overlapY = Math.min(card.top + card.h, other.top + other.h) - Math.max(card.top, other.top);
        if (overlapX <= 0 || overlapY <= 0) continue;
        const dirY = card.top + card.h / 2 >= other.top + other.h / 2 ? 1 : -1;
        const dirX = card.left + card.w / 2 >= other.left + other.w / 2 ? 1 : -1;
        const verticalFirst = overlapY <= overlapX;
        const attempts: Array<["x" | "y", number]> = verticalFirst
          ? [
              ["y", dirY * (overlapY + gap)],
              ["y", -dirY * (overlapY + gap)],
              ["x", dirX * (overlapX + gap)],
              ["x", -dirX * (overlapX + gap)],
            ]
          : [
              ["x", dirX * (overlapX + gap)],
              ["x", -dirX * (overlapX + gap)],
              ["y", dirY * (overlapY + gap)],
              ["y", -dirY * (overlapY + gap)],
            ];
        const moved = attempts.some(([axis, delta]) => shiftSlot(card, axis, delta, width, height));
        if (!moved) {
          card.el.style.opacity = "0";
          blocked = true;
          break;
        }
      }
      if (blocked) break;
    }
    const stillOver = live.slice(0, i).some((other) => {
      if (Number(other.el.style.opacity) <= 0.08) return false;
      const overlapX = Math.min(card.left + card.w, other.left + other.w) - Math.max(card.left, other.left);
      const overlapY = Math.min(card.top + card.h, other.top + other.h) - Math.max(card.top, other.top);
      return overlapX > 0 && overlapY > 0;
    });
    if (stillOver) card.el.style.opacity = "0";
    else if (Number(card.el.style.opacity) > 0.08) applySlot(card);
  }
  if (live[0] && Number(live[0].el.style.opacity) > 0.08) applySlot(live[0]);
}

/** Bottom-left caption block (.cap): left 36 / bottom 36 / width ≤440 — keep tags out. */
const CAP_ZONE_RIGHT = 520;
const CAP_ZONE_HEIGHT = 280;
const CAP_ZONE_PAD = 20;

export function keepOnScreen(
  el: HTMLElement,
  world: Vector3,
  camera: Camera,
  width: number,
  height: number,
  lift = false,
) {
  projected.copy(world).project(camera);
  if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1.35 || Math.abs(projected.y) > 1.35) {
    el.style.visibility = "hidden";
    el.style.transform = lift ? "translateY(calc(-100% - 14px))" : "";
    return false;
  }
  el.style.visibility = "visible";
  const x = (projected.x * 0.5 + 0.5) * width;
  const y = (-projected.y * 0.5 + 0.5) * height;
  const w = el.offsetWidth || 180;
  const h = el.offsetHeight || 78;
  const padX = 28;
  const padTop = 72;
  const padBottom = Math.max(210, height * 0.3);
  if (y > height - padBottom + h * 0.25) {
    el.style.visibility = "hidden";
    el.style.transform = lift ? "translateY(calc(-100% - 14px))" : "";
    return false;
  }
  let dx = 0;
  let dy = 0;
  const left = x - w / 2;
  const right = x + w / 2;
  if (left < padX) dx = padX - left;
  else if (right > width - padX) dx = width - padX - right;
  const top = y - (lift ? h : h / 2);
  const bottom = y + (lift ? 0 : h / 2);
  if (top < padTop) dy = padTop - top;
  else if (bottom > height - padBottom) dy = height - padBottom - bottom;

  const finalLeft = left + dx;
  const finalRight = right + dx;
  const finalTop = top + dy;
  const finalBottom = bottom + dy;
  const forbidRight = CAP_ZONE_RIGHT + CAP_ZONE_PAD;
  const forbidTop = height - CAP_ZONE_HEIGHT - CAP_ZONE_PAD;
  const overlapsCaption =
    finalLeft < forbidRight && finalRight > 0 && finalBottom > forbidTop && finalTop < height;

  // Prefer hiding over parking a tag on the story caption.
  if (overlapsCaption) {
    el.style.opacity = "0";
    el.style.transform = lift ? "translateY(calc(-100% - 14px))" : "";
    return false;
  }

  el.style.transform = lift
    ? `translate(${dx}px, calc(-100% - 14px + ${dy}px))`
    : `translate(${dx}px, ${dy}px)`;
  if (!collecting) {
    collecting = true;
    slots.length = 0;
    queueMicrotask(() => {
      collecting = false;
      resolveOverlaps(width, height);
    });
  }
  slots.push({ el, left: finalLeft, top: finalTop, w, h, dx, dy, lift, z: projected.z });
  return true;
}

function Plate({ system }: { system: SystemNode }) {
  const ref = useRef<Group>(null);
  const card = useRef<HTMLDivElement>(null);
  const metal = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#8e979f"),
        metalness: 0.7,
        roughness: 0.38,
      }),
    [],
  );
  const height = system.pos[1];

  const anchor = useMemo(() => new Vector3(system.pos[0], height, system.pos[2]), [system.pos, height]);

  useFrame(({ camera, size }) => {
    const group = ref.current;
    if (!group) return;
    const p = storyState.progress;
    const frag = band(p, sectionStart("SECTION_05_FRAGMENTATION"), sectionEnd("SECTION_05_FRAGMENTATION"), 0.012);
    const connectors = band(p, sectionStart("SECTION_08_CONNECTORS"), sectionEnd("SECTION_09_INTELLIGENCE"), 0.012);
    const investigating = activeSystem(p) === system.id ? 1 : 0;
    const opacity = Math.max(frag, connectors * 0.9, investigating);
    group.visible = opacity > 0.04;
    if (card.current) {
      card.current.style.opacity = String(opacity);
      keepOnScreen(card.current, anchor, camera, size.width, size.height);
    }
  });

  return (
    <group ref={ref} position={[system.pos[0], 0, system.pos[2]]} visible={false}>
      <mesh material={metal} position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, height, 8]} />
      </mesh>
      <mesh material={metal} position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.22, 0.28, 0.08, 14]} />
      </mesh>
      <Html position={[0, height, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <div ref={card} className="sys-tag">
          <span>{system.name}</span>
          {system.lines.map((line) => (
            <b key={line}>{line}</b>
          ))}
        </div>
      </Html>
    </group>
  );
}

function Connector({ from, index }: { from: [number, number, number]; index: number }) {
  const ref = useRef<Mesh>(null);
  const start = useMemo(() => new Vector3(from[0], from[1], from[2]), [from]);
  const end = useMemo(() => {
    const angle = (index / SYSTEMS.length) * Math.PI * 2;
    return new Vector3(Math.cos(angle) * (NEXUS.radius - 0.04), NEXUS.y, Math.sin(angle) * (NEXUS.radius - 0.04));
  }, [index]);
  const dir = useMemo(() => new Vector3(), []);
  const mid = useMemo(() => new Vector3(), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: "#7e878f",
        metalness: 0.72,
        roughness: 0.3,
        transparent: true,
      }),
    [],
  );

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const amount = ramp(
      storyState.progress,
      sectionStart("SECTION_08_CONNECTORS") + index * 0.002,
      sectionEnd("SECTION_08_CONNECTORS"),
    );
    const length = start.distanceTo(end);
    dir.copy(end).sub(start).normalize();
    mid.copy(start).addScaledVector(dir, (length * amount) / 2);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(Y_AXIS, dir);
    mesh.scale.set(1, Math.max(0.001, length * amount), 1);
    mesh.visible = amount > 0.015;
    const p = storyState.progress;
    const takeover = ramp(p, sectionStart("SECTION_10_ONTOLOGY"), sectionStart("SECTION_10_ONTOLOGY") + 0.02);
    material.opacity = nexusAmount(p) * (1 - takeover) * 0.9;
    if (takeover > 0.98) mesh.visible = false;
  });

  return (
    <mesh ref={ref} material={material}>
      <cylinderGeometry args={[0.011, 0.011, 1, 6]} />
    </mesh>
  );
}

function Ring() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    const p = storyState.progress;
    const amount = nexusAmount(p);
    const takeover = ramp(p, sectionStart("SECTION_10_ONTOLOGY"), sectionStart("SECTION_10_ONTOLOGY") + 0.02);
    group.scale.setScalar(0.65 + amount * 0.35);
    group.visible = amount > 0.02 && takeover < 0.98;
    group.traverse((obj) => {
      const mesh = obj as Mesh;
      const material = mesh.material as MeshStandardMaterial | undefined;
      if (material && "opacity" in material) {
        material.transparent = true;
        material.opacity = amount * (1 - takeover);
      }
    });
  });
  return (
    <group ref={ref} position={[0, NEXUS.y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[NEXUS.radius, 0.018, 12, 72]} />
        <meshPhysicalMaterial color="#b7c0c8" metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.012, 10, 32]} />
        <meshPhysicalMaterial color="#8e979f" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.7, 8]} />
        <meshStandardMaterial color="#8e979f" metalness={0.7} roughness={0.32} />
      </mesh>
    </group>
  );
}

export function SystemField() {
  return (
    <group>
      {SYSTEMS.map((system) => (
        <Plate key={system.id} system={system} />
      ))}
      {SYSTEMS.map((system, index) => (
        <Connector key={system.id} from={system.pos} index={index} />
      ))}
      <Ring />
    </group>
  );
}
