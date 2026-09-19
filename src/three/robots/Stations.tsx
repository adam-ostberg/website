import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePalette, type Palette } from "../palette";
import { Arm, mix, reach, type ArmState, type Joints } from "./Arm";
import { Rover, ROVER_PAD_TOP, type RoverState } from "./Rover";
import { Drone, bank, cableFor, droneYFor, type DroneState } from "./Drone";
import { Package, Part, PKG, box, cyl } from "./parts";
import { kf, between, blink, easeIn, easeOut, hover, motion, span, PERIOD, type Key } from "./timeline";

export type StationKind = "arm" | "pickup" | "relay" | "stack";

/**
 * The stage a station plays on, in station-local units. The anchor element is
 * always STAGE_H units tall; `left/right/top/bottom` are the viewport edges so
 * robots can enter and leave through them.
 */
export type Stage = { w: number; left: number; right: number; top: number; bottom: number; floor: number };
export const STAGE_H = 3;
const FLOOR = -STAGE_H / 2;
/** Fixed moment shown when the user prefers reduced motion. */
const FROZEN_T = 5.2;
/** Cruising rotor speed, rad/s. */
const SPIN = 34;
const PKG_ON_ROVER = FLOOR + ROVER_PAD_TOP + PKG / 2;

/*
 * Frame order: scroll boost, then each station's clock, then its choreography, and
 * finally the robots (default priority 0) apply the state written in that same frame.
 */
const ORDER = { boost: -3, clock: -2, station: -1 };

type StationProps = { p: Palette; stage: MutableRefObject<Stage>; time: MutableRefObject<number> };

/* ------------------------------------------------------------------ stations */

