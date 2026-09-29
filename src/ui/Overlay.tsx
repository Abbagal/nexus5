import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QUERY, TRACE_LINE, clamp, closingAmount, focusSet, scopeAt, stageName } from "../story/model";
import { CAPTIONS, sectionEnd, sectionStart } from "../story/sections";
import { storyState } from "../story/state";

gsap.registerPlugin(ScrollTrigger);

function fade(tl: gsap.core.Timeline, selector: string, enter: number, exit: number, hold = false) {
  const span = Math.max(0.004, exit - enter);
  const dur = Math.min(0.012, span * 0.28);
  tl.fromTo(selector, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: dur, ease: "none" }, enter);
  if (!hold) tl.to(selector, { autoAlpha: 0, y: -8, duration: dur * 0.85, ease: "none" }, Math.max(enter + dur, exit));
}

export function Overlay({ onExplore }: { onExplore: () => void }) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const queryText = el.querySelector<HTMLElement>(".query-text");
    const query = el.querySelector<HTMLElement>(".query");
    const trace = el.querySelector<HTMLElement>(".trace-rel");
    const stage = el.querySelector<HTMLElement>(".stage-name");
    const zoom = el.querySelector<HTMLElement>(".zoom");
    const queryStart = sectionStart("SECTION_11_QUERY");
    const querySpan = (sectionEnd("SECTION_11_QUERY") - queryStart) * 0.62;

    const story = document.querySelector("#story");
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: story,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.45,
          onUpdate: (self) => {
            const p = self.progress;
            storyState.progress = p;
            if (stage) stage.textContent = stageName(p);
            if (zoom) {
              const scope = scopeAt(p);
              zoom.querySelectorAll<HTMLElement>("[data-scope]").forEach((item) => {
                item.dataset.on = item.dataset.scope === scope ? "1" : "0";
              });
              zoom.style.opacity = String(1 - closingAmount(p));
            }
            if (queryText && query) {
              const typed = clamp((p - queryStart) / querySpan);
              queryText.textContent = QUERY.slice(0, Math.round(typed * QUERY.length));
              query.classList.toggle("is-done", typed >= 0.999);
            }
            if (trace) {
              const focus = focusSet(p);
              const id = focus && focus.size === 1 ? [...focus][0] : "";
              trace.textContent = id ? (TRACE_LINE[id] ?? "") : "";
            }
          },
        },
      });

      tl.fromTo(".bar > i", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      tl.to(".hint", { autoAlpha: 0, duration: 0.012 }, 0.03);

      tl.fromTo(
        ".explore-cta",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.01, ease: "none" },
        sectionStart("SECTION_21_FINAL") + 0.008,
      );

      for (const caption of CAPTIONS) {
        if (caption.hold) {
          tl.fromTo(
            caption.sel,
            { autoAlpha: 0, y: 18 },
            { autoAlpha: 1, y: 0, duration: 0.012, ease: "none" },
            caption.from,
          );
        } else if (caption.open) {
          tl.set(caption.sel, { autoAlpha: 1, y: 0 }, 0);
          tl.to(caption.sel, { autoAlpha: 0, y: -8, duration: 0.008, ease: "none" }, caption.to);
        } else {
          fade(tl, caption.sel, caption.from, caption.to);
        }
      }
    }, el);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return (
    <header className="hud" ref={root}>
      <div className="bar" aria-hidden="true">
        <i />
      </div>
      <div className="top">
        <span className="mark">Nexus</span>
        <span className="stage-name">Factory</span>
      </div>
      <p className="zoom" aria-label="Scope">
        <span data-scope="enterprise" data-on="1">Enterprise</span>
        <i aria-hidden="true">/</i>
        <span data-scope="site" data-on="0">Site</span>
        <i aria-hidden="true">/</i>
        <span data-scope="plant" data-on="0">Plant</span>
        <i aria-hidden="true">/</i>
        <span data-scope="unit" data-on="0">Unit</span>
        <i aria-hidden="true">/</i>
        <span data-scope="batch" data-on="0">Batch</span>
      </p>

      <p className="hint">
        <span />
        Scroll
      </p>

      <section className="cap cap-factory">
        <p className="kicker">Enterprise</p>
        <h1>A modern factory is a system of systems.</h1>
        <p>Suppliers, research, manufacturing, maintenance, quality, and customers share one site. The plant is where the batch is made.</p>
      </section>

      <section className="cap cap-inside">
        <p className="kicker">Inside the factory</p>
        <h2>One site. Many plants.</h2>
        <p>Supplier intake, research, manufacturing, maintenance, quality, warehouse, customer dispatch, utilities, and waste treatment share the same ground.</p>
      </section>

      <section className="cap cap-mfg">
        <p className="kicker">Manufacturing · B-01</p>
        <h2>Where the batch is made.</h2>
        <p>Chemical processing runs inside manufacturing. Its digital twin stands in the centre of the site.</p>
      </section>

      <section className="cap cap-plant">
        <p className="kicker">Manufacturing · Chemical processing · Unit 204</p>
        <h2>The plant is a network of equipment.</h2>
        <p>Reactors, tanks, exchangers, pumps, and instruments. Batch B-2047 is on Reactor R-204.</p>
      </section>

      <section className="cap cap-data">
        <p className="kicker">Data</p>
        <h2>Every part of the plant generates data.</h2>
      </section>

      <section className="cap cap-data-place">
        <h2>But it doesn't all live in the same place.</h2>
        <p>Sensors, the laboratory, production, maintenance, ERP, and engineering each keep their own record.</p>
      </section>

      <section className="cap cap-fragment">
        <p className="kicker">Systems</p>
        <h2>The physical plant is one system.</h2>
        <p>ERP, MES, LIMS, DCS, the historian, CMMS, quality, engineering, documents, sensors, and databases each hold a different piece of it.</p>
      </section>

      <section className="cap cap-drift">
        <p className="kicker">Reactor R-204</p>
        <h2>Temperature begins to drift.</h2>
        <p>Pressure moves with it. Vibration rises. The batch is still in the vessel.</p>
      </section>

      <section className="cap cap-incident">
        <p className="kicker">Quality</p>
        <h2>Batch B-2047 — quality deviation detected</h2>
      </section>

      <section className="cap cap-why center-copy">
        <h2>Why?</h2>
      </section>

      <section className="cap cap-ops">
        <p className="kicker">Operations</p>
        <h2>Process conditions.</h2>
        <p>DCS and the historian. Temperature, pressure, flow, and vibration on R-204. A slice of the event.</p>
      </section>

      <section className="cap cap-quality">
        <p className="kicker">Quality</p>
        <h2>The laboratory result.</h2>
        <p>The assay sits outside specification. The batch record is somewhere else.</p>
      </section>

      <section className="cap cap-maint">
        <p className="kicker">Maintenance</p>
        <h2>Equipment history.</h2>
        <p>Reactor R-204 was maintained 18 hours before production. The work order does not sit next to the batch.</p>
      </section>

      <section className="cap cap-supply">
        <p className="kicker">Supply chain</p>
        <h2>The material record.</h2>
        <p>Lot RM-1832, from Helion Chemicals. The certificate of analysis is in another system.</p>
      </section>

      <section className="cap cap-eng">
        <p className="kicker">Engineering</p>
        <h2>The technical record.</h2>
        <p>The datasheet, the P&amp;ID, and the operating range. Clear on their own. Not attached to this batch.</p>
      </section>

      <section className="cap cap-production">
        <p className="kicker">Production</p>
        <h2>The batch history.</h2>
        <p>MES holds the step, the status, and the charge. It does not hold the laboratory, the seal, or the supplier.</p>
      </section>

      <section className="cap cap-datateam">
        <p className="kicker">Data</p>
        <h2>Another database.</h2>
        <p>The archive has the trend. It does not know which lot, which customer, or which document belongs to it.</p>
      </section>

      <section className="cap cap-scattered center-copy">
        <h2>The information exists.</h2>
        <h2>The context is scattered.</h2>
      </section>

      <section className="cap cap-nexus">
        <p className="kicker">Connectors</p>
        <h2>Connect what already exists.</h2>
        <p>APIs, SQL, industrial systems, ERP, MES, LIMS, historians, documents, and sensor streams feed Nexus. Nothing is replaced.</p>
      </section>

      <section className="cap cap-intelligence">
        <p className="kicker">Intelligence</p>
        <h2>The same object, every record that belongs to it.</h2>
        <p>A reactor now reaches its sensors, its history, its batches, its materials, its maintenance, and its customers.</p>
      </section>

      <section className="cap cap-ontology">
        <p className="kicker">Ontology</p>
        <h2>Nexus doesn't just connect data.</h2>
        <p>It understands the relationships between things.</p>
      </section>

      <section className="cap cap-query query">
        <p className="kicker">Ask anything about the enterprise</p>
        <p className="query-line">
          <span className="query-text" />
        </p>
        <p className="trace-rel" />
      </section>

      <section className="cap cap-answer answer">
        <p className="kicker">Relevant evidence</p>
        <h2>Potential contributing factors</h2>
        <ol>
          <li>
            <span>Material</span>
            Raw-material lot RM-1832 was used in Batch B-2047.
          </li>
          <li>
            <span>Maintenance</span>
            Reactor R-204 underwent maintenance 18 hours before production.
          </li>
          <li>
            <span>Process</span>
            Process temperature deviated from the historical operating range.
          </li>
          <li>
            <span>History</span>
            Three previous batches exhibited similar process behaviour.
          </li>
        </ol>
        <p className="caveat">Correlated events and historical similarity. Not a determined cause.</p>
      </section>

      <section className="cap cap-admin-site">
        <p className="kicker">Administration · B-10</p>
        <h2>The plant is one building on the site.</h2>
        <p>Next door, finance, people, procurement, planning, IT, and compliance run the business around it.</p>
      </section>

      <section className="cap cap-admin-twin">
        <p className="kicker">Administration · Digital twin</p>
        <h2>The same model, for the people who run the plant.</h2>
        <p>A plant director, six departments, and the teams under them. Procurement reaches the lot. Planning reaches the batch.</p>
      </section>

      <section className="cap cap-qc-site">
        <p className="kicker">Quality control lab · B-03</p>
        <h2>Nothing ships until it is tested.</h2>
        <p>Samples leave the plant and arrive here. The lab decides whether a batch is released or held.</p>
      </section>

      <section className="cap cap-qc-twin">
        <p className="kicker">Quality control lab · Digital twin</p>
        <h2>From sample to release.</h2>
        <p>Receive, prepare, analyse, review. Batch B-2047 assays at 97.4% against a 99.0–100.5 specification, so the lab holds it.</p>
      </section>

      <section className="cap cap-wh-site">
        <p className="kicker">Warehouse · B-04</p>
        <h2>Where everything waits.</h2>
        <p>Raw materials arrive here before the plant. Finished product returns here before the customer.</p>
      </section>

      <section className="cap cap-wh-twin">
        <p className="kicker">Warehouse · Digital twin</p>
        <h2>Every pallet, drum and lot, located.</h2>
        <p>Raw materials in racking, finished product in drums, Batch B-2047 in quarantine. Stock, location and status in one model.</p>
      </section>

      <section className="cap cap-twin center-copy">
        <h2>A digital twin is more than a 3D model.</h2>
        <h2>It is a connected model of the enterprise behind the plant.</h2>
        <p>Every building on the site carries its live record and its links to the rest, from the supplier to the customer.</p>
      </section>

      <section className="cap cap-finale finale">
        <h2>One factory. One context.</h2>
        <p>Nexus connects suppliers, the site, the plant, the batch, and the customer into one queryable model.</p>
      </section>
      <button type="button" className="explore-cta" onClick={onExplore}>
        Explore the site <span aria-hidden="true">→</span>
      </button>
    </header>
  );
}
