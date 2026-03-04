import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { GALLERY, CAT_LABELS } from './data/images';
import type { GalleryImage, Category } from './data/images';
import MasonryGrid from './components/MasonryGrid';
import ImageDetail from './components/ImageDetail';
import TraceMode from './components/TraceMode';
import './index.css';

const ALL_CATS = Object.keys(CAT_LABELS) as Category[];

export default function App() {
  const [query, setQuery]         = useState('');
  const [activeCat, setActiveCat] = useState<Category | 'all'>('all');
  const [selected, setSelected]   = useState<GalleryImage | null>(null);
  const [tracing, setTracing]     = useState<GalleryImage | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return GALLERY.filter(img => {
      const catOk = activeCat === 'all' || img.cat === activeCat;
      const qOk   = !q || img.cat.includes(q) || img.tags.some(t => t.includes(q));
      return catOk && qOk;
    });
  }, [query, activeCat]);

  function handleSelect(img: GalleryImage) {
    setSelected(prev => prev?.id === img.id ? null : img);
  }

  function handleSimilar() {
    if (!selected) return;
    setActiveCat(selected.cat);
    setSelected(null);
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* ── Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-white/[0.06]">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-shrink-0 font-bold text-[15px] tracking-tight">
            <span className="text-accent">✦</span>
            <span className="text-white/80 ml-1">spiral</span>
          </div>

          <div className="flex-1 max-w-2xl relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search images, moods, styles…"
              className="w-full bg-surface border border-white/[0.08] rounded-full pl-9 pr-9 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-surface2 transition-all"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <span className="text-xs text-white/25 flex-shrink-0 hidden sm:block">
            {filtered.length} images
          </span>
        </div>

        {/* Category pills */}
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-2.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {(['all', ...ALL_CATS] as const).map(c => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`flex-shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-all border ${
                activeCat === c
                  ? 'bg-accent border-accent text-bg'
                  : 'bg-transparent border-white/[0.08] text-white/45 hover:text-white/70 hover:border-white/15'
              }`}
            >
              {c === 'all' ? 'All' : CAT_LABELS[c]}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main ────────────────────────────────────── */}
      <main className="flex flex-1 min-h-0 relative">

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-white/25">
              <p className="text-lg">No results</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <MasonryGrid
              images={filtered}
              onSelect={handleSelect}
              selectedId={selected?.id ?? null}
            />
          )}
        </div>

        {/* Detail sidebar — desktop */}
        <aside
          className="hidden md:flex flex-col flex-shrink-0 overflow-hidden border-l border-white/[0.06] bg-surface transition-all duration-300 ease-in-out"
          style={{ width: selected ? 320 : 0 }}
        >
          {selected && (
            <div className="w-80 h-full overflow-y-auto slide-up">
              <ImageDetail
                img={selected}
                onClose={() => setSelected(null)}
                onTrace={() => { setTracing(selected); setSelected(null); }}
                onSimilar={handleSimilar}
              />
            </div>
          )}
        </aside>

        {/* Detail sheet — mobile */}
        {selected && (
          <>
            <div
              className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm fade-in"
              onClick={() => setSelected(null)}
            />
            <div className="md:hidden fixed inset-x-0 bottom-0 z-40 max-h-[80vh] overflow-y-auto bg-surface rounded-t-2xl border-t border-white/[0.08] shadow-2xl slide-up">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mt-2.5 mb-1" />
              <ImageDetail
                img={selected}
                onClose={() => setSelected(null)}
                onTrace={() => { setTracing(selected); setSelected(null); }}
                onSimilar={handleSimilar}
              />
            </div>
          </>
        )}
      </main>

      {/* ── Trace Mode ───────────────────────────────── */}
      {tracing && (
        <TraceMode
          img={tracing}
          onClose={() => setTracing(null)}
        />
      )}
    </div>
  );
}
