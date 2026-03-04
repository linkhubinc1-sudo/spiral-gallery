import { useEffect, useRef, useState, useCallback } from 'react';
import type { GalleryImage } from '../data/images';

interface Props {
  images: GalleryImage[];
  onSelect: (img: GalleryImage) => void;
  selectedId: number | null;
}

function getColumnCount(width: number) {
  if (width >= 1400) return 5;
  if (width >= 1100) return 4;
  if (width >= 760)  return 3;
  if (width >= 480)  return 2;
  return 2;
}

export default function MasonryGrid({ images, onSelect, selectedId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<GalleryImage[][]>([]);
  const [cols, setCols] = useState(3);

  const distribute = useCallback((imgs: GalleryImage[], colCount: number) => {
    const cols: GalleryImage[][] = Array.from({ length: colCount }, () => []);
    const heights = new Array(colCount).fill(0);
    for (const img of imgs) {
      const minCol = heights.indexOf(Math.min(...heights));
      cols[minCol].push(img);
      heights[minCol] += img.h / img.w; // normalized height
    }
    return cols;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const c = getColumnCount(w);
      setCols(c);
      setColumns(distribute(images, c));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [images, distribute]);

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      const c = getColumnCount(w);
      setCols(c);
      setColumns(distribute(images, c));
    }
  }, [images, cols, distribute]);

  return (
    <div
      ref={containerRef}
      className="flex gap-2 px-3 py-3"
      style={{ alignItems: 'flex-start' }}
    >
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 flex flex-col gap-2">
          {col.map(img => (
            <ImageTile
              key={img.id}
              img={img}
              selected={img.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ImageTile({ img, selected, onSelect }: {
  img: GalleryImage;
  selected: boolean;
  onSelect: (img: GalleryImage) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const ar = img.h / img.w;

  return (
    <button
      onClick={() => onSelect(img)}
      className="relative w-full overflow-hidden rounded-lg focus:outline-none group"
      style={{ aspectRatio: `${img.w} / ${img.h}` }}
    >
      {/* Skeleton */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-surface2"
          style={{ paddingBottom: `${ar * 100}%` }}
        />
      )}

      <img
        src={img.thumb}
        alt={img.tags.join(', ')}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${selected ? 'brightness-75' : 'group-hover:brightness-90'}`}
      />

      {/* Hover overlay */}
      <div className={`absolute inset-0 transition-opacity duration-200 ${
        selected
          ? 'opacity-100 ring-2 ring-accent ring-inset rounded-lg'
          : 'opacity-0 group-hover:opacity-100'
      }`}>
        {selected && (
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
            <p className="text-xs text-white/80 truncate">{img.tags.join(' · ')}</p>
          </div>
        )}
        {!selected && (
          <div className="absolute inset-0 bg-black/20 rounded-lg" />
        )}
      </div>
    </button>
  );
}
