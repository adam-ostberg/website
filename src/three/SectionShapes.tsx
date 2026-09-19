import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePalette, variants, type Variant } from "./shapes";

/**
 * Finds every `[data-shape]` element in the page and renders a 3D shape that
 * tracks its on-screen position. Lay the anchor out with CSS and the shape follows.
 * Optional `data-ink` / `data-accent` attributes tint the shape for its section.
 */
export function SectionShapes({ frozen }: { frozen: boolean }) {
  const [anchors, setAnchors] = useState<HTMLElement[]>([]);
  useEffect(() => {
    const collect = () => setAnchors(Array.from(document.querySelectorAll<HTMLElement>("[data-shape]")));
    collect();
    const id = requestAnimationFrame(collect);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <>
      {anchors.map((el, i) => (
        <AnchoredShape key={i} el={el} frozen={frozen} />
      ))}
    </>
  );
}

function AnchoredShape({ el, frozen }: { el: HTMLElement; frozen: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();
  const variant = (el.dataset.shape as Variant) || "cube";
  const palette = usePalette(el.dataset.ink || "#1e1e1e", el.dataset.accent || "#d45bb6");

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const margin = r.height;
    const visible = r.height > 0 && cy > -margin && cy < size.height + margin;
    g.visible = visible;
    if (!visible) return;

    g.position.set((cx / size.width - 0.5) * viewport.width, (0.5 - cy / size.height) * viewport.height, 0);
    g.scale.setScalar((r.height / size.height) * viewport.height * 0.4);

    const t = frozen ? 0 : state.clock.elapsedTime;
    const sc = window.scrollY * 0.0012;
    g.rotation.set(0.5 + t * 0.12 + sc * 0.35, t * 0.2 + sc * 0.6, 0);
  });

  const Shape = variants[variant] ?? variants.cube;
  return (
    <group ref={group} visible={false}>
      <Shape frozen={frozen} palette={palette} />
    </group>
  );
}
