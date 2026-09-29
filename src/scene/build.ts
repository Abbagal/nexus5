import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Euler,
  LatheGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { DIM } from "../story/model";

const cyl = new CylinderGeometry(1, 1, 1, 28);
const cylLow = new CylinderGeometry(1, 1, 1, 10);
const box = new BoxGeometry(1, 1, 1);
const hemi = new SphereGeometry(1, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2);
const sphere = new SphereGeometry(1, 22, 16);

const v = new Vector3();
const q = new Quaternion();
const s = new Vector3();
const e = new Euler();
const m = new Matrix4();

function put(
  list: BufferGeometry[],
  geo: BufferGeometry,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const clone = geo.clone();
  m.compose(v.set(x, y, z), q.setFromEuler(e.set(rx, ry, rz, "XYZ")), s.set(sx, sy, sz));
  clone.applyMatrix4(m);
  list.push(clone);
}

function ring(list: BufferGeometry[], radius: number, tube: number, x: number, y: number, z: number) {
  const geo = new TorusGeometry(radius, tube, 6, 28);
  put(list, geo, x, y, z, Math.PI / 2);
  geo.dispose();
}

function fuse(parts: BufferGeometry[]) {
  if (parts.length === 0) return null;
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return merged;
}

export type GeoSet = {
  paint: BufferGeometry | null;
  steel: BufferGeometry | null;
  stainless: BufferGeometry | null;
};

function pack(paint: BufferGeometry[], steel: BufferGeometry[], stainless: BufferGeometry[]): GeoSet {
  return { paint: fuse(paint), steel: fuse(steel), stainless: fuse(stainless) };
}

function nozzle(
  paint: BufferGeometry[],
  steel: BufferGeometry[],
  x: number,
  y: number,
  z: number,
  axis: "x" | "y" | "z" | "-x" | "-z",
  length: number,
  radius: number,
) {
  const rot: Record<typeof axis, [number, number, number]> = {
    y: [0, 0, 0],
    x: [0, 0, -Math.PI / 2],
    "-x": [0, 0, Math.PI / 2],
    z: [Math.PI / 2, 0, 0],
    "-z": [-Math.PI / 2, 0, 0],
  };
  const dir = {
    y: [0, 1, 0],
    x: [1, 0, 0],
    "-x": [-1, 0, 0],
    z: [0, 0, 1],
    "-z": [0, 0, -1],
  }[axis];
  const [rx, ry, rz] = rot[axis];
  const cx = x + dir[0] * length * 0.5;
  const cy = y + dir[1] * length * 0.5;
  const cz = z + dir[2] * length * 0.5;
  put(paint, cyl, cx, cy, cz, rx, ry, rz, radius, length, radius);
  const fx = x + dir[0] * length;
  const fy = y + dir[1] * length;
  const fz = z + dir[2] * length;
  put(steel, cyl, fx, fy, fz, rx, ry, rz, radius * 1.85, radius * 0.42, radius * 1.85);
}

function ladder(steel: BufferGeometry[], height: number, x: number, z: number, y0 = 0) {
  put(steel, cylLow, x, y0 + height / 2, z + 0.1, 0, 0, 0, 0.016, height, 0.016);
  put(steel, cylLow, x, y0 + height / 2, z - 0.1, 0, 0, 0, 0.016, height, 0.016);
  const steps = Math.max(2, Math.floor(height / 0.3));
  for (let i = 0; i < steps; i += 1) {
    put(steel, cylLow, x, y0 + 0.22 + i * (height / steps), z, Math.PI / 2, 0, 0, 0.012, 0.22, 0.012);
  }
}

function rail(steel: BufferGeometry[], y: number, radius: number) {
  ring(steel, radius, 0.016, 0, y, 0);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    put(steel, cylLow, Math.cos(a) * radius, y - 0.16, Math.sin(a) * radius, 0, 0, 0, 0.012, 0.32, 0.012);
  }
}

function hoops(steel: BufferGeometry[], radius: number, y0: number, y1: number, count: number) {
  const step = (y1 - y0) / (count + 1);
  for (let i = 1; i <= count; i += 1) {
    put(steel, cyl, 0, y0 + i * step, 0, 0, 0, 0, radius + 0.016, 0.032, radius + 0.016);
  }
}

function manway(
  paint: BufferGeometry[],
  steel: BufferGeometry[],
  x: number,
  y: number,
  z: number,
  axis: "x" | "z" | "-x" | "-z",
  radius = 0.16,
) {
  nozzle(paint, steel, x, y, z, axis, 0.12, radius);
}

function plate(steel: BufferGeometry[], x: number, y: number, z: number, yaw: number) {
  put(steel, box, x, y, z, 0, yaw, 0, 0.28, 0.14, 0.012);
}

function anchors(steel: BufferGeometry[], radius: number, y: number, count = 8) {
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    put(steel, cylLow, Math.cos(a) * radius, y, Math.sin(a) * radius, 0, 0, 0, 0.018, 0.08, 0.018);
    put(steel, box, Math.cos(a) * radius, y - 0.03, Math.sin(a) * radius, 0, 0, 0, 0.07, 0.016, 0.07);
  }
}

export function makeTank(radius: number, shellH: number, legH: number): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];
  const dish = radius * 0.4;
  const shellBottom = legH + 0.02;
  const shellCenter = shellBottom + shellH / 2;

  for (let i = 0; i < 4; i += 1) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const x = Math.cos(a) * radius * 0.72;
    const z = Math.sin(a) * radius * 0.72;
    put(steel, cyl, x, legH / 2, z, 0, 0, 0, 0.07, legH, 0.07);
    put(steel, box, x * 0.55, legH * 0.55, z * 0.55, 0, -a, 0, radius * 0.7, 0.035, 0.035);
  }

  put(paint, hemi, 0, shellBottom, 0, Math.PI, 0, 0, radius, dish, radius);
  put(paint, cyl, 0, shellCenter, 0, 0, 0, 0, radius, shellH, radius);
  put(paint, hemi, 0, shellBottom + shellH, 0, 0, 0, 0, radius, dish, radius);
  put(steel, cyl, 0, shellCenter, 0, 0, 0, 0, radius + 0.02, 0.08, radius + 0.02);
  put(steel, cyl, 0, shellBottom + 0.35, 0, 0, 0, 0, radius + 0.015, 0.05, radius + 0.015);
  hoops(steel, radius, shellBottom + 0.4, shellBottom + shellH - 0.3, 4);
  manway(paint, steel, 0, shellBottom + shellH * 0.55, radius - 0.01, "z", 0.15);
  plate(steel, 0, shellBottom + shellH * 0.72, radius + 0.02, 0);
  nozzle(paint, steel, radius - 0.02, shellBottom + 0.55, 0, "x", 0.28, 0.07);
  nozzle(paint, steel, -radius + 0.02, shellBottom + 0.38, 0, "-x", 0.18, 0.045);
  nozzle(paint, steel, 0, shellBottom + shellH + dish * 0.65, 0, "y", 0.22, 0.05);
  ladder(steel, shellH + legH * 0.4, radius + 0.02, 0, legH * 0.3);
  rail(steel, shellBottom + shellH + dish * 0.2, radius * 0.62);
  put(stainless, cyl, 0, shellBottom + shellH + dish + 0.18, 0, 0, 0, 0, 0.08, 0.16, 0.08);
  put(steel, box, 0, 0.05, 0, 0, 0, 0, radius * 2.05, 0.08, radius * 2.05);

  return pack(paint, steel, stainless);
}

