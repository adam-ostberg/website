import { useEffect, useMemo } from "react";
import * as THREE from "three";

/** Materials for one station, tinted for the section it sits on. */
export type Palette = {
  edge: THREE.LineBasicMaterial;
  edgeSoft: THREE.LineBasicMaterial;
  solid: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  core: THREE.MeshStandardMaterial;
  light: THREE.MeshStandardMaterial;
  /** Separate copies of solid/edge/core, so one package can fade out as a whole. */
  ghost: THREE.MeshStandardMaterial;
  ghostEdge: THREE.LineBasicMaterial;
  ghostCore: THREE.MeshStandardMaterial;
};

/**
 * `ink` draws the outlines, `accent` the lit parts. `solid`/`dark` are the body
 * greys: the defaults read against a pastel section, and the dark hero passes
 * lighter ones so the robots don't sink into the background.
 */
export function usePalette(ink: string, accent: string, solid = "#4a4a4a", dark = "#262626"): Palette {
  const palette = useMemo<Palette>(
    () => ({
      edge: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.9 }),
      edgeSoft: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.35 }),
      // Faces are lifted well away from the ink colour so light and shadow actually read.
      solid: new THREE.MeshStandardMaterial({ color: solid, metalness: 0.15, roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: dark, metalness: 0.2, roughness: 0.6 }),
      core: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9, roughness: 0.6 }),
      light: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2, roughness: 0.4 }),
      ghost: new THREE.MeshStandardMaterial({ color: solid, metalness: 0.15, roughness: 0.5, transparent: true }),
      ghostEdge: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.9 }),
      ghostCore: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9, roughness: 0.6, transparent: true }),
    }),
    [ink, accent, solid, dark]
  );
  useEffect(
    () => () => {
      Object.values(palette).forEach((m) => m.dispose());
    },
    [palette]
  );
  return palette;
}
