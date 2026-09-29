import { Suspense, useEffect, useLayoutEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import {
  ACESFilmicToneMapping,
  DirectionalLight,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { closingAmount, currentLook, incidentTint, labAmount, orgAmount, plantSink, plantWash, sampleCamera, twinAmount, whAmount } from "../story/model";
import { exploreState, storyState } from "../story/state";
import { PAPER, PLANT, WARM, matReactor } from "./materials";
import { surfaceDetail } from "./surface";
import { AdminTwin } from "./AdminTwin";
import { Chain } from "./Chain";
import { ExploreTargets } from "./ExploreTargets";
import { Scan } from "./Scan";
import { LabTwin } from "./LabTwin";
import { WarehouseTwin } from "./WarehouseTwin";
import { Ontology } from "./Ontology";
import { Factory } from "./Factory";
import { Plant } from "./Plant";
import { Streams } from "./Streams";
import { SystemField } from "./Systems";

function Studio() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = texture;
    const target = scene as Scene & { environmentIntensity?: number };
    target.environmentIntensity = 0.32;
    return () => {
      texture.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

const SUN = new Vector3(16, 28, 14).normalize();
const sunFocus = new Vector3();

function KeyLight() {
  const light = useRef<DirectionalLight>(null);
  const target = useRef<Object3D>(null);
  const extent = useRef(0);
  useLayoutEffect(() => {
    if (light.current && target.current) light.current.target = target.current;
  }, []);
  useFrame(({ camera }) => {
    const sun = light.current;
    const aim = target.current;
    if (!sun || !aim) return;
    const look = currentLook(storyState.progress);
    sunFocus.set(look[0], 0, look[2]);
    const reach = camera.position.distanceTo(sunFocus);
    const size = Math.min(92, Math.max(16, reach * 0.62));
    const snap = size / 1024;
    sunFocus.x = Math.round(sunFocus.x / snap) * snap;
    sunFocus.z = Math.round(sunFocus.z / snap) * snap;
    aim.position.copy(sunFocus);
    aim.updateMatrixWorld();
    sun.position.copy(sunFocus).addScaledVector(SUN, size * 1.6 + 20);
    if (Math.abs(extent.current - size) > size * 0.04) {
      extent.current = size;
      const cam = sun.shadow.camera;
      cam.left = -size;
      cam.right = size;
      cam.top = size;
      cam.bottom = -size;
      cam.near = 1;
      cam.far = size * 3.4 + 60;
      cam.updateProjectionMatrix();
      sun.shadow.normalBias = 0.02 + size * 0.0012;
    }
  });
  return (
    <>
      <directionalLight
        ref={light}
        position={[16, 28, 14]}
        intensity={1.55}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.00018}
        shadow-normalBias={0.04}
        shadow-radius={3}
      />
      <object3D ref={target} position={[0, 1.6, -1]} />
    </>
  );
}

function Director() {
  useFrame(({ scene }) => {
    const progress = storyState.progress;
    const wash = plantWash(progress);
    const tint = incidentTint(progress);
    for (const record of PLANT) {
      record.mat.color.copy(record.base).lerp(PAPER, wash * 0.48);
      record.mat.metalness = record.metalness * (1 - wash * 0.55);
      record.mat.roughness = Math.min(1, record.roughness + wash * 0.22);
      record.mat.envMapIntensity = record.env * (1 - wash * 0.4);
    }
    matReactor.color.set("#c9d1d8").lerp(WARM, tint * 0.72).lerp(PAPER, wash * 0.48);
    matReactor.metalness = 0.2 * (1 - wash);
    matReactor.roughness = 0.4 + wash * 0.4;
    surfaceDetail.value = 1 - wash * 0.4;
    const env = scene as Scene & { environmentIntensity?: number };
    if (typeof env.environmentIntensity === "number") {
      env.environmentIntensity = 0.32 * (1 - wash * 0.35);
    }
  });
  return null;
}

const lookAt = new Vector3();

type AOPass = { configuration: { aoRadius: number; distanceFalloff: number; intensity: number } };

function Post() {
  const ao = useRef<AOPass>(null);
  useFrame(({ camera }) => {
    const pass = ao.current;
    if (!pass) return;
    const p = storyState.progress;
    const look = currentLook(p);
    const distance = camera.position.distanceTo(lookAt.set(look[0], look[1], look[2]));
    const wash = plantWash(p);
    const radius = Math.min(6, Math.max(0.9, distance * 0.055));
    const config = pass.configuration;
    if (Math.abs(config.aoRadius - radius) > 0.05) config.aoRadius = radius;
    const falloff = radius * 0.6;
    if (Math.abs(config.distanceFalloff - falloff) > 0.05) config.distanceFalloff = falloff;
    const intensity = 2.6 * (1 - wash * 0.35);
    if (Math.abs(config.intensity - intensity) > 0.02) config.intensity = intensity;
  });
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO
        ref={ao}
        halfRes
        quality="medium"
        aoRadius={1.2}
        distanceFalloff={0.8}
        intensity={2.6}
        color="#2a323a"
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}

const BASE_FOV = 32;

function CameraRig() {
  const camera = useThree((state) => state.camera);
  const look = useRef(new Object3D());
  useFrame(() => {
    if (exploreState.on) return;
    const { pos, look: target } = sampleCamera(storyState.progress);
    camera.position.set(pos[0], pos[1], pos[2]);
    look.current.position.set(target[0], target[1], target[2]);
    camera.lookAt(look.current.position);
    if (camera instanceof PerspectiveCamera) {
      const site = Math.atan(Math.tan(MathUtils.degToRad(27)) / camera.aspect) * 2;
      const wide = Math.max(BASE_FOV, MathUtils.radToDeg(site));
      const widen = twinAmount(storyState.progress) * (1 - closingAmount(storyState.progress));
      const fov = MathUtils.lerp(BASE_FOV, wide, widen);
      if (Math.abs(camera.fov - fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
  });
  return null;
}

const recentre = new Vector3();
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Explore mode: free orbit, with smooth fly-to when a building is chosen. */
function ExploreRig({ explore }: { explore: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const active = useRef<null | { from: Vector3; fromT: Vector3; to: Vector3; toT: Vector3; t0: number }>(null);

  useEffect(() => {
    gl.domElement.style.pointerEvents = explore ? "auto" : "none";
    if (explore && controls.current) {
      const { look } = sampleCamera(1);
      controls.current.target.set(look[0], look[1], look[2]);
      controls.current.update();
    }
    return () => {
      gl.domElement.style.pointerEvents = "none";
    };
  }, [explore, gl]);

  useFrame(() => {
    const orbit = controls.current;
    if (!explore || !orbit) return;
    const fly = exploreState.fly;
    if (fly) {
      exploreState.fly = null;
      active.current = {
        from: camera.position.clone(),
        fromT: orbit.target.clone(),
        to: new Vector3(...fly.pos),
        toT: new Vector3(...fly.target),
        t0: fly.started,
      };
    }
    const move = active.current;
    if (move) {
      const t = Math.min(1, (performance.now() - move.t0) / 1500);
      const k = ease(t);
      camera.position.lerpVectors(move.from, move.to, k);
      orbit.target.lerpVectors(move.fromT, move.toT, k);
      if (t >= 1) active.current = null;
    }
    if (!move) {
      // Zoomed out: drift the view back over the middle of the site so nothing stays pinned to one building.
      const dist = camera.position.distanceTo(orbit.target);
      const away = Math.min(1, Math.max(0, (dist - 55) / 70));
      if (away > 0) {
        recentre.set(-6, 1, -6).sub(orbit.target).multiplyScalar(0.03 * away);
        orbit.target.add(recentre);
        camera.position.add(recentre);
      }
    }
    orbit.target.x = Math.max(-95, Math.min(95, orbit.target.x));
    orbit.target.z = Math.max(-95, Math.min(95, orbit.target.z));
    orbit.update();
    exploreState.look = [orbit.target.x, orbit.target.y, orbit.target.z];
  });

  if (!explore) return null;
  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.08}
      enablePan
      screenSpacePanning
      zoomToCursor
      minDistance={6}
      maxDistance={190}
      maxPolarAngle={Math.PI * 0.485}
      rotateSpeed={0.6}
    />
  );
}

export function Experience({ explore = false }: { explore?: boolean }) {
  return (
    <Canvas
      className="webgl"
      shadows
      dpr={[1, 1.6]}
      camera={{ fov: 32, near: 0.2, far: 320, position: [68, 50, 86] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.96;
        gl.setClearColor("#f3f4f6");
      }}
    >
      <color attach="background" args={["#f3f4f6"]} />
      <fog attach="fog" args={["#f3f4f6", 70, 240]} />
      <hemisphereLight args={["#f7f8fa", "#b7c0c8", 0.44]} />
      <ambientLight intensity={0.14} />
      <KeyLight />
      <directionalLight position={[-14, 10, 8]} intensity={0.32} />
      <directionalLight position={[-4, 12, -18]} intensity={0.16} />
      <Studio />
      <Factory />
      <Plant />
      <Streams />
      <Suspense fallback={null}>
        <SystemField />
        <Ontology />
        <AdminTwin />
        <Scan center={[-0.4, 0.2]} w={30} d={29} h={13} amount={(p) => 1 - plantSink(p)} />
        <Scan center={[0, 0]} w={10.4} d={8.4} h={16} amount={orgAmount} />
        <Scan center={[0, 0]} w={14.6} d={9.6} h={7} amount={labAmount} />
        <Scan center={[0, 0]} w={16.8} d={11.8} h={4.8} amount={whAmount} />
        <Chain />
        <LabTwin />
        <WarehouseTwin />
      </Suspense>
      <ContactShadows position={[0, 0.03, 0]} opacity={0.3} scale={46} blur={2.4} far={8} color="#8b949e" frames={1} />
      <Director />
      <CameraRig />
      <ExploreRig explore={explore} />
      {explore ? <ExploreTargets /> : null}
      <Post />
    </Canvas>
  );
}
