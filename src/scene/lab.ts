import {
  Frame,
  carpet,
  chair,
  extinguisher,
  finish,
  glassRoom,
  plant,
  round,
  seeded,
  shelving,
  sitter,
  stander,
  wallDisplay,
  workstation,
  row,
  type FloorGeo,
  type Parts,
  type Rand,
} from "./office";

/**
 * The quality control lab, authored at real scale like the office floors (metres, floor top at
 * y = 0) but on a larger plate: x ±12, z ±7. The camera looks from +z, so benches stand against
 * the back wall and technicians face them.
 */
export const LAB_W = 12;
export const LAB_D = 7;

function bench(f: Frame, w: number, depth = 0.78, shelf = false, r?: Rand) {
  f.box("top", 0, 0.42, 0, w, 0.84, depth - 0.04);
  f.box("dark", 0, 0.86, 0, w + 0.03, 0.04, depth);
  for (let k = 0; k < Math.floor(w / 0.6); k += 1) {
    const x = -w / 2 + 0.3 + k * 0.6;
    f.box("frame", x, 0.6, depth / 2 - 0.015, 0.5, 0.012, 0.01);
    f.box("dark", x, 0.6, depth / 2 - 0.005, 0.12, 0.02, 0.02);
    f.box("frame", x, 0.25, depth / 2 - 0.015, 0.5, 0.012, 0.01);
  }
  if (shelf && r) {
    for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) f.box("frame", x, 1.35, -depth / 2 + 0.1, 0.03, 1.0, 0.03);
    for (const y of [1.25, 1.65]) f.box("frame", 0, y, -depth / 2 + 0.1, w - 0.1, 0.025, 0.28);
    for (let k = 0; k < Math.floor(w / 0.3); k += 1) {
      const x = -w / 2 + 0.25 + k * 0.3;
      if (r() > 0.3) {
        f.cyl(r() > 0.5 ? "amber" : "clear", x, 1.37, -depth / 2 + 0.1, 0.07, 0.22);
        f.cyl("dark", x, 1.5, -depth / 2 + 0.1, 0.03, 0.03);
      }
      if (r() > 0.4) f.cyl("clear", x + 0.1, 1.77, -depth / 2 + 0.1, 0.06, 0.2);
    }
  }
}

function flask(f: Frame, x: number, y: number, z: number, s = 1) {
  f.sph("clear", x, y + 0.08 * s, z, 0.085 * s, 0.9);
  f.cyl("clear", x, y + 0.2 * s, z, 0.025 * s, 0.14 * s);
  f.sph("amber", x, y + 0.05 * s, z, 0.06 * s, 0.5);
}

function fumeHood(f: Frame, r: Rand) {
  f.box("top", 0, 0.42, 0, 1.8, 0.84, 0.85);
  f.box("dark", 0, 0.86, 0.02, 1.84, 0.04, 0.85);
  f.box("top", -0.88, 1.6, -0.05, 0.05, 1.4, 0.8);
  f.box("top", 0.88, 1.6, -0.05, 0.05, 1.4, 0.8);
  f.box("top", 0, 1.6, -0.4, 1.8, 1.4, 0.05);
  f.box("top", 0, 2.32, -0.02, 1.9, 0.14, 0.88);
  f.box("frame", 0, 1.35, 0.4, 1.7, 0.03, 0.03);
  f.box("clear", 0, 1.82, 0.4, 1.7, 0.98, 0.012);
  f.box("frame", 0, 2.28, 0.4, 1.76, 0.05, 0.04);
  f.box("ledB", 0, 2.2, 0.05, 1.5, 0.02, 0.1);
  f.cyl("steel", 0.5, 2.6, -0.3, 0.16, 0.6);
  f.box("screen", 0.6, 1.05, 0.44, 0.22, 0.09, 0.006);
  f.cyl("frame", -0.55, 1.4, -0.2, 0.012, 1.0);
  f.box("frame", -0.4, 1.7, -0.2, 0.3, 0.012, 0.012);
  flask(f, -0.2, 0.88, 0.05);
  flask(f, 0.15, 0.88, 0.0, 1.2);
  f.cyl("clear", 0.55, 0.96, 0.1, 0.05, 0.14);
  f.cyl("amber", 0.72, 0.98, -0.1, 0.06, 0.2);
  f.box("frame", 0, 0.9, 0.2, 0.6, 0.012, 0.3, r() * 0.4);
}

