import React, { useState } from 'react';
import { Loader2, RefreshCw, ShoppingBag, MapPin, MessageSquare, Check, Heart, EyeOff, Star, X } from 'lucide-react';
import { fmt } from '../utils';
import { ORDER_STATUSES, PROGRESS_STEPS } from '../constants';
import { ProductCard } from '../components/product';
import { ProductMedia } from '../components/ui';
import type { Order, Product } from '../types';

// ─────────── BUYER ORDERS ───────────
interface BuyerOrdersProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
  onGoMarketplace: () => void;
}

export function BuyerOrders({ orders, loading, onRefresh, onGoMarketplace }: BuyerOrdersProps) {
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleSubmitReview = () => {
    // TODO: Connect this to Supabase to save the review
    alert(`Cảm ơn bạn đã đánh giá ${rating} sao! Đánh giá đã được ghi nhận.`);
    setReviewOrder(null);
    setRating(5);
    setReviewText('');
  };

  return (
    <main className="max-w-3xl mx-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Đơn hàng của tôi</h1>
          <p className="text-gray-500 text-sm">Theo dõi trạng thái và tương tác với đơn hàng</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-600">Chưa có đơn hàng nào</p>
          <button onClick={onGoMarketplace} className="mt-3 text-blue-600 font-bold text-sm hover:underline">
            Bắt đầu mua sắm →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES['Chờ xác nhận'];
            const currentStep = PROGRESS_STEPS.indexOf(order.status);
            const isCompleted = currentStep === PROGRESS_STEPS.length - 1;

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
                      {item.image && (
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                          <ProductMedia src={item.image} alt={item.name} className="w-full h-full" />
                        </div>
                      )}
                      <span className="text-xs font-bold text-gray-800">{item.name}</span>
                      <span className="text-xs text-gray-400">×{item.quantity}</span>
                      <span className="text-xs font-bold text-blue-600">{fmt(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                {(order.shipping_address || order.payment_method || (order.discount_amount || 0) > 0) && (
                  <div className="px-5 pb-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    {order.shipping_address && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.shipping_address}</span>
                    )}
                    {order.payment_method && (
                      <span>💳 {order.payment_method === 'cod' ? 'COD' : order.payment_method === 'bank' ? 'Chuyển khoản' : 'MoMo'}</span>
                    )}
                    {(order.discount_amount || 0) > 0 && (
                      <span className="text-emerald-600 font-bold">Tiết kiệm {fmt(order.discount_amount!)}</span>
                    )}
                  </div>
                )}

                {/* Progress */}
                {order.status !== 'Đã hủy' ? (
                  <div className="px-5 pb-4">
                    <div className="flex items-center">
                      {PROGRESS_STEPS.map((step, idx) => {
                        const done = idx <= currentStep;
                        const active = idx === currentStep;
                        return (
                          <React.Fragment key={step}>
                            <div className="flex flex-col items-center gap-1.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                done ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-gray-100 text-gray-400'
                              } ${active ? 'ring-4 ring-blue-100' : ''}`}>
                                {done ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={`text-[9px] font-bold text-center whitespace-nowrap max-w-[56px] leading-tight ${done ? 'text-blue-600' : 'text-gray-400'}`}>
                                {step}
                              </span>
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
                  <div className="mx-5 mb-5 p-3 bg-red-50 rounded-2xl text-red-600 text-sm font-bold text-center border border-red-100">
                    ❌ Đơn hàng đã bị huỷ
                  </div>
                )}

                {/* Interaction Actions */}
                {order.status !== 'Đã hủy' && (
                  <div className="px-5 pb-4 flex items-center justify-end gap-3 border-t border-gray-50 pt-4">
                    <button 
                      onClick={() => alert('Tính năng chat với shop đang được phát triển!')}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" /> Liên hệ shop
                    </button>
                    {isCompleted && !order.is_reviewed && (
                      <button
                        onClick={() => setReviewOrder(order)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-yellow-500 hover:bg-yellow-600 rounded-xl transition-colors shadow-sm"
                      >
                        <Star className="w-4 h-4" /> Đánh giá sản phẩm
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Overlay */}
      {reviewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setReviewOrder(null)} 
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-gray-800">Đánh giá đơn hàng</h2>
              <p className="text-xs text-gray-500 mt-1 font-mono">#{String(reviewOrder.id).slice(-8)}</p>
            </div>

            <div className="flex gap-2 mb-6 justify-center">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>

            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white mb-4 transition-all resize-none"
              rows={4}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm và dịch vụ shop..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
            />

            <button 
              onClick={handleSubmitReview} 
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
            >
              Gửi đánh giá
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ─────────── WISHLIST ───────────
interface WishlistProps {
  wishlistProducts: Product[];
  disliked: number[];
  wishlist: number[];
  onAddToCart: (p: Product) => void;
  onView: (p: Product) => void;
  onWishlist: (id: number) => void;
  onDislike: (id: number) => void;
  onShowHidden: () => void;
  onGoMarketplace: () => void;
}

export function Wishlist({
  wishlistProducts, disliked, wishlist,
  onAddToCart, onView, onWishlist, onDislike,
  onShowHidden, onGoMarketplace,
}: WishlistProps) {
  return (
    <main className="max-w-7xl mx-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Yêu thích</h1>
          <p className="text-gray-500 text-sm">{wishlistProducts.length} sản phẩm đã lưu</p>
        </div>
        {disliked.length > 0 && (
          <button
            onClick={onShowHidden}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all"
          >
            <EyeOff className="w-4 h-4" />{disliked.length} đã ẩn
          </button>
        )}
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-600 text-lg">Chưa có sản phẩm yêu thích</p>
          <p className="text-gray-400 text-sm mt-1">Nhấn ❤️ trên sản phẩm bất kỳ để lưu lại</p>
          <button onClick={onGoMarketplace} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
            Khám phá ngay →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {wishlistProducts.map(p => (
            <ProductCard key={p.id} product={p}
              onAddToCart={onAddToCart} onView={onView}
              wishlisted={true} onWishlist={onWishlist}
              disliked={disliked.includes(p.id)} onDislike={onDislike}
            />
          ))}
        </div>
      )}
    </main>
  );
}