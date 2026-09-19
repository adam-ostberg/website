import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Palette } from "../palette";
import { Package, Part, PKG, Wheel, box } from "./parts";

/** Position is the ground contact point. When `loaded`, a package rides on the pad. */
export type RoverState = { x: number; y: number; loaded: boolean; light: boolean; visible: boolean };

/** Height of the top of the load pad above the ground. */
export const ROVER_PAD_TOP = 0.52;
const WHEEL_R = 0.16;

export function Rover({ p, state }: { p: Palette; state: MutableRefObject<RoverState> }) {
  const root = useRef<THREE.Group>(null);
  const wheels = useRef<(THREE.Group | null)[]>([]);
  const lamp = useRef<THREE.Group>(null);
  const load = useRef<THREE.Group>(null);

  useFrame(() => {
    const s = state.current;
    const g = root.current;
    if (!g) return;
    g.visible = s.visible;
    g.position.set(s.x, s.y, 0);
    // Rolling without slipping: wheel angle follows position.
    for (const w of wheels.current) if (w) w.rotation.z = -s.x / WHEEL_R;
    if (lamp.current) lamp.current.visible = s.light;
    if (load.current) load.current.visible = s.loaded;
  });

  return (
    <group ref={root}>
      <Part p={p} geo={box(1.0, 0.3, 0.6)} position={[0, 0.33, 0]} />
      <Part p={p} geo={box(0.62, 0.04, 0.5)} mat={p.dark} position={[0, ROVER_PAD_TOP - 0.02, 0]} />
      {(
        [
          [-0.32, 0.16, 0.32],
          [0.32, 0.16, 0.32],
          [-0.32, 0.16, -0.32],
          [0.32, 0.16, -0.32],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <Wheel
          key={i}
          ref={(el) => {
            wheels.current[i] = el;
          }}
          p={p}
          position={pos}
          r={WHEEL_R}
        />
      ))}
      <Part p={p} geo={box(0.05, 0.36, 0.05)} mat={p.dark} position={[-0.42, 0.66, 0.2]} />
      <Part ref={lamp} p={p} geo={box(0.1, 0.1, 0.1)} mat={p.light} edge={false} position={[-0.42, 0.88, 0.2]} />
      <Part p={p} geo={box(0.16, 0.08, 0.14)} mat={p.dark} position={[0.5, 0.36, 0]} />
      <Package ref={load} p={p} position={[0, ROVER_PAD_TOP + PKG / 2, 0]} />
    </group>
  );
}