function balance(f: Frame) {
  f.box("top", 0, 0.925, 0, 0.26, 0.09, 0.36);
  f.box("screen", 0, 0.94, 0.19, 0.12, 0.05, 0.006);
  f.box("clear", 0, 1.03, -0.03, 0.22, 0.2, 0.24);
  f.box("frame", 0, 1.13, -0.03, 0.23, 0.012, 0.25);
  f.cyl("steel", 0, 0.985, -0.03, 0.06, 0.012);
}

function hplc(f: Frame) {
  f.box("top", 0, 0.42, 0, 1.4, 0.84, 0.76);
  f.box("dark", 0, 0.86, 0, 1.44, 0.04, 0.78);
  const mods = ["top", "top", "top", "top"] as const;
  mods.forEach((tone, k) => {
    const y = 0.98 + k * 0.17;
    f.box(tone, -0.2, y, 0, 0.5, 0.15, 0.6);
    f.box("dark", -0.2, y, 0.305, 0.44, 0.08, 0.006);
    f.box(k % 2 ? "ledB" : "ledA", -0.06, y + 0.02, 0.31, 0.03, 0.02, 0.006);
    if (k === 3) f.box("screen", -0.34, y, 0.31, 0.12, 0.06, 0.006);
  });
  f.box("frame", -0.2, 1.72, 0, 0.5, 0.02, 0.5);
  for (let k = 0; k < 4; k += 1) {
    f.cyl(k % 2 ? "amber" : "clear", -0.36 + k * 0.11, 1.84, -0.05, 0.045, 0.2);
    f.cyl("dark", -0.36 + k * 0.11, 1.96, -0.05, 0.02, 0.03);
  }
  f.cyl("steel", 0.32, 1.15, 0.28, 0.02, 0.4);
  f.cyl("steel", 0.32, 1.02, 0.28, 0.025, 0.14, Math.PI / 2);
  f.box("dark", 0.55, 1.0, -0.1, 0.36, 0.22, 0.03);
  f.box("dark", 0.55, 0.9, -0.05, 0.18, 0.02, 0.14);
  f.box("dark", 0.55, 1.2, -0.05, 0.4, 0.28, 0.025);
  f.box("screen", 0.55, 1.2, -0.035, 0.36, 0.24, 0.005);
  f.box("dark", 0.5, 0.885, 0.2, 0.34, 0.012, 0.12);
}

function gc(f: Frame) {
  f.box("top", 0, 0.42, 0, 1.2, 0.84, 0.76);
  f.box("dark", 0, 0.86, 0, 1.24, 0.04, 0.78);
  f.box("top", 0, 1.2, 0, 0.75, 0.62, 0.62);
  f.box("dark", -0.05, 1.2, 0.315, 0.5, 0.42, 0.01);
  f.box("frame", 0.18, 1.2, 0.32, 0.03, 0.3, 0.02);
  f.box("dark", 0.5, 1.15, 0.05, 0.22, 0.32, 0.32);
  f.cyl("steel", 0.5, 1.4, 0.05, 0.03, 0.14);
  f.box("screen", 0.5, 1.15, 0.225, 0.14, 0.09, 0.006);
  f.box("ledA", 0.3, 1.45, 0.32, 0.04, 0.02, 0.006);
}

function ftir(f: Frame) {
  f.box("top", 0, 0.42, 0, 1.0, 0.84, 0.76);
  f.box("dark", 0, 0.86, 0, 1.04, 0.04, 0.78);
  f.box("top", -0.1, 1.0, 0, 0.55, 0.22, 0.5);
  f.box("dark", -0.1, 1.13, 0, 0.5, 0.05, 0.44);
  f.cyl("steel", -0.1, 1.04, 0.1, 0.06, 0.03);
  f.limb("frame", [-0.1, 1.04, 0.1], [-0.1, 1.3, 0.14], 0.012);
  f.cyl("dark", -0.1, 1.3, 0.14, 0.05, 0.04);
  f.box("screen", 0.32, 1.02, 0.15, 0.16, 0.1, 0.006);
  f.box("dark", 0.32, 1.02, 0.12, 0.2, 0.14, 0.03);
}

