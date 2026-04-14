import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Heart, EyeOff, Flame, Package, X, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductMedia, Stars } from '../ui';
import { fmt, getDiscount } from '../../utils';
import type { Product } from '../../types';

// ─────────── PRODUCT CARD ───────────
export function ProductCard({
  product,
  onAddToCart,
  onWishlist,
  wishlisted,
  onDislike,
  disliked,
  onView,
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onWishlist: (id: number) => void;
  wishlisted: boolean;
  onDislike: (id: number) => void;
  disliked: boolean;
  onView: (p: Product) => void;
}) {
  const discount = getDiscount(product);
  const outOfStock = (product.stock ?? 1) <= 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-blue-500/10 transition-shadow group cursor-pointer relative"
      onClick={() => onView(product)}
    >
      {/* Image */}
      <div className="h-48 overflow-hidden relative bg-gray-50">
        <ProductMedia
          src={product.image}
          alt={product.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {product.is_featured && (
            <span className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Flame className="w-2.5 h-2.5" />Hot
            </span>
          )}
          {(product.sold_count || 0) > 100 && (
            <span className="bg-violet-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              Bán chạy
            </span>
          )}
          {outOfStock && (
            <span className="bg-gray-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              Hết hàng
            </span>
          )}
        </div>
        {/* Action buttons */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); onWishlist(product.id); }}
            className={`p-2 rounded-xl backdrop-blur-sm border transition-all shadow-sm ${
              wishlisted
                ? 'bg-red-500 text-white border-red-400'
                : 'bg-white/90 text-gray-400 hover:text-red-400 border-white/50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-white' : ''}`} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDislike(product.id); }}
            title="Không thích - Ẩn sản phẩm này"
            className={`p-2 rounded-xl backdrop-blur-sm border transition-all shadow-sm ${
              disliked
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white/90 text-gray-400 hover:text-gray-600 border-white/50'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/50">
          {product.category}
        </div>
      </div>
      {/* Body */}
      <div className="p-3.5">
        <h3 className="font-bold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        {product.rating !== undefined && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars value={product.rating} />
            <span className="text-[10px] text-gray-400 font-bold">({product.review_count || 0})</span>
            {(product.sold_count || 0) > 0 && (
              <span className="text-[10px] text-gray-400">• {product.sold_count} đã bán</span>
            )}
          </div>
        )}
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-blue-600 font-black text-base leading-none">{fmt(product.price)}</p>
            {product.original_price && product.original_price > product.price && (
              <p className="text-gray-400 text-xs line-through mt-0.5">{fmt(product.original_price)}</p>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); if (!outOfStock) onAddToCart(product); }}
            disabled={outOfStock}
            className={`p-2.5 rounded-xl transition-all active:scale-90 flex-shrink-0 ${
              outOfStock
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────── DISLIKE CONFIRMATION MODAL ───────────
export function DislikeModal({
  product,
  onConfirm,
  onCancel,
}: {
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <EyeOff className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-black mb-2 text-gray-900">Ẩn sản phẩm này?</h3>
        <p className="text-sm text-gray-500 mb-1 font-medium">"{product.name}"</p>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Sản phẩm này sẽ bị ẩn khỏi tất cả danh sách của bạn. Bạn có thể khôi phục bất kỳ lúc nào trong phần{' '}
          <strong>Đã ẩn</strong>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all text-sm"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2"
          >
            <EyeOff className="w-4 h-4" />Ẩn đi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────── PRODUCT DETAIL MODAL ───────────
export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  wishlisted,
  onWishlist,
  disliked,
  onDislike,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, qty: number, note: string) => void;
  wishlisted: boolean;
  onWishlist: (id: number) => void;
  disliked: boolean;
  onDislike: (id: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images?.length ? product.images : [product.image];
  const discount = getDiscount(product);
  const outOfStock = (product.stock ?? 1) <= 0;
  const maxQty = product.stock !== undefined ? product.stock : 99;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 bg-black/20 hover:bg-black/35 backdrop-blur-sm rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Gallery */}
        <div className="h-72 bg-gray-100 relative overflow-hidden">
          <ProductMedia src={images[activeImg]} alt={product.name} className="w-full h-full" />
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">
              -{discount}% GIẢM
            </span>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-1.5 rounded-full transition-all bg-white ${
                    i === activeImg ? 'w-6 opacity-100' : 'w-1.5 opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-black text-gray-900 leading-tight flex-1">{product.name}</h2>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onWishlist(product.id)}
                className={`p-2.5 rounded-xl border-2 transition-all ${
                  wishlisted
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>
              <button
                onClick={() => onDislike(product.id)}
                title="Ẩn sản phẩm này"
                className={`p-2.5 rounded-xl border-2 transition-all ${
                  disliked
                    ? 'bg-gray-100 border-gray-300 text-gray-600'
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {product.rating !== undefined && (
            <div className="flex items-center gap-2">
              <Stars value={product.rating} size="md" />
              <span className="text-sm font-bold text-gray-700">{product.rating}/5</span>
              <span className="text-sm text-gray-400">({product.review_count || 0} đánh giá)</span>
              {(product.sold_count || 0) > 0 && (
                <span className="text-sm text-gray-400">• {product.sold_count} đã bán</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-black text-blue-600">{fmt(product.price)}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">{fmt(product.original_price)}</span>
                <span className="bg-red-50 text-red-600 text-xs font-black px-2.5 py-1 rounded-full border border-red-100">
                  Tiết kiệm {fmt(product.original_price - product.price)}
                </span>
              </>
            )}
          </div>

          {product.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map(tag => (
                <span key={tag} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          {product.stock !== undefined && (
            <div
              className={`flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl ${
                outOfStock
                  ? 'bg-red-50 text-red-600'
                  : product.stock <= 5
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              <Package className="w-4 h-4 flex-shrink-0" />
              {outOfStock
                ? 'Hết hàng'
                : product.stock <= 5
                ? `Chỉ còn ${product.stock} sản phẩm`
                : `Còn hàng (${product.stock})`}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Ví dụ: Không hành, ít đường, size L..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-lg w-8 text-center select-none">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                if (!outOfStock) {
                  onAddToCart(product, qty, note);
                  onClose();
                }
              }}
              disabled={outOfStock}
              className={`flex-1 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm ${
                outOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {outOfStock ? 'Hết hàng' : `Thêm — ${fmt(product.price * qty)}`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