export function makeReactor(): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];
  const r = DIM.reactorR;
  const h = DIM.reactorShell;
  const skirt = DIM.reactorSkirt;
  const dish = r * 0.4;
  const shellCenter = skirt + h / 2;

  put(paint, cyl, 0, skirt / 2, 0, 0, 0, 0, r * 0.96, skirt, r * 0.96);
  ring(steel, r * 1.05, 0.028, 0, 0.04, 0);
  put(paint, hemi, 0, skirt, 0, Math.PI, 0, 0, r, dish, r);
  put(paint, cyl, 0, shellCenter, 0, 0, 0, 0, r, h, r);
  put(paint, hemi, 0, skirt + h, 0, 0, 0, 0, r, dish, r);
  put(paint, cyl, 0, shellCenter, 0, 0, 0, 0, r * 1.045, h * 0.34, r * 1.045);
  put(steel, cyl, 0, skirt + 0.08, 0, 0, 0, 0, r * 1.04, 0.06, r * 1.04);
  put(steel, cyl, 0, skirt + h - 0.08, 0, 0, 0, 0, r * 1.04, 0.06, r * 1.04);
  hoops(steel, r, skirt + 0.35, skirt + h - 0.3, 5);
  anchors(steel, r * 1.08, 0.06, 10);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    put(steel, box, Math.cos(a) * r * 0.96, skirt * 0.42, Math.sin(a) * r * 0.96, 0, -a, 0, 0.32, 0.24, 0.05);
  }
  manway(paint, steel, -r + 0.01, skirt + h * 0.42, 0, "-x", 0.17);
  plate(steel, r + 0.02, skirt + h * 0.55, 0.15, Math.PI / 2);

  nozzle(paint, steel, 0, 1.48, r - 0.02, "z", 0.32, 0.08);
  nozzle(paint, steel, 0, skirt + h - 0.38, -(r - 0.02), "-z", 0.34, 0.09);
  nozzle(paint, steel, r * 0.55, skirt + h + dish * 0.45, 0, "y", 0.16, 0.07);
  nozzle(stainless, steel, 0, skirt + h * 0.62, r * 0.98, "z", 0.16, 0.035);

  ladder(steel, h + skirt * 0.5, r + 0.05, 0.15, skirt * 0.2);
  put(steel, box, 1.15, 2.22, 0.15, 0, 0, 0, 1.5, 0.045, 0.85);
  put(steel, cylLow, 0.55, 1.11, 0.45, 0, 0, 0, 0.035, 2.22, 0.035);
  put(steel, cylLow, 1.75, 1.11, 0.45, 0, 0, 0, 0.035, 2.22, 0.035);
  put(steel, cylLow, 0.55, 1.11, -0.2, 0, 0, 0, 0.035, 2.22, 0.035);
  put(steel, cylLow, 1.75, 1.11, -0.2, 0, 0, 0, 0.035, 2.22, 0.035);
  const deck = 2.245;
  for (const y of [deck + 0.5, deck + 1.0]) {
    put(steel, box, 1.88, y, 0.15, 0, 0, 0, 0.028, 0.028, 0.85);
    put(steel, box, 1.42, y, 0.565, 0, 0, 0, 0.92, 0.028, 0.028);
    put(steel, box, 1.42, y, -0.265, 0, 0, 0, 0.92, 0.028, 0.028);
  }
  put(steel, box, 1.88, deck + 0.05, 0.15, 0, 0, 0, 0.012, 0.1, 0.85);
  put(steel, box, 1.42, deck + 0.05, 0.57, 0, 0, 0, 0.92, 0.1, 0.012);
  put(steel, box, 1.42, deck + 0.05, -0.27, 0, 0, 0, 0.92, 0.1, 0.012);
  for (const [px, pz] of [
    [1.88, 0.565],
    [1.88, -0.265],
    [0.96, 0.565],
    [0.96, -0.265],
    [1.88, 0.15],
  ]) {
    put(steel, cylLow, px, deck + 0.5, pz, 0, 0, 0, 0.02, 1.0, 0.02);
  }
  for (let i = 0; i < 9; i += 1) {
    put(steel, box, 0.46 + i * 0.18, deck + 0.012, 0.15, 0, 0, 0, 0.012, 0.012, 0.83);
  }

  put(stainless, cyl, 0, skirt + h + dish + 0.12, 0, 0, 0, 0, 0.16, 0.22, 0.16);

  return pack(paint, steel, stainless);
}

export function makeColumn(radius: number, height: number, skirtH: number): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];
  const dish = radius * 0.45;
  const shellCenter = skirtH + height / 2;

  put(steel, cyl, 0, skirtH / 2, 0, 0, 0, 0, radius * 1.18, skirtH, radius * 1.18);
  put(paint, cyl, 0, shellCenter, 0, 0, 0, 0, radius, height, radius);
  put(paint, hemi, 0, skirtH + height, 0, 0, 0, 0, radius, dish, radius);
  put(paint, hemi, 0, skirtH, 0, Math.PI, 0, 0, radius * 1.05, dish * 0.8, radius * 1.05);

  const trays = Math.floor(height / 0.85);
  for (let i = 1; i < trays; i += 1) {
    ring(steel, radius + 0.012, 0.012, 0, skirtH + i * (height / trays), 0);
  }
  hoops(steel, radius, skirtH + 0.4, skirtH + height - 0.4, 6);
  anchors(steel, radius * 1.22, 0.05, 8);
  plate(steel, radius + 0.03, skirtH + height * 0.18, 0, Math.PI / 2);
  nozzle(paint, steel, 0, skirtH + height * 0.55, radius - 0.01, "z", 0.22, 0.055);
  nozzle(paint, steel, radius - 0.01, skirtH + height * 0.78, 0, "x", 0.2, 0.045);

  const decks = Math.max(2, Math.floor(height / 2.7));
  for (let i = 1; i <= decks; i += 1) {
    const y = skirtH + (i * height) / (decks + 0.4);
    const deckR = radius + 0.11;
    const walk = new TorusGeometry(deckR, 0.13, 8, 28);
    put(steel, walk, 0, y, 0, Math.PI / 2);
    walk.dispose();
    for (let k = 0; k < 4; k += 1) {
      const a = (k / 4) * Math.PI * 2 + 0.6;
      const arm = radius + 0.2;
      put(steel, box, Math.cos(a) * arm, y - 0.08, Math.sin(a) * arm, 0, -a, 0.35, 0.04, 0.18, 0.22);
      put(
        steel,
        cylLow,
        Math.cos(a) * (radius + 0.32),
        y + 0.16,
        Math.sin(a) * (radius + 0.32),
        0,
        0,
        0,
        0.014,
        0.32,
        0.014,
      );
    }
    ring(steel, radius + 0.32, 0.013, 0, y + 0.32, 0);
  }

  ladder(steel, height + skirtH * 0.3, radius + 0.18, 0, skirtH * 0.15);
  nozzle(paint, steel, 0, skirtH + height * 0.22, radius - 0.01, "z", 0.34, 0.08);
  nozzle(stainless, steel, 0, skirtH + height + dish * 0.5, 0, "y", 0.2, 0.05);

  put(paint, cyl, 0, 0.42, 0.15, 0, 0, Math.PI / 2, radius * 0.72, radius * 2.1, radius * 0.72);
  put(steel, box, -radius * 0.7, 0.18, 0.15, 0, 0, 0, 0.12, 0.28, radius * 0.9);
  put(steel, box, radius * 0.7, 0.18, 0.15, 0, 0, 0, 0.12, 0.28, radius * 0.9);

  return pack(paint, steel, stainless);
}

