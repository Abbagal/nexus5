import type { Pt } from "./model";
import { emitExplore, exploreState } from "./state";

export type Building = {
  code: string;
  /** Footprint centre, then width (x), height, depth (z). */
  at: Pt;
  size: Pt;
};

/** Clickable footprints in explore mode. */
export const BUILDINGS: Building[] = [
  { code: "U-200", at: [-0.4, 6, 0.2], size: [31, 12, 30] },
  { code: "B-01", at: [6, 5, -48], size: [30, 10, 14] },
  { code: "B-02", at: [-30, 4.2, -38], size: [18, 8.4, 12] },
  { code: "B-03", at: [34, 3.6, 28], size: [14, 7.2, 11] },
  { code: "B-04", at: [-2, 4.2, 42], size: [20, 8.4, 12] },
  { code: "B-05", at: [-46, 5, 34], size: [24, 10, 16] },
  { code: "B-06", at: [48, 4.2, -6], size: [16, 8.4, 18] },
  { code: "B-07", at: [40, 3.4, -42], size: [14, 6.8, 12] },
  { code: "B-08", at: [-38, 3.8, -20], size: [16, 7.6, 10] },
  { code: "B-10", at: [16, 3.6, 31], size: [12, 7.2, 8] },
  { code: "B-12", at: [-21.5, 2.4, -7], size: [5.6, 4.8, 8.2] },
  { code: "C-01", at: [20.3, 6, -22], size: [9, 12, 8.5] },
  { code: "T-01", at: [-44, 2.6, -4], size: [10, 5.2, 9] },
  { code: "T-02", at: [-41, 4.2, 10.5], size: [15, 8.4, 10.4] },
];

export type Inspect = {
  status: string;
  /** "ok" green-free: neutral, "warn" warm, for the pill. */
  tone: "ok" | "warn";
  metrics: [string, string][];
  links: string[];
  note: string;
};

