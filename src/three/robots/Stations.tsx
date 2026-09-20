import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePalette } from "../palette";
import { Arm, mix, reach, type ArmState, type Joints } from "./Arm";
import { Rover, type RoverState } from "./Rover";
import { Drone, bank, cableFor, type DroneState } from "./Drone";
import { HeroLine } from "./HeroLine";
import { SparStation } from "./Spar";
import { RetryStation } from "./Retry";
import { Package, Part, box, cyl } from "./parts";
import { kf, between, blink, easeIn, easeOut, hover, motion, span, PERIOD, type Key } from "./timeline";
import {
  Belt,
  BELT_TOP,
  FLOOR,
  FROZEN_T,
  ORDER,
  PKG_ON_BELT,
  PKG_ON_ROVER,
  roll,
  SPIN,
  STAGE_H,
  type Stage,
  type StationProps,
} from "./stage";

export type StationKind = "hero" | "arm" | "pickup" | "relay" | "spar" | "retry";

/* ------------------------------------------------------------------ stations */

/* Arm station layout. Arm targets are the held package's centre, relative to the arm base on the floor. */
const ROVER_X = 1.4;
const PICK_X = -1.1;
const PICK_Y = PKG_ON_BELT - FLOOR;
const PLACE_Y = PKG_ON_ROVER - FLOOR;
const CARRY_Y = 1.3;
const REST = reach(-0.6, 1.75, 1);
const PICK_UP = reach(PICK_X, CARRY_Y, 1);
const PLACE_UP = reach(ROVER_X, CARRY_Y, -1);

/** Joint moves between waypoints; straight vertical moves for the pick and the place. */
function armPose(t: number): Joints {
  if (t < 3.0) return mix(REST, PICK_UP, span(t, 2.2, 3.0));
  if (t < 4.3) return reach(PICK_X, kf(t, [[3.0, CARRY_Y], [3.4, PICK_Y], [3.7, PICK_Y], [4.3, CARRY_Y]]), 1);
  if (t < 5.9) return mix(PICK_UP, PLACE_UP, span(t, 4.3, 5.9));
  if (t < 7.7) return reach(ROVER_X, kf(t, [[5.9, CARRY_Y], [6.6, PLACE_Y], [7.1, PLACE_Y], [7.7, CARRY_Y]]), -1);
  return mix(PLACE_UP, REST, span(t, 7.7, 9.2));
}

/** Blue: conveyor feeds a package, the arm lifts it onto the rover, the rover drives off right. */
function ArmStation({ p, stage, time }: StationProps) {
  const arm = useRef<ArmState>({ shoulder: REST[0], elbow: REST[1], grip: 0, holding: false });
  const rover = useRef<RoverState>({ x: ROVER_X, y: FLOOR, loaded: false, light: true, visible: true });
  const pkgConv = useRef<THREE.Group>(null);
  const rollers = useRef<(THREE.Group | null)[]>([]);
  const belt = useRef({ x: -2.05, angle: 0 });

  useFrame(() => {
    const t = time.current;
    const st = stage.current;

    // Package riding the belt; the rollers turn with it.
    const beltX = kf(t, [[0, -2.05], [2.2, PICK_X, easeOut]]);
    roll(belt.current, beltX, rollers.current);
    if (pkgConv.current) {
      pkgConv.current.visible = t < 3.55;
      pkgConv.current.position.set(beltX, PKG_ON_BELT, 0);
    }

    const a = arm.current;
    [a.shoulder, a.elbow] = armPose(t);
    a.grip = kf(t, [[3.4, 0], [3.7, 1], [6.8, 1], [7.1, 0]]);
    a.holding = between(t, 3.55, 6.85);

    // Rover: waits to be loaded, drives off right, reverses back into place.
    const r = rover.current;
    r.x = kf(t, [[0, ROVER_X], [7.8, ROVER_X], [10, st.right + 1.5, easeIn], [10.2, st.right + 1.5], [PERIOD, ROVER_X, easeOut]]);
    r.loaded = between(t, 6.85, 10.1);
    r.light = between(t, 6.8, 7.8) ? blink(t, 4) : true;
  }, ORDER.station);

  return (
    <group>
      {/* Conveyor: frame, rollers, hopper hiding the package spawn */}
      <Belt p={p} x={-1.45} length={1.7} rollers={[-2.0, -1.65, -1.3, -0.95]} rollerRefs={rollers} />
      <Part p={p} geo={box(0.75, 1.0, 0.8)} position={[-2.05, BELT_TOP + 0.45, 0]}>
        <Part p={p} geo={box(0.12, 0.08, 0.12)} mat={p.light} edge={false} position={[0.2, 0.42, 0.41]} />
      </Part>
      <Package ref={pkgConv} p={p} />
      <Arm p={p} state={arm} position={[0, FLOOR, 0]} />
      <Rover p={p} state={rover} />
    </group>
  );
}

