import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import {
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  Quaternion,
  TubeGeometry,
  Vector3,
} from "three";
import type { BufferGeometry, Material } from "three";
import { DIM, LINES, P, SHOES, plantSink, plantWash, type Line, type Pt } from "../story/model";
import { sectionStart } from "../story/sections";
import { storyState } from "../story/state";
import {
  makeColumn,
  drumGeo,
  exchangerGeo,
  exchangerSmallGeo,
  largeTankGeo,
  rackGeo,
  reactorGeo,
  siteGeo,
  tankGeo,
  yardGeo,
  type GeoSet,
} from "./build";
import { matGalv, matGround, matPad, matPaint, matPaintCool, matReactor, matStainless, matSteel } from "./materials";
import { Agitator, Pump, Sensor, Utilities, Valve } from "./parts";

const FONT = "/fonts/ibm-plex-mono-500.woff";
const up = new Vector3(0, 1, 0);
const flangeGeo = new CylinderGeometry(1, 1, 1, 14);
const columnGeo = makeColumn(DIM.colR, DIM.colH, DIM.colSkirt);
const columnSmallGeo = makeColumn(DIM.col2R, DIM.col2H, 0.55);

function Solid({
  geometry,
  material,
  cast = true,
}: {
  geometry: BufferGeometry | null;
  material: Material;
  cast?: boolean;
}) {
  if (!geometry) return null;
  return <mesh geometry={geometry} material={material} castShadow={cast} receiveShadow />;
}

function Assembly({
  geo,
  position,
  paint = matPaint,
  steel = matSteel,
  stainless = matStainless,
}: {
  geo: GeoSet;
  position?: Pt;
  paint?: Material;
  steel?: Material;
  stainless?: Material;
}) {
  return (
    <group position={position}>
      <Solid geometry={geo.paint} material={paint} />
      <Solid geometry={geo.steel} material={steel} />
      <Solid geometry={geo.stainless} material={stainless} />
    </group>
  );
}

function usePipe(line: Line) {
  return useMemo(() => {
    const curve = new CatmullRomCurve3(
      line.points.map((point) => new Vector3(...point)),
      false,
      "catmullrom",
      line.tension ?? 0.2,
    );
    const segments = Math.max(24, line.points.length * 18);
    const tube = new TubeGeometry(curve, segments, line.radius, 8, false);
    const flanges = new Group();
    for (const end of [0, 1]) {
      const pos = curve.getPoint(end);
      const tan = curve.getTangent(end).normalize();
      const mesh = new Mesh(flangeGeo, matSteel);
      mesh.matrixAutoUpdate = false;
      const matrix = new Matrix4().compose(
        pos,
        new Quaternion().setFromUnitVectors(up, tan),
        new Vector3(line.radius * 2.15, line.radius * 0.55, line.radius * 2.15),
      );
      mesh.matrix.copy(matrix);
      mesh.castShadow = true;
      flanges.add(mesh);
    }
    return { curve, tube, flanges };
  }, [line]);
}

function Pipe({ line, flow = false }: { line: Line; flow?: boolean }) {
  const { curve, tube, flanges } = usePipe(line);
  const tracer = useRef<Mesh>(null);
  const material = line.kind === "bare" ? matStainless : matPaint;
  useFrame(({ clock }) => {
    if (!tracer.current) return;
    const hidden = plantWash(storyState.progress) > 0.45;
    tracer.current.visible = !hidden;
    const u = (clock.elapsedTime * 0.045 + (flow ? 0.2 : 0)) % 1;
    const point = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    tracer.current.position.copy(point);
    tracer.current.quaternion.setFromUnitVectors(up, tangent);
  });
  return (
    <group>
      <mesh geometry={tube} material={material} castShadow />
      <primitive object={flanges} />
      {flow ? (
        <mesh ref={tracer}>
          <capsuleGeometry args={[line.radius * 0.55, line.radius * 1.8, 3, 8]} />
          <meshPhysicalMaterial color="#9aa3ab" metalness={0.85} roughness={0.22} />
        </mesh>
      ) : null}
    </group>
  );
}

