import { useSyncExternalStore } from "react";
import { INSPECT, buildingByCode, resetView, selectBuilding } from "../story/explore";
import { SITE_AREAS } from "../story/model";
import { exploreState, exploreVersion, subscribeExplore } from "../story/state";

const NAMES = new Map(SITE_AREAS.map((area) => [area.code, area]));

/** Inspector panel and controls hint for explore mode. */
export function ExploreUI({ onExit }: { onExit: () => void }) {
  useSyncExternalStore(subscribeExplore, exploreVersion);
  const code = exploreState.selected;
  const area = code ? NAMES.get(code) : undefined;
  const info = code ? INSPECT[code] : undefined;

  return (
    <div className="explore-ui">
      <div className="explore-bar">
        <span>Explore</span>
        <em>Drag to orbit · right-drag to pan · scroll to zoom · click a building</em>
        <button type="button" onClick={resetView}>
          Reset view
        </button>
        <button type="button" onClick={onExit}>
          Back to the story
        </button>
      </div>
      {area && info ? (
        <aside className="inspect" key={code}>
          <button type="button" className="inspect-close" aria-label="Close" onClick={() => selectBuilding(null)}>
            ×
          </button>
          <p className="kicker">{area.code}</p>
          <h3>{area.name}</h3>
          <p className={`pill is-${info.tone}`}>{info.status}</p>
          <dl>
            {info.metrics.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="inspect-note">{info.note}</p>
          <p className="kicker">Connected to</p>
          <div className="chips">
            {info.links.map((link) => {
              const linked = NAMES.get(link);
              if (!linked || !buildingByCode(link)) return null;
              return (
                <button type="button" key={link} onClick={() => selectBuilding(link)}>
                  <span>{link}</span>
                  {linked.name}
                </button>
              );
            })}
          </div>
        </aside>
      ) : (
        <p className="explore-empty">Select a building to see its live record and what it connects to.</p>
      )}
    </div>
  );
}
