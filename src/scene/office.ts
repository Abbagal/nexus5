import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * Office floors are authored at real scale (metres, floor top at y = 0, x ±9, z ±6) and the
 * whole floor is scaled by one half when placed in the scene. The camera looks from +z, so
 * most people face -z: you see screens lit and backs turned.
 */
export type Bucket =
  | "top"
  | "frame"
  | "dark"
  | "screen"
  | "ledA"
  | "ledB"
  | "fabric"
  | "seat"
  | "carpet"
  | "skin"
  | "clothA"
  | "clothB"
  | "clothC"
  | "clothD"
  | "leaf"
  | "pot"
  | "paper"
  | "carton"
  | "wood"
  | "warm"
  | "steel"
  | "amber"
  | "hazard"
  | "clear"
  | "drum"
  | "drumGrey"
  | "glass";

export type FloorGeo = Partial<Record<Bucket, BufferGeometry>>;

const boxT = new BoxGeometry(1, 1, 1);
const cylT = new CylinderGeometry(1, 1, 1, 12);
const sphT = new SphereGeometry(1, 10, 8);
const capT = new CapsuleGeometry(0.5, 1, 2, 6);

const m = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const up = new Vector3(0, 1, 0);

export type Parts = Partial<Record<Bucket, BufferGeometry[]>>;

