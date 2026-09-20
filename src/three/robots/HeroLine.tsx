import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Arm, mix, reach, type ArmState, type Joints } from "./Arm";
import { Rover, type RoverState } from "./Rover";
import { Drone, bank, cableFor, type DroneState } from "./Drone";
import { Package, Part, PKG, box, cyl } from "./parts";
import { kf, between, blink, easeIn, easeOut, hover, motion, span, PERIOD, type Key } from "./timeline";
import {
  Belt,
  BELT_TOP,
  FLOOR,
  ORDER,
  PKG_ON_BELT,
  PKG_ON_ROVER,
  ROLLER_R,
  SPIN,
  type StationProps,
} from "./stage";

/*
 * The hero's establishing shot: one production line running the full width of the
 * page, read left to right. A box comes out of the intake hopper, rides the infeed
 * belt, is lifted onto the shuttle rover by the arm, is driven to the transfer bed,
 * crosses onto the outfeed belt, gets stamped by the press, and is flown out by the
 * drone. One box makes the whole journey in a single PERIOD.
 *
 * Everything lives between y = FLOOR and the top of the stage, because the canvas
 * sits in front of the page: anything taller would be drawn over the hero text.
 */

/* ------------------------------------------------------------------ layout */

const HOPPER_X = -6.3;
const BELT_A_X = -5.2;
const BELT_A_LEN = 2.0;
/** Right-hand end of the infeed belt, where the arm picks up. */
const A_PICK_X = -4.2;
const ARM_X = -3.1;
const ROVER_LOAD_X = -1.8;
const ROVER_DROP_X = -0.6;
/** Roller bed bridging the rover's pad down to the outfeed belt. */
const XFER_X = 0.3;
const B_START_X = 0.95;
const BELT_B_X = 2.05;
const BELT_B_LEN = 2.6;
const PRESS_X = 2.05;
/** Left-hand end of the outfeed belt, where the drone hooks on. */
const B_END_X = 3.2;
const PALLET_X = 5.15;

const XFER_TOP = FLOOR + 0.41;
const PKG_ON_XFER = XFER_TOP + PKG / 2;

/* Arm targets are the held package's centre, relative to the arm base on the floor. */
const PICK_REL = A_PICK_X - ARM_X;
const PLACE_REL = ROVER_LOAD_X - ARM_X;
const PICK_Y = PKG_ON_BELT - FLOOR;
const PLACE_Y = PKG_ON_ROVER - FLOOR;
const CARRY_Y = 1.35;
const REST = reach(-0.5, 1.7, 1);
const PICK_UP = reach(PICK_REL, CARRY_Y, 1);
const PLACE_UP = reach(PLACE_REL, CARRY_Y, -1);

const CRUISE_Y = 0.95;
const HOVER_Y = 0.45;
const CABLE_FLY = 0.45;

/** Rollers idle at this rate even with nothing on them, and speed up as the page scrolls. */
const IDLE_ROLL = 2.6;

/** Joint moves between waypoints; straight vertical moves for the pick and the place. */
function armPose(t: number): Joints {
  if (t < 1.8) return mix(REST, PICK_UP, span(t, 1.0, 1.8));
  if (t < 2.85) return reach(PICK_REL, kf(t, [[1.8, CARRY_Y], [2.2, PICK_Y], [2.45, PICK_Y], [2.85, CARRY_Y]]), 1);
  if (t < 3.95) return mix(PICK_UP, PLACE_UP, span(t, 2.85, 3.95));
  if (t < 5.0) return reach(PLACE_REL, kf(t, [[3.95, CARRY_Y], [4.35, PLACE_Y], [4.6, PLACE_Y], [5.0, CARRY_Y]]), -1);
  return mix(PLACE_UP, REST, span(t, 5.0, 6.1));
}

/* ------------------------------------------------------------------ scenery */

