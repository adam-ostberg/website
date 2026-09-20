import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildField } from "./field";
import { pointer } from "../lib/world";

/* Shared displacement: slow organic drift, cursor repulsion, scroll-driven expansion. */
const displaceGLSL = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouseNdc;     // cursor in normalized device coords (-1..1)
  uniform vec2 uHalfView;     // half viewport size in world units at z = 0
  uniform float uCamZ;        // camera distance from the z = 0 plane
  uniform vec2 uOffset;       // group position (x, y)
  uniform float uScaleX;      // group x scale
  uniform float uMouseActive;

  /* Cursor position projected onto the depth of this particle, in group-local space. */
  vec2 mouseAtDepth(vec3 p) {
    float worldZ = p.z;
    float depthScale = (uCamZ - worldZ) / uCamZ;
    vec2 world = uMouseNdc * uHalfView * depthScale;
    return (world - uOffset) / vec2(uScaleX, 1.0);
  }

  vec3 displace(vec3 p, float seed) {
    float t = uTime;
    p += vec3(
      sin(t * 0.32 + p.y * 0.8 + seed * 6.2831),
      cos(t * 0.27 + p.x * 0.6 + seed * 3.1),
      sin(t * 0.22 + p.z * 0.9 + seed * 1.7)
    ) * 0.14;

    vec2 m = mouseAtDepth(p);
    vec2 d = (p.xy - m) * vec2(uScaleX, 1.0); // measure in world units
    float dm = length(d);
    float infl = smoothstep(1.9, 0.0, dm) * uMouseActive;
    p.xy += (d / max(dm, 0.001)) * infl * 0.42 / vec2(uScaleX, 1.0);

    p.xy *= 1.0 + uScroll * 0.5;
    p.z -= uScroll * 5.0;
    return p;
  }
`;

const pointsVert = /* glsl */ `
  ${displaceGLSL}
  attribute float aSeed;
  attribute float aAccent;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vGlow;
  varying float vAccent;
  varying float vDepth;

  void main() {
    vec3 p = displace(position, aSeed);
    float dm = length((p.xy - mouseAtDepth(p)) * vec2(uScaleX, 1.0));
    vGlow = smoothstep(2.1, 0.0, dm) * uMouseActive;
    vAccent = aAccent;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = clamp((-mv.z - 5.0) / 14.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (1.0 + aAccent * 0.9 + vGlow * 1.6) * (10.0 / -mv.z);
  }
`;

const pointsFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vGlow;
  varying float vAccent;
  varying float vDepth;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = smoothstep(0.5, 0.12, r);
    vec3 col = mix(uColor, uAccent, max(vAccent, vGlow * 0.85));
    float bright = 0.55 + vGlow * 1.0 + vAccent * 0.4;
    gl_FragColor = vec4(col * bright, a * uOpacity * (1.0 - vDepth * 0.65));
  }
`;

const lineVert = /* glsl */ `
  ${displaceGLSL}
  attribute float aSeed;
  attribute float aAccent;
  varying float vGlow;
  varying float vAccent;
  varying float vDepth;

  void main() {
    vec3 p = displace(position, aSeed);
    float dm = length((p.xy - mouseAtDepth(p)) * vec2(uScaleX, 1.0));
    vGlow = smoothstep(2.1, 0.0, dm) * uMouseActive;
    vAccent = aAccent;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = clamp((-mv.z - 5.0) / 14.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const lineFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vGlow;
  varying float vAccent;
  varying float vDepth;

  void main() {
    vec3 col = mix(uColor, uAccent, max(vAccent * 0.6, vGlow * 0.9));
    float a = (0.075 + vGlow * 0.5) * uOpacity * (1.0 - vDepth * 0.75);
    gl_FragColor = vec4(col, a);
  }
`;

/** Where the field sits relative to the page centre. */
const FIELD_OFFSET: [number, number, number] = [1.2, 0.2, 0];

type Props = {
  count: number;
  interactive: boolean;
  frozen: boolean;
  /** Overall opacity. The hero keeps this low so the field reads as texture behind the robots. */
  strength: number;
};

export function ParticleField({ count, interactive, frozen, strength }: Props) {
  const data = useMemo(() => buildField(count), [count]);

  const { pointsGeo, linesGeo } = useMemo(() => {
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    pg.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    pg.setAttribute("aAccent", new THREE.BufferAttribute(data.accents, 1));
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(data.linePositions, 3));
    lg.setAttribute("aSeed", new THREE.BufferAttribute(data.lineSeeds, 1));
    lg.setAttribute("aAccent", new THREE.BufferAttribute(data.lineAccents, 1));
    return { pointsGeo: pg, linesGeo: lg };
  }, [data]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouseNdc: { value: new THREE.Vector2() },
      uHalfView: { value: new THREE.Vector2(1, 1) },
      uCamZ: { value: 10 },
      uOffset: { value: new THREE.Vector2(FIELD_OFFSET[0], FIELD_OFFSET[1]) },
      uScaleX: { value: 1 },
      uMouseActive: { value: 0 },
      uSize: { value: 3.0 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color("#e8e8e8") },
      uAccent: { value: new THREE.Color("#f386a1") },
    }),
    []
  );

  const pointsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: pointsVert,
        fragmentShader: pointsFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );
  const linesMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: lineVert,
        fragmentShader: lineFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  );

  useEffect(
    () => () => {
      pointsGeo.dispose();
      linesGeo.dispose();
      pointsMat.dispose();
      linesMat.dispose();
    },
    [pointsGeo, linesGeo, pointsMat, linesMat]
  );

  const group = useRef<THREE.Group>(null);
  const { viewport, size } = useThree();
  const smooth = useRef({ scroll: 0, mx: 0, my: 0, active: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = smooth.current;
    const kScroll = 1 - Math.exp(-6 * dt);
    const kMouse = 1 - Math.exp(-22 * dt);
    const kActive = 1 - Math.exp(-5 * dt);

    const targetScroll = THREE.MathUtils.clamp(window.scrollY / (size.height * 0.9), 0, 1);
    s.scroll += (targetScroll - s.scroll) * kScroll;

    const sx = THREE.MathUtils.clamp(viewport.width / 14, 0.55, 1);
    // Cursor follows almost instantly; only the on/off state eases.
    s.mx += (pointer.x - s.mx) * kMouse;
    s.my += (pointer.y - s.my) * kMouse;
    s.active += ((interactive ? pointer.active : 0) - s.active) * kActive;

    if (!frozen) uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = s.scroll;
    uniforms.uMouseNdc.value.set(s.mx, s.my);
    uniforms.uHalfView.value.set(viewport.width / 2, viewport.height / 2);
    uniforms.uCamZ.value = state.camera.position.z;
    uniforms.uScaleX.value = sx;
    uniforms.uMouseActive.value = s.active * (1 - s.scroll);
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    uniforms.uOpacity.value = strength * (1 - s.scroll * 0.7);

    const g = group.current;
    if (g) {
      g.scale.set(sx, 1, 1);
    }
  });

  return (
    <group ref={group} position={FIELD_OFFSET}>
      <points geometry={pointsGeo} material={pointsMat} frustumCulled={false} />
      <lineSegments geometry={linesGeo} material={linesMat} frustumCulled={false} />
    </group>
  );
}