function titrator(f: Frame) {
  f.box("top", 0, 0.42, 0, 1.0, 0.84, 0.76);
  f.box("dark", 0, 0.86, 0, 1.04, 0.04, 0.78);
  f.box("top", -0.15, 1.05, -0.1, 0.3, 0.36, 0.3);
  f.box("screen", -0.15, 1.1, 0.06, 0.2, 0.12, 0.006);
  f.cyl("clear", 0.15, 1.25, -0.05, 0.02, 0.7);
  f.cyl("frame", 0.25, 1.25, -0.1, 0.012, 0.8);
  f.box("frame", 0.2, 1.5, -0.075, 0.1, 0.012, 0.05);
  flask(f, 0.15, 0.88, 0.0, 1.1);
  f.cyl("frame", 0.15, 0.885, 0, 0.09, 0.02);
}

function centrifuge(f: Frame) {
  f.cyl("top", 0, 0.96, 0, 0.3, 0.2);
  f.cyl("dark", 0, 1.08, 0, 0.28, 0.06);
  f.box("screen", 0, 0.94, 0.3, 0.12, 0.05, 0.006);
}

function fridge(f: Frame, glass = false, r?: Rand) {
  f.box("steel", 0, 0.95, 0, 0.8, 1.9, 0.72);
  if (glass && r) {
    f.box("clear", 0, 1.05, 0.365, 0.7, 1.6, 0.01);
    for (let k = 0; k < 5; k += 1) {
      const y = 0.4 + k * 0.32;
      f.box("frame", 0, y, 0.05, 0.68, 0.015, 0.55);
      for (let j = 0; j < 5; j += 1) if (r() > 0.25) f.box(r() > 0.5 ? "paper" : "carton", -0.28 + j * 0.14, y + 0.06, 0.05, 0.11, 0.1, 0.4);
    }
  } else {
    f.box("frame", 0, 0.95, 0.365, 0.76, 1.86, 0.008);
    f.box("dark", 0.3, 1.1, 0.385, 0.03, 0.5, 0.03);
  }
  f.box("screen", 0, 1.78, 0.37, 0.14, 0.06, 0.006);
}

function vialRack(f: Frame, x: number, z: number, r: Rand) {
  f.box("frame", x, 0.895, z, 0.3, 0.03, 0.12);
  for (let a = 0; a < 2; a += 1) {
    for (let b = 0; b < 6; b += 1) {
      const y = r() > 0.15 ? 0.93 : 0;
      if (!y) continue;
      f.cyl(r() > 0.5 ? "clear" : "amber", x - 0.12 + b * 0.048, 0.95, z - 0.03 + a * 0.06, 0.017, 0.09);
      f.cyl("hazard", x - 0.12 + b * 0.048, 1.005, z - 0.03 + a * 0.06, 0.018, 0.015);
    }
  }
}

function gasCylinder(f: Frame) {
  f.cyl("steel", 0, 0.7, 0, 0.11, 1.4);
  f.sph("steel", 0, 1.4, 0, 0.11, 0.7);
  f.cyl("hazard", 0, 1.18, 0, 0.112, 0.16);
  f.cyl("dark", 0, 1.56, 0, 0.03, 0.1);
  f.box("dark", 0.06, 1.6, 0, 0.1, 0.03, 0.03);
}

function eyewash(f: Frame) {
  f.cyl("frame", 0, 0.5, 0, 0.03, 1.0);
  f.cyl("hazard", 0, 1.05, 0.05, 0.2, 0.06);
  f.cyl("steel", 0, 1.08, 0.05, 0.16, 0.02);
  f.cyl("frame", 0.2, 0.6, -0.1, 0.02, 1.2);
  f.box("hazard", 0.2, 1.5, -0.1, 0.5, 0.5, 0.03);
  f.box("dark", 0.2, 1.5, -0.08, 0.35, 0.05, 0.01);
}

function stool(f: Frame) {
  f.cyl("seat", 0, 0.66, 0, 0.19, 0.06);
  f.cyl("frame", 0, 0.32, 0, 0.022, 0.64);
  f.cyl("dark", 0, 0.02, 0, 0.24, 0.04);
}

