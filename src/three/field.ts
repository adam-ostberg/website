/**
 * Builds the neural particle field: a clustered point cloud plus a sparse set of
 * nearest-neighbour edges. Deterministic, so the layout is the same on every load.
 */
export type FieldData = {
  positions: Float32Array;
  seeds: Float32Array;
  accents: Float32Array;
  linePositions: Float32Array;
  lineSeeds: Float32Array;
  lineAccents: Float32Array;
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLUSTERS: [number, number, number][] = [
  [-2.6, 0.9, -0.4],
  [1.4, -1.1, 0.3],
  [3.2, 1.3, -0.8],
  [-0.4, 1.9, 0.6],
  [0.6, -2.2, -0.5],
  [-3.4, -1.4, 0.2],
];

export function buildField(count: number, seed = 7): FieldData {
  const rand = mulberry32(seed);
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const accents = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (rand() < 0.5) {
      const c = CLUSTERS[(rand() * CLUSTERS.length) | 0];
      x = c[0] + gauss() * 0.85;
      y = c[1] + gauss() * 0.6;
      z = c[2] + gauss() * 0.55;
    } else {
      x = gauss() * 2.9;
      y = gauss() * 1.6;
      z = gauss() * 1.1;
    }
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    seeds[i] = rand();
    accents[i] = rand() < 0.09 ? 1 : 0;
  }

  // Nearest-neighbour edges via a coarse spatial hash.
  const maxDist = 1.0;
  const maxDist2 = maxDist * maxDist;
  const neighboursPerPoint = 2;
  const cell = maxDist;
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number, z: number) =>
    `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  for (let i = 0; i < count; i++) {
    const k = key(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
  }

  const edges = new Set<number>();
  const pairs: number[] = [];
  const candidates: { j: number; d2: number }[] = [];
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const cz = Math.floor(z / cell);
    candidates.length = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!bucket) continue;
          for (const j of bucket) {
            if (j === i) continue;
            const ex = positions[j * 3] - x;
            const ey = positions[j * 3 + 1] - y;
            const ez = positions[j * 3 + 2] - z;
            const d2 = ex * ex + ey * ey + ez * ez;
            if (d2 < maxDist2) candidates.push({ j, d2 });
          }
        }
      }
    }
    candidates.sort((a, b) => a.d2 - b.d2);
    for (let n = 0; n < Math.min(neighboursPerPoint, candidates.length); n++) {
      const j = candidates[n].j;
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      const id = a * count + b;
      if (edges.has(id)) continue;
      edges.add(id);
      pairs.push(a, b);
    }
  }

  const edgeCount = pairs.length / 2;
  const linePositions = new Float32Array(edgeCount * 2 * 3);
  const lineSeeds = new Float32Array(edgeCount * 2);
  const lineAccents = new Float32Array(edgeCount * 2);
  for (let e = 0; e < edgeCount; e++) {
    for (let end = 0; end < 2; end++) {
      const p = pairs[e * 2 + end];
      const v = e * 2 + end;
      linePositions[v * 3] = positions[p * 3];
      linePositions[v * 3 + 1] = positions[p * 3 + 1];
      linePositions[v * 3 + 2] = positions[p * 3 + 2];
      lineSeeds[v] = seeds[p];
      lineAccents[v] = accents[p];
    }
  }

  return { positions, seeds, accents, linePositions, lineSeeds, lineAccents };
}
