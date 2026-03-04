import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Artwork } from '../data/artwork';

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

interface Props {
  artwork: Artwork;
  physPos: THREE.Vector3;   // live physics position (shared ref)
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}

export default function ImagePlane({ artwork, physPos, selected, dimmed, onClick }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let alive = true;
    loader.load(
      artwork.thumbUrl,
      tex => { if (alive) { tex.colorSpace = THREE.SRGBColorSpace; setTexture(tex); } },
      undefined,
      () => {} // silently fail
    );
    return () => { alive = false; };
  }, [artwork.thumbUrl]);

  const [pw, ph] = useMemo(() => {
    const max = 5.5;
    const ar = artwork.w / artwork.h;
    return ar >= 1 ? [max, max / ar] : [max * ar, max];
  }, [artwork.w, artwork.h]);

  useFrame(state => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Follow physics position
    groupRef.current.position.copy(physPos);

    // Target scale
    const ts = dimmed ? 0.01 : selected ? 1.15 : hovered ? 1.08 : 1;
    const s  = groupRef.current.scale.x;
    groupRef.current.scale.setScalar(s + (ts - s) * 0.12);

    // Softly face camera
    groupRef.current.lookAt(state.camera.position);

    // Glow intensity
    const glow = groupRef.current.children[0] as THREE.Mesh;
    if (glow?.material) {
      const m = glow.material as THREE.MeshBasicMaterial;
      const targetOp = selected ? (0.3 + Math.sin(t * 2) * 0.1) : hovered ? 0.18 : 0.03;
      m.opacity += (targetOp - m.opacity) * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={physPos.clone()}>
      {/* Glow halo */}
      <mesh renderOrder={-1}>
        <planeGeometry args={[pw + 2, ph + 2]} />
        <meshBasicMaterial
          color={selected ? '#7eb8f7' : '#e8c547'}
          transparent opacity={0.03}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Thin rim */}
      <mesh>
        <planeGeometry args={[pw + 0.1, ph + 0.1]} />
        <meshBasicMaterial
          color={selected ? '#7eb8f7' : hovered ? '#e8c547' : '#888888'}
          transparent opacity={dimmed ? 0 : selected ? 0.7 : 0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Image face */}
      <mesh
        onClick={e => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { setHovered(true);  document.body.style.cursor = 'pointer'; }}
        onPointerOut={() =>  { setHovered(false); document.body.style.cursor = 'auto'; }}
      >
        <planeGeometry args={[pw, ph]} />
        <meshBasicMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#111122'}
          transparent opacity={dimmed ? 0 : 1}
        />
      </mesh>
    </group>
  );
}
