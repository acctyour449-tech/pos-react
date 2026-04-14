import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, Zap, Loader2, AlertCircle,
  LayoutDashboard, BarChart3, Clock, DollarSign, LogIn, UserPlus,
  LogOut, Mail, Lock, Store, User, PackagePlus, ShoppingBag, Search,
  ChevronRight, Star, Edit, Bell, BellRing, CheckCircle2,
  Package, Truck, Check, X, Heart, Eye, TrendingUp,
  Tag, Grid3X3, List, SlidersHorizontal, ChevronDown,
  MapPin, MessageCircle, RefreshCw, Flame,
  Camera, BarChart2, Percent,
  ArrowUpRight, Gift,
  ChevronLeft, Home, Bookmark, Settings, Globe,
  ThumbsDown, EyeOff, Filter, BadgePercent, Award, Sparkles,
  PackageX, Ban, AlertTriangle, Info, ShoppingBasket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// ─────────── TYPES ───────────
interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory?: string;
  image: string;
  images?: string[];
  seller_id: string;
  seller_name?: string;
  description?: string;
  stock?: number;
  sold_count?: number;
  rating?: number;
  review_count?: number;
  tags?: string[];
  is_featured?: boolean;
  discount_percent?: number;
  created_at?: string;
}

interface CartItem extends Product {
  quantity: number;
  note?: string;
}

interface Order {
  id: number;
  created_at: string;
  total_price: number;
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  items: any;
  seller_id: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_email?: string;
  status: string;
  shipping_address?: string;
  payment_method?: string;
  note?: string;
  tracking_code?: string;
  estimated_delivery?: string;
}

interface Notification {
  id: number;
  user_id: string;
  order_id: number;
  message: string;
  type: 'order_confirmed' | 'order_shipped' | 'order_completed' | 'new_order' | 'promo' | 'system';
  is_read: boolean;
  created_at: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// ─────────── CONSTANTS ───────────
const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: '🏪', sub: [] },
  { id: 'food', label: 'Thực phẩm', icon: '🥘', sub: ['Đồ ăn nhanh', 'Đặc sản', 'Hữu cơ', 'Bánh kẹo', 'Gia vị'] },
  { id: 'drink', label: 'Đồ uống', icon: '☕', sub: ['Cà phê', 'Trà', 'Nước ép', 'Sinh tố', 'Nước đóng chai'] },
  { id: 'fashion', label: 'Thời trang', icon: '👗', sub: ['Áo', 'Quần', 'Váy', 'Phụ kiện', 'Giày dép'] },
  { id: 'electronics', label: 'Điện tử', icon: '📱', sub: ['Điện thoại', 'Laptop', 'Tai nghe', 'Phụ kiện', 'Smart home'] },
  { id: 'beauty', label: 'Làm đẹp', icon: '💄', sub: ['Skincare', 'Makeup', 'Tóc', 'Nước hoa', 'Nail'] },
  { id: 'home', label: 'Gia dụng', icon: '🏠', sub: ['Nội thất', 'Nhà bếp', 'Phòng ngủ', 'Trang trí', 'Vệ sinh'] },
  { id: 'sport', label: 'Thể thao', icon: '⚽', sub: ['Gym', 'Yoga', 'Bơi lội', 'Chạy bộ', 'Cầu lông'] },
  { id: 'books', label: 'Sách', icon: '📚', sub: ['Tiểu thuyết', 'Kỹ năng', 'Khoa học', 'Trẻ em', 'Giáo trình'] },
];

