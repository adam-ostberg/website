import { useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Palette } from "../palette";
import { Part, Wheel, box, cyl } from "./parts";
import { kf, blink, easeIn, motion, PERIOD } from "./timeline";
import { ORDER, type StationProps } from "./stage";

/*
 * Two combat robots circling and ramming each other, seen from above.
 *
 * The page camera never moves, so the plan view comes from rotating the station's own
 * ground plane a quarter turn to face it. After that +x is screen right, +z is screen
 * down, and a car's yaw about y is its rotation on screen, which is what makes driving
 * read. There is no floor: the cars are the whole station.
 *
 * The pair is described by one line through the centre, at angle PHI, with a car at each
 * end of it and GAP between them. PHI turns steadily, which walks both cars around a
 * circle; GAP slams shut and springs open, which is the fight. Two things fall out of
 * describing it this way. The cars are always exactly GAP apart, so clamping GAP at two
 * nose lengths makes it impossible for them to pass through one another. And they always
 * face along the line, which means they charge head on rather than swiping past, because
 * a real collision needs them travelling into each other rather than alongside.
 */

/** Half a car, nose to centre. Two of these is contact. */
const NOSE = 0.52;
const WHEEL_R = 0.13;

/** Turns of the whole pair per loop. Three puts the cars at about 5 units a second. */
const TURNS = 3;
/** Seconds between hits. PERIOD must divide by this, or the loop won't close. */
const CLASH_T = 3;
const CLASH_0 = 1.5;

/**
 * How far apart they circle, by angle: wider when the pair lies across the screen than
 * when it stands up it, so the fight uses the width of the section head without ever
 * reaching past the top and bottom of it.
 */
const spread = (phi: number) => 2.0 + 1.6 * Math.cos(phi) ** 2;

/**
 * 1 circling, 0 at contact. Slams shut over the last half second, accelerating the whole
 * way in and closing at nearly 7 units a second, then springs back out and settles. The step in speed either side of 0
 * is the impact: without it they just drift past each other, which is what made the last
 * version look like nothing was happening.
 */
const APART: Parameters<typeof kf>[1] = [
  [0, 0], [0.16, 0.5], [0.4, 0.38], [0.95, 1], [2.45, 1], [CLASH_T, 0, easeIn],
];

const cycle = (t: number) => (((t - CLASH_0) % CLASH_T) + CLASH_T) % CLASH_T;
const phiOf = (t: number) => (2 * Math.PI * TURNS * t) / PERIOD;

type Spot = { x: number; z: number };

/** Distance between the two cars: never less than a nose to a nose. */
function gapOf(t: number): number {
  const phi = phiOf(t);
  return 2 * NOSE + (spread(phi) - 2 * NOSE) * kf(cycle(t), APART);
}

function ploughAt(t: number): Spot {
  const phi = phiOf(t);
  const r = gapOf(t) / 2;
  return { x: -r * Math.cos(phi), z: -r * Math.sin(phi) };
}
function spinAt(t: number): Spot {
  const phi = phiOf(t);
  const r = gapOf(t) / 2;
  return { x: r * Math.cos(phi), z: r * Math.sin(phi) };
}

/** Fastest a car can turn, rad/s. */
const SLEW = 9;

/*
 * With the mat gone there is nothing else holding the anchor, so the fight is scaled up to
 * carry it on its own. It reaches a little past the top and bottom of the anchor at this
 * size, which is only empty ground above and the essay window below, and the window is on
 * a layer above the canvas anyway.
 */
const SCALE = 1.2;

/**
 * Where a car is pointing. The direction of travel reverses in one frame when a hit throws
 * it backwards, so the yaw chases that direction at a limited rate instead of being set to
 * it. Below the limit this is exact; at a hit it turns the jump into a car being spun round
 * by the blow, which is the bit worth watching.
 */
function steer(prev: number, at: (t: number) => Spot, t: number, dt: number): number {
  const a = at(t - 0.04);
  const b = at(t + 0.04);
  const vx = b.x - a.x;
  const vz = b.z - a.z;
  if (Math.hypot(vx, vz) < 1e-5) return prev;
  let want = Math.atan2(-vz, vx);
  while (want - prev > Math.PI) want -= 2 * Math.PI;
  while (prev - want > Math.PI) want += 2 * Math.PI;
  const step = SLEW * dt;
  return Math.abs(want - prev) <= step ? want : prev + Math.sign(want - prev) * step;
}

type CarState = { x: number; z: number; h: number; flash: boolean };

