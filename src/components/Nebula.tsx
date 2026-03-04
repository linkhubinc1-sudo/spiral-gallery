import { useMemo } from 'react';
import * as THREE from 'three';

function makeNebulaTexture(color: string, opacity: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  // Parse hex color to rgba
  const r = parseInt(color.slice(1,3), 16);
  const g = parseInt(color.slice(3,5), 16);
  const b = parseInt(color.slice(5,7), 16);
  gradient.addColorStop(0,   `rgba(${r},${g},${b},${opacity})`);
  gradient.addColorStop(0.3, `rgba(${r},${g},${b},${opacity * 0.5})`);
  gradient.addColorStop(0.7, `rgba(${r},${g},${b},${opacity * 0.15})`);
  gradient.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

interface NebulaProps {
  position: [number, number, number];
  color: string;
  scale: number;
  opacity?: number;
}

export default function Nebula({ position, color, scale, opacity = 0.18 }: NebulaProps) {
  const texture = useMemo(() => makeNebulaTexture(color, opacity), [color, opacity]);

  return (
    <sprite position={position} scale={[scale, scale, scale]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}
