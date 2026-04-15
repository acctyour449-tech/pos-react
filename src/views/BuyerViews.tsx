import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw, ShoppingBag, MapPin, MessageSquare, Check, Heart, EyeOff, Star, X, Send } from 'lucide-react';
import { fmt } from '../utils';
import { ORDER_STATUSES, PROGRESS_STEPS } from '../constants';
import { ProductCard } from '../components/product';
import { ProductMedia } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useChat } from '../hooks/useChat';
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
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [msgInput, setMsgInput] = useState('');
  
  const { messages, sendMessage, loading: chatLoading } = useChat(chatOrder?.id || null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSubmitReview = async () => {
    if (!reviewOrder) return;
    const productId = reviewOrder.items[0]?.id;
    
    const { error } = await supabase.from('reviews').insert({
      order_id: reviewOrder.id,
      product_id: productId,
      buyer_id: reviewOrder.buyer_id,
      rating,
      comment: reviewText
    });

    if (!error) {
      await supabase.from('orders').update({ is_reviewed: true }).eq('id', reviewOrder.id);
      alert('Cảm ơn bạn đã đánh giá!');
      setReviewOrder(null);
      onRefresh();
    }
  };

  const handleSendChat = () => {
    if (!chatOrder || !msgInput.trim()) return;
    sendMessage(chatOrder.buyer_id, chatOrder.seller_id, msgInput);
    setMsgInput('');
  };

  return (
    <main className="max-w-3xl mx-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Đơn hàng của tôi</h1>
          <p className="text-gray-500 text-sm">Theo dõi trạng thái và tương tác với đơn hàng</p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 shadow-sm transition-all">
          <RefreshCw className="w-4 h-4" />Làm mới
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-gray-600">Chưa có đơn hàng nào</p>
          <button onClick={onGoMarketplace} className="mt-3 text-blue-600 font-bold text-sm hover:underline">Bắt đầu mua sắm →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const currentStep = PROGRESS_STEPS.indexOf(order.status);
            const isCompleted = currentStep === PROGRESS_STEPS.length - 1;
            const cfg = ORDER_STATUSES[order.status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES['Chờ xác nhận'];

            return (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">#{String(order.id).slice(-8)}</span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-blue-600 text-lg">{fmt(order.total_price)}</p>
                  </div>
                </div>

                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-xs font-bold">
                      <span className="text-gray-800">{item.name}</span>
                      <span className="text-gray-400">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-4 flex items-center justify-end gap-3 border-t border-gray-50 pt-4">
                  <button onClick={() => setChatOrder(order)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    <MessageSquare className="w-4 h-4" /> Chat với Shop
                  </button>
                  {isCompleted && !order.is_reviewed && (
                    <button onClick={() => setReviewOrder(order)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-yellow-500 hover:bg-yellow-600 rounded-xl transition-colors">
                      <Star className="w-4 h-4" /> Đánh giá
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHAT MODAL */}
      {chatOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full sm:h-[600px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">S</div>
                <div>
                  <p className="font-bold text-sm">Người bán: {chatOrder.seller_id.slice(0, 8)}</p>
                  <p className="text-[10px] opacity-80">Đơn hàng #{String(chatOrder.id).slice(-8)}</p>
                </div>
              </div>
              <button onClick={() => setChatOrder(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === chatOrder.buyer_id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${
                    m.sender_id === chatOrder.buyer_id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-white flex gap-2">
              <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendChat()} placeholder="Nhập tin nhắn..." className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleSendChat} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"><Send className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setReviewOrder(null)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
            <h2 className="text-xl font-black text-center mb-6">Đánh giá sản phẩm</h2>
            <div className="flex gap-2 mb-6 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                  <Star className={`w-10 h-10 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <textarea className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm mb-4 resize-none" rows={4} placeholder="Cảm nhận của bạn..." value={reviewText} onChange={e => setReviewText(e.target.value)} />
            <button onClick={handleSubmitReview} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Gửi đánh giá</button>
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

export function Wishlist({ wishlistProducts, disliked, onAddToCart, onView, onWishlist, onDislike, onShowHidden, onGoMarketplace }: WishlistProps) {
  return (
    <main className="max-w-7xl mx-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Yêu thích</h1>
          <p className="text-gray-500 text-sm">{wishlistProducts.length} sản phẩm đã lưu</p>
        </div>
        {disliked.length > 0 && (
          <button onClick={onShowHidden} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all">
            <EyeOff className="w-4 h-4" />{disliked.length} đã ẩn
          </button>
        )}
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-600 text-lg">Chưa có sản phẩm yêu thích</p>
          <button onClick={onGoMarketplace} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Khám phá ngay →</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {wishlistProducts.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onView={onView} wishlisted={true} onWishlist={onWishlist} disliked={disliked.includes(p.id)} onDislike={onDislike} />
          ))}
        </div>
      )}
    </main>
  );
}