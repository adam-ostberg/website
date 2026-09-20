/*
 * Shelved. The drone lowering a package into the gap in a stack; it used to play
 * beside the About heading, replaced there by RetryStation. Kept whole and still
 * type-checked so it can be dropped back into the STATIONS map in Stations.tsx
 * whenever it is wanted again. Nothing imports it, so it costs nothing in the
 * bundle — the build tree-shakes it out.
 */
import { useRef } from "react";
import * as THREE from "three";
import { Drone, bank, cableFor, type DroneState } from "./Drone";
import { Package, Part, PKG, box } from "./parts";
import { kf, between, blink, easeIn, hover, motion, PERIOD, type Key } from "./timeline";
import { FLOOR, ORDER, SPIN, type StationProps } from "./stage";
import { useFrame } from "@react-three/fiber";

/** The drone lowers the package into the empty slot on the stack. */
export function StackStation({ p, stage, time }: StationProps) {
  const drone = useRef<DroneState>({ x: 0, y: 1.9, tilt: 0, spin: SPIN, cable: 0.5, carrying: true, light: true, visible: true });
  const placed = useRef<THREE.Group>(null);

  const STACK_X = 0.6;
  const GAP = 0.56;
  const SLOT: [number, number, number] = [STACK_X, FLOOR + PKG / 2 + GAP, GAP]; // front-centre slot, layer 2
  const CRUISE_Y = 1.95;
  const CABLE_FLY = 0.5;

  useFrame(() => {
    const t = time.current;
    const st = stage.current;
    const d = drone.current;
    const path: Key[] = [[0, st.left - 1.5], [3.4, STACK_X], [7.6, STACK_X], [10.2, st.right + 1.5, easeIn]];
    d.x = kf(t, path);
    d.tilt = bank(t, path);
    d.y = CRUISE_Y + hover(t);
    // Measured from where the drone actually is, so the package sits still in the slot despite the bob.
    const down = cableFor(d.y, SLOT[1]);
    d.cable = kf(t, [[3.4, CABLE_FLY], [5.4, down], [6.1, down], [7.4, CABLE_FLY]]);
    d.carrying = t < 6.1;
    d.spin = SPIN + motion.boost * 30;
    d.light = between(t, 5.4, 6.1) ? blink(t, 4) : true;
    d.visible = t < 10.2;
    if (placed.current) {
      placed.current.visible = t >= 6.1;
      const o = kf(t, [[11, 1], [PERIOD, 0]]);
      p.ghost.opacity = o;
      p.ghostCore.opacity = o;
      p.ghostEdge.opacity = p.edge.opacity * o;
    }
  }, ORDER.station);

  const cells: [number, number, number][] = [];
  for (const layer of [0, 1]) {
    for (const ix of [-1, 0, 1]) {
      for (const iz of [-1, 0, 1]) {
        if (layer === 1 && ix === 0 && iz === 1) continue; // the slot the drone fills
        cells.push([STACK_X + ix * GAP, FLOOR + PKG / 2 + layer * GAP, iz * GAP]);
      }
    }
  }

  return (
    <group>
      <Part p={p} geo={box(2.0, 0.08, 2.0)} mat={p.dark} position={[STACK_X, FLOOR + 0.04, 0]} />
      {cells.map((c, i) => (
        <Package key={i} p={p} position={c} />
      ))}
      <Package ref={placed} p={p} position={SLOT} ghost />
      {/* The drone flies in line with the slot it fills. */}
      <group position={[0, 0, SLOT[2]]}>
        <Drone p={p} state={drone} />
      </group>
    </group>
  );
}
