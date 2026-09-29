import {
  Frame,
  finish,
  glassRoom,
  plant,
  seeded,
  sitter,
  stander,
  wallDisplay,
  workstation,
  extinguisher,
  type Bucket,
  type FloorGeo,
  type Parts,
  type Rand,
} from "./office";

/**
 * The warehouse, authored at real scale like the office and lab floors (metres, floor top at
 * y = 0): x ±14, z ±9. Racking runs along x so the camera, looking from +z, reads each row.
 * Raw materials are on the left, finished product on the right, dock doors on both end walls.
 */
export const WH_W = 14;
export const WH_D = 9;
export const WH_H = 7.4;

function pallet(f: Frame, d = 0.8) {
  for (let k = 0; k < 3; k += 1) f.box("wood", -0.5 + k * 0.5, 0.05, 0, 0.14, 0.09, d);
  for (let k = 0; k < 5; k += 1) f.box("wood", 0, 0.115, -d / 2 + 0.06 + (k * (d - 0.12)) / 4, 1.2, 0.03, 0.13);
}

function drum(f: Frame, x: number, y: number, z: number, tone: Bucket) {
  f.cyl(tone, x, y + 0.44, z, 0.29, 0.88);
  f.cyl("steel", x, y + 0.45, z, 0.298, 0.03);
  f.cyl("steel", x, y + 0.89, z, 0.27, 0.025);
  f.box("paper", x, y + 0.5, z + 0.29, 0.2, 0.15, 0.006);
}

function drums(f: Frame, r: Rand, tone: Bucket, tiers = 1) {
  pallet(f, 1.2);
  for (let t = 0; t < tiers; t += 1) {
    for (const x of [-0.3, 0.3]) for (const z of [-0.3, 0.3]) drum(f, x, 0.14 + t * 0.9, z, r() > 0.85 ? "drumGrey" : tone);
  }
}

function bags(f: Frame, r: Rand, layers = 5) {
  pallet(f, 1.0);
  for (let l = 0; l < layers; l += 1) {
    const flip = l % 2 === 0;
    for (let a = 0; a < 2; a += 1) {
      for (let b = 0; b < 2; b += 1) {
        const x = flip ? -0.3 + a * 0.6 : -0.3 + a * 0.6;
        const z = flip ? -0.24 + b * 0.48 : -0.24 + b * 0.48;
        f.box(r() > 0.5 ? "paper" : "carton", x, 0.14 + 0.07 + l * 0.15, z, flip ? 0.58 : 0.5, 0.15, flip ? 0.46 : 0.52, (r() - 0.5) * 0.08);
      }
    }
    f.box("warm", 0, 0.14 + 0.07 + l * 0.15, 0.5, 0.3, 0.05, 0.004);
  }
  f.box("clear", 0, 0.14 + (layers * 0.15) / 2, 0, 1.24, layers * 0.15 + 0.03, 1.04);
}

function ibc(f: Frame) {
  pallet(f, 1.2);
  f.box("amber", 0, 0.14 + 0.32, 0, 0.94, 0.5, 0.94);
  f.box("clear", 0, 0.14 + 0.55, 0, 1.0, 1.05, 1.0);
  for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) f.box("steel", x, 0.14 + 0.55, z, 0.03, 1.1, 0.03);
  for (const y of [0.3, 0.7, 1.1]) {
    f.box("steel", 0, 0.14 + y, 0.5, 1.02, 0.02, 0.02);
    f.box("steel", 0, 0.14 + y, -0.5, 1.02, 0.02, 0.02);
    f.box("steel", 0.5, 0.14 + y, 0, 0.02, 0.02, 1.02);
    f.box("steel", -0.5, 0.14 + y, 0, 0.02, 0.02, 1.02);
  }
  f.cyl("steel", 0.25, 0.14 + 1.12, 0.25, 0.12, 0.05);
  f.cyl("dark", 0, 0.14 + 0.16, 0.56, 0.05, 0.12, Math.PI / 2);
  f.box("paper", 0, 0.14 + 0.7, 0.505, 0.4, 0.28, 0.006);
}

function cartons(f: Frame, r: Rand, layers = 3) {
  pallet(f, 1.0);
  for (let l = 0; l < layers; l += 1) {
    for (const x of [-0.29, 0.29]) {
      for (const z of [-0.2, 0.2]) {
        f.box("carton", x, 0.14 + 0.2 + l * 0.4, z, 0.55, 0.38, 0.38, (r() - 0.5) * 0.05);
        f.box("paper", x, 0.14 + 0.2 + l * 0.4, z + 0.192, 0.34, 0.06, 0.004);
      }
    }
  }
}

