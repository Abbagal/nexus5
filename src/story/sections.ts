/** Section length is in the original 0–1 story space; the sheet below is normalised, so adding a chapter never rescales the others. */
const LAYOUT = [
  { id: "SECTION_01_FACTORY", label: "Factory", size: 0.068 },
  { id: "SECTION_02_FACTORY_INTERIOR", label: "Inside", size: 0.077 },
  { id: "SECTION_02B_MANUFACTURING", label: "Manufacturing", size: 0.07 },
  { id: "SECTION_03_PLANT", label: "Plant", size: 0.07 },
  { id: "SECTION_04_DATA", label: "Data", size: 0.08 },
  { id: "SECTION_05_FRAGMENTATION", label: "Systems", size: 0.08 },
  { id: "SECTION_06_INCIDENT", label: "Deviation", size: 0.075 },
  { id: "SECTION_07_INVESTIGATION", label: "Investigation", size: 0.145 },
  { id: "SECTION_08_CONNECTORS", label: "Connectors", size: 0.07 },
  { id: "SECTION_09_INTELLIGENCE", label: "Intelligence", size: 0.06 },
  { id: "SECTION_10_ONTOLOGY", label: "Ontology", size: 0.07 },
  { id: "SECTION_11_QUERY", label: "Query", size: 0.055 },
  { id: "SECTION_12_INVESTIGATION", label: "Trace", size: 0.06 },
  { id: "SECTION_13_ANSWER", label: "Evidence", size: 0.045 },
  { id: "SECTION_14_ADMIN_BUILDING", label: "Administration", size: 0.07 },
  { id: "SECTION_15_ADMIN_TWIN", label: "Admin twin", size: 0.09 },
  { id: "SECTION_16_QC_BUILDING", label: "Quality lab", size: 0.07 },
  { id: "SECTION_17_QC_TWIN", label: "Lab twin", size: 0.1 },
  { id: "SECTION_18_WAREHOUSE_BUILDING", label: "Warehouse", size: 0.07 },
  { id: "SECTION_19_WAREHOUSE_TWIN", label: "Warehouse twin", size: 0.1 },
  { id: "SECTION_20_DIGITAL_TWIN", label: "Digital twin", size: 0.09 },
  { id: "SECTION_21_FINAL", label: "Factory", size: 0.018 },
] as const;

const TOTAL = LAYOUT.reduce((sum, item) => sum + item.size, 0);

/** Scroll length in viewport heights: 24 screens for the original story, plus the added chapters. */
export const STORY_VH = Math.round(2400 * TOTAL);

export const SECTIONS = (() => {
  let at = 0;
  return LAYOUT.map((item) => {
    const start = at / TOTAL;
    at += item.size;
    return { id: item.id, label: item.label, start, end: Math.min(1, at / TOTAL) };
  });
})();

export type SectionId = (typeof LAYOUT)[number]["id"];

export function sectionById(id: SectionId) {
  const section = SECTIONS.find((item) => item.id === id);
  if (!section) throw new Error(id);
  return section;
}

export function sectionStart(id: SectionId) {
  return sectionById(id).start;
}

export function sectionEnd(id: SectionId) {
  return sectionById(id).end;
}

export function sectionAt(progress: number) {
  return SECTIONS.find((section) => progress >= section.start && progress < section.end) ?? SECTIONS[SECTIONS.length - 1];
}

function win(id: SectionId, from = 0.08, to = 0.9) {
  const section = sectionById(id);
  const span = section.end - section.start;
  return { from: section.start + span * from, to: section.start + span * to };
}

const investigate = sectionById("SECTION_07_INVESTIGATION");
const beat = (from: number, to: number) => ({
  from: investigate.start + (investigate.end - investigate.start) * from,
  to: investigate.start + (investigate.end - investigate.start) * to,
});

export type CaptionBeat = { sel: string; from: number; to: number; hold?: boolean; open?: boolean };

export const CAPTIONS: CaptionBeat[] = [
  { sel: ".cap-factory", ...win("SECTION_01_FACTORY", 0, 0.86), open: true },
  { sel: ".cap-inside", ...win("SECTION_02_FACTORY_INTERIOR", 0.12, 0.88) },
  { sel: ".cap-mfg", ...win("SECTION_02B_MANUFACTURING", 0.5, 0.94) },
  { sel: ".cap-plant", ...win("SECTION_03_PLANT", 0.5, 0.9) },
  { sel: ".cap-data", ...win("SECTION_04_DATA", 0.06, 0.46) },
  { sel: ".cap-data-place", ...win("SECTION_04_DATA", 0.52, 0.92) },
  { sel: ".cap-fragment", ...win("SECTION_05_FRAGMENTATION", 0.1, 0.9) },
  { sel: ".cap-drift", ...win("SECTION_06_INCIDENT", 0.06, 0.46) },
  { sel: ".cap-incident", ...win("SECTION_06_INCIDENT", 0.52, 0.94) },
  { sel: ".cap-why", ...beat(0.01, 0.1) },
  { sel: ".cap-ops", ...beat(0.11, 0.22) },
  { sel: ".cap-quality", ...beat(0.23, 0.34) },
  { sel: ".cap-maint", ...beat(0.35, 0.46) },
  { sel: ".cap-supply", ...beat(0.47, 0.58) },
  { sel: ".cap-eng", ...beat(0.59, 0.68) },
  { sel: ".cap-production", ...beat(0.69, 0.78) },
  { sel: ".cap-datateam", ...beat(0.79, 0.88) },
  { sel: ".cap-scattered", ...beat(0.89, 0.99) },
  { sel: ".cap-nexus", ...win("SECTION_08_CONNECTORS", 0.1, 0.9) },
  { sel: ".cap-intelligence", ...win("SECTION_09_INTELLIGENCE", 0.1, 0.9) },
  { sel: ".cap-ontology", ...win("SECTION_10_ONTOLOGY", 0.12, 0.9) },
  {
    sel: ".cap-query",
    from: sectionStart("SECTION_11_QUERY") + 0.004,
    to: sectionEnd("SECTION_12_INVESTIGATION") - 0.006,
  },
  { sel: ".cap-answer", ...win("SECTION_13_ANSWER", 0.08, 0.9) },
  { sel: ".cap-admin-site", ...win("SECTION_14_ADMIN_BUILDING", 0.5, 0.94) },
  { sel: ".cap-admin-twin", ...win("SECTION_15_ADMIN_TWIN", 0.42, 0.94) },
  { sel: ".cap-qc-site", ...win("SECTION_16_QC_BUILDING", 0.5, 0.94) },
  { sel: ".cap-qc-twin", ...win("SECTION_17_QC_TWIN", 0.42, 0.94) },
  { sel: ".cap-wh-site", ...win("SECTION_18_WAREHOUSE_BUILDING", 0.5, 0.94) },
  { sel: ".cap-wh-twin", ...win("SECTION_19_WAREHOUSE_TWIN", 0.42, 0.94) },
  { sel: ".cap-twin", ...win("SECTION_20_DIGITAL_TWIN", 0.14, 0.86) },
  { sel: ".cap-finale", from: sectionStart("SECTION_21_FINAL") + 0.004, to: 1, hold: true },
];
