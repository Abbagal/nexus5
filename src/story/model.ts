import { sectionAt, sectionEnd, sectionStart } from "./sections";
import { exploreState } from "./state";

export type Pt = [number, number, number];

export const QUERY = "Why did Batch B-2047 fail quality inspection?";

export const DIM = {
  reactorR: 1.02,
  reactorShell: 2.55,
  reactorSkirt: 0.92,
  tankR: 1.12,
  tankShell: 3.15,
  tankLeg: 0.78,
  largeR: 1.42,
  largeShell: 3.85,
  largeLeg: 0.9,
  colR: 0.56,
  colH: 11.3,
  colSkirt: 0.7,
  col2R: 0.44,
  col2H: 8.1,
};

export const P = {
  r201: [0, 0, 0] as Pt,
  r202: [4.55, 0, 0.85] as Pt,
  c301: [-1.55, 0, -8.15] as Pt,
  c302: [2.35, 0, -9.05] as Pt,
  e401: [3.85, 0, -3.35] as Pt,
  e402: [-4.15, 0, -1.35] as Pt,
  pumpA: [-2.15, 0, 1.55] as Pt,
  pumpB: [2.55, 0, 2.45] as Pt,
  pumpC: [-4.7, 0, -2.55] as Pt,
  t101: [-9.35, 0, -4.15] as Pt,
  t102: [-9.35, 0, 0.15] as Pt,
  t103: [-9.35, 0, 4.35] as Pt,
  t104: [-12.55, 0, -1.05] as Pt,
  drum: [-12.35, 0, 4.55] as Pt,
  shelter: [13.6, 0, 1.6] as Pt,
  mcc: [10.55, 0, 1.15] as Pt,
};

const shellTop = DIM.reactorSkirt + DIM.reactorShell;

export const ANCHOR = {
  r201In: [0.12, 1.48, DIM.reactorR + 0.34] as Pt,
  r201Out: [0.05, shellTop - 0.38, -(DIM.reactorR + 0.36)] as Pt,
  r201Top: [0, shellTop + DIM.reactorR * 0.42 + 0.55, 0] as Pt,
};

export type CameraKey = { t: number; pos: Pt; look: Pt };

function along(id: Parameters<typeof sectionStart>[0], u: number) {
  const a = sectionStart(id);
  return a + (sectionEnd(id) - a) * u;
}