type Kind = "bags" | "ibc" | "drums" | "cartons" | "warm" | "empty";

function load(f: Frame, r: Rand, kind: Kind, tiers = 1) {
  if (kind === "bags") bags(f, r, 4 + Math.floor(r() * 2));
  else if (kind === "ibc") ibc(f);
  else if (kind === "drums") drums(f, r, "drum", tiers);
  else if (kind === "warm") drums(f, r, "warm", tiers);
  else if (kind === "cartons") cartons(f, r, 2 + Math.floor(r() * 2));
  else pallet(f, 1.0);
}

const LEVELS = [0.32, 1.98, 3.64, 5.3];

/** Selective pallet racking: frames, bracing, beams and two pallet positions per bay per level. */
function rack(f: Frame, r: Rand, bays: number, levels: number, mix: Kind[]) {
  const len = bays * 2.7;
  const top = LEVELS[levels - 1] + 1.55;
  for (let b = 0; b <= bays; b += 1) {
    const x = -len / 2 + b * 2.7;
    for (const z of [-0.5, 0.5]) f.box("drumGrey", x, top / 2, z, 0.09, top, 0.07);
    f.box("drumGrey", x, 0.05, 0, 0.11, 0.1, 1.1);
    for (let k = 0; k < Math.floor(top / 1.5); k += 1) {
      const y0 = 0.3 + k * 1.5;
      f.limb("drumGrey", [x, y0, k % 2 ? 0.5 : -0.5], [x, y0 + 1.5, k % 2 ? -0.5 : 0.5], 0.014);
    }
  }
  for (let l = 0; l < levels; l += 1) {
    const y = LEVELS[l];
    for (const z of [-0.5, 0.5]) f.box("warm", 0, y, z, len, 0.13, 0.06);
    for (let b = 0; b < bays; b += 1) {
      const bx = -len / 2 + b * 2.7 + 1.35;
      f.box("wood", bx, y + 0.075, 0, 2.5, 0.02, 0.9);
      for (const px of [-0.66, 0.66]) {
        const kind = mix[Math.floor(r() * mix.length)];
        if (l === levels - 1 && r() > 0.7) continue;
        if (r() > 0.93) continue;
        load(f.at(bx + px, 0).up(y + 0.085), r, kind);
      }
    }
  }
}

function forkliftParts(f: Frame, r: Rand, carrying: boolean) {
  f.cyl("dark", -0.5, 0.3, 0.55, 0.3, 0.2, 0, Math.PI / 2);
  f.cyl("dark", 0.5, 0.3, 0.55, 0.3, 0.2, 0, Math.PI / 2);
  f.cyl("dark", -0.48, 0.25, -0.6, 0.25, 0.18, 0, Math.PI / 2);
  f.cyl("dark", 0.48, 0.25, -0.6, 0.25, 0.18, 0, Math.PI / 2);
  f.box("hazard", 0, 0.58, 0.05, 1.05, 0.5, 1.5);
  f.box("hazard", 0, 0.68, -0.85, 1.1, 0.72, 0.55);
  f.box("dark", 0, 0.42, -0.1, 1.08, 0.12, 1.9);
  f.box("seat", 0, 0.92, -0.2, 0.5, 0.1, 0.5);
  f.box("seat", 0, 1.2, -0.45, 0.5, 0.5, 0.08, 0, -0.1);
  f.cyl("dark", 0, 1.2, 0.35, 0.17, 0.03, -0.9);
  f.limb("dark", [0, 0.9, 0.5], [0, 1.15, 0.36], 0.025);
  for (const x of [-0.5, 0.5]) {
    f.box("dark", x, 1.5, 0.45, 0.05, 1.9, 0.05);
    f.box("dark", x, 1.5, -0.6, 0.05, 1.9, 0.05);
  }
  f.box("dark", 0, 2.45, -0.08, 1.1, 0.05, 1.15);
  f.sph("hazard", 0, 2.55, -0.6, 0.06);
  for (const x of [-0.3, 0.3]) f.box("dark", x, 1.2, 0.95, 0.09, 2.4, 0.09);
  f.box("dark", 0, 0.5, 0.98, 0.8, 0.5, 0.05);
  f.box("steel", 0, 0.32, 1.05, 0.9, 0.05, 0.05);
  for (const x of [-0.3, 0.3]) f.box("steel", x, 0.13, 1.6, 0.11, 0.05, 1.15);
  const seat = new Frame(f.parts, f.x, f.z, f.a);
  const driver = seat.at(0, -0.15).up(0.45);
  sitter(driver, r, false, "hazard");
  if (carrying) {
    const pal = f.at(0, 1.65).up(0.16);
    drums(pal, r, "drum", 1);
  }
}

