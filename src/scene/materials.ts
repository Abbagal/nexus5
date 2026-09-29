import { Color, MeshPhysicalMaterial, MeshStandardMaterial } from "three";
import { withSurface } from "./surface";

export const PAPER = new Color("#f3f4f6");
export const WARM = new Color("#cbb8a4");

type Recorded = {
  mat: MeshPhysicalMaterial | MeshStandardMaterial;
  base: Color;
  metalness: number;
  roughness: number;
  env: number;
};

export const PLANT: Recorded[] = [];

function remember(
  mat: MeshPhysicalMaterial | MeshStandardMaterial,
  metalness: number,
  roughness: number,
  env: number,
) {
  PLANT.push({ mat, base: mat.color.clone(), metalness, roughness, env });
  return mat;
}

function physical(color: string, metalness: number, roughness: number, extras: Record<string, unknown> = {}) {
  const env = typeof extras.envMapIntensity === "number" ? extras.envMapIntensity : 0.72;
  const mat = new MeshPhysicalMaterial({
    color,
    metalness,
    roughness,
    envMapIntensity: env,
    ...extras,
  });
  return remember(mat, metalness, roughness, env);
}

export const matPaint = withSurface(
  physical("#c9d1d8", 0.24, 0.48, {
    clearcoat: 0.22,
    clearcoatRoughness: 0.48,
  }),
  "paint",
);

export const matPaintCool = withSurface(
  physical("#c5ced6", 0.28, 0.4, {
    clearcoat: 0.16,
    clearcoatRoughness: 0.44,
  }),
  "paint",
);

export const matStainless = withSurface(physical("#b4bdc6", 0.92, 0.26, { envMapIntensity: 0.78 }), "metal");
export const matSteel = withSurface(physical("#7a838c", 0.78, 0.38, { envMapIntensity: 0.55 }), "metal");
export const matGalv = withSurface(physical("#a8b1b9", 0.7, 0.44), "metal");
export const matDark = withSurface(physical("#555e66", 0.5, 0.46, { envMapIntensity: 0.35 }), "metal");
export const matConcrete = withSurface(physical("#d5d9de", 0.02, 0.94, { envMapIntensity: 0.12 }), "concrete");
export const matPad = withSurface(physical("#d8dee4", 0.04, 0.94, { envMapIntensity: 0.08 }), "concrete");

export const matMarking = physical("#aeb6be", 0.02, 0.86, { envMapIntensity: 0.1 });

export const matCladding = withSurface(
  physical("#c9d1d8", 0.3, 0.5, { clearcoat: 0.1, clearcoatRoughness: 0.6 }),
  "cladding",
);
export const matCladdingCool = withSurface(
  physical("#c5ced6", 0.32, 0.44, { clearcoat: 0.08, clearcoatRoughness: 0.55 }),
  "cladding",
);

export const matReactor = matPaint.clone();
matReactor.color.set("#c9d1d8");

export const matGlass = new MeshPhysicalMaterial({
  color: "#d5dde4",
  metalness: 0.08,
  roughness: 0.06,
  transparent: true,
  opacity: 0.42,
  envMapIntensity: 1.05,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  ior: 1.45,
  thickness: 0.04,
});

export const matInk = new MeshStandardMaterial({
  color: "#243038",
  roughness: 0.7,
  metalness: 0.05,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
});

export const matLink = new MeshStandardMaterial({
  color: "#7d868e",
  metalness: 0.65,
  roughness: 0.32,
  transparent: true,
  opacity: 1,
});

export const matGround = withSurface(
  new MeshStandardMaterial({
    color: "#f3f4f6",
    roughness: 1,
    metalness: 0,
  }),
  "ground",
);
