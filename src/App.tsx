import { useState, useEffect } from 'react';
import { Search, X, Pencil, ExternalLink, Loader2 } from 'lucide-react';
import { fetchArtworks } from './data/artwork';
import type { Artwork } from './data/artwork';
import SpaceScene from './components/SpaceScene';
import TraceMode from './components/TraceMode';
import './index.css';

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [tracing, setTracing]   = useState<Artwork | null>(null);

  useEffect(() => {
    fetchArtworks()
      .then(data => { setArtworks(data); setLoading(false); })
      .catch(() => {
        setError('Failed to load artworks');
        setLoading(false);
      });
  }, []);

  function handleSelect(art: Artwork) {
    setSelected(prev => prev?.id === art.id ? null : art);
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000008', position: 'relative' }}>

      {/* ── 3D Scene ─────────────────────────────── */}
      {!loading && !error && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <SpaceScene
            artworks={artworks}
            selected={selected}
            query={query}
            onSelect={handleSelect}
          />
        </div>
      )}

      {/* ── Loading ───────────────────────────────── */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-50">
          <Loader2 size={32} className="text-amber-400 animate-spin" />
          <p className="text-white/40 text-sm tracking-widest uppercase">Loading Collection</p>
        </div>
      )}

      {/* ── Error ─────────────────────────────────── */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <p className="text-white/40 text-sm">{error}</p>
        </div>
      )}

      {/* ── Top UI overlay ────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,10,0.9) 0%, transparent 100%)' }}>

          {/* Logo */}
          <div className="pointer-events-auto flex-shrink-0 font-bold text-[15px] tracking-tight select-none">
            <span className="text-amber-400">✦</span>
            <span className="text-white/60 ml-1 text-sm">spiral</span>
          </div>

          {/* Search */}
          <div className="pointer-events-auto flex-1 max-w-lg relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search artworks, artists, styles…"
              className="w-full rounded-full pl-8 pr-8 py-2 text-sm text-white/80 placeholder:text-white/25 border border-white/10 focus:outline-none focus:border-amber-400/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Count */}
          {!loading && (
            <span className="pointer-events-none text-xs text-white/20 flex-shrink-0 hidden sm:block">
              {artworks.length} works
            </span>
          )}
        </div>
      </div>

      {/* ── Hint (when no selection) ──────────────── */}
      {!loading && !selected && !query && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none fade-in">
          <p className="text-white/20 text-xs text-center tracking-wide">
            Scroll to zoom · Drag to orbit · Click to explore
          </p>
        </div>
      )}

      {/* ── Detail panel ──────────────────────────── */}
      {selected && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="md:hidden fixed inset-0 z-30 fade-in"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onClick={() => setSelected(null)}
          />

          {/* Panel — right sidebar desktop, bottom sheet mobile */}
          <div
            className="fixed z-40 fade-up
              bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto
              md:bottom-auto md:top-0 md:right-0 md:left-auto md:w-80 md:h-full"
            style={{
              background: 'rgba(5,5,18,0.96)',
              backdropFilter: 'blur(32px)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              borderLeft: 'none',
            }}
          >
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-2.5 pb-1">
              <div className="w-8 h-1 rounded-full bg-white/15" />
            </div>

            {/* Image */}
            <div className="relative">
              <img
                src={selected.thumbUrl}
                alt={selected.title}
                className="w-full object-cover"
                style={{ maxHeight: '45vh', objectFit: 'cover' }}
              />
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to bottom, transparent 50%, rgba(5,5,18,0.95) 100%)' }} />
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white text-sm transition-colors"
                style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
              >✕</button>
            </div>

            {/* Meta */}
            <div className="px-4 pt-3 pb-2">
              <h2 className="text-sm font-semibold text-white/90 leading-snug">{selected.title}</h2>
              <p className="text-xs text-white/40 mt-0.5">{selected.artist}</p>
              {selected.medium && (
                <p className="text-xs text-white/25 mt-1 italic">{selected.medium}</p>
              )}
              {selected.categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selected.categories.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full text-white/35"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 pb-6 pt-2 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => { setTracing(selected); setSelected(null); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #e8c547, #f59e0b)', color: '#000' }}
              >
                <Pencil size={13} /> Trace This Work
              </button>
              <a
                href={`https://www.artic.edu/artworks/${selected.id}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <ExternalLink size={12} /> View on Art Institute
              </a>
            </div>
          </div>
        </>
      )}

      {/* ── Trace mode ────────────────────────────── */}
      {tracing && (
        <TraceMode artwork={tracing} onClose={() => setTracing(null)} />
      )}
    </div>
  );
}
