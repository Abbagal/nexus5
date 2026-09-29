import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, InstancedMesh, Object3D, Vector3 } from "three";
import {
  NEXUS,
  SOURCES,
  SYSTEMS,
  assayValue,
  flowValue,
  pressureValue,
  ramp,
  tempValue,
  vibeValue,
  band,
} from "../story/model";
import { sectionEnd, sectionStart } from "../story/sections";
import { storyState } from "../story/state";

const COUNT = 300;
const dummy = new Object3D();
const graphite = new Color("#5c6670");
const warm = new Color("#8a7360");
const from = new Vector3();
const to = new Vector3();
const local = new Vector3();
const nexus = new Vector3();
const cursor = new Vector3();

const seeds = Array.from({ length: COUNT }, (_, index) => ({
  source: index % SOURCES.length,
  speed: 0.07 + (index % 8) * 0.011,
  offset: (index * 0.173) % 1,
  ring: index % SYSTEMS.length,
}));

function ringPoint(index: number, target: Vector3) {
  const angle = (index / SYSTEMS.length) * Math.PI * 2;
  target.set(Math.cos(angle) * NEXUS.radius, NEXUS.y, Math.sin(angle) * NEXUS.radius);
}

export function Streams() {
  const mesh = useRef<InstancedMesh>(null);
  const color = useMemo(() => new Color(), []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    for (let i = 0; i < COUNT; i += 1) mesh.current.setColorAt(i, graphite);
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const p = storyState.progress;
    const toSystems = ramp(p, sectionStart("SECTION_05_FRAGMENTATION"), sectionEnd("SECTION_05_FRAGMENTATION"));
    const toNexus = ramp(p, sectionStart("SECTION_08_CONNECTORS"), sectionEnd("SECTION_08_CONNECTORS"));
    const incident = ramp(p, sectionStart("SECTION_06_INCIDENT"), sectionEnd("SECTION_06_INCIDENT"));
    const emerge = ramp(p, sectionStart("SECTION_03_PLANT") + (sectionEnd("SECTION_03_PLANT") - sectionStart("SECTION_03_PLANT")) * 0.45, sectionEnd("SECTION_03_PLANT"));
    const volume = 0.4 + ramp(p, sectionStart("SECTION_04_DATA"), sectionEnd("SECTION_04_DATA")) * 0.85;
    const diagram = 1 - ramp(p, sectionStart("SECTION_10_ONTOLOGY"), sectionStart("SECTION_10_ONTOLOGY") + 0.018);
    const time = clock.elapsedTime;

    for (let i = 0; i < COUNT; i += 1) {
      const seed = seeds[i];
      const source = SOURCES[seed.source];
      const system = SYSTEMS[source.system].pos;
      const u = (time * seed.speed + seed.offset) % 1;
      const fade = Math.sin(u * Math.PI);
      from.set(source.at[0], source.at[1], source.at[2]);
      local.set(source.at[0], source.at[1] + 1.45, source.at[2]);
      ringPoint(seed.ring, nexus);
      to.copy(local).lerp(cursor.set(system[0], system[1], system[2]), toSystems).lerp(nexus, toNexus);
      from.lerp(cursor.set(system[0], system[1], system[2]), toNexus);
      dummy.position.lerpVectors(from, to, u);
      const scale = fade * emerge * volume * diagram * (0.55 + (seed.source === 0 ? incident * 0.35 : 0));
      dummy.scale.setScalar(Math.max(0.001, scale));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
      color.copy(graphite);
      if (seed.source === 0) color.lerp(warm, incident);
      mesh.current.setColorAt(i, color);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[0.035, 8, 6]} />
        <meshStandardMaterial vertexColors roughness={0.45} metalness={0.15} />
      </instancedMesh>
      <Readout position={[1.2, 3.25, 0.25]} label="TT-204" read={(p, t) => `${tempValue(p, t).toFixed(1)} °C`} warm />
      <Readout position={[0.85, 2.15, 0.95]} label="PT-204" read={(p, t) => `${pressureValue(p, t).toFixed(2)} bar`} />
      <Readout position={[-1.7, 1.85, 1.55]} label="FT-204" read={(p, t) => `${flowValue(p, t).toFixed(1)} m³/h`} />
      <Readout position={[-0.35, 1.7, 1.25]} label="VT-204" read={(p, t) => `${vibeValue(p, t).toFixed(1)} mm/s`} warm />
      <Readout
        position={[0.35, 4.25, 1.05]}
        label="B-2047"
        read={(p, t) =>
          `${assayValue(p, t).toFixed(1)}%  ${
            ramp(p, sectionStart("SECTION_06_INCIDENT") + 0.012, sectionEnd("SECTION_06_INCIDENT")) > 0.55
              ? "deviation"
              : "in spec"
          }`
        }
        warm
      />
    </group>
  );
}

function Readout({
  position,
  label,
  read,
  warm: canWarm = false,
}: {
  position: [number, number, number];
  label: string;
  read: (progress: number, time: number) => string;
  warm?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(({ clock }) => {
    const node = ref.current;
    if (!node) return;
    const p = storyState.progress;
    const opacity = Math.max(
      band(p, sectionStart("SECTION_03_PLANT") + (sectionEnd("SECTION_03_PLANT") - sectionStart("SECTION_03_PLANT")) * 0.55, sectionEnd("SECTION_04_DATA"), 0.012),
      band(p, sectionStart("SECTION_06_INCIDENT"), sectionEnd("SECTION_06_INCIDENT"), 0.012),
    );
    node.style.opacity = String(opacity);
    const value = node.querySelector("b");
    if (value) value.textContent = read(p, clock.elapsedTime);
    const drifted = canWarm && ramp(p, sectionStart("SECTION_06_INCIDENT"), sectionEnd("SECTION_06_INCIDENT")) > 0.45;
    node.classList.toggle("is-warm", drifted);
  });
  return (
    <Html position={position} distanceFactor={8} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div ref={ref} className="readout">
        <span>{label}</span>
        <b>—</b>
      </div>
    </Html>
  );
}