function island(f: Frame, w: number, r: Rand) {
  f.box("top", 0, 0.42, 0, w, 0.84, 1.3);
  f.box("dark", 0, 0.86, 0, w + 0.04, 0.04, 1.36);
  for (let k = 0; k < Math.floor(w / 0.7); k += 1) f.box("dark", -w / 2 + 0.35 + k * 0.7, 0.6, 0.655, 0.14, 0.02, 0.02);
  f.cyl("steel", w / 2 - 0.7, 0.9, 0.3, 0.2, 0.05);
  f.cyl("steel", w / 2 - 0.7, 1.05, 0.05, 0.02, 0.3);
  f.limb("steel", [w / 2 - 0.7, 1.2, 0.05], [w / 2 - 0.7, 1.22, 0.2], 0.018);
  for (const x of [-w / 2 + 0.6, 0, w / 2 - 1.6]) {
    for (const z of [-0.25]) f.box("frame", x, 1.4, z, 0.03, 0.9, 0.03);
  }
  f.box("frame", 0, 1.7, -0.25, w - 1.0, 0.03, 0.3);
  for (let k = 0; k < Math.floor(w / 0.45); k += 1) {
    const x = -w / 2 + 0.5 + k * 0.45;
    if (r() > 0.3) f.cyl(r() > 0.5 ? "amber" : "clear", x, 1.8, -0.25, 0.06, 0.18);
  }
  vialRack(f, -w / 2 + 0.6, 0.35, r);
  vialRack(f, -w / 2 + 1.0, 0.25, r);
  flask(f, 0.2, 0.88, 0.2);
  flask(f, 0.5, 0.88, 0.35, 1.2);
}

function shell(f: Frame) {
  for (let x = -LAB_W; x <= LAB_W + 0.01; x += 1.5) {
    f.box("frame", x, 1.3, -LAB_D, 0.05, 2.6, 0.05);
    if (Math.round(x / 1.5) % 2 === 0) f.box("frame", x, 1.3, LAB_D, 0.05, 2.6, 0.05);
  }
  for (let z = -LAB_D; z <= LAB_D + 0.01; z += 3.5) {
    f.box("frame", -LAB_W, 1.3, z, 0.05, 2.6, 0.05);
    f.box("frame", LAB_W, 1.3, z, 0.05, 2.6, 0.05);
  }
  for (const y of [1.2, 2.6]) {
    f.box("frame", 0, y, -LAB_D, LAB_W * 2, 0.05, 0.05);
    f.box("frame", 0, y, LAB_D, LAB_W * 2, 0.05, 0.05);
    f.box("frame", -LAB_W, y, 0, 0.05, 0.05, LAB_D * 2);
    f.box("frame", LAB_W, y, 0, 0.05, 0.05, LAB_D * 2);
  }
  f.box("frame", 0, 0.06, -LAB_D, LAB_W * 2, 0.12, 0.08);
  f.box("frame", 0, 0.06, LAB_D, LAB_W * 2, 0.12, 0.08);
  f.box("frame", -LAB_W, 0.06, 0, 0.08, 0.12, LAB_D * 2);
  f.box("frame", LAB_W, 0.06, 0, 0.08, 0.12, LAB_D * 2);
}

/** Floor A: sample receiving, preparation, instrument hall. */
function analysis(f: Frame, r: Rand) {
  shell(f);

  // sample receiving (left)
  fridge(f.at(-11.4, -6.4), true, r);
  fridge(f.at(-10.5, -6.4), true, r);
  bench(f.at(-8.3, -6.45), 3.2, 0.78, true, r);
  for (let k = 0; k < 3; k += 1) vialRack(f.at(-8.3, -6.45), -1.0 + k * 0.7, 0, r);
  stander(f.at(-8.3, -5.2, Math.PI), r, false, true);
  stander(f.at(-10.2, -4.9, Math.PI * 0.85), r, true, true);
  for (let k = 0; k < 3; k += 1) f.box("carton", -11.0 + k * 0.55, 0.2, -3.6, 0.5, 0.4, 0.4);
  f.box("carton", -10.75, 0.6, -3.6, 0.5, 0.4, 0.4);
  const desk = f.at(-9.0, 5.0, Math.PI);
  workstation(desk, r, { screens: 2, wide: 2.0, person: false });
  sitter(desk.at(0, 0), r, true);
  stool(f.at(-6.8, 4.0));

  // preparation (centre-left)
  fumeHood(f.at(-5.0, -6.35), r);
  fumeHood(f.at(-3.05, -6.35), r);
  bench(f.at(-0.9, -6.45), 2.1, 0.78, true, r);
  balance(f.at(-1.4, -6.45));
  balance(f.at(-0.6, -6.45));
  centrifuge(f.at(-0.05, -6.4));
  island(f.at(-3.6, -2.5), 4.6, r);
  stander(f.at(-4.6, -1.5, 0), r, false, true);
  stander(f.at(-2.6, -1.4, Math.PI * 0.05), r, false, true);
  stander(f.at(-3.6, -3.7, Math.PI), r, true, true);
  stool(f.at(-6.6, -2.4));

  // instruments (right)
  bench(f.at(11.0, -6.45), 2.0);
  hplc(f.at(2.4, -6.45));
  hplc(f.at(4.2, -6.45));
  gc(f.at(6.2, -6.45));
  ftir(f.at(7.85, -6.45));
  titrator(f.at(9.35, -6.45));
  centrifuge(f.at(11.0, -6.45));
  f.box("carton", 11.0, 1.05, -6.45, 0.4, 0.3, 0.3);
  island(f.at(6.6, -2.5), 5.6, r);
  stander(f.at(5.2, -1.4, Math.PI * 0.05), r, false, true);
  stander(f.at(7.8, -3.7, Math.PI), r, true, true);
  const seat = f.at(4.2, -4.4, Math.PI);
  chair(seat);
  sitter(seat, r, true);
  row(f, r, 4.6, 5.3, 4, Math.PI, { screens: 2, laptop: true });

  // safety and services
  for (const [x, z] of [[11.4, -3.6], [11.4, -4.0], [11.4, -4.4]] as const) gasCylinder(f.at(x, z));
  eyewash(f.at(-11.5, 4.2, Math.PI / 2));
  extinguisher(f.at(11.5, 5.8));
  f.box("hazard", -3.6, 1.7, -6.9, 0.5, 0.5, 0.03);
  f.box("dark", -3.6, 1.7, -6.88, 0.35, 0.05, 0.01);
  plant(f.at(-11.4, 6.3), r, true);
  plant(f.at(11.4, 6.3), r, true);
}

