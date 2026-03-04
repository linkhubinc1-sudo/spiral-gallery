import { useState, useEffect, useCallback } from 'react';
import { Search, X, Pencil, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { fetchArtworks } from './data/artwork';
import type { Artwork } from './data/artwork';
import SpaceScene from './components/SpaceScene';
import TraceMode from './components/TraceMode';
import './index.css';

export default function App() {
  const [artworks, setArtworks]     = useState<Artwork[]>([]);
  const [status, setStatus]         = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery]           = useState('');
  const [selected, setSelected]     = useState<Artwork | null>(null);
  const [tracing, setTracing]       = useState<Artwork | null>(null);

  useEffect(() => {
    fetchArtworks()
      .then(data => { setArtworks(data); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, []);

  const handleSelect = useCallback((art: Artwork) => {
    setSelected(prev => (prev?.id === art.id ? null : art));
  }, []);

  const handleTrace = useCallback(() => {
    if (!selected) return;
    setTracing(selected);
    setSelected(null);
  }, [selected]);

  // Escape key closes panels
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelected(null); setTracing(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000008', position: 'relative' }}>

      {/* ── 3D Scene ──────────────────────────────────────────────────────── */}
      {status === 'ready' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <SpaceScene
            artworks={artworks}
            selected={selected}
            query={query}
            onSelect={handleSelect}
          />
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-50">
          <Loader2 size={28} className="text-gold animate-spin" style={{ color: 'var(--gold)' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>
            LOADING COLLECTION
          </p>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50">
          <AlertCircle size={24} style={{ color: 'rgba(255,100,100,0.6)' }} />
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Could not reach the collection API
          </p>
          <button
            onClick={() => { setStatus('loading'); fetchArtworks().then(d => { setArtworks(d); setStatus('ready'); }).catch(() => setStatus('error')); }}
            style={{ fontSize: 12, color: 'var(--gold)', border: '1px solid rgba(232,197,71,0.3)', borderRadius: 8, padding: '6px 14px', background: 'none', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,12,0.92) 0%, transparent 100%)' }}
      >
        <div className="flex items-center gap-3 px-4 pt-4 pb-6 pointer-events-auto">
          {/* Wordmark */}
          <div className="flex-shrink-0 select-none" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em' }}>
            <span style={{ color: 'var(--gold)' }}>✦</span>
            <span style={{ color: 'rgba(255,255,255,0.55)', marginLeft: 6 }}>SPIRAL</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.22)' }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search artist, medium, style…"
              style={{
                width: '100%',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 100,
                padding: '8px 32px 8px 34px',
                color: 'rgba(255,255,255,0.75)',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(232,197,71,0.4)')}
              onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                style={{ color: 'rgba(255,255,255,0.3)', opacity: 0.6 }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Count badge */}
          {status === 'ready' && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em', flexShrink: 0 }}>
              {artworks.length} WORKS
            </span>
          )}
        </div>
      </div>

      {/* ── Hint ────────────────────────────────────────────────────────────── */}
      {status === 'ready' && !selected && !query && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none fade-in text-center">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.15em' }}>
            SCROLL TO ZOOM · DRAG TO ORBIT · CLICK TO EXPLORE
          </p>
        </div>
      )}

      {/* ── Detail panel — single responsive component ─────────────────────── */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 fade-in md:hidden"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSelected(null)}
          />

          {/* Panel: bottom sheet on mobile, right sidebar on desktop */}
          <div
            className="fixed z-40 fade-up overflow-y-auto
              inset-x-0 bottom-0 max-h-[78vh] rounded-t-2xl
              md:inset-x-auto md:bottom-auto md:top-0 md:right-0 md:w-[300px] md:h-full md:rounded-none"
            style={{ background: 'rgba(4,4,22,0.97)', backdropFilter: 'blur(40px)', borderTop: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.04)' }}
          >
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-3 pb-0.5">
              <div style={{ width: 32, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Image */}
            <div className="relative" style={{ aspectRatio: `${selected.w} / ${selected.h}`, maxHeight: '42vh', overflow: 'hidden' }}>
              <img
                src={selected.thumbUrl}
                alt={selected.title}
                className="w-full h-full object-cover"
                style={{ display: 'block' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, rgba(4,4,22,0.97) 100%)' }} />
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="absolute top-3 right-3 flex items-center justify-center transition-opacity hover:opacity-100"
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 14, opacity: 0.8 }}
              >
                ✕
              </button>
            </div>

            {/* Metadata */}
            <div style={{ padding: '12px 16px 8px' }}>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>
                {selected.title}
              </h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 4, letterSpacing: '0.04em' }}>
                {selected.artist}
              </p>
              {selected.medium && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 3, fontStyle: 'italic' }}>
                  {selected.medium}
                </p>
              )}
              {selected.categories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                  {selected.categories.map(c => (
                    <span key={c} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em',
                      padding: '3px 8px', borderRadius: 100,
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                    }}>
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '10px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
              <button
                onClick={handleTrace}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, var(--gold) 0%, #d4a017 100%)',
                  color: '#000', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                  transition: 'filter 0.15s', willChange: 'filter',
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.filter = 'brightness(1.1)')}
                onMouseLeave={e => ((e.target as HTMLElement).style.filter = 'none')}
              >
                <Pencil size={13} /> Trace This Work
              </button>
              <a
                href={`https://www.artic.edu/artworks/${selected.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px', borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: 'var(--font-sans)', fontSize: 12,
                  textDecoration: 'none', transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.45)'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <ExternalLink size={11} /> View on Art Institute
              </a>
            </div>
          </div>
        </>
      )}

      {/* ── Trace mode ───────────────────────────────────────────────────────── */}
      {tracing && (
        <TraceMode artwork={tracing} onClose={() => setTracing(null)} />
      )}
    </div>
  );
}
