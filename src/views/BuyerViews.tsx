import React, { useState } from 'react';
import { Loader2, RefreshCw, ShoppingBag, MapPin, Check, Heart, EyeOff, Star, X, MessageSquareReply } from 'lucide-react';
import { fmt } from '../utils';
import { ORDER_STATUSES, PROGRESS_STEPS } from '../constants';
import { ProductCard } from '../components/product';
import { ProductMedia } from '../components/ui';
import type { Order, Product, OrderItem } from '../types';

// ─────────── BUYER ORDERS ───────────
interface BuyerOrdersProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
  onGoMarketplace: () => void;
  onSubmitReview?: (orderId: number, productId: number, rating: number, comment: string) => void;
}

export function BuyerOrders({ orders, loading, onRefresh, onGoMarketplace, onSubmitReview }: BuyerOrdersProps) {
  // State quản lý Modal Đánh Giá
  const [reviewModal, setReviewModal] = useState<{ orderId: number; item: OrderItem } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleOpenReview = (orderId: number, item: OrderItem) => {
    setReviewModal({ orderId, item });
    setRating(5);
    setComment('');
  };

  const handleSubmitReview = () => {
    if (reviewModal && onSubmitReview) {
      onSubmitReview(reviewModal.orderId, reviewModal.item.id, rating, comment);
    }
    setReviewModal(null);
  };

  return (
    <main className="max-w-3xl mx-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Đơn hàng của tôi</h1>
          <p className="text-gray-500 text-sm">Theo dõi trạng thái đơn hàng realtime</p>
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
            // Có thể đánh giá nếu đơn hàng Đã giao hoặc Hoàn thành
            const canReview = order.status === 'Đã giao' || order.status === 'Hoàn thành' || order.status === 'Hoàn tất';

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
                <div className="px-5 py-4 flex flex-col gap-3">
                  {Array.isArray(order.items) && order.items.map((item: OrderItem, i: number) => {
                    const hasReviewed = !!item.review;

                    return (
                      <div key={i} className="flex flex-col gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                <ProductMedia src={item.image} alt={item.name} className="w-full h-full" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                              <p className="text-xs text-gray-500">Số lượng: {item.quantity} • {fmt(item.price)}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-sm font-bold text-blue-600">{fmt(item.price * item.quantity)}</span>
                            {canReview && !hasReviewed && (
                              <button
                                onClick={() => handleOpenReview(order.id, item)}
                                className="text-[10px] bg-white border border-blue-200 text-blue-600 font-bold px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
                              >
                                Đánh giá ngay
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Hiển thị Đánh giá nếu đã review */}
                        {hasReviewed && item.review && (
                          <div className="mt-2 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center text-yellow-400">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star key={idx} className={`w-3 h-3 ${idx < item.review!.rating ? 'fill-current' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-400">Đã đánh giá</span>
                            </div>
                            <p className="text-xs text-gray-700 mt-1">"{item.review.comment}"</p>

                            {/* Phản hồi từ người bán */}
                            {item.review.seller_reply && (
                              <div className="mt-2 pl-3 py-1.5 border-l-2 border-emerald-500 bg-emerald-50/50 rounded-r-lg">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <MessageSquareReply className="w-3 h-3 text-emerald-600" />
                                  <span className="text-[10px] font-bold text-emerald-700">Phản hồi từ người bán:</span>
                                </div>
                                <p className="text-xs text-gray-600">{item.review.seller_reply}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Meta */}
                {(order.shipping_address || order.payment_method || (order.discount_amount || 0) > 0) && (
                  <div className="px-5 pb-4 flex flex-wrap gap-3 text-xs text-gray-500">
                    {order.shipping_address && (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{order.shipping_address}</span>
                    )}
                    {order.payment_method && (
                      <span>💳 {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.payment_method === 'bank' ? 'Chuyển khoản' : 'Ví điện tử'}</span>
                    )}
                    {(order.discount_amount || 0) > 0 && (
                      <span className="text-emerald-600 font-bold">Tiết kiệm {fmt(order.discount_amount!)}</span>
                    )}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setReviewModal(null)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-black text-xl mb-1">Đánh giá sản phẩm</h3>
            <p className="text-gray-500 text-sm mb-5">Chia sẻ trải nghiệm của bạn về sản phẩm này</p>

            <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <img src={reviewModal.item.image} className="w-12 h-12 rounded-lg object-cover" alt="Product" />
              <div className="flex-1">
                <p className="font-bold text-sm line-clamp-1">{reviewModal.item.name}</p>
                <p className="text-xs text-blue-600 font-bold">{fmt(reviewModal.item.price)}</p>
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setRating(star)} className="focus:outline-none hover:scale-110 transition-transform">
                  <Star className={`w-10 h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Sản phẩm dùng tốt không? Có đúng như mô tả không?..."
              className="w-full border-2 border-gray-100 rounded-xl p-4 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none min-h-[120px] mb-6 resize-none transition-all"
            />

            <button
              onClick={handleSubmitReview}
              disabled={!comment.trim()}
              className="w-full bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
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