function Car({ p, state, children }: { p: Palette; state: MutableRefObject<CarState>; children: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const lamp = useRef<THREE.Group>(null);
  const odo = useRef({ x: 0, z: 0, angle: 0 });

  useFrame(() => {
    const s = state.current;
    if (root.current) {
      root.current.position.set(s.x, 0, s.z);
      root.current.rotation.y = s.h;
    }
    // Wheels turn by ground covered, whichever way the car is pointing.
    const d = odo.current;
    d.angle += Math.hypot(s.x - d.x, s.z - d.z) / WHEEL_R;
    d.x = s.x;
    d.z = s.z;
    for (const w of wheels.current) if (w) w.rotation.z = -d.angle;
    if (lamp.current) lamp.current.visible = s.flash;
  });

  return (
    <group ref={root}>
      {children}
      {([[0.28, 0.34], [0.28, -0.34], [-0.3, 0.34], [-0.3, -0.34]] as const).map(([x, z], i) => (
        <Wheel
          key={i}
          ref={(el) => {
            wheels.current[i] = el;
          }}
          p={p}
          position={[x, WHEEL_R, z]}
          r={WHEEL_R}
        />
      ))}
      <Part ref={lamp} p={p} geo={box(0.12, 0.05, 0.12)} mat={p.light} edge={false} position={[-0.36, 0.26, 0]} />
    </group>
  );
}

/** The plough: a blade wider than the car, which from above is most of its silhouette. */
function Plough({ p, state }: { p: Palette; state: MutableRefObject<CarState> }) {
  return (
    <Car p={p} state={state}>
      <Part p={p} geo={box(0.86, 0.22, 0.6)} position={[0, 0.22, 0]} />
      <Part p={p} geo={box(0.14, 0.2, 0.8)} mat={p.dark} position={[0.48, 0.19, 0]} />
      <Part p={p} geo={box(0.16, 0.2, 0.16)} mat={p.dark} position={[0.34, 0.19, 0.36]} rotation={[0, 0.5, 0]} />
      <Part p={p} geo={box(0.16, 0.2, 0.16)} mat={p.dark} position={[0.34, 0.19, -0.36]} rotation={[0, -0.5, 0]} />
      <Part p={p} geo={box(0.46, 0.05, 0.26)} mat={p.core} edge={false} position={[-0.04, 0.34, 0]} />
    </Car>
  );
}

/** The spinner: the bar sweeping its circle is the one thing a plan view shows off. */
function SpinnerCar({ p, state, bar }: { p: Palette; state: MutableRefObject<CarState>; bar: MutableRefObject<THREE.Group | null> }) {
  return (
    <Car p={p} state={state}>
      <Part p={p} geo={box(0.8, 0.24, 0.6)} position={[0, 0.23, 0]} />
      <Part p={p} geo={cyl(0.07, 0.1, 10)} mat={p.dark} position={[0.02, 0.38, 0]} />
      <group
        ref={(el) => {
          bar.current = el;
        }}
        position={[0.02, 0.44, 0]}>
        <Part p={p} geo={box(0.94, 0.07, 0.11)} />
        {[-0.47, 0.47].map((x) => (
          <Part key={x} p={p} geo={box(0.1, 0.08, 0.13)} mat={p.core} edge={false} position={[x, 0, 0]} />
        ))}
      </group>
    </Car>
  );
}

export function SparStation({ p, time }: StationProps) {
  const plough = useRef<CarState>({ x: -1, z: 0, h: 0, flash: false });
  const spinner = useRef<CarState>({ x: 1, z: 0, h: Math.PI, flash: false });
  const bar = useRef<THREE.Group | null>(null);
  const clock = useRef({ t: 0, spin: 0 });

  useFrame(() => {
    const t = time.current;
    const c = clock.current;
    // The station clock wraps at PERIOD; a wrap is not elapsed time.
    const dt = t > c.t ? Math.min(t - c.t, 0.05) : 1 / 60;
    c.t = t;

    const a = plough.current;
    const aAt = ploughAt(t);
    a.x = aAt.x;
    a.z = aAt.z;
    a.h = steer(a.h, ploughAt, t, dt);

    const b = spinner.current;
    const bAt = spinAt(t);
    b.x = bAt.x;
    b.z = bAt.z;
    b.h = steer(b.h, spinAt, t, dt);

    // Lamps strobe for a moment after each hit.
    const hit = cycle(t) < 0.34;
    a.flash = hit && blink(t, 16);
    b.flash = hit && blink(t, 16);

    c.spin += (46 + motion.boost * 30) * dt;
    if (bar.current) bar.current.rotation.y = c.spin;
  }, ORDER.station);

  /* Built flat in xz above, tipped up to face the camera here. */
  return (
    <group rotation={[Math.PI / 2, 0, 0]} scale={SCALE}>
      <Plough p={p} state={plough} />
      <SpinnerCar p={p} state={spinner} bar={bar} />
    </group>
  );
}