export const CAMERA: CameraKey[] = [
  { t: 0, pos: [68, 50, 86], look: [2, 3, -6] },
  { t: sectionStart("SECTION_02_FACTORY_INTERIOR"), pos: [36, 28, 50], look: [0, 4, -4] },
  { t: along("SECTION_02_FACTORY_INTERIOR", 0.55), pos: [30, 24, 36], look: [6, 4, -22] },
  { t: sectionStart("SECTION_02B_MANUFACTURING"), pos: [30, 24, 36], look: [6, 4, -22] },
  { t: along("SECTION_02B_MANUFACTURING", 0.5), pos: [12, 15, -6], look: [6, 4.4, -44] },
  { t: along("SECTION_02B_MANUFACTURING", 0.92), pos: [-11, 11.5, -17], look: [6, 4.8, -47] },
  { t: sectionStart("SECTION_03_PLANT"), pos: [-11, 11.5, -17], look: [6, 4.8, -47] },
  { t: along("SECTION_03_PLANT", 0.42), pos: [14, 12, 22], look: [0, 3.2, -1] },
  { t: along("SECTION_03_PLANT", 0.78), pos: [7.5, 5.6, 11.5], look: [0.1, 2.6, -0.5] },
  { t: sectionStart("SECTION_04_DATA"), pos: [4.3, 3.6, 6.7], look: [0.15, 2.35, 0.05] },
  { t: sectionStart("SECTION_05_FRAGMENTATION"), pos: [1.2, 12.4, 22], look: [0, 3.6, -1] },
  { t: sectionEnd("SECTION_05_FRAGMENTATION") - 0.012, pos: [0.2, 14.2, 25], look: [0, 3.2, -1] },
  { t: sectionStart("SECTION_06_INCIDENT"), pos: [3.5, 3.65, 5.7], look: [0.1, 2.35, 0.05] },
  { t: sectionEnd("SECTION_06_INCIDENT") - 0.008, pos: [2.35, 3.15, 4.45], look: [0.12, 2.25, 0] },
  { t: along("SECTION_07_INVESTIGATION", 0.01), pos: [4, 10, 18], look: [0, 3.2, -1] },
  { t: along("SECTION_07_INVESTIGATION", 0.11), pos: [18, 7.0, -1.5], look: [11.6, 4.6, -6.6] },
  { t: along("SECTION_07_INVESTIGATION", 0.2), pos: [18, 7.0, -1.5], look: [11.6, 4.6, -6.6] },
  { t: along("SECTION_07_INVESTIGATION", 0.23), pos: [-17, 6.4, 14], look: [-10.8, 4.0, 9.4] },
  { t: along("SECTION_07_INVESTIGATION", 0.32), pos: [-17, 6.4, 14], look: [-10.8, 4.0, 9.4] },
  { t: along("SECTION_07_INVESTIGATION", 0.35), pos: [17.5, 6.2, 11.5], look: [11.4, 3.8, 7.4] },
  { t: along("SECTION_07_INVESTIGATION", 0.44), pos: [17.5, 6.2, 11.5], look: [11.4, 3.8, 7.4] },
  { t: along("SECTION_07_INVESTIGATION", 0.47), pos: [-17.5, 6.4, -1.5], look: [-11.6, 4.2, -5.6] },
  { t: along("SECTION_07_INVESTIGATION", 0.56), pos: [-17.5, 6.4, -1.5], look: [-11.6, 4.2, -5.6] },
  { t: along("SECTION_07_INVESTIGATION", 0.59), pos: [-2.4, 7.8, 18], look: [-6.4, 5.4, 12.2] },
  { t: along("SECTION_07_INVESTIGATION", 0.66), pos: [-2.4, 7.8, 18], look: [-6.4, 5.4, 12.2] },
  { t: along("SECTION_07_INVESTIGATION", 0.69), pos: [-18.5, 6.8, 7], look: [-12.0, 5.0, 2.4] },
  { t: along("SECTION_07_INVESTIGATION", 0.76), pos: [-18.5, 6.8, 7], look: [-12.0, 5.0, 2.4] },
  { t: along("SECTION_07_INVESTIGATION", 0.79), pos: [16, 6.8, -15], look: [10.2, 4.8, -11.0] },
  { t: along("SECTION_07_INVESTIGATION", 0.86), pos: [16, 6.8, -15], look: [10.2, 4.8, -11.0] },
  { t: along("SECTION_07_INVESTIGATION", 0.89), pos: [0.4, 14, 24], look: [0, 3.4, -1.2] },
  { t: sectionStart("SECTION_08_CONNECTORS"), pos: [0.2, 16.2, 26], look: [0, 3.4, -1.2] },
  { t: sectionStart("SECTION_09_INTELLIGENCE"), pos: [0.6, 8.4, 14.2], look: [0, 4.8, -0.2] },
  { t: sectionStart("SECTION_10_ONTOLOGY"), pos: [0.6, 14.6, 33], look: [-0.2, 6.5, 4.6] },
  { t: sectionStart("SECTION_11_QUERY"), pos: [0.6, 14.6, 33], look: [-0.2, 6.5, 4.6] },
  { t: sectionStart("SECTION_12_INVESTIGATION"), pos: [0.6, 14.2, 31], look: [-0.2, 6.5, 4.6] },
  { t: sectionStart("SECTION_13_ANSWER"), pos: [0.6, 14.6, 33], look: [-0.2, 6.5, 4.6] },
  { t: sectionStart("SECTION_14_ADMIN_BUILDING"), pos: [58, 42, 84], look: [8, 4, 14] },
  { t: along("SECTION_14_ADMIN_BUILDING", 0.5), pos: [38, 17, 60], look: [16, 4, 31] },
  { t: along("SECTION_14_ADMIN_BUILDING", 0.92), pos: [25.5, 7.6, 45], look: [16, 4.4, 31] },
  { t: sectionStart("SECTION_15_ADMIN_TWIN"), pos: [25.5, 7.6, 45], look: [16, 4.4, 31] },
  { t: along("SECTION_15_ADMIN_TWIN", 0.42), pos: [-23, 19, 39], look: [-3.8, 7.4, 0] },
  { t: along("SECTION_15_ADMIN_TWIN", 0.9), pos: [13, 14, 31], look: [-3.0, 7.4, 0] },
  { t: sectionEnd("SECTION_15_ADMIN_TWIN"), pos: [12, 13.5, 30], look: [-3.0, 7.2, 0] },
  { t: along("SECTION_16_QC_BUILDING", 0.08), pos: [58, 40, 80], look: [22, 4, 18] },
  { t: along("SECTION_16_QC_BUILDING", 0.5), pos: [54, 18, 60], look: [34, 4, 28] },
  { t: along("SECTION_16_QC_BUILDING", 0.92), pos: [44, 8, 42.5], look: [34.5, 4.4, 28] },
  { t: sectionStart("SECTION_17_QC_TWIN"), pos: [44, 8, 42.5], look: [34.5, 4.4, 28] },
  { t: along("SECTION_17_QC_TWIN", 0.42), pos: [-12.5, 11.5, 21], look: [-1.6, 4.4, 0] },
  { t: along("SECTION_17_QC_TWIN", 0.9), pos: [11.5, 10.8, 22], look: [-1.6, 4.4, 0] },
  { t: sectionEnd("SECTION_17_QC_TWIN"), pos: [12.5, 10.8, 23], look: [-1.6, 4.4, 0] },
  { t: along("SECTION_18_WAREHOUSE_BUILDING", 0.08), pos: [40, 38, 92], look: [0, 4, 36] },
  { t: along("SECTION_18_WAREHOUSE_BUILDING", 0.5), pos: [30, 18, 74], look: [-2, 4, 42] },
  { t: along("SECTION_18_WAREHOUSE_BUILDING", 0.92), pos: [8, 9.2, 62], look: [-2, 4.6, 42] },
  { t: sectionStart("SECTION_19_WAREHOUSE_TWIN"), pos: [8, 9.2, 62], look: [-2, 4.6, 42] },
  { t: along("SECTION_19_WAREHOUSE_TWIN", 0.42), pos: [-18, 14, 29], look: [-1.5, 3.2, 0] },
  { t: along("SECTION_19_WAREHOUSE_TWIN", 0.9), pos: [16, 13, 30], look: [-1.5, 3.2, 0] },
  { t: sectionEnd("SECTION_19_WAREHOUSE_TWIN"), pos: [17, 13, 31], look: [-1.5, 3.2, 0] },
  { t: along("SECTION_20_DIGITAL_TWIN", 0.22), pos: [68, 56, 98], look: [-4, 18, -2] },
  { t: along("SECTION_20_DIGITAL_TWIN", 0.78), pos: [68, 56, 98], look: [-4, 18, -2] },
  { t: sectionStart("SECTION_21_FINAL"), pos: [64, 54, 96], look: [-8, 1, -12] },
  { t: 1, pos: [66, 56, 100], look: [-8, 1, -12] },
];