/** Floor B: LIMS review, the QA release office and the retained-sample store. */
function review(f: Frame, r: Rand) {
  shell(f);
  carpet(f, -11.6, 11.6, -6.6, 6.6);
  wallDisplay(f.at(-5.6, -6.92), r, 6.4, 2.0, 1.75);
  row(f, r, -10.5, 5.0, 5, Math.PI, { screens: 2 });
  row(f, r, -10.5, 2.4, 5, Math.PI, { screens: 2, laptop: true });
  stander(f.at(-6.0, -4.9, Math.PI), r, true, false);
  stander(f.at(-4.4, -4.8, Math.PI * 0.95), r, false, false);
  glassRoom(f, 2.6, 11.4, -6.6, -1.4, 0);
  const qa = f.at(7.0, -4.6, Math.PI);
  workstation(qa, r, { screens: 2, wide: 2.2, person: true });
  for (const s of [-1, 1]) {
    const c = f.at(7.0 + s * 0.9, -2.3, 0);
    chair(c);
    if (s > 0) sitter(c, r);
  }
  f.box("top", 10.4, 0.45, -5.4, 1.0, 0.9, 0.6);
  f.box("dark", 10.4, 0.95, -5.4, 0.5, 0.2, 0.4);
  f.box("paper", 10.4, 1.08, -5.4, 0.38, 0.02, 0.28);
  f.box("hazard", 3.4, 1.7, -6.55, 0.6, 0.4, 0.03);
  for (let k = 0; k < 3; k += 1) {
    const s = f.at(3.4 + k * 1.05, -6.15);
    shelving(s, r, 0.95);
  }
  round(f.at(6.6, 3.6), r, 5, 4);
  // microscope station
  bench(f.at(10.4, 5.9, Math.PI), 2.4);
  const mic = f.at(10.4, 5.9, Math.PI);
  mic.box("frame", 0, 0.92, 0.1, 0.2, 0.04, 0.24);
  mic.limb("frame", [0, 0.94, 0.16], [0, 1.28, 0.16], 0.03);
  mic.limb("dark", [0, 1.24, 0.16], [0, 1.28, -0.05], 0.03);
  mic.cyl("dark", 0, 1.25, -0.02, 0.03, 0.14, 0.6);
  stool(f.at(10.4, 4.9));
  plant(f.at(-11.4, 6.3), r, true);
  plant(f.at(11.4, 6.3), r, true);
  plant(f.at(2.0, 6.3), r);
}

const LAYOUTS = [analysis, review];

export function buildLabFloor(index: number): FloorGeo {
  const parts: Parts = {};
  const root = new Frame(parts, 0, 0, 0);
  LAYOUTS[index](root, seeded(index + 41));
  return finish(parts);
}
