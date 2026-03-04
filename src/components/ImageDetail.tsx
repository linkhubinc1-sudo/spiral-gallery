import { X, Pencil, ScanSearch, Download } from 'lucide-react';
import type { GalleryImage } from '../data/images';
import { CAT_LABELS } from '../data/images';

interface Props {
  img: GalleryImage;
  onClose: () => void;
  onTrace: () => void;
  onSimilar: () => void;
}

export default function ImageDetail({ img, onClose, onTrace, onSimilar }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Image */}
      <div className="relative flex-shrink-0">
        <img
          src={img.url}
          alt={img.tags.join(', ')}
          className="w-full object-cover"
          style={{ maxHeight: '55vh', objectFit: 'cover' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1919] via-transparent to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors"
        >
          <X size={15} />
        </button>

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-xs font-semibold tracking-widest uppercase px-2 py-1 rounded bg-black/50 border border-white/10 text-accent">
            {CAT_LABELS[img.cat]}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="px-4 pt-3 pb-2 flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {img.tags.map(t => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded-full bg-surface2 border border-white/[0.07] text-white/50"
            >
              {t}
            </span>
          ))}
        </div>

        <p className="text-xs text-white/30 mt-3">
          {img.w} × {img.h} px
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-5 pt-2 space-y-2 flex-shrink-0 border-t border-white/[0.06]">
        <button
          onClick={onTrace}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-bg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <Pencil size={14} />
          Trace This Image
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSimilar}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface2 border border-white/[0.07] text-white/70 text-sm hover:bg-surface hover:text-white transition-all"
          >
            <ScanSearch size={13} />
            Similar
          </button>
          <a
            href={img.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface2 border border-white/[0.07] text-white/70 text-sm hover:bg-surface hover:text-white transition-all"
          >
            <Download size={13} />
            Save
          </a>
        </div>
      </div>
    </div>
  );
}
