import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Lock, LockOpen, RotateCcw, Trash2, Save } from 'lucide-react';
import type { GalleryImage } from '../data/images';

interface Props {
  img: GalleryImage;
  onClose: () => void;
}

type Tool = 'pen' | 'eraser';

export default function TraceMode({ img, onClose }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const areaRef     = useRef<HTMLDivElement>(null);
  const [locked, setLocked]     = useState(false);
  const [tool, setTool]         = useState<Tool>('pen');
  const [color, setColor]       = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [refOpacity, setRefOpacity] = useState(40);
  const [history, setHistory]   = useState<ImageData[]>([]);
  const [visible, setVisible]   = useState(false);

  const drawing = useRef(false);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Size canvas to fit image in area
  const sizeCanvas = useCallback(() => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;

    const areaR = area.getBoundingClientRect();
    const ia = img.w / img.h;
    const aa = areaR.width / areaR.height;

    let w, h;
    if (ia > aa) { w = areaR.width * 0.96;  h = w / ia; }
    else          { h = areaR.height * 0.96; w = h * ia; }

    canvas.width  = Math.round(w);
    canvas.height = Math.round(h);
    canvas.style.width  = Math.round(w) + 'px';
    canvas.style.height = Math.round(h) + 'px';
    ctx.current = canvas.getContext('2d');
  }, [img.w, img.h]);

  useEffect(() => {
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    return () => window.removeEventListener('resize', sizeCanvas);
  }, [sizeCanvas]);

  // Drawing helpers
  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / r.width;
    const scaleY = canvas.height / r.height;
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
  }

  function saveHistory() {
    const canvas = canvasRef.current;
    const c = ctx.current;
    if (!canvas || !c) return;
    const data = c.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(h => [...h.slice(-39), data]);
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!ctx.current) return;
    drawing.current = true;
    saveHistory();
    const { x, y } = getPos(e);
    ctx.current.beginPath();
    ctx.current.moveTo(x, y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current || !ctx.current) return;
    const { x, y } = getPos(e);
    ctx.current.globalAlpha = 1;
    ctx.current.lineWidth   = brushSize;
    ctx.current.lineCap     = 'round';
    ctx.current.lineJoin    = 'round';
    if (tool === 'eraser') {
      ctx.current.globalCompositeOperation = 'destination-out';
      ctx.current.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.current.globalCompositeOperation = 'source-over';
      ctx.current.strokeStyle = color;
    }
    ctx.current.lineTo(x, y);
    ctx.current.stroke();
    ctx.current.beginPath();
    ctx.current.moveTo(x, y);
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = false;
    ctx.current?.beginPath();
  }

  function undo() {
    if (!history.length || !ctx.current) return;
    const last = history[history.length - 1];
    ctx.current.putImageData(last, 0, 0);
    setHistory(h => h.slice(0, -1));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return;
    ctx.current.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
  }

  function savePng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `trace-${img.seed}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: '#09090d',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
    >
      {/* Top bar — hidden when locked */}
      {!locked && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] fade-in">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <div className="flex-1 text-center">
            <span className="text-sm font-medium text-white/60">Trace Mode</span>
          </div>
          <button
            onClick={savePng}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-surface2 border border-white/[0.08] text-white/70 hover:text-white hover:bg-surface transition-all"
          >
            <Save size={13} /> Save PNG
          </button>
          <button
            onClick={() => setLocked(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface2 border border-white/[0.08] text-white/50 hover:text-accent hover:border-accent/40 transition-all"
            title="Lock screen"
          >
            <LockOpen size={14} />
          </button>
        </div>
      )}

      {/* Canvas area */}
      <div ref={areaRef} className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Reference image */}
        <img
          src={img.url}
          alt=""
          className="absolute pointer-events-none"
          style={{
            opacity: refOpacity / 100,
            transition: 'opacity 0.15s',
            maxWidth: '96%',
            maxHeight: '96%',
            objectFit: 'contain',
            borderRadius: 4,
          }}
        />

        {/* Drawing canvas */}
        <canvas
          ref={canvasRef}
          className="absolute"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: 'none', borderRadius: 4 }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Controls strip — always visible but floats over image when locked */}
      <div
        className={`flex-shrink-0 flex items-center flex-wrap justify-center gap-2 px-4 py-3 ${
          locked
            ? 'fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl border border-white/[0.1] backdrop-blur-xl shadow-2xl fade-in'
            : 'border-t border-white/[0.06]'
        }`}
        style={locked ? { background: 'rgba(10,10,14,0.9)', zIndex: 60 } : { background: '#0c0b0f' }}
      >
        {/* Tool toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
          <ToolBtn active={tool === 'pen'}    onClick={() => setTool('pen')}>✏ Pen</ToolBtn>
          <ToolBtn active={tool === 'eraser'} onClick={() => setTool('eraser')}>⌫ Erase</ToolBtn>
        </div>

        <Divider />

        {/* Color */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <span className="text-xs text-white/40">Color</span>
          <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white/20">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-10 h-10 -translate-x-1 -translate-y-1 cursor-pointer"
            />
          </div>
        </label>

        <Divider />

        {/* Brush size */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40">Size</span>
          <input
            type="range" min={1} max={50} value={brushSize}
            onChange={e => setBrushSize(+e.target.value)}
            className="w-20"
          />
          <span className="text-xs text-white/30 w-4 text-right">{brushSize}</span>
        </div>

        <Divider />

        {/* Ref opacity */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white/40">Ref</span>
          <input
            type="range" min={0} max={100} value={refOpacity}
            onChange={e => setRefOpacity(+e.target.value)}
            className="w-16"
            style={{ '--tw-ring-color': '#7eb8f7' } as React.CSSProperties}
          />
          <span className="text-xs text-white/30 w-6 text-right">{refOpacity}%</span>
        </div>

        <Divider />

        {/* Undo / Clear */}
        <button
          onClick={undo}
          disabled={!history.length}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface2 border border-white/[0.08] text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <RotateCcw size={11} /> Undo
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-surface2 border border-white/[0.08] text-white/60 hover:text-white transition-all"
        >
          <Trash2 size={11} /> Clear
        </button>

        {/* Lock / Unlock button */}
        {locked ? (
          <button
            onClick={() => setLocked(false)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent text-bg font-semibold transition-all hover:brightness-110"
          >
            <LockOpen size={11} /> Unlock
          </button>
        ) : (
          <button
            onClick={() => setLocked(true)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-surface2 border border-white/[0.08] text-white/50 hover:text-accent hover:border-accent/30 transition-all"
          >
            <Lock size={11} /> Lock
          </button>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'bg-accent text-bg'
          : 'bg-surface2 text-white/50 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-white/[0.08] flex-shrink-0" />;
}
