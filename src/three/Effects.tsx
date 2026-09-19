import { EffectComposer, Bloom } from "@react-three/postprocessing";

export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.25} intensity={0.85} mipmapBlur radius={0.7} />
    </EffectComposer>
  );
}