export type SystemNode = {
  id: string;
  name: string;
  lines: string[];
  pos: Pt;
};

export const SYSTEMS: SystemNode[] = [
  { id: "erp", name: "ERP", lines: ["PO-3381", "Lot RM-1832", "Helion Chemicals"], pos: [-12.8, 4.6, -6.4] },
  { id: "mes", name: "MES", lines: ["Batch B-2047", "Step · react", "Status · hold"], pos: [-13.2, 5.5, 2.8] },
  { id: "lims", name: "LIMS", lines: ["Sample S-7721", "Assay 97.4%", "Spec 99.0–100.5"], pos: [-11.8, 4.4, 10.2] },
  { id: "dcs", name: "DCS / SCADA", lines: ["TT-204   84.7 °C", "PT-204   2.88 bar", "Mode · auto"], pos: [12.8, 5.2, -7.4] },
  { id: "historian", name: "Historian", lines: ["TT-204 trend", "Outside 74–81 °C", "Temperature drift"], pos: [13.6, 4.4, 1.0] },
  { id: "maintenance", name: "CMMS", lines: ["Reactor R-204", "Maintenance", "Closed · −18 h"], pos: [12.4, 4.2, 8.2] },
  { id: "quality", name: "Quality", lines: ["DEV-2047", "Assay outside spec", "Batch B-2047"], pos: [8.4, 5.8, 12.6] },
  { id: "engineering", name: "Engineering", lines: ["P&ID U-204", "R-204 datasheet", "Operating range"], pos: [-7.2, 6.0, 13.4] },
  { id: "documents", name: "Documents", lines: ["SOP-214", "Batch record", "Revision C"], pos: [-1.0, 6.6, -13.2] },
  { id: "sensors", name: "Sensors", lines: ["TT-204", "PT-204", "VT-204"], pos: [6.0, 6.4, -13.0] },
  { id: "databases", name: "Databases", lines: ["Batch history", "Material lots", "Process archive"], pos: [11.2, 5.2, -12.2] },
];

export const NEXUS = { y: 5.72, radius: 1.92 } as const;

export type GraphNode = { id: string; label: string; at: Pt };
export type GraphEdge = { a: string; b: string };

export const NODES: GraphNode[] = [
  { id: "supplier", label: "Helion Chemicals", at: [-10.2, 8.7, 5.6] },
  { id: "lot", label: "Lot RM-1832", at: [-6.4, 8.7, 5.6] },
  { id: "batch", label: "Batch B-2047", at: [-2.6, 8.7, 5.6] },
  { id: "quality", label: "Quality result", at: [2.2, 8.7, 5.6] },
  { id: "history", label: "Prior batches", at: [6.0, 8.7, 5.6] },
  { id: "customer", label: "Northline Polymers", at: [9.8, 8.7, 5.6] },
  { id: "maint", label: "Maintenance −18 h", at: [-6.4, 5.6, 5.6] },
  { id: "reactor", label: "Reactor R-204", at: [-2.6, 5.6, 5.6] },
  { id: "tt", label: "TT-204", at: [-0.2, 5.6, 5.6] },
  { id: "document", label: "Batch record", at: [2.2, 5.6, 5.6] },
];

export const EDGES: GraphEdge[] = [
  { a: "supplier", b: "lot" },
  { a: "lot", b: "batch" },
  { a: "batch", b: "quality" },
  { a: "quality", b: "history" },
  { a: "history", b: "customer" },
  { a: "batch", b: "reactor" },
  { a: "reactor", b: "maint" },
  { a: "reactor", b: "tt" },
  { a: "quality", b: "document" },
];

export const TRACE = ["batch", "lot", "supplier", "reactor", "tt", "maint", "quality", "history", "document", "customer"] as const;

export const EVIDENCE = new Set(["supplier", "lot", "batch", "reactor", "tt", "maint", "quality", "history", "document", "customer"]);

export const TRACE_LINE: Record<string, string> = {
  batch: "Batch B-2047",
  lot: "Lot RM-1832  ·  used in  ·  Batch B-2047",
  supplier: "Helion Chemicals  ·  supplied  ·  Lot RM-1832",
  reactor: "Reactor R-204  ·  processed  ·  Batch B-2047",
  tt: "TT-204  ·  monitored  ·  Reactor R-204",
  maint: "Maintenance  ·  experienced by  ·  Reactor R-204",
  quality: "Quality result  ·  tested  ·  Batch B-2047",
  history: "Prior batches  ·  similar process behaviour",
  document: "Batch record  ·  documents  ·  Batch B-2047",
  customer: "Northline Polymers  ·  receives  ·  Batch B-2047",
};

export type Line = {
  id: string;
  radius: number;
  kind: "bare" | "insulated";
  points: Pt[];
  /** CatmullRom tension; 0 keeps the last segment straight into a nozzle. */
  tension?: number;
};