export function makeExchanger(length: number, radius: number): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];
  const y = radius + 0.42;
  put(paint, cyl, 0, y, 0, 0, 0, Math.PI / 2, radius, length, radius);
  put(steel, sphere, -length / 2, y, 0, 0, 0, 0, radius * 0.72, radius, radius);
  put(steel, sphere, length / 2, y, 0, 0, 0, 0, radius * 0.72, radius, radius);
  put(steel, cyl, -length / 2 - radius * 0.15, y, 0, 0, 0, Math.PI / 2, radius * 1.25, 0.05, radius * 1.25);
  put(steel, cyl, length / 2 + radius * 0.15, y, 0, 0, 0, Math.PI / 2, radius * 1.25, 0.05, radius * 1.25);
  for (const x of [-length * 0.22, 0, length * 0.22]) {
    put(steel, cyl, x, y, 0, 0, 0, Math.PI / 2, radius + 0.018, 0.04, radius + 0.018);
  }
  put(steel, box, -length * 0.28, 0.16, 0, 0, 0, 0, 0.16, 0.32, radius * 1.3);
  put(steel, box, length * 0.28, 0.16, 0, 0, 0, 0, 0.16, 0.32, radius * 1.3);
  put(paint, box, 0, 0.04, 0, 0, 0, 0, length + 0.8, 0.08, 1.1);
  nozzle(stainless, steel, 0, y + radius - 0.02, 0, "y", 0.22, 0.05);
  nozzle(stainless, steel, length * 0.2, y, radius - 0.02, "z", 0.2, 0.045);
  nozzle(stainless, steel, -length * 0.18, y, -(radius - 0.02), "-z", 0.18, 0.04);
  plate(steel, 0, y + radius + 0.08, 0, 0);
  return pack(paint, steel, stainless);
}

export function makeDrum(radius: number, length: number): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];
  const y = radius + 0.55;
  put(paint, cyl, 0, y, 0, 0, 0, Math.PI / 2, radius, length, radius);
  put(paint, sphere, -length / 2, y, 0, 0, 0, 0, radius * 0.55, radius, radius);
  put(paint, sphere, length / 2, y, 0, 0, 0, 0, radius * 0.55, radius, radius);
  put(steel, box, -length * 0.28, 0.28, 0, 0, 0, 0, 0.14, 0.5, radius * 1.15);
  put(steel, box, length * 0.28, 0.28, 0, 0, 0, 0, 0.14, 0.5, radius * 1.15);
  for (const x of [-length * 0.18, length * 0.18]) {
    put(steel, cyl, x, y, 0, 0, 0, Math.PI / 2, radius + 0.016, 0.035, radius + 0.016);
  }
  nozzle(stainless, steel, 0, y + radius - 0.04, 0, "y", 0.18, 0.045);
  nozzle(paint, steel, length / 2 + radius * 0.4, y, 0, "x", 0.16, 0.05);
  plate(steel, 0, y, radius + 0.02, 0);
  return pack(paint, steel, stainless);
}

export function makeRack(): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];
  const xs = [-9.2, -5.6, -2, 1.6, 5.1];
  for (const x of xs) {
    put(steel, cylLow, x, 2.35, -5.82, 0, 0, 0, 0.055, 4.7, 0.055);
    put(steel, cylLow, x, 2.35, -5.02, 0, 0, 0, 0.055, 4.7, 0.055);
    put(steel, box, x, 3.62, -5.42, 0, 0, 0, 0.08, 0.07, 0.95);
    put(steel, box, x, 4.55, -5.42, 0, 0, 0, 0.08, 0.07, 0.95);
  }
  put(steel, box, -1.6, 3.62, -5.82, 0, 0, 0, 15.2, 0.06, 0.06);
  put(steel, box, -1.6, 3.62, -5.02, 0, 0, 0, 15.2, 0.06, 0.06);
  put(steel, box, -1.6, 4.55, -5.42, 0, 0, 0, 15.2, 0.055, 0.055);

  put(paint, cyl, -2.05, 3.725, -5.7, 0, 0, Math.PI / 2, 0.07, 14.2, 0.07);
  put(stainless, cyl, -2.05, 3.705, -5.1, 0, 0, Math.PI / 2, 0.05, 14.2, 0.05);
  for (let x = -8.4; x < 5; x += 1.2) {
    put(steel, cyl, x, 3.725, -5.7, 0, 0, Math.PI / 2, 0.074, 0.03, 0.074);
  }
  put(steel, box, -2.05, 4.6, -5.12, 0, 0, 0, 14.3, 0.018, 0.42);
  put(steel, box, -2.05, 4.64, -5.33, 0, 0, 0, 14.3, 0.08, 0.012);
  put(steel, box, -2.05, 4.64, -4.91, 0, 0, 0, 14.3, 0.08, 0.012);
  for (let i = 0; i < 3; i += 1) {
    put(stainless, cyl, -2.05, 4.625, -5.25 + i * 0.12, 0, 0, Math.PI / 2, 0.022, 14.2, 0.022);
  }

  const zs = [3.2, 0.1, -2.8];
  for (const z of zs) {
    put(steel, cylLow, -6.55, 2.15, z, 0, 0, 0, 0.05, 4.3, 0.05);
    put(steel, cylLow, -5.85, 2.15, z, 0, 0, 0, 0.05, 4.3, 0.05);
    put(steel, box, -6.2, 3.85, z, 0, 0, 0, 0.85, 0.06, 0.06);
  }
  put(steel, box, -6.55, 3.85, 0.2, 0, 0, 0, 0.05, 0.05, 6.4);
  put(steel, box, -5.85, 3.85, 0.2, 0, 0, 0, 0.05, 0.05, 6.4);

  const stairX = -3.55;
  const zStart = -2.15;
  const steps = 15;
  const topY = 3.62;
  const rise = topY / steps;
  const run = 0.22;
  for (let i = 0; i < steps; i += 1) {
    put(steel, box, stairX, rise * (i + 1) - 0.02, zStart - i * run, 0, 0, 0, 0.78, 0.04, 0.2);
  }
  const zEnd = zStart - (steps - 1) * run;
  const yA = 0.08;
  const zA = zStart + 0.08;
  const yB = topY - 0.02;
  const zB = zEnd;
  const span = Math.hypot(yB - yA, zB - zA);
  const pitch = Math.atan2(-(yB - yA), zB - zA);
  const yMid = (yA + yB) / 2;
  const zMid = (zA + zB) / 2;
  for (const side of [-0.36, 0.36]) {
    put(steel, box, stairX + side, yMid, zMid, pitch, 0, 0, 0.04, 0.04, span);
    put(steel, box, stairX + side, yMid + 0.9, zMid, pitch, 0, 0, 0.022, 0.022, span);
    put(steel, cylLow, stairX + side, (yA + 0.9) / 2, zA, 0, 0, 0, 0.018, yA + 0.9, 0.018);
    put(steel, cylLow, stairX + side, yB + 0.45, zB, 0, 0, 0, 0.018, 0.9, 0.018);
  }
  put(steel, box, stairX, topY, zEnd - 0.28, 0, 0, 0, 1.05, 0.05, 0.85);

  return pack(paint, steel, stainless);
}