/** Cream: the rover arrives from the left with a drone behind it, which hooks the package and lifts it away. */
function PickupStation({ p, stage, time }: StationProps) {
  const rover = useRef<RoverState>({ x: 0, y: FLOOR, loaded: true, light: true, visible: true });
  const drone = useRef<DroneState>({ x: -5, y: 1.6, tilt: 0, spin: SPIN, cable: 0, carrying: false, light: true, visible: true });

  const PAD_X = 0.5;
  const CRUISE_Y = 1.6;
  const HOVER_Y = 1.15;

  useFrame(() => {
    const t = time.current;
    const st = stage.current;

    const r = rover.current;
    r.x = kf(t, [[0, st.left - 1.5], [3.2, PAD_X], [7.9, PAD_X], [10.6, st.right + 1.5]]);
    r.visible = t < 10.6;
    r.loaded = t < 5.8;
    r.light = between(t, 3.2, 7.9) ? blink(t, 1.5) : true;

    const d = drone.current;
    // Follows the rover in from the left, settling into a hover as it brakes over the pad.
    const path: Key[] = [[0, st.left - 1.5], [0.6, st.left - 1.5], [3.8, PAD_X], [7.2, PAD_X], [9.4, st.right + 1.5, easeIn]];
    d.x = kf(t, path);
    d.tilt = bank(t, path);
    d.y = kf(t, [[0, CRUISE_Y], [2.4, CRUISE_Y], [3.8, HOVER_Y], [7.2, HOVER_Y], [9.4, CRUISE_Y]]) + hover(t);
    // Measured from where the drone actually is, so the bob never pushes the package into the rover.
    const down = cableFor(d.y, PKG_ON_ROVER);
    d.cable = kf(t, [[3.8, 0], [4.9, down], [5.8, down], [6.9, 0.45]]);
    d.carrying = t >= 5.8;
    d.spin = SPIN + motion.boost * 30;
    d.visible = t < 9.5;
  }, ORDER.station);

  return (
    <group>
      {/* Landing pad with corner markers */}
      <Part p={p} geo={box(1.4, 0.06, 1.0)} mat={p.dark} position={[PAD_X, FLOOR + 0.03, 0]} />
      {[-0.6, 0.6].map((ox) => (
        <Part key={ox} p={p} geo={box(0.14, 0.02, 0.14)} mat={p.light} edge={false} position={[PAD_X + ox, FLOOR + 0.07, 0.42]} />
      ))}
      <Rover p={p} state={rover} />
      <Drone p={p} state={drone} />
    </group>
  );
}