export const INSPECT: Record<string, Inspect> = {
  "U-200": {
    status: "Batch B-2047 · deviation",
    tone: "warn",
    metrics: [
      ["Reactor R-204", "84.7 °C"],
      ["Pressure PT-204", "2.88 bar"],
      ["Vibration VT-204", "3.6 mm/s"],
      ["Tags live", "1,240"],
    ],
    links: ["B-12", "B-03", "T-02", "B-08"],
    note: "Chemical processing. The reactor drifted outside its 74–81 °C range.",
  },
  "B-01": {
    status: "Line 3 · running",
    tone: "ok",
    metrics: [
      ["Order", "MO-7713"],
      ["OEE", "84%"],
      ["Batches today", "6"],
      ["Operators on shift", "22"],
    ],
    links: ["U-200", "B-04", "C-01", "B-06"],
    note: "Manufacturing. Chemical processing is its digital twin.",
  },
  "B-02": {
    status: "Trial PX-7 · in progress",
    tone: "ok",
    metrics: [
      ["Recipe", "PX-7 rev 12"],
      ["Trials this week", "4"],
      ["Pilot reactor", "R-P1 · idle"],
      ["Open change requests", "2"],
    ],
    links: ["B-01", "B-03"],
    note: "R&D centre. Recipes are released to manufacturing from here.",
  },
  "B-03": {
    status: "Assay B-2047 · out of spec",
    tone: "warn",
    metrics: [
      ["Assay S-7721", "97.4%"],
      ["Specification", "99.0–100.5%"],
      ["Samples in queue", "14"],
      ["Turnaround", "5.2 h"],
    ],
    links: ["U-200", "B-04", "B-10", "B-06"],
    note: "Quality control lab. Sample to result to release or hold.",
  },
  "B-04": {
    status: "Quarantine · 48 drums held",
    tone: "warn",
    metrics: [
      ["Raw materials", "78% full"],
      ["Finished goods", "64% full"],
      ["Quarantine", "B-2047 · 48 drums"],
      ["Inbound today", "6 trucks"],
    ],
    links: ["B-03", "T-01", "B-05", "B-06"],
    note: "Warehouse. Raw materials in, finished product out.",
  },
  "B-05": {
    status: "SO-5520 · awaiting release",
    tone: "warn",
    metrics: [
      ["Customer", "Northline Polymers"],
      ["Order", "SO-5520"],
      ["Trucks today", "3"],
      ["Pallets staged", "36"],
    ],
    links: ["B-04", "T-02"],
    note: "Customer dispatch. Nothing leaves until the batch is released.",
  },
  "B-06": {
    status: "Steam 11 bar · normal",
    tone: "ok",
    metrics: [
      ["Steam", "11 bar"],
      ["Power", "4.2 MW"],
      ["Boiler load", "68%"],
      ["Compressed air", "7.1 bar"],
    ],
    links: ["C-01", "U-200", "B-01", "B-03", "B-04", "B-10"],
    note: "Utilities and power for the whole site.",
  },
  "B-07": {
    status: "Discharge in limits",
    tone: "ok",
    metrics: [
      ["Discharge pH", "7.1"],
      ["Flow", "42 m³/h"],
      ["COD", "118 mg/L"],
      ["Permit headroom", "22%"],
    ],
    links: ["U-200"],
    note: "Effluent treatment. Everything the plant discharges passes here.",
  },
  "B-08": {
    status: "R-204 seal · closed −18 h",
    tone: "warn",
    metrics: [
      ["Last work order", "R-204 seal"],
      ["Closed", "18 h before production"],
      ["Open work orders", "7"],
      ["Planned this week", "12"],
    ],
    links: ["U-200", "C-01"],
    note: "Maintenance workshop. Equipment history lives here.",
  },
  "B-10": {
    status: "Plan week 39",
    tone: "ok",
    metrics: [
      ["Headcount", "318"],
      ["Open purchase orders", "42"],
      ["Budget used", "94%"],
      ["Departments", "6"],
    ],
    links: ["B-04", "B-03", "B-05", "B-06"],
    note: "Administration. Finance, people, procurement, planning, IT, compliance.",
  },
  "B-12": {
    status: "2 alarms · acknowledged",
    tone: "ok",
    metrics: [
      ["DCS tags", "1,240 live"],
      ["Active alarms", "2"],
      ["Operators", "4"],
      ["Mode", "Auto"],
    ],
    links: ["U-200"],
    note: "Control room. Where the plant is watched.",
  },
  "C-01": {
    status: "CT-2 · work order open",
    tone: "warn",
    metrics: [
      ["Work order", "WO-4471"],
      ["Approach", "4.1 °C"],
      ["Basin level", "92%"],
      ["Fans running", "3 of 4"],
    ],
    links: ["B-06", "B-08"],
    note: "Cooling towers.",
  },
  "T-01": {
    status: "Lot RM-1832 · received",
    tone: "ok",
    metrics: [
      ["Supplier", "Helion Chemicals"],
      ["Certificate", "CoA 7781"],
      ["Tank T-101", "72%"],
      ["Next delivery", "Thu 06:00"],
    ],
    links: ["B-04", "U-200"],
    note: "Supplier intake tanks.",
  },
  "T-02": {
    status: "B-2047 · 82% · on hold",
    tone: "warn",
    metrics: [
      ["Product", "B-2047"],
      ["Fill", "82%"],
      ["Status", "Hold · DEV-2047"],
      ["Tanks", "3 of 3 in service"],
    ],
    links: ["B-03", "B-05", "U-200"],
    note: "Product storage. Finished product waits here for release.",
  },
};

const byCode = new Map(BUILDINGS.map((building) => [building.code, building]));

export function buildingByCode(code: string) {
  return byCode.get(code);
}

/** Back to the whole-site view. */
export function resetView() {
  exploreState.selected = null;
  exploreState.fly = { pos: [64, 54, 96], target: [-8, 1, -12], started: performance.now() };
  emitExplore();
}

/** Selects a building and asks the camera to fly to it. */
export function selectBuilding(code: string | null) {
  exploreState.selected = code;
  const building = code ? byCode.get(code) : undefined;
  if (building) {
    const reach = Math.max(building.size[0], building.size[2]) * 1.15 + 16;
    const target: Pt = [building.at[0], building.at[1] * 0.8, building.at[2]];
    exploreState.fly = {
      target,
      pos: [target[0] + reach * 0.5, target[1] + reach * 0.5, target[2] + reach * 0.85],
      started: performance.now(),
    };
  }
  emitExplore();
}