function fillet(prev: Pt, corner: Pt, next: Pt, radius: number, steps = 6): Pt[] {
  const vin: Pt = [corner[0] - prev[0], corner[1] - prev[1], corner[2] - prev[2]];
  const vout: Pt = [next[0] - corner[0], next[1] - corner[1], next[2] - corner[2]];
  const lin = Math.hypot(vin[0], vin[1], vin[2]);
  const lout = Math.hypot(vout[0], vout[1], vout[2]);
  const din: Pt = [vin[0] / lin, vin[1] / lin, vin[2] / lin];
  const dout: Pt = [vout[0] / lout, vout[1] / lout, vout[2] / lout];
  const r = Math.min(radius, lin * 0.45, lout * 0.45);
  const start: Pt = [corner[0] - din[0] * r, corner[1] - din[1] * r, corner[2] - din[2] * r];
  const end: Pt = [corner[0] + dout[0] * r, corner[1] + dout[1] * r, corner[2] + dout[2] * r];
  const center: Pt = [start[0] + dout[0] * r, start[1] + dout[1] * r, start[2] + dout[2] * r];
  const from: Pt = [start[0] - center[0], start[1] - center[1], start[2] - center[2]];
  const to: Pt = [end[0] - center[0], end[1] - center[1], end[2] - center[2]];
  const dot = from[0] * to[0] + from[1] * to[1] + from[2] * to[2];
  const omega = Math.acos(Math.min(1, Math.max(-1, dot)));
  const s = Math.sin(omega);
  const pts: Pt[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const a = Math.sin((1 - t) * omega) / s;
    const b = Math.sin(t * omega) / s;
    pts.push([center[0] + a * from[0] + b * to[0], center[1] + a * from[1] + b * to[1], center[2] + a * from[2] + b * to[2]]);
  }
  return pts;
}

const RACK_Y = 3.78;
const RACK_Z = -5.42;

export const LINES: Line[] = [
  {
    id: "manifold",
    radius: 0.055,
    kind: "bare",
    points: [
      [-7.97, 1.35, -4.15],
      [-7.97, 1.35, 0.15],
      [-7.97, 1.35, 4.35],
    ],
  },
  {
    id: "feed",
    radius: 0.07,
    kind: "insulated",
    points: [
      [-7.97, 1.35, 0.15],
      [-7.97, 1.35, 1.55],
      [-7.97, 0.55, 1.55],
      [-2.48, 0.55, 1.55],
    ],
  },
  {
    id: "charge",
    radius: 0.065,
    kind: "insulated",
    points: [
      [-1.82, 0.62, 1.55],
      [-1.82, 1.48, 1.55],
      [0, 1.48, 1.32],
    ],
  },
  {
    id: "charge-r202",
    radius: 0.06,
    kind: "insulated",
    points: [
      [-0.15, 1.48, 1.55],
      [4.55, 1.48, 1.55],
      [4.55, 1.48, 2.17],
    ],
  },
  {
    id: "vapor",
    radius: 0.08,
    kind: "insulated",
    points: [
      [0, 3.09, -1.34],
      [0, RACK_Y, -1.34],
      [0, RACK_Y, RACK_Z],
      [3.85, RACK_Y, RACK_Z],
      [3.85, RACK_Y, -3.35],
      [3.85, 1.38, -3.35],
    ],
  },
  {
    id: "vapor-r202",
    radius: 0.07,
    kind: "insulated",
    points: [
      [4.55, 3.09, -0.49],
      [4.55, RACK_Y, -0.49],
      [4.55, RACK_Y, RACK_Z],
    ],
  },
  {
    id: "column-tie",
    radius: 0.05,
    kind: "bare",
    tension: 0,
    points: [
      [2.35, 2.332, -8.4],
      ...fillet([2.35, 2.332, -8.28], [2.35, 3.78, -8.28], [2.35, 3.78, -5.42], 0.28),
      [2.35, 3.78, -5.42],
    ],
  },
  {
    id: "to-column",
    radius: 0.08,
    kind: "insulated",
    tension: 0,
    points: [
      [2.45, 1.15, -3.35],
      ...fillet([2.45, 1.15, -3.35], [2.45, 1.15, -6.94], [-1.55, 1.15, -6.94], 0.28),
      ...fillet([2.45, 1.15, -6.94], [-1.55, 1.15, -6.94], [-1.55, 3.186, -6.94], 0.32),
      ...fillet([-1.55, 1.15, -6.94], [-1.55, 3.186, -6.94], [-1.55, 3.186, -7.4], 0.32),
      [-1.55, 3.186, -7.4],
    ],
  },
  {
    id: "overhead",
    radius: 0.055,
    kind: "bare",
    points: [
      [-1.55, 12.35, -8.15],
      [-0.82, 12.35, -7.42],
      [-0.82, RACK_Y, -7.42],
      [-0.82, RACK_Y, RACK_Z],
      [-4.15, RACK_Y, RACK_Z],
      [-4.15, RACK_Y, -1.35],
      [-4.15, 1.22, -1.35],
    ],
  },
  {
    id: "bottoms",
    radius: 0.06,
    kind: "insulated",
    points: [
      [-1.55, 1.15, -7.45],
      [-1.55, 0.62, -7.45],
      [-1.55, 0.62, -4.15],
      [-7.97, 0.62, -4.15],
      [-7.97, 1.35, -4.15],
    ],
  },
  {
    id: "cw",
    radius: 0.05,
    kind: "bare",
    points: [
      [3.85, 4.22, RACK_Z],
      [3.85, 4.22, -3.35],
      [3.85, 1.38, -3.35],
    ],
  },
  {
    id: "reflux",
    radius: 0.05,
    kind: "insulated",
    points: [
      [-4.15, 0.7, -1.55],
      [-4.7, 0.48, -2.15],
    ],
  },
  {
    id: "rack-a",
    radius: 0.045,
    kind: "bare",
    points: [
      [-9.0, RACK_Y, RACK_Z],
      [5.0, RACK_Y, RACK_Z],
    ],
  },
  {
    id: "rack-b",
    radius: 0.045,
    kind: "bare",
    points: [
      [-9.0, 4.22, -5.15],
      [5.0, 4.22, -5.15],
    ],
  },
  {
    id: "rack-c",
    radius: 0.04,
    kind: "insulated",
    points: [
      [-8.2, 4.55, -5.55],
      [4.6, 4.55, -5.55],
    ],
  },
];

