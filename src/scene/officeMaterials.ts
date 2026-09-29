import { BufferGeometry, DoubleSide, Float32BufferAttribute, LineBasicMaterial, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import type { Bucket } from "./office";

export const std = (color: string, roughness: number, metalness: number, extra: Record<string, unknown> = {}) =>
  new MeshStandardMaterial({ color, roughness, metalness, ...extra });

export const screenMat = std("#c3d0db", 0.3, 0.1, { emissive: "#a9bccd", emissiveIntensity: 0.5 });
export const ledAMat = new MeshBasicMaterial({ color: "#d1a877" });
export const ledBMat = new MeshBasicMaterial({ color: "#e3ecf3" });
export const glassOffice = new MeshPhysicalMaterial({
  color: "#dbe6ee",
  metalness: 0.05,
  roughness: 0.05,
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
  side: DoubleSide,
});

export const BUCKETS: Record<Bucket, MeshStandardMaterial | MeshBasicMaterial | MeshPhysicalMaterial> = {
  top: std("#e6e9ed", 0.5, 0.08),
  frame: std("#a5aeb7", 0.4, 0.72),
  dark: std("#38414a", 0.45, 0.5),
  screen: screenMat,
  ledA: ledAMat,
  ledB: ledBMat,
  fabric: std("#b3bbc3", 0.9, 0),
  seat: std("#4b555f", 0.85, 0),
  carpet: std("#cdd3d9", 1, 0),
  skin: std("#c6a78f", 0.7, 0),
  clothA: std("#485259", 0.85, 0),
  clothB: std("#8b939c", 0.85, 0),
  clothC: std("#7a624c", 0.85, 0),
  clothD: std("#d4dade", 0.85, 0),
  leaf: std("#8ea08b", 0.8, 0),
  pot: std("#5b656e", 0.6, 0.1),
  paper: std("#f6f7f9", 0.7, 0),
  carton: std("#d1c0a9", 0.9, 0),
  wood: std("#cdbca5", 0.8, 0),
  warm: std("#7a624c", 0.6, 0.1),
  steel: std("#c6ced5", 0.25, 0.85),
  amber: std("#a98459", 0.4, 0.1),
  hazard: std("#c9a24a", 0.6, 0),
  drum: std("#6b8496", 0.45, 0.45),
  drumGrey: std("#a3acb4", 0.45, 0.5),
  clear: new MeshPhysicalMaterial({ color: "#e4edf3", roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }),
  glass: glassOffice,
};

/** Raised-floor tiles, 1.2 m: a fine grid that makes the slab read as a real floor. */
export function makeTiles(hw: number, hd: number) {
  const pts: number[] = [];
  for (let x = -hw; x <= hw + 0.01; x += 1.2) pts.push(x, 0.013, -hd, x, 0.013, hd);
  for (let z = -hd; z <= hd + 0.01; z += 1.2) pts.push(-hw, 0.013, z, hw, 0.013, z);
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pts, 3));
  return geo;
}

export const tileGeo = makeTiles(9, 6);
export const tileMat = new LineBasicMaterial({ color: "#9aa3ab", transparent: true, opacity: 0.22 });