export function seeded(seed: number) {
  let s = seed * 7919 + 104729;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export type Rand = () => number;

/** A local coordinate frame on the floor: position and yaw, forward is +z. */
export class Frame {
  parts: Parts;
  x: number;
  z: number;
  a: number;
  y0: number;

  constructor(parts: Parts, x: number, z: number, a: number, y0 = 0) {
    this.parts = parts;
    this.x = x;
    this.z = z;
    this.a = a;
    this.y0 = y0;
  }

  at(px: number, pz: number, da = 0) {
    const w = this.w(px, 0, pz);
    return new Frame(this.parts, w.x, w.z, this.a + da, this.y0);
  }

  /** The same frame raised, for platforms and mezzanines. */
  up(dy: number) {
    return new Frame(this.parts, this.x, this.z, this.a, this.y0 + dy);
  }

  w(px: number, py: number, pz: number) {
    const c = Math.cos(this.a);
    const s = Math.sin(this.a);
    return new Vector3(this.x + px * c + pz * s, py + this.y0, this.z - px * s + pz * c);
  }

  private put(bucket: Bucket, tpl: BufferGeometry, pos: Vector3, rot: Quaternion, scale: Vector3) {
    const geo = tpl.clone();
    geo.applyMatrix4(m.compose(pos, rot, scale));
    (this.parts[bucket] ??= []).push(geo);
  }

  box(bucket: Bucket, px: number, py: number, pz: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) {
    this.put(bucket, boxT, this.w(px, py, pz), q.setFromEuler(e.set(rx, this.a + ry, rz, "YXZ")).clone(), new Vector3(sx, sy, sz));
  }

  cyl(bucket: Bucket, px: number, py: number, pz: number, r: number, h: number, rx = 0, rz = 0, r2 = r) {
    this.put(bucket, cylT, this.w(px, py, pz), q.setFromEuler(e.set(rx, this.a, rz, "YXZ")).clone(), new Vector3(r, h, r2));
  }

  sph(bucket: Bucket, px: number, py: number, pz: number, r: number, sy = 1) {
    this.put(bucket, sphT, this.w(px, py, pz), new Quaternion(), new Vector3(r, r * sy, r));
  }

  /** A rounded limb between two local points. */
  limb(bucket: Bucket, a: [number, number, number], b: [number, number, number], r: number) {
    const p1 = this.w(...a);
    const p2 = this.w(...b);
    const d = p2.clone().sub(p1);
    const len = d.length();
    const rot = new Quaternion().setFromUnitVectors(up, d.normalize());
    this.put(bucket, capT, p1.add(p2).multiplyScalar(0.5), rot, new Vector3(r * 2, Math.max(0.02, len / 2), r * 2));
  }
}

const CLOTH: Bucket[] = ["clothA", "clothB", "clothC", "clothD", "clothA", "clothB"];

export function chair(f: Frame) {
  f.cyl("dark", 0, 0.32, 0, 0.025, 0.4);
  for (let k = 0; k < 5; k += 1) {
    const yaw = (k / 5) * Math.PI * 2;
    f.box("dark", Math.sin(yaw) * 0.14, 0.07, Math.cos(yaw) * 0.14, 0.05, 0.03, 0.3, yaw);
    f.sph("dark", Math.sin(yaw) * 0.28, 0.04, Math.cos(yaw) * 0.28, 0.03);
  }
  f.box("seat", 0, 0.5, 0, 0.5, 0.08, 0.48);
  f.box("seat", 0, 0.82, -0.23, 0.46, 0.5, 0.07, 0, -0.1);
  f.box("dark", -0.27, 0.68, 0.0, 0.035, 0.03, 0.3);
  f.box("dark", 0.27, 0.68, 0.0, 0.035, 0.03, 0.3);
  f.box("dark", -0.27, 0.6, 0.05, 0.03, 0.14, 0.03);
  f.box("dark", 0.27, 0.6, 0.05, 0.03, 0.14, 0.03);
}

function hair(f: Frame, r: Rand, y: number, z = 0) {
  if (r() > 0.25) f.sph("dark", 0, y + 0.03, z - 0.02, 0.112, 0.85);
}

/** Seated at the chair, hands on the desk in front (+z). */
export function sitter(f: Frame, r: Rand, coat = false, tone?: Bucket) {
  const top: Bucket = tone ?? (coat ? "clothD" : CLOTH[Math.floor(r() * CLOTH.length)]);
  const lean = 0.03 + r() * 0.05;
  f.box("clothA", 0, 0.55, -0.02, 0.36, 0.14, 0.26);
  f.limb(top, [0, 0.6, -0.04], [0, 1.03, lean], 0.155);
  f.box(top, 0, 1.05, lean, 0.42, 0.13, 0.2);
  f.cyl("skin", 0, 1.15, lean + 0.02, 0.05, 0.08);
  f.sph("skin", 0, 1.27, lean + 0.05, 0.105, 1.1);
  hair(f, r, 1.27, lean + 0.04);
  for (const s of [-1, 1]) {
    f.limb("clothA", [s * 0.1, 0.56, 0.02], [s * 0.11, 0.53, 0.45], 0.08);
    f.limb("clothA", [s * 0.11, 0.53, 0.45], [s * 0.11, 0.06, 0.5], 0.06);
    f.box("dark", s * 0.11, 0.03, 0.56, 0.1, 0.06, 0.24);
    f.limb(top, [s * 0.21, 1.02, lean], [s * 0.26, 0.82, 0.24], 0.05);
    f.limb(top, [s * 0.26, 0.82, 0.24], [s * 0.15, 0.78, 0.6], 0.042);
    f.sph("skin", s * 0.15, 0.78, 0.62, 0.04);
  }
}

export function stander(f: Frame, r: Rand, pointing = false, coat = false, tone?: Bucket) {
  const top: Bucket = tone ?? (coat ? "clothD" : CLOTH[Math.floor(r() * CLOTH.length)]);
  for (const s of [-1, 1]) {
    f.limb("clothA", [s * 0.09, 0.92, 0], [s * 0.09, 0.06, 0.02], 0.075);
    f.box("dark", s * 0.09, 0.03, 0.07, 0.1, 0.06, 0.26);
  }
  f.box("clothA", 0, 0.95, 0, 0.32, 0.16, 0.22);
  f.limb(top, [0, 0.98, 0], [0, 1.5, 0], 0.16);
  f.box(top, 0, 1.52, 0, 0.44, 0.13, 0.22);
  f.cyl("skin", 0, 1.63, 0, 0.05, 0.08);
  f.sph("skin", 0, 1.75, 0.01, 0.107, 1.1);
  if (tone === "hazard") f.sph("hazard", 0, 1.79, 0, 0.125, 0.7);
  else hair(f, r, 1.75);
  f.limb(top, [-0.22, 1.5, 0], [-0.25, 1.15, 0.05], 0.05);
  f.limb(top, [-0.25, 1.15, 0.05], [-0.2, 0.92, 0.12], 0.042);
  if (pointing) {
    f.limb(top, [0.22, 1.5, 0], [0.32, 1.58, 0.36], 0.05);
    f.limb(top, [0.32, 1.58, 0.36], [0.4, 1.72, 0.66], 0.042);
  } else {
    f.limb(top, [0.22, 1.5, 0], [0.25, 1.15, 0.05], 0.05);
    f.limb(top, [0.25, 1.15, 0.05], [0.2, 0.92, 0.12], 0.042);
  }
}

type Desk = { screens?: number; laptop?: boolean; person?: boolean; wide?: number };

/** One workstation: chair at the origin, the desk in front. */
export function workstation(f: Frame, r: Rand, o: Desk = {}) {
  const w = o.wide ?? 1.6;
  const screens = o.screens ?? (r() > 0.55 ? 2 : 1);
  f.box("top", 0, 0.74, 0.85, w, 0.04, 0.8);
  f.box("frame", -(w / 2 - 0.03), 0.36, 0.85, 0.035, 0.72, 0.7);
  f.box("frame", w / 2 - 0.03, 0.36, 0.85, 0.035, 0.72, 0.7);
  f.box("top", 0, 0.5, 1.2, w - 0.1, 0.42, 0.02);
  for (let k = 0; k < screens; k += 1) {
    const x = screens === 1 ? 0 : (k - (screens - 1) / 2) * 0.54;
    const yaw = screens === 1 ? 0 : (k - (screens - 1) / 2) * -0.34;
    const at = f.at(x, 1.0, yaw);
    at.box("dark", 0, 0.756, 0, 0.22, 0.014, 0.16);
    at.cyl("dark", 0, 0.9, 0.02, 0.018, 0.28);
    at.box("dark", 0, 1.06, 0.03, 0.56, 0.33, 0.028);
    at.box("screen", 0, 1.06, 0.014, 0.52, 0.29, 0.006);
  }
  f.box("dark", 0, 0.765, 0.7, 0.44, 0.016, 0.15);
  f.box("dark", 0.34, 0.765, 0.7, 0.06, 0.02, 0.1);
  if (o.laptop) {
    f.box("frame", -0.5, 0.765, 0.7, 0.34, 0.015, 0.24);
    f.box("dark", -0.5, 0.86, 0.83, 0.34, 0.2, 0.01, 0, -0.25);
  }
  f.cyl("paper", -0.62, 0.8, 1.0, 0.04, 0.09);
  f.box("paper", 0.55, 0.765, 0.95, 0.21, 0.008, 0.3, 0.2);
  f.box("top", -0.55, 0.3, 0.9, 0.4, 0.58, 0.5);
  f.box("dark", -0.55, 0.42, 0.64, 0.34, 0.012, 0.004);
  f.box("dark", -0.55, 0.2, 0.64, 0.34, 0.012, 0.004);
  const jitter = (r() - 0.5) * 0.5;
  const c = f.at(0, 0, jitter);
  chair(c);
  if (o.person ?? r() > 0.18) sitter(c, r);
}

export function plant(f: Frame, r: Rand, tall = false) {
  f.cyl("pot", 0, 0.16, 0, tall ? 0.24 : 0.17, tall ? 0.32 : 0.3, 0, 0, tall ? 0.19 : 0.13);
  const n = tall ? 9 : 5;
  const h = tall ? 1.4 : 0.55;
  f.cyl("dark", 0, 0.3 + h / 2, 0, 0.012, h);
  for (let k = 0; k < n; k += 1) {
    const yy = 0.4 + (k / n) * h;
    const ang = k * 2.4;
    const rad = (tall ? 0.22 : 0.13) * (1 - (k / n) * 0.4);
    f.sph("leaf", Math.cos(ang) * rad, yy, Math.sin(ang) * rad, (tall ? 0.2 : 0.13) * (0.75 + r() * 0.5), 0.75);
  }
}

export function cabinet(f: Frame, w = 0.9) {
  f.box("frame", 0, 0.65, 0, w, 1.3, 0.5);
  for (let k = 0; k < 4; k += 1) {
    f.box("dark", 0, 0.16 + k * 0.32, 0.252, w - 0.06, 0.012, 0.006);
    f.box("dark", 0, 0.28 + k * 0.32, 0.256, 0.2, 0.02, 0.014);
  }
}

function rack(f: Frame, r: Rand) {
  f.box("dark", 0, 1.03, 0, 0.62, 2.06, 1.0);
  f.box("frame", 0, 1.03, 0.51, 0.56, 2.0, 0.02);
  for (let k = 0; k < 11; k += 1) {
    const y = 0.22 + k * 0.17;
    f.box("dark", 0, y, 0.522, 0.5, 0.13, 0.012);
    for (let l = 0; l < 3; l += 1) {
      f.box(r() > 0.35 ? "ledA" : "ledB", -0.16 + l * 0.05, y + 0.02, 0.53, 0.026, 0.02, 0.008);
    }
    f.box("screen", 0.14, y - 0.01, 0.53, 0.16, 0.03, 0.006);
  }
}

export function shelving(f: Frame, r: Rand, w = 1.9) {
  for (const x of [-w / 2, w / 2]) {
    for (const z of [-0.25, 0.25]) f.box("frame", x, 1.05, z, 0.05, 2.1, 0.05);
  }
  for (let k = 0; k < 4; k += 1) {
    const y = 0.15 + k * 0.62;
    f.box("frame", 0, y, 0, w, 0.03, 0.56);
    let x = -w / 2 + 0.2;
    while (x < w / 2 - 0.2) {
      const bw = 0.25 + r() * 0.3;
      const bh = 0.22 + r() * 0.28;
      if (x + bw / 2 > w / 2 - 0.05) break;
      f.box(r() > 0.4 ? "carton" : "paper", x + bw / 2, y + 0.015 + bh / 2, (r() - 0.5) * 0.06, bw, bh, 0.42);
      x += bw + 0.05;
    }
  }
}

export function pallet(f: Frame, r: Rand, stack = 3) {
  for (let k = 0; k < 3; k += 1) {
    f.box("wood", -0.5 + k * 0.5, 0.05, 0, 0.14, 0.09, 0.8);
    f.box("wood", 0, 0.115, -0.3 + k * 0.3, 1.2, 0.03, 0.14);
  }
  for (let level = 0; level < stack; level += 1) {
    for (let cx = 0; cx < 2; cx += 1) {
      for (let cz = 0; cz < 2; cz += 1) {
        if (level === stack - 1 && r() > 0.7) continue;
        f.box("carton", -0.29 + cx * 0.58, 0.32 + level * 0.4, -0.19 + cz * 0.38, 0.55, 0.38, 0.36);
        f.box("paper", -0.29 + cx * 0.58, 0.32 + level * 0.4, -0.01 + cz * 0.38, 0.4, 0.05, 0.005);
      }
    }
  }
}

function palletJack(f: Frame) {
  f.box("dark", -0.15, 0.06, 0.55, 0.14, 0.05, 0.9);
  f.box("dark", 0.15, 0.06, 0.55, 0.14, 0.05, 0.9);
  f.box("warm", 0, 0.2, -0.05, 0.4, 0.3, 0.16);
  f.limb("frame", [0, 0.3, -0.05], [0, 1.0, -0.42], 0.022);
  f.box("dark", 0, 1.02, -0.44, 0.34, 0.03, 0.03);
}

export function round(f: Frame, r: Rand, n: number, people: number, radius = 0.9) {
  f.cyl("top", 0, 0.74, 0, radius, 0.04);
  f.cyl("frame", 0, 0.37, 0, 0.07, 0.72);
  f.cyl("dark", 0, 0.03, 0, 0.32, 0.05);
  f.box("dark", 0.1, 0.77, 0.1, 0.28, 0.014, 0.2, 0.3);
  f.cyl("paper", -0.2, 0.8, -0.2, 0.05, 0.1);
  for (let k = 0; k < n; k += 1) {
    const ang = (k / n) * Math.PI * 2 + 0.4;
    const px = Math.sin(ang) * (radius + 0.5);
    const pz = Math.cos(ang) * (radius + 0.5);
    const yaw = Math.atan2(-px, -pz);
    const c = f.at(px, pz, yaw);
    chair(c);
    if (k < people) sitter(c, r);
  }
}

export function longTable(f: Frame, r: Rand, length: number, width: number, side: number, ends = true) {
  f.box("top", 0, 0.74, 0, length, 0.05, width);
  f.cyl("top", -length / 2, 0.74, 0, width / 2, 0.05);
  f.cyl("top", length / 2, 0.74, 0, width / 2, 0.05);
  for (const x of [-length / 3, length / 3]) f.box("frame", x, 0.37, 0, 0.1, 0.72, width * 0.5);
  for (let k = 0; k < side; k += 1) {
    const x = (k - (side - 1) / 2) * (length / side);
    for (const s of [-1, 1]) {
      const c = f.at(x, s * (width / 2 + 0.5), s > 0 ? Math.PI : 0);
      chair(c);
      if (r() > 0.15) sitter(c, r);
    }
  }
  if (ends) {
    for (const s of [-1, 1]) {
      const c = f.at(s * (length / 2 + width / 2 + 0.3), 0, s > 0 ? -Math.PI / 2 : Math.PI / 2);
      chair(c);
      sitter(c, r);
    }
  }
  for (let k = 0; k < 4; k += 1) f.box("dark", (k - 1.5) * (length / 5), 0.77, (k % 2 ? 1 : -1) * 0.25, 0.3, 0.014, 0.22, 0.2 * k);
  f.cyl("paper", 0, 0.82, 0, 0.06, 0.16);
}

export function wallDisplay(f: Frame, r: Rand, w: number, h: number, y: number) {
  f.box("dark", 0, y, 0, w + 0.1, h + 0.1, 0.07);
  f.box("screen", 0, y, 0.04, w, h, 0.008);
  const bars = 9;
  for (let k = 0; k < bars; k += 1) {
    const bh = (0.15 + r() * 0.55) * h;
    f.box(k % 4 === 0 ? "warm" : "dark", -w / 2 + 0.25 + k * ((w - 0.5) / (bars - 1)), y - h / 2 + 0.1 + bh / 2, 0.05, (w / bars) * 0.5, bh, 0.006);
  }
  f.box("dark", 0, y + h / 2 - 0.12, 0.05, w - 0.4, 0.02, 0.006);
}

export function whiteboard(f: Frame, r: Rand, w: number, h: number, y: number, gantt = false) {
  f.box("dark", 0, y, 0, w + 0.06, h + 0.06, 0.05);
  f.box("paper", 0, y, 0.03, w, h, 0.01);
  f.box("frame", 0, y - h / 2 - 0.03, 0.06, w * 0.9, 0.02, 0.04);
  if (gantt) {
    for (let row = 0; row < 5; row += 1) {
      const start = r() * w * 0.4;
      const len = 0.4 + r() * w * 0.4;
      f.box(row % 2 ? "dark" : "warm", -w / 2 + 0.2 + start + len / 2, y + h / 2 - 0.2 - row * 0.2, 0.04, Math.min(len, w - 0.4 - start), 0.09, 0.008);
    }
  } else {
    for (let k = 0; k < 9; k += 1) {
      f.box(k % 3 === 0 ? "warm" : "carton", -w / 2 + 0.25 + (k % 5) * (w / 5.5), y + h / 2 - 0.25 - Math.floor(k / 5) * 0.32, 0.04, 0.16, 0.16, 0.006, (r() - 0.5) * 0.2);
    }
  }
}

export function sofa(f: Frame, w = 1.9, tone: Bucket = "fabric") {
  f.box(tone, 0, 0.22, 0, w, 0.4, 0.86);
  f.box(tone, 0, 0.62, -0.36, w, 0.55, 0.2);
  for (const s of [-1, 1]) f.box(tone, s * (w / 2 - 0.1), 0.42, 0, 0.2, 0.34, 0.86);
  for (let k = 0; k < 2; k += 1) f.box("dark", -w / 4 + k * (w / 2), 0.48, 0.02, w / 2 - 0.25, 0.1, 0.62);
}

export function coffeeTable(f: Frame, r: Rand) {
  f.box("top", 0, 0.42, 0, 0.9, 0.035, 0.5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) f.box("frame", sx * 0.38, 0.2, sz * 0.2, 0.03, 0.4, 0.03);
  f.cyl("paper", 0.1, 0.48, 0.0, 0.04, 0.09);
  f.box("dark", -0.2, 0.445, 0.05, 0.22, 0.012, 0.3, r() * 0.6);
}

export function pantry(f: Frame, w = 3) {
  f.box("top", 0, 0.45, 0, w, 0.9, 0.6);
  f.box("dark", 0, 0.91, 0, w + 0.04, 0.04, 0.64);
  f.cyl("frame", -w / 4, 0.94, 0.05, 0.16, 0.03);
  f.box("dark", w / 4, 1.06, -0.05, 0.28, 0.26, 0.3);
  f.box("frame", w / 4, 1.2, -0.05, 0.3, 0.02, 0.32);
  for (let k = 0; k < 5; k += 1) f.cyl("paper", -w / 2 + 0.3 + k * 0.16, 0.98, 0.15, 0.033, 0.09);
  for (let k = 0; k < 3; k += 1) {
    const st = f.at(-w / 3 + k * (w / 3), 0.75);
    st.cyl("seat", 0, 0.63, 0, 0.18, 0.06);
    st.cyl("frame", 0, 0.3, 0, 0.02, 0.6);
    st.cyl("dark", 0, 0.02, 0, 0.2, 0.04);
  }
  f.box("top", 0, 1.9, -0.2, w, 0.7, 0.34);
  for (let k = 0; k < 4; k += 1) f.box("dark", -w / 2 + (k + 0.5) * (w / 4), 1.9, -0.02, w / 4 - 0.05, 0.62, 0.006);
}

export function reception(f: Frame, r: Rand) {
  f.box("top", 0, 0.52, 0, 2.6, 1.04, 0.62);
  f.box("dark", 0, 1.06, 0, 2.66, 0.05, 0.68);
  f.box("dark", 0, 1.22, -0.1, 0.5, 0.3, 0.03);
  f.box("screen", 0, 1.22, -0.084, 0.46, 0.26, 0.006);
  f.cyl("pot", 0.9, 1.12, 0.08, 0.06, 0.12);
  const c = f.at(0, -0.9, Math.PI);
  chair(c);
  sitter(c, r);
}

function column(f: Frame) {
  f.box("top", 0, 1.3, 0, 0.42, 2.6, 0.42);
  f.box("frame", 0, 0.05, 0, 0.5, 0.1, 0.5);
}

export function extinguisher(f: Frame) {
  f.cyl("warm", 0, 0.3, 0, 0.07, 0.42);
  f.cyl("dark", 0, 0.55, 0, 0.03, 0.06);
  f.box("dark", 0, 0.9, 0, 0.02, 0.5, 0.02);
}

/** A glass-walled room with a door gap on the +z side. */
export function glassRoom(f: Frame, x0: number, x1: number, z0: number, z1: number, door: number) {
  const h = 2.4;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  f.box("glass", cx, h / 2, z0, x1 - x0, h, 0.03);
  f.box("glass", x0, h / 2, cz, 0.03, h, z1 - z0);
  f.box("glass", x1, h / 2, cz, 0.03, h, z1 - z0);
  const gapL = cx + door - 0.5;
  const gapR = cx + door + 0.5;
  f.box("glass", (x0 + gapL) / 2, h / 2, z1, gapL - x0, h, 0.03);
  f.box("glass", (gapR + x1) / 2, h / 2, z1, x1 - gapR, h, 0.03);
  for (const x of [x0, x1, gapL, gapR]) f.box("dark", x, h / 2, z1, 0.05, h, 0.05);
  for (const x of [x0, x1]) f.box("dark", x, h / 2, z0, 0.05, h, 0.05);
  f.box("dark", cx, h, z0, x1 - x0, 0.05, 0.05);
  f.box("dark", x0, h, cz, 0.05, 0.05, z1 - z0);
  f.box("dark", x1, h, cz, 0.05, 0.05, z1 - z0);
  f.box("dark", (x0 + gapL) / 2, h, z1, gapL - x0, 0.05, 0.05);
  f.box("dark", (gapR + x1) / 2, h, z1, x1 - gapR, 0.05, 0.05);
  f.box("dark", cx + door, h - 0.05, z1, 1.0, 0.06, 0.05);
}

export function row(f: Frame, r: Rand, x0: number, z: number, n: number, a: number, o: Desk = {}) {
  for (let k = 0; k < n; k += 1) workstation(new Frame(f.parts, x0 + k * 1.75, z, a), r, o);
  const mid = new Frame(f.parts, x0 + ((n - 1) * 1.75) / 2, z, a);
  const back = mid.w(0, 0, 1.28);
  new Frame(f.parts, back.x, back.z, a).box("fabric", 0, 1.0, 0, n * 1.75 - 0.05, 0.4, 0.04);
}

export function carpet(f: Frame, x0: number, x1: number, z0: number, z1: number) {
  f.box("carpet", (x0 + x1) / 2, 0.006, (z0 + z1) / 2, x1 - x0, 0.012, z1 - z0);
}

/** Shared shell: curtain-wall mullions, rails, columns and the floor's lobby ring around the data core. */
function shell(f: Frame) {
  for (let x = -9; x <= 9.01; x += 1.5) {
    f.box("frame", x, 1.3, -6, 0.05, 2.6, 0.05);
    if (Math.round(x / 1.5) % 2 === 0) f.box("frame", x, 1.3, 6, 0.05, 2.6, 0.05);
  }
  for (let z = -6; z <= 6.01; z += 3) {
    f.box("frame", -9, 1.3, z, 0.05, 2.6, 0.05);
    f.box("frame", 9, 1.3, z, 0.05, 2.6, 0.05);
  }
  for (const y of [1.2, 2.6]) {
    f.box("frame", 0, y, -6, 18, 0.05, 0.05);
    f.box("frame", 0, y, 6, 18, 0.05, 0.05);
    f.box("frame", -9, y, 0, 0.05, 0.05, 12);
    f.box("frame", 9, y, 0, 0.05, 0.05, 12);
  }
  f.box("frame", 0, 0.06, -6, 18, 0.12, 0.08);
  f.box("frame", 0, 0.06, 6, 18, 0.12, 0.08);
  f.box("frame", -9, 0.06, 0, 0.08, 0.12, 12);
  f.box("frame", 9, 0.06, 0, 0.08, 0.12, 12);
  for (const x of [-6, 6]) for (const z of [-3.6, 3.6]) column(f.at(x, z));
  f.cyl("frame", 0, 0.03, 0, 2.15, 0.06);
  f.cyl("carpet", 0, 0.07, 0, 2.0, 0.02);
  f.cyl("dark", 0, 0.045, 0, 1.25, 0.03);
}

function compliance(f: Frame, r: Rand) {
  carpet(f, -8.6, -1.9, -1.6, 5.6);
  row(f, r, -7.4, 4.3, 3, Math.PI, { laptop: true });
  row(f, r, -7.4, 1.6, 3, Math.PI);
  for (let k = 0; k < 7; k += 1) cabinet(f.at(-7.8 + k * 0.96, -5.55));
  whiteboard(f.at(5.6, -5.92), r, 3.2, 1.3, 1.5);
  glassRoom(f, 2.6, 8.4, -5.5, -1.0, 0);
  const tbl = f.at(5.5, -3.3);
  tbl.box("top", 0, 0.74, 0, 2.8, 0.05, 1.1);
  tbl.box("frame", 0, 0.37, 0, 2.4, 0.72, 0.1);
  for (let k = 0; k < 3; k += 1) for (const s of [-1, 1]) {
    const c = tbl.at((k - 1) * 0.9, s * 0.85, s > 0 ? Math.PI : 0);
    chair(c);
    if (r() > 0.2) sitter(c, r);
  }
  row(f, r, 3.4, 4.3, 3, Math.PI);
  row(f, r, 3.4, 1.6, 3, Math.PI, { laptop: true });
  extinguisher(f.at(-8.55, -5.5));
  stander(f.at(-1.6, 2.4, Math.PI * 0.75), r);
  plant(f.at(-8.3, 5.3), r, true);
  plant(f.at(8.3, 5.3), r, true);
  plant(f.at(-2.2, -5.4), r);
}

function itFloor(f: Frame, r: Rand) {
  carpet(f, -8.6, -1.9, -0.6, 5.6);
  for (let k = 0; k < 8; k += 1) {
    rack(f.at(2.7 + k * 0.7, -4.9), r);
    rack(f.at(2.7 + k * 0.7, -2.6, Math.PI), r);
  }
  f.box("frame", 5.3, 2.3, -3.75, 6.2, 0.08, 0.5);
  f.box("dark", 5.3, 2.4, -3.75, 6.0, 0.08, 0.3);
  const ac = f.at(8.5, -3.6);
  ac.box("top", 0, 1.0, 0, 0.9, 2.0, 1.0);
  for (let v = 0; v < 6; v += 1) ac.box("dark", -0.3 + v * 0.12, 1.4, 0.505, 0.04, 0.8, 0.006);
  glassRoom(f, 1.9, 8.7, -5.6, -1.5, -1.8);
  wallDisplay(f.at(-5.2, -5.92), r, 5.4, 1.9, 1.7);
  stander(f.at(-5.0, -4.3, Math.PI), r, true);
  stander(f.at(-3.6, -4.1, Math.PI * 0.9), r);
  row(f, r, -7.4, 3.6, 3, Math.PI, { screens: 3, laptop: true });
  row(f, r, -7.4, 0.9, 3, Math.PI, { screens: 3 });
  row(f, r, 3.2, 3.6, 3, Math.PI, { screens: 2 });
  pantry(f.at(6.0, 0.6, Math.PI), 2.6);
  plant(f.at(-8.3, 5.3), r, true);
  plant(f.at(8.3, 5.3), r, true);
}

function planning(f: Frame, r: Rand) {
  carpet(f, -8.6, -0.8, -5.6, 1.8);
  longTable(f.at(-4.8, -1.8), r, 5.4, 1.5, 4, false);
  whiteboard(f.at(-7.4, -5.92), r, 3.0, 1.4, 1.5, true);
  whiteboard(f.at(-3.2, -5.92), r, 3.0, 1.4, 1.5, true);
  wallDisplay(f.at(-8.94, -0.5, Math.PI / 2), r, 3.6, 1.5, 1.6);
  stander(f.at(-5.6, -4.7, Math.PI), r, true);
  row(f, r, 3.2, 4.2, 3, Math.PI, { screens: 2 });
  row(f, r, 3.2, 1.6, 3, Math.PI, { laptop: true });
  row(f, r, 3.2, -1.0, 3, Math.PI);
  sofa(f.at(-6.6, 4.9, Math.PI), 1.9);
  coffeeTable(f.at(-6.6, 3.7), r);
  stander(f.at(-4.4, 4.2, Math.PI * 1.2), r);
  stander(f.at(-4.0, 4.6, Math.PI * 0.8), r);
  plant(f.at(-8.3, 5.3), r, true);
  plant(f.at(8.3, -5.3), r, true);
  plant(f.at(8.3, 5.3), r);
}

function procurement(f: Frame, r: Rand) {
  carpet(f, -8.6, -1.9, 0.2, 5.6);
  for (let k = 0; k < 4; k += 1) shelving(f.at(-7.6 + k * 2.05, -5.45), r);
  for (let k = 0; k < 3; k += 1) shelving(f.at(2.8 + k * 2.05, -5.45), r);
  pallet(f.at(3.6, -2.2, 0.15), r, 3);
  pallet(f.at(5.6, -2.3, -0.1), r, 2);
  pallet(f.at(7.5, -2.0), r, 3);
  palletJack(f.at(-2.6, -3.3, 0.6));
  stander(f.at(6.6, -0.6, Math.PI * 0.85), r);
  row(f, r, -7.4, 4.0, 3, Math.PI, { laptop: true });
  row(f, r, -7.4, 1.4, 3, Math.PI, { screens: 2 });
  round(f.at(5.4, 3.4), r, 5, 4);
  whiteboard(f.at(-1.2, -5.92), r, 1.4, 1.1, 1.5);
  plant(f.at(-8.3, 5.3), r, true);
  plant(f.at(8.3, 5.3), r, true);
}

function people(f: Frame, r: Rand) {
  carpet(f, -8.6, 8.6, -5.6, 5.6);
  round(f.at(-5.6, 2.4), r, 6, 5);
  round(f.at(-5.6, -2.4), r, 6, 4);
  round(f.at(-1.0, -3.6), r, 5, 3, 0.8);
  wallDisplay(f.at(5.6, -5.92), r, 4.6, 1.9, 1.7);
  for (let k = 0; k < 3; k += 1) {
    for (let l = 0; l < 5; l += 1) {
      const c = f.at(3.0 + l * 1.05, -2.6 + k * 1.05, Math.PI);
      chair(c);
      if (r() > 0.25) sitter(c, r);
    }
  }
  stander(f.at(5.6, -4.8, 0), r, true);
  reception(f.at(6.2, 4.6, Math.PI), r);
  sofa(f.at(-1.0, 4.8, Math.PI), 2.2);
  coffeeTable(f.at(-1.0, 3.5), r);
  sofa(f.at(2.8, 3.9, Math.PI * 1.5), 1.6);
  pantry(f.at(-8.3, 0, Math.PI / 2), 3.4);
  plant(f.at(-8.3, 5.3), r, true);
  plant(f.at(8.3, 5.3), r, true);
  plant(f.at(1.8, -5.3), r, true);
}

function finance(f: Frame, r: Rand) {
  carpet(f, -8.6, -1.9, -2.2, 5.6);
  carpet(f, 1.9, 8.6, 0.2, 5.6);
  row(f, r, -7.4, 4.6, 4, Math.PI, { laptop: true });
  row(f, r, -7.4, 2.2, 4, Math.PI, { screens: 2 });
  row(f, r, -7.4, -0.2, 4, Math.PI, { screens: 2 });
  row(f, r, 3.2, 4.6, 3, Math.PI, { screens: 2 });
  row(f, r, 3.2, 2.2, 3, Math.PI);
  for (let k = 0; k < 4; k += 1) cabinet(f.at(-7.8 + k * 0.96, -5.55));
  whiteboard(f.at(-2.6, -5.92), r, 2.6, 1.3, 1.5);
  glassRoom(f, 2.6, 8.4, -5.5, -1.4, 0);
  const desk = f.at(5.5, -3.9, Math.PI);
  workstation(desk, r, { screens: 2, wide: 2.0, person: true });
  for (const s of [-1, 1]) {
    const c = f.at(5.5 + s * 0.8, -1.9, 0);
    chair(c);
    if (s > 0) sitter(c, r);
  }
  cabinet(f.at(7.9, -5.3, 0), 0.9);
  sofa(f.at(3.5, -1.9, Math.PI), 1.2);
  plant(f.at(8.3, -1.9), r);
  plant(f.at(-8.3, 5.3), r, true);
  plant(f.at(8.3, 5.3), r, true);
}

function executive(f: Frame, r: Rand) {
  carpet(f, -8.6, 8.6, -5.6, 5.6);
  longTable(f.at(-4.9, -0.9), r, 5.4, 1.7, 5, false);
  wallDisplay(f.at(-4.9, -5.92), r, 5.0, 2.0, 1.7);
  f.box("top", -4.9, 0.4, -5.55, 6.0, 0.8, 0.5);
  f.box("dark", -4.9, 0.82, -5.55, 6.06, 0.04, 0.54);
  glassRoom(f, 2.6, 8.4, -5.5, 0.4, 0);
  const desk = f.at(5.5, -3.6, Math.PI);
  workstation(desk, r, { screens: 2, wide: 2.2, person: true });
  for (const s of [-1, 1]) {
    const c = f.at(5.5 + s * 0.8, -1.4, 0);
    chair(c);
    if (s < 0) sitter(c, r);
  }
  sofa(f.at(7.5, -3.0, -Math.PI / 2), 1.9);
  plant(f.at(8.1, -5.1), r, true);
  sofa(f.at(-6.0, 4.6, Math.PI), 2.3);
  coffeeTable(f.at(-6.0, 3.3), r);
  sofa(f.at(-2.6, 3.4, Math.PI * 1.5), 1.6);
  stander(f.at(0.4, 3.2, Math.PI * 0.8), r);
  stander(f.at(1.2, 3.8, Math.PI * 1.2), r);
  plant(f.at(-8.3, 5.3), r, true);
  plant(f.at(8.3, 5.3), r, true);
  plant(f.at(-8.3, -5.3), r, true);
}

const LAYOUTS = [compliance, itFloor, planning, procurement, people, finance, executive];

export function finish(parts: Parts): FloorGeo {
  const out: FloorGeo = {};
  for (const key of Object.keys(parts) as Bucket[]) {
    const list = parts[key];
    if (!list?.length) continue;
    out[key] = mergeGeometries(list, false);
    list.forEach((geo) => geo.dispose());
  }
  return out;
}

/** Builds one floor's fused geometry, one mesh per surface material. */
export function buildFloor(index: number): FloorGeo {
  const parts: Parts = {};
  const root = new Frame(parts, 0, 0, 0);
  const r = seeded(index + 11);
  shell(root);
  LAYOUTS[index](root, r);
  return finish(parts);
}
