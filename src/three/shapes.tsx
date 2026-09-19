import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Variant = "cube" | "frame" | "cluster" | "octa";

/** Materials for one shape, tinted for the section it sits on. */
export type Palette = {
  edge: THREE.LineBasicMaterial;
  edgeSoft: THREE.LineBasicMaterial;
  solid: THREE.MeshStandardMaterial;
  core: THREE.MeshStandardMaterial;
};

export function usePalette(ink: string, accent: string): Palette {
  const palette = useMemo<Palette>(
    () => ({
      edge: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.9 }),
      edgeSoft: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.35 }),
      // Faces are lifted well above the ink colour so light and shadow actually read.
      solid: new THREE.MeshStandardMaterial({ color: "#4a4a4a", metalness: 0.15, roughness: 0.5 }),
      core: new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.9,
        roughness: 0.6,
      }),
    }),
    [ink, accent]
  );
  useEffect(
    () => () => {
      Object.values(palette).forEach((m) => m.dispose());
    },
    [palette]
  );
  return palette;
}

function useGeo<T extends THREE.BufferGeometry>(factory: () => T, deps: unknown[] = []): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geo = useMemo(factory, deps);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

export type ShapeProps = { frozen: boolean; palette: Palette };

/** Solid cube with lit edges and a slowly counter-rotating wire halo. */
export function CubeShape({ frozen, palette }: ShapeProps) {
  const box = useGeo(() => new THREE.BoxGeometry(1.3, 1.3, 1.3));
  const edges = useGeo(() => new THREE.EdgesGeometry(box), [box]);
  const halo = useGeo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2.1, 2.1, 2.1)));
  const haloRef = useRef<THREE.LineSegments>(null);
  useFrame((st) => {
    if (!haloRef.current || frozen) return;
    const t = st.clock.elapsedTime;
    haloRef.current.rotation.set(t * -0.1, t * 0.16, 0);
  });
  return (
    <group>
      <mesh geometry={box} material={palette.solid} />
      <lineSegments geometry={edges} material={palette.edge} />
      <lineSegments ref={haloRef} geometry={halo} material={palette.edgeSoft} />
    </group>
  );
}

/** Two nested wire cubes around a glowing core. */
export function FrameShape({ frozen, palette }: ShapeProps) {
  const outer = useGeo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.7, 1.7, 1.7)));
  const inner = useGeo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.05, 1.05, 1.05)));
  const core = useGeo(() => new THREE.BoxGeometry(0.34, 0.34, 0.34));
  const innerRef = useRef<THREE.LineSegments>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    if (frozen) return;
    const t = st.clock.elapsedTime;
    innerRef.current?.rotation.set(t * -0.35, t * -0.25, 0);
    coreRef.current?.rotation.set(t * 0.5, t * 0.4, 0);
  });
  return (
    <group>
      <lineSegments geometry={outer} material={palette.edge} />
      <lineSegments ref={innerRef} geometry={inner} material={palette.edgeSoft} />
      <mesh ref={coreRef} geometry={core} material={palette.core} />
    </group>
  );
}

/** A 3x3x3 grid of small cubes with a glowing centre. */
export function ClusterShape({ palette }: ShapeProps) {
  const small = useGeo(() => new THREE.BoxGeometry(0.34, 0.34, 0.34));
  const edges = useGeo(() => new THREE.EdgesGeometry(small), [small]);
  const cells = useMemo(() => {
    const out: [number, number, number][] = [];
    const step = 0.46;
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) out.push([x * step, y * step, z * step]);
    return out;
  }, []);
  return (
    <group>
      {cells.map((p, i) => {
        const centre = p[0] === 0 && p[1] === 0 && p[2] === 0;
        return (
          <group key={i} position={p}>
            <mesh geometry={small} material={centre ? palette.core : palette.solid} />
            <lineSegments geometry={edges} material={palette.edgeSoft} />
          </group>
        );
      })}
    </group>
  );
}

/** Solid octahedron with a larger wire twin. */
export function OctaShape({ frozen, palette }: ShapeProps) {
  const octa = useGeo(() => new THREE.OctahedronGeometry(1.1));
  const edges = useGeo(() => new THREE.EdgesGeometry(octa), [octa]);
  const halo = useGeo(() => new THREE.EdgesGeometry(new THREE.OctahedronGeometry(1.75)));
  const haloRef = useRef<THREE.LineSegments>(null);
  useFrame((st) => {
    if (!haloRef.current || frozen) return;
    const t = st.clock.elapsedTime;
    haloRef.current.rotation.set(t * 0.12, t * -0.18, 0);
  });
  return (
    <group>
      <mesh geometry={octa} material={palette.solid} />
      <lineSegments geometry={edges} material={palette.edge} />
      <lineSegments ref={haloRef} geometry={halo} material={palette.edgeSoft} />
    </group>
  );
}

export const variants: Record<Variant, (p: ShapeProps) => React.JSX.Element> = {
  cube: CubeShape,
  frame: FrameShape,
  cluster: ClusterShape,
  octa: OctaShape,
};
