import { useEffect, useState } from "react";
import { Experience } from "./scene/Experience";
import { Overlay } from "./ui/Overlay";
import { ExploreUI } from "./ui/Explore";
import { emitExplore, exploreState } from "./story/state";
import { STORY_VH } from "./story/sections";

export default function App() {
  const [explore, setExplore] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("explore-on", explore);
    document.documentElement.style.overflow = explore ? "hidden" : "";
    document.body.style.overflow = explore ? "hidden" : "";
    return () => {
      document.body.classList.remove("explore-on");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [explore]);

  const enter = () => {
    exploreState.on = true;
    exploreState.selected = null;
    exploreState.fly = null;
    setExplore(true);
    emitExplore();
  };

  const leave = () => {
    exploreState.on = false;
    exploreState.selected = null;
    exploreState.fly = null;
    document.body.style.cursor = "";
    setExplore(false);
    emitExplore();
  };

  return (
    <>
      <Experience explore={explore} />
      <Overlay onExplore={enter} />
      {explore ? <ExploreUI onExit={leave} /> : null}
      <div id="story" style={{ height: `${STORY_VH}vh` }} />
      <article className="sr">
        <h1>Nexus</h1>
        <p>A modern factory is a system of systems. Suppliers, research, manufacturing, maintenance, quality, and customers share one site. The plant is where the batch is made.</p>
        <p>Manufacturing is where the batch is made. Its digital twin, the chemical processing plant, stands in the centre of the site. Inside it, reactors, tanks, pipes, and instruments generate temperature, pressure, flow, vibration, level, batch, and quality data. Every part of the plant generates data, but it does not all live in the same place.</p>
        <p>ERP, MES, LIMS, DCS, the historian, CMMS, quality, engineering, documents, sensors, and databases each hold a fragment. The physical plant is one system. The information is not.</p>
        <p>On Reactor R-204, temperature drifts, pressure and vibration move with it, and Batch B-2047 is flagged for a quality deviation.</p>
        <p>Operations, quality, maintenance, supply chain, engineering, production, and data teams can each see a slice. The information exists. The context is scattered.</p>
        <p>Nexus connects what already exists. It does not replace those systems. A semantic layer relates the reactor to its sensors, process history, batches, raw-material lots, suppliers, quality results, maintenance, documents, and customers.</p>
        <p>Ask anything about the enterprise. Why did Batch B-2047 fail quality inspection?</p>
        <p>Potential contributing factors: raw-material lot RM-1832 was used in Batch B-2047; Reactor R-204 underwent maintenance 18 hours before production; process temperature deviated from the historical operating range; three previous batches exhibited similar process behaviour. These are correlated events and historical similarity, not a determined cause.</p>
        <p>Next door, the administration building runs the business around the plant. Its digital twin stands where the plant stood: a plant director, six departments, and the teams under them, each with its live record.</p>
        <p>The quality control lab is next. Its digital twin stands in the same space: samples arrive, are prepared, analysed on HPLC, GC and FTIR, reviewed, and released or held. Batch B-2047 assays at 97.4% and is held.</p>
        <p>The warehouse holds raw materials in racking and finished product in drums, with Batch B-2047 in quarantine. Its digital twin shows every pallet, drum and lot with its location and status.</p>
        <p>A digital twin is more than a 3D model. It is a connected model of the enterprise behind the plant.</p>
        <p>One factory. One context. Nexus connects suppliers, the site, the plant, the batch, and the customer into one queryable model.</p>
      </article>
    </>
  );
}