export function makeSite(): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];
  put(paint, box, -1.2, -0.01, -1.4, 0, 0, 0, 26.5, 0.06, 22);
  put(paint, box, -10.6, -0.005, 0.2, 0, 0, 0, 7.4, 0.05, 12.5);
  const bundH = 0.36;
  put(paint, box, -10.6, bundH / 2, 6.42, 0, 0, 0, 7.4, bundH, 0.16);
  put(paint, box, -10.6, bundH / 2, -6.02, 0, 0, 0, 7.4, bundH, 0.16);
  put(paint, box, -14.22, bundH / 2, 0.2, 0, 0, 0, 0.16, bundH, 12.3);
  put(paint, box, -6.98, bundH / 2, -3.9, 0, 0, 0, 0.16, bundH, 4.1);
  put(paint, box, -6.98, bundH / 2, 4.3, 0, 0, 0, 0.16, bundH, 4.1);
  for (const z of [-1.4, 1.8]) {
    put(steel, box, -6.98, bundH + 0.02, z, 0, 0, 0, 0.5, 0.04, 0.9);
  }
  put(steel, box, -1.2, 0.035, 9.55, 0, 0, 0, 26.6, 0.03, 0.08);
  put(steel, box, -1.2, 0.035, -12.35, 0, 0, 0, 26.6, 0.03, 0.08);
  put(steel, box, 12, 0.035, -1.4, 0, 0, 0, 0.08, 0.03, 22);
  put(steel, box, -14.4, 0.035, -1.4, 0, 0, 0, 0.08, 0.03, 22);
  return pack(paint, steel, stainless);
}

export type BuildingGeo = {
  wall: BufferGeometry | null;
  metal: BufferGeometry | null;
  dark: BufferGeometry | null;
  glass: BufferGeometry | null;
  concrete: BufferGeometry | null;
};

