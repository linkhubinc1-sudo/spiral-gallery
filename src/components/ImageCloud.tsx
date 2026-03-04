import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Artwork } from '../data/artwork';
import { similarityScore } from '../data/artwork';
import ImagePlane from './ImagePlane';

interface Props {
  artworks: Artwork[];
  selected: Artwork | null;
  query: string;
  onSelect: (a: Artwork) => void;
}

function fibSphere(n: number, r: number): THREE.Vector3[] {
  const phi = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y      = 1 - (i / (n - 1)) * 2;
    const rad    = Math.sqrt(Math.max(0, 1 - y * y));
    const theta  = phi * i;
    const jitter = r * 0.07;
    return new THREE.Vector3(
      Math.cos(theta) * rad * r + (Math.random() - 0.5) * jitter,
      y * r                     + (Math.random() - 0.5) * jitter,
      Math.sin(theta) * rad * r + (Math.random() - 0.5) * jitter,
    );
  });
}

// ── Spatial hash for O(n) repulsion ──────────────────────────────────────────
const CELL = 7; // minimum separation distance

function cellKey(x: number, y: number, z: number): number {
  const cx = Math.floor(x / CELL);
  const cy = Math.floor(y / CELL);
  const cz = Math.floor(z / CELL);
  // Cantor-style hash — avoids string allocation
  return cx * 73856093 ^ cy * 19349663 ^ cz * 83492791;
}

// Pre-allocated scratch vectors (outside component — zero GC)
const _tmp  = new THREE.Vector3();
const _diff = new THREE.Vector3();

export default function ImageCloud({ artworks, selected, query, onSelect }: Props) {
  const { camera } = useThree();

  const physics  = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3 }[]>([]);
  const targets  = useRef<THREE.Vector3[]>([]);
  const globeRef = useRef<THREE.Group>(null);

  // Spatial hash rebuilt each frame — pre-allocated map
  const spatialHash = useRef(new Map<number, number[]>());

  const basePositions = useMemo(
    () => fibSphere(artworks.length, 32),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [artworks.length]
  );

  useEffect(() => {
    physics.current = basePositions.map(p => ({
      pos: p.clone(),
      vel: new THREE.Vector3(),
    }));
    targets.current = basePositions.map(p => p.clone());
  }, [basePositions]);

  useEffect(() => {
    if (!artworks.length || !targets.current.length) return;
    const t = targets.current;

    if (selected) {
      const selIdx = artworks.findIndex(a => a.id === selected.id);
      const dir = camera.position.clone().normalize();

      artworks.forEach((art, i) => {
        if (i === selIdx) {
          t[i] = basePositions[selIdx].clone().add(dir.multiplyScalar(12));
          return;
        }
        const score = similarityScore(art, selected);
        if (score > 0) {
          const mix = Math.min(score / 4, 1);
          t[i] = basePositions[i].clone().lerp(basePositions[selIdx], mix * 0.45);
        } else {
          t[i] = basePositions[i].clone().multiplyScalar(1.3);
        }
      });
    } else {
      artworks.forEach((_, i) => { t[i] = basePositions[i].clone(); });
    }
  }, [selected, artworks, basePositions, camera.position]);

  useFrame((_state, delta) => {
    if (!globeRef.current) return;

    // Globe spin — slows as camera zooms in
    const dist = camera.position.length();
    const spin = Math.max(0, (dist - 20) / 90) * 0.055;
    globeRef.current.rotation.y += spin * delta;

    const phys = physics.current;
    const tgts = targets.current;
    if (!phys.length || !tgts.length) return;

    // ── Step 1: Build spatial hash O(n) ──────────────────────────────────────
    const hash = spatialHash.current;
    hash.clear();
    for (let i = 0; i < phys.length; i++) {
      const key = cellKey(phys[i].pos.x, phys[i].pos.y, phys[i].pos.z);
      let bucket = hash.get(key);
      if (!bucket) { bucket = []; hash.set(key, bucket); }
      bucket.push(i);
    }

    // ── Step 2: Per-image forces O(n × k) where k ≈ constant ─────────────────
    const CELL_D2 = CELL * CELL;
    const SPRING  = 1.6;
    const DAMP    = Math.pow(0.18, delta);

    for (let i = 0; i < phys.length; i++) {
      const p = phys[i];

      // Spring toward target
      _tmp.copy(tgts[i]).sub(p.pos);
      p.vel.addScaledVector(_tmp, SPRING * delta);

      // Repulsion: only check images in the same spatial cell
      const key = cellKey(p.pos.x, p.pos.y, p.pos.z);
      const bucket = hash.get(key);
      if (bucket) {
        for (const j of bucket) {
          if (j <= i) continue;
          _diff.copy(p.pos).sub(phys[j].pos);
          const d2 = _diff.lengthSq();
          if (d2 < CELL_D2 && d2 > 0.001) {
            const force = (CELL_D2 - d2) * 0.35 * delta;
            _diff.normalize().multiplyScalar(force);
            p.vel.add(_diff);
            phys[j].vel.sub(_diff);
          }
        }
      }

      // Damping + integrate
      p.vel.multiplyScalar(DAMP);
      p.pos.addScaledVector(p.vel, delta);
    }
  });

  const q = query.toLowerCase().trim();

  return (
    <group ref={globeRef}>
      {artworks.map((art, i) => {
        const phys = physics.current[i];
        if (!phys) return null;

        const dimmed = q
          ? !(art.title.toLowerCase().includes(q) ||
              art.artist.toLowerCase().includes(q) ||
              art.categories.some(c => c.toLowerCase().includes(q)))
          : false;

        return (
          <ImagePlane
            key={art.id}
            artwork={art}
            physPos={phys.pos}
            selected={selected?.id === art.id}
            dimmed={dimmed}
            onClick={() => onSelect(art)}
          />
        );
      })}
    </group>
  );
}
