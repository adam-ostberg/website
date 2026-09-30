import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildField, CLUSTERS } from "./field";
import { pointer } from "../lib/world";

/** Activation pulses in flight at once, and how fast their ring spreads (world units per second). */
const PULSES = 4;
const PULSE_SPEED = 3.4;
const PULSE_LIFE = 5.5;

/* Shared displacement: slow organic drift, cursor repulsion, scroll-driven expansion. */
const displaceGLSL = /* glsl */ `
  #define PULSE_SPEED ${PULSE_SPEED.toFixed(1)}
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouseNdc;     // cursor in normalized device coords (-1..1)
  uniform vec2 uHalfView;     // half viewport size in world units at z = 0
  uniform float uCamZ;        // camera distance from the z = 0 plane
  uniform vec2 uOffset;       // group position (x, y)
  uniform float uScaleX;      // group x scale
  uniform float uMouseActive;
  /* Activation pulses: xy = origin in group-local space, z = age in seconds (negative when unused). */
  uniform vec4 uPulse[${PULSES}];

  /* Cursor position projected onto the depth of this particle, in group-local space. */
  vec2 mouseAtDepth(vec3 p) {
    float worldZ = p.z;
    float depthScale = (uCamZ - worldZ) / uCamZ;
    vec2 world = uMouseNdc * uHalfView * depthScale;
    return (world - uOffset) / vec2(uScaleX, 1.0);
  }

  /* How strongly the expanding rings of the pulses are passing through this point right now. */
  float pulseAt(vec3 base) {
    float lit = 0.0;
    for (int i = 0; i < ${PULSES}; i++) {
      float age = uPulse[i].z;
      if (age < 0.0) continue;
      float d = length((base.xy - uPulse[i].xy) * vec2(uScaleX, 1.0));
      float ring = smoothstep(0.75, 0.0, abs(d - age * PULSE_SPEED));
      lit += ring * exp(-age * 0.7);
    }
    return min(lit, 1.3);
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
  uniform float uMask;
  varying float vGlow;
  varying float vAccent;
  varying float vDepth;
  varying float vMask;

  void main() {
    vec3 p = displace(position, aSeed);
    float dm = length((p.xy - mouseAtDepth(p)) * vec2(uScaleX, 1.0));
    vGlow = max(smoothstep(2.1, 0.0, dm) * uMouseActive, pulseAt(position));
    vAccent = aAccent;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = clamp((-mv.z - 5.0) / 14.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
    vMask = mix(1.0, smoothstep(-0.4, 0.1, gl_Position.x / gl_Position.w), uMask);
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
  varying float vMask;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = smoothstep(0.5, 0.12, r);
    vec3 col = mix(uColor, uAccent, max(vAccent, vGlow * 0.85));
    float bright = 0.55 + vGlow * 1.0 + vAccent * 0.4;
    gl_FragColor = vec4(col * bright, a * uOpacity * vMask * (1.0 - vDepth * 0.65));
  }
`;

const lineVert = /* glsl */ `
  ${displaceGLSL}
  attribute float aSeed;
  attribute float aAccent;
  uniform float uMask;
  varying float vGlow;
  varying float vAccent;
  varying float vDepth;
  varying float vMask;

  void main() {
    vec3 p = displace(position, aSeed);
    float dm = length((p.xy - mouseAtDepth(p)) * vec2(uScaleX, 1.0));
    vGlow = max(smoothstep(2.1, 0.0, dm) * uMouseActive, pulseAt(position));
    vAccent = aAccent;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = clamp((-mv.z - 5.0) / 14.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
    vMask = mix(1.0, smoothstep(-0.4, 0.1, gl_Position.x / gl_Position.w), uMask);
  }
`;

const lineFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vGlow;
  varying float vAccent;
  varying float vDepth;
  varying float vMask;

  void main() {
    vec3 col = mix(uColor, uAccent, max(vAccent * 0.6, vGlow * 0.9));
    float a = (0.11 + vGlow * 0.6) * uOpacity * vMask * (1.0 - vDepth * 0.75);
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
      uPulse: { value: Array.from({ length: PULSES }, () => new THREE.Vector4(0, 0, -1, 0)) },
      uMask: { value: 1 },
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

  /*
   * Activation pulses: a ring of light spreading through the graph from a point, the way a signal
   * passes through a network. They fire on their own now and then, so the field reads as alive, and
   * wherever the hero is clicked. `view` keeps what the click handler needs to place one.
   */
  const pulses = useRef({ births: Array<number>(PULSES).fill(-Infinity), next: 0, idleAt: 1.4, now: 0 });
  const view = useRef({ halfW: 1, halfH: 1, sx: 1 });
  const spawn = useRef((_x: number, _y: number) => {});
  spawn.current = (x: number, y: number) => {
    const pl = pulses.current;
    const i = pl.next;
    pl.next = (i + 1) % PULSES;
    pl.births[i] = pl.now;
    uniforms.uPulse.value[i].set(x, y, 0, 0);
  };
  useEffect(() => {
    if (frozen) return;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Links, buttons and windows keep their clicks; so does anything below the hero.
      if ((e.target as Element | null)?.closest("a, button, input, .win, .nav")) return;
      if (window.scrollY > window.innerHeight * 0.6) return;
      const v = view.current;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      spawn.current((nx * v.halfW - FIELD_OFFSET[0]) / v.sx, ny * v.halfH - FIELD_OFFSET[1]);
    };
    window.addEventListener("pointerdown", down);
    return () => window.removeEventListener("pointerdown", down);
  }, [frozen]);

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
    // Wide screens keep the left third clear for the hero text; narrow ones have no clear side.
    uniforms.uMask.value = size.width > 900 ? 1 : 0.35;

    const pl = pulses.current;
    const now = state.clock.elapsedTime;
    pl.now = now;
    view.current.halfW = viewport.width / 2;
    view.current.halfH = viewport.height / 2;
    view.current.sx = sx;
    if (!frozen && s.scroll < 0.3 && now > pl.idleAt) {
      // Pick a cluster, so idle pulses start where the graph is dense.
      const c = CLUSTERS[Math.floor(Math.random() * CLUSTERS.length)];
      spawn.current(c[0], c[1]);
      pl.idleAt = now + 4 + Math.random() * 3;
    }
    for (let i = 0; i < PULSES; i++) {
      const age = now - pl.births[i];
      uniforms.uPulse.value[i].z = age < PULSE_LIFE ? age : -1;
    }

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