function building(
  w: number,
  h: number,
  d: number,
  docks: number,
  stair: boolean,
): BuildingGeo {
  const wall: BufferGeometry[] = [];
  const metal: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const concrete: BufferGeometry[] = [];
  const plinth = 0.28;

  put(concrete, box, 0, 0.09, 0, 0, 0, 0, w + 1.4, 0.18, d + 1.4);
  put(wall, box, 0, plinth + h / 2, 0, 0, 0, 0, w, h, d);

  const ribY = plinth + h / 2;
  const ribH = h * 0.98;
  for (let x = -w / 2 + 4.4; x < w / 2 - 2.2; x += 4.4) {
    put(metal, box, x, ribY, d / 2 + 0.02, 0, 0, 0, 0.03, ribH, 0.035);
    put(metal, box, x, ribY, -(d / 2 + 0.02), 0, 0, 0, 0.03, ribH, 0.035);
  }
  put(metal, box, 0, plinth + h * 0.46, d / 2 + 0.025, 0, 0, 0, w, 0.045, 0.03);
  put(metal, box, 0, plinth + h * 0.46, -(d / 2 + 0.025), 0, 0, 0, w, 0.045, 0.03);

  const corners: Array<[number, number]> = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (const [sx, sz] of corners) {
    put(metal, box, (sx * w) / 2, plinth + h / 2, (sz * d) / 2, 0, 0, 0, 0.24, h + 0.15, 0.24);
    put(metal, cylLow, sx * (w / 2 - 0.18), plinth + h / 2, sz * (d / 2 - 0.08), 0, 0, 0, 0.035, h, 0.035);
  }

  put(metal, box, 0, plinth + h + 0.14, 0, 0, 0, 0, w + 0.85, 0.2, d + 0.85);
  put(metal, box, 0, plinth + h + 0.02, d / 2 + 0.32, 0, 0, 0, w + 0.4, 0.07, 0.14);
  put(metal, box, 0, plinth + h + 0.02, -(d / 2 + 0.32), 0, 0, 0, w + 0.4, 0.07, 0.14);

  const monW = Math.min(w * 0.38, 11);
  const monD = Math.min(d * 0.34, 3.4);
  put(wall, box, 0, plinth + h + 0.62, 0, 0, 0, 0, monW, 0.72, monD);
  put(glass, box, 0, plinth + h + 0.62, monD / 2 + 0.02, 0, 0, 0, monW * 0.78, 0.34, 0.035);
  put(glass, box, 0, plinth + h + 0.62, -(monD / 2 + 0.02), 0, 0, 0, monW * 0.78, 0.34, 0.035);
  put(metal, box, 0, plinth + h + 1.04, 0, 0, 0, 0, monW + 0.35, 0.08, monD + 0.35);

  const fans = Math.max(2, Math.round(w / 11));
  for (let i = 0; i < fans; i += 1) {
    const x = -w * 0.26 + (i * (w * 0.52)) / Math.max(1, fans - 1);
    put(metal, cyl, x, plinth + h + 0.42, d * 0.18, 0, 0, 0, 0.48, 0.26, 0.48);
    put(dark, cyl, x, plinth + h + 0.58, d * 0.18, 0, 0, 0, 0.32, 0.05, 0.32);
  }

  put(metal, cyl, w * 0.3, plinth + h + 1.85, -d * 0.2, 0, 0, 0, 0.2, 3.3, 0.2);
  put(metal, cyl, w * 0.3, plinth + h + 3.55, -d * 0.2, 0, 0, 0, 0.3, 0.07, 0.3);
  put(metal, box, -w * 0.2, plinth + h + 0.52, -d * 0.16, 0, 0, 0, 1.7, 0.72, 1.15);
  put(dark, box, -w * 0.2, plinth + h + 0.72, -d * 0.16 + 0.58, 0, 0, 0, 1.25, 0.32, 0.04);

  const pane = 1.45;
  const count = Math.max(2, Math.floor((w * 0.62) / (pane + 0.38)));
  const span = count * pane + (count - 1) * 0.38;
  for (let i = 0; i < count; i += 1) {
    const x = -span / 2 + pane / 2 + i * (pane + 0.38);
    const y = plinth + h * 0.72;
    put(dark, box, x, y, d / 2 + 0.012, 0, 0, 0, pane * 0.92, 0.48, 0.03);
    put(glass, box, x, y, d / 2 + 0.03, 0, 0, 0, pane * 0.86, 0.4, 0.03);
    put(metal, box, x, y + 0.28, d / 2 + 0.045, 0, 0, 0, pane, 0.045, 0.04);
    put(metal, box, x, y - 0.28, d / 2 + 0.045, 0, 0, 0, pane, 0.045, 0.04);
  }

  const dockW = 2.05;
  const dockSpan = docks * dockW + Math.max(0, docks - 1) * 0.55;
  for (let i = 0; i < docks; i += 1) {
    const x = -dockSpan / 2 + dockW / 2 + i * (dockW + 0.55);
    put(dark, box, x, plinth + 1.4, d / 2 + 0.03, 0, 0, 0, dockW, 2.55, 0.05);
    put(metal, box, x, 0.42, d / 2 + 0.16, 0, 0, 0, dockW + 0.15, 0.16, 0.12);
    put(concrete, box, x, 0.18, d / 2 + 1.35, 0, 0, 0, dockW + 0.4, 0.22, 1.5);
  }
  if (docks > 0) {
    put(metal, box, 0, plinth + 3.05, d / 2 + 1.2, 0, 0, 0, dockSpan + 1.4, 0.09, 2.5);
    put(metal, cylLow, -dockSpan / 2, 1.55, d / 2 + 2.2, 0, 0, 0, 0.055, 3.1, 0.055);
    put(metal, cylLow, dockSpan / 2, 1.55, d / 2 + 2.2, 0, 0, 0, 0.055, 3.1, 0.055);
  }
  put(dark, box, w / 2 - 1.35, plinth + 1.15, d / 2 + 0.03, 0, 0, 0, 0.85, 2.1, 0.045);
  put(metal, box, w / 2 - 1.35, plinth + 2.32, d / 2 + 0.48, 0, 0, 0, 1.15, 0.06, 0.95);
  put(metal, cylLow, w / 2 - 1.8, plinth + 2.05, d / 2 + 0.85, 0, 0, 0, 0.03, 0.55, 0.03);
  put(metal, cylLow, w / 2 - 0.9, plinth + 2.05, d / 2 + 0.85, 0, 0, 0, 0.03, 0.55, 0.03);
  put(dark, box, w / 2 - 1.35, plinth + 2.55, d / 2 + 0.22, 0, 0, 0, 0.22, 0.12, 0.1);

  const lowY = plinth + h * 0.38;
  for (let i = 0; i < count; i += 1) {
    const x = -span / 2 + pane / 2 + i * (pane + 0.38);
    put(dark, box, x, lowY, d / 2 + 0.012, 0, 0, 0, pane * 0.92, 0.42, 0.03);
    put(glass, box, x, lowY, d / 2 + 0.03, 0, 0, 0, pane * 0.86, 0.34, 0.03);
  }
  if (d > 8) {
    const sideN = Math.max(1, Math.floor(d / 3.8));
    for (let i = 0; i < sideN; i += 1) {
      const z = -d * 0.28 + (i * d * 0.56) / Math.max(1, sideN - 1);
      put(dark, box, w / 2 + 0.012, plinth + h * 0.62, z, 0, 0, 0, 0.03, 0.7, 0.85);
      put(glass, box, w / 2 + 0.03, plinth + h * 0.62, z, 0, 0, 0, 0.03, 0.55, 0.72);
    }
  }
  for (const [sx, sz] of corners) {
    put(metal, cylLow, sx * (w / 2 - 0.14), plinth + h / 2, sz * (d / 2 - 0.14), 0, 0, 0, 0.04, h + 0.2, 0.04);
    put(metal, box, sx * (w / 2 - 0.14), plinth + 0.18, sz * (d / 2 + 0.18), 0, 0, 0, 0.12, 0.08, 0.42);
  }

  if (stair) {
    const tw = 2.35;
    const td = Math.min(4.4, d * 0.48);
    const th = h + 1.15;
    put(wall, box, -w / 2 - tw / 2 + 0.08, plinth + th / 2, 0, 0, 0, 0, tw, th, td);
    put(metal, box, -w / 2 - tw / 2 + 0.08, plinth + th + 0.08, 0, 0, 0, 0, tw + 0.28, 0.1, td + 0.28);
    for (let i = 0; i < 5; i += 1) {
      put(glass, box, -w / 2 - tw + 0.06, plinth + 1.15 + i * (h / 5.2), 0, 0, 0, 0, 0.04, 0.26, td * 0.55);
    }
  }

  return {
    wall: fuse(wall),
    metal: fuse(metal),
    dark: fuse(dark),
    glass: fuse(glass),
    concrete: fuse(concrete),
  };
}

export function makeCoolingTower(): BuildingGeo {
  const wall: BufferGeometry[] = [];
  const metal: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const concrete: BufferGeometry[] = [];
  const profile = [
    new Vector2(1.95, 2.05),
    new Vector2(1.62, 3.4),
    new Vector2(1.32, 5.6),
    new Vector2(1.16, 7.7),
    new Vector2(1.22, 9.15),
    new Vector2(1.48, 10.2),
  ];
  wall.push(new LatheGeometry(profile, 32));
  put(concrete, cyl, 0, 0.32, 0, 0, 0, 0, 2.55, 0.64, 2.55);
  put(metal, cyl, 0, 0.68, 0, 0, 0, 0, 2.35, 0.06, 2.35);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    put(metal, cylLow, Math.cos(a) * 1.82, 1.1, Math.sin(a) * 1.82, 0, 0, 0, 0.08, 2.15, 0.08);
  }
  put(metal, cyl, 0, 10.38, 0, 0, 0, 0, 1.72, 0.14, 1.72);
  put(dark, cyl, 0, 10.52, 0, 0, 0, 0, 0.95, 0.06, 0.95);
  ring(metal, 1.62, 0.025, 0, 10.62, 0);
  put(metal, cyl, 0, 10.72, 0, 0, 0, 0, 0.18, 0.28, 0.18);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2;
    put(dark, box, Math.cos(a) * 0.55, 10.72, Math.sin(a) * 0.55, 0, -a, 0.12, 1.15, 0.04, 0.28);
  }
  ring(metal, 2.2, 0.02, 0, 1.95, 0);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    put(metal, cylLow, Math.cos(a) * 2.2, 2.2, Math.sin(a) * 2.2, 0, 0, 0, 0.02, 0.5, 0.02);
  }
  ring(metal, 2.2, 0.018, 0, 2.45, 0);
  for (let i = 0; i < 3; i += 1) {
    ring(dark, 1.55 - i * 0.08, 0.012, 0, 2.35 + i * 0.22, 0);
  }
  return {
    wall: fuse(wall),
    metal: fuse(metal),
    dark: fuse(dark),
    glass: fuse(glass),
    concrete: fuse(concrete),
  };
}