/** Sage: the drone lowers its package onto a belt that feeds a machine, then collects the stamped box on the far side. */
function RelayStation({ p, stage, time }: StationProps) {
  const drone = useRef<DroneState>({ x: -5, y: 1.95, tilt: 0, spin: SPIN, cable: 0.5, carrying: true, labeled: false, light: true, visible: true });
  const raw = useRef<THREE.Group>(null);
  const stamped = useRef<THREE.Group>(null);
  const ram = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.Group>(null);
  const rollers = useRef<(THREE.Group | null)[]>([]);
  const belt = useRef({ x: 0, angle: 0 });

  const IN_X = -1.5;
  const MACHINE_X = 0;
  const OUT_X = 1.5;
  const MACHINE_H = 0.95;
  const MACHINE_TOP = BELT_TOP - 0.1 + MACHINE_H;
  const CRUISE_Y = 1.95;
  const HOVER_Y = 1.1;
  const CABLE_FLY = 0.5;

  useFrame(() => {
    const t = time.current;
    const st = stage.current;

    // Drone: flies in, winches the package onto the belt, hops over the machine, winches the stamped box up, leaves.
    const d = drone.current;
    const path: Key[] = [[0, st.left - 1.5], [2.8, IN_X], [4.8, IN_X], [6.4, OUT_X], [9.8, OUT_X], [11.8, st.right + 1.5, easeIn]];
    d.x = kf(t, path);
    d.tilt = bank(t, path);
    d.y = kf(t, [[0, CRUISE_Y], [1.2, CRUISE_Y], [2.8, HOVER_Y], [9.8, HOVER_Y], [11.8, CRUISE_Y]]) + hover(t);
    // Measured from where the drone actually is, so the bob never pushes the package into the belt.
    const down = cableFor(d.y, PKG_ON_BELT);
    d.cable = kf(t, [
      [2.8, CABLE_FLY], [3.6, down], [3.9, down], [4.6, CABLE_FLY],
      [7.8, CABLE_FLY], [8.6, down], [8.9, down], [9.7, CABLE_FLY],
    ]);
    d.carrying = t < 3.9 || t >= 8.9;
    d.labeled = t >= 8.9;
    d.light = between(t, 3.6, 3.9) || between(t, 8.6, 8.9) ? blink(t, 4) : true;
    d.spin = SPIN + motion.boost * 30;
    d.visible = t < 11.8;

    // Belt: feeds the package into the machine, which works on it and then spits it out the far side.
    const x = kf(t, [[0, IN_X], [4.4, IN_X], [5.4, MACHINE_X], [6.8, MACHINE_X], [7.5, OUT_X, easeOut]]);
    roll(belt.current, x, rollers.current);
    if (raw.current) {
      raw.current.visible = between(t, 3.9, 6.1);
      raw.current.position.set(x, PKG_ON_BELT, 0);
    }
    if (stamped.current) {
      stamped.current.visible = between(t, 6.1, 8.9);
      stamped.current.position.set(x, PKG_ON_BELT, 0);
    }
    if (lamp.current) lamp.current.visible = between(t, 5.4, 6.8) ? blink(t, 4) : false;
    // Two slams of the press while the package is inside.
    if (ram.current) ram.current.position.y = -kf(t, [[5.6, 0], [5.8, 0.12, easeIn], [6.1, 0], [6.3, 0.12, easeIn], [6.6, 0]]);
  }, ORDER.station);

  return (
    <group>
      <Belt p={p} x={0} length={4.2} rollers={[-1.95, -1.55, -1.15, -0.75, 0.75, 1.15, 1.55, 1.95]} rollerRefs={rollers} />
      {/* Machine: the belt runs through it; the package passes in and out through the dark mouths */}
      <Part p={p} geo={box(1.1, MACHINE_H, 0.9)} position={[MACHINE_X, MACHINE_TOP - MACHINE_H / 2, 0]} />
      {[-1, 1].map((side) => (
        <Part key={side} p={p} geo={box(0.03, 0.62, 0.62)} mat={p.dark} position={[MACHINE_X + side * 0.56, BELT_TOP + 0.31, 0]} />
      ))}
      <Part p={p} geo={box(0.6, 0.08, 0.02)} mat={p.dark} position={[MACHINE_X - 0.1, MACHINE_TOP - 0.2, 0.46]} />
      <Part ref={lamp} p={p} geo={box(0.12, 0.08, 0.04)} mat={p.light} edge={false} position={[MACHINE_X + 0.36, MACHINE_TOP - 0.2, 0.46]} />
      {/* Press on top: posts, crossbar and the ram that slams down */}
      {[-1, 1].map((side) => (
        <Part key={side} p={p} geo={box(0.06, 0.5, 0.06)} mat={p.dark} position={[MACHINE_X + side * 0.26, MACHINE_TOP + 0.25, 0]} />
      ))}
      <Part p={p} geo={box(0.64, 0.08, 0.2)} position={[MACHINE_X, MACHINE_TOP + 0.5, 0]} />
      <group ref={ram}>
        <Part p={p} geo={cyl(0.04, 0.34, 8)} mat={p.dark} position={[MACHINE_X, MACHINE_TOP + 0.43, 0]} />
        <Part p={p} geo={box(0.34, 0.12, 0.3)} position={[MACHINE_X, MACHINE_TOP + 0.2, 0]} />
      </group>
      <Package ref={raw} p={p} />
      <Package ref={stamped} p={p} label />
      <Drone p={p} state={drone} />
    </group>
  );
}

