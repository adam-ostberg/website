import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { EffectComposer as Composer } from "postprocessing";
import * as THREE from "three";

export function Effects() {
  const composer = useRef<Composer>(null);
  const gl = useThree((s) => s.gl);
  const dpr = useThree((s) => s.viewport.dpr);
  // The composer resizes itself when the canvas does, but not when only the pixel ratio changes.
  useEffect(() => {
    const size = gl.getSize(new THREE.Vector2());
    composer.current?.setSize(size.x, size.y);
  }, [gl, dpr]);

  return (
    <EffectComposer ref={composer} multisampling={4}>
      <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.25} intensity={0.85} mipmapBlur radius={0.7} />
    </EffectComposer>
  );
}