export function makePipeRun(x0: number, z0: number, x1: number, z1: number, y: number): BuildingGeo {
  const wall: BufferGeometry[] = [];
  const metal: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const concrete: BufferGeometry[] = [];
  const len = Math.hypot(x1 - x0, z1 - z0);
  const yaw = Math.atan2(z1 - z0, x1 - x0);
  put(metal, box, 0, y, 0, 0, 0, 0, len, 0.12, 0.14);
  put(metal, box, 0, y + 0.48, 0, 0, 0, 0, len, 0.08, 0.08);
  const posts = Math.max(2, Math.round(len / 8));
  for (let i = 0; i <= posts; i += 1) {
    const x = -len / 2 + (i * len) / posts;
    put(metal, cylLow, x, y / 2, 0.42, 0, 0, 0, 0.045, y, 0.045);
    put(metal, cylLow, x, y / 2, -0.42, 0, 0, 0, 0.045, y, 0.045);
    put(metal, box, x, y + 0.22, 0, 0, 0, 0, 0.08, 0.08, 1.05);
  }
  for (const z of [-0.22, 0.02, 0.26]) {
    put(wall, cyl, 0, y + 0.24, z, 0, 0, Math.PI / 2, 0.065, len * 0.98, 0.065);
  }
  const placed = {
    wall: fuse(wall),
    metal: fuse(metal),
    dark: fuse(dark),
    glass: fuse(glass),
    concrete: fuse(concrete),
  };
  const shift = new Matrix4().makeRotationY(yaw);
  shift.setPosition((x0 + x1) / 2, 0, (z0 + z1) / 2);
  for (const geo of Object.values(placed)) geo?.applyMatrix4(shift);
  return placed;
}

export function makeTransformer(): BuildingGeo {
  const wall: BufferGeometry[] = [];
  const metal: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const concrete: BufferGeometry[] = [];
  put(concrete, box, 0, 0.12, 0, 0, 0, 0, 2.6, 0.24, 1.8);
  put(metal, box, 0, 1.25, 0, 0, 0, 0, 1.7, 1.9, 1.05);
  for (let i = 0; i < 7; i += 1) {
    put(metal, box, 0.95, 1.2, -0.72 + i * 0.24, 0, 0, 0, 0.08, 1.35, 0.05);
  }
  put(dark, cyl, -0.35, 2.45, 0.15, 0, 0, 0, 0.07, 0.42, 0.07);
  put(dark, cyl, 0.05, 2.55, 0.15, 0, 0, 0, 0.07, 0.55, 0.07);
  put(dark, cyl, 0.45, 2.4, 0.15, 0, 0, 0, 0.07, 0.36, 0.07);
  put(metal, cyl, 0.15, 2.15, -0.15, 0, 0, Math.PI / 2, 0.16, 1.15, 0.16);
  return {
    wall: fuse(wall),
    metal: fuse(metal),
    dark: fuse(dark),
    glass: fuse(glass),
    concrete: fuse(concrete),
  };
}

export function makeCompound(x0: number, x1: number, z0: number, z1: number, gate: [number, number]): BuildingGeo {
  const wall: BufferGeometry[] = [];
  const metal: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const concrete: BufferGeometry[] = [];
  const fenceH = 1.9;

  const run = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az);
    if (len < 0.2) return;
    const yaw = -Math.atan2(bz - az, bx - ax);
    const cx = (ax + bx) / 2;
    const cz = (az + bz) / 2;
    put(concrete, box, cx, 0.08, cz, 0, yaw, 0, len + 0.3, 0.16, 0.3);
    for (const y of [0.35, fenceH * 0.52, fenceH]) {
      put(metal, box, cx, y, cz, 0, yaw, 0, len, 0.035, 0.035);
    }
    const posts = Math.max(1, Math.round(len / 3));
    for (let i = 0; i <= posts; i += 1) {
      const t = i / posts;
      put(metal, cylLow, ax + (bx - ax) * t, fenceH / 2 + 0.08, az + (bz - az) * t, 0, 0, 0, 0.04, fenceH, 0.04);
    }
  };

  run(x0, z0, x1, z0);
  run(x1, z0, x1, z1);
  run(x0, z0, x0, z1);
  run(x0, z1, gate[0], z1);
  run(gate[1], z1, x1, z1);

  for (const gx of gate) {
    put(metal, box, gx, 1.2, z1, 0, 0, 0, 0.22, 2.4, 0.22);
  }
  const gateW = (gate[1] - gate[0]) * 0.46;
  const gateX = gate[0] - gateW / 2 + 0.2;
  put(metal, box, gateX, 0.3, z1 - 0.35, 0, 0, 0, gateW, 0.06, 0.05);
  put(metal, box, gateX, 1.75, z1 - 0.35, 0, 0, 0, gateW, 0.06, 0.05);
  for (let i = 0; i <= 6; i += 1) {
    put(metal, box, gateX - gateW / 2 + (i * gateW) / 6, 1.02, z1 - 0.35, 0, 0, 0, 0.04, 1.5, 0.04);
  }
  put(dark, box, gate[1] + 0.9, 1.15, z1 + 0.05, 0, 0, 0, 1.2, 0.6, 0.04);

  const mast = 9.5;
  for (const [mx, mz] of [
    [x0, z0],
    [x0, z1],
  ]) {
    const inX = mx < 0 ? 0.9 : -0.9;
    const inZ = mz < 0 ? 0.9 : -0.9;
    const px = mx + inX;
    const pz = mz + inZ;
    put(concrete, cyl, px, 0.2, pz, 0, 0, 0, 0.32, 0.4, 0.32);
    put(metal, cyl, px, mast / 2, pz, 0, 0, 0, 0.09, mast, 0.09);
    put(metal, box, px, mast, pz, 0, Math.atan2(inX, inZ) + Math.PI / 2, 0, 1.3, 0.07, 0.07);
    for (const off of [-0.45, 0.45]) {
      const a = Math.atan2(inX, inZ) + Math.PI / 2;
      put(dark, box, px + Math.cos(a) * off, mast - 0.18, pz - Math.sin(a) * off, 0.5, a, 0, 0.36, 0.22, 0.12);
    }
  }

  return {
    wall: fuse(wall),
    metal: fuse(metal),
    dark: fuse(dark),
    glass: fuse(glass),
    concrete: fuse(concrete),
  };
}