/** Shelving well behind the line. Soft edges and no accent, so it reads as depth rather than detail. */
function Racking({ p }: { p: StationProps["p"] }) {
  const bays = [-5.4, -2.6, 0.5, 3.4, 6.0];
  return (
    <group position={[0, 0, -2.0]}>
      {bays.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[-0.95, 0.95].map((ox) => (
            <Part
              key={ox}
              p={p}
              geo={box(0.08, 2.3, 0.08)}
              mat={p.dark}
              edge={p.edgeSoft}
              position={[ox, FLOOR + 1.15, 0]}
            />
          ))}
          {[0.45, 1.25, 2.05].map((y, i) => (
            <group key={y}>
              <Part p={p} geo={box(2.0, 0.06, 0.55)} mat={p.dark} edge={p.edgeSoft} position={[0, FLOOR + y, 0]} />
              {i < 2 &&
                [-0.55, 0.1, 0.65].map((bx, j) => (
                  <Part
                    key={bx}
                    p={p}
                    geo={box(0.4, 0.4, 0.4)}
                    mat={j === 1 ? p.solid : p.dark}
                    edge={p.edgeSoft}
                    position={[bx, FLOOR + y + 0.23, 0]}
                  />
                ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * Roof truss with work lamps, framing the top of the shot. It hangs well below the
 * top of the stage: the hero's meta row wraps to two lines on narrow screens and
 * would otherwise land straight on the beam.
 */
function Truss({ p }: { p: StationProps["p"] }) {
  const braces = Array.from({ length: 13 }, (_, i) => -7.2 + i * 1.2);
  return (
    <group position={[0, 1.12, -1.25]}>
      {[-0.22, 0.22].map((z) => (
        <Part key={z} p={p} geo={box(17, 0.07, 0.07)} mat={p.dark} edge={p.edgeSoft} position={[0, 0, z]} />
      ))}
      {braces.map((x, i) => (
        <Part
          key={x}
          p={p}
          geo={box(0.05, 0.05, 0.5)}
          mat={p.dark}
          edge={false}
          position={[x, 0, 0]}
          rotation={[i % 2 ? 0.5 : -0.5, 0, 0]}
        />
      ))}
      {[-4.6, -0.2, 3.9].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Part p={p} geo={box(0.03, 0.22, 0.03)} mat={p.dark} edge={false} position={[0, -0.13, 0]} />
          <Part p={p} geo={box(0.34, 0.1, 0.24)} mat={p.dark} position={[0, -0.29, 0]} />
          <Part p={p} geo={box(0.26, 0.03, 0.17)} mat={p.light} edge={false} position={[0, -0.35, 0]} />
        </group>
      ))}
    </group>
  );
}

/** Finished pallet at the end of the line: static, just something for the shot to end on. */
function Pallet({ p }: { p: StationProps["p"] }) {
  const cells: [number, number, number][] = [];
  for (const layer of [0, 1]) {
    for (const ix of [-1, 0, 1]) {
      for (const iz of [-1, 1]) {
        if (layer === 1 && ix === 1 && iz === 1) continue; // leave the stack mid-build
        cells.push([PALLET_X + ix * 0.56, FLOOR + 0.08 + PKG / 2 + layer * 0.56, iz * 0.3]);
      }
    }
  }
  return (
    <group>
      <Part p={p} geo={box(2.0, 0.12, 1.1)} mat={p.dark} position={[PALLET_X, FLOOR + 0.06, 0]} />
      {cells.map((c, i) => (
        <Package key={i} p={p} position={c} label={i % 3 === 0} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ station */

export function HeroLine({ p, stage, time, detail }: StationProps) {
  const arm = useRef<ArmState>({ shoulder: REST[0], elbow: REST[1], grip: 0, holding: false });
  const rover = useRef<RoverState>({ x: ROVER_LOAD_X, y: FLOOR, loaded: false, light: true, visible: true });
  const drone = useRef<DroneState>({
    x: 9,
    y: CRUISE_Y,
    tilt: 0,
    spin: SPIN,
    cable: CABLE_FLY,
    carrying: false,
    labeled: true,
    light: true,
    visible: false,
  });

  const pkgInfeed = useRef<THREE.Group>(null);
  const pkgRaw = useRef<THREE.Group>(null);
  const pkgStamped = useRef<THREE.Group>(null);
  const rollersA = useRef<(THREE.Group | null)[]>([]);
  const rollersB = useRef<(THREE.Group | null)[]>([]);
  const rollersX = useRef<(THREE.Group | null)[]>([]);
  const ram = useRef<THREE.Group>(null);
  const pressLamp = useRef<THREE.Group>(null);
  const hopperLamp = useRef<THREE.Group>(null);
  const spin = useRef(0);

  useFrame((_, delta) => {
    const t = time.current;
    const st = stage.current;
    const dt = Math.min(delta, 0.05);

    // Belts run continuously; scrolling spins them up.
    spin.current += (IDLE_ROLL + motion.boost * 5) * dt;
    const angle = spin.current / ROLLER_R;
    for (const set of [rollersA.current, rollersB.current, rollersX.current]) {
      for (const g of set) if (g) g.rotation.z = -angle;
    }

    // Infeed: a box leaves the hopper and rides to the pick point.
    if (pkgInfeed.current) {
      pkgInfeed.current.visible = t < 2.35;
      pkgInfeed.current.position.set(kf(t, [[0, -6.1], [1.6, A_PICK_X, easeOut]]), PKG_ON_BELT, 0);
    }
    if (hopperLamp.current) hopperLamp.current.visible = t < 0.5 ? blink(t, 6) : true;

    // Arm: pick off the belt, swing right, set down on the rover.
    const a = arm.current;
    [a.shoulder, a.elbow] = armPose(t);
    a.grip = kf(t, [[2.2, 0], [2.45, 1], [4.35, 1], [4.6, 0]]);
    a.holding = between(t, 2.35, 4.45);

    // Rover: shuttles the box from the arm to the transfer bed and reverses back.
    const r = rover.current;
    r.x = kf(t, [
      [0, ROVER_LOAD_X], [4.8, ROVER_LOAD_X], [6.0, ROVER_DROP_X, easeOut],
      [6.9, ROVER_DROP_X], [8.2, ROVER_LOAD_X, easeOut],
    ]);
    r.loaded = between(t, 4.45, 6.35);
    r.light = between(t, 4.8, 8.2) ? blink(t, 3) : true;

    /*
     * The same box from here on: across the transfer bed onto the outfeed belt,
     * into the press, then out to the hook point. `raw` swaps for `stamped` the
     * moment the press lifts.
     */
    const x = kf(t, [
      [6.35, ROVER_DROP_X], [6.75, XFER_X], [7.1, B_START_X],
      [8.3, PRESS_X], [9.1, PRESS_X], [9.8, B_END_X, easeOut],
    ]);
    const y = kf(t, [[6.35, PKG_ON_ROVER], [6.75, PKG_ON_XFER], [7.1, PKG_ON_BELT]]);
    if (pkgRaw.current) {
      pkgRaw.current.visible = between(t, 6.35, 8.75);
      pkgRaw.current.position.set(x, y, 0);
    }
    if (pkgStamped.current) {
      pkgStamped.current.visible = between(t, 8.75, 9.9);
      pkgStamped.current.position.set(x, y, 0);
    }

    // Press: two slams while the box is under it.
    if (ram.current) {
      ram.current.position.y = -kf(t, [[8.3, 0], [8.5, 0.13, easeIn], [8.75, 0], [8.95, 0.13, easeIn], [9.2, 0]]);
    }
    if (pressLamp.current) pressLamp.current.visible = between(t, 8.3, 9.2) ? blink(t, 4) : false;

    // Drone: in from the right, winch down, hook the stamped box, carry it out.
    const d = drone.current;
    const path: Key[] = [
      [0, st.right + 2], [7.4, st.right + 2], [9.2, B_END_X],
      [10.6, B_END_X], [PERIOD, st.right + 2, easeIn],
    ];
    d.x = kf(t, path);
    d.tilt = bank(t, path);
    d.y = kf(t, [[0, CRUISE_Y], [7.4, CRUISE_Y], [9.2, HOVER_Y], [10.6, HOVER_Y], [PERIOD, CRUISE_Y]]) + hover(t);
    // Measured from where the drone actually is, so the bob never pushes the box into the belt.
    const down = cableFor(d.y, PKG_ON_BELT);
    d.cable = kf(t, [[9.2, CABLE_FLY], [9.75, down], [9.95, down], [10.6, CABLE_FLY]]);
    d.carrying = t >= 9.9;
    d.light = between(t, 9.75, 9.95) ? blink(t, 4) : true;
    d.spin = SPIN + motion.boost * 30;
    d.visible = t >= 7.4;
  }, ORDER.station);

  const stripes = Array.from({ length: 9 }, (_, i) => -2.7 + i * 0.36);

  return (
    <group>
      {detail && <Racking p={p} />}
      {detail && <Truss p={p} />}

      {/* Floor plate. The anchor is lifted off the page edge just enough for this to show. */}
      <Part p={p} geo={box(34, 0.14, 2.8)} mat={p.dark} edge={p.edgeSoft} position={[0, FLOOR - 0.07, -0.4]} />
      {stripes.map((x) => (
        <Part key={x} p={p} geo={box(0.22, 0.02, 0.5)} mat={p.core} edge={false} position={[x, FLOOR + 0.01, 0.55]} />
      ))}

      {/* Intake hopper feeding the infeed belt */}
      <Part p={p} geo={box(0.85, 1.15, 0.9)} position={[HOPPER_X, BELT_TOP + 0.52, 0]}>
        <Part p={p} geo={box(0.5, 0.3, 0.62)} mat={p.dark} position={[0.5, -0.4, 0]} rotation={[0, 0, -0.35]} />
        <Part p={p} geo={box(0.46, 0.1, 0.03)} mat={p.dark} position={[-0.1, 0.42, 0.46]} />
        <Part ref={hopperLamp} p={p} geo={box(0.12, 0.09, 0.04)} mat={p.light} edge={false} position={[0.22, 0.42, 0.46]} />
      </Part>

      <Belt
        p={p}
        x={BELT_A_X}
        length={BELT_A_LEN}
        rollers={[-6.05, -5.65, -5.25, -4.85, -4.45, -4.15]}
        rollerRefs={rollersA}
      />
      <Package ref={pkgInfeed} p={p} />

      <Arm p={p} state={arm} position={[ARM_X, FLOOR, 0]} />
      <Rover p={p} state={rover} />

      {/* Transfer bed: steps the box down from the rover's pad to belt height */}
      <Part p={p} geo={box(0.95, 0.08, 0.72)} mat={p.dark} position={[XFER_X, XFER_TOP - 0.04, 0]} />
      {[-0.28, 0, 0.28].map((ox, i) => (
        <group
          key={ox}
          ref={(el) => (rollersX.current[i] = el)}
          position={[XFER_X + ox, XFER_TOP + 0.03, 0.38]}>
          <Part p={p} geo={cyl(ROLLER_R, 0.1, 8)} mat={p.dark} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
      <Part p={p} geo={box(0.08, 0.3, 0.08)} mat={p.dark} position={[XFER_X, FLOOR + 0.15, 0.3]} />

      <Belt
        p={p}
        x={BELT_B_X}
        length={BELT_B_LEN}
        rollers={[0.9, 1.3, 1.7, 2.4, 2.8, 3.2]}
        rollerRefs={rollersB}
      />

      {/* Press: the belt runs through it, the ram stamps whatever stops underneath */}
      <Part p={p} geo={box(1.15, 1.0, 0.95)} position={[PRESS_X, BELT_TOP + 0.4, 0]} />
      {[-1, 1].map((side) => (
        <Part key={side} p={p} geo={box(0.03, 0.62, 0.62)} mat={p.dark} position={[PRESS_X + side * 0.58, BELT_TOP + 0.31, 0]} />
      ))}
      <Part p={p} geo={box(0.6, 0.09, 0.02)} mat={p.dark} position={[PRESS_X - 0.12, BELT_TOP + 0.7, 0.48]} />
      <Part ref={pressLamp} p={p} geo={box(0.12, 0.09, 0.04)} mat={p.light} edge={false} position={[PRESS_X + 0.36, BELT_TOP + 0.7, 0.48]} />
      {[-1, 1].map((side) => (
        <Part key={side} p={p} geo={box(0.06, 0.5, 0.06)} mat={p.dark} position={[PRESS_X + side * 0.27, BELT_TOP + 1.15, 0]} />
      ))}
      <Part p={p} geo={box(0.66, 0.08, 0.22)} position={[PRESS_X, BELT_TOP + 1.4, 0]} />
      <group ref={ram}>
        <Part p={p} geo={cyl(0.04, 0.34, 8)} mat={p.dark} position={[PRESS_X, BELT_TOP + 1.33, 0]} />
        <Part p={p} geo={box(0.36, 0.12, 0.32)} position={[PRESS_X, BELT_TOP + 1.1, 0]} />
      </group>

      {/* Control cabinet beside the press */}
      <Part p={p} geo={box(0.42, 0.75, 0.4)} mat={p.dark} position={[PRESS_X + 1.05, FLOOR + 0.38, -0.45]}>
        <Part p={p} geo={box(0.26, 0.18, 0.02)} mat={p.core} edge={false} position={[0, 0.16, 0.21]} />
      </Part>

      <Package ref={pkgRaw} p={p} />
      <Package ref={pkgStamped} p={p} label />

      <Pallet p={p} />
      <Drone p={p} state={drone} />
    </group>
  );
}
