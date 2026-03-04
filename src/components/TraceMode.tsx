import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Lock, LockOpen, RotateCcw, Trash2, Save } from 'lucide-react';
import type { Artwork } from '../data/artwork';

interface Props { artwork: Artwork; onClose: () => void; }
type Tool = 'pen' | 'eraser';

export default function TraceMode({ artwork, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef   = useRef<HTMLDivElement>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const [locked, setLocked] = useState(false);
  const [tool, setTool]     = useState<Tool>('pen');
  const [color, setColor]   = useState('#ffffff');
  const [brush, setBrush]   = useState(5);
  const [refOp, setRefOp]   = useState(40);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [visible, setVisible] = useState(false);
  const drawing = useRef(false);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const sizeCanvas = useCallback(() => {
    const area = areaRef.current;
    const img  = imgRef.current;
    const cv   = canvasRef.current;
    if (!area || !img || !cv) return;
    const ar  = area.getBoundingClientRect();
    const ia  = artwork.w / artwork.h;
    const aa  = ar.width / ar.height;
    let w, h;
    if (ia > aa) { w = ar.width * 0.95; h = w / ia; }
    else          { h = ar.height * 0.95; w = h * ia; }
    w = Math.round(w); h = Math.round(h);
    cv.width = w; cv.height = h;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    img.style.width = w + 'px'; img.style.height = h + 'px';
    ctx.current = cv.getContext('2d');
  }, [artwork.w, artwork.h]);

  useEffect(() => {
    window.addEventListener('resize', sizeCanvas);
    return () => window.removeEventListener('resize', sizeCanvas);
  }, [sizeCanvas]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const cv = canvasRef.current!;
    const r  = cv.getBoundingClientRect();
    const sx = cv.width / r.width, sy = cv.height / r.height;
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  }

  function saveHist() {
    const cv = canvasRef.current;
    if (!cv || !ctx.current) return;
    setHistory(h => [...h.slice(-39), ctx.current!.getImageData(0, 0, cv.width, cv.height)]);
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!ctx.current) return;
    drawing.current = true; saveHist();
    const { x, y } = getPos(e);
    ctx.current.beginPath(); ctx.current.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current || !ctx.current) return;
    const { x, y } = getPos(e);
    ctx.current.globalAlpha = 1;
    ctx.current.lineWidth   = brush;
    ctx.current.lineCap = ctx.current.lineJoin = 'round';
    if (tool === 'eraser') {
      ctx.current.globalCompositeOperation = 'destination-out';
      ctx.current.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.current.globalCompositeOperation = 'source-over';
      ctx.current.strokeStyle = color;
    }
    ctx.current.lineTo(x, y); ctx.current.stroke();
    ctx.current.beginPath(); ctx.current.moveTo(x, y);
  }

  function end(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); drawing.current = false; ctx.current?.beginPath();
  }

  function undo() {
    if (!history.length || !ctx.current) return;
    ctx.current.putImageData(history[history.length - 1], 0, 0);
    setHistory(h => h.slice(0, -1));
  }

  function clear() {
    const cv = canvasRef.current;
    if (cv && ctx.current) ctx.current.clearRect(0, 0, cv.width, cv.height);
    setHistory([]);
  }

  function savePng() {
    const cv = canvasRef.current;
    if (!cv) return;
    const a  = document.createElement('a');
    a.download = `trace-${artwork.id}.png`; a.href = cv.toDataURL(); a.click();
  }

  const controlsEl = (
    <div className="flex items-center flex-wrap justify-center gap-2 px-4 py-3">
      <div className="flex rounded-lg overflow-hidden border border-white/10">
        {(['pen', 'eraser'] as Tool[]).map(t => (
          <button key={t} onClick={() => setTool(t)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              tool === t ? 'bg-amber-400 text-black' : 'bg-white/5 text-white/50 hover:text-white'
            }`}>
            {t === 'pen' ? '✏ Pen' : '⌫ Erase'}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-white/10" />

      <label className="flex items-center gap-1.5 cursor-pointer">
        <span className="text-[11px] text-white/35">Color</span>
        <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/20">
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-9 h-9 -translate-x-1 -translate-y-1 cursor-pointer" />
        </div>
      </label>

      <div className="w-px h-5 bg-white/10" />

      <label className="flex items-center gap-1.5">
        <span className="text-[11px] text-white/35">Size</span>
        <input type="range" min={1} max={50} value={brush} onChange={e => setBrush(+e.target.value)} className="w-20" />
        <span className="text-[11px] text-white/25 w-5">{brush}</span>
      </label>

      <div className="w-px h-5 bg-white/10" />

      <label className="flex items-center gap-1.5">
        <span className="text-[11px] text-white/35">Ref</span>
        <input type="range" min={0} max={100} value={refOp} onChange={e => setRefOp(+e.target.value)} className="w-16" />
        <span className="text-[11px] text-white/25 w-8">{refOp}%</span>
      </label>

      <div className="w-px h-5 bg-white/10" />

      <button onClick={undo} disabled={!history.length}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-25 transition-all">
        <RotateCcw size={10} /> Undo
      </button>
      <button onClick={clear}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all">
        <Trash2 size={10} /> Clear
      </button>

      {locked
        ? <button onClick={() => setLocked(false)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-400 text-black font-semibold transition-all">
            <LockOpen size={10} /> Unlock
          </button>
        : <button onClick={() => setLocked(true)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-amber-400 hover:border-amber-400/30 transition-all">
            <Lock size={10} /> Lock
          </button>
      }
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#060610', opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}>

      {!locked && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] fade-in">
          <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/70 truncate">{artwork.title}</p>
            <p className="text-xs text-white/30 truncate">{artwork.artist}</p>
          </div>
          <button onClick={savePng}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all">
            <Save size={12} /> Save PNG
          </button>
        </div>
      )}

      <div ref={areaRef} className="flex-1 relative flex items-center justify-center overflow-hidden">
        <img
          ref={imgRef}
          src={artwork.fullUrl}
          alt={artwork.title}
          crossOrigin="anonymous"
          onLoad={sizeCanvas}
          className="absolute pointer-events-none"
          style={{ opacity: refOp / 100, transition: 'opacity 0.15s', objectFit: 'contain', borderRadius: 4 }}
        />
        <canvas
          ref={canvasRef}
          className="absolute"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none', borderRadius: 4 }}
          onMouseDown={start} onMouseMove={draw} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={draw} onTouchEnd={end}
        />
      </div>

      {/* Controls — fixed at bottom when locked, else inline */}
      {locked ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl fade-in"
          style={{ background: 'rgba(8,8,20,0.92)' }}>
          {controlsEl}
        </div>
      ) : (
        <div className="flex-shrink-0 border-t border-white/[0.06]" style={{ background: '#080810' }}>
          {controlsEl}
        </div>
      )}
    </div>
  );
}