export type SiteDetailGeo = {
  metal: BufferGeometry | null;
  dark: BufferGeometry | null;
  glass: BufferGeometry | null;
  marking: BufferGeometry | null;
  container: BufferGeometry | null;
  concrete: BufferGeometry | null;
};

function streetLight(metal: BufferGeometry[], dark: BufferGeometry[], concrete: BufferGeometry[], x: number, z: number, armYaw: number) {
  const h = 7.2;
  put(concrete, cyl, x, 0.15, z, 0, 0, 0, 0.26, 0.3, 0.26);
  put(metal, cyl, x, h / 2, z, 0, 0, 0, 0.075, h, 0.075);
  const ax = Math.cos(armYaw);
  const az = -Math.sin(armYaw);
  put(metal, box, x + ax * 0.75, h - 0.05, z + az * 0.75, 0, armYaw, 0, 1.5, 0.06, 0.06);
  put(dark, box, x + ax * 1.45, h - 0.14, z + az * 1.45, 0, armYaw, 0, 0.62, 0.12, 0.3);
}

export function makeSiteDetail(): SiteDetailGeo {
  const metal: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const marking: BufferGeometry[] = [];
  const container: BufferGeometry[] = [];
  const concrete: BufferGeometry[] = [];

  for (let x = -45; x < 30; x += 6) {
    if (x > 15 && x < 21) continue;
    put(marking, box, x + 1.5, 0.085, 20, 0, 0, 0, 3, 0.012, 0.13);
  }
  for (let z = -15; z < 25; z += 6) {
    if (z > 17 && z < 23) continue;
    put(marking, box, 18, 0.085, z + 1.5, 0, 0, 0, 0.13, 0.012, 3);
  }
  for (let i = 0; i < 7; i += 1) {
    put(marking, box, 16.3 + i * 0.5, 0.086, 23.4, 0, 0, 0, 0.3, 0.012, 2.4);
  }

  const stacks: Array<[number, number, number]> = [
    [-64.4, 0, 30],
    [-64.4, 0, 32.6],
    [-64.4, 1, 30],
    [-64.4, 0, 35.2],
    [-64.4, 1, 32.6],
    [-64.4, 0, 40.4],
    [-64.4, 0, 43],
    [-64.4, 1, 43],
  ];
  for (const [x, level, z] of stacks) {
    const y = 1.3 + level * 2.6;
    put(container, box, x, y, z, 0, 0, 0, 6.06, 2.59, 2.44);
    put(metal, box, x + 3.04, y, z, 0, 0, 0, 0.04, 2.5, 2.34);
    put(dark, box, x + 3.06, y, z + 0.6, 0, 0, 0, 0.02, 2.3, 0.05);
    put(dark, box, x + 3.06, y, z - 0.6, 0, 0, 0, 0.02, 2.3, 0.05);
  }

  for (const x of [-44, -32, -20, 26]) streetLight(metal, dark, concrete, x, 22.5, Math.PI / 2);
  for (const z of [-12, 2]) streetLight(metal, dark, concrete, 20.7, z, Math.PI);

  const fence = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az);
    const yaw = -Math.atan2(bz - az, bx - ax);
    const cx = (ax + bx) / 2;
    const cz = (az + bz) / 2;
    put(metal, box, cx, 2.1, cz, 0, yaw, 0, len, 0.04, 0.04);
    put(metal, box, cx, 1.05, cz, 0, yaw, 0, len, 0.035, 0.035);
    put(concrete, box, cx, 0.08, cz, 0, yaw, 0, len, 0.16, 0.26);
    const posts = Math.round(len / 4);
    for (let i = 0; i <= posts; i += 1) {
      const t = i / posts;
      put(metal, cylLow, ax + (bx - ax) * t, 1.1, az + (bz - az) * t, 0, 0, 0, 0.045, 2.2, 0.045);
    }
  };
  fence(-68, -62, 68, -62);
  fence(68, -62, 68, 60);
  fence(-68, -62, -68, 14);
  fence(-68, 26, -68, 60);
  fence(-68, 60, 68, 60);
  for (const z of [14, 26]) put(metal, box, -68, 1.4, z, 0, 0, 0, 0.3, 2.8, 0.3);
  put(dark, box, -66.2, 1.5, 12.2, 0, 0, 0, 2.2, 2.6, 2.6);
  put(metal, box, -66.2, 2.9, 12.2, 0, 0, 0, 2.6, 0.12, 3);
  put(glass, box, -65.08, 1.8, 12.2, 0, 0, 0, 0.04, 0.9, 1.8);
  put(metal, box, -64, 1.05, 20, 0, 0, 0, 0.08, 0.08, 11.5);

  const pack = (list: BufferGeometry[]) => fuse(list);
  return {
    metal: pack(metal),
    dark: pack(dark),
    glass: pack(glass),
    marking: pack(marking),
    container: pack(container),
    concrete: pack(concrete),
  };
}

export function makeYard(): GeoSet {
  const paint: BufferGeometry[] = [];
  const steel: BufferGeometry[] = [];
  const stainless: BufferGeometry[] = [];

  put(steel, box, -6.2, 2.15, -1.1, 0, 0, 0, 0.42, 0.06, 8.6);
  put(steel, box, -6.2, 2.08, -1.1, 0, 0, 0, 0.38, 0.08, 8.4);
  for (const z of [-4.8, -2.4, 0, 2.4]) {
    put(steel, cylLow, -6.2, 1.05, z, 0, 0, 0, 0.03, 2.1, 0.03);
  }
  for (let i = 0; i < 5; i += 1) {
    put(stainless, cyl, -6.2, 2.18, -4.4 + i * 1.6, 0, 0, Math.PI / 2, 0.018, 1.5, 0.018);
  }

  put(paint, cyl, 7.6, 0.42, 6.15, 0, 0, 0, 0.12, 0.84, 0.12);
  put(steel, cyl, 7.6, 0.88, 6.15, 0, 0, 0, 0.16, 0.08, 0.16);
  put(steel, box, 7.6, 0.62, 6.42, 0, 0, 0, 0.08, 0.08, 0.42);
  put(paint, box, 7.6, 0.06, 6.15, 0, 0, 0, 0.55, 0.1, 0.55);

  put(steel, cyl, -7.15, 1.15, 6.4, 0, 0, 0, 0.04, 2.3, 0.04);
  put(stainless, cyl, -7.15, 2.35, 6.4, 0, 0, 0, 0.16, 0.08, 0.16);
  put(steel, box, -7.15, 1.55, 6.62, Math.PI / 2, 0, 0, 0.04, 0.55, 0.04);
  put(paint, box, -7.15, 0.06, 6.4, 0, 0, 0, 0.85, 0.1, 0.85);

  put(steel, box, 1.8, 0.02, 4.8, 0, 0, 0, 1.4, 0.04, 1.1);
  for (let x = 0; x < 6; x += 1) {
    put(steel, box, 1.25 + x * 0.22, 0.035, 4.8, 0, 0, 0, 0.03, 0.02, 1.0);
  }

  put(paint, box, 8.9, 0.62, -6.4, 0, 0, 0, 0.85, 1.24, 0.55);
  put(steel, box, 8.9, 1.28, -6.4, 0, 0, 0, 0.9, 0.06, 0.6);
  put(steel, box, 8.9, 0.7, -6.12, 0, 0, 0, 0.7, 0.9, 0.03);

  for (const [x, z] of [
    [6.4, 5.2],
    [7.15, 5.2],
  ]) {
    put(paint, box, x, 0.55, z, 0, 0, 0, 0.62, 1.05, 0.62);
    put(steel, box, x, 1.1, z, 0, 0, 0, 0.66, 0.05, 0.66);
  }

  put(steel, box, 5.4, 0.85, 4.35, 0, 0, 0, 0.12, 1.7, 0.12);
  put(paint, box, 5.4, 1.55, 4.5, 0, 0, 0, 0.28, 0.38, 0.16);

  return pack(paint, steel, stainless);
}