function Marks() {
  const ref = useRef<Group>(null);
  useFrame(() => {
    const p = storyState.progress;
    if (ref.current) {
      ref.current.visible = p >= sectionStart("SECTION_03_PLANT") && p < sectionStart("SECTION_04_DATA") && plantSink(p) < 0.03;
    }
  });
  return (
    <group ref={ref}>
      <Text position={[1.45, 3.9, 0.2]} fontSize={0.16} color="#3c444c" anchorX="left" letterSpacing={0.06} font={FONT}>
        R-204
      </Text>
      <Text position={[4.7, 4.7, 0.85]} fontSize={0.13} color="#5c656e" anchorX="center" font={FONT}>
        R-202
      </Text>
      <Text position={[-1.55, 12.7, -8.15]} fontSize={0.16} color="#3c444c" anchorX="center" font={FONT}>
        C-301
      </Text>
      <Text position={[-9.35, 5.15, -4.15]} fontSize={0.13} color="#5c656e" anchorX="center" font={FONT}>
        T-101
      </Text>
      <Text position={[-9.35, 5.15, 0.15]} fontSize={0.13} color="#5c656e" anchorX="center" font={FONT}>
        T-102
      </Text>
      <Text
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0.4, 0.14, 6.6]}
        fontSize={0.62}
        color="#c5cbd2"
        anchorX="center"
        letterSpacing={0.22}
        font={FONT}
      >
        UNIT 204
      </Text>
    </group>
  );
}

/** Deep enough that the tallest column (11.3 m on its skirt) is under the pad. */
const SINK_DEPTH = 18;

export function Plant() {
  const equipment = useRef<Group>(null);
  useFrame(() => {
    const group = equipment.current;
    if (!group) return;
    const sink = plantSink(storyState.progress);
    group.position.y = -sink * SINK_DEPTH;
    group.visible = sink < 0.995;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow material={matGround}>
        <circleGeometry args={[150, 80]} />
      </mesh>
      <Solid geometry={siteGeo.paint} material={matPad} cast={false} />
      <Solid geometry={siteGeo.steel} material={matGalv} cast={false} />
      <group ref={equipment}>
        <Assembly geo={rackGeo} steel={matGalv} />
        <Assembly geo={yardGeo} steel={matGalv} />

        <Assembly geo={tankGeo} position={P.t101} steel={matGalv} />
        <Assembly geo={tankGeo} position={P.t102} steel={matGalv} />
        <Assembly geo={tankGeo} position={P.t103} steel={matGalv} />
        <Assembly geo={largeTankGeo} position={P.t104} paint={matPaintCool} steel={matGalv} />
        <Assembly geo={drumGeo} position={P.drum} steel={matGalv} />

        <Assembly geo={reactorGeo} position={P.r201} paint={matReactor} />
        <group position={P.r201}>
          <Agitator slow />
        </group>
        <Assembly geo={reactorGeo} position={P.r202} />
        <group position={P.r202}>
          <Agitator />
        </group>

        <Assembly geo={columnGeo} position={P.c301} steel={matGalv} />
        <Assembly geo={columnSmallGeo} position={P.c302} steel={matGalv} />
        <Assembly geo={exchangerGeo} position={P.e401} steel={matGalv} />
        <Assembly geo={exchangerSmallGeo} position={P.e402} steel={matGalv} />

        <Pump position={P.pumpA} phase={0.2} />
        <Pump position={P.pumpB} phase={1.1} />
        <Pump position={P.pumpC} phase={2.2} />
        <Utilities />

        {LINES.map((line) => (
          <Pipe key={line.id} line={line} flow={line.id === "feed" || line.id === "charge" || line.id === "vapor" || line.id === "to-column"} />
        ))}
        {SHOES.map((shoe) => (
          <mesh key={shoe.at.join()} position={[shoe.at[0], shoe.top / 2, shoe.at[2]]} material={matGalv} castShadow>
            <cylinderGeometry args={[0.035, 0.04, shoe.top, 8]} />
          </mesh>
        ))}

        <Valve position={[0.12, 1.72, 1.42]} />
        <Valve position={[-1.72, 1.15, 1.48]} />
        <Valve position={[0.05, 3.35, -1.55]} rotation={[0.4, 0, 0]} />
        <Valve position={[-8.05, 0.92, 0.8]} />
        <Valve position={[2.55, 1.7, -5.1]} />

        <Sensor position={[0.95, 3.2, 0.35]} />
        <Sensor position={[0.55, 2.25, 1.02]} />
        <Sensor position={[-0.15, 1.85, 1.12]} rotation={[0.4, 0, 0]} />
        <Sensor position={[-1.55, 6.2, -7.55]} />
        <Sensor position={[-9.35, 3.7, 0.95]} />
        <Sensor position={[4.55, 2.8, 1.55]} />
        <Sensor position={[3.85, 1.55, -2.85]} />

        <Suspense fallback={null}>
          <Marks />
        </Suspense>
      </group>
    </group>
  );
}