/** One forklift, facing +z, for an animated group. */
export function buildForklift(carrying: boolean, seed: number): FloorGeo {
  const parts: Parts = {};
  forkliftParts(new Frame(parts, 0, 0, 0), seeded(seed), carrying);
  return finish(parts);
}

/** A dock door on an end wall with its bumpers and leveller. */
function dock(f: Frame) {
  f.box("frame", 0, 2.1, 0.02, 3.0, 0.16, 0.16);
  for (const s of [-1, 1]) f.box("frame", s * 1.5, 1.4, 0.02, 0.16, 2.8, 0.16);
  f.box("drumGrey", 0, 1.35, 0.06, 2.8, 2.5, 0.05);
  for (let k = 0; k < 9; k += 1) f.box("frame", 0, 0.4 + k * 0.27, 0.09, 2.8, 0.02, 0.02);
  for (const s of [-1, 1]) f.box("dark", s * 1.3, 1.1, 0.12, 0.28, 0.5, 0.16);
  f.box("hazard", 0, 0.05, 0.9, 3.2, 0.03, 0.9);
  f.box("dark", 0, 0.04, 0.9, 3.0, 0.02, 0.5);
}

function shell(f: Frame) {
  const colsX = [-14, -9.33, -4.67, 0, 4.67, 9.33, 14];
  for (const x of colsX) {
    for (const z of [-WH_D, WH_D]) f.box("frame", x, WH_H / 2, z, 0.3, WH_H, 0.3);
    f.box("frame", x, WH_H, 0, 0.22, 0.34, WH_D * 2);
    f.limb("frame", [x, WH_H - 1.4, -WH_D], [x, WH_H, -WH_D + 1.4], 0.06);
    f.limb("frame", [x, WH_H - 1.4, WH_D], [x, WH_H, WH_D - 1.4], 0.06);
  }
  f.box("frame", 0, WH_H, -WH_D, WH_W * 2, 0.3, 0.2);
  f.box("frame", 0, WH_H, WH_D, WH_W * 2, 0.3, 0.2);
  f.box("frame", -WH_W, 3.6, 0, 0.12, 0.14, WH_D * 2);
  f.box("frame", WH_W, 3.6, 0, 0.12, 0.14, WH_D * 2);
  f.box("frame", 0, 3.6, -WH_D, WH_W * 2, 0.14, 0.12);
  f.box("frame", 0, 3.6, WH_D, WH_W * 2, 0.14, 0.12);
  f.box("frame", 0, 0.1, WH_D, WH_W * 2, 0.2, 0.1);
  f.box("frame", 0, 0.1, -WH_D, WH_W * 2, 0.2, 0.1);
  f.box("frame", -WH_W, 0.1, 0, 0.1, 0.2, WH_D * 2);
  f.box("frame", WH_W, 0.1, 0, 0.1, 0.2, WH_D * 2);
  for (const x of [-9, -3, 3, 9]) {
    for (const z of [-6.4, -1.6, 4.6]) {
      f.cyl("frame", x, WH_H - 0.6, z, 0.012, 1.2);
      f.cyl("steel", x, WH_H - 1.3, z, 0.42, 0.28, 0, 0, 0.16);
      f.cyl("paper", x, WH_H - 1.46, z, 0.34, 0.03);
    }
  }
}

function lines(f: Frame) {
  for (const z of [-7.3, -5.4, -2.6, -0.6]) f.box("hazard", 0, 0.008, z, WH_W * 1.9, 0.008, 0.09);
  for (const x of [-1.0, 1.0]) f.box("hazard", x, 0.008, 4, 0.09, 0.008, 9);
  for (let lane = 0; lane < 4; lane += 1) {
    const x = 1.9 + lane * 1.9;
    for (const dx of [-0.85, 0.85]) f.box("hazard", x + dx, 0.008, 4.6, 0.05, 0.008, 7);
  }
}