export const SHOES: { at: Pt; top: number }[] = [
  { at: [-5.2, 0, 1.55], top: 0.55 },
  { at: [-3.6, 0, 1.55], top: 0.55 },
  { at: [-5.4, 0, -4.15], top: 0.62 },
  { at: [-3.2, 0, -4.15], top: 0.62 },
  { at: [1.2, 0, -6.5], top: 1.15 },
  { at: [4.55, 0, -2.6], top: RACK_Y },
  { at: [0, 0, -3.2], top: RACK_Y },
  { at: [-4.15, 0, -3.2], top: RACK_Y },
  { at: [-0.82, 0, -6.5], top: RACK_Y },
  { at: [3.85, 0, -4.3], top: 4.22 },
  { at: [2.35, 0, -6.9], top: 3.78 },
];

export const SOURCES: { at: Pt; system: number }[] = [
  { at: [0.85, 3.35, 0.55], system: 3 },
  { at: [0.35, 2.4, 1.05], system: 4 },
  { at: [-9.35, 4.6, 0.15], system: 0 },
  { at: [-1.55, 8.2, -8.15], system: 9 },
  { at: [4.55, 3.4, 0.85], system: 1 },
  { at: [3.85, 1.9, -3.35], system: 5 },
  { at: [-9.35, 4.2, 4.35], system: 2 },
  { at: [-0.4, 1.35, 1.15], system: 6 },
  { at: [-1.55, 6.4, -8.15], system: 7 },
  { at: [1.2, 4.6, -0.4], system: 8 },
  { at: [-9.35, 3.2, -4.15], system: 10 },
];

export function clamp(v: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, v));
}

export function smoothstep(t: number) {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
}

export function ramp(p: number, a: number, b: number) {
  if (b === a) return p >= b ? 1 : 0;
  return smoothstep((p - a) / (b - a));
}

