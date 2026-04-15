import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw, ShoppingBag, DollarSign, TrendingUp, Clock, MapPin, MessageCircle, MessageSquare, X, Send } from 'lucide-react';
import { fmt } from '../utils';
import { ORDER_STATUSES } from '../constants';
import { useChat } from '../hooks/useChat';
import type { Order } from '../types';

interface SellerOrdersProps {
  orders: Order[];
  loading: boolean;
  totalRevenue: number;
  todayRevenue: number;
  onRefresh: () => void;
  onUpdateStatus: (order: Order, newStatus: string) => void;
  onCancelOrder: (order: Order) => void;
}

export function SellerOrders({
  orders, loading, totalRevenue, todayRevenue,
  onRefresh, onUpdateStatus, onCancelOrder,
}: SellerOrdersProps) {
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [msgInput, setMsgInput] = useState('');
  
  const { messages, sendMessage } = useChat(chatOrder?.id || null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatOrder]);

  const handleSendChat = () => {
    if (!chatOrder || !msgInput.trim()) return;
    // Người bán gửi cho người mua
    sendMessage(chatOrder.seller_id, chatOrder.buyer_id, msgInput);
    setMsgInput('');
  };

  return (
    <main className="max-w-7xl mx-auto p-5 space-y-5 relative">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Quản lý đơn hàng</h1>
          <p className="text-gray-500 text-sm">Xác nhận & cập nhật trạng thái đơn hàng</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold hover:bg-gray-50 shadow-sm transition-all"
        >
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

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span className="text-gray-400">Đang tải...</span>
        </div>
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
                    {(order.discount_amount || 0) > 0 && (
                      <p className="text-xs text-emerald-600">−{fmt(order.discount_amount!)} giảm giá</p>
                    )}
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
                    {order.shipping_address && (
                      <p className="text-xs text-gray-600 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />{order.shipping_address}
                      </p>
                    )}
                    {order.note && (
                      <p className="text-xs text-gray-500 flex items-start gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />{order.note}
                      </p>
                    )}
                    {order.payment_method && (
                      <p className="text-xs text-gray-400">
                        💳 {order.payment_method === 'cod' ? 'COD - Tiền mặt' : order.payment_method === 'bank' ? 'Chuyển khoản' : 'MoMo'}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setChatOrder(order)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Chat với Khách
                  </button>
                  <div className="flex-1"></div>
                  {cfg.next && (
                    <button
                      onClick={() => onUpdateStatus(order, cfg.next!)}
                      className={`min-w-[140px] ${cfg.nextBg} text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all active:scale-[0.97]`}
                    >
                      {cfg.nextLabel}
                    </button>
                  )}
                  {(order.status === 'Chờ xác nhận' || order.status === 'Đã xác nhận') && (
                    <button
                      onClick={() => onCancelOrder(order)}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-colors"
                    >
                      Huỷ đơn
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
          <div className="bg-white w-full max-w-md h-full sm:h-[600px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black">
                  {chatOrder.buyer_email ? chatOrder.buyer_email[0].toUpperCase() : 'K'}
                </div>
                <div>
                  <p className="font-bold text-sm truncate max-w-[200px]">Khách: {chatOrder.buyer_email || chatOrder.buyer_id.slice(0,8)}</p>
                  <p className="text-[10px] text-gray-400">Đơn hàng #{String(chatOrder.id).slice(-8)}</p>
                </div>
              </div>
              <button onClick={() => setChatOrder(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scroll-smooth">
              {messages.map(m => {
                const isMe = m.sender_id === chatOrder.seller_id;
                const isTemp = m.id < 0;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isTemp ? 'opacity-70' : ''}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t bg-white flex gap-2">
              <input 
                value={msgInput} 
                onChange={e => setMsgInput(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSendChat()} 
                placeholder="Nhập tin nhắn hỗ trợ khách hàng..." 
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-shadow outline-none" 
              />
              <button 
                onClick={handleSendChat} 
                disabled={!msgInput.trim()}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}