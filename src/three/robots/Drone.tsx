import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Palette } from "../palette";
import { Package, Part, PKG, box, cyl } from "./parts";
import { kf, type Key } from "./timeline";

/**
 * Quadcopter. `tilt` is the bank to settle towards, `spin` the rotor speed (rad/s),
 * `cable` the hanging cable length below the body (0 = retracted); when `carrying`,
 * a package hangs from the hook (a labelled one if `labeled`).
 */
export type DroneState = {
  x: number;
  y: number;
  tilt: number;
  spin: number;
  cable: number;
  carrying: boolean;
  labeled?: boolean;
  light: boolean;
  visible: boolean;
};

const BODY_BOTTOM = -0.07;
const MAX_TILT = 0.4;
/** Blades look the same every half turn, so faster than this per frame they appear to run backwards. */
const MAX_ROTOR_STEP = 1;
/** Diagonal pairs counter-rotate, and no two rotors share a phase. */
const ROTOR_DIR = [1, -1, -1, 1];
const ROTOR_PHASE = [0, 0.7, 1.9, 2.6];

/** Cable length needed for a hanging package's centre to sit at `packageY` when the drone is at `droneY`. */
export const cableFor = (droneY: number, packageY: number) => droneY + BODY_BOTTOM - (packageY + PKG / 2);

/** Bank for a drone flying the x-path `keys`: pitch into acceleration, lean into speed, flare when braking. */
export function bank(t: number, keys: Key[]): number {
  const h = 1 / 60;
  const a = kf(t - h, keys);
  const b = kf(t, keys);
  const c = kf(t + h, keys);
  const v = (c - a) / (2 * h);
  const acc = (c - 2 * b + a) / (h * h);
  return MAX_TILT * Math.tanh(-(v * 0.05 + acc * 0.06) / MAX_TILT);
}

export function Drone({ p, state }: { p: Palette; state: MutableRefObject<DroneState> }) {
  const root = useRef<THREE.Group>(null);
  const rotors = useRef<(THREE.Group | null)[]>([]);
  const cable = useRef<THREE.Group>(null);
  const hook = useRef<THREE.Group>(null);
  const pkg = useRef<THREE.Group>(null);
  const pkgLabeled = useRef<THREE.Group>(null);
  const lamp = useRef<THREE.Group>(null);
  const tilt = useRef(0);
  const rotor = useRef(0);

  useFrame((_, dt) => {
    const s = state.current;
    const g = root.current;
    if (!g) return;
    g.visible = s.visible;
    g.position.set(s.x, s.y, 0);
    // Ease into the requested bank so step changes in acceleration don't snap the body.
    tilt.current += (s.tilt - tilt.current) * (1 - Math.exp(-10 * Math.min(dt, 0.05)));
    g.rotation.z = tilt.current;
    rotor.current += Math.min(s.spin * dt, MAX_ROTOR_STEP);
    rotors.current.forEach((r, i) => {
      if (r) r.rotation.y = rotor.current * ROTOR_DIR[i] + ROTOR_PHASE[i];
    });
    const len = Math.max(s.cable, 0);
    if (cable.current) {
      cable.current.visible = len > 0.01;
      cable.current.scale.y = len;
      cable.current.position.y = BODY_BOTTOM - len / 2;
    }
    if (hook.current) {
      hook.current.visible = len > 0.01;
      hook.current.position.y = BODY_BOTTOM - len;
    }
    for (const [cargo, labeled] of [[pkg.current, false], [pkgLabeled.current, true]] as const) {
      if (!cargo) continue;
      cargo.visible = s.carrying && !!s.labeled === labeled;
      cargo.position.y = BODY_BOTTOM - len - PKG / 2;
    }
    if (lamp.current) lamp.current.visible = s.light;
  });

  return (
    <group ref={root}>
      <Part p={p} geo={box(0.5, 0.14, 0.5)} />
      <Part p={p} geo={box(0.9, 0.05, 0.05)} mat={p.dark} rotation={[0, Math.PI / 4, 0]} position={[0, 0.05, 0]} />
      <Part p={p} geo={box(0.9, 0.05, 0.05)} mat={p.dark} rotation={[0, -Math.PI / 4, 0]} position={[0, 0.05, 0]} />
      {(
        [
          [-0.32, 0.1, 0.32],
          [0.32, 0.1, 0.32],
          [-0.32, 0.1, -0.32],
          [0.32, 0.1, -0.32],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <group key={i} ref={(el) => (rotors.current[i] = el)} position={pos}>
          <Part p={p} geo={box(0.46, 0.02, 0.06)} mat={p.dark} edge={false} />
          <Part p={p} geo={cyl(0.04, 0.06, 8)} mat={p.dark} edge={false} />
        </group>
      ))}
      <Part ref={lamp} p={p} geo={box(0.1, 0.06, 0.1)} mat={p.light} edge={false} position={[0, 0.1, 0]} />
      <group ref={cable} position={[0, BODY_BOTTOM, 0]}>
        <mesh geometry={cyl(0.012, 1, 6)} material={p.dark} />
      </group>
      <Part ref={hook} p={p} geo={box(0.14, 0.06, 0.14)} mat={p.dark} position={[0, BODY_BOTTOM, 0]} />
      <Package ref={pkg} p={p} />
      <Package ref={pkgLabeled} p={p} label />
    </group>
  );
}
