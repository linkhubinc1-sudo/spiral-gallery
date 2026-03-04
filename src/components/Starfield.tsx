import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Starfield({ count = 6000 }: { count?: number }) {
  const meshRef = useRef<THREE.Points>(null);

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const sizes     = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 180 + Math.random() * 400;

      positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i*3+2] = r * Math.cos(phi);

      const type = Math.random();
      if (type > 0.96) {
        // blue-white
        colors[i*3] = 0.7; colors[i*3+1] = 0.85; colors[i*3+2] = 1.0;
      } else if (type > 0.92) {
        // warm yellow
        colors[i*3] = 1.0; colors[i*3+1] = 0.92; colors[i*3+2] = 0.65;
      } else {
        // cool white
        colors[i*3] = 0.88; colors[i*3+1] = 0.9; colors[i*3+2] = 1.0;
      }
      sizes[i] = 0.3 + Math.random() * 2.2;
    }
    return [positions, colors, sizes];
  }, [count]);

  useFrame(state => {
    if (!meshRef.current) return;
    // Slow drift rotation
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.012;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.007) * 0.05;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        <bufferAttribute args={[colors, 3]}    attach="attributes-color" />
        <bufferAttribute args={[sizes, 1]}     attach="attributes-size" />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.85}
        size={1.2}
      />
    </points>
  );
}
