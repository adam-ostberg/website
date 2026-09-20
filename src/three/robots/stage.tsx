import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { Palette } from "../palette";
import { Part, PKG, box, cyl } from "./parts";
import { ROVER_PAD_TOP } from "./Rover";

/**
 * The stage a station plays on, in station-local units. The anchor element is
 * always STAGE_H units tall; `left/right/top/bottom` are the viewport edges so
 * robots can enter and leave through them.
 */
export type Stage = { w: number; left: number; right: number; top: number; bottom: number; floor: number };
export const STAGE_H = 3;
export const FLOOR = -STAGE_H / 2;
/** Fixed moment shown when the user prefers reduced motion. */
export const FROZEN_T = 5.2;
/** Cruising rotor speed, rad/s. */
export const SPIN = 34;
export const PKG_ON_ROVER = FLOOR + ROVER_PAD_TOP + PKG / 2;

/*
 * Frame order: scroll boost, then each station's clock, then its choreography, and
 * finally the robots (default priority 0) apply the state written in that same frame.
 */
export const ORDER = { boost: -3, clock: -2, station: -1 };

export type StationProps = {
  p: Palette;
  stage: MutableRefObject<Stage>;
  time: MutableRefObject<number>;
  /** False on weak hardware: background scenery is skipped. */
  detail: boolean;
};

/* Conveyor belts: a frame with its top at BELT_TOP and rollers along the front edge. */
export const BELT_TOP = FLOOR + 0.3;
export const PKG_ON_BELT = BELT_TOP + PKG / 2;
export const ROLLER_R = 0.07;

type BeltProps = {
  p: Palette;
  x: number;
  length: number;
  rollers: number[];
  rollerRefs: MutableRefObject<(THREE.Group | null)[]>;
};

export function Belt({ p, x, length, rollers, rollerRefs }: BeltProps) {
  const leg = length / 2 - 0.1;
  return (
    <>
      <Part p={p} geo={box(length, 0.1, 0.7)} mat={p.dark} position={[x, BELT_TOP - 0.05, 0]} />
      <Part p={p} geo={box(length, 0.06, 0.06)} position={[x, BELT_TOP - 0.13, 0.36]} />
      <Part p={p} geo={box(0.08, 0.2, 0.08)} mat={p.dark} position={[x - leg, FLOOR + 0.1, 0.3]} />
      <Part p={p} geo={box(0.08, 0.2, 0.08)} mat={p.dark} position={[x + leg, FLOOR + 0.1, 0.3]} />
      {rollers.map((rx, i) => (
        <group key={i} ref={(el) => (rollerRefs.current[i] = el)} position={[rx, BELT_TOP + 0.03, 0.42]}>
          <Part p={p} geo={cyl(ROLLER_R, 0.1, 8)} mat={p.dark} rotation={[Math.PI / 2, 0, 0]} />
        </group>
      ))}
    </>
  );
}

/** Turns a belt's rollers by how far its package moved, ignoring the jump back when the loop wraps. */
export function roll(belt: { x: number; angle: number }, x: number, rollers: (THREE.Group | null)[]) {
  belt.angle += Math.max(x - belt.x, 0) / ROLLER_R;
  belt.x = x;
  for (const g of rollers) if (g) g.rotation.z = -belt.angle;
}

/**
 * Rollers for a belt that runs whether or not anything is on it. `turns` whole
 * revolutions per loop keeps the angle continuous when the loop wraps.
 */
export function freeRoll(t: number, period: number, rollers: (THREE.Group | null)[], turns = 9) {
  const angle = (t / period) * turns * Math.PI * 2;
  for (const g of rollers) if (g) g.rotation.z = -angle;
}