export function band(p: number, a: number, b: number, feather = 0.03) {
  return ramp(p, a, a + feather) * (1 - ramp(p, b - feather, b));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function plantWash(p: number) {
  const on = ramp(p, sectionStart("SECTION_10_ONTOLOGY"), sectionStart("SECTION_10_ONTOLOGY") + 0.035);
  const off = ramp(p, sectionStart("SECTION_20_DIGITAL_TWIN"), sectionEnd("SECTION_20_DIGITAL_TWIN"));
  return on * (1 - off);
}

export function incidentTint(p: number) {
  const raw = ramp(p, sectionStart("SECTION_06_INCIDENT"), sectionEnd("SECTION_06_INCIDENT") - 0.008);
  if (p < sectionStart("SECTION_20_DIGITAL_TWIN")) return raw * (1 - plantWash(p));
  return raw * 0.38;
}

export function systemsOpacity(p: number) {
  const appear = ramp(p, sectionStart("SECTION_05_FRAGMENTATION"), sectionEnd("SECTION_05_FRAGMENTATION"));
  const connectors = sectionStart("SECTION_08_CONNECTORS");
  const ontology = sectionStart("SECTION_10_ONTOLOGY");
  const query = sectionStart("SECTION_11_QUERY");
  const finale = sectionStart("SECTION_21_FINAL");
  if (p < sectionEnd("SECTION_05_FRAGMENTATION")) return appear;
  if (p < connectors) return 1;
  if (p < ontology) return lerp(1, 0.85, ramp(p, connectors, sectionEnd("SECTION_08_CONNECTORS")));
  if (p < query) return lerp(0.85, 0.22, ramp(p, ontology, sectionEnd("SECTION_10_ONTOLOGY")));
  if (p < finale) return 0.22;
  return lerp(0.22, 0.42, ramp(p, finale, 1));
}

export function nexusAmount(p: number) {
  return ramp(p, sectionStart("SECTION_08_CONNECTORS"), sectionEnd("SECTION_08_CONNECTORS"));
}

export function ontologyAppear(p: number, index: number, count: number) {
  const start = sectionStart("SECTION_10_ONTOLOGY") + (index / Math.max(1, count)) * 0.032;
  return ramp(p, start, start + 0.018);
}

export function activeSystem(p: number) {
  const start = sectionStart("SECTION_07_INVESTIGATION");
  const span = sectionEnd("SECTION_07_INVESTIGATION") - start;
  const u = (p - start) / span;
  if (u >= 0.11 && u < 0.22) return "dcs";
  if (u >= 0.23 && u < 0.34) return "lims";
  if (u >= 0.35 && u < 0.46) return "maintenance";
  if (u >= 0.47 && u < 0.58) return "erp";
  if (u >= 0.59 && u < 0.68) return "engineering";
  if (u >= 0.69 && u < 0.78) return "mes";
  if (u >= 0.79 && u < 0.88) return "databases";
  return null;
}

const TRACE_SETS = TRACE.map((id) => new Set<string>([id]));
let focusProgress = Number.NaN;
let focusCache: Set<string> | null = null;

export function focusSet(p: number) {
  if (p === focusProgress) return focusCache;
  focusProgress = p;
  const traceStart = sectionStart("SECTION_12_INVESTIGATION");
  const traceEnd = sectionEnd("SECTION_12_INVESTIGATION");
  const answerStart = sectionStart("SECTION_13_ANSWER");
  const answerEnd = sectionEnd("SECTION_13_ANSWER");
  if (p < traceStart || p >= answerEnd) focusCache = null;
  else if (p >= answerStart) focusCache = EVIDENCE;
  else {
    const u = clamp((p - traceStart) / Math.max(0.0001, traceEnd - traceStart));
    focusCache = TRACE_SETS[Math.min(TRACE.length - 1, Math.floor(u * TRACE.length))];
  }
  return focusCache;
}

export const ORG_TREE: { name: string; record: string; teams: [string, string][] }[] = [
  { name: "Compliance", record: "2 audits open", teams: [["Regulatory", "Q3 filed"], ["Safety", "212 d clear"]] },
  { name: "IT & data", record: "Systems 99.9% up", teams: [["ERP", "3 sites"], ["Network", "99.98%"]] },
  { name: "Planning", record: "Plan week 39", teams: [["Production", "MO-7713"], ["Dispatch", "SO-5520 hold"]] },
  { name: "Procurement", record: "42 open POs", teams: [["Sourcing", "RM-1832"], ["Vendor QA", "CoA 7781"]] },
  { name: "People", record: "Headcount 318", teams: [["Payroll", "Cycle 39 closed"], ["Training", "96% certified"]] },
  { name: "Finance", record: "Budget 94% used", teams: [["Payables", "18 due"], ["Cost control", "−1.8% var"]] },
  { name: "Plant director", record: "7 reports · 318 staff", teams: [["Board", "Weekly review"], ["Site leads", "6 departments"]] },
];

export type SiteArea = {
  code: string;
  name: string;
  at: Pt;
  record: string;
  /** Part of the Batch B-2047 chain. */
  linked?: boolean;
  /** Outside the fence: supplier or customer. */
  external?: boolean;
};

export const SITE_AREAS: SiteArea[] = [
  { code: "U-200", name: "Chemical processing", at: [-1.55, 12.5, -8.15], record: "Batch B-2047 · R-204", linked: true },
  { code: "B-12", name: "Control room", at: [-21.5, 5.6, -7], record: "DCS · 1,240 tags live" },
  { code: "B-01", name: "Manufacturing", at: [6, 11, -48], record: "Line 3 · MO-7713" },
  { code: "B-02", name: "R&D centre", at: [-30, 9.6, -38], record: "Recipe PX-7 · rev 12" },
  { code: "B-03", name: "Quality control lab", at: [34, 7.8, 28], record: "Assay B-2047 · out of spec", linked: true },
  { code: "B-04", name: "Warehouse", at: [-2, 8.8, 42], record: "RM-1832 · FG B-2047 on hold", linked: true },
  { code: "B-05", name: "Customer dispatch", at: [-46, 10.2, 34], record: "SO-5520 · awaiting release", linked: true },
  { code: "B-06", name: "Utilities & power", at: [48, 8.6, -6], record: "Steam 11 bar · 4.2 MW" },
  { code: "B-07", name: "Effluent treatment", at: [40, 7, -42], record: "Discharge pH 7.1" },
  { code: "T-01", name: "Supplier intake", at: [-44, 6.6, -4], record: "Lot RM-1832 · received", linked: true },
  { code: "C-01", name: "Cooling towers", at: [20.3, 11.6, -22], record: "CT-2 · WO-4471 open" },
  { code: "T-02", name: "Product storage", at: [-41, 9.4, 10.5], record: "B-2047 · 82% · on hold", linked: true },
  { code: "B-08", name: "Maintenance workshop", at: [-38, 8.2, -20], record: "R-204 seal · closed −18 h", linked: true },
  { code: "B-10", name: "Administration", at: [16, 7.6, 31], record: "ERP · plan week 39" },
  { code: "SUP", name: "Helion Chemicals", at: [-44, 0.2, -30], record: "Supplier · CoA 7781", linked: true, external: true },
  { code: "CUS", name: "Northline Polymers", at: [-64, 0.2, 58], record: "Customer · SO-5520", linked: true, external: true },
];

export type SiteFlow = { id: string; points: [number, number][]; linked?: boolean };

/** Ground-level relationships between buildings, routed along the yard. */
export const SITE_FLOWS: SiteFlow[] = [
  { id: "supply", linked: true, points: [[-44, -30], [-44, -8.3]] },
  { id: "intake", linked: true, points: [[-39.2, 0], [-16, 0]] },
  { id: "control", points: [[-18.9, -7], [-16, -7]] },
  { id: "storage", linked: true, points: [[-16, 9], [-30, 9], [-30, 10.5], [-33.4, 10.5]] },
  { id: "workshop", linked: true, points: [[-30, -20], [-22, -20], [-22, -15]] },
  { id: "recipe", points: [[-30, -32.5], [-30, -20], [-6, -20], [-6, -15]] },
  { id: "manufacturing", points: [[4, -15], [4, -41]] },
  { id: "cooling", points: [[20.3, -16], [20.3, -10], [15.2, -10]] },
  { id: "utilities", points: [[40, -5], [15.2, -5]] },
  { id: "effluent", points: [[15.2, -12.5], [28, -12.5], [28, -42], [33, -42]] },
  { id: "sample", linked: true, points: [[15.2, 9], [24.5, 9], [24.5, 26], [27, 26]] },
  { id: "product", linked: true, points: [[-1, 15.5], [-1, 36]] },
  { id: "planning", points: [[10, 29], [7, 29], [7, 15.5]] },
  { id: "pallets", linked: true, points: [[-12, 41], [-34, 41]] },
  { id: "dispatch", linked: true, points: [[-58, 34], [-64, 34], [-64, 58]] },
];

/** The Administration building label while the camera is on B-10. */
export function adminFocus(p: number) {
  const a = sectionStart("SECTION_14_ADMIN_BUILDING");
  const span = sectionEnd("SECTION_14_ADMIN_BUILDING") - a;
  return ramp(p, a + span * 0.3, a + span * 0.55) * (1 - ramp(p, sectionStart("SECTION_15_ADMIN_TWIN") + 0.012, sectionStart("SECTION_15_ADMIN_TWIN") + 0.03));
}

/** The QC lab label while the camera is on B-03. */
export function qcFocus(p: number) {
  const a = sectionStart("SECTION_16_QC_BUILDING");
  const span = sectionEnd("SECTION_16_QC_BUILDING") - a;
  return ramp(p, a + span * 0.3, a + span * 0.55) * (1 - ramp(p, sectionStart("SECTION_17_QC_TWIN") + 0.012, sectionStart("SECTION_17_QC_TWIN") + 0.03));
}

function qcTwin(u: number) {
  const a = sectionStart("SECTION_17_QC_TWIN");
  return a + (sectionEnd("SECTION_17_QC_TWIN") - a) * u;
}

/** The QC lab twin standing in the centre space: 0 absent, 1 fully built. */
export function labAmount(p: number) {
  const on = ramp(p, qcTwin(0.3), qcTwin(0.62));
  const off = ramp(p, qcTwin(0.9), sectionEnd("SECTION_17_QC_TWIN"));
  return on * (1 - off);
}

/** The ground route from the compound to B-03 lights while the camera travels along it. */
export function qcLink(p: number) {
  const a = sectionStart("SECTION_16_QC_BUILDING");
  const from = a + (sectionEnd("SECTION_16_QC_BUILDING") - a) * 0.72;
  return band(p, from, qcTwin(0.7), 0.02);
}

/** Something built on the plant's footprint: the plant stays down and the ontology stays hidden until the QC twin leaves. */
export function centreHold(p: number) {
  const on = ramp(p, adminTwin(0.3), adminTwin(0.62));
  const off = ramp(p, whTwin(0.9), sectionStart("SECTION_20_DIGITAL_TWIN") + (sectionEnd("SECTION_20_DIGITAL_TWIN") - sectionStart("SECTION_20_DIGITAL_TWIN")) * 0.3);
  return on * (1 - off);
}

/** The warehouse label while the camera is on B-04. */
export function warehouseFocus(p: number) {
  const a = sectionStart("SECTION_18_WAREHOUSE_BUILDING");
  const span = sectionEnd("SECTION_18_WAREHOUSE_BUILDING") - a;
  return ramp(p, a + span * 0.3, a + span * 0.55) * (1 - ramp(p, sectionStart("SECTION_19_WAREHOUSE_TWIN") + 0.012, sectionStart("SECTION_19_WAREHOUSE_TWIN") + 0.03));
}

function whTwin(u: number) {
  const a = sectionStart("SECTION_19_WAREHOUSE_TWIN");
  return a + (sectionEnd("SECTION_19_WAREHOUSE_TWIN") - a) * u;
}

/** The warehouse twin standing in the centre space: 0 absent, 1 fully built. */
export function whAmount(p: number) {
  const on = ramp(p, whTwin(0.3), whTwin(0.62));
  const off = ramp(p, whTwin(0.9), sectionEnd("SECTION_19_WAREHOUSE_TWIN"));
  return on * (1 - off);
}

/** The ground route from the compound to the warehouse lights while the camera travels along it. */
export function whLink(p: number) {
  const a = sectionStart("SECTION_18_WAREHOUSE_BUILDING");
  const from = a + (sectionEnd("SECTION_18_WAREHOUSE_BUILDING") - a) * 0.72;
  return band(p, from, whTwin(0.7), 0.02);
}

function adminTwin(u: number) {
  const a = sectionStart("SECTION_15_ADMIN_TWIN");
  return a + (sectionEnd("SECTION_15_ADMIN_TWIN") - a) * u;
}

/** The ground route from B-10 into the centre space lights while the camera travels along it. */
export function adminLink(p: number) {
  const a = sectionStart("SECTION_14_ADMIN_BUILDING");
  const from = a + (sectionEnd("SECTION_14_ADMIN_BUILDING") - a) * 0.72;
  return band(p, from, adminTwin(0.7), 0.02);
}

/** How far the chemical plant has sunk below the pad to clear the centre space: 0 standing, 1 gone. */
export function plantSink(p: number) {
  const plant = sectionStart("SECTION_03_PLANT");
  const span = sectionEnd("SECTION_03_PLANT") - plant;
  const rise = ramp(p, plant + span * 0.06, plant + span * 0.42);
  const down = ramp(p, adminTwin(0.08), adminTwin(0.4));
  const up = ramp(p, whTwin(0.9), sectionStart("SECTION_20_DIGITAL_TWIN") + (sectionEnd("SECTION_20_DIGITAL_TWIN") - sectionStart("SECTION_20_DIGITAL_TWIN")) * 0.3);
  return 1 - rise * (1 - down * (1 - up));
}

/** The manufacturing label while the camera is on B-01. */
export function mfgFocus(p: number) {
  const a = sectionStart("SECTION_02B_MANUFACTURING");
  const span = sectionEnd("SECTION_02B_MANUFACTURING") - a;
  return ramp(p, a + span * 0.3, a + span * 0.55) * (1 - ramp(p, sectionStart("SECTION_03_PLANT") + 0.012, sectionStart("SECTION_03_PLANT") + 0.03));
}

/** The ground route from the compound to B-01 lights while the camera travels along it. */
export function mfgLink(p: number) {
  const a = sectionStart("SECTION_02B_MANUFACTURING");
  const from = a + (sectionEnd("SECTION_02B_MANUFACTURING") - a) * 0.72;
  const plant = sectionStart("SECTION_03_PLANT");
  return band(p, from, plant + (sectionEnd("SECTION_03_PLANT") - plant) * 0.45, 0.02);
}

/** The administration twin standing in the centre space: 0 absent, 1 fully built. */
export function orgAmount(p: number) {
  const on = ramp(p, adminTwin(0.3), adminTwin(0.62));
  const off = ramp(p, adminTwin(0.9), sectionEnd("SECTION_15_ADMIN_TWIN"));
  return on * (1 - off);
}

/** 0 before the twin, 1 through the twin and the finale. */
export function twinAmount(p: number) {
  return ramp(p, sectionStart("SECTION_20_DIGITAL_TWIN"), along("SECTION_20_DIGITAL_TWIN", 0.4));
}

/** 1 once the closing frame takes over. Building records and the scope rail step aside. */
export function closingAmount(p: number) {
  return ramp(p, sectionStart("SECTION_21_FINAL"), sectionStart("SECTION_21_FINAL") + 0.01);
}

export type ScopeId = "enterprise" | "site" | "plant" | "unit" | "batch";

/** Zoom hierarchy for the same site: enterprise, site, plant, unit, batch. */
export function scopeAt(p: number): ScopeId {
  if (p < sectionStart("SECTION_02_FACTORY_INTERIOR")) return "enterprise";
  const mfg = sectionStart("SECTION_02B_MANUFACTURING");
  if (p < mfg + (sectionEnd("SECTION_02B_MANUFACTURING") - mfg) * 0.5) return "site";
  if (p < sectionStart("SECTION_06_INCIDENT")) return "plant";
  if (p < sectionStart("SECTION_08_CONNECTORS")) return "unit";
  if (p < sectionStart("SECTION_10_ONTOLOGY")) return "enterprise";
  if (p < sectionEnd("SECTION_13_ANSWER")) return "batch";
  const building = sectionStart("SECTION_14_ADMIN_BUILDING");
  if (p < building + (sectionEnd("SECTION_14_ADMIN_BUILDING") - building) * 0.4) return "site";
  if (p < sectionStart("SECTION_15_ADMIN_TWIN")) return "plant";
  if (p < sectionStart("SECTION_16_QC_BUILDING")) return "unit";
  const lab = sectionStart("SECTION_16_QC_BUILDING");
  if (p < lab + (sectionEnd("SECTION_16_QC_BUILDING") - lab) * 0.4) return "site";
  if (p < sectionStart("SECTION_17_QC_TWIN")) return "plant";
  if (p < sectionStart("SECTION_18_WAREHOUSE_BUILDING")) return "unit";
  const store = sectionStart("SECTION_18_WAREHOUSE_BUILDING");
  if (p < store + (sectionEnd("SECTION_18_WAREHOUSE_BUILDING") - store) * 0.4) return "site";
  if (p < sectionStart("SECTION_19_WAREHOUSE_TWIN")) return "plant";
  if (p < sectionStart("SECTION_20_DIGITAL_TWIN")) return "unit";
  return "enterprise";
}

/** Where the camera is looking: the story path, or the visitor's orbit target in explore mode. */
export function currentLook(p: number): Pt {
  return exploreState.on ? exploreState.look : sampleCamera(p).look;
}

export function stageName(p: number) {
  return sectionAt(p).label;
}

export function sampleCamera(p: number) {
  const keys = CAMERA;
  let i = 0;
  while (i < keys.length - 2 && p >= keys[i + 1].t) i += 1;
  const a = keys[i];
  const b = keys[i + 1];
  const u = smoothstep((p - a.t) / Math.max(0.0001, b.t - a.t));
  const pos: Pt = [
    a.pos[0] + (b.pos[0] - a.pos[0]) * u,
    a.pos[1] + (b.pos[1] - a.pos[1]) * u,
    a.pos[2] + (b.pos[2] - a.pos[2]) * u,
  ];
  const look: Pt = [
    a.look[0] + (b.look[0] - a.look[0]) * u,
    a.look[1] + (b.look[1] - a.look[1]) * u,
    a.look[2] + (b.look[2] - a.look[2]) * u,
  ];
  return { pos, look };
}

function driftAmount(p: number) {
  return ramp(p, sectionStart("SECTION_06_INCIDENT"), sectionEnd("SECTION_06_INCIDENT") - 0.006);
}

export function tempValue(p: number, time: number) {
  const noise = Math.sin(time * 0.75) * 0.07 + Math.sin(time * 1.6) * 0.03;
  return 78.4 + driftAmount(p) * 6.3 + noise;
}

export function pressureValue(p: number, time: number) {
  return 2.41 + driftAmount(p) * 0.47 + Math.sin(time * 0.6) * 0.015;
}

export function flowValue(p: number, time: number) {
  return 18.6 + driftAmount(p) * -2.5 + Math.sin(time * 0.9) * 0.08;
}

export function vibeValue(p: number, time: number) {
  return 1.8 + driftAmount(p) * 1.8 + Math.sin(time * 2.2) * 0.04;
}

export function assayValue(p: number, time: number) {
  const drop = ramp(p, sectionStart("SECTION_06_INCIDENT") + 0.012, sectionEnd("SECTION_06_INCIDENT")) * 1.8;
  return 99.2 - drop + Math.sin(time * 0.35) * 0.02;
}