function hazmat(f: Frame) {
  f.box("hazard", 0, 0.95, 0, 1.1, 1.9, 0.6);
  f.box("dark", -0.27, 0.95, 0.305, 0.5, 1.75, 0.008);
  f.box("dark", 0.27, 0.95, 0.305, 0.5, 1.75, 0.008);
  f.box("paper", 0, 1.55, 0.31, 0.42, 0.26, 0.006);
  f.box("dark", 0, 1.55, 0.315, 0.2, 0.06, 0.004);
  f.box("dark", 0, 0.05, 0, 1.15, 0.1, 0.65);
}

function cage(f: Frame, r: Rand) {
  const w = 5.0;
  const d = 3.8;
  for (let k = 0; k <= 4; k += 1) {
    f.box("frame", -w / 2 + k * (w / 4), 1.2, -d / 2, 0.06, 2.4, 0.06);
    f.box("frame", -w / 2 + k * (w / 4), 1.2, d / 2, 0.06, 2.4, 0.06);
  }
  for (let k = 0; k <= 3; k += 1) {
    f.box("frame", -w / 2, 1.2, -d / 2 + k * (d / 3), 0.06, 2.4, 0.06);
    f.box("frame", w / 2, 1.2, -d / 2 + k * (d / 3), 0.06, 2.4, 0.06);
  }
  for (const y of [0.4, 1.0, 1.6, 2.2]) {
    f.box("frame", 0, y, -d / 2, w, 0.025, 0.025);
    f.box("frame", 0, y, d / 2, w, 0.025, 0.025);
    f.box("frame", -w / 2, y, 0, 0.025, 0.025, d);
    f.box("frame", w / 2, y, 0, 0.025, 0.025, d);
  }
  f.box("hazard", 0, 2.0, d / 2 + 0.05, 1.3, 0.55, 0.03);
  f.box("dark", 0, 2.0, d / 2 + 0.07, 1.0, 0.1, 0.01);
  for (let a = 0; a < 3; a += 1) {
    for (let b = 0; b < 2; b += 1) {
      const p = f.at(-1.5 + a * 1.5, -0.8 + b * 1.5);
      drums(p, r, "warm", 2);
    }
  }
}

function mezzanine(f: Frame, r: Rand) {
  const x0 = -3.5;
  const x1 = 3.5;
  const z0 = 2.6;
  const z1 = 8.4;
  const y = 3.1;
  f.box("top", (x0 + x1) / 2, y, (z0 + z1) / 2, x1 - x0, 0.16, z1 - z0);
  for (const x of [x0 + 0.2, 0, x1 - 0.2]) for (const z of [z0 + 0.2, z1 - 0.2]) f.box("frame", x, y / 2, z, 0.2, y, 0.2);
  f.box("frame", (x0 + x1) / 2, y - 0.2, z1 - 0.2, x1 - x0, 0.22, 0.14);
  for (let k = 0; k <= 6; k += 1) f.box("frame", x0 + k * ((x1 - x0) / 6), y + 0.55, z1, 0.04, 1.1, 0.04);
  f.box("frame", (x0 + x1) / 2, y + 1.1, z1, x1 - x0, 0.04, 0.04);
  f.box("frame", (x0 + x1) / 2, y + 0.55, z1, x1 - x0, 0.03, 0.03);
  const steps = 14;
  for (let k = 0; k < steps; k += 1) {
    f.box("frame", x0 - 0.3 - (steps - 1 - k) * 0.28, (y / steps) * (k + 0.5), 5.5, 0.28, 0.06, 1.1);
  }
  for (const z of [4.95, 6.05]) f.limb("frame", [x0 - 0.3 - (steps - 1) * 0.28, 0.1, z], [x0 - 0.05, y + 1.0, z], 0.02);
  glassRoom(f.up(y + 0.08), x0 + 0.5, x1 - 0.5, z0 + 0.4, z1 - 1.1, 0.6);
  const desk = f.at(-1.4, 5.7, Math.PI).up(y + 0.08);
  workstation(desk, r, { screens: 2, wide: 1.8 });
  const desk2 = f.at(1.4, 5.7, Math.PI).up(y + 0.08);
  workstation(desk2, r, { screens: 2, wide: 1.8 });
  wallDisplay(f.at(0, 3.0).up(y + 0.08), r, 2.6, 1.0, 1.4);
  stander(f.at(2.4, 4.3, Math.PI * 1.1).up(y + 0.08), r, false, false, "hazard");
}