const ORDER_STATUSES = {
  'Chờ xác nhận': { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Chờ xác nhận', next: 'Đã xác nhận', nextLabel: '✓ Xác nhận đơn', nextBg: 'bg-emerald-600 hover:bg-emerald-700' },
  'Đã xác nhận':  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Đã xác nhận', next: 'Đang giao', nextLabel: '🚚 Bắt đầu giao', nextBg: 'bg-blue-600 hover:bg-blue-700' },
  'Đang giao':    { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', label: 'Đang giao', next: 'Hoàn thành', nextLabel: '🎉 Giao xong', nextBg: 'bg-violet-600 hover:bg-violet-700' },
  'Hoàn thành':   { color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400', label: 'Hoàn thành', next: null, nextLabel: null, nextBg: null },
  'Đã hủy':       { color: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-400', label: 'Đã hủy', next: null, nextLabel: null, nextBg: null },
};

const PROGRESS_STEPS = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Hoàn thành'];

const COUPONS: Record<string, number> = {
  'SALE10': 0.10,
  'WELCOME': 0.15,
  'FIT20': 0.20,
  'VIP30': 0.30,
};

// ─────────── HELPERS ───────────
const fmt = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
const isVideo = (url: string) => url && ['.mp4', '.webm', '.ogg', '.mov'].some(e => url.toLowerCase().split('?')[0].endsWith(e));
const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(date).toLocaleDateString('vi-VN');
};
const getDiscount = (p: Product) => p.original_price && p.original_price > p.price
  ? Math.round((1 - p.price / p.original_price) * 100) : 0;

// ─────────── STAR RATING ───────────
function Stars({ value, size = 'sm', onChange }: { value: number; size?: 'sm' | 'md' | 'lg'; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i}
          className={`${sz} transition-colors ${onChange ? 'cursor-pointer' : 'cursor-default'} ${(hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
}

// ─────────── PRODUCT MEDIA ───────────
function ProductMedia({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [imgError, setImgError] = useState(false);
  if (!src) return <div className={`bg-gray-100 flex items-center justify-center ${className}`}><Package className="w-8 h-8 text-gray-300" /></div>;
  if (isVideo(src)) return <video src={src} className={`object-cover ${className}`} muted loop playsInline />;
  if (imgError) return <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}><Package className="w-8 h-8 text-gray-300" /></div>;
  return <img src={src} alt={alt} className={`object-cover ${className}`} referrerPolicy="no-referrer" onError={() => setImgError(true)} />;
}

// ─────────── PRODUCT CARD ───────────
function ProductCard({
  product, onAddToCart, onWishlist, wishlisted,
  onDislike, disliked, onView
}: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onWishlist: (id: number) => void;
  wishlisted: boolean;
  onDislike: (id: number) => void;
  disliked: boolean;
  onView: (p: Product) => void;
}) {
  const [showActions, setShowActions] = useState(false);
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
        <ProductMedia src={product.image} alt={product.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">-{discount}%</span>}
          {product.is_featured && <span className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />Hot</span>}
          {(product.sold_count || 0) > 100 && <span className="bg-violet-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Bán chạy</span>}
          {outOfStock && <span className="bg-gray-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">Hết hàng</span>}
        </div>

        {/* Action buttons (top right) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          {/* Wishlist */}
          <button
            onClick={e => { e.stopPropagation(); onWishlist(product.id); }}
            className={`p-2 rounded-xl backdrop-blur-sm border transition-all shadow-sm ${wishlisted ? 'bg-red-500 text-white border-red-400' : 'bg-white/90 text-gray-400 hover:text-red-400 border-white/50'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-white' : ''}`} />
          </button>

          {/* Dislike / Hide */}
          <button
            onClick={e => { e.stopPropagation(); onDislike(product.id); }}
            title="Không thích - Ẩn sản phẩm này"
            className={`p-2 rounded-xl backdrop-blur-sm border transition-all shadow-sm ${disliked ? 'bg-gray-700 text-white border-gray-600' : 'bg-white/90 text-gray-400 hover:text-gray-600 border-white/50'}`}
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category */}
        <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/50">
          {product.category}
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <h3 className="font-bold text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>

        {product.rating !== undefined && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars value={product.rating} />
            <span className="text-[10px] text-gray-400 font-bold">({product.review_count || 0})</span>
            {(product.sold_count || 0) > 0 && <span className="text-[10px] text-gray-400">• {product.sold_count} đã bán</span>}
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
            className={`p-2.5 rounded-xl transition-all active:scale-90 flex-shrink-0 ${outOfStock ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30'}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────── DISLIKE CONFIRMATION MODAL ───────────
function DislikeModal({ product, onConfirm, onCancel }: {
  product: Product; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <EyeOff className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-black mb-2 text-gray-900">Ẩn sản phẩm này?</h3>
        <p className="text-sm text-gray-500 mb-1 font-medium">"{product.name}"</p>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Sản phẩm này sẽ bị ẩn khỏi tất cả danh sách của bạn. Bạn có thể khôi phục bất kỳ lúc nào trong phần <strong>Đã ẩn</strong>.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all text-sm">
            Huỷ
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2">
            <EyeOff className="w-4 h-4" />Ẩn đi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────── PRODUCT DETAIL MODAL ───────────
function ProductDetailModal({ product, onClose, onAddToCart, wishlisted, onWishlist, disliked, onDislike }: {
  product: Product; onClose: () => void;
  onAddToCart: (p: Product, qty: number, note: string) => void;
  wishlisted: boolean; onWishlist: (id: number) => void;
  disliked: boolean; onDislike: (id: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images?.length ? product.images : [product.image];
  const discount = getDiscount(product);
  const outOfStock = (product.stock ?? 1) <= 0;
  const maxQty = product.stock !== undefined ? product.stock : 99;

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 bg-black/20 hover:bg-black/35 backdrop-blur-sm rounded-full transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Image Gallery */}
        <div className="h-72 bg-gray-100 relative overflow-hidden">
          <ProductMedia src={images[activeImg]} alt={product.name} className="w-full h-full" />
          {discount > 0 && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">-{discount}% GIẢM</span>}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`h-1.5 rounded-full transition-all bg-white ${i === activeImg ? 'w-6 opacity-100' : 'w-1.5 opacity-50'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-black text-gray-900 leading-tight flex-1">{product.name}</h2>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => onWishlist(product.id)}
                className={`p-2.5 rounded-xl border-2 transition-all ${wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}>
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>
              <button onClick={() => onDislike(product.id)}
                title="Ẩn sản phẩm này"
                className={`p-2.5 rounded-xl border-2 transition-all ${disliked ? 'bg-gray-100 border-gray-300 text-gray-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
          </div>

          {product.rating !== undefined && (
            <div className="flex items-center gap-2">
              <Stars value={product.rating} size="md" />
              <span className="text-sm font-bold text-gray-700">{product.rating}/5</span>
              <span className="text-sm text-gray-400">({product.review_count || 0} đánh giá)</span>
              {(product.sold_count || 0) > 0 && <span className="text-sm text-gray-400">• {product.sold_count} đã bán</span>}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl font-black text-blue-600">{fmt(product.price)}</span>
            {product.original_price && product.original_price > product.price && <>
              <span className="text-lg text-gray-400 line-through">{fmt(product.original_price)}</span>
              <span className="bg-red-50 text-red-600 text-xs font-black px-2.5 py-1 rounded-full border border-red-100">
                Tiết kiệm {fmt(product.original_price - product.price)}
              </span>
            </>}
          </div>

          {/* Tags */}
          {product.tags?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map(tag => <span key={tag} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">#{tag}</span>)}
            </div>
          ) : null}

          {/* Description */}
          {product.description && <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>}

          {/* Stock indicator */}
          {product.stock !== undefined && (
            <div className={`flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl ${
              outOfStock ? 'bg-red-50 text-red-600' :
              product.stock <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <Package className="w-4 h-4 flex-shrink-0" />
              {outOfStock ? 'Hết hàng' : product.stock <= 5 ? `Chỉ còn ${product.stock} sản phẩm` : `Còn hàng (${product.stock})`}
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Ghi chú (tuỳ chọn)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Ví dụ: Không hành, ít đường, size L..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all" />
          </div>

          {/* Qty + Add to cart */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><Minus className="w-4 h-4" /></button>
              <span className="font-black text-lg w-8 text-center select-none">{qty}</span>
              <button onClick={() => setQty(q => Math.min(maxQty, q + 1))} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <button
              onClick={() => { if (!outOfStock) { onAddToCart(product, qty, note); onClose(); } }}
              disabled={outOfStock}
              className={`flex-1 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm ${
                outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'
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

// ─────────── AUTH FORM ───────────
function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Mật khẩu phải ít nhất 6 ký tự'); return; }
    setLoading(true); setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
        if (error) throw error;
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
      }
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'Invalid login credentials': 'Email hoặc mật khẩu không đúng',
        'User already registered': 'Email này đã được đăng ký',
        'Email not confirmed': 'Vui lòng xác nhận email trước khi đăng nhập',
      };
      setError(msgs[err.message] || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-2xl shadow-blue-600/40">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Marketplace Pro</h1>
          <p className="text-blue-200/60 mt-1 text-sm">{isLogin ? 'Chào mừng quay lại 👋' : 'Tạo tài khoản mới'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-300/40" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email của bạn"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm" />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-300/40" />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm" />
          </div>

          {/* Role selection (sign up only) */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              {(['buyer', 'seller'] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all text-sm font-bold ${role === r ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}>
                  {r === 'buyer' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                  {r === 'buyer' ? 'Người mua' : 'Người bán'}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 text-red-200 p-3.5 rounded-2xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98] text-sm">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <button onClick={() => { setIsLogin(!isLogin); setError(null); }}
          className="mt-5 w-full text-center text-sm text-blue-300/60 hover:text-blue-200 transition-colors">
          {isLogin ? 'Chưa có tài khoản? → Đăng ký miễn phí' : 'Đã có tài khoản? → Đăng nhập'}
        </button>
      </motion.div>
    </div>
  );
}

// ─────────── ROLE SELECTION ───────────
function RoleSelection({ onSelect }: { onSelect: (r: 'seller' | 'buyer') => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const handleSelect = async (r: 'seller' | 'buyer') => {
    setLoading(r);
    try {
      const { error } = await supabase.auth.updateUser({ data: { role: r } });
      if (error) throw error;
      onSelect(r);
    } catch (err: any) { alert(err.message); } finally { setLoading(null); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl text-center">
        <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/30">
          <User className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black mb-3">Bạn muốn làm gì?</h1>
        <p className="text-gray-500 mb-10">Chọn vai trò để trải nghiệm phù hợp nhất</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { role: 'buyer' as const, icon: ShoppingBag, title: 'Tôi muốn mua sắm', desc: 'Khám phá hàng nghìn sản phẩm, mua sắm dễ dàng, theo dõi đơn hàng realtime', color: 'blue' },
            { role: 'seller' as const, icon: Store, title: 'Tôi muốn bán hàng', desc: 'Mở gian hàng, quản lý sản phẩm, theo dõi doanh thu và xử lý đơn hàng', color: 'violet' },
          ].map(({ role, icon: Icon, title, desc, color }) => (
            <button key={role} onClick={() => handleSelect(role)} disabled={!!loading}
              className={`group relative p-8 rounded-3xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl ${
                color === 'blue' ? 'border-blue-100 hover:border-blue-400 hover:bg-blue-50 bg-white' :
                'border-violet-100 hover:border-violet-400 hover:bg-violet-50 bg-white'
              }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all ${
                color === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30' :
                'bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-violet-600/30'
              }`}>
                {loading === role ? <Loader2 className="w-7 h-7 animate-spin" /> : <Icon className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-black mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────── NOTIFICATION PANEL ───────────
function NotificationPanel({ notifications, onClose, onMarkRead, onMarkAllRead }: {
  notifications: Notification[]; onClose: () => void;
  onMarkRead: (id: number) => void; onMarkAllRead: () => void;
}) {
  const typeIcons: Record<string, React.ReactNode> = {
    order_confirmed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    order_shipped:   <Truck className="w-4 h-4 text-blue-500" />,
    order_completed: <Package className="w-4 h-4 text-violet-500" />,
    new_order:       <ShoppingBag className="w-4 h-4 text-amber-500" />,
    promo:           <Tag className="w-4 h-4 text-pink-500" />,
    system:          <Bell className="w-4 h-4 text-gray-400" />,
  };
  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">

        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" />Thông báo
            </h2>
            {unread > 0 && <p className="text-xs text-gray-400 mt-0.5">{unread} chưa đọc</p>}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={onMarkAllRead} className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded-lg transition-all">Đọc tất cả</button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 p-10">
              <Bell className="w-14 h-14" />
              <p className="font-bold text-gray-400 text-sm">Không có thông báo nào</p>
            </div>
          ) : notifications.map(n => (
            <motion.div key={n.id} layout
              onClick={() => !n.is_read && onMarkRead(n.id)}
              className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
              <div className="mt-0.5 p-2 bg-gray-100 rounded-xl flex-shrink-0">
                {typeIcons[n.type] || typeIcons.system}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0 animate-pulse" />}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────── HIDDEN PRODUCTS PANEL ───────────
function HiddenProductsPanel({ hiddenIds, allProducts, onRestore, onClose }: {
  hiddenIds: number[]; allProducts: Product[];
  onRestore: (id: number) => void; onClose: () => void;
}) {
  const hiddenProducts = allProducts.filter(p => hiddenIds.includes(p.id));
  return (
    <div className="fixed inset-0 z-[85] flex justify-start">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">

        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gray-600" />Đã ẩn
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{hiddenProducts.length} sản phẩm bị ẩn</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hiddenProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 py-20">
              <Eye className="w-14 h-14" />
              <p className="font-bold text-gray-400 text-sm text-center">Chưa có sản phẩm nào bị ẩn</p>
              <p className="text-xs text-gray-400 text-center">Nhấn nút 👁️ trên sản phẩm để ẩn</p>
            </div>
          ) : hiddenProducts.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                <ProductMedia src={p.image} alt={p.name} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-gray-700">{p.name}</p>
                <p className="text-xs text-gray-400">{fmt(p.price)}</p>
              </div>
              <button onClick={() => onRestore(p.id)}
                className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1">
                <Eye className="w-3 h-3" />Hiện
              </button>
            </div>
          ))}
        </div>

        {hiddenProducts.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button onClick={() => { hiddenIds.forEach(id => onRestore(id)); onClose(); }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition-colors">
              Hiện tất cả ({hiddenProducts.length})
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─────────── MAIN APP ───────────
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [products, setProducts] = useState<Product[]>([]);        // seller's products
  const [allProducts, setAllProducts] = useState<Product[]>([]);  // marketplace
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Wishlist & Dislikes (hidden products)
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]); // hidden products
  const [pendingDislike, setPendingDislike] = useState<Product | null>(null);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);

  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10_000_000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', original_price: '', category: 'food', subcategory: '', description: '', stock: '100', tags: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'confirm'>('cart');
  const [shippingAddr, setShippingAddr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'momo'>('cod');
  const [orderNote, setOrderNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const realtimeRef = useRef<any>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const role = useMemo(() => session?.user?.user_metadata?.role as 'seller' | 'buyer' | undefined, [session]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const discountAmt = cartTotal * couponDiscount;
  const finalTotal = Math.max(0, cartTotal - discountAmt);
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0), [orders]);
  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.created_at).toDateString() === today).reduce((s, o) => s + Number(o.total_price), 0);
  }, [orders]);

  // Persist wishlist + disliked in localStorage
  useEffect(() => {
    if (!session?.user?.id) return;
    const key = `wl_${session.user.id}`;
    const dl_key = `dl_${session.user.id}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setWishlist(JSON.parse(saved));
      const savedDl = localStorage.getItem(dl_key);
      if (savedDl) setDisliked(JSON.parse(savedDl));
    } catch {}
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    localStorage.setItem(`wl_${session.user.id}`, JSON.stringify(wishlist));
  }, [wishlist, session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;
    localStorage.setItem(`dl_${session.user.id}`, JSON.stringify(disliked));
  }, [disliked, session?.user?.id]);

  // Toast helper
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(p => [...p.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  // Filtered products (excluding disliked/hidden)
  const filteredProducts = useMemo(() => {
    let list = [...allProducts].filter(p => !disliked.includes(p.id));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      const catLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label;
      if (catLabel) list = list.filter(p => p.category === catLabel);
    }

    if (selectedSubcat) list = list.filter(p => p.subcategory === selectedSubcat);
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'popular': list.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)); break;
      default: list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    return list;
  }, [allProducts, disliked, searchQuery, selectedCategory, selectedSubcat, sortBy, priceRange]);

  const wishlistProducts = useMemo(() => allProducts.filter(p => wishlist.includes(p.id)), [allProducts, wishlist]);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (role === 'seller') setActiveTab('my-products');
    else if (role === 'buyer') setActiveTab('marketplace');
  }, [role]);

  // Fetch data
  useEffect(() => { if (session) fetchAllProducts(); }, [session]);
  useEffect(() => { if (session && role === 'seller' && activeTab === 'my-products') fetchMyProducts(); }, [session, role, activeTab]);
  useEffect(() => { if (activeTab === 'my-orders' && role === 'seller') fetchOrders(); }, [activeTab, role]);
  useEffect(() => { if (activeTab === 'my-purchases' && role === 'buyer') fetchBuyerOrders(); }, [activeTab, role]);
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      setupRealtime();
    }
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, [session?.user?.id]);

  async function fetchAllProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAllProducts(data || []);
    } catch (err: any) {
      showToast('Lỗi tải sản phẩm: ' + err.message, 'error');
    } finally { setLoading(false); }
  }

  async function fetchMyProducts() {
    const { data } = await supabase.from('products').select('*').eq('seller_id', session!.user.id).order('created_at', { ascending: false });
    setProducts(data || []);
  }

  async function fetchOrders() {
    setOrdersLoading(true);
    const { data } = await supabase.from('orders').select('*').eq('seller_id', session!.user.id).order('created_at', { ascending: false });
    setOrders(data || []);
    setOrdersLoading(false);
  }

  async function fetchBuyerOrders() {
    setOrdersLoading(true);
    const { data } = await supabase.from('orders').select('*').eq('buyer_id', session!.user.id).order('created_at', { ascending: false });
    setBuyerOrders(data || []);
    setOrdersLoading(false);
  }

  async function fetchNotifications() {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', session!.user.id).order('created_at', { ascending: false }).limit(50);
    setNotifications(data || []);
  }

  function setupRealtime() {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    const userId = session!.user.id;
    const ch = supabase.channel('rt-notif-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        const n = payload.new as Notification;
        setNotifications(prev => [n, ...prev]);
        showToast(`🔔 ${n.message}`, 'info');
      })
      .subscribe();
    realtimeRef.current = ch;
  }

  // ─── Dislike / Hide handlers ───
  const handleDislikeRequest = (productId: number) => {
    if (disliked.includes(productId)) {
      // Already hidden → restore
      setDisliked(d => d.filter(x => x !== productId));
      showToast('✓ Đã hiện lại sản phẩm', 'success');
      return;
    }
    const product = allProducts.find(p => p.id === productId);
    if (product) setPendingDislike(product);
  };

  const confirmDislike = () => {
    if (!pendingDislike) return;
    setDisliked(d => [...d, pendingDislike.id]);
    // Also remove from wishlist if present
    setWishlist(w => w.filter(x => x !== pendingDislike.id));
    showToast('👁️ Đã ẩn sản phẩm này', 'info');
    setPendingDislike(null);
    // Close detail modal if it was showing this product
    if (viewProduct?.id === pendingDislike.id) setViewProduct(null);
  };

  const restoreProduct = (productId: number) => {
    setDisliked(d => d.filter(x => x !== productId));
    showToast('✓ Đã hiện lại sản phẩm', 'success');
  };

  // ─── Wishlist ───
  const toggleWishlist = (id: number) => {
    if (disliked.includes(id)) {
      showToast('Bỏ ẩn sản phẩm trước để thêm vào yêu thích', 'warning');
      return;
    }
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
    showToast(wishlist.includes(id) ? 'Đã bỏ yêu thích' : '❤️ Đã thêm vào yêu thích');
  };

  // ─── Product CRUD ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) { showToast('File quá lớn (tối đa 10MB)', 'error'); return; }
    setSelectedFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct && !selectedFile) { showToast('Vui lòng chọn ảnh sản phẩm', 'error'); return; }
    if (!newProduct.name.trim()) { showToast('Vui lòng nhập tên sản phẩm', 'error'); return; }
    if (Number(newProduct.price) <= 0) { showToast('Giá bán phải lớn hơn 0', 'error'); return; }

    try {
      setLoading(true);
      let imageUrl = editingProduct?.image || '';

      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const path = `${session!.user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('assets').upload(path, selectedFile, { upsert: false });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
      }

      const catLabel = CATEGORIES.find(c => c.id === newProduct.category)?.label || newProduct.category;
      const data = {
        name: newProduct.name.trim(),
        price: Number(newProduct.price),
        original_price: newProduct.original_price && Number(newProduct.original_price) > Number(newProduct.price) ? Number(newProduct.original_price) : null,
        category: catLabel,
        subcategory: newProduct.subcategory || null,
        description: newProduct.description.trim() || null,
        stock: Math.max(0, Number(newProduct.stock) || 0),
        tags: newProduct.tags ? newProduct.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        image: imageUrl,
        seller_id: session!.user.id,
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id).eq('seller_id', session!.user.id);
        if (error) throw error;
        showToast('✓ Cập nhật sản phẩm thành công');
      } else {
        const { error } = await supabase.from('products').insert([data]);
        if (error) throw error;
        showToast('✓ Đã đăng sản phẩm thành công');
      }

      resetProductForm();
      fetchMyProducts();
      fetchAllProducts();
    } catch (err: any) { showToast(err.message || 'Lỗi không xác định', 'error'); } finally { setLoading(false); }
  };

  const resetProductForm = () => {
    setShowAddProduct(false); setEditingProduct(null);
    setSelectedFile(null); setPreviewUrl('');
    setNewProduct({ name: '', price: '', original_price: '', category: 'food', subcategory: '', description: '', stock: '100', tags: '' });
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const catId = CATEGORIES.find(c => c.label === p.category)?.id || 'food';
    setNewProduct({ name: p.name, price: String(p.price), original_price: p.original_price ? String(p.original_price) : '', category: catId, subcategory: p.subcategory || '', description: p.description || '', stock: String(p.stock ?? 100), tags: p.tags?.join(', ') || '' });
    setPreviewUrl(p.image);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Xoá sản phẩm này? Thao tác không thể hoàn tác.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id).eq('seller_id', session!.user.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Đã xoá sản phẩm');
    fetchMyProducts(); fetchAllProducts();
  };

  // ─── Cart ───
  const addToCart = useCallback((product: Product, qty = 1, note = '') => {
    if ((product.stock ?? 1) <= 0) { showToast('Sản phẩm đã hết hàng', 'error'); return; }
    setCart(prev => {
      // Different seller warning
      if (prev.length > 0 && prev[0].seller_id !== product.seller_id) {
        if (!confirm('Giỏ hàng có sản phẩm từ cửa hàng khác. Làm mới giỏ hàng và thêm sản phẩm này?')) return prev;
        return [{ ...product, quantity: qty, note }];
      }
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        const capped = product.stock !== undefined ? Math.min(newQty, product.stock) : newQty;
        return prev.map(i => i.id === product.id ? { ...i, quantity: capped, note: note || i.note } : i);
      }
      return [...prev, { ...product, quantity: qty, note }];
    });
    showToast(`✓ Đã thêm vào giỏ`);
  }, [showToast]);

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(1, i.quantity + delta);
      const capped = i.stock !== undefined ? Math.min(newQty, i.stock) : newQty;
      return { ...i, quantity: capped };
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
    showToast('Đã xoá khỏi giỏ hàng', 'info');
  };

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    const discount = COUPONS[code];
    if (discount) {
      setCouponDiscount(discount);
      showToast(`✓ Mã "${code}" — giảm ${(discount * 100).toFixed(0)}%`);
    } else {
      showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
    }
  };

  const removeCoupon = () => { setCouponDiscount(0); setCouponCode(''); showToast('Đã xoá mã giảm giá', 'info'); };

  // ─── Checkout ───
  const handleCheckout = async () => {
    if (!cart.length || !session?.user?.id) return;
    if (!shippingAddr.trim()) { showToast('Vui lòng nhập địa chỉ giao hàng', 'error'); setCheckoutStep('address'); return; }

    try {
      setSubmittingOrder(true);
      const orderData = {
        total_price: finalTotal,
        subtotal: cartTotal,
        discount_amount: discountAmt,
        shipping_fee: 0,
        seller_id: cart[0].seller_id,
        buyer_id: session.user.id,
        buyer_email: session.user.email,
        status: 'Chờ xác nhận',
        shipping_address: shippingAddr.trim(),
        payment_method: paymentMethod,
        note: orderNote.trim() || null,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image, note: i.note || null })),
      };

      const { data: order, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;

      // Notify seller
      await supabase.from('notifications').insert([{
        user_id: cart[0].seller_id,
        order_id: order.id,
        message: `🛍️ Đơn hàng mới #${String(order.id).slice(-6)} — ${fmt(finalTotal)}`,
        type: 'new_order',
        is_read: false,
      }]);

      // Reset
      setCart([]);
      setShowCart(false);
      setCheckoutStep('cart');
      setShippingAddr('');
      setOrderNote('');
      setCouponCode('');
      setCouponDiscount(0);
      setPaymentMethod('cod');

      showToast('🎉 Đặt hàng thành công! Đang chờ xác nhận...', 'success');

      // Navigate to purchases
      setTimeout(() => setActiveTab('my-purchases'), 1500);
    } catch (err: any) {
      showToast('Lỗi đặt hàng: ' + err.message, 'error');
    } finally { setSubmittingOrder(false); }
  };

  // ─── Order Status Update ───
  const updateOrderStatus = async (order: Order, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id).eq('seller_id', session!.user.id);
      if (error) throw error;

      const msgMap: Record<string, string> = {
        'Đã xác nhận': `✅ Đơn hàng #${String(order.id).slice(-6)} đã được xác nhận!`,
        'Đang giao':   `🚚 Đơn hàng #${String(order.id).slice(-6)} đang trên đường giao đến bạn!`,
        'Hoàn thành':  `🎉 Đơn hàng #${String(order.id).slice(-6)} hoàn thành. Cảm ơn bạn!`,
      };
      const typeMap: Record<string, Notification['type']> = {
        'Đã xác nhận': 'order_confirmed',
        'Đang giao': 'order_shipped',
        'Hoàn thành': 'order_completed',
      };

      if (msgMap[newStatus] && order.buyer_id) {
        await supabase.from('notifications').insert([{
          user_id: order.buyer_id, order_id: order.id,
          message: msgMap[newStatus], type: typeMap[newStatus], is_read: false,
        }]);
      }

      showToast(`✓ Đã cập nhật: ${newStatus}`);
      fetchOrders();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const cancelOrder = async (order: Order) => {
    if (!confirm('Xác nhận từ chối / huỷ đơn hàng này?')) return;
    const { error } = await supabase.from('orders').update({ status: 'Đã hủy' }).eq('id', order.id);
    if (error) { showToast(error.message, 'error'); return; }
    if (order.buyer_id) {
      await supabase.from('notifications').insert([{
        user_id: order.buyer_id, order_id: order.id,
        message: `❌ Đơn hàng #${String(order.id).slice(-6)} đã bị huỷ.`, type: 'system', is_read: false,
      }]);
    }
    showToast('Đã huỷ đơn hàng', 'info');
    fetchOrders();
  };

  const markNotifRead = async (id: number) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotifsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session!.user.id).eq('is_read', false);
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  };

  // ─── Guards ───
  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center">
        <div>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-red-900">Thiếu cấu hình Supabase</h1>
          <p className="text-red-600 mt-2 text-sm">Kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env</p>
        </div>
      </div>
    );
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/30 animate-pulse">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
      </div>
    </div>
  );

  if (!session) return <AuthForm />;
  if (!role) return <RoleSelection onSelect={() => supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))} />;

  const catOptions = CATEGORIES.find(c => c.id === newProduct.category)?.sub || [];

  // ═══════════════════════════ RENDER ═══════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* ── Toasts ── */}
      <div className="fixed top-5 right-5 z-[150] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.92 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold max-w-xs border ${
                t.type === 'success' ? 'bg-gray-900 text-white border-gray-700' :
                t.type === 'error'   ? 'bg-red-600 text-white border-red-500' :
                t.type === 'warning' ? 'bg-amber-500 text-white border-amber-400' :
                'bg-blue-600 text-white border-blue-500'
              }`}>
              {t.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> :
               t.type === 'error'   ? <X className="w-4 h-4 flex-shrink-0" /> :
               t.type === 'warning' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> :
               <Info className="w-4 h-4 flex-shrink-0" />}
              <span className="leading-snug">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Modals / Panels ── */}
      <AnimatePresence>
        {showNotifications && <NotificationPanel notifications={notifications} onClose={() => setShowNotifications(false)} onMarkRead={markNotifRead} onMarkAllRead={markAllNotifsRead} />}
        {showHiddenPanel && <HiddenProductsPanel hiddenIds={disliked} allProducts={allProducts} onRestore={restoreProduct} onClose={() => setShowHiddenPanel(false)} />}
        {pendingDislike && <DislikeModal product={pendingDislike} onConfirm={confirmDislike} onCancel={() => setPendingDislike(null)} />}
        {viewProduct && (
          <ProductDetailModal
            product={viewProduct} onClose={() => setViewProduct(null)}
            onAddToCart={(p, qty, note) => addToCart(p, qty, note)}
            wishlisted={wishlist.includes(viewProduct.id)} onWishlist={toggleWishlist}
            disliked={disliked.includes(viewProduct.id)} onDislike={handleDislikeRequest}
          />
        )}
      </AnimatePresence>

      {/* ══════════ NAVBAR ══════════ */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-5">
          {/* Logo + tabs */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab(role === 'seller' ? 'my-products' : 'marketplace')}>
              <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-black tracking-tight hidden sm:block">Marketplace</span>
              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md hidden sm:block ${role === 'seller' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>
                {role === 'seller' ? 'Seller' : 'Buyer'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {role === 'seller' ? (
                <>
                  {[{ id: 'my-products', icon: LayoutDashboard, label: 'Sản phẩm' }, { id: 'my-orders', icon: BarChart3, label: 'Đơn hàng' }]
                    .map(({ id, icon: Icon, label }) => (
                      <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
                        <Icon className="w-4 h-4" />{label}
                      </button>
                    ))}
                </>
              ) : (
                <>
                  {[
                    { id: 'marketplace', icon: Home, label: 'Mua sắm' },
                    { id: 'my-purchases', icon: Package, label: 'Đơn của tôi' },
                    { id: 'wishlist-tab', icon: Heart, label: 'Yêu thích', badge: wishlist.length },
                  ].map(({ id, icon: Icon, label, badge }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <Icon className="w-4 h-4" />{label}
                      {badge ? <span className={`ml-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{badge}</span> : null}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {/* Hidden products button (buyer only) */}
            {role === 'buyer' && disliked.length > 0 && (
              <button onClick={() => setShowHiddenPanel(true)}
                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500" title="Sản phẩm đã ẩn">
                <EyeOff className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-gray-700 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{disliked.length}</span>
              </button>
            )}

            {role === 'buyer' && (
              <button onClick={() => { setShowCart(true); setCheckoutStep('cart'); }}
                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cart.length > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cart.length > 9 ? '9+' : cart.length}
                  </motion.span>
                )}
              </button>
            )}

            <button onClick={() => setShowNotifications(true)} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-gray-600 max-w-[110px] truncate">{session?.user?.email}</span>
            </div>

            <button onClick={() => supabase.auth.signOut()}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Đăng xuất">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ CONTENT ═══════════════════ */}
      <AnimatePresence mode="wait">

        {/* ██ SELLER: MY PRODUCTS ██ */}
        {activeTab === 'my-products' && (
          <motion.main key="my-products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto p-5 space-y-5">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black">Sản phẩm của tôi</h1>
                <p className="text-gray-500 text-sm">{products.length} sản phẩm đang kinh doanh</p>
              </div>
              <button onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.97] text-sm">
                <PackagePlus className="w-4 h-4" />Thêm sản phẩm
              </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Đang tải...</span></div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
                <Store className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600 mb-1">Cửa hàng trống rỗng</p>
                <p className="text-gray-400 text-sm mb-5">Thêm sản phẩm đầu tiên để bắt đầu bán hàng</p>
                <button onClick={() => setShowAddProduct(true)} className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-blue-700 transition-colors">+ Thêm ngay</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {(searchQuery ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) : products).map(p => {
                  const disc = getDiscount(p);
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                      <div className="h-40 overflow-hidden relative bg-gray-50">
                        <ProductMedia src={p.image} alt={p.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                        {disc > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">-{disc}%</span>}
                        {(p.stock || 0) <= 5 && (p.stock || 0) > 0 && <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Sắp hết</span>}
                        {(p.stock || 0) === 0 && <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Hết hàng</span>}
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-sm truncate mb-0.5">{p.name}</p>
                        <p className="text-blue-600 font-black text-sm">{fmt(p.price)}</p>
                        {p.original_price && p.original_price > p.price && <p className="text-gray-400 text-xs line-through">{fmt(p.original_price)}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[10px] font-bold ${(p.stock || 0) === 0 ? 'text-red-500' : (p.stock || 0) <= 5 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {p.stock !== undefined ? `${p.stock} kho` : '∞ kho'}
                          </span>
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Chỉnh sửa"><Edit className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Xoá"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add/Edit Modal */}
            <AnimatePresence>
              {showAddProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetProductForm} />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                    <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                      <h3 className="text-lg font-black">{editingProduct ? '✏️ Chỉnh sửa sản phẩm' : '📦 Thêm sản phẩm mới'}</h3>
                      <button onClick={resetProductForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
                      {/* Image upload */}
                      <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Ảnh / Video sản phẩm *</label>
                        <label className="relative block h-44 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group">
                          {previewUrl ? (
                            <ProductMedia src={previewUrl} alt="preview" className="w-full h-full" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                              <Camera className="w-10 h-10" />
                              <p className="text-sm font-medium">Nhấn để chọn ảnh hoặc video</p>
                              <p className="text-xs text-gray-300">JPG, PNG, MP4 — tối đa 10MB</p>
                            </div>
                          )}
                          {previewUrl && (
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          )}
                          <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" required={!editingProduct} />
                        </label>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tên sản phẩm *</label>
                        <input required value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                          placeholder="Nhập tên sản phẩm..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                      </div>

                      {/* Category / Subcategory */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Danh mục *</label>
                          <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
                            {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                          </select>
                        </div>
                        {catOptions.length > 0 && (
                          <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Phân loại</label>
                            <select value={newProduct.subcategory} onChange={e => setNewProduct(p => ({ ...p, subcategory: e.target.value }))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
                              <option value="">-- Tất cả --</option>
                              {catOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Giá bán (₫) *</label>
                          <input type="number" required min="1" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                            placeholder="0"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Giá gốc (để tạo sale)</label>
                          <input type="number" min="0" value={newProduct.original_price} onChange={e => setNewProduct(p => ({ ...p, original_price: e.target.value }))}
                            placeholder="Để trống nếu không sale"
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                      </div>

                      {/* Stock + Tags */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Số lượng kho</label>
                          <input type="number" min="0" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tags (phân cách dấu phẩy)</label>
                          <input value={newProduct.tags} onChange={e => setNewProduct(p => ({ ...p, tags: e.target.value }))}
                            placeholder="tươi, ngon, sale..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mô tả sản phẩm</label>
                        <textarea rows={3} value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                          placeholder="Mô tả chi tiết sản phẩm..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all" />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button type="button" onClick={resetProductForm}
                          className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl text-sm transition-all">Huỷ</button>
                        <button type="submit" disabled={loading}
                          className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm transition-all active:scale-[0.98]">
                          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {editingProduct ? 'Lưu thay đổi' : 'Đăng sản phẩm'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.main>
        )}

        {/* ██ SELLER: ORDERS ██ */}
        {activeTab === 'my-orders' && (
          <motion.main key="my-orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto p-5 space-y-5">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black">Quản lý đơn hàng</h1>
                <p className="text-gray-500 text-sm">Xác nhận & cập nhật trạng thái đơn hàng</p>
              </div>
              <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 shadow-sm transition-all">
                <RefreshCw className="w-4 h-4" />Làm mới
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tổng doanh thu', value: fmt(totalRevenue), icon: DollarSign, cls: 'bg-blue-600 text-white', iconCls: 'text-white/30' },
                { label: 'Hôm nay', value: fmt(todayRevenue), icon: TrendingUp, cls: 'bg-emerald-600 text-white', iconCls: 'text-white/30' },
                { label: 'Tổng đơn', value: String(orders.length), icon: ShoppingBag, cls: 'bg-white border border-gray-100', iconCls: 'text-gray-200' },
                { label: 'Chờ xử lý', value: String(orders.filter(o => o.status === 'Chờ xác nhận').length), icon: Clock, cls: 'bg-amber-50 border border-amber-100', iconCls: 'text-amber-200' },
              ].map(({ label, value, icon: Icon, cls, iconCls }) => (
                <div key={label} className={`${cls} rounded-2xl p-5 shadow-sm relative overflow-hidden`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${cls.includes('bg-blue') || cls.includes('bg-emerald') ? 'text-white/60' : 'text-gray-400'}`}>{label}</p>
                  <p className={`text-2xl font-black ${cls.includes('bg-blue') || cls.includes('bg-emerald') ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                  <Icon className={`absolute bottom-4 right-4 w-10 h-10 ${iconCls}`} />
                </div>
              ))}
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center h-48 gap-3"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span className="text-gray-400">Đang tải...</span></div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-500">Chưa có đơn hàng nào</p>
                <p className="text-gray-400 text-sm mt-1">Đơn hàng từ khách sẽ xuất hiện ở đây</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const cfg = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES['Chờ xác nhận'];
                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">#{String(order.id).slice(-8)}</span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                          {order.buyer_email && <p className="text-xs text-gray-500 mt-0.5">👤 {order.buyer_email}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-600 text-xl">{fmt(order.total_price)}</p>
                          {(order.discount_amount || 0) > 0 && <p className="text-xs text-emerald-600">−{fmt(order.discount_amount!)} giảm giá</p>}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                          <span key={idx} className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                      </div>

                      {/* Meta */}
                      {(order.shipping_address || order.note || order.payment_method) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1">
                          {order.shipping_address && <p className="text-xs text-gray-600 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />{order.shipping_address}</p>}
                          {order.note && <p className="text-xs text-gray-500 flex items-start gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />{order.note}</p>}
                          {order.payment_method && <p className="text-xs text-gray-400">💳 {order.payment_method === 'cod' ? 'COD - Tiền mặt' : order.payment_method === 'bank' ? 'Chuyển khoản' : 'MoMo'}</p>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {cfg.next && (
                          <button onClick={() => updateOrderStatus(order, cfg.next!)}
                            className={`flex-1 min-w-[140px] ${cfg.nextBg} text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all active:scale-[0.97]`}>
                            {cfg.nextLabel}
                          </button>
                        )}
                        {(order.status === 'Chờ xác nhận' || order.status === 'Đã xác nhận') && (
                          <button onClick={() => cancelOrder(order)}
                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">
                            Huỷ đơn
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.main>
        )}

        {/* ██ BUYER: MARKETPLACE ██ */}
        {activeTab === 'marketplace' && (
          <motion.main key="marketplace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto p-5 space-y-4">

            {/* Search bar */}
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm sản phẩm, thương hiệu, danh mục..."
                  className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center gap-2 text-sm font-bold ${showFilters ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <Filter className="w-4 h-4" />
                <span className="hidden sm:block">Bộ lọc</span>
              </button>
              {disliked.length > 0 && (
                <button onClick={() => setShowHiddenPanel(true)}
                  className="px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white text-gray-500 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-bold"
                  title={`${disliked.length} sản phẩm đã ẩn`}>
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:block">{disliked.length} ẩn</span>
                </button>
              )}
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sắp xếp</p>
                      <div className="space-y-1">
                        {[
                          { v: 'newest', l: '🕐 Mới nhất' },
                          { v: 'popular', l: '🔥 Phổ biến nhất' },
                          { v: 'price_asc', l: '💰 Giá thấp → cao' },
                          { v: 'price_desc', l: '💎 Giá cao → thấp' },
                          { v: 'rating', l: '⭐ Đánh giá cao' },
                        ].map(({ v, l }) => (
                          <button key={v} onClick={() => setSortBy(v as any)}
                            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all font-medium ${sortBy === v ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Khoảng giá</p>
                      <div className="space-y-1">
                        {[[0, 100_000], [100_000, 500_000], [500_000, 1_000_000], [1_000_000, 5_000_000], [5_000_000, 10_000_000]].map(([min, max]) => (
                          <button key={`${min}-${max}`} onClick={() => setPriceRange([min, max])}
                            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all ${priceRange[0] === min && priceRange[1] === max ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                            {min === 0 ? `Dưới ${fmt(max)}` : `${fmt(min)} – ${fmt(max)}`}
                          </button>
                        ))}
                        {(priceRange[0] !== 0 || priceRange[1] !== 10_000_000) && (
                          <button onClick={() => setPriceRange([0, 10_000_000])} className="text-xs text-blue-500 hover:text-blue-700 font-bold mt-1">✕ Xoá bộ lọc giá</button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Hiển thị</p>
                      <div className="flex gap-2 mb-3">
                        {[{ v: 'grid', icon: Grid3X3 }, { v: 'list', icon: List }].map(({ v, icon: Icon }) => (
                          <button key={v} onClick={() => setViewMode(v as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${viewMode === v ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            <Icon className="w-4 h-4" />{v === 'grid' ? 'Lưới' : 'Danh sách'}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedSubcat(''); setPriceRange([0, 10_000_000]); setSortBy('newest'); setShowFilters(false); }}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">
                        Đặt lại bộ lọc
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedSubcat(''); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat.id ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>

            {/* Sub-categories */}
            <AnimatePresence>
              {selectedCategory !== 'all' && (CATEGORIES.find(c => c.id === selectedCategory)?.sub.length || 0) > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button onClick={() => setSelectedSubcat('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${!selectedSubcat ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    Tất cả
                  </button>
                  {CATEGORIES.find(c => c.id === selectedCategory)?.sub.map(sub => (
                    <button key={sub} onClick={() => setSelectedSubcat(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${selectedSubcat === sub ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {sub}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result info */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {loading ? 'Đang tải...' : (
                  <>
                    <span className="font-bold text-gray-900">{filteredProducts.length}</span> sản phẩm
                    {searchQuery && <span className="text-blue-600"> cho "<strong>{searchQuery}</strong>"</span>}
                    {disliked.length > 0 && <span className="text-gray-400"> (đã ẩn {disliked.length})</span>}
                  </>
                )}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl border transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="text-gray-400 font-medium">Đang tải sản phẩm...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600">Không tìm thấy sản phẩm</p>
                <p className="text-gray-400 text-sm mt-1">Thử thay đổi từ khoá hoặc bộ lọc</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedSubcat(''); setPriceRange([0, 10_000_000]); }}
                  className="mt-4 text-blue-600 font-bold text-sm hover:underline">Xoá bộ lọc →</button>
              </div>
            ) : viewMode === 'grid' ? (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {filteredProducts.map(p => (
                    <ProductCard key={p.id} product={p}
                      onAddToCart={addToCart} onView={setViewProduct}
                      wishlisted={wishlist.includes(p.id)} onWishlist={toggleWishlist}
                      disliked={disliked.includes(p.id)} onDislike={handleDislikeRequest}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setViewProduct(p)}>
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <ProductMedia src={p.image} alt={p.name} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm line-clamp-2 mb-1">{p.name}</p>
                      {p.rating !== undefined && <Stars value={p.rating} />}
                      {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <div>
                        <p className="font-black text-blue-600">{fmt(p.price)}</p>
                        {p.original_price && p.original_price > p.price && <p className="text-xs text-gray-400 line-through">{fmt(p.original_price)}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); handleDislikeRequest(p.id); }}
                          className={`p-2 rounded-xl border transition-all ${disliked.includes(p.id) ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); addToCart(p); }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">Thêm</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.main>
        )}

        {/* ██ BUYER: MY PURCHASES ██ */}
        {activeTab === 'my-purchases' && (
          <motion.main key="my-purchases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto p-5 space-y-5">

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">Đơn hàng của tôi</h1>
                <p className="text-gray-500 text-sm">Theo dõi trạng thái đơn hàng realtime</p>
              </div>
              <button onClick={fetchBuyerOrders}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 shadow-sm transition-all">
                <RefreshCw className="w-4 h-4" />Làm mới
              </button>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
            ) : buyerOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-600">Chưa có đơn hàng nào</p>
                <button onClick={() => setActiveTab('marketplace')} className="mt-3 text-blue-600 font-bold text-sm hover:underline">Bắt đầu mua sắm →</button>
              </div>
            ) : (
              <div className="space-y-4">
                {buyerOrders.map(order => {
                  const cfg = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES['Chờ xác nhận'];
                  const currentStep = PROGRESS_STEPS.indexOf(order.status);
                  return (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">#{String(order.id).slice(-8)}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-600 text-lg">{fmt(order.total_price)}</p>
                          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-5 py-4 flex flex-wrap gap-2">
                        {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            {item.image && <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0"><ProductMedia src={item.image} alt={item.name} className="w-full h-full" /></div>}
                            <span className="text-xs font-bold text-gray-800">{item.name}</span>
                            <span className="text-xs text-gray-400">×{item.quantity}</span>
                            <span className="text-xs font-bold text-blue-600">{fmt(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Meta */}
                      {(order.shipping_address || order.payment_method || (order.discount_amount || 0) > 0) && (
                        <div className="px-5 pb-4 flex flex-wrap gap-3 text-xs text-gray-500">
                          {order.shipping_address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.shipping_address}</span>}
                          {order.payment_method && <span>💳 {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'bank' ? 'Chuyển khoản' : 'MoMo'}</span>}
                          {(order.discount_amount || 0) > 0 && <span className="text-emerald-600 font-bold">Tiết kiệm {fmt(order.discount_amount!)}</span>}
                        </div>
                      )}

                      {/* Progress */}
                      {order.status !== 'Đã hủy' ? (
                        <div className="px-5 pb-6">
                          <div className="flex items-center">
                            {PROGRESS_STEPS.map((step, idx) => {
                              const done = idx <= currentStep;
                              const active = idx === currentStep;
                              return (
                                <React.Fragment key={step}>
                                  <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${done ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-gray-100 text-gray-400'} ${active ? 'ring-4 ring-blue-100' : ''}`}>
                                      {done ? <Check className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className={`text-[9px] font-bold text-center whitespace-nowrap max-w-[56px] leading-tight ${done ? 'text-blue-600' : 'text-gray-400'}`}>{step}</span>
                                  </div>
                                  {idx < PROGRESS_STEPS.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 mb-5 rounded-full transition-all ${idx < currentStep ? 'bg-blue-600' : 'bg-gray-100'}`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mx-5 mb-5 p-3 bg-red-50 rounded-2xl text-red-600 text-sm font-bold text-center border border-red-100">❌ Đơn hàng đã bị huỷ</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.main>
        )}

        {/* ██ BUYER: WISHLIST ██ */}
        {activeTab === 'wishlist-tab' && (
          <motion.main key="wishlist-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto p-5 space-y-5">

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">Yêu thích</h1>
                <p className="text-gray-500 text-sm">{wishlistProducts.length} sản phẩm đã lưu</p>
              </div>
              {disliked.length > 0 && (
                <button onClick={() => setShowHiddenPanel(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all">
                  <EyeOff className="w-4 h-4" />{disliked.length} đã ẩn
                </button>
              )}
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="font-bold text-gray-600 text-lg">Chưa có sản phẩm yêu thích</p>
                <p className="text-gray-400 text-sm mt-1">Nhấn ❤️ trên sản phẩm bất kỳ để lưu lại</p>
                <button onClick={() => setActiveTab('marketplace')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Khám phá ngay →</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {wishlistProducts.map(p => (
                  <ProductCard key={p.id} product={p}
                    onAddToCart={addToCart} onView={setViewProduct}
                    wishlisted={true} onWishlist={toggleWishlist}
                    disliked={disliked.includes(p.id)} onDislike={handleDislikeRequest}
                  />
                ))}
              </div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* ══════════════ CART SIDEBAR ══════════════ */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} />

            <motion.section initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">

              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {checkoutStep !== 'cart' && (
                    <button onClick={() => setCheckoutStep(checkoutStep === 'confirm' ? 'payment' : checkoutStep === 'payment' ? 'address' : 'cart')}
                      className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                      <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                  <h2 className="text-base font-black flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    {checkoutStep === 'cart' ? `Giỏ hàng (${cart.length})` :
                     checkoutStep === 'address' ? 'Địa chỉ & Ghi chú' :
                     checkoutStep === 'payment' ? 'Thanh toán' : 'Xác nhận đơn'}
                  </h2>
                </div>
                <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {/* Steps bar */}
              <div className="flex px-5 py-2.5 border-b border-gray-50 gap-1.5">
                {(['cart', 'address', 'payment', 'confirm'] as const).map((step, idx) => (
                  <div key={step} className={`flex-1 h-1.5 rounded-full transition-all ${['cart', 'address', 'payment', 'confirm'].indexOf(checkoutStep) >= idx ? 'bg-blue-600' : 'bg-gray-100'}`} />
                ))}
              </div>

              {/* ── STEP: Cart ── */}
              {checkoutStep === 'cart' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-gray-300">
                        <ShoppingBag className="w-14 h-14" />
                        <p className="font-bold text-gray-400">Giỏ hàng trống</p>
                        <button onClick={() => { setShowCart(false); setActiveTab('marketplace'); }}
                          className="text-blue-600 text-sm font-bold hover:underline">Khám phá sản phẩm →</button>
                      </div>
                    ) : cart.map(item => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3 group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                          <ProductMedia src={item.image} alt={item.name} className="w-full h-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate leading-snug">{item.name}</p>
                          <p className="text-blue-600 font-black text-sm">{fmt(item.price)}</p>
                          {item.note && <p className="text-xs text-gray-400 italic truncate mt-0.5">"{item.note}"</p>}
                          <div className="flex items-center gap-2 mt-2 bg-white rounded-xl border border-gray-200 w-fit p-0.5">
                            <button onClick={() => updateQty(item.id, -1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Minus className="w-3 h-3 text-gray-600" /></button>
                            <span className="font-black text-sm w-6 text-center select-none">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Plus className="w-3 h-3 text-gray-600" /></button>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-4 border-t border-gray-100 space-y-3 bg-white">
                      {/* Coupon */}
                      {couponDiscount > 0 ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                          <span className="text-emerald-700 font-bold text-sm">✓ Giảm {(couponDiscount * 100).toFixed(0)}% — {couponCode}</span>
                          <button onClick={removeCoupon} className="text-emerald-600 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá..."
                            onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                          <button onClick={applyCoupon} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors">Áp dụng</button>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-500"><span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span><span>{fmt(cartTotal)}</span></div>
                        {couponDiscount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Giảm giá {(couponDiscount * 100).toFixed(0)}%</span><span>−{fmt(discountAmt)}</span></div>}
                        <div className="flex justify-between text-gray-400 text-xs"><span>Phí vận chuyển</span><span className="text-emerald-600 font-bold">Miễn phí</span></div>
                        <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                          <span>Tổng cộng</span><span className="text-blue-600 text-xl">{fmt(finalTotal)}</span>
                        </div>
                      </div>

                      <button onClick={() => setCheckoutStep('address')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
                        Tiếp tục <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── STEP: Address ── */}
              {checkoutStep === 'address' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Địa chỉ giao hàng *</label>
                      <textarea value={shippingAddr} onChange={e => setShippingAddr(e.target.value)} rows={3} required
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Ghi chú cho người bán (tuỳ chọn)</label>
                      <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2}
                        placeholder="Thời gian giao hàng, yêu cầu đặc biệt..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <button onClick={() => {
                      if (!shippingAddr.trim()) { showToast('Vui lòng nhập địa chỉ giao hàng', 'error'); return; }
                      setCheckoutStep('payment');
                    }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                      Tiếp tục <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP: Payment ── */}
              {checkoutStep === 'payment' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Phương thức thanh toán</p>
                    {[
                      { id: 'cod' as const, icon: '💵', label: 'Tiền mặt khi nhận (COD)', desc: 'Thanh toán khi nhận hàng' },
                      { id: 'bank' as const, icon: '🏦', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản trước khi giao' },
                      { id: 'momo' as const, icon: '📱', label: 'Ví MoMo', desc: 'Thanh toán qua MoMo' },
                    ].map(({ id, icon, label, desc }) => (
                      <button key={id} onClick={() => setPaymentMethod(id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${paymentMethod === id ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                        {paymentMethod === id && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <button onClick={() => setCheckoutStep('confirm')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                      Xem lại đơn hàng <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP: Confirm ── */}
              {checkoutStep === 'confirm' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Items summary */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="font-black text-sm text-gray-700 mb-3">📦 Sản phẩm</p>
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span className="font-bold text-blue-600">{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order info */}
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="font-black text-sm text-gray-700 mb-3">📋 Thông tin đơn</p>
                      <div className="text-sm space-y-2">
                        <div className="flex gap-2 items-start">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600 leading-snug">{shippingAddr}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className="text-base">💳</span>
                          <span className="text-gray-600">{paymentMethod === 'cod' ? 'COD - Tiền mặt khi nhận' : paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Ví MoMo'}</span>
                        </div>
                        {orderNote && (
                          <div className="flex gap-2 items-start">
                            <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-500 italic leading-snug">{orderNote}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{fmt(cartTotal)}</span></div>
                        {couponDiscount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Giảm giá</span><span>−{fmt(discountAmt)}</span></div>}
                        <div className="flex justify-between text-gray-400"><span>Vận chuyển</span><span className="text-emerald-600 font-bold">Miễn phí</span></div>
                        <div className="flex justify-between font-black text-base pt-2 border-t border-blue-200 mt-1">
                          <span>Tổng thanh toán</span>
                          <span className="text-blue-600 text-xl">{fmt(finalTotal)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-gray-100 space-y-2">
                    <button onClick={handleCheckout} disabled={submittingOrder}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
                      {submittingOrder ? <><Loader2 className="w-5 h-5 animate-spin" />Đang đặt hàng...</> : <><Check className="w-5 h-5" />Đặt hàng {fmt(finalTotal)}</>}
                    </button>
                    <p className="text-xs text-gray-400 text-center">Đơn hàng sẽ được gửi cho người bán và chờ xác nhận</p>
                  </div>
                </>
              )}
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/60 z-20 md:hidden">
        <div className="flex items-center justify-around py-2 px-2 safe-bottom">
          {role === 'buyer' ? (
            <>
              {[
                { id: 'marketplace', icon: Home, label: 'Mua sắm' },
                { id: 'my-purchases', icon: Package, label: 'Đơn hàng' },
                { id: 'wishlist-tab', icon: Heart, label: 'Yêu thích' },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${activeTab === id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={() => setShowCart(true)} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
                <span className="text-[9px] font-bold">Giỏ</span>
              </button>
              <button onClick={() => setShowNotifications(true)} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                <span className="text-[9px] font-bold">Thông báo</span>
              </button>
            </>
          ) : (
            <>
              {[{ id: 'my-products', icon: Store, label: 'Sản phẩm' }, { id: 'my-orders', icon: BarChart3, label: 'Đơn hàng' }].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-all ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={() => setShowAddProduct(true)}
                className="flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl text-gray-400">
                <PackagePlus className="w-5 h-5" />
                <span className="text-[9px] font-bold">Thêm SP</span>
              </button>
              <button onClick={() => setShowNotifications(true)} className="flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl text-gray-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
                <span className="text-[9px] font-bold">Thông báo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* bottom padding for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
