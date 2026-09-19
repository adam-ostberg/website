import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Palette } from "../palette";
import { Package, Part, box, cyl } from "./parts";

/** Two-link planar arm driven by joint angles (radians). `holding` shows a package in the gripper. */
export type ArmState = { shoulder: number; elbow: number; grip: number; holding: boolean };
export type Joints = [shoulder: number, elbow: number];

const L1 = 1.1;
const L2 = 0.9;
const SHOULDER_Y = 0.55;
/** Distance from the wrist joint down to the centre of a held package. */
const WRIST_TO_PACKAGE = 0.38;

/**
 * Joint angles that put a held package's centre at (x, y) relative to the base.
 * `elbow` picks the bend: +1 for targets on the left, -1 on the right, so the elbow stays up.
 */
export function reach(x: number, y: number, elbow: 1 | -1): Joints {
  const wy = y + WRIST_TO_PACKAGE - SHOULDER_Y;
  const d = Math.min(Math.hypot(x, wy), L1 + L2 - 1e-3);
  const c = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const e = elbow * Math.acos(THREE.MathUtils.clamp(c, -1, 1));
  const s = Math.atan2(-x, wy) - Math.atan2(L2 * Math.sin(e), L1 + L2 * Math.cos(e));
  return [s, e];
}

/** Joint-space blend between two poses; swinging from one elbow side to the other passes over the top. */
export const mix = (a: Joints, b: Joints, f: number): Joints => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

export function Arm({ p, state, position }: { p: Palette; state: MutableRefObject<ArmState>; position: [number, number, number] }) {
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const fingerL = useRef<THREE.Group>(null);
  const fingerR = useRef<THREE.Group>(null);
  const held = useRef<THREE.Group>(null);

  useFrame(() => {
    const s = state.current;
    if (shoulder.current) shoulder.current.rotation.z = s.shoulder;
    if (elbow.current) elbow.current.rotation.z = s.elbow;
    if (wrist.current) wrist.current.rotation.z = -(s.shoulder + s.elbow);
    // Closed, the fingers' inner faces touch the package sides.
    const open = 0.28 + 0.08 * (1 - s.grip);
    if (fingerL.current) fingerL.current.position.x = -open;
    if (fingerR.current) fingerR.current.position.x = open;
    if (held.current) held.current.visible = s.holding;
  });

  return (
    <group position={position}>
      <Part p={p} geo={cyl(0.42, 0.18, 16)} mat={p.dark} position={[0, 0.09, 0]} />
      <Part p={p} geo={box(0.44, 0.4, 0.44)} position={[0, 0.37, 0]} />
      <group ref={shoulder} position={[0, SHOULDER_Y, 0]}>
        <Part p={p} geo={cyl(0.16, 0.5, 12)} mat={p.dark} rotation={[Math.PI / 2, 0, 0]} />
        <Part p={p} geo={box(0.2, L1, 0.2)} position={[0, L1 / 2, 0]} />
        <group ref={elbow} position={[0, L1, 0]}>
          <Part p={p} geo={cyl(0.13, 0.44, 12)} mat={p.dark} rotation={[Math.PI / 2, 0, 0]} />
          <Part p={p} geo={box(0.16, L2, 0.16)} position={[0, L2 / 2, 0]} />
          <group ref={wrist} position={[0, L2, 0]}>
            <Part p={p} geo={box(0.78, 0.1, 0.22)} mat={p.dark} position={[0, -0.06, 0]} />
            <Part ref={fingerL} p={p} geo={box(0.06, 0.3, 0.16)} position={[-0.36, -0.26, 0]} />
            <Part ref={fingerR} p={p} geo={box(0.06, 0.3, 0.16)} position={[0.36, -0.26, 0]} />
            <Part p={p} geo={box(0.1, 0.06, 0.1)} mat={p.light} edge={false} position={[0, -0.06, 0.13]} />
            <Package ref={held} p={p} position={[0, -WRIST_TO_PACKAGE, 0]} />
          </group>
        </group>
      </group>
    </group>
  );
}
