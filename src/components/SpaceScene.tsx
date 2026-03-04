import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import type { Artwork } from '../data/artwork';
import Starfield from './Starfield';
import Nebula from './Nebula';
import ImageCloud from './ImageCloud';

interface Props {
  artworks: Artwork[];
  selected: Artwork | null;
  query: string;
  onSelect: (a: Artwork) => void;
}

export default function SpaceScene({ artworks, selected, query, onSelect }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 95], fov: 52, near: 0.5, far: 800 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ background: '#000008', width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#000008']} />
      <fogExp2 attach="fog" args={['#00000e', 0.004]} />

      <Suspense fallback={null}>
        <Starfield count={5500} />

        {/* Nebula clouds */}
        <Nebula position={[-90, 40, -120]} color="#1e1b4b" scale={160} opacity={0.22} />
        <Nebula position={[110, -30, -100]} color="#0c4a6e" scale={130} opacity={0.18} />
        <Nebula position={[10, 70, -150]} color="#4a1942" scale={180} opacity={0.16} />
        <Nebula position={[-50, -60, -90]} color="#064e3b" scale={120} opacity={0.12} />

        {artworks.length > 0 && (
          <ImageCloud
            artworks={artworks}
            selected={selected}
            query={query}
            onSelect={onSelect}
          />
        )}
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={160}
        autoRotate={!selected}
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.04}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          intensity={1.2}
          levels={7}
        />
      </EffectComposer>
    </Canvas>
  );
}
