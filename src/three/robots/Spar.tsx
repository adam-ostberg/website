import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Palette } from "../palette";
import { Part, Wheel, box, cyl } from "./parts";
import { kf, blink, between, easeIn, easeOut, motion, type Key } from "./timeline";
import { FLOOR, ORDER, type StationProps } from "./stage";

/*
 * Two combat robots, the way they sit in a school gymnasium: a wedge and a spinner
 * on a mat. Everything is driven off the ground contact point, so flipping a bot is
 * a rotation about z plus a lift to put its new resting face on the floor.
 */

/** `rot` is roll about z; `wheel` is the wheel angle, kept separate so a beached bot can keep spinning them. */
type BotState = { x: number; rot: number; lift: number; wheel: number };

const WHEEL_R = 0.14;
/** Height the spinner rests at once it is upside down: the top of its own weapon bar. */
const BEACHED = 0.615;

/*
 * The ramp, measured rather than guessed: its plate is 0.5 long, centred at x 0.5 and
 * y 0.16, tilted by RAMP_TILT, which puts the leading tip here. The spinner's lift is
 * derived from these, so it rides the ramp instead of following keyframes that have to
 * be re-tuned every time the approach changes.
 */
const RAMP_TILT = 0.34;
const RAMP_TIP_X = 0.736;
const RAMP_TIP_Y = 0.077;
const RAMP_SLOPE = Math.tan(RAMP_TILT);
/** Half the spinner's chassis, and the height of its underside off the floor. */
const BODY_HALF = 0.36;
const BELLY_Y = WHEEL_R - 0.02;
/** Gap between the bots when the ramp tip is against the spinner's flank. */
const PUSH_DX = RAMP_TIP_X + BODY_HALF;

/*
 * Combat robots are built low, so at 1:1 they filled only the bottom fifth of the stage
 * while every other station uses its full height. The whole scene is scaled about the
 * floor plane instead of resizing each part: stage bounds are divided by S on the way in
 * so the bots still enter and leave exactly at the viewport edges.
 */
const S = 1.6;

function Chassis({ p, w, h }: { p: Palette; w: number; h: number }) {
  return <Part p={p} geo={box(w, h, 0.58)} position={[0, WHEEL_R + h / 2 - 0.02, 0]} />;
}

function Wheels({ p, xs, refs }: { p: Palette; xs: number[]; refs: MutableRefObject<(THREE.Group | null)[]> }) {
  const spots = xs.flatMap((x) => [0.26, -0.26].map((z) => [x, z] as const));
  return (
    <>
      {spots.map(([x, z], i) => (
        <Wheel
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          p={p}
          position={[x, WHEEL_R, z]}
          r={WHEEL_R}
        />
      ))}
    </>
  );
}

/** Drives the shared root transform and wheel spin for either bot. */
function useBot(state: MutableRefObject<BotState>) {
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    const s = state.current;
    if (root.current) {
      root.current.position.set(s.x, FLOOR + s.lift, 0);
      root.current.rotation.z = s.rot;
    }
    for (const w of wheels.current) if (w) w.rotation.z = s.wheel;
  });
  return { root, wheels };
}

/** The wedge: low, blunt, and built to get underneath the other one. */
function Wedge({ p, state }: { p: Palette; state: MutableRefObject<BotState> }) {
  const { root, wheels } = useBot(state);
  return (
    <group ref={root}>
      <Chassis p={p} w={0.8} h={0.2} />
      {/* The ramp. Its leading edge sits a few hundredths off the floor, which is the whole trick. */}
      <Part p={p} geo={box(0.5, 0.04, 0.58)} mat={p.dark} position={[0.5, 0.16, 0]} rotation={[0, 0, -RAMP_TILT]} />
      <Part p={p} geo={box(0.44, 0.05, 0.24)} mat={p.core} edge={false} position={[-0.06, 0.36, 0]} />
      <Part p={p} geo={box(0.12, 0.1, 0.1)} mat={p.dark} position={[-0.32, 0.39, 0]} />
      <Wheels p={p} xs={[0.24, -0.26]} refs={wheels} />
    </group>
  );
}

/** The spinner: a bar on a post, which is terrifying until someone gets under it. */
function Spinner({ p, state, bar }: { p: Palette; state: MutableRefObject<BotState>; bar: MutableRefObject<THREE.Group | null> }) {
  const { root, wheels } = useBot(state);
  return (
    <group ref={root}>
      <Chassis p={p} w={0.72} h={0.26} />
      <Part p={p} geo={cyl(0.06, 0.16, 10)} mat={p.dark} position={[0, 0.48, 0]} />
      <group
        ref={(el) => {
          bar.current = el;
        }}
        position={[0, 0.58, 0]}>
        <Part p={p} geo={box(0.86, 0.07, 0.12)} />
        {[-0.43, 0.43].map((x) => (
          <Part key={x} p={p} geo={box(0.09, 0.09, 0.14)} mat={p.core} edge={false} position={[x, 0, 0]} />
        ))}
      </group>
      <Wheels p={p} xs={[0.24, -0.24]} refs={wheels} />
    </group>
  );
}

/* Choreography. The wedge enters left, the spinner right; they feint, charge, and
   the wedge gets under and flips it. Then it shoves the wreck off stage. */
const CONTACT = 4.5;
const FLIPPED = 6.45;