export const siteDetailGeo = makeSiteDetail();
export const yardGeo = makeYard();

/** Equipment that makes each department readable as itself, in world space. */
function makeDepartments(): BuildingGeo {
  const wall: BufferGeometry[] = [];
  const metal: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];
  const glass: BufferGeometry[] = [];
  const concrete: BufferGeometry[] = [];

  const silo = (x: number, z: number) => {
    put(concrete, cylLow, x, 0.16, z, 0, 0, 0, 1.85, 0.32, 1.85);
    put(metal, cyl, x, 4.1, z, 0, 0, 0, 1.32, 7.1, 1.32);
    put(metal, hemi, x, 7.65, z, 0, 0, 0, 1.32, 0.72, 1.32);
    ring(metal, 1.36, 0.045, x, 2.1, z);
    ring(metal, 1.36, 0.045, x, 5.6, z);
    put(dark, cyl, x, 8.55, z, 0, 0, 0, 0.1, 1.1, 0.1);
    put(metal, cyl, x, 1.15, z - 1.7, 0, 0, Math.PI / 2, 0.08, 2.6, 0.08);
  };
  silo(-4, -38.8);
  silo(16, -38.8);

  const stack = (x: number, y0: number, z: number, h: number) => {
    put(metal, cyl, x, y0 + h / 2, z, 0, 0, 0, 0.32, h, 0.32);
    put(metal, cyl, x, y0 + h + 0.08, z, 0, 0, 0, 0.46, 0.22, 0.46);
    put(dark, cyl, x, y0 + h + 0.24, z, 0, 0, 0, 0.24, 0.12, 0.24);
    ring(metal, 0.4, 0.03, x, y0 + h * 0.45, z);
  };
  stack(39.2, 6.6, 25.2, 7.4);
  stack(43.6, 7.4, -1.2, 10.5);

  for (const z of [-24, -32]) {
    put(concrete, cylLow, 56, 0.4, z, 0, 0, 0, 3.4, 0.8, 3.4);
    put(concrete, cylLow, 56, 0.85, z, 0, 0, 0, 2.5, 0.12, 2.5);
    put(metal, cyl, 56, 1.15, z, 0, 0, 0, 0.1, 1.5, 0.1);
    ring(metal, 2.55, 0.04, 56, 0.82, z);
  }
  put(metal, cyl, 50.5, 0.55, -36, 0, 0, Math.PI / 2, 0.07, 10, 0.07);

  put(concrete, box, -30, 0.12, -29.4, 0, 0, 0, 3.6, 0.24, 3.4);
  put(metal, cyl, -30, 2.15, -29.4, 0, 0, 0, 0.62, 3.4, 0.62);
  put(metal, hemi, -30, 3.85, -29.4, 0, 0, 0, 0.62, 0.4, 0.62);
  put(dark, cyl, -30, 4.45, -29.4, 0, 0, 0, 0.07, 0.9, 0.07);
  put(metal, box, -28.6, 0.75, -28, 0, 0, 0, 0.85, 1.15, 0.65);
  put(glass, box, -28.16, 0.85, -28, 0, 0, 0, 0.03, 0.45, 0.4);

  for (const x of [-43.2, -32.8]) {
    put(metal, box, x, 2.4, -11.2, 0, 0, 0, 0.16, 4.8, 0.16);
  }
  put(metal, box, -38, 4.7, -11.2, 0, 0, 0, 10.6, 0.18, 0.22);
  put(dark, box, -38, 4.35, -11.2, 0, 0, 0, 1.6, 0.35, 0.7);
  put(concrete, box, -44.2, 0.45, -12.6, 0, 0, 0, 1.3, 0.9, 1.1);
  put(concrete, box, -44.2, 1.35, -12.6, 0, 0, 0, 1.15, 0.7, 0.95);

  const pack = (list: BufferGeometry[]) => fuse(list);
  return { wall: pack(wall), metal: pack(metal), dark: pack(dark), glass: pack(glass), concrete: pack(concrete) };
}

export const deptGeo = makeDepartments();
export const hallMaint = building(16, 6.2, 10, 1, false);

export const hallWarehouse = building(24, 8.5, 16, 3, true);
export const hallControl = building(7.5, 3.8, 5.2, 0, false);
export const hallAdmin = building(12, 6, 8, 0, true);
export const plantCompound = makeCompound(-16, 15.2, -15, 15.5, [-3, 3]);
export const hallProduction = building(30, 9.5, 14, 2, true);
export const hallNorth = building(18, 8, 12, 1, false);
export const hallLab = building(14, 6.2, 11, 1, false);
export const hallPack = building(20, 7.2, 12, 2, true);
export const hallUtility = building(16, 7, 18, 1, false);
export const hallWaste = building(14, 5.4, 12, 1, false);
export const towerGeo = makeCoolingTower();
export const transformerGeo = makeTransformer();
export const rackWest = makePipeRun(-28, 18, 0, 2, 4.3);
export const rackEast = makePipeRun(18, -8, 46, -6, 4.5);
export const rackNorth = makePipeRun(4, -18, 4, -36, 5.4);

export const tankGeo = makeTank(DIM.tankR, DIM.tankShell, DIM.tankLeg);
export const largeTankGeo = makeTank(DIM.largeR, DIM.largeShell, DIM.largeLeg);
export const reactorGeo = makeReactor();
export const columnGeo = makeColumn(DIM.colR, DIM.colH, DIM.colSkirt);
export const columnSmallGeo = makeColumn(DIM.col2R, DIM.col2H, 0.55);
export const exchangerGeo = makeExchanger(2.7, 0.38);
export const exchangerSmallGeo = makeExchanger(2.15, 0.3);
export const drumGeo = makeDrum(0.72, 3.3);
export const rackGeo = makeRack();
export const siteGeo = makeSite();
