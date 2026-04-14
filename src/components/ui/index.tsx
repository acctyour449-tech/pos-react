import { useState } from 'react';
import { Star, Package, Check, X, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isVideo } from '../../utils';
import type { Toast } from '../../types';

// ─────────── STAR RATING ───────────
export function Stars({
  value,
  size = 'sm',
  onChange,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sz} transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'} ${
            (hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'
          }`}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

// ─────────── PRODUCT MEDIA ───────────
export function ProductMedia({
  src,
  alt,
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  if (!src)
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <Package className="w-8 h-8 text-gray-300" />
      </div>
    );
  if (isVideo(src))
    return <video src={src} className={`object-cover ${className}`} muted loop playsInline />;
  if (imgError)
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}
      >
        <Package className="w-8 h-8 text-gray-300" />
      </div>
    );
  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
    />
  );
}

// ─────────── TOAST CONTAINER ───────────
export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-5 right-5 z-[150] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold max-w-xs border ${
              t.type === 'success'
                ? 'bg-gray-900 text-white border-gray-700'
                : t.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : t.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-blue-600 text-white border-blue-500'
            }`}
          >
            {t.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : t.type === 'error' ? (
              <X className="w-4 h-4 flex-shrink-0" />
            ) : t.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="leading-snug">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
