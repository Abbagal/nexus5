import { useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, EdgesGeometry, LineBasicMaterial } from "three";
import { BUILDINGS, selectBuilding } from "../story/explore";
import { exploreState } from "../story/state";

const selectedMat = new LineBasicMaterial({ color: "#7a624c", transparent: true, opacity: 0.95 });
const hoverMat = new LineBasicMaterial({ color: "#3c444c", transparent: true, opacity: 0.55 });

/** Invisible click boxes over each building, with an outline for the hovered and selected ones. */
export function ExploreTargets() {
  const [hover, setHover] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const boxes = useMemo(
    () =>
      BUILDINGS.map((building) => {
        const geo = new BoxGeometry(...building.size);
        return { building, geo, edges: new EdgesGeometry(geo) };
      }),
    [],
  );

  useFrame(() => {
    if (exploreState.selected !== selected) setSelected(exploreState.selected);
  });

  return (
    <group>
      {boxes.map(({ building, geo, edges }) => (
        <group key={building.code} position={building.at}>
          <mesh
            geometry={geo}
            onClick={(event) => {
              event.stopPropagation();
              selectBuilding(building.code);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHover(building.code);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHover((current) => (current === building.code ? null : current));
              document.body.style.cursor = "";
            }}
          >
            <meshBasicMaterial visible={false} />
          </mesh>
          {selected === building.code ? (
            <lineSegments geometry={edges} material={selectedMat} />
          ) : hover === building.code ? (
            <lineSegments geometry={edges} material={hoverMat} />
          ) : null}
        </group>
      ))}
    </group>
  );
}
