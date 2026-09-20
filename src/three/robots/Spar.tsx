import { useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Palette } from "../palette";
import { Part, Wheel, box, cyl } from "./parts";
import { blink, between, motion, PERIOD } from "./timeline";
import { ORDER, type StationProps } from "./stage";

/*
 * Two combat robots circling on a mat, seen from above.
 *
 * The page camera never moves, so the plan view comes from rotating the station's own
 * ground plane a quarter turn to face it: the arena is built flat in xz around the
 * origin, and the wrapper at the bottom tips it up. After that rotation +x is screen
 * right, +z is screen down, and a car's yaw about y is its rotation on screen, which is
 * what makes driving read at all. Nothing here uses FLOOR: there is no floor to stand on
 * in a plan view, only a mat to drive on.
 */

/** Half the chassis plus the blade: two cars touch, nose to nose, at twice this. */
const NOSE = 0.52;
const WHEEL_R = 0.13;

/** The two moments they line up. Everything else follows from the oval. */
const BUMP = [3, 9];

/** `h` is null until the first frame has something to measure. */
type CarState = { x: number; z: number; h: number | null; flash: boolean };

function Car({ p, state, children }: { p: Palette; state: MutableRefObject<CarState>; children: ReactNode }) {
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const lamp = useRef<THREE.Group>(null);
  const travelled = useRef({ x: 0, z: 0, angle: 0 });

  useFrame(() => {
    const s = state.current;
    if (root.current) {
      root.current.position.set(s.x, 0, s.z);
      root.current.rotation.y = s.h ?? 0;
    }
    // Wheels turn by distance covered, whichever way the car happens to be pointing.
    const d = travelled.current;
    const step = Math.hypot(s.x - d.x, s.z - d.z);
    d.x = s.x;
    d.z = s.z;
    d.angle += step / WHEEL_R;
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
      <Part ref={lamp} p={p} geo={box(0.1, 0.05, 0.1)} mat={p.light} edge={false} position={[-0.36, 0.26, 0]} />
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

/* --------------------------------------------------------------- the routes */

/*
 * Both cars run the same oval, in opposite directions, at a constant rate. Hand-written
 * keyframes were the wrong tool: a closed lap has to leave its first point travelling the
 * way it arrives at its last, and every table that got the bumps right put a reversal
 * somewhere, which snaps the car through half a turn in a frame. An angle is periodic on
 * its own, so the lap closes for free and the heading is always along the track.
 *
 * Counter-rotating at the same rate, they line up at exactly two angles per lap. Those are
 * the clashes. To keep them from ending up in the same spot, each takes a different line
 * into the bend near a clash -- one inside, one outside -- which separates them by two
 * nose lengths at the closest point: touching, not overlapping.
 */
const RX = 1.95;
const RZ = 1.0;
const RATE = (2 * Math.PI) / PERIOD;
/*
 * Fraction of the radius each car gives up (or takes) on the way into a clash. Derived,
 * not chosen: the two lines are 2 * SPLIT * RX apart at the ends of the oval, and that
 * wants to be exactly two nose lengths so the cars touch without passing through.
 */
const SPLIT = NOSE / RX;
/** Phases chosen so the two line up at the ends of the oval, where there is room to meet. */
const PHASE_A = -Math.PI / 2;
const PHASE_B = Math.PI / 2;

/*
 * 1 at a clash, easing to 0 two seconds either side. Narrower and the lines rejoin while
 * the cars are still alongside each other, which puts them through one another just after
 * the hit; wider and the split stops reading as a move into the bend.
 */
const lobe = (t: number, b: number) => Math.max(0, 1 - ((t - b) / 2) ** 2);
const split = (t: number) => Math.max(lobe(t, BUMP[0]), lobe(t, BUMP[1]));

type Spot = { x: number; z: number };

/** Where a car is at time t. `dir` is which way round, `side` is inside (-1) or outside (+1). */
function place(t: number, dir: 1 | -1, phase: number, side: 1 | -1): Spot {
  const th = dir * RATE * t + phase;
  const k = 1 + side * SPLIT * split(t);
  return { x: RX * k * Math.cos(th), z: RZ * k * Math.sin(th) };
}

const ploughAt = (t: number) => place(t, 1, PHASE_A, -1);
const spinAt = (t: number) => place(t, -1, PHASE_B, 1);

/**
 * Yaw from the direction of travel, sampled either side of now. Kept near `prev` so a car
 * coming round the end of the oval keeps turning instead of snapping back the long way.
 */
function headingOf(t: number, at: (t: number) => Spot, prev: number | null): number {
  const a = at(t - 0.07);
  const b = at(t + 0.07);
  const vx = b.x - a.x;
  const vz = b.z - a.z;
  if (Math.hypot(vx, vz) < 1e-5) return prev ?? 0;
  let h = Math.atan2(-vz, vx);
  if (prev === null) return h; // nothing to unwrap against yet
  while (h - prev > Math.PI) h -= 2 * Math.PI;
  while (prev - h > Math.PI) h += 2 * Math.PI;
  return h;
}

/** Recoil at a bump: a decaying shake that starts by pushing the car back off its nose. */
function shove(t: number): number {
  for (const b of BUMP) {
    if (t >= b && t < b + 0.26) {
      const f = (t - b) / 0.26;
      return -Math.sin(f * Math.PI * 3) * 0.06 * (1 - f);
    }
  }
  return 0;
}

const hitting = (t: number) => BUMP.some((b) => between(t, b, b + 0.3));

export function SparStation({ p, time }: StationProps) {
  const plough = useRef<CarState>({ x: 0, z: -RZ, h: null, flash: false });
  const spinner = useRef<CarState>({ x: 0, z: RZ, h: null, flash: false });
  const bar = useRef<THREE.Group | null>(null);
  const lamp = useRef<THREE.Group>(null);
  const spin = useRef({ angle: 0, t: 0 });

  useFrame(() => {
    const t = time.current;

    const kick = shove(t);

    const a = plough.current;
    a.h = headingOf(t, ploughAt, a.h);
    const aAt = ploughAt(t);
    a.x = aAt.x + Math.cos(a.h) * kick;
    a.z = aAt.z - Math.sin(a.h) * kick;

    const b = spinner.current;
    b.h = headingOf(t, spinAt, b.h);
    const bAt = spinAt(t);
    b.x = bAt.x + Math.cos(b.h) * kick;
    b.z = bAt.z - Math.sin(b.h) * kick;

    const hit = hitting(t);
    a.flash = hit ? blink(t, 12) : false;
    b.flash = hit ? blink(t, 12) : false;

    // The bar spins up on the way in and never really stops.
    const rate = 22 + motion.boost * 20;
    const dt = t - spin.current.t;
    spin.current.t = t;
    if (dt > 0) spin.current.angle += rate * dt;
    if (bar.current) bar.current.rotation.y = spin.current.angle;

    if (lamp.current) lamp.current.visible = hit ? true : blink(t, 0.5);
  }, ORDER.station);

  return (
    /* Flat in xz above, tipped up to face the camera here. */
    <group rotation={[Math.PI / 2, 0, 0]}>
      <Part p={p} geo={box(6.0, 0.04, 2.72)} mat={p.dark} position={[0, -0.02, 0]} />
      {/* Boards around the edge: from above they read as the outline of the arena. */}
      {([1, -1] as const).map((s) => (
        <Part key={`h${s}`} p={p} geo={box(6.0, 0.16, 0.08)} position={[0, 0.06, s * 1.36]} />
      ))}
      {([1, -1] as const).map((s) => (
        <Part key={`v${s}`} p={p} geo={box(0.08, 0.16, 2.72)} position={[s * 2.96, 0.06, 0]} />
      ))}
      {/* Centre line and the corner squares, so the mat reads as a floor and not a slab. */}
      <Part p={p} geo={box(0.04, 0.01, 2.2)} mat={p.core} edge={false} position={[0, 0.01, 0]} />
      {([[-2.3, 0.95], [2.3, 0.95], [-2.3, -0.95], [2.3, -0.95]] as const).map(([x, z]) => (
        <Part key={`${x}:${z}`} p={p} geo={box(0.22, 0.01, 0.22)} mat={p.core} edge={false} position={[x, 0.01, z]} />
      ))}
      <Part ref={lamp} p={p} geo={box(0.16, 0.06, 0.16)} mat={p.light} edge={false} position={[0, 0.06, 0]} />
      <Plough p={p} state={plough} />
      <SpinnerCar p={p} state={spinner} bar={bar} />
    </group>
  );
}
