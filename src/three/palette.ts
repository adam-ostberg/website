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

export function usePalette(ink: string, accent: string): Palette {
  const palette = useMemo<Palette>(
    () => ({
      edge: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.9 }),
      edgeSoft: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.35 }),
      // Faces are lifted well above the ink colour so light and shadow actually read.
      solid: new THREE.MeshStandardMaterial({ color: "#4a4a4a", metalness: 0.15, roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: "#262626", metalness: 0.2, roughness: 0.6 }),
      core: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9, roughness: 0.6 }),
      light: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2, roughness: 0.4 }),
      ghost: new THREE.MeshStandardMaterial({ color: "#4a4a4a", metalness: 0.15, roughness: 0.5, transparent: true }),
      ghostEdge: new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.9 }),
      ghostCore: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9, roughness: 0.6, transparent: true }),
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