function pickers(f: Frame, r: Rand) {
  stander(f.at(-4.6, -6.3, Math.PI * 0.5), r, true, false, "hazard");
  stander(f.at(3.5, -6.1, Math.PI * 1.5), r, false, false, "hazard");
  stander(f.at(-6.8, -1.6, Math.PI * 0.4), r, false, false, "hazard");
  stander(f.at(8.6, -1.4, Math.PI * 1.4), r, true, false, "hazard");
}

/** Raw materials (left), finished goods (right), docks, quarantine and the WMS mezzanine. */
function warehouse(f: Frame, r: Rand) {
  shell(f);
  lines(f);
  const rawMix: Kind[] = ["bags", "bags", "ibc", "drums", "cartons"];
  const fgMix: Kind[] = ["drums", "drums", "drums", "cartons"];
  // racking: back wall row, then a back-to-back double row
  rack(f.at(-7.0, -8.1), r, 4, 4, rawMix);
  rack(f.at(7.0, -8.1), r, 4, 4, fgMix);
  rack(f.at(-7.0, -4.7, Math.PI), r, 4, 4, rawMix);
  rack(f.at(7.0, -4.7, Math.PI), r, 4, 4, fgMix);
  rack(f.at(-7.0, -3.5), r, 4, 3, ["bags", "ibc", "drums", "bags"]);
  rack(f.at(7.0, -3.5), r, 4, 3, fgMix);
  // goods in (left): staged floor loads in marked lanes
  const rawFloor: Kind[][] = [
    ["bags", "bags", "ibc"],
    ["ibc", "drums", "cartons"],
    ["bags", "cartons", "drums"],
  ];
  rawFloor.forEach((rowKinds, i) => {
    rowKinds.forEach((kind, j) => load(f.at(-12.0 + j * 2.0, 1.2 + i * 1.9, i % 2 ? 0.08 : -0.05), r, kind, kind === "drums" ? 2 : 1));
  });
  for (let k = 0; k < 3; k += 1) load(f.at(-7.0 + k * 1.6, 3.0), r, k === 1 ? "ibc" : "bags");
  const bench = f.at(-6.2, 6.6);
  bench.box("top", 0, 0.42, 0, 2.4, 0.84, 0.7);
  bench.box("dark", 0, 0.86, 0, 2.44, 0.04, 0.74);
  bench.box("dark", -0.5, 1.05, -0.1, 0.5, 0.3, 0.03);
  bench.box("screen", -0.5, 1.05, -0.083, 0.46, 0.26, 0.006);
  bench.box("dark", 0.4, 0.89, 0.05, 0.16, 0.06, 0.1);
  stander(f.at(-6.2, 5.6, Math.PI * 0.05), r, false, false, "hazard");
  for (let k = 0; k < 2; k += 1) hazmat(f.at(-13.35, -0.2 + k * 1.2, Math.PI / 2));
  // finished goods (right): drums block-stacked three high in lanes
  for (let lane = 0; lane < 4; lane += 1) {
    for (let d = 0; d < 4; d += 1) {
      const p = f.at(1.9 + lane * 1.9, 1.2 + d * 1.6);
      drums(p, r, "drum", 3);
    }
  }
  cage(f.at(10.2, 2.4), r);
  // dispatch wrapper
  const wrap = f.at(9.5, 6.4);
  wrap.cyl("top", 0, 0.08, 0, 1.1, 0.14);
  wrap.box("dark", -1.4, 1.2, 0, 0.16, 2.4, 0.16);
  wrap.cyl("clear", -1.28, 1.2, 0, 0.14, 0.7);
  drums(wrap.at(0, 0).up(0.14), r, "drum", 2);
  stander(f.at(11.3, 7.3, Math.PI * 1.2), r, false, false, "hazard");
  // dock doors on the end walls
  dock(new Frame(f.parts, -WH_W, 5.2, Math.PI / 2));
  dock(new Frame(f.parts, WH_W, 6.3, -Math.PI / 2));
  mezzanine(f, r);
  pickers(f, r);
  extinguisher(f.at(-13.5, 8.4));
  extinguisher(f.at(0.4, -8.6));
  plant(f.at(-13.2, 8.2), r, true);
}

export function buildWarehouse(): FloorGeo {
  const parts: Parts = {};
  warehouse(new Frame(parts, 0, 0, 0), seeded(77));
  return finish(parts);
}

