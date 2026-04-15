import { CheckCircle2, Truck, Package, ShoppingBag, Tag, Bell, BellRing, X, Eye, EyeOff, Star, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { ProductMedia } from '../ui';
import { timeAgo, fmt } from '../../utils';
import type { Notification, Product } from '../../types';

// ─────────── NOTIFICATION PANEL ───────────
const typeIcons: Record<string, React.ReactNode> = {
  order_confirmed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  order_shipped:   <Truck className="w-4 h-4 text-blue-500" />,
  order_completed: <Package className="w-4 h-4 text-violet-500" />,
  new_order:       <ShoppingBag className="w-4 h-4 text-amber-500" />,
  promo:           <Tag className="w-4 h-4 text-pink-500" />,
  system:          <Bell className="w-4 h-4 text-gray-400" />,
  review_requested:<Star className="w-4 h-4 text-yellow-500" />,
  chat_message:    <MessageSquare className="w-4 h-4 text-blue-500" />,
};

export function NotificationPanel({
  notifications,
  onClose,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
}) {
  // FIX: An toàn hóa notifications bằng (notifications || [])
  const safeNotifs = notifications || [];
  const unread = safeNotifs.filter(n => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" />Thông báo
            </h2>
            {unread > 0 && <p className="text-xs text-gray-400 mt-0.5">{unread} chưa đọc</p>}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded-lg transition-all"
              >
                Đọc tất cả
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {safeNotifs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 p-10">
              <Bell className="w-14 h-14" />
              <p className="font-bold text-gray-400 text-sm">Không có thông báo nào</p>
            </div>
          ) : (
            safeNotifs.map(n => (
              <motion.div
                key={n.id} layout
                onClick={() => !n.is_read && onMarkRead(n.id)}
                className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !n.is_read ? 'bg-blue-50/40' : ''
                }`}
              >
                <div className="mt-0.5 p-2 bg-gray-100 rounded-xl flex-shrink-0">
                  {typeIcons[n.type] || typeIcons.system}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                    {n.message}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─────────── HIDDEN PRODUCTS PANEL ───────────
export function HiddenProductsPanel({
  hiddenIds,
  allProducts,
  onRestore,
  onClose,
}: {
  hiddenIds: number[];
  allProducts: Product[];
  onRestore: (id: number) => void;
  onClose: () => void;
}) {
  // FIX: An toàn hóa bằng mảng rỗng
  const safeProducts = allProducts || [];
  const safeHiddenIds = hiddenIds || [];
  const hiddenProducts = safeProducts.filter(p => safeHiddenIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-[85] flex justify-start">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl"
      >
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-gray-600" />Đã ẩn
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{hiddenProducts.length} sản phẩm bị ẩn</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hiddenProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4 py-20">
              <Eye className="w-14 h-14" />
              <p className="font-bold text-gray-400 text-sm text-center">Chưa có sản phẩm nào bị ẩn</p>
              <p className="text-xs text-gray-400 text-center">Nhấn nút 👁️ trên sản phẩm để ẩn</p>
            </div>
          ) : (
            hiddenProducts.map(p => (
              <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                  <ProductMedia src={p.image} alt={p.name} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-gray-700">{p.name}</p>
                  <p className="text-xs text-gray-400">{fmt(p.price)}</p>
                </div>
                <button
                  onClick={() => onRestore(p.id)}
                  className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />Hiện
                </button>
              </div>
            ))
          )}
        </div>

        {hiddenProducts.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => { safeHiddenIds.forEach(id => onRestore(id)); onClose(); }}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-sm transition-colors"
            >
              Hiện tất cả ({hiddenProducts.length})
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}