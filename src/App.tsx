import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShoppingCart, Plus, Minus, Trash2, Zap, Loader2, AlertCircle,
  LayoutDashboard, BarChart3, Clock, DollarSign, LogIn, UserPlus,
  LogOut, Mail, Lock, Store, User, PackagePlus, ShoppingBag, Search,
  Filter, ChevronRight, Star, Edit, Bell, BellRing, CheckCircle2,
  Package, Truck, Check, X, Heart, Share2, Eye, TrendingUp,
  Tag, Grid3X3, List, SlidersHorizontal, ChevronDown, ChevronUp,
  MapPin, Phone, MessageCircle, RefreshCw, Award, Flame, Sparkles,
  Camera, Upload, BarChart2, Users, ShoppingBasket, Percent,
  ArrowUpRight, ArrowDownRight, Info, Copy, ExternalLink, Gift,
  ChevronLeft, Home, Bookmark, Settings, HelpCircle, Globe, EyeOff
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
  type: 'success' | 'error' | 'info';
}

interface SellerProfile {
  id: string;
  shop_name?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  address?: string;
  rating?: number;
  total_sales?: number;
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
  'Đang giao':    { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', label: 'Đang giao', next: 'Hoàn thành', nextLabel: '🎉 Xác nhận giao xong', nextBg: 'bg-violet-600 hover:bg-violet-700' },
  'Hoàn thành':   { color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400', label: 'Hoàn thành', next: null, nextLabel: null, nextBg: null },
  'Đã hủy':       { color: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-400', label: 'Đã hủy', next: null, nextLabel: null, nextBg: null },
};

const PROGRESS_STEPS = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Hoàn thành'];

// ─────────── HELPERS ───────────
const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);
const isVideo = (url: string) => url && ['.mp4', '.webm', '.ogg', '.mov'].some(e => url.toLowerCase().split('?')[0].endsWith(e));
const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(date).toLocaleDateString('vi-VN');
};

// ─────────── COMPONENTS ───────────

function Stars({ value, size = 'sm', onChange }: { value: number; size?: 'sm' | 'md' | 'lg'; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`${sz} transition-colors cursor-${onChange ? 'pointer' : 'default'} ${(hover || value) >= i ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(i)} />
      ))}
    </div>
  );
}

function ProductCard({ product, onAddToCart, onWishlist, wishlisted, onView, onHide, hidden }: {
  product: Product; onAddToCart: (p: Product) => void;
  onWishlist: (id: number) => void; wishlisted: boolean; onView: (p: Product) => void;
  onHide: (id: number) => void; hidden: boolean;
}) {
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;
  
  if (hidden) return null; // Sẽ được handle ở level filter nhưng thêm ở đây cho chắc chắn

  return (
    <motion.div whileHover={{ y: -6 }} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-600/8 transition-all group cursor-pointer relative"
      onClick={() => onView(product)}>
      
      {/* Hide Button (Only for Buyer) */}
      <button onClick={e => { e.stopPropagation(); onHide(product.id); }}
        className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm">
        <EyeOff className="w-4 h-4" />
      </button>

      <div className="h-52 overflow-hidden relative bg-gray-50">
        {isVideo(product.image)
          ? <video src={product.image} className="w-full h-full object-cover" muted loop onClick={e => { e.stopPropagation(); }} />
          : <img src={product.image || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700" referrerPolicy="no-referrer" />}
        
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">-{discount}%</span>}
          {product.is_featured && <span className="bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />Hot</span>}
        </div>
        
        <button onClick={e => { e.stopPropagation(); onWishlist(product.id); }}
          className={`absolute top-3 right-3 p-2.5 rounded-2xl backdrop-blur-sm transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-400'}`}>
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-[9px] font-black text-blue-600 uppercase tracking-widest px-2.5 py-1 rounded-full">
          {product.category}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
        <div className="flex items-center gap-1.5 mb-2">
          <Stars value={product.rating || 0} />
          <span className="text-[10px] text-gray-400 font-bold">({product.review_count || 0})</span>
          {product.sold_count && <span className="text-[10px] text-gray-400 ml-1">• {product.sold_count} đã bán</span>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-blue-600 font-black text-base">{formatPrice(product.price)}</p>
            {product.original_price && <p className="text-gray-400 text-xs line-through">{formatPrice(product.original_price)}</p>}
          </div>
          <button onClick={e => { e.stopPropagation(); onAddToCart(product); }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-600/25">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────── SKELETON LOADER ───────────
function ProductSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
      <div className="h-52 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        <div className="flex justify-between items-end">
          <div className="h-6 bg-gray-200 rounded-full w-1/3" />
          <div className="w-10 h-10 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// (Các component ProductDetailModal, AuthForm, RoleSelection, NotificationPanel giữ nguyên logic cơ bản nhưng được tối ưu performance)
function ProductDetailModal({ product, onClose, onAddToCart, wishlisted, onWishlist }: {
  product: Product; onClose: () => void;
  onAddToCart: (p: Product, qty: number, note: string) => void;
  wishlisted: boolean; onWishlist: (id: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images?.length ? product.images : [product.image];
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 60, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 60 }}
        className="relative bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors"><X className="w-5 h-5 text-white" /></button>
        <div className="h-72 sm:h-80 bg-gray-100 relative overflow-hidden">
          {isVideo(images[activeImg])
            ? <video src={images[activeImg]} controls className="w-full h-full object-cover" />
            : <img src={images[activeImg] || `https://picsum.photos/seed/${product.id}/600/400`} alt={product.name}
                className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => <button key={i} onClick={() => setActiveImg(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-white w-6' : 'bg-white/50'}`} />)}
            </div>
          )}
          {discount > 0 && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">-{discount}%</span>}
        </div>
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-xl font-black text-gray-900 leading-tight">{product.name}</h2>
              <button onClick={() => onWishlist(product.id)}
                className={`p-2.5 rounded-2xl border transition-all flex-shrink-0 ${wishlisted ? 'bg-red-50 border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}>
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>
            {product.rating && (
              <div className="flex items-center gap-2">
                <Stars value={product.rating} size="md" />
                <span className="text-sm text-gray-600 font-bold">{product.rating}/5</span>
                <span className="text-sm text-gray-400">({product.review_count} đánh giá)</span>
                {product.sold_count && <span className="text-sm text-gray-400">• {product.sold_count} đã bán</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-blue-600">{formatPrice(product.price)}</span>
            {product.original_price && <>
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.original_price)}</span>
              <span className="bg-red-100 text-red-600 text-xs font-black px-2 py-0.5 rounded-full">Tiết kiệm {formatPrice(product.original_price - product.price)}</span>
            </>}
          </div>
          {product.description && <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ghi chú đơn hàng (tùy chọn)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Ví dụ: Không hành, ít đường, giao buổi sáng..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all resize-none" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-1.5">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><Minus className="w-4 h-4" /></button>
              <span className="font-black text-lg min-w-[2rem] text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <button onClick={() => { onAddToCart(product, qty, note); onClose(); }}
              disabled={product.stock === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20">
              <ShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? 'Hết hàng' : `Thêm vào giỏ - ${formatPrice(product.price * qty)}`}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
        if (error) throw error;
        alert('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.');
      }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-xl shadow-blue-600/40">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Marketplace Pro</h1>
          <p className="text-blue-200/70 mt-1">{isLogin ? 'Chào mừng quay lại' : 'Tạo tài khoản mới'}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email của bạn"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/50" />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu"
              className="w-full bg-white/10 border border-white/10 text-white placeholder-white/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all" />
          </div>
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              {(['buyer', 'seller'] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${role === r ? 'border-blue-400 bg-blue-500/20 text-blue-200' : 'border-white/10 text-white/50 hover:border-white/30'}`}>
                  {r === 'buyer' ? <User className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                  <span className="text-sm font-bold">{r === 'buyer' ? 'Người mua' : 'Người bán'}</span>
                </button>
              ))}
            </div>
          )}
          {error && <div className="bg-red-500/20 border border-red-400/30 text-red-200 p-3 rounded-xl text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
          </button>
        </form>
        <button onClick={() => { setIsLogin(!isLogin); setError(null); }}
          className="mt-6 w-full text-center text-sm text-blue-300/70 hover:text-blue-200 transition-colors">
          {isLogin ? 'Chưa có tài khoản? → Đăng ký' : 'Đã có tài khoản? → Đăng nhập'}
        </button>
      </motion.div>
    </div>
  );
}

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
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl text-center">
        <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30">
          <User className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black mb-3">Bạn muốn làm gì?</h1>
        <p className="text-gray-500 mb-10 text-lg">Chọn vai trò để trải nghiệm phù hợp nhất</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { role: 'buyer' as const, icon: ShoppingBag, title: 'Tôi muốn mua sắm', desc: 'Khám phá hàng nghìn sản phẩm, mua sắm dễ dàng, theo dõi đơn hàng realtime', color: 'blue' },
            { role: 'seller' as const, icon: Store, title: 'Tôi muốn bán hàng', desc: 'Mở gian hàng, quản lý sản phẩm, theo dõi doanh thu và xử lý đơn hàng', color: 'violet' },
          ].map(({ role, icon: Icon, title, desc, color }) => (
            <button key={role} onClick={() => handleSelect(role)} disabled={!!loading}
              className={`group relative p-8 rounded-[2rem] border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${color === 'blue' ? 'border-blue-100 hover:border-blue-500 hover:bg-blue-50 bg-white' : 'border-violet-100 hover:border-violet-500 hover:bg-violet-50 bg-white'} shadow-sm hover:shadow-xl`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors ${color === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white'}`}>
                {loading === role ? <Loader2 className="w-7 h-7 animate-spin" /> : <Icon className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-black mb-2">{title}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{desc}</p>
              <ChevronRight className={`absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-hover:${color === 'blue' ? 'text-blue-600' : 'text-violet-600'} transition-colors`} />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function NotificationPanel({ notifications, onClose, onMarkRead, onMarkAllRead }: {
  notifications: Notification[]; onClose: () => void;
  onMarkRead: (id: number) => void; onMarkAllRead: () => void;
}) {
  const icons: Record<string, React.ReactNode> = {
    order_confirmed: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    order_shipped:   <Truck className="w-5 h-5 text-blue-500" />,
    order_completed: <Package className="w-5 h-5 text-violet-500" />,
    new_order:       <ShoppingBag className="w-5 h-5 text-amber-500" />,
    promo:           <Tag className="w-5 h-5 text-pink-500" />,
    system:          <Bell className="w-5 h-5 text-gray-500" />,
  };
  const unread = notifications.filter(n => !n.is_read).length;
  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2"><BellRing className="w-5 h-5 text-blue-600" />Thông báo</h2>
            {unread > 0 && <p className="text-xs text-gray-400">{unread} chưa đọc</p>}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && <button onClick={onMarkAllRead} className="text-xs font-bold text-blue-600 hover:underline">Đọc tất cả</button>}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 p-8">
              <Bell className="w-16 h-16" /><p className="font-bold text-gray-500">Không có thông báo</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} onClick={() => !n.is_read && onMarkRead(n.id)}
              className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
              <div className="mt-0.5 p-2 bg-gray-100 rounded-xl flex-shrink-0">{icons[n.type] || icons.system}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'} leading-snug`}>{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────── MAIN APP ───────────
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [hiddenProducts, setHiddenProducts] = useState<number[]>([]);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', original_price: '', category: 'food', subcategory: '', description: '', stock: '100', tags: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'confirm'>('cart');
  const [shippingAddr, setShippingAddr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'momo'>('cod');
  const [orderNote, setOrderNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const role = useMemo(() => session?.user?.user_metadata?.role as 'seller' | 'buyer' | undefined, [session]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0), [orders]);
  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.created_at).toDateString() === today).reduce((s, o) => s + Number(o.total_price), 0);
  }, [orders]);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  // Filtered products with "Hidden" logic
  const filteredProducts = useMemo(() => {
    let list = [...(role === 'seller' && activeTab === 'my-products' ? products : allProducts)];
    
    // Filter out hidden products for buyers
    if (role === 'buyer') {
      list = list.filter(p => !hiddenProducts.includes(p.id));
    }

    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
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
  }, [allProducts, products, searchQuery, selectedCategory, selectedSubcat, sortBy, priceRange, role, activeTab, hiddenProducts]);

  // ─── Auth & Setup ───
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
      } finally { setAuthLoading(false); }
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (role === 'seller') setActiveTab('my-products');
    else if (role === 'buyer') setActiveTab('marketplace');
  }, [role]);

  // ─── Fetch Data ───
  useEffect(() => { if (session) { fetchAllProducts(); fetchHiddenProducts(); } }, [session]);
  useEffect(() => { if (session && role === 'seller') fetchMyProducts(); }, [session, role, activeTab]);
  useEffect(() => { if (activeTab === 'my-orders' && role === 'seller') fetchOrders(); }, [activeTab, role]);
  useEffect(() => { if (activeTab === 'my-purchases' && role === 'buyer') fetchBuyerOrders(); }, [activeTab, role]);
  useEffect(() => { if (session?.user?.id) { fetchNotifications(); setupRealtime(); } }, [session?.user?.id]);

  async function fetchAllProducts() {
    setLoading(true);
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setAllProducts(data || []);
    } catch (e) { showToast('Lỗi khi tải sản phẩm', 'error'); } finally { setLoading(false); }
  }

  async function fetchHiddenProducts() {
    if (!session) return;
    const { data } = await supabase.from('hidden_products').select('product_id').eq('user_id', session.user.id);
    if (data) setHiddenProducts(data.map(d => d.product_id));
  }

  async function fetchMyProducts() {
    if (activeTab !== 'my-products') return;
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
    const userId = session!.user.id;
    const ch = supabase.channel('rt-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, payload => {
        const n = payload.new as Notification;
        setNotifications(prev => [n, ...prev]);
        showToast(`🔔 ${n.message}`, 'info');
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }

  // ─── Product CRUD ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct && !selectedFile) { showToast('Vui lòng chọn ảnh sản phẩm', 'error'); return; }
    try {
      setActionLoading('saving');
      let imageUrl = editingProduct?.image || '';
      if (selectedFile) {
        const path = `${session!.user.id}/${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('assets').upload(path, selectedFile);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
      }
      const catLabel = CATEGORIES.find(c => c.id === newProduct.category)?.label || newProduct.category;
      const data = {
        name: newProduct.name, price: Number(newProduct.price),
        original_price: newProduct.original_price ? Number(newProduct.original_price) : null,
        category: catLabel, subcategory: newProduct.subcategory || null,
        description: newProduct.description, stock: Number(newProduct.stock),
        tags: newProduct.tags ? newProduct.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        image: imageUrl, seller_id: session!.user.id,
      };
      if (editingProduct) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id).eq('seller_id', session!.user.id);
        if (error) throw error;
        showToast('Cập nhật sản phẩm thành công!');
      } else {
        const { error } = await supabase.from('products').insert([data]);
        if (error) throw error;
        showToast('Thêm sản phẩm thành công!');
      }
      resetProductForm();
      fetchMyProducts(); fetchAllProducts();
    } catch (err: any) { showToast(err.message, 'error'); } finally { setActionLoading(null); }
  };

  const resetProductForm = () => {
    setShowAddProduct(false); setEditingProduct(null); setSelectedFile(null); setPreviewUrl('');
    setNewProduct({ name: '', price: '', original_price: '', category: 'food', subcategory: '', description: '', stock: '100', tags: '' });
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const catId = CATEGORIES.find(c => c.label === p.category)?.id || 'food';
    setNewProduct({ name: p.name, price: p.price.toString(), original_price: p.original_price?.toString() || '', category: catId, subcategory: p.subcategory || '', description: p.description || '', stock: p.stock?.toString() || '100', tags: p.tags?.join(', ') || '' });
    setPreviewUrl(p.image);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      setActionLoading('deleting-' + id);
      const { error } = await supabase.from('products').delete().eq('id', id).eq('seller_id', session!.user.id);
      if (error) throw error;
      showToast('Đã xóa sản phẩm');
      fetchMyProducts(); fetchAllProducts();
    } catch (err: any) { showToast(err.message, 'error'); } finally { setActionLoading(null); }
  };

  // ─── Favorites & Hide Logic ───
  const handleHideProduct = async (id: number) => {
    try {
      const { error } = await supabase.from('hidden_products').insert([{ user_id: session!.user.id, product_id: id }]);
      if (error) throw error;
      setHiddenProducts(prev => [...prev, id]);
      showToast('Đã ẩn sản phẩm này khỏi tầm nhìn của bạn');
    } catch (err: any) { showToast('Không thể ẩn sản phẩm', 'error'); }
  };

  // ─── Cart ───
  const addToCart = (product: Product, qty = 1, note = '') => {
    setCart(prev => {
      if (prev.length > 0 && prev[0].seller_id !== product.seller_id) {
        if (!confirm('Giỏ hàng hiện đang chứa sản phẩm từ cửa hàng khác. Bạn muốn xóa tất cả và thêm sản phẩm này?')) return prev;
        return [{ ...product, quantity: qty, note }];
      }
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { ...product, quantity: qty, note }];
    });
    showToast(`✓ Đã thêm ${product.name} vào giỏ`);
  };

  const updateQty = (id: number, delta: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'SALE10') { setDiscount(0.1); showToast('Áp dụng mã giảm 10% thành công!'); }
    else if (couponCode.toUpperCase() === 'WELCOME') { setDiscount(0.15); showToast('Áp dụng mã giảm 15% thành công!'); }
    else { showToast('Mã giảm giá không hợp lệ', 'error'); }
  };

  const finalTotal = cartTotal * (1 - discount);

  // ─── Checkout ───
  const handleCheckout = async () => {
    if (!cart.length || !session?.user?.id) return;
    try {
      setLoading(true);
      const orderData = {
        total_price: finalTotal, subtotal: cartTotal, discount_amount: cartTotal * discount,
        shipping_fee: 0, seller_id: cart[0].seller_id, buyer_id: session.user.id,
        buyer_email: session.user.email, status: 'Chờ xác nhận',
        shipping_address: shippingAddr, payment_method: paymentMethod, note: orderNote,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, note: i.note }))
      };
      const { data: order, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;
      await supabase.from('notifications').insert([{
        user_id: cart[0].seller_id, order_id: order.id,
        message: `🛍️ Đơn hàng mới #${String(order.id).slice(-6)} — ${formatPrice(finalTotal)}`,
        type: 'new_order', is_read: false
      }]);
      showToast('🎉 Đặt hàng thành công! Đang chờ xác nhận...', 'success');
      setCart([]); setShowCart(false); setCheckoutStep('cart');
      setShippingAddr(''); setOrderNote(''); setCouponCode(''); setDiscount(0);
    } catch (err: any) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  // ─── Order Status (Seller) ───
  const updateOrderStatus = async (order: Order, newStatus: string) => {
    try {
      setActionLoading('updating-order-' + order.id);
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      const msgMap: Record<string, string> = {
        'Đã xác nhận': `✅ Đơn hàng #${String(order.id).slice(-6)} đã được xác nhận!`,
        'Đang giao':   `🚚 Đơn hàng #${String(order.id).slice(-6)} đang được giao đến bạn!`,
        'Hoàn thành':  `🎉 Đơn hàng #${String(order.id).slice(-6)} đã hoàn thành. Cảm ơn bạn!`,
      };
      const typeMap: Record<string, Notification['type']> = { 'Đã xác nhận': 'order_confirmed', 'Đang giao': 'order_shipped', 'Hoàn thành': 'order_completed' };
      if (msgMap[newStatus] && order.buyer_id) {
        await supabase.from('notifications').insert([{ user_id: order.buyer_id, order_id: order.id, message: msgMap[newStatus], type: typeMap[newStatus], is_read: false }]);
      }
      showToast(`Đã cập nhật: ${newStatus}`);
      fetchOrders();
    } catch (err: any) { showToast(err.message, 'error'); } finally { setActionLoading(null); }
  };

  const cancelOrder = async (order: Order) => {
    if (!confirm('Hủy đơn hàng này?')) return;
    try {
      setActionLoading('cancelling-' + order.id);
      const { error } = await supabase.from('orders').update({ status: 'Đã hủy' }).eq('id', order.id);
      if (error) throw error;
      if (order.buyer_id) {
        await supabase.from('notifications').insert([{ user_id: order.buyer_id, order_id: order.id, message: `❌ Đơn hàng #${String(order.id).slice(-6)} đã bị hủy.`, type: 'system', is_read: false }]);
      }
      showToast('Đã hủy đơn hàng');
      fetchOrders();
    } catch (err: any) { showToast(err.message, 'error'); } finally { setActionLoading(null); }
  };

  const markNotifRead = async (id: number) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllNotifsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session!.user.id).eq('is_read', false);
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!session) return <AuthForm />;
  if (!role) return <RoleSelection onSelect={() => supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))} />;

  const catOptions = CATEGORIES.find(c => c.id === newProduct.category)?.sub || [];

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-gray-900">
      {/* ── Toasts ── */}
      <div className="fixed top-6 right-6 z-[150] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-bold max-w-xs ${t.type === 'success' ? 'bg-gray-900 text-white border-gray-700' : t.type === 'error' ? 'bg-red-600 text-white border-red-500' : 'bg-blue-600 text-white border-blue-500'}`}>
              {t.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : t.type === 'error' ? <X className="w-4 h-4 flex-shrink-0" /> : <Bell className="w-4 h-4 flex-shrink-0" />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showNotifications && <NotificationPanel notifications={notifications} onClose={() => setShowNotifications(false)} onMarkRead={markNotifRead} onMarkAllRead={markAllNotifsRead} />}
      </AnimatePresence>

      <AnimatePresence>
        {viewProduct && <ProductDetailModal product={viewProduct} onClose={() => setViewProduct(null)} onAddToCart={(p, qty, note) => addToCart(p, qty, note)} wishlisted={wishlist.includes(viewProduct.id)} onWishlist={id => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id])} />}
      </AnimatePresence>

      {/* ══════════════════════════════ NAVBAR ══════════════════════════════ */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab(role === 'seller' ? 'my-products' : 'marketplace')}>
              <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight hidden sm:block">Marketplace</span>
              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${role === 'seller' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>
                {role === 'seller' ? 'Seller' : 'Buyer'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {role === 'seller' ? (
                <>
                  {[
                    { id: 'my-products', icon: LayoutDashboard, label: 'Sản phẩm' },
                    { id: 'my-orders', icon: BarChart3, label: 'Đơn hàng' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { id: 'marketplace', icon: Home, label: 'Mua sắm' },
                    { id: 'my-purchases', icon: Package, label: 'Đơn của tôi' },
                    { id: 'wishlist-tab', icon: Heart, label: 'Yêu thích' },
                  ].map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'buyer' && (
              <button onClick={() => { setShowCart(true); setCheckoutStep('cart'); }}
                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
              </button>
            )}
            <button onClick={() => setShowNotifications(true)} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-gray-700 max-w-[120px] truncate">{session?.user?.email}</span>
            </div>
            <button onClick={() => supabase.auth.signOut()}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ██████████████████  SELLER: MY PRODUCTS  ██████████████████ */}
        {activeTab === 'my-products' && (
          <motion.main key="my-products" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Sản phẩm của tôi</h1>
                <p className="text-gray-500 text-sm">{products.length} sản phẩm đang kinh doanh</p>
              </div>
              <button onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] text-sm">
                <PackagePlus className="w-4 h-4" /> Thêm sản phẩm
              </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl border transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
                <Store className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-700 mb-1">Cửa hàng trống</p>
                <button onClick={() => setShowAddProduct(true)} className="text-blue-600 font-bold hover:underline text-sm">+ Thêm ngay</button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group relative">
                    <div className="h-40 overflow-hidden relative bg-gray-50">
                      {isVideo(p.image) ? <video src={p.image} className="w-full h-full object-cover" muted /> : <img src={p.image || `https://picsum.photos/seed/${p.id}/300/200`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />}
                      {(p.stock || 0) <= 5 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Sắp hết</span>}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-sm truncate mb-0.5">{p.name}</p>
                      <p className="text-blue-600 font-black text-sm">{formatPrice(p.price)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400 font-medium">{p.stock ?? '∞'} kho</span>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} disabled={actionLoading?.startsWith('deleting')} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors disabled:opacity-50">
                            {actionLoading === 'deleting-' + p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={p.image || `https://picsum.photos/seed/${p.id}/100`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category}{p.subcategory ? ` > ${p.subcategory}` : ''}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-blue-600 text-sm">{formatPrice(p.price)}</p>
                      <p className={`text-[10px] font-bold mt-0.5 ${(p.stock || 0) <= 5 ? 'text-red-500' : 'text-gray-400'}`}>{p.stock ?? '∞'} còn</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} disabled={actionLoading?.startsWith('deleting')} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors disabled:opacity-50">
                        {actionLoading === 'deleting-' + p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {showAddProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetProductForm} />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between z-10 rounded-t-3xl">
                      <h3 className="text-xl font-black">{editingProduct ? '✏️ Chỉnh sửa sản phẩm' : '📦 Thêm sản phẩm mới'}</h3>
                      <button onClick={resetProductForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Ảnh / Video sản phẩm</label>
                        <div className="relative h-44 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden group hover:border-blue-400 transition-colors">
                          {previewUrl ? (
                            isVideo(previewUrl) ? <video src={previewUrl} className="w-full h-full object-cover" muted /> : <img src={previewUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                              <Camera className="w-10 h-10 mb-2" /><p className="text-sm font-medium">Nhấn để chọn ảnh hoặc video</p>
                            </div>
                          )}
                          <input type="file" accept="image/*,video/*" required={!editingProduct} onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Tên sản phẩm *</label>
                        <input required value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Danh mục *</label>
                          <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none">
                            {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                          </select>
                        </div>
                        {catOptions.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phân loại</label>
                            <select value={newProduct.subcategory} onChange={e => setNewProduct(p => ({ ...p, subcategory: e.target.value }))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 appearance-none">
                              <option value="">-- Chọn loại --</option>
                              {catOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Giá bán (VND) *</label>
                          <input type="number" required value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Giá gốc</label>
                          <input type="number" value={newProduct.original_price} onChange={e => setNewProduct(p => ({ ...p, original_price: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Số lượng kho</label>
                          <input type="number" value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))}
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Tags</label>
                          <input value={newProduct.tags} onChange={e => setNewProduct(p => ({ ...p, tags: e.target.value }))}
                            placeholder="tươi, ngon, hữu cơ..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Mô tả sản phẩm</label>
                        <textarea rows={3} value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all resize-none" />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={resetProductForm} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl transition-all text-sm">Hủy</button>
                        <button type="submit" disabled={actionLoading === 'saving'}
                          className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] text-sm">
                          {actionLoading === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
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

        {/* ████████████████████  SELLER: ORDERS  █████████████████████ */}
        {activeTab === 'my-orders' && (
          <motion.main key="my-orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Quản lý đơn hàng</h1>
                <p className="text-gray-500 text-sm">Xác nhận & cập nhật trạng thái đơn hàng</p>
              </div>
              <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                <RefreshCw className="w-4 h-4" /> Làm mới
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Tổng doanh thu', value: formatPrice(totalRevenue), icon: DollarSign, color: 'bg-blue-600', textColor: 'text-white' },
                { label: 'Hôm nay', value: formatPrice(todayRevenue), icon: TrendingUp, color: 'bg-emerald-500', textColor: 'text-white' },
                { label: 'Tổng đơn hàng', value: orders.length.toString(), icon: ShoppingBag, color: 'bg-white border border-gray-100', textColor: 'text-gray-900' },
                { label: 'Chờ xác nhận', value: orders.filter(o => o.status === 'Chờ xác nhận').length.toString(), icon: Clock, color: 'bg-amber-50 border border-amber-100', textColor: 'text-amber-700' },
              ].map(({ label, value, icon: Icon, color, textColor }) => (
                <div key={label} className={`${color} rounded-2xl p-5 shadow-sm`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${color.includes('blue') || color.includes('emerald') ? 'text-white/70' : 'text-gray-400'}`}>{label}</p>
                  <p className={`text-2xl font-black ${textColor}`}>{value}</p>
                  <Icon className={`w-5 h-5 mt-2 ${color.includes('blue') || color.includes('emerald') ? 'text-white/40' : 'text-gray-300'}`} />
                </div>
              ))}
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center h-64 gap-3"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span className="text-gray-500 font-medium">Đang tải...</span></div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-500">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const cfg = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES['Chờ xác nhận'];
                  return (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-wrap items-start gap-4 justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">#{String(order.id).slice(-8)}</span>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                            {order.buyer_email && <p className="text-xs text-gray-500 mt-0.5">👤 {order.buyer_email}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-600 text-lg">{formatPrice(order.total_price)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                          <span key={idx} className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{item.name} ×{item.quantity}</span>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {cfg.next && (
                          <button onClick={() => updateOrderStatus(order, cfg.next!)} disabled={actionLoading === 'updating-order-' + order.id}
                            className={`flex-1 min-w-[120px] ${cfg.nextBg} text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2`}>
                            {actionLoading === 'updating-order-' + order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {cfg.nextLabel}
                          </button>
                        )}
                        {order.status === 'Chờ xác nhận' && (
                          <button onClick={() => cancelOrder(order)} disabled={actionLoading === 'cancelling-' + order.id} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors">
                            {actionLoading === 'cancelling-' + order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Từ chối'}
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

        {/* ████████████████  BUYER: MARKETPLACE  ████████████████ */}
        {activeTab === 'marketplace' && (
          <motion.main key="marketplace" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm, thương hiệu, danh mục..."
                className="w-full bg-white border border-gray-200 rounded-3xl py-4 pl-14 pr-14 text-sm focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-sm" />
              <button onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-2xl transition-all ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Sắp xếp theo</p>
                      <div className="space-y-1.5">
                        {[
                          { v: 'newest', l: '🕐 Mới nhất' }, { v: 'popular', l: '🔥 Phổ biến nhất' },
                          { v: 'price_asc', l: '💰 Giá thấp → cao' }, { v: 'price_desc', l: '💎 Giá cao → thấp' },
                          { v: 'rating', l: '⭐ Đánh giá cao nhất' },
                        ].map(({ v, l }) => (
                          <button key={v} onClick={() => setSortBy(v as any)}
                            className={`w-full text-left text-sm font-medium px-3 py-2 rounded-xl transition-all ${sortBy === v ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Khoảng giá</p>
                      <div className="space-y-2">
                        {[[0, 100000], [100000, 500000], [500000, 1000000], [1000000, 5000000], [5000000, 10000000]].map(([min, max]) => (
                          <button key={`${min}-${max}`} onClick={() => setPriceRange([min, max])}
                            className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all ${priceRange[0] === min && priceRange[1] === max ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                            {min === 0 ? `Dưới ${formatPrice(max)}` : `${formatPrice(min)} – ${formatPrice(max)}`}
                          </button>
                        ))}
                        <button onClick={() => setPriceRange([0, 10000000])} className="text-xs text-gray-400 hover:text-gray-600 font-medium underline">Xóa bộ lọc giá</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Hiển thị</p>
                      <div className="flex gap-2">
                        {[{ v: 'grid', l: 'Lưới', icon: Grid3X3 }, { v: 'list', l: 'Danh sách', icon: List }].map(({ v, l, icon: Icon }) => (
                          <button key={v} onClick={() => setViewMode(v as 'grid' | 'list')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${viewMode === v ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            <Icon className="w-4 h-4" />{l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedSubcat(''); }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat.id ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <span>{cat.icon}</span>{cat.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {selectedCategory !== 'all' && CATEGORIES.find(c => c.id === selectedCategory)?.sub.length && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button onClick={() => setSelectedSubcat('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${!selectedSubcat ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500'}`}>Tất cả</button>
                  {CATEGORIES.find(c => c.id === selectedCategory)?.sub.map(sub => (
                    <button key={sub} onClick={() => setSelectedSubcat(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedSubcat === sub ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>{sub}</button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">
                {loading ? 'Đang tải...' : `${filteredProducts.length} sản phẩm`}
                {searchQuery && <span className="text-blue-600 font-bold"> cho "{searchQuery}"</span>}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl border transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-600">Không tìm thấy sản phẩm nào</p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedSubcat(''); setPriceRange([0, 10000000]); }}
                  className="mt-4 text-blue-600 font-bold text-sm hover:underline">Xóa bộ lọc</button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p}
                    onAddToCart={addToCart} onView={setViewProduct}
                    wishlisted={wishlist.includes(p.id)}
                    onWishlist={id => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id])}
                    onHide={handleHideProduct}
                    hidden={hiddenProducts.includes(p.id)} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setViewProduct(p)}>
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={p.image || `https://picsum.photos/seed/${p.id}/200`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm mb-1 line-clamp-2">{p.name}</p>
                      {p.rating && <Stars value={p.rating} />}
                      {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                      <div>
                        <p className="font-black text-blue-600">{formatPrice(p.price)}</p>
                        {p.original_price && <p className="text-xs text-gray-400 line-through">{formatPrice(p.original_price)}</p>}
                      </div>
                      <button onClick={e => { e.stopPropagation(); addToCart(p); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all">Thêm</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.main>
        )}

        {/* ████████████████  BUYER: MY PURCHASES  ████████████████ */}
        {activeTab === 'my-purchases' && (
          <motion.main key="my-purchases" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">Đơn hàng của tôi</h1>
                <p className="text-gray-500 text-sm">Theo dõi và quản lý đơn hàng</p>
              </div>
              <button onClick={fetchBuyerOrders} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                <RefreshCw className="w-4 h-4" /> Làm mới
              </button>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center h-48 gap-3"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
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
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">#{String(order.id).slice(-8)}</span>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-blue-600">{formatPrice(order.total_price)}</p>
                          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="px-6 py-4 flex flex-wrap gap-2">
                        {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            <span className="text-sm font-bold text-gray-800">{item.name}</span>
                            <span className="text-xs text-gray-400">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {order.status !== 'Đã hủy' && (
                        <div className="px-6 pb-6">
                          <div className="flex items-center">
                            {PROGRESS_STEPS.map((step, idx) => {
                              const done = idx <= currentStep;
                              const active = idx === currentStep;
                              return (
                                <React.Fragment key={step}>
                                  <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${done ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-gray-100 text-gray-400'} ${active ? 'ring-4 ring-blue-100' : ''}`}>
                                      {done ? <Check className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span className={`text-[9px] font-black text-center whitespace-nowrap ${done ? 'text-blue-600' : 'text-gray-400'}`} style={{ maxWidth: '60px' }}>{step}</span>
                                  </div>
{idx < PROGRESS_STEPS.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 rounded-full mb-5 transition-all ${idx < currentStep ? 'bg-blue-600' : 'bg-gray-100'}`} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
{/* ... Tiếp tục từ phần render buyerOrders ... */}
                      {order.status === 'Đã hủy' && (
                        <div className="mx-6 mb-5 p-3 bg-red-50 rounded-2xl text-red-600 text-sm font-medium text-center border border-red-100">❌ Đơn hàng đã bị hủy</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.main>
        )}

        {/* ████████████████  BUYER: WISHLIST  ████████████████ */}
        {activeTab === 'wishlist-tab' && (
          <motion.main key="wishlist-tab" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-black">Sản phẩm yêu thích</h1>
              <p className="text-gray-500 text-sm">{wishlist.length - hiddenProducts.filter(id => wishlist.includes(id)).length} sản phẩm đã lưu</p>
            </div>
            {wishlist.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="font-bold text-gray-600">Chưa có sản phẩm yêu thích</p>
                <button onClick={() => setActiveTab('marketplace')} className="mt-3 text-blue-600 font-bold text-sm hover:underline">Khám phá ngay →</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {allProducts
                  .filter(p => wishlist.includes(p.id) && !hiddenProducts.includes(p.id))
                  .map(p => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      onAddToCart={addToCart} 
                      onView={setViewProduct}
                      wishlisted={true} 
                      onWishlist={id => setWishlist(w => w.filter(x => x !== id))} 
                      onHide={handleHideProduct}
                      hidden={hiddenProducts.includes(p.id)}
                    />
                  ))}
              </div>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* ══════════════════════ CART SIDEBAR ══════════════════════ */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-[70] flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} />
            <motion.section initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl">

              {/* Cart Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  {checkoutStep !== 'cart' && (
                    <button onClick={() => setCheckoutStep('cart')} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  )}
                  <h2 className="text-lg font-black flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                    {checkoutStep === 'cart' ? `Giỏ hàng (${cart.length})` : 
                     checkoutStep === 'address' ? 'Địa chỉ giao hàng' : 
                     checkoutStep === 'payment' ? 'Thanh toán' : 'Xác nhận đơn'}
                  </h2>
                </div>
                <button onClick={() => { setShowCart(false); setCheckoutStep('cart'); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {/* Steps indicator */}
              <div className="flex px-5 py-3 border-b border-gray-50 gap-1">
                {['cart', 'address', 'payment', 'confirm'].map((step, idx) => (
                  <div key={step} className={`flex-1 h-1 rounded-full transition-all ${['cart', 'address', 'payment', 'confirm'].indexOf(checkoutStep) >= idx ? 'bg-blue-600' : 'bg-gray-100'}`} />
                ))}
              </div>

              {/* ── Step: Cart ── */}
              {checkoutStep === 'cart' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <AnimatePresence>
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-gray-300">
                          <ShoppingBag className="w-16 h-16" />
                          <p className="font-bold text-gray-500">Giỏ hàng trống</p>
                          <button onClick={() => { setShowCart(false); setActiveTab('marketplace'); }} className="text-blue-600 text-sm font-bold hover:underline">Khám phá sản phẩm →</button>
                        </div>
                      ) : cart.map(item => (
                        <motion.div key={item.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3 group">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                            <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{item.name}</p>
                            <p className="text-blue-600 font-black text-sm">{formatPrice(item.price)}</p>
                            {item.note && <p className="text-xs text-gray-400 italic truncate">"{item.note}"</p>}
                            <div className="flex items-center gap-2 mt-2 bg-white border border-gray-200 rounded-xl p-1 w-fit">
                              <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><Minus className="w-3 h-3" /></button>
                              <span className="font-black text-sm w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {cart.length > 0 && (
                    <div className="p-5 border-t border-gray-100 space-y-4 bg-white">
                      <div className="flex gap-2">
                        <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Mã giảm giá (SALE10, WELCOME)"
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20" />
                        <button onClick={applyCoupon} className="px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"><Tag className="w-4 h-4" /></button>
                      </div>
                      {discount > 0 && <p className="text-emerald-600 text-sm font-bold text-center">✓ Đã áp dụng giảm {(discount * 100).toFixed(0)}% — Tiết kiệm {formatPrice(cartTotal * discount)}</p>}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500"><span>Tạm tính</span><span>{formatPrice(cartTotal)}</span></div>
                        {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Giảm giá</span><span>-{formatPrice(cartTotal * discount)}</span></div>}
                        <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100"><span>Tổng cộng</span><span className="text-blue-600 text-xl">{formatPrice(finalTotal)}</span></div>
                      </div>
                      <button onClick={() => setCheckoutStep('address')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
                        Tiếp tục đặt hàng <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── Step: Address ── */}
              {checkoutStep === 'address' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Địa chỉ giao hàng *</label>
                      <textarea value={shippingAddr} onChange={e => setShippingAddr(e.target.value)} rows={3} required
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Ghi chú cho đơn hàng</label>
                      <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={2}
                        placeholder="Ghi chú cho người bán: thời gian giao, yêu cầu đặc biệt..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 resize-none" />
                    </div>
                  </div>
                  <div className="p-5 border-t border-gray-100">
                    <button onClick={() => { if (!shippingAddr.trim()) { showToast('Vui lòng nhập địa chỉ giao hàng', 'error'); return; } setCheckoutStep('payment'); }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                      Tiếp tục <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {/* ── Step: Payment ── */}
              {checkoutStep === 'payment' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Phương thức thanh toán</p>
                    {[
                      { id: 'cod', icon: '💵', label: 'Tiền mặt khi nhận hàng (COD)', desc: 'Thanh toán khi shipper giao tới' },
                      { id: 'bank', icon: '🏦', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản trước khi giao hàng' },
                      { id: 'momo', icon: '📱', label: 'Ví MoMo', desc: 'Thanh toán qua ứng dụng MoMo' },
                    ].map(({ id, icon, label, desc }) => (
                      <button key={id} onClick={() => setPaymentMethod(id as any)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${paymentMethod === id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <span className="text-2xl">{icon}</span>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${paymentMethod === id ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                        {paymentMethod === id && <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-5 border-t border-gray-100">
                    <button onClick={() => setCheckoutStep('confirm')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all">
                      Xem lại đơn hàng <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}

              {/* ── Step: Confirm ── */}
              {checkoutStep === 'confirm' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                      <p className="font-black text-sm text-gray-700">📦 Sản phẩm</p>
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span className="text-sm font-bold text-blue-600">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <p className="font-black text-sm text-gray-700 mb-3">📋 Thông tin đơn hàng</p>
                      <div className="text-sm space-y-2">
                        <div className="flex gap-2"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span className="text-gray-600">{shippingAddr}</span></div>
                        <div className="flex gap-2"><span className="text-lg leading-none">💳</span><span className="text-gray-600">{paymentMethod === 'cod' ? 'COD - Tiền mặt khi nhận' : paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' : 'Ví MoMo'}</span></div>
                        {orderNote && <div className="flex gap-2"><MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" /><span className="text-gray-600 italic">{orderNote}</span></div>}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-600"><span>Tạm tính</span><span>{formatPrice(cartTotal)}</span></div>
                        {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Giảm giá</span><span>-{formatPrice(cartTotal * discount)}</span></div>}
                        <div className="flex justify-between font-black text-base pt-2 border-t border-blue-200 mt-2"><span>Tổng thanh toán</span><span className="text-blue-600 text-xl">{formatPrice(finalTotal)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 border-t border-gray-100">
                    <button onClick={handleCheckout} disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]">
                      {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang đặt hàng...</> : <><Check className="w-5 h-5" /> Xác nhận đặt hàng {formatPrice(finalTotal)}</>}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-3">Đơn hàng sẽ được gửi cho người bán và chờ xác nhận</p>
                  </div>
                </>
              )}
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-20 md:hidden safe-bottom">
        <div className="flex items-center justify-around py-2">
          {role === 'buyer' ? (
            <>
              {[
                { id: 'marketplace', icon: Home, label: 'Mua sắm' },
                { id: 'my-purchases', icon: Package, label: 'Đơn hàng' },
                { id: 'wishlist-tab', icon: Heart, label: 'Yêu thích' },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={() => setShowCart(true)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-400 relative">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && <span className="absolute top-1.5 right-2.5 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cart.length}</span>}
                <span className="text-[9px] font-bold">Giỏ</span>
              </button>
              <button onClick={() => setShowNotifications(true)} className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-2.5 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
                <span className="text-[9px] font-bold">Thông báo</span>
              </button>
            </>
          ) : (
            <>
              {[
                { id: 'my-products', icon: Store, label: 'Sản phẩm' },
                { id: 'my-orders', icon: BarChart3, label: 'Đơn hàng' },
              ].map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${activeTab === id ? 'text-blue-600' : 'text-gray-400'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] font-bold">{label}</span>
                </button>
              ))}
              <button onClick={() => setShowNotifications(true)} className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl text-gray-400 relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
                <span className="text-[9px] font-bold">Thông báo</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}