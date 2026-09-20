import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Arm, mix, reach, type ArmState, type Joints } from "./Arm";
import { Package, Part, box, cyl } from "./parts";
import { kf, between, blink, easeIn, easeOut, span, PERIOD } from "./timeline";
import { Belt, BELT_TOP, FLOOR, ORDER, PKG_ON_BELT, roll, type StationProps } from "./stage";

/*
 * The one station on the site where the robot gets it wrong. The box stops short of
 * where the arm expects it, so the first grab closes on nothing; the arm tries once
 * more, gives up, sweeps the belt until it finds the box, and then picks it properly
 * and puts it where it was always supposed to be.
 *
 * The miss has to be unmistakable, which sets the geometry: the gap between the two
 * positions is wider than a gripper half-span plus a package half-width, so the open
 * fingers never overlap the box. Anything tighter and it reads as a clipping bug.
 */

const BASE_X = 0;
/** Where the arm is told the box will be. */
const EXPECT_X = -0.7;
/** Where it actually stopped. The gap is set by the clearance rule above, not by taste. */
const ACTUAL_X = -1.56;
const PLACE_X = 1.35;

const PICK_Y = PKG_ON_BELT - FLOOR;
const CARRY_Y = 1.15;

const REST = reach(-0.4, 1.6, 1);
const EXPECT_UP = reach(EXPECT_X - BASE_X, CARRY_Y, 1);
const ACTUAL_UP = reach(ACTUAL_X - BASE_X, CARRY_Y, 1);
const PLACE_UP = reach(PLACE_X - BASE_X, CARRY_Y, -1);

/* Beats of the loop. */
const ARRIVED = 1.4;
const GRAB = 3.2;
const GAVE_UP = 4.6;
const FOUND = 6.2;
const LIFTED = 7.15;
const RELEASED = 9.9;

/** Joint moves between waypoints; straight vertical moves for each grab and the place. */
function armPose(t: number): Joints {
  if (t < ARRIVED) return REST;
  if (t < 2.6) return mix(REST, EXPECT_UP, span(t, ARRIVED, 2.6));
  // Down onto nothing, hold there through the second attempt, back up.
  if (t < GAVE_UP) return reach(EXPECT_X - BASE_X, kf(t, [[2.6, CARRY_Y], [GRAB, PICK_Y], [4.1, PICK_Y], [GAVE_UP, CARRY_Y]]), 1);
  // The sweep: slow, and the only move on the page that isn't going anywhere in particular.
  if (t < FOUND) return mix(EXPECT_UP, ACTUAL_UP, span(t, GAVE_UP, FOUND));
  if (t < 7.9) return reach(ACTUAL_X - BASE_X, kf(t, [[FOUND, CARRY_Y], [6.9, PICK_Y], [7.2, PICK_Y], [7.9, CARRY_Y]]), 1);
  if (t < 9.2) return mix(ACTUAL_UP, PLACE_UP, span(t, 7.9, 9.2));
  if (t < 10.6) return reach(PLACE_X - BASE_X, kf(t, [[9.2, CARRY_Y], [9.8, PICK_Y], [10.0, PICK_Y], [10.6, CARRY_Y]]), -1);
  return mix(PLACE_UP, REST, span(t, 10.6, PERIOD));
}

export function RetryStation({ p, stage, time }: StationProps) {
  const arm = useRef<ArmState>({ shoulder: REST[0], elbow: REST[1], grip: 0, holding: false });
  const loose = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.Group>(null);
  const inRollers = useRef<(THREE.Group | null)[]>([]);
  const outRollers = useRef<(THREE.Group | null)[]>([]);
  const beltIn = useRef({ x: -2.95, angle: 0 });
  const beltOut = useRef({ x: PLACE_X, angle: 0 });

  useFrame(() => {
    const t = time.current;
    const st = stage.current;

    // Infeed: the box rides in and stops short. Monotonic, so the rollers never run backwards.
    const inX = kf(t, [[0, -2.95], [ARRIVED, ACTUAL_X, easeOut]]);
    roll(beltIn.current, inX, inRollers.current);
    // Outfeed: still until the box is set down on it, then away.
    const outX = kf(t, [[RELEASED, PLACE_X], [PERIOD, st.right + 1.2, easeIn]]);
    roll(beltOut.current, outX, outRollers.current);

    const a = arm.current;
    [a.shoulder, a.elbow] = armPose(t);
    // Close on nothing, open a little, try again, then give up and open properly.
    a.grip = kf(t, [
      [GRAB, 0], [3.5, 1], [3.7, 1], [3.85, 0.2], [4.0, 1], [4.3, 1], [4.45, 0],
      [6.9, 0], [LIFTED, 1], [9.85, 1], [10.0, 0],
    ]);
    a.holding = between(t, LIFTED, RELEASED);

    if (loose.current) {
      loose.current.visible = t < LIFTED || t >= RELEASED;
      loose.current.position.set(t < LIFTED ? inX : outX, PKG_ON_BELT, 0);
    }
    // One light tells the whole story: panic, then searching, then found.
    if (lamp.current) {
      lamp.current.visible = between(t, 3.5, GAVE_UP)
        ? blink(t, 8)
        : between(t, GAVE_UP, FOUND)
          ? blink(t, 2.5)
          : between(t, FOUND, 7.4);
    }
  }, ORDER.station);

  return (
    <group>
      <Belt p={p} x={-1.55} length={2.1} rollers={[-2.45, -2.09, -1.73, -1.37, -1.01, -0.65]} rollerRefs={inRollers} />
      <Belt p={p} x={1.65} length={1.9} rollers={[0.85, 1.25, 1.65, 2.05, 2.45]} rollerRefs={outRollers} />
      {/* The sensor the arm is wishing it had been given. */}
      <Part p={p} geo={box(0.06, 0.95, 0.06)} mat={p.dark} position={[-0.62, FLOOR + 0.48, 0.34]} />
      <Part p={p} geo={box(0.24, 0.18, 0.2)} position={[-0.62, FLOOR + 1.03, 0.34]}>
        <Part ref={lamp} p={p} geo={box(0.1, 0.08, 0.03)} mat={p.light} edge={false} position={[0, 0, 0.11]} />
      </Part>
      {/* A stop at the end of the infeed, so the box having halted early reads as a fault. */}
      <Part p={p} geo={cyl(0.04, 0.34, 8)} mat={p.dark} position={[-0.58, BELT_TOP + 0.17, 0]} />
      <Package ref={loose} p={p} />
      <Arm p={p} state={arm} position={[BASE_X, FLOOR, 0]} />
    </group>
  );
}
