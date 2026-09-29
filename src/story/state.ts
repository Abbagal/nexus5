export const storyState = {
  progress: 0,
};

/** Free-explore mode after the story: the camera is the visitor's, buildings can be selected. */
export const exploreState = {
  on: false,
  selected: null as string | null,
  /** Where the camera is looking, kept current so lighting and AO follow the visitor. */
  look: [0, 0, 0] as [number, number, number],
  /** A pending fly-to: destination for camera position and orbit target. */
  fly: null as null | { pos: [number, number, number]; target: [number, number, number]; started: number },
};

let version = 0;
const listeners = new Set<() => void>();

export function subscribeExplore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function exploreVersion() {
  return version;
}

export function emitExplore() {
  version += 1;
  listeners.forEach((listener) => listener());
}
