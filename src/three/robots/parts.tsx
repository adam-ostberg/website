import { forwardRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Palette } from "../palette";

/* Geometry cache: robots share a handful of boxes and cylinders, created once. */
const cache = new Map<string, THREE.BufferGeometry>();
function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = cache.get(key) as T | undefined;
  if (!g) {
    g = make();
    cache.set(key, g);
  }
  return g;
}
export const box = (w: number, h: number, d: number) =>
  cached(`box:${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
export const cyl = (r: number, h: number, seg = 12) =>
  cached(`cyl:${r},${h},${seg}`, () => new THREE.CylinderGeometry(r, r, h, seg));
export const edgesOf = (g: THREE.BufferGeometry) =>
  cached(`edges:${g.uuid}`, () => new THREE.EdgesGeometry(g, 20));

type Vec3 = [number, number, number];

type PartProps = {
  p: Palette;
  geo: THREE.BufferGeometry;
  mat?: THREE.Material;
  edge?: THREE.Material | false;
  position?: Vec3;
  rotation?: Vec3;
  scale?: Vec3 | number;
  children?: ReactNode;
};

/** A mesh with its outline. */
export const Part = forwardRef<THREE.Group, PartProps>(function Part(
  { p, geo, mat, edge, position, rotation, scale, children },
  ref
) {
  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} material={mat ?? p.solid} />
      {edge !== false && <lineSegments geometry={edgesOf(geo)} material={edge ?? p.edge} />}
      {children}
    </group>
  );
});

export const PKG = 0.5;

/** A cardboard-ish box with a band of accent tape; `label` adds the lit stamp a processed box gets. */
export const Package = forwardRef<THREE.Group, { p: Palette; position?: Vec3; ghost?: boolean; label?: boolean }>(function Package(
  { p, position, ghost, label },
  ref
) {
  return (
    <group ref={ref} position={position}>
      <mesh geometry={box(PKG, PKG, PKG)} material={ghost ? p.ghost : p.solid} />
      <lineSegments geometry={edgesOf(box(PKG, PKG, PKG))} material={ghost ? p.ghostEdge : p.edge} />
      <mesh geometry={box(PKG + 0.02, 0.09, PKG + 0.02)} material={ghost ? p.ghostCore : p.core} />
      {label && <mesh geometry={box(0.2, 0.1, 0.02)} material={p.light} position={[0, 0.14, PKG / 2 + 0.01]} />}
    </group>
  );
});

/** Wheel: axis along z, spun through the outer group's rotation.z. */
export const Wheel = forwardRef<THREE.Group, { p: Palette; position: Vec3; r?: number }>(function Wheel(
  { p, position, r = 0.16 },
  ref
) {
  return (
    <group ref={ref} position={position}>
      <Part p={p} geo={cyl(r, 0.1, 10)} mat={p.dark} rotation={[Math.PI / 2, 0, 0]} />
      <Part p={p} geo={box(r * 1.2, 0.04, 0.11)} mat={p.light} edge={false} />
    </group>
  );
});
