import { useState, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Minus, Heart, EyeOff, Flame, 
  Package, X, Star, Send, User, Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductMedia, Stars } from '../ui';
import { fmt, getDiscount } from '../../utils';
import { supabase } from '../../lib/supabase';
import type { Product, Review } from '../../types/index';

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
      <div className="h-48 overflow-hidden relative bg-gray-50">
        <ProductMedia
          src={product.image}
          alt={product.name}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
        />
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
            title="Ẩn sản phẩm này"
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
          Sản phẩm này sẽ bị ẩn khỏi danh sách. Bạn có thể khôi phục bất kỳ lúc nào trong phần Đã ẩn.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all text-sm">Huỷ</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2">
            <EyeOff className="w-4 h-4" />Ẩn đi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────── PRODUCT REVIEWS COMPONENT ───────────
function ProductReviews({ 
  productId, 
  reviews, 
  loading,
  onSubmitReview 
}: { 
  productId: number; 
  reviews: Review[]; 
  loading: boolean;
  onSubmitReview: (rating: number, comment: string) => void;
}) {
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    if (newRating === 0) return alert('Vui lòng chọn số sao!');
    onSubmitReview(newRating, comment);
    setNewRating(0);
    setComment('');
    setShowForm(false);
  };

  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-gray-900">Đánh giá & Phản hồi</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
        >
          {showForm ? 'Huỷ' : 'Viết đánh giá'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-8">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <p className="text-sm font-bold text-gray-700 mb-2">Chất lượng sản phẩm</p>
              <div className="flex gap-1 mb-4 cursor-pointer">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 transition-all ${star <= (hoverRating || newRating) ? 'fill-amber-400 text-amber-400 scale-110' : 'text-gray-300'}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewRating(star)}
                  />
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[100px] mb-3"
              />
              <div className="flex justify-end">
                <button onClick={handleSubmit} disabled={newRating === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all">
                  <Send className="w-4 h-4" /> Gửi đánh giá
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">Chưa có đánh giá nào.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{review.user_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </div>
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
  userId,
  userName,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product, qty: number, note: string) => void;
  wishlisted: boolean;
  onWishlist: (id: number) => void;
  disliked: boolean;
  onDislike: (id: number) => void;
  userId?: string;
  userName?: string;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const images = product.images?.length ? product.images : [product.image];
  const discount = getDiscount(product);
  const outOfStock = (product.stock ?? 1) <= 0;
  const maxQty = product.stock !== undefined ? product.stock : 99;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const fetchReviews = async () => {
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      if (!error && data) setReviews(data);
      setReviewsLoading(false);
    };
    fetchReviews();
    return () => { document.body.style.overflow = ''; };
  }, [product.id]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    const reviewData = {
      product_id: product.id,
      user_id: userId || 'anonymous', 
      user_name: userName || 'Người dùng', 
      rating,
      comment,
    };

    const tempReview: Review = { id: Date.now(), ...reviewData, created_at: new Date().toISOString() };
    setReviews([tempReview, ...reviews]);

    const { error } = await supabase.from('reviews').insert([reviewData]);
    if (error) {
      console.error('Lỗi lưu review:', error);
      alert('Không thể lưu đánh giá.');
      setReviews(reviews);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }} className="relative bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2.5 bg-black/20 hover:bg-black/35 backdrop-blur-sm rounded-full transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="h-72 bg-gray-100 relative overflow-hidden">
          <ProductMedia src={images[activeImg]} alt={product.name} className="w-full h-full" />
          {discount > 0 && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">-{discount}% GIẢM</span>}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-black text-gray-900 leading-tight flex-1">{product.name}</h2>
            <div className="flex gap-2">
              <button onClick={() => onWishlist(product.id)} className={`p-2.5 rounded-xl border-2 transition-all ${wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400'}`}>
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Stars value={product.rating || 0} size="md" />
            <span className="text-sm font-bold text-gray-700">{product.rating || 0}/5</span>
            <span className="text-sm text-gray-400">({product.review_count || 0} đánh giá)</span>
          </div>

          <p className="text-3xl font-black text-blue-600">{fmt(product.price)}</p>

          {product.description && <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>}

          <div className="flex gap-3 items-center pt-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-200 rounded-xl"><Minus className="w-4 h-4" /></button>
              <span className="font-black text-lg w-8 text-center">{qty}</span>
              <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} className="p-2 hover:bg-gray-200 rounded-xl"><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={() => { if (!outOfStock) { onAddToCart(product, qty, note); onClose(); } }} disabled={outOfStock} className={`flex-1 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm ${outOfStock ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'}`}>
              <ShoppingCart className="w-4 h-4" /> {outOfStock ? 'Hết hàng' : `Thêm — ${fmt(product.price * qty)}`}
            </button>
          </div>

          <ProductReviews productId={product.id} reviews={reviews} loading={reviewsLoading} onSubmitReview={handleSubmitReview} />
        </div>
      </motion.div>
    </div>
  );
}