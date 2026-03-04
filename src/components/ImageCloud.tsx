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

// Fibonacci sphere — images on a sphere surface
function fibSphere(n: number, r: number): THREE.Vector3[] {
  const phi = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y     = 1 - (i / (n - 1)) * 2;
    const rad   = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    const jitter = r * 0.08;
    return new THREE.Vector3(
      Math.cos(theta) * rad * r + (Math.random() - 0.5) * jitter,
      y * r                      + (Math.random() - 0.5) * jitter,
      Math.sin(theta) * rad * r  + (Math.random() - 0.5) * jitter,
    );
  });
}

export default function ImageCloud({ artworks, selected, query, onSelect }: Props) {
  const { camera } = useThree();

  // Physics state: pos + velocity per artwork
  const physics = useRef<{ pos: THREE.Vector3; vel: THREE.Vector3 }[]>([]);
  const targets  = useRef<THREE.Vector3[]>([]);
  const globeRef = useRef<THREE.Group>(null);

  // Initialize on first artworks load
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

  // Update target positions when selection or query changes
  useEffect(() => {
    if (!artworks.length || !targets.current.length) return;

    if (selected) {
      const selIdx = artworks.findIndex(a => a.id === selected.id);
      artworks.forEach((art, i) => {
        const score = similarityScore(art, selected);
        if (i === selIdx) {
          // Selected image moves forward toward camera
          const dir = camera.position.clone().normalize();
          targets.current[i] = basePositions[selIdx].clone().add(dir.multiplyScalar(10));
        } else if (score > 0) {
          // Similar: cluster near selected
          const mix = Math.min(score / 4, 1);
          targets.current[i] = basePositions[i].clone().lerp(basePositions[selIdx], mix * 0.45);
        } else {
          // Dissimilar: drift outward
          targets.current[i] = basePositions[i].clone().multiplyScalar(1.25);
        }
      });
    } else {
      // Reset to base sphere positions
      artworks.forEach((_, i) => {
        targets.current[i] = basePositions[i].clone();
      });
    }
  }, [selected, artworks, basePositions, camera.position]);

  useFrame((_state, delta) => {
    if (!globeRef.current) return;

    // Globe slow auto-rotation (slows when zoomed in)
    const dist = camera.position.length();
    const spinSpeed = Math.max(0, (dist - 25) / 80) * 0.06;
    globeRef.current.rotation.y += spinSpeed * delta;

    // Physics simulation
    const phys = physics.current;
    const tgts = targets.current;
    if (!phys.length || !tgts.length) return;

    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();

    for (let i = 0; i < phys.length; i++) {
      const p = phys[i];

      // Spring toward target
      tmpA.copy(tgts[i]).sub(p.pos);
      const springK = 1.8;
      p.vel.addScaledVector(tmpA, springK * delta);

      // Repulsion from nearby images (spatially limited)
      for (let j = i + 1; j < phys.length; j++) {
        tmpB.copy(p.pos).sub(phys[j].pos);
        const d2 = tmpB.lengthSq();
        const minD = 6;
        if (d2 < minD * minD && d2 > 0.001) {
          const force = (minD * minD - d2) * 0.4 * delta;
          tmpB.normalize().multiplyScalar(force);
          p.vel.add(tmpB);
          phys[j].vel.sub(tmpB);
        }
      }

      // Damping
      p.vel.multiplyScalar(Math.pow(0.25, delta));

      // Integrate
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
