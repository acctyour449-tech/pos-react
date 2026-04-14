```tsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, Zap, Loader2, AlertCircle,
  LayoutDashboard, BarChart3, Clock, DollarSign, LogIn, UserPlus,
  LogOut, Mail, Lock, Store, User, PackagePlus, ShoppingBag, Search,
  ChevronRight, Star, Edit, Bell, BellRing, CheckCircle2,
  Package, Truck, Check, X, Heart, TrendingUp,
  Tag, Grid3X3, List, SlidersHorizontal, ChevronDown,
  MapPin, MessageCircle, RefreshCw, Flame,
  Camera, Filter, ChevronLeft, Home, EyeOff, Eye,
  AlertTriangle, Info, ArrowUpRight, Percent, Award,
  Copy, ExternalLink, ChevronUp, PackageX, RotateCcw,
  ThumbsUp, MessageSquare, Sparkles, BookmarkPlus,
  Image as ImageIcon, MessageSquareReply, StarHalf
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// ─────────────────── TYPES ───────────────────
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
  description?: string;
  stock?: number;
  sold_count?: number;
  rating?: number;
  review_count?: number;
  tags?: string[];
  is_featured?: boolean;
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
  buyer_email?: string;
  status: string;
  shipping_address?: string;
  payment_method?: string;
  note?: string;
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

interface Review {
  id: number;
  product_id: number;
  buyer_id: string;
  buyer_email?: string;
  rating: number;
  comment: string;
  images?: string[];         // MỚI: Ảnh review
  seller_reply?: string;     // MỚI: Shop trả lời
  reply_created_at?: string; // MỚI: Thời gian trả lời
  created_at: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// ─────────────────── CONSTANTS ───────────────────
const CATEGORIES = [
  { id: 'all',         label: 'Tất cả',     icon: '🏪', sub: [] },
  { id: 'food',        label: 'Thực phẩm',  icon: '🥘', sub: ['Đồ ăn nhanh', 'Đặc sản', 'Hữu cơ', 'Bánh kẹo', 'Gia vị'] },
  { id: 'drink',       label: 'Đồ uống',    icon: '☕', sub: ['Cà phê', 'Trà', 'Nước ép', 'Sinh tố', 'Nước đóng chai'] },
  { id: 'fashion',     label: 'Thời trang', icon: '👗', sub: ['Áo', 'Quần', 'Váy', 'Phụ kiện', 'Giày dép'] },
  { id: 'electronics', label: 'Điện tử',    icon: '📱', sub: ['Điện thoại', 'Laptop', 'Tai nghe', 'Phụ kiện', 'Smart home'] },
  { id: 'beauty',      label: 'Làm đẹp',   icon: '💄', sub: ['Skincare', 'Makeup', 'Tóc', 'Nước hoa', 'Nail'] },
  { id: 'home',        label: 'Gia dụng',   icon: '🏠', sub: ['Nội thất', 'Nhà bếp', 'Phòng ngủ', 'Trang trí', 'Vệ sinh'] },
  { id: 'sport',       label: 'Thể thao',   icon: '⚽', sub: ['Gym', 'Yoga', 'Bơi lội', 'Chạy bộ', 'Cầu lông'] },
  { id: 'books',       label: 'Sách',       icon: '📚', sub: ['Tiểu thuyết', 'Kỹ năng', 'Khoa học', 'Trẻ em', 'Giáo trình'] },
];

const ORDER_STATUSES: Record<string, {
  color: string; dot: string; label: string;
  next: string | null; nextLabel: string | null; nextBg: string | null;
}> = {
  'Chờ xác nhận': { color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',  label: 'Chờ xác nhận', next: 'Đã xác nhận', nextLabel: '✓ Xác nhận',    nextBg: 'bg-emerald-600 hover:bg-emerald-700' },
  'Đã xác nhận':  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Đã xác nhận', next: 'Đang giao',   nextLabel: '🚚 Giao hàng', nextBg: 'bg-blue-600 hover:bg-blue-700' },
  'Đang giao':    { color: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400',   label: 'Đang giao',    next: 'Hoàn thành',  nextLabel: '🎉 Hoàn thành', nextBg: 'bg-violet-600 hover:bg-violet-700' },
  'Hoàn thành':   { color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400', label: 'Hoàn thành',   next: null,          nextLabel: null,            nextBg: null },
  'Đã hủy':       { color: 'bg-red-100 text-red-600 border-red-200',          dot: 'bg-red-400',    label: 'Đã hủy',       next: null,          nextLabel: null,            nextBg: null },
};

const PROGRESS_STEPS = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Hoàn thành'];

const COUPONS: Record<string, number> = {
  SALE10: 0.10, WELCOME: 0.15, FIT20: 0.20, VIP30: 0.30,
};

// ─────────────────── HELPERS ───────────────────
const fmt = (p: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

const isVid = (url: string) =>
  !!url && ['.mp4', '.webm', '.ogg', '.mov'].some(e => url.toLowerCase().split('?')[0].endsWith(e));

const timeAgo = (date: string) => {
  const d = (Date.now() - new Date(date).getTime()) / 1000;
  if (d < 60)    return 'vừa xong';
  if (d < 3600)  return `${Math.floor(d / 60)} phút trước`;
  if (d < 86400) return `${Math.floor(d / 3600)} giờ trước`;
  return new Date(date).toLocaleDateString('vi-VN');
};

const discountPct = (p: Product) =>
  p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100) : 0;

// ─────────────────── MEDIA COMPONENT ───────────────────
function Media({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src)         return <div className={`bg-gray-100 flex items-center justify-center ${className}`}><Package className="w-8 h-8 text-gray-300" /></div>;
  if (isVid(src))   return <video src={src} className={`object-cover ${className}`} muted loop playsInline />;
  if (err)          return <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}><Package className="w-8 h-8 text-gray-300" /></div>;
  return <img src={src} alt={alt} className={`object-cover ${className}`} referrerPolicy="no-referrer" onError={() => setErr(true)} />;
}

// ─────────────────── STAR RATING ───────────────────
function Stars({ value, size = 'sm', onChange }: {
  value: number; size?: 'sm' | 'md' | 'lg'; onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7';
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} transition-colors ${onChange ? 'cursor-pointer' : ''} ${(hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
}

// ─────────────────── FLASH SALE TIMER ───────────────────
function FlashTimer({ endsAt }: { endsAt: Date }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, endsAt.getTime() - Date.now()));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  if (left <= 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
      <span className="text-[10px] font-black text-red-600">KẾT THÚC SAU</span>
      {[h, m, s].map((v, i) => (
        <React.Fragment key={i}>
          <span className="bg-red-600 text-white text-[11px] font-black px-1.5 py-0.5 rounded-md min-w-[24px] text-center tabular-nums">{String(v).padStart(2,'0')}</span>
          {i < 2 && <span className="text-red-500 font-black text-xs">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────── PRODUCT CARD ───────────────────
function ProductCard({ product, onAdd, onView, onWishlist, wishlisted, onHide, hidden }: {
  product: Product; onAdd: (p: Product) => void;
  onView: (p: Product) => void; onWishlist: (id: number) => void;
  wishlisted: boolean; onHide: (id: number) => void; hidden: boolean;
}) {
  const disc = discountPct(product);
  const oos  = (product.stock ?? 1) <= 0;

  return (
    <motion.div layout whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-blue-500/8 group cursor-pointer"
      onClick={() => onView(product)}>
      <div className="h-48 relative bg-gray-50 overflow-hidden">
        <Media src={product.image} alt={product.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {disc > 0  && <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">-{disc}%</span>}
          {product.is_featured && <span className="bg-amber-400 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />Hot</span>}
          {(product.sold_count||0) > 100 && <span className="bg-violet-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Bán chạy</span>}
          {oos && <span className="bg-gray-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Hết hàng</span>}
        </div>

        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onWishlist(product.id); }}
            className={`p-2 rounded-xl backdrop-blur-sm border shadow-sm transition-all ${wishlisted ? 'bg-red-500 text-white border-red-400' : 'bg-white/90 text-gray-400 hover:text-red-400 border-white/50'}`}>
            <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-white' : ''}`} />
          </button>
          <button onClick={e => { e.stopPropagation(); onHide(product.id); }}
            title="Ẩn sản phẩm này"
            className="p-2 rounded-xl backdrop-blur-sm border bg-white/90 text-gray-400 hover:text-gray-700 border-white/50 shadow-sm transition-all">
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-0.5 rounded-full">
          {product.category}
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="font-bold text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-blue-600 transition-colors">{product.name}</h3>
        {product.rating !== undefined && (
          <div className="flex items-center gap-1.5 mb-2">
            <Stars value={product.rating} />
            <span className="text-[10px] text-gray-400 font-bold">({product.review_count||0})</span>
            {(product.sold_count||0) > 0 && <span className="text-[10px] text-gray-400">· {product.sold_count} bán</span>}
          </div>
        )}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-blue-600 font-black text-base leading-none">{fmt(product.price)}</p>
            {product.original_price && product.original_price > product.price && (
              <p className="text-gray-400 text-xs line-through mt-0.5">{fmt(product.original_price)}</p>
            )}
          </div>
          <button onClick={e => { e.stopPropagation(); if (!oos) onAdd(product); }} disabled={oos}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${oos ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25'}`}>
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────── PRODUCT DETAIL MODAL ───────────────────
function ProductModal({ product, onClose, onAdd, wishlisted, onWishlist, reviews }: {
  product: Product; onClose: () => void;
  onAdd: (p: Product, qty: number, note: string) => void;
  wishlisted: boolean; onWishlist: (id: number) => void;
  reviews: Review[];
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState<'info' | 'reviews'>('info');
  const imgs = product.images?.length ? product.images : [product.image];
  const disc = discountPct(product);
  const oos  = (product.stock ?? 1) <= 0;
  const maxQ = product.stock ?? 99;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative bg-white rounded-t-[2rem] sm:rounded-3xl w-full sm:max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2.5 bg-black/15 hover:bg-black/30 backdrop-blur-sm rounded-full transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="h-64 relative flex-shrink-0 bg-gray-100">
          <Media src={imgs[activeImg]} alt={product.name} className="w-full h-full" />
          {disc > 0 && <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">-{disc}%</span>}
          {imgs.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {imgs.map((_, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`h-1.5 rounded-full transition-all bg-white ${i === activeImg ? 'w-5 opacity-100' : 'w-1.5 opacity-50'}`} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-black leading-tight flex-1">{product.name}</h2>
              <button onClick={() => onWishlist(product.id)}
                className={`p-2.5 rounded-xl border-2 transition-all flex-shrink-0 ${wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200'}`}>
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>

            {product.rating !== undefined && (
              <div className="flex items-center gap-2">
                <Stars value={product.rating} size="md" />
                <span className="font-bold text-sm text-gray-700">{product.rating}/5</span>
                <span className="text-gray-400 text-sm">({product.review_count||0} đánh giá)</span>
                {(product.sold_count||0) > 0 && <span className="text-gray-400 text-sm">· {product.sold_count} bán</span>}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-3xl font-black text-blue-600">{fmt(product.price)}</span>
              {product.original_price && product.original_price > product.price && <>
                <span className="text-lg text-gray-400 line-through">{fmt(product.original_price)}</span>
                <span className="bg-red-50 text-red-600 text-xs font-black px-2.5 py-1 rounded-full border border-red-100">
                  Tiết kiệm {fmt(product.original_price - product.price)}
                </span>
              </>}
            </div>

            {product.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map(t => <span key={t} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">#{t}</span>)}
              </div>
            ) : null}

            {product.stock !== undefined && (
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl ${oos ? 'bg-red-50 text-red-600' : product.stock <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                <Package className="w-4 h-4" />
                {oos ? 'Hết hàng' : product.stock <= 5 ? `Chỉ còn ${product.stock}` : `Còn ${product.stock} sản phẩm`}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {(['info', 'reviews'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                  {t === 'info' ? 'Thông tin' : `Đánh giá (${reviews.length})`}
                </button>
              ))}
            </div>

            {tab === 'info' && (
              <div className="space-y-4">
                {product.description && <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider">Ghi chú (tuỳ chọn)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                    placeholder="Size, màu, yêu cầu đặc biệt..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                </div>
              </div>
            )}

            {tab === 'reviews' && (() => {
              const [filterRating, setFilterRating] = useState<number | null>(null);
              const [filterHasMedia, setFilterHasMedia] = useState(false);

              const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
              
              const filteredReviews = reviews.filter(r => 
                (filterRating ? r.rating === filterRating : true) &&
                (filterHasMedia ? r.images && r.images.length > 0 : true)
              );

              return (
                <div className="space-y-5">
                  {/* Thống kê Tổng quan */}
                  {reviews.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col sm:flex-row gap-6">
                      <div className="flex flex-col items-center justify-center sm:pr-6 sm:border-r border-gray-200">
                        <span className="text-4xl font-black text-amber-500">{avgRating}</span>
                        <Stars value={Math.round(Number(avgRating))} size="md" />
                        <span className="text-xs text-gray-500 mt-1">{reviews.length} đánh giá</span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = reviews.filter(r => r.rating === star).length;
                          const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-8 font-bold text-gray-600">{star} sao</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
                              </div>
                              <span className="w-8 text-right text-gray-400">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Bộ lọc */}
                  {reviews.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { setFilterRating(null); setFilterHasMedia(false); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${!filterRating && !filterHasMedia ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600'}`}>Tất cả</button>
                      {[5, 4, 3, 2, 1].map(star => (
                        <button key={star} onClick={() => { setFilterRating(star); setFilterHasMedia(false); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterRating === star ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600'}`}>{star} Sao</button>
                      ))}
                      <button onClick={() => { setFilterHasMedia(true); setFilterRating(null); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterHasMedia ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600'}`}>Có hình ảnh</button>
                    </div>
                  )}

                  {/* Danh sách Đánh giá */}
                  <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Chưa có đánh giá nào phù hợp</p>
                      </div>
                    ) : filteredReviews.map(r => (
                      <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                              {r.buyer_email?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-xs">{r.buyer_email?.split('@')[0] || 'Khách hàng'}</p>
                              <Stars value={r.rating} />
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        
                        {r.comment && <p className="text-sm text-gray-700 leading-relaxed mt-2">{r.comment}</p>}
                        
                        {/* Hiển thị ảnh của khách */}
                        {r.images && r.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {r.images.map((img, i) => (
                              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                <Media src={img} className="w-full h-full" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Hiển thị phản hồi của Shop */}
                        {r.seller_reply && (
                          <div className="mt-4 bg-gray-50 border-l-4 border-blue-500 rounded-r-xl p-3">
                            <p className="text-xs font-black text-blue-700 mb-1 flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Phản hồi của Người bán</p>
                            <p className="text-sm text-gray-600">{r.seller_reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {tab === 'info' && (
          <div className="p-4 border-t border-gray-100 flex gap-3 items-center bg-white flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 flex-shrink-0">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"><Minus className="w-3.5 h-3.5" /></button>
              <span className="font-black text-base w-8 text-center">{qty}</span>
              <button onClick={() => setQty(q => Math.min(maxQ, q + 1))} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"><Plus className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={() => { if (!oos) { onAdd(product, qty, note); onClose(); } }} disabled={oos}
              className={`flex-1 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] ${oos ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25'}`}>
              <ShoppingCart className="w-4 h-4" />
              {oos ? 'Hết hàng' : `Thêm — ${fmt(product.price * qty)}`}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─────────────────── AUTH FORM ───────────────────
function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
    setLoading(true); setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { data: { role } } });
        if (error) throw error;
        alert('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.');
      }
    } catch (err: any) {
      const map: Record<string, string> = {
        'Invalid login credentials': 'Email hoặc mật khẩu không đúng',
        'User already registered': 'Email đã được đăng ký',
        'Email not confirmed': 'Vui lòng xác nhận email trước khi đăng nhập',
      };
      setError(map[err.message] || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-2xl shadow-blue-600/40">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Marketplace Pro</h1>
          <p className="text-blue-200/60 mt-1 text-sm">{isLogin ? 'Chào mừng quay lại 👋' : 'Tạo tài khoản mới'}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/40" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email của bạn"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/40" />
            <input type="password" required value={pw} onChange={e => setPw(e.target.value)} placeholder="Mật khẩu (tối thiểu 6 ký tự)"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-sm" />
          </div>

          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              {(['buyer', 'seller'] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 text-sm font-bold transition-all ${role === r ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  {r === 'buyer' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                  {r === 'buyer' ? 'Người mua' : 'Người bán'}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/15 border border-red-400/30 text-red-200 p-3 rounded-2xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-[0.98] text-sm">
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

// ─────────────────── ROLE SELECTION ───────────────────
function RoleSelection({ onSelect }: { onSelect: (r: 'seller' | 'buyer') => void }) {
  const [loading, setLoading] = useState<string | null>(null);
  const pick = async (r: 'seller' | 'buyer') => {
    setLoading(r);
    try {
      const { error } = await supabase.auth.updateUser({ data: { role: r } });
      if (error) throw error;
      onSelect(r);
    } catch (e: any) { alert(e.message); } finally { setLoading(null); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl text-center">
        <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/30">
          <User className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black mb-3">Bạn muốn làm gì?</h1>
        <p className="text-gray-500 mb-10">Chọn vai trò để trải nghiệm phù hợp</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { r: 'buyer' as const,  Icon: ShoppingBag, title: 'Tôi muốn mua sắm',  desc: 'Khám phá sản phẩm, mua sắm, theo dõi đơn hàng realtime', col: 'blue' },
            { r: 'seller' as const, Icon: Store,       title: 'Tôi muốn bán hàng', desc: 'Mở gian hàng, quản lý sản phẩm, theo dõi doanh thu',      col: 'violet' },
          ].map(({ r, Icon, title, desc, col }) => (
            <button key={r} onClick={() => pick(r)} disabled={!!loading}
              className={`group relative p-8 rounded-3xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-xl bg-white ${col === 'blue' ? 'border-blue-100 hover:border-blue-400 hover:bg-blue-50' : 'border-violet-100 hover:border-violet-400 hover:bg-violet-50'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all ${col === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg' : 'bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-lg'}`}>
                {loading === r ? <Loader2 className="w-7 h-7 animate-spin" /> : <Icon className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-black mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────── NOTIFICATION PANEL ───────────────────
function NotifPanel({ notifications, onClose, onRead, onReadAll }: {
  notifications: Notification[]; onClose: () => void;
  onRead: (id: number) => void; onReadAll: () => void;
}) {
  const icons: Record<string, React.ReactNode> = {
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
        <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2"><BellRing className="w-5 h-5 text-blue-600" />Thông báo</h2>
            {unread > 0 && <p className="text-xs text-gray-400 mt-0.5">{unread} chưa đọc</p>}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && <button onClick={onReadAll} className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded-lg transition-all">Đọc tất cả</button>}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 p-10">
              <Bell className="w-14 h-14" /><p className="font-bold text-gray-400 text-sm">Không có thông báo</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} onClick={() => !n.is_read && onRead(n.id)}
              className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
              <div className="mt-0.5 p-2 bg-gray-100 rounded-xl flex-shrink-0">{icons[n.type] || icons.system}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0 animate-pulse" />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────── REVIEW MODAL ───────────────────
function ReviewModal({ order, onClose, onSubmit }: {
  order: Order; onClose: () => void;
  onSubmit: (productId: number, rating: number, comment: string, images: string[]) => Promise<void>;
}) {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [images, setImages] = useState<Record<number, File[]>>({});
  const [loading, setLoading] = useState(false);

  const items: Array<{ id: number; name: string }> = Array.isArray(order.items) ? order.items : [];

  const handleImageSelect = (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3); // Tối đa 3 ảnh
      setImages(prev => ({ ...prev, [productId]: [...(prev[productId] || []), ...files].slice(0, 3) }));
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      for (const item of items) {
        if (ratings[item.id]) {
          // Upload ảnh lên Supabase Storage
          let uploadedUrls: string[] = [];
          if (images[item.id]) {
            for (const file of images[item.id]) {
              const path = `reviews/${Date.now()}_${file.name}`;
              const { error } = await supabase.storage.from('assets').upload(path, file);
              if (!error) {
                const url = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
                uploadedUrls.push(url);
              }
            }
          }
          await onSubmit(item.id, ratings[item.id], comments[item.id] || '', uploadedUrls);
        }
      }
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
          <h3 className="font-black text-lg">⭐ Đánh giá sản phẩm</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          {items.map((item) => (
            <div key={item.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
              <p className="font-bold text-sm text-gray-800">{item.name}</p>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-600">Chất lượng:</span>
                <Stars value={ratings[item.id] || 0} size="lg" onChange={v => setRatings(r => ({ ...r, [item.id]: v }))} />
              </div>

              <textarea rows={3} value={comments[item.id] || ''} onChange={e => setComments(c => ({ ...c, [item.id]: e.target.value }))}
                placeholder="Hãy chia sẻ nhận xét của bạn về sản phẩm (tùy chọn)..."
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
              
              {/* Upload Ảnh */}
              <div>
                <label className="flex items-center justify-center gap-2 w-fit px-4 py-2 bg-white border border-gray-200 hover:border-blue-400 rounded-xl cursor-pointer transition-colors text-sm font-bold text-gray-600">
                  <ImageIcon className="w-4 h-4 text-blue-500" /> Thêm ảnh (Tối đa 3)
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleImageSelect(item.id, e)} />
                </label>
                {images[item.id]?.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {images[item.id].map((file, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        <button onClick={() => setImages(prev => ({ ...prev, [item.id]: prev[item.id].filter((_, index) => index !== i) }))} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"><X className="w-2 h-2 text-white" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button onClick={submit} disabled={loading || Object.keys(ratings).length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ThumbsUp className="w-5 h-5" />}
            Gửi đánh giá
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════ MAIN APP ═══════════════════════════════
export default function App() {
  // Auth
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Navigation
  const [activeTab, setActiveTab] = useState('');
  // Data
  const [products, setProducts] = useState<Product[]>([]);      
  const [allProducts, setAllProducts] = useState<Product[]>([]); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  // Seller Review Data
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  // Loading states
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  // UI State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'confirm'>('cart');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  // Wishlist / hidden
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [hidden, setHidden] = useState<number[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [pendingHide, setPendingHide] = useState<Product | null>(null);
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedSub, setSelectedSub] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10_000_000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', price: '', original_price: '', category: 'food', subcategory: '', description: '', stock: '100', tags: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  // Checkout form
  const [shippingAddr, setShippingAddr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'momo'>('cod');
  const [orderNote, setOrderNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  // Seller
  const [sellerSearch, setSellerSearch] = useState('');
  const [sellerViewMode, setSellerViewMode] = useState<'grid' | 'list'>('grid');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  const rtRef = useRef<any>(null);

  // ── Derived ──
  const role = useMemo(() => session?.user?.user_metadata?.role as 'seller' | 'buyer' | undefined, [session]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const discountAmt = cartTotal * couponDiscount;
  const finalTotal  = Math.max(0, cartTotal - discountAmt);
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + (Number(o.total_price)||0), 0), [orders]);
  const todayRevenue = useMemo(() => {
    const t = new Date().toDateString();
    return orders.filter(o => new Date(o.created_at).toDateString() === t).reduce((s, o) => s + Number(o.total_price), 0);
  }, [orders]);

  const filteredProducts = useMemo(() => {
    let list = allProducts.filter(p => !hidden.includes(p.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.tags?.some(t => t.toLowerCase().includes(q)));
    }
    if (selectedCat !== 'all') {
      const label = CATEGORIES.find(c => c.id === selectedCat)?.label;
      if (label) list = list.filter(p => p.category === label);
    }
    if (selectedSub) list = list.filter(p => p.subcategory === selectedSub);
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sortBy) {
      case 'price_asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating':     list.sort((a, b) => (b.rating||0) - (a.rating||0)); break;
      case 'popular':    list.sort((a, b) => (b.sold_count||0) - (a.sold_count||0)); break;
      default:           list.sort((a, b) => new Date(b.created_at||0).getTime() - new Date(a.created_at||0).getTime());
    }
    return list;
  }, [allProducts, hidden, searchQuery, selectedCat, selectedSub, sortBy, priceRange]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter(o => o.status === orderFilter);
  }, [orders, orderFilter]);

  const wishlistProducts = useMemo(() => allProducts.filter(p => wishlist.includes(p.id)), [allProducts, wishlist]);
  const hiddenProducts   = useMemo(() => allProducts.filter(p => hidden.includes(p.id)),   [allProducts, hidden]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(p => [...p.slice(-4), { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  // ── Persist ──
  useEffect(() => {
    if (!session?.user?.id) return;
    try {
      const w = localStorage.getItem(`wl_${session.user.id}`);
      const h = localStorage.getItem(`hd_${session.user.id}`);
      if (w) setWishlist(JSON.parse(w));
      if (h) setHidden(JSON.parse(h));
    } catch {}
  }, [session?.user?.id]);

  useEffect(() => { if (session?.user?.id) localStorage.setItem(`wl_${session.user.id}`, JSON.stringify(wishlist)); }, [wishlist, session?.user?.id]);
  useEffect(() => { if (session?.user?.id) localStorage.setItem(`hd_${session.user.id}`, JSON.stringify(hidden)); }, [hidden, session?.user?.id]);

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (role === 'seller') setActiveTab('my-products');
    else if (role === 'buyer') setActiveTab('marketplace');
  }, [role]);

  // ── Triggers ──
  useEffect(() => { if (session) fetchAll(); }, [session]);
  useEffect(() => { if (session && role === 'seller') fetchMine(); }, [session, role]); // Lấy products luôn cho tab reviews
  useEffect(() => { if (activeTab === 'my-orders' && role === 'seller') fetchOrders(); }, [activeTab, role]);
  useEffect(() => { if (activeTab === 'my-purchases' && role === 'buyer') fetchBuyerOrders(); }, [activeTab, role]);
  useEffect(() => { if (activeTab === 'my-reviews' && role === 'seller') fetchSellerReviews(); }, [activeTab, role, products]);
  useEffect(() => { if (session?.user?.id) { fetchNotifs(); setupRT(); } return () => { if (rtRef.current) supabase.removeChannel(rtRef.current); }; }, [session?.user?.id]);

  // ── Fetching ──
  async function fetchAll() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAllProducts(data || []);
    } catch (e: any) { toast('Lỗi tải sản phẩm: ' + e.message, 'error'); }
    finally { setLoading(false); }
  }

  async function fetchMine() {
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

  async function fetchNotifs() {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', session!.user.id).order('created_at', { ascending: false }).limit(50);
    setNotifications(data || []);
  }

  async function fetchReviews(productId: number) {
    const { data } = await supabase.from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });
    setReviews(data || []);
  }

  async function fetchSellerReviews() {
    const productIds = products.map(p => p.id);
    if (productIds.length === 0) { setSellerReviews([]); return; }
    const { data } = await supabase.from('reviews').select('*').in('product_id', productIds).order('created_at', { ascending: false });
    setSellerReviews(data || []);
  }

  function setupRT() {
    if (rtRef.current) supabase.removeChannel(rtRef.current);
    const uid = session!.user.id;
    rtRef.current = supabase.channel('rt-' + uid)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, payload => {
        const n = payload.new as Notification;
        setNotifications(p => [n, ...p]);
        toast(`🔔 ${n.message}`, 'info');
      })
      .subscribe();
  }

  // ── Product Form ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast('File quá lớn (tối đa 10MB)', 'error'); return; }
    setSelectedFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct && !selectedFile) { toast('Vui lòng chọn ảnh sản phẩm', 'error'); return; }
    if (!productForm.name.trim()) { toast('Vui lòng nhập tên sản phẩm', 'error'); return; }
    if (Number(productForm.price) <= 0) { toast('Giá phải lớn hơn 0', 'error'); return; }
    try {
      setLoading(true);
      let imgUrl = editingProduct?.image || '';
      if (selectedFile) {
        const ext  = selectedFile.name.split('.').pop();
        const path = `${session!.user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from('assets').upload(path, selectedFile);
        if (error) throw error;
        imgUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
      }
      const catLabel = CATEGORIES.find(c => c.id === productForm.category)?.label || productForm.category;
      const data = {
        name: productForm.name.trim(), price: Number(productForm.price),
        original_price: productForm.original_price && Number(productForm.original_price) > Number(productForm.price) ? Number(productForm.original_price) : null,
        category: catLabel, subcategory: productForm.subcategory || null,
        description: productForm.description.trim() || null,
        stock: Math.max(0, Number(productForm.stock)||0),
        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        image: imgUrl, seller_id: session!.user.id,
      };
      if (editingProduct) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
        if (error) throw error;
        toast('✓ Cập nhật sản phẩm thành công');
      } else {
        const { error } = await supabase.from('products').insert([data]);
        if (error) throw error;
        toast('✓ Đăng sản phẩm thành công');
      }
      resetForm(); fetchMine(); fetchAll();
    } catch (e: any) { toast(e.message || 'Lỗi không xác định', 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setShowProductForm(false); setEditingProduct(null); setSelectedFile(null); setPreviewUrl('');
    setProductForm({ name: '', price: '', original_price: '', category: 'food', subcategory: '', description: '', stock: '100', tags: '' });
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const catId = CATEGORIES.find(c => c.label === p.category)?.id || 'food';
    setProductForm({ name: p.name, price: String(p.price), original_price: p.original_price ? String(p.original_price) : '', category: catId, subcategory: p.subcategory || '', description: p.description || '', stock: String(p.stock ?? 100), tags: p.tags?.join(', ') || '' });
    setPreviewUrl(p.image); setShowProductForm(true);
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Xoá sản phẩm này?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id).eq('seller_id', session!.user.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Đã xoá sản phẩm', 'info'); fetchMine(); fetchAll();
  };

  // ── Cart ──
  const addToCart = useCallback((product: Product, qty = 1, note = '') => {
    if ((product.stock ?? 1) <= 0) { toast('Sản phẩm đã hết hàng', 'error'); return; }
    setCart(prev => {
      if (prev.length > 0 && prev[0].seller_id !== product.seller_id) {
        if (!confirm('Giỏ hàng có sản phẩm từ cửa hàng khác. Làm mới giỏ hàng?')) return prev;
        return [{ ...product, quantity: qty, note }];
      }
      const ex = prev.find(i => i.id === product.id);
      if (ex) {
        const nq = ex.quantity + qty;
        return prev.map(i => i.id === product.id ? { ...i, quantity: product.stock !== undefined ? Math.min(nq, product.stock) : nq, note: note || i.note } : i);
      }
      return [...prev, { ...product, quantity: qty, note }];
    });
    toast('✓ Đã thêm vào giỏ');
  }, [toast]);

  const updateQty = (id: number, delta: number) => setCart(prev => prev.map(i => i.id !== id ? i : { ...i, quantity: Math.max(1, Math.min(i.stock ?? 999, i.quantity + delta)) }));
  const removeCart = (id: number) => { setCart(p => p.filter(i => i.id !== id)); toast('Đã xoá khỏi giỏ', 'info'); };
  const applyCoupon = () => { const code = couponCode.trim().toUpperCase(); const d = COUPONS[code]; if (d) { setCouponDiscount(d); toast(`✓ Mã "${code}" — giảm ${(d * 100).toFixed(0)}%`); } else toast('Mã không hợp lệ hoặc đã hết hạn', 'error'); };
  const removeCoupon = () => { setCouponDiscount(0); setCouponCode(''); toast('Đã xoá mã giảm giá', 'info'); };

  // ── Checkout ──
  const handleCheckout = async () => {
    if (!cart.length || !session?.user?.id) return;
    if (!shippingAddr.trim()) { toast('Vui lòng nhập địa chỉ giao hàng', 'error'); setCheckoutStep('address'); return; }
    try {
      setSubmittingOrder(true);
      const orderData = {
        total_price: finalTotal, subtotal: cartTotal, discount_amount: discountAmt, shipping_fee: 0,
        seller_id: cart[0].seller_id, buyer_id: session.user.id, buyer_email: session.user.email,
        status: 'Chờ xác nhận', shipping_address: shippingAddr.trim(), payment_method: paymentMethod, note: orderNote.trim() || null,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image, note: i.note || null })),
      };
      const { data: order, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;
      await supabase.from('notifications').insert([{ user_id: cart[0].seller_id, order_id: order.id, message: `🛍️ Đơn hàng mới #${String(order.id).slice(-6)} — ${fmt(finalTotal)}`, type: 'new_order', is_read: false }]);
      setCart([]); setShowCart(false); setCheckoutStep('cart'); setShippingAddr(''); setOrderNote(''); setCouponCode(''); setCouponDiscount(0); setPaymentMethod('cod');
      toast('🎉 Đặt hàng thành công! Đang chờ xác nhận...', 'success');
      setTimeout(() => setActiveTab('my-purchases'), 1500);
    } catch (e: any) { toast('Lỗi đặt hàng: ' + e.message, 'error'); } finally { setSubmittingOrder(false); }
  };

  // ── Order status ──
  const updateOrderStatus = async (order: Order, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      const msgMap: Record<string, string> = { 'Đã xác nhận': `✅ Đơn hàng #${String(order.id).slice(-6)} đã được xác nhận!`, 'Đang giao': `🚚 Đơn hàng #${String(order.id).slice(-6)} đang được giao!`, 'Hoàn thành': `🎉 Đơn hàng #${String(order.id).slice(-6)} đã hoàn thành!` };
      const typeMap: Record<string, Notification['type']> = { 'Đã xác nhận': 'order_confirmed', 'Đang giao': 'order_shipped', 'Hoàn thành': 'order_completed' };
      if (msgMap[newStatus] && order.buyer_id) await supabase.from('notifications').insert([{ user_id: order.buyer_id, order_id: order.id, message: msgMap[newStatus], type: typeMap[newStatus], is_read: false }]);
      toast(`✓ Đã cập nhật: ${newStatus}`); fetchOrders();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  const cancelOrder = async (order: Order) => {
    if (!confirm('Huỷ đơn hàng này?')) return;
    const { error } = await supabase.from('orders').update({ status: 'Đã hủy' }).eq('id', order.id);
    if (error) { toast(error.message, 'error'); return; }
    if (order.buyer_id) await supabase.from('notifications').insert([{ user_id: order.buyer_id, order_id: order.id, message: `❌ Đơn hàng #${String(order.id).slice(-6)} đã bị huỷ.`, type: 'system', is_read: false }]);
    toast('Đã huỷ đơn hàng', 'info'); fetchOrders();
  };

  // ── Reviews & Replies ──
  const submitReview = async (productId: number, rating: number, comment: string, images: string[] = []) => {
    const { error } = await supabase.from('reviews').upsert([{ product_id: productId, buyer_id: session!.user.id, buyer_email: session!.user.email, rating, comment, images }], { onConflict: 'product_id,buyer_id' });
    if (error) throw error;
    toast('✓ Đánh giá đã được ghi nhận');
  };

  const submitReply = async (reviewId: number) => {
    if (!replyText.trim()) return;
    try {
      const { error } = await supabase.from('reviews').update({ 
        seller_reply: replyText.trim(), reply_created_at: new Date().toISOString() 
      }).eq('id', reviewId);
      if (error) throw error;
      toast('✓ Đã gửi phản hồi');
      setReplyingTo(null); setReplyText(''); fetchSellerReviews();
    } catch (e: any) { toast(e.message, 'error'); }
  };

  // ── Wishlist / Hide ──
  const toggleWishlist = (id: number) => {
    if (hidden.includes(id)) { toast('Bỏ ẩn sản phẩm trước để thêm yêu thích', 'warning'); return; }
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
    toast(wishlist.includes(id) ? 'Đã bỏ yêu thích' : '❤️ Đã thêm yêu thích');
  };
  const confirmHide = () => { if (!pendingHide) return; setHidden(d => [...d, pendingHide.id]); setWishlist(w => w.filter(x => x !== pendingHide.id)); if (viewProduct?.id === pendingHide.id) setViewProduct(null); toast('👁️ Đã ẩn sản phẩm', 'info'); setPendingHide(null); };
  const restore = (id: number) => { setHidden(d => d.filter(x => x !== id)); toast('✓ Đã hiện lại sản phẩm'); };

  // ── Notif helpers ──
  const markRead    = async (id: number) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n)); };
  const markAllRead = async () => { await supabase.from('notifications').update({ is_read: true }).eq('user_id', session!.user.id).eq('is_read', false); setNotifications(p => p.map(n => ({ ...n, is_read: true }))); };

  // ── Guards ──
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center"><AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" /><h1 className="text-xl font-black text-red-900">Thiếu cấu hình Supabase</h1></div>;
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!session) return <AuthForm />;
  if (!role)    return <RoleSelection onSelect={() => supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))} />;

  const catOptions = CATEGORIES.find(c => c.id === productForm.category)?.sub || [];
  const productReviews = viewProduct ? reviews.filter(r => r.product_id === viewProduct.id) : [];

  // ══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap'); .no-scrollbar::-webkit-scrollbar{display:none;} .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>

      {/* ── Toasts ── */}
      <div className="fixed top-5 right-5 z-[150] flex flex-col gap-2 pointer-events-none max-w-xs w-full">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 50, scale: 0.92 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.92 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold max-w-xs border ${t.type === 'success' ? 'bg-gray-900 text-white border-gray-700' : t.type === 'error' ? 'bg-red-600 text-white border-red-500' : t.type === 'warning' ? 'bg-amber-500 text-white border-amber-400' : 'bg-blue-600 text-white border-blue-500'}`}>
              {t.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : t.type === 'error' ? <X className="w-4 h-4 flex-shrink-0" /> : t.type === 'warning' ? <AlertTriangle className="w-4 h-4 flex-shrink-0" /> : <Info className="w-4 h-4 flex-shrink-0" />}
              <span className="leading-snug">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showNotifications && <NotifPanel notifications={notifications} onClose={() => setShowNotifications(false)} onRead={markRead} onReadAll={markAllRead} />}

        {pendingHide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPendingHide(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><EyeOff className="w-8 h-8 text-gray-500" /></div>
              <h3 className="text-lg font-black mb-2">Ẩn sản phẩm này?</h3>
              <p className="text-sm text-gray-500 mb-1 font-medium">"{pendingHide.name}"</p>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">Sản phẩm sẽ không xuất hiện trong danh sách. Bạn có thể khôi phục bất kỳ lúc nào.</p>
              <div className="flex gap-3">
                <button onClick={() => setPendingHide(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition-all">Huỷ</button>
                <button onClick={confirmHide} className="flex-1 py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"><EyeOff className="w-4 h-4" />Ẩn đi</button>
              </div>
            </motion.div>
          </div>
        )}

        {showHidden && (
          <div className="fixed inset-0 z-[85] flex justify-start">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowHidden(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                <div><h2 className="text-lg font-black flex items-center gap-2"><EyeOff className="w-5 h-5 text-gray-600" />Đã ẩn</h2><p className="text-xs text-gray-400 mt-0.5">{hiddenProducts.length} sản phẩm</p></div>
                <button onClick={() => setShowHidden(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {hiddenProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 py-20"><Eye className="w-14 h-14" /><p className="font-bold text-gray-400 text-sm text-center">Chưa có sản phẩm ẩn</p></div>
                ) : hiddenProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0"><Media src={p.image} alt={p.name} className="w-full h-full" /></div>
                    <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate text-gray-700">{p.name}</p><p className="text-xs text-gray-400">{fmt(p.price)}</p></div>
                    <button onClick={() => restore(p.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:bg-blue-700 transition-colors"><Eye className="w-3 h-3" />Hiện</button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {viewProduct && (
          <ProductModal product={viewProduct} onClose={() => setViewProduct(null)}
            onAdd={(p, qty, note) => addToCart(p, qty, note)} wishlisted={wishlist.includes(viewProduct.id)} onWishlist={toggleWishlist}
            reviews={productReviews} />
        )}

        {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onSubmit={submitReview} />}
      </AnimatePresence>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab(role === 'seller' ? 'my-products' : 'marketplace')}>
              <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25"><Zap className="w-5 h-5 text-white" /></div>
              <span className="text-base font-black hidden sm:block">Marketplace</span>
              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md hidden sm:block ${role === 'seller' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>
                {role === 'seller' ? 'Seller' : 'Buyer'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {role === 'seller' ? (
                <>
                  {[{ id: 'my-products', icon: LayoutDashboard, label: 'Sản phẩm' }, 
                    { id: 'my-orders', icon: BarChart3, label: 'Đơn hàng' },
                    { id: 'my-reviews', icon: MessageSquareReply, label: 'Đánh giá' }
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { id: 'marketplace',  icon: Home,        label: 'Mua sắm',    badge: 0 },
                    { id: 'my-purchases', icon: Package,     label: 'Đơn của tôi', badge: 0 },
                    { id: 'wishlist-tab', icon: Heart,       label: 'Yêu thích',   badge: wishlist.length },
                  ].map(({ id, icon: Icon, label, badge }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <Icon className="w-4 h-4" />{label}
                      {badge > 0 && <span className={`ml-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>{badge}</span>}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {role === 'buyer' && hidden.length > 0 && (
              <button onClick={() => setShowHidden(true)} className="relative p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors" title="Sản phẩm đã ẩn">
                <EyeOff className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 bg-gray-700 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{hidden.length}</span>
              </button>
            )}
            {role === 'buyer' && (
              <button onClick={() => { setShowCart(true); setCheckoutStep('cart'); }} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cart.length > 0 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length > 9 ? '9+' : cart.length}</motion.span>}
              </button>
            )}
            <button onClick={() => setShowNotifications(true)} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center"><User className="w-3.5 h-3.5 text-blue-600" /></div>
              <span className="text-xs font-bold text-gray-600 max-w-[110px] truncate">{session?.user?.email}</span>
            </div>
            <button onClick={() => supabase.auth.signOut()} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Đăng xuất"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ PAGES ═══════════════════ */}
      <AnimatePresence mode="wait">

        {/* ████ SELLER: MY PRODUCTS ████ */}
        {activeTab === 'my-products' && role === 'seller' && (
          <motion.main key="my-products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h1 className="text-2xl font-black">Sản phẩm của tôi</h1><p className="text-gray-500 text-sm">{products.length} sản phẩm đang kinh doanh</p></div>
              <button onClick={() => setShowProductForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.97] text-sm">
                <PackagePlus className="w-4 h-4" />Thêm sản phẩm
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={sellerSearch} onChange={e => setSellerSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <button onClick={() => setSellerViewMode(v => v === 'grid' ? 'list' : 'grid')} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-500">
                {sellerViewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 gap-3 text-gray-400"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Đang tải...</span></div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
                <Store className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600 mb-1">Cửa hàng trống</p>
                <p className="text-gray-400 text-sm mb-5">Thêm sản phẩm đầu tiên để bắt đầu bán hàng</p>
                <button onClick={() => setShowProductForm(true)} className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-2xl text-sm">+ Thêm ngay</button>
              </div>
            ) : (() => {
              const filtered = sellerSearch ? products.filter(p => p.name.toLowerCase().includes(sellerSearch.toLowerCase())) : products;
              return sellerViewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filtered.map(p => {
                    const disc = discountPct(p);
                    return (
                      <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="h-40 relative bg-gray-50 overflow-hidden">
                          <Media src={p.image} alt={p.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                          {disc > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">-{disc}%</span>}
                          {(p.stock||0) === 0 && <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Hết</span>}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-sm truncate mb-0.5">{p.name}</p>
                          <p className="text-blue-600 font-black text-sm">{fmt(p.price)}</p>
                          {p.original_price && p.original_price > p.price && <p className="text-gray-400 text-xs line-through">{fmt(p.original_price)}</p>}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-[10px] font-bold ${(p.stock||0) === 0 ? 'text-red-500' : (p.stock||0) <= 5 ? 'text-amber-600' : 'text-gray-400'}`}>{p.stock ?? '∞'} kho</span>
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                  {filtered.map((p, i) => (
                    <div key={p.id} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0"><Media src={p.image} alt={p.name} className="w-full h-full" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category}{p.subcategory ? ` › ${p.subcategory}` : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-blue-600 text-sm">{fmt(p.price)}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${(p.stock||0) === 0 ? 'text-red-500' : (p.stock||0) <= 5 ? 'text-amber-600' : 'text-gray-400'}`}>{p.stock ?? '∞'} kho</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => openEdit(p)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Modal Product Form */}
            <AnimatePresence>
              {showProductForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                      <h3 className="text-lg font-black">{editingProduct ? '✏️ Chỉnh sửa' : '📦 Thêm sản phẩm mới'}</h3>
                      <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                    </div>
                    <form onSubmit={saveProduct} className="p-6 space-y-5">
                      <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Ảnh / Video *</label>
                        <label className="relative block h-44 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group">
                          {previewUrl ? <Media src={previewUrl} alt="preview" className="w-full h-full" /> : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2"><Camera className="w-10 h-10" /><p className="text-sm font-medium">Nhấn để chọn ảnh hoặc video</p></div>
                          )}
                          <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" required={!editingProduct} />
                        </label>
                      </div>
                      <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tên sản phẩm *</label>
                        <input required value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Danh mục *</label>
                          <select value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value, subcategory: '' }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm appearance-none">
                            {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                          </select>
                        </div>
                        {catOptions.length > 0 && (
                          <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Phân loại</label>
                            <select value={productForm.subcategory} onChange={e => setProductForm(p => ({ ...p, subcategory: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm appearance-none">
                              <option value="">-- Tất cả --</option>{catOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Giá bán (₫) *</label><input type="number" required min="1" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm" /></div>
                        <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Giá gốc (sale)</label><input type="number" min="0" value={productForm.original_price} onChange={e => setProductForm(p => ({ ...p, original_price: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Số lượng kho</label><input type="number" min="0" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm" /></div>
                        <div><label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tags</label><input value={productForm.tags} onChange={e => setProductForm(p => ({ ...p, tags: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm" /></div>
                      </div>
                      <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mô tả</label>
                        <textarea rows={3} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm resize-none" />
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={resetForm} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl text-sm">Huỷ</button>
                        <button type="submit" disabled={loading} className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 text-sm">
                          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : ''}{editingProduct ? 'Lưu thay đổi' : 'Đăng sản phẩm'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.main>
        )}

        {/* ████ SELLER: ORDERS ████ */}
        {activeTab === 'my-orders' && role === 'seller' && (
          <motion.main key="my-orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h1 className="text-2xl font-black">Đơn hàng nhận được</h1><p className="text-gray-500 text-sm">Xác nhận & xử lý đơn hàng</p></div>
              <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold shadow-sm"><RefreshCw className="w-4 h-4" />Làm mới</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tổng doanh thu',  value: fmt(totalRevenue),              icon: DollarSign, bg: 'bg-blue-600 text-white',             iconCls: 'text-white/30' },
                { label: 'Hôm nay',          value: fmt(todayRevenue),              icon: TrendingUp, bg: 'bg-emerald-600 text-white',           iconCls: 'text-white/30' },
                { label: 'Tổng đơn',         value: String(orders.length),          icon: ShoppingBag, bg: 'bg-white border border-gray-100',   iconCls: 'text-gray-200' },
                { label: 'Chờ xử lý',        value: String(orders.filter(o => o.status === 'Chờ xác nhận').length), icon: Clock, bg: 'bg-amber-50 border border-amber-100', iconCls: 'text-amber-200' },
              ].map(({ label, value, icon: Icon, bg, iconCls }) => (
                <div key={label} className={`${bg} rounded-2xl p-5 shadow-sm relative overflow-hidden`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${bg.includes('bg-blue') || bg.includes('bg-emerald') ? 'text-white/60' : 'text-gray-400'}`}>{label}</p>
                  <p className={`text-2xl font-black ${bg.includes('bg-blue') || bg.includes('bg-emerald') ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                  <Icon className={`absolute bottom-4 right-4 w-10 h-10 ${iconCls}`} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['all', ...Object.keys(ORDER_STATUSES)].map(s => (
                <button key={s} onClick={() => setOrderFilter(s)} className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex-shrink-0 ${orderFilter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {s === 'all' ? `Tất cả (${orders.length})` : `${ORDER_STATUSES[s].label} (${orders.filter(o => o.status === s).length})`}
                </button>
              ))}
            </div>
            {ordersLoading ? (
              <div className="flex items-center justify-center h-48 gap-3"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-500">Không có đơn hàng nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(order => {
                  const cfg = ORDER_STATUSES[order.status] || ORDER_STATUSES['Chờ xác nhận'];
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
                          {(order.discount_amount||0) > 0 && <p className="text-xs text-emerald-600">−{fmt(order.discount_amount!)} giảm</p>}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                          <span key={idx} className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{item.name} ×{item.quantity}</span>
                        ))}
                      </div>
                      {(order.shipping_address || order.note || order.payment_method) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-1">
                          {order.shipping_address && <p className="text-xs text-gray-600 flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />{order.shipping_address}</p>}
                          {order.note && <p className="text-xs text-gray-500 flex items-start gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-gray-400 mt-0.5" />{order.note}</p>}
                          {order.payment_method && <p className="text-xs text-gray-400">💳 {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'bank' ? 'Chuyển khoản' : 'MoMo'}</p>}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {cfg.next && <button onClick={() => updateOrderStatus(order, cfg.next!)} className={`flex-1 min-w-[140px] ${cfg.nextBg} text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all active:scale-[0.97]`}>{cfg.nextLabel}</button>}
                        {(order.status === 'Chờ xác nhận' || order.status === 'Đã xác nhận') && <button onClick={() => cancelOrder(order)} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">Huỷ đơn</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.main>
        )}

        {/* ████ SELLER: MY REVIEWS ████ */}
        {activeTab === 'my-reviews' && role === 'seller' && (
          <motion.main key="my-reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-5xl mx-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">Quản lý Đánh giá</h1>
                <p className="text-gray-500 text-sm">Xem phản hồi từ khách hàng và trả lời</p>
              </div>
              <button onClick={fetchSellerReviews} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm">
                <RefreshCw className="w-4 h-4" /> Làm mới
              </button>
            </div>

            {sellerReviews.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center">
                <StarHalf className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600">Chưa có đánh giá nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sellerReviews.map(r => {
                  const product = products.find(p => p.id === r.product_id);
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-start justify-between border-b border-gray-50 pb-3 mb-3">
                        <div className="flex gap-3">
                          {product && <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden"><Media src={product.image} className="w-full h-full" /></div>}
                          <div>
                            <p className="text-xs text-blue-600 font-bold mb-1">{product?.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm">{r.buyer_email?.split('@')[0]}</p>
                              <Stars value={r.rating} />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>

                      <p className="text-gray-700 text-sm mb-3">{r.comment || <span className="text-gray-400 italic">Không có nhận xét văn bản</span>}</p>
                      
                      {r.images && r.images.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {r.images.map((img, i) => (
                            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200"><Media src={img} className="w-full h-full" /></div>
                          ))}
                        </div>
                      )}

                      {/* Phản hồi từ Shop */}
                      {r.seller_reply ? (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-black text-blue-700">Shop đã trả lời:</p>
                            <button onClick={() => { setReplyingTo(r.id); setReplyText(r.seller_reply!); }} className="text-xs text-blue-500 hover:underline">Sửa</button>
                          </div>
                          <p className="text-sm text-gray-700">{r.seller_reply}</p>
                        </div>
                      ) : replyingTo === r.id ? (
                        <div className="space-y-2 mt-2">
                          <textarea autoFocus rows={2} value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Nhập câu trả lời của bạn..."
                            className="w-full bg-gray-50 border border-blue-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setReplyingTo(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-600">Hủy</button>
                            <button onClick={() => submitReply(r.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20">Gửi phản hồi</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReplyingTo(r.id)} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
                          <MessageSquareReply className="w-3.5 h-3.5 inline mr-1" /> Trả lời khách hàng
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.main>
        )}

        {/* ████ BUYER: MARKETPLACE ████ */}
        {activeTab === 'marketplace' && role === 'buyer' && (
          <motion.main key="marketplace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto p-5 space-y-4">
            <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-black text-lg">🔥 FLASH SALE</p>
                <p className="text-white/80 text-xs font-medium">Dùng mã: <span className="font-black text-yellow-300">SALE10</span>, <span className="font-black text-yellow-300">WELCOME</span>, <span className="font-black text-yellow-300">FIT20</span></p>
              </div>
              <FlashTimer endsAt={new Date(Date.now() + 6 * 3600000)} />
            </div>

            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm, danh mục, tags..." className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-10 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm" />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>}
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3.5 rounded-2xl border-2 transition-all text-sm font-bold flex items-center gap-2 ${showFilters ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <Filter className="w-4 h-4" /><span className="hidden sm:block">Bộ lọc</span>
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sắp xếp</p>
                      <div className="space-y-1">
                        {[['newest','🕐 Mới nhất'],['popular','🔥 Phổ biến'],['price_asc','💰 Giá thấp → cao'],['price_desc','💎 Giá cao → thấp'],['rating','⭐ Đánh giá cao']].map(([v,l]) => (
                          <button key={v} onClick={() => setSortBy(v as any)} className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all font-medium ${sortBy === v ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Khoảng giá</p>
                      <div className="space-y-1">
                        {[[0,100_000],[100_000,500_000],[500_000,1_000_000],[1_000_000,5_000_000],[5_000_000,10_000_000]].map(([min,max]) => (
                          <button key={`${min}-${max}`} onClick={() => setPriceRange([min,max])} className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all ${priceRange[0]===min&&priceRange[1]===max ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                            {min === 0 ? `Dưới ${fmt(max)}` : `${fmt(min)} – ${fmt(max)}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Hiển thị</p>
                      <div className="flex gap-2 mb-3">
                        {[['grid','Lưới',Grid3X3],['list','Danh sách',List]].map(([v,l,Icon]) => (
                          <button key={v as string} onClick={() => setViewMode(v as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${viewMode === v ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500'}`}>
                            {React.createElement(Icon as any, { className: 'w-4 h-4' })}{l as string}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setSearchQuery(''); setSelectedCat('all'); setSelectedSub(''); setPriceRange([0,10_000_000]); setSortBy('newest'); setShowFilters(false); }} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">Đặt lại bộ lọc</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCat(cat.id); setSelectedSub(''); }} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCat === cat.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {selectedCat !== 'all' && (CATEGORIES.find(c => c.id === selectedCat)?.sub.length||0) > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button onClick={() => setSelectedSub('')} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${!selectedSub ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500'}`}>Tất cả</button>
                  {CATEGORIES.find(c => c.id === selectedCat)?.sub.map(sub => (
                    <button key={sub} onClick={() => setSelectedSub(sub)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${selectedSub === sub ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>{sub}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{loading ? 'Đang tải...' : <><span className="font-bold text-gray-900">{filteredProducts.length}</span> sản phẩm</>}</p>
              <div className="flex gap-1.5">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl border transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600">Không tìm thấy sản phẩm</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCat('all'); setSelectedSub(''); setPriceRange([0,10_000_000]); }} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Xoá bộ lọc →</button>
              </div>
            ) : viewMode === 'grid' ? (
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence>
                  {filteredProducts.map(p => (
                    <ProductCard key={p.id} product={p} onAdd={addToCart} onView={p => { setViewProduct(p); fetchReviews(p.id); }}
                      wishlisted={wishlist.includes(p.id)} onWishlist={toggleWishlist} hidden={hidden.includes(p.id)} onHide={id => { const prod = allProducts.find(x => x.id === id); if (prod) setPendingHide(prod); }} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => { setViewProduct(p); fetchReviews(p.id); }}>
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0"><Media src={p.image} alt={p.name} className="w-full h-full" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm line-clamp-2 mb-1">{p.name}</p>
                      {p.rating !== undefined && <Stars value={p.rating} />}
                      {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <div><p className="font-black text-blue-600">{fmt(p.price)}</p>{p.original_price && p.original_price > p.price && <p className="text-xs text-gray-400 line-through">{fmt(p.original_price)}</p>}</div>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); toggleWishlist(p.id); }} className={`p-2 rounded-xl border transition-all ${wishlist.includes(p.id) ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400'}`}><Heart className={`w-3.5 h-3.5 ${wishlist.includes(p.id) ? 'fill-red-500' : ''}`} /></button>
                        <button onClick={e => { e.stopPropagation(); addToCart(p); }} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">Thêm</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.main>
        )}

        {/* ████ BUYER: MY PURCHASES ████ */}
        {activeTab === 'my-purchases' && role === 'buyer' && (
          <motion.main key="my-purchases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl mx-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-black">Đơn hàng của tôi</h1><p className="text-gray-500 text-sm">Theo dõi trạng thái đơn hàng realtime</p></div>
              <button onClick={fetchBuyerOrders} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold shadow-sm"><RefreshCw className="w-4 h-4" />Làm mới</button>
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
                  const cfg = ORDER_STATUSES[order.status] || ORDER_STATUSES['Chờ xác nhận'];
                  const curStep = PROGRESS_STEPS.indexOf(order.status);
                  const isCompleted = order.status === 'Hoàn thành';

                  return (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
                      <div className="px-5 py-4 flex flex-wrap gap-2">
                        {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            {item.image && <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0"><Media src={item.image} alt={item.name} className="w-full h-full" /></div>}
                            <span className="text-xs font-bold text-gray-800">{item.name}</span>
                            <span className="text-xs text-gray-400">×{item.quantity}</span>
                            <span className="text-xs font-bold text-blue-600">{fmt(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      {(order.shipping_address || order.payment_method || (order.discount_amount||0) > 0) && (
                        <div className="px-5 pb-3 flex flex-wrap gap-3 text-xs text-gray-500">
                          {order.shipping_address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.shipping_address}</span>}
                          {order.payment_method && <span>💳 {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'bank' ? 'Chuyển khoản' : 'MoMo'}</span>}
                          {(order.discount_amount||0) > 0 && <span className="text-emerald-600 font-bold">Tiết kiệm {fmt(order.discount_amount!)}</span>}
                        </div>
                      )}
                      {order.status !== 'Đã hủy' ? (
                        <div className="px-5 pb-5">
                          <div className="flex items-center">
                            {PROGRESS_STEPS.map((step, idx) => {
                              const done = idx <= curStep;
                              const active = idx === curStep;
                              return (
                                <React.Fragment key={step}>
                                  <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${done ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-gray-100 text-gray-400'} ${active ? 'ring-4 ring-blue-100' : ''}`}>
                                      {done ? <Check className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className={`text-[9px] font-bold text-center max-w-[56px] leading-tight ${done ? 'text-blue-600' : 'text-gray-400'}`}>{step}</span>
                                  </div>
                                  {idx < PROGRESS_STEPS.length - 1 && <div className={`flex-1 h-1 mx-1 mb-5 rounded-full transition-all ${idx < curStep ? 'bg-blue-600' : 'bg-gray-100'}`} />}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mx-5 mb-5 p-3 bg-red-50 rounded-2xl text-red-600 text-sm font-bold text-center border border-red-100">❌ Đơn hàng đã bị huỷ</div>
                      )}
                      {isCompleted && (
                        <div className="px-5 pb-5">
                          <button onClick={() => setReviewOrder(order)}
                            className="w-full py-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />Đánh giá sản phẩm
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.main>
        )}

        {/* ████ BUYER: WISHLIST ████ */}
        {activeTab === 'wishlist-tab' && role === 'buyer' && (
          <motion.main key="wishlist-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-7xl mx-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div><h1 className="text-2xl font-black">Yêu thích</h1><p className="text-gray-500 text-sm">{wishlistProducts.length} sản phẩm đã lưu</p></div>
              {hidden.length > 0 && <button onClick={() => setShowHidden(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all"><EyeOff className="w-4 h-4" />{hidden.length} đã ẩn</button>}
            </div>
            {wishlistProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="font-bold text-gray-600 text-lg">Chưa có sản phẩm yêu thích</p>
                <p className="text-gray-400 text-sm mt-1">Nhấn ❤️ trên bất kỳ sản phẩm nào để lưu lại</p>
                <button onClick={() => setActiveTab('marketplace')} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Khám phá ngay →</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {wishlistProducts.map(p => (
                  <ProductCard key={p.id} product={p} onAdd={addToCart} onView={p => { setViewProduct(p); fetchReviews(p.id); }} wishlisted={true} onWishlist={toggleWishlist} hidden={hidden.includes(p.id)} onHide={id => { const prod = allProducts.find(x => x.id === id); if (prod) setPendingHide(prod); }} />
                ))}
              </div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* ══════════════════ CART SIDEBAR ══════════════════ */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} />
            <motion.section initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 220 }} className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  {checkoutStep !== 'cart' && (
                    <button onClick={() => setCheckoutStep(checkoutStep === 'confirm' ? 'payment' : checkoutStep === 'payment' ? 'address' : 'cart')} className="p-1.5 hover:bg-gray-100 rounded-xl">
                      <ChevronLeft className="w-5 h-5 text-gray-500" />
                    </button>
                  )}
                  <h2 className="text-base font-black flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    {checkoutStep === 'cart' ? `Giỏ hàng (${cart.length})` : checkoutStep === 'address' ? 'Địa chỉ giao hàng' : checkoutStep === 'payment' ? 'Phương thức thanh toán' : 'Xác nhận đơn hàng'}
                  </h2>
                </div>
                <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="flex px-5 py-2.5 border-b border-gray-50 gap-1.5 flex-shrink-0">
                {(['cart','address','payment','confirm'] as const).map((step, idx) => (
                  <div key={step} className={`flex-1 h-1.5 rounded-full transition-all ${['cart','address','payment','confirm'].indexOf(checkoutStep) >= idx ? 'bg-blue-600' : 'bg-gray-100'}`} />
                ))}
              </div>

              {checkoutStep === 'cart' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-gray-300">
                        <ShoppingBag className="w-14 h-14" />
                        <p className="font-bold text-gray-400">Giỏ hàng trống</p>
                        <button onClick={() => { setShowCart(false); setActiveTab('marketplace'); }} className="text-blue-600 text-sm font-bold hover:underline">Khám phá sản phẩm →</button>
                      </div>
                    ) : cart.map(item => (
                      <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3 group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0"><Media src={item.image} alt={item.name} className="w-full h-full" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{item.name}</p>
                          <p className="text-blue-600 font-black text-sm">{fmt(item.price)}</p>
                          {item.note && <p className="text-xs text-gray-400 italic truncate mt-0.5">"{item.note}"</p>}
                          <div className="flex items-center gap-1.5 mt-2 bg-white rounded-xl border border-gray-200 w-fit p-0.5">
                            <button onClick={() => updateQty(item.id, -1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Minus className="w-3 h-3 text-gray-600" /></button>
                            <span className="font-black text-sm w-6 text-center select-none">{item.quantity}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Plus className="w-3 h-3 text-gray-600" /></button>
                          </div>
                        </div>
                        <button onClick={() => removeCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </motion.div>
                    ))}
                  </div>
                  {cart.length > 0 && (
                    <div className="p-4 border-t border-gray-100 space-y-3 bg-white flex-shrink-0">
                      {couponDiscount > 0 ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                          <span className="text-emerald-700 font-bold text-sm">✓ Giảm {(couponDiscount*100).toFixed(0)}% — {couponCode}</span>
                          <button onClick={removeCoupon} className="text-emerald-600 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Mã giảm giá..." onKeyDown={e => e.key === 'Enter' && applyCoupon()} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                          <button onClick={applyCoupon} className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors">Áp dụng</button>
                        </div>
                      )}
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-500"><span>Tạm tính ({cart.reduce((s,i)=>s+i.quantity,0)} SP)</span><span>{fmt(cartTotal)}</span></div>
                        {couponDiscount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Giảm giá {(couponDiscount*100).toFixed(0)}%</span><span>−{fmt(discountAmt)}</span></div>}
                        <div className="flex justify-between text-gray-400 text-xs"><span>Vận chuyển</span><span className="text-emerald-600 font-bold">Miễn phí</span></div>
                        <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100"><span>Tổng</span><span className="text-blue-600 text-xl">{fmt(finalTotal)}</span></div>
                      </div>
                      <button onClick={() => setCheckoutStep('address')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
                        Tiếp tục <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {checkoutStep === 'address' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Địa chỉ giao hàng *</label>
                      <textarea value={shippingAddr} onChange={e => setShippingAddr(e.target.value)} rows={3} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Ghi chú (tuỳ chọn)</label>
                      <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2} placeholder="Thời gian giao, yêu cầu đặc biệt..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 flex-shrink-0">
                    <button onClick={() => { if (!shippingAddr.trim()) { toast('Vui lòng nhập địa chỉ', 'error'); return; } setCheckoutStep('payment'); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                      Tiếp tục <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {checkoutStep === 'payment' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Phương thức thanh toán</p>
                    {[
                      { id: 'cod' as const,  icon: '💵', label: 'Tiền mặt khi nhận (COD)', desc: 'Thanh toán khi nhận hàng' },
                      { id: 'bank' as const, icon: '🏦', label: 'Chuyển khoản ngân hàng',  desc: 'Chuyển khoản trước khi giao' },
                      { id: 'momo' as const, icon: '📱', label: 'Ví MoMo',                 desc: 'Thanh toán qua MoMo' },
                    ].map(({ id, icon, label, desc }) => (
                      <button key={id} onClick={() => setPaymentMethod(id)} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1"><p className={`font-bold text-sm ${paymentMethod === id ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                        {paymentMethod === id && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 flex-shrink-0">
                    <button onClick={() => setCheckoutStep('confirm')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                      Xem lại đơn hàng <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {checkoutStep === 'confirm' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="font-black text-sm text-gray-700 mb-3">📦 Sản phẩm</p>
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span className="font-bold text-blue-600">{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="font-black text-sm text-gray-700 mb-3">📋 Thông tin đơn</p>
                      <div className="text-sm space-y-2">
                        <div className="flex gap-2 items-start"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span className="text-gray-600 leading-snug">{shippingAddr}</span></div>
                        <div className="flex gap-2 items-center"><span className="text-base">💳</span><span className="text-gray-600">{paymentMethod === 'cod' ? 'COD' : paymentMethod === 'bank' ? 'Chuyển khoản' : 'MoMo'}</span></div>
                        {orderNote && <div className="flex gap-2 items-start"><MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span className="text-gray-500 italic">{orderNote}</span></div>}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{fmt(cartTotal)}</span></div>
                        {couponDiscount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Giảm giá</span><span>−{fmt(discountAmt)}</span></div>}
                        <div className="flex justify-between text-gray-400"><span>Vận chuyển</span><span className="text-emerald-600 font-bold">Miễn phí</span></div>
                        <div className="flex justify-between font-black text-base pt-2 border-t border-blue-200"><span>Tổng thanh toán</span><span className="text-blue-600 text-xl">{fmt(finalTotal)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 space-y-2 flex-shrink-0">
                    <button onClick={handleCheckout} disabled={submittingOrder} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
                      {submittingOrder ? <><Loader2 className="w-5 h-5 animate-spin" />Đang đặt...</> : <><Check className="w-5 h-5" />Đặt hàng {fmt(finalTotal)}</>}
                    </button>
                    <p className="text-xs text-gray-400 text-center">Đơn sẽ gửi tới người bán và chờ xác nhận</p>
                  </div>
                </>
              )}
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/60 z-20 md:hidden">
        <div className="flex items-center justify-around py-2 px-2">
          {role === 'buyer' ? (
            <>
              {[{ id: 'marketplace', icon: Home, label: 'Mua sắm' }, { id: 'my-purchases', icon: Package, label: 'Đơn hàng' }, { id: 'wishlist-tab', icon: Heart, label: 'Yêu thích' }].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Icon className="w-5 h-5" /><span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={() => setShowCart(true)} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
                <span className="text-[9px] font-bold">Giỏ</span>
              </button>
              <button onClick={() => setShowNotifications(true)} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
                <span className="text-[9px] font-bold">TB</span>
              </button>
            </>
          ) : (
            <>
              {[{ id: 'my-products', icon: Store, label: 'SP' }, 
                { id: 'my-orders', icon: BarChart3, label: 'Đơn' },
                { id: 'my-reviews', icon: MessageSquareReply, label: 'Review' }
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Icon className="w-5 h-5" /><span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={() => setShowProductForm(true)} className="flex flex-col items-center gap-0.5 px-5 py-2 text-gray-400">
                <PackagePlus className="w-5 h-5" /><span className="text-[9px] font-bold">Thêm</span>
              </button>
              <button onClick={() => setShowNotifications(true)} className="flex flex-col items-center gap-0.5 px-5 py-2 text-gray-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
                <span className="text-[9px] font-bold">TB</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="h-16 md:hidden" />
    </div>
  );
}
```