/* Arm station layout. Arm targets are the held package's centre, relative to the arm base on the floor. */
const BELT_TOP = FLOOR + 0.3;
const PKG_ON_BELT = BELT_TOP + PKG / 2;
const ROLLER_R = 0.07;
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

    // Package riding the belt; the rollers turn with it (and ignore the jump back when the loop wraps).
    const beltX = kf(t, [[0, -2.05], [2.2, PICK_X, easeOut]]);
    belt.current.angle += Math.max(beltX - belt.current.x, 0) / ROLLER_R;
    belt.current.x = beltX;
    for (const g of rollers.current) if (g) g.rotation.z = -belt.current.angle;
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
      <Part p={p} geo={box(1.7, 0.1, 0.7)} mat={p.dark} position={[-1.45, BELT_TOP - 0.05, 0]} />
      <Part p={p} geo={box(1.7, 0.06, 0.06)} position={[-1.45, BELT_TOP - 0.13, 0.36]} />
      <Part p={p} geo={box(0.08, 0.2, 0.08)} mat={p.dark} position={[-2.2, FLOOR + 0.1, 0.3]} />
      <Part p={p} geo={box(0.08, 0.2, 0.08)} mat={p.dark} position={[-0.7, FLOOR + 0.1, 0.3]} />
      {[-2.0, -1.65, -1.3, -0.95].map((x, i) => (
        <group key={i} ref={(el) => (rollers.current[i] = el)} position={[x, BELT_TOP + 0.03, 0.42]}>
          <Part p={p} geo={cyl(ROLLER_R, 0.1, 8)} mat={p.dark} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
      <Part p={p} geo={box(0.75, 1.0, 0.8)} position={[-2.05, BELT_TOP + 0.45, 0]}>
        <Part p={p} geo={box(0.12, 0.08, 0.12)} mat={p.light} edge={false} position={[0.2, 0.42, 0.41]} />
      </Part>
      <Package ref={pkgConv} p={p} />
      <Arm p={p} state={arm} position={[0, FLOOR, 0]} />
      <Rover p={p} state={rover} />
    </group>
  );
}

/** Cream: the rover arrives from the left, a drone drops in, hooks the package and lifts it away. */
function PickupStation({ p, stage, time }: StationProps) {
  const rover = useRef<RoverState>({ x: 0, y: FLOOR, loaded: true, light: true, visible: true });
  const drone = useRef<DroneState>({ x: 0.5, y: 5, tilt: 0, spin: SPIN, cable: 0, carrying: false, light: true, visible: true });

  const PAD_X = 0.5;
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
    const path: Key[] = [[0, PAD_X], [7.2, PAD_X], [9.4, st.right + 1.5, easeIn]];
    d.x = kf(t, path);
    d.tilt = bank(t, path);
    d.y = kf(t, [[0, st.top + 1.2], [1.4, st.top + 1.2], [3.8, HOVER_Y], [7.2, HOVER_Y], [9.4, st.top + 1.2]]) + hover(t);
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

/** Sage: the drone crosses above the heading, sets its package down on a relay pad, settles on it to charge, and leaves. */
function RelayStation({ p, stage, time }: StationProps) {
  const drone = useRef<DroneState>({ x: 0, y: 1.9, tilt: 0, spin: SPIN, cable: 0.5, carrying: true, light: true, visible: true });
  const towerLamp = useRef<THREE.Group>(null);
  const padLamp = useRef<THREE.Group>(null);

  const PAD_X = 0.6;
  const PKG_ON_PAD = FLOOR + 0.08 + PKG / 2;
  const CRUISE_Y = 1.95;
  const CABLE_FLY = 0.5;
  /** Package just touching the pad. */
  const TOUCH_Y = droneYFor(CABLE_FLY, PKG_ON_PAD);
  /** Drone resting on top of its package. */
  const LANDED_Y = droneYFor(0, PKG_ON_PAD);

  useFrame(() => {
    const t = time.current;
    const st = stage.current;
    const d = drone.current;
    const path: Key[] = [[0, st.left - 1.5], [4, PAD_X], [9.7, PAD_X], [11.8, st.right + 1.5, easeIn]];
    const y = kf(t, [
      [0, CRUISE_Y], [2.6, CRUISE_Y], [4.9, TOUCH_Y], [5.05, TOUCH_Y], [5.7, LANDED_Y],
      [8.5, LANDED_Y], [9.1, TOUCH_Y], [9.25, TOUCH_Y], [10.4, CRUISE_Y],
    ]);
    const charging = between(t, 5.7, 8.5);
    d.x = kf(t, path);
    d.tilt = bank(t, path);
    // The bob fades out as the package reaches the pad, so it doesn't bounce on it.
    d.y = y + hover(t) * THREE.MathUtils.clamp((y - TOUCH_Y) / 0.3, 0, 1);
    // Once the package rests on the pad, the winch takes up the slack.
    d.cable = THREE.MathUtils.clamp(cableFor(d.y, PKG_ON_PAD), 0, CABLE_FLY);
    d.spin = kf(t, [[5.7, SPIN], [6.3, 4], [8.0, 4], [8.5, SPIN]]) + motion.boost * 30;
    d.light = charging ? blink(t, 3) : true;
    d.visible = t < 11.8;
    if (padLamp.current) padLamp.current.visible = charging ? blink(t, 3) : false;
    if (towerLamp.current) towerLamp.current.visible = blink(t, 0.5);
  }, ORDER.station);

  return (
    <group>
      <Part p={p} geo={box(1.3, 0.08, 0.9)} mat={p.dark} position={[PAD_X, FLOOR + 0.04, 0]} />
      <Part ref={padLamp} p={p} geo={box(1.0, 0.02, 0.6)} mat={p.light} edge={false} position={[PAD_X, FLOOR + 0.09, 0]} />
      {/* Beacon tower */}
      <Part p={p} geo={box(0.5, 0.14, 0.5)} mat={p.dark} position={[-1.7, FLOOR + 0.07, 0]} />
      <Part p={p} geo={box(0.12, 1.5, 0.12)} position={[-1.7, FLOOR + 0.9, 0]} />
      <Part p={p} geo={box(0.3, 0.16, 0.3)} mat={p.dark} position={[-1.7, FLOOR + 1.72, 0]} />
      <Part ref={towerLamp} p={p} geo={box(0.14, 0.14, 0.14)} mat={p.light} edge={false} position={[-1.7, FLOOR + 1.88, 0]} />
      <Drone p={p} state={drone} />
    </group>
  );
}

/** Lavender: the drone lowers the package into the empty slot on the stack. */
function StackStation({ p, stage, time }: StationProps) {
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

const STATIONS: Record<StationKind, (p: StationProps) => React.JSX.Element> = {
  arm: ArmStation,
  pickup: PickupStation,
  relay: RelayStation,
  stack: StackStation,
};

/* ------------------------------------------------------------------ anchoring */

/**
 * Finds every `[data-shape]` element and plays a station on it. The station is
 * scaled so the anchor is STAGE_H units tall; robots may leave through the viewport edges.
 */
export function Stations({ frozen }: { frozen: boolean }) {
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
        <AnchoredStation key={i} el={el} index={i} frozen={frozen} />
      ))}
    </>
  );
}

function AnchoredStation({ el, index, frozen }: { el: HTMLElement; index: number; frozen: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();
  const kind = (el.dataset.shape as StationKind) in STATIONS ? (el.dataset.shape as StationKind) : "arm";
  const palette = usePalette(el.dataset.ink || "#1e1e1e", el.dataset.accent || "#d45bb6");
  const stage = useRef<Stage>({ w: 4, left: -3, right: 3, top: 2, bottom: -2, floor: FLOOR });
  const time = useRef(FROZEN_T);
  const started = useRef<number | null>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const margin = size.height * 0.6;
    const visible = r.height > 0 && cy > -margin && cy < size.height + margin;
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
      <Station p={palette} stage={stage} time={time} />
    </group>
  );
}