/** Wedge: in, two feints, charge, back off, gloat, then push the other one out. */
const wedgeX = (left: number, right: number): Key[] => [
  [0, left - 1.4], [2.0, -1.5, easeOut],
  [2.5, -1.28], [2.9, -1.58], [3.3, -1.34], [3.7, -1.52],
  [CONTACT, -0.52, easeIn], [5.3, -0.28], [6.2, -0.62],
  [7.0, -0.44], [7.6, -0.68], [8.3, -0.5],
  [9.0, 0.35], [10.9, right + 1.7, easeIn],
];

/** Spinner: mirrors the approach, then is driven back by the charge. Past that it goes wherever it is pushed. */
const spinnerX = (right: number): Key[] => [
  [0, right + 1.4], [2.0, 1.5, easeOut],
  [2.5, 1.3], [2.9, 1.6], [3.3, 1.36], [3.7, 1.54],
  [CONTACT, 0.36, easeIn], [5.3, 0.58], [6.2, 1.02], [8.3, 1.02],
];

export function SparStation({ p, stage, time }: StationProps) {
  const wedge = useRef<BotState>({ x: -6, rot: 0, lift: 0, wheel: 0 });
  const spinner = useRef<BotState>({ x: 6, rot: 0, lift: 0, wheel: 0 });
  const bar = useRef<THREE.Group | null>(null);
  const lamp = useRef<THREE.Group>(null);
  /* The weapon is integrated rather than keyframed, so it can spin up, hold, and brake. */
  const spin = useRef({ angle: 0, t: 0 });

  useFrame(() => {
    const t = time.current;
    const st = stage.current;

    const w = wedge.current;
    w.x = kf(t, wedgeX(st.left / S, st.right / S));
    w.wheel = -w.x / WHEEL_R;
    // A short rear-up as it shoves, then level again.
    w.rot = kf(t, [[CONTACT, 0], [5.0, 0.07], [5.6, 0], [9.0, 0], [9.4, 0.05], [10.0, 0]]);

    const s = spinner.current;
    // Once it is beached the wedge simply shoves it: whichever is further right wins,
    // so the two stay exactly in contact all the way off the mat.
    s.x = Math.max(kf(t, spinnerX(st.right / S)), t > FLIPPED ? w.x + PUSH_DX : -Infinity);
    // Rides up the ramp, goes over, lands on its back with one bounce.
    s.rot = kf(t, [[CONTACT, 0], [5.3, -0.85], [6.1, -Math.PI - 0.12], [FLIPPED, -Math.PI]]);
    // Whichever is higher: the flip, or the ramp actually under it. The second one governs
    // the moment of contact, where a keyframe would let the ramp slice through the belly.
    const pen = w.x + RAMP_TIP_X - (s.x - BODY_HALF);
    const onRamp = pen > 0 ? RAMP_TIP_Y + pen * RAMP_SLOPE - BELLY_Y : 0;
    s.lift = Math.max(kf(t, [[CONTACT, 0], [5.3, 0.3], [6.0, 0.42], [6.25, BEACHED], [6.4, BEACHED + 0.07], [6.6, BEACHED]]), onRamp);
    // Wheels keep turning after the flip: nothing is telling them to stop.
    s.wheel = t < CONTACT ? -s.x / WHEEL_R : -s.x / WHEEL_R - (t - CONTACT) * 7;

    // Weapon: spins up before the charge, brakes once it is on its back.
    const rate = t < 1.5 ? 0 : t < CONTACT ? 30 + motion.boost * 25 : Math.max(0, 30 * (1 - (t - CONTACT) / 2.4));
    const dt = t - spin.current.t;
    spin.current.t = t;
    if (dt > 0) spin.current.angle += rate * dt;
    if (bar.current) bar.current.rotation.y = spin.current.angle;

    // Corner light: counts the bots in, then flashes the result.
    if (lamp.current) lamp.current.visible = t < 2.0 ? blink(t, 1.5) : between(t, FLIPPED, 8.6) ? blink(t, 5) : false;
  }, ORDER.station);

  return (
    <group>
      {/* Scaled about the floor plane: a point at y = FLOOR is left exactly where it was. */}
      <group position={[0, FLOOR * (1 - S), 0]} scale={S}>
        {/* The mat, with corner markers */}
        <Part p={p} geo={box(4.0, 0.045, 1.5)} mat={p.dark} position={[0, FLOOR + 0.022, 0]} />
        {([[-1.75, 0.6], [1.75, 0.6], [-1.75, -0.6], [1.75, -0.6]] as const).map(([x, z]) => (
          <Part key={`${x}:${z}`} p={p} geo={box(0.14, 0.02, 0.14)} mat={p.light} edge={false} position={[x, FLOOR + 0.05, z]} />
        ))}
        {/* Corner post and its judge light */}
        <Part p={p} geo={box(0.05, 0.7, 0.05)} mat={p.dark} position={[-2.05, FLOOR + 0.35, -0.6]} />
        <Part ref={lamp} p={p} geo={box(0.11, 0.11, 0.11)} mat={p.light} edge={false} position={[-2.05, FLOOR + 0.76, -0.6]} />
        <Wedge p={p} state={wedge} />
        <Spinner p={p} state={spinner} bar={bar} />
      </group>
    </group>
  );
}