const STATIONS: Record<StationKind, (p: StationProps) => React.JSX.Element> = {
  hero: HeroLine,
  arm: ArmStation,
  pickup: PickupStation,
  relay: RelayStation,
  spar: SparStation,
  retry: RetryStation,
};

/* ------------------------------------------------------------------ anchoring */

/** A station plays while its anchor's centre is within this many viewport heights of the screen. */
const NEAR = 0.6;
const isNear = (r: DOMRect, viewH: number) => {
  const cy = r.top + r.height / 2;
  return r.height > 0 && cy > -viewH * NEAR && cy < viewH * (1 + NEAR);
};

/** Whether any station is close enough to the screen to be playing. */
export const stationsNearby = () =>
  Array.from(document.querySelectorAll<HTMLElement>("[data-shape]")).some((el) => isNear(el.getBoundingClientRect(), window.innerHeight));

/**
 * Finds every `[data-shape]` element and plays a station on it. The station is
 * scaled so the anchor is STAGE_H units tall; robots may leave through the viewport edges.
 */
export function Stations({ frozen, detail }: { frozen: boolean; detail: boolean }) {
  const [anchors, setAnchors] = useState<HTMLElement[]>([]);
  useEffect(() => {
    const collect = () => setAnchors(Array.from(document.querySelectorAll<HTMLElement>("[data-shape]")));
    collect();
    const id = requestAnimationFrame(collect);
    return () => cancelAnimationFrame(id);
  }, []);

  // Scroll speed → shared boost for wheels, rotors and belts.
  const scroll = useRef({ y: 0, v: 0 });
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const y = window.scrollY;
    const v = Math.abs(y - scroll.current.y) / Math.max(d, 1e-3);
    scroll.current.y = y;
    scroll.current.v += (v - scroll.current.v) * (1 - Math.exp(-8 * d));
    motion.boost = frozen ? 0 : Math.min(scroll.current.v / 1200, 2.5);
  }, ORDER.boost);

  return (
    <>
      {anchors.map((el, i) => (
        <AnchoredStation key={i} el={el} index={i} frozen={frozen} detail={detail} />
      ))}
    </>
  );
}

function AnchoredStation({ el, index, frozen, detail }: { el: HTMLElement; index: number; frozen: boolean; detail: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();
  const kind = (el.dataset.shape as StationKind) in STATIONS ? (el.dataset.shape as StationKind) : "arm";
  const palette = usePalette(
    el.dataset.ink || "#1e1e1e",
    el.dataset.accent || "#d45bb6",
    el.dataset.solid,
    el.dataset.dark
  );
  const stage = useRef<Stage>({ w: 4, left: -3, right: 3, top: 2, bottom: -2, floor: FLOOR });
  const time = useRef(FROZEN_T);
  const started = useRef<number | null>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const visible = isNear(r, size.height);
    g.visible = visible;
    if (!visible) {
      started.current = null;
      return;
    }
    const unitsPerPx = viewport.height / size.height;
    const ppu = r.height / STAGE_H; // px per station unit
    g.position.set((cx / size.width - 0.5) * viewport.width, (0.5 - cy / size.height) * viewport.height, 0);
    g.scale.setScalar(ppu * unitsPerPx);
    const st = stage.current;
    st.w = r.width / ppu;
    st.left = -cx / ppu;
    st.right = (size.width - cx) / ppu;
    st.top = cy / ppu;
    st.bottom = -(size.height - cy) / ppu;
    // Each station restarts its loop when it scrolls into view, offset so neighbours aren't in sync.
    if (frozen) {
      time.current = FROZEN_T;
    } else {
      if (started.current === null) started.current = state.clock.elapsedTime - index * 2.3;
      time.current = (state.clock.elapsedTime - started.current) % PERIOD;
    }
  }, ORDER.clock);

  const Station = STATIONS[kind];
  return (
    <group ref={group} visible={false}>
      <Station p={palette} stage={stage} time={time} detail={detail} />
    </group>
  );
}
