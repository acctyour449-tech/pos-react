import { ShoppingCart, X, ChevronLeft, ChevronRight, Minus, Plus, Trash2, ShoppingBag, Check, CheckCircle2, MapPin, MessageCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductMedia } from '../ui';
import { fmt } from '../../utils';
import type { CartItem } from '../../types';

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirm';

interface CartSidebarProps {
  cart: CartItem[];
  cartTotal: number;
  discountAmt: number;
  finalTotal: number;
  couponCode: string;
  couponDiscount: number;
  checkoutStep: CheckoutStep;
  shippingAddr: string;
  paymentMethod: 'cod' | 'bank' | 'momo';
  orderNote: string;
  submittingOrder: boolean;
  onClose: () => void;
  onSetCheckoutStep: (s: CheckoutStep) => void;
  onUpdateQty: (id: number, delta: number) => void;
  onRemoveFromCart: (id: number) => void;
  onSetCouponCode: (v: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  onSetShippingAddr: (v: string) => void;
  onSetPaymentMethod: (v: 'cod' | 'bank' | 'momo') => void;
  onSetOrderNote: (v: string) => void;
  onCheckout: () => void;
  showToast: (msg: string, type?: any) => void;
  onGoToMarketplace: () => void;
}

export function CartSidebar({
  cart, cartTotal, discountAmt, finalTotal,
  couponCode, couponDiscount,
  checkoutStep, shippingAddr, paymentMethod, orderNote, submittingOrder,
  onClose, onSetCheckoutStep,
  onUpdateQty, onRemoveFromCart,
  onSetCouponCode, onApplyCoupon, onRemoveCoupon,
  onSetShippingAddr, onSetPaymentMethod, onSetOrderNote,
  onCheckout, showToast, onGoToMarketplace,
}: CartSidebarProps) {
  const stepBack = () => {
    if (checkoutStep === 'confirm') onSetCheckoutStep('payment');
    else if (checkoutStep === 'payment') onSetCheckoutStep('address');
    else onSetCheckoutStep('cart');
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => { onClose(); onSetCheckoutStep('cart'); }}
      />
      <motion.section
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="relative w-full max-w-sm bg-white h-full flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {checkoutStep !== 'cart' && (
              <button onClick={stepBack} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
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
          <button
            onClick={() => { onClose(); onSetCheckoutStep('cart'); }}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex px-5 py-2.5 border-b border-gray-50 gap-1.5">
          {(['cart', 'address', 'payment', 'confirm'] as const).map((step, idx) => (
            <div
              key={step}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                (['cart', 'address', 'payment', 'confirm'] as const).indexOf(checkoutStep) >= idx
                  ? 'bg-blue-600'
                  : 'bg-gray-100'
              }`}
            />
          ))}
        </div>

        {/* STEP: Cart */}
        {checkoutStep === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-gray-300">
                  <ShoppingBag className="w-14 h-14" />
                  <p className="font-bold text-gray-400">Giỏ hàng trống</p>
                  <button onClick={onGoToMarketplace} className="text-blue-600 text-sm font-bold hover:underline">
                    Khám phá sản phẩm →
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div
                    key={item.id} layout
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-start gap-3 bg-gray-50 rounded-2xl p-3 group"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                      <ProductMedia src={item.image} alt={item.name} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate leading-snug">{item.name}</p>
                      <p className="text-blue-600 font-black text-sm">{fmt(item.price)}</p>
                      {item.note && (
                        <p className="text-xs text-gray-400 italic truncate mt-0.5">"{item.note}"</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 bg-white rounded-xl border border-gray-200 w-fit p-0.5">
                        <button
                          onClick={() => onUpdateQty(item.id, -1)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="font-black text-sm w-6 text-center select-none">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, 1)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveFromCart(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100 space-y-3 bg-white">
                {couponDiscount > 0 ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                    <span className="text-emerald-700 font-bold text-sm">
                      ✓ Giảm {(couponDiscount * 100).toFixed(0)}% — {couponCode}
                    </span>
                    <button onClick={onRemoveCoupon} className="text-emerald-600 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={e => onSetCouponCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá..."
                      onKeyDown={e => e.key === 'Enter' && onApplyCoupon()}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      onClick={onApplyCoupon}
                      className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Áp dụng
                    </button>
                  </div>
                )}

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
                    <span>{fmt(cartTotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Giảm giá {(couponDiscount * 100).toFixed(0)}%</span>
                      <span>−{fmt(discountAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400 text-xs">
                    <span>Phí vận chuyển</span>
                    <span className="text-emerald-600 font-bold">Miễn phí</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-2 border-t border-gray-100">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600 text-xl">{fmt(finalTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSetCheckoutStep('address')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                  Tiếp tục <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP: Address */}
        {checkoutStep === 'address' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Địa chỉ giao hàng *
                </label>
                <textarea
                  value={shippingAddr} onChange={e => onSetShippingAddr(e.target.value)}
                  rows={3} required
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  value={orderNote} onChange={e => onSetOrderNote(e.target.value)}
                  rows={2}
                  placeholder="Thời gian giao hàng, yêu cầu đặc biệt..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  if (!shippingAddr.trim()) { showToast('Vui lòng nhập địa chỉ giao hàng', 'error'); return; }
                  onSetCheckoutStep('payment');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all"
              >
                Tiếp tục <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* STEP: Payment */}
        {checkoutStep === 'payment' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Phương thức thanh toán</p>
              {[
                { id: 'cod' as const, icon: '💵', label: 'Tiền mặt khi nhận (COD)', desc: 'Thanh toán khi nhận hàng' },
                { id: 'bank' as const, icon: '🏦', label: 'Chuyển khoản ngân hàng', desc: 'Chuyển khoản trước khi giao' },
                { id: 'momo' as const, icon: '📱', label: 'Ví MoMo', desc: 'Thanh toán qua MoMo' },
              ].map(({ id, icon, label, desc }) => (
                <button
                  key={id} onClick={() => onSetPaymentMethod(id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    paymentMethod === id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
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
              <button
                onClick={() => onSetCheckoutStep('confirm')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all"
              >
                Xem lại đơn hàng <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {/* STEP: Confirm */}
        {checkoutStep === 'confirm' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="font-black text-sm text-gray-700 mb-3">📦 Sản phẩm</p>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      {item.name} <span className="text-gray-400">×{item.quantity}</span>
                    </span>
                    <span className="font-bold text-blue-600">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="font-black text-sm text-gray-700 mb-3">📋 Thông tin đơn</p>
                <div className="text-sm space-y-2">
                  <div className="flex gap-2 items-start">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 leading-snug">{shippingAddr}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-base">💳</span>
                    <span className="text-gray-600">
                      {paymentMethod === 'cod' ? 'COD - Tiền mặt khi nhận'
                       : paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng'
                       : 'Ví MoMo'}
                    </span>
                  </div>
                  {orderNote && (
                    <div className="flex gap-2 items-start">
                      <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 italic leading-snug">{orderNote}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span><span>{fmt(cartTotal)}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Giảm giá</span><span>−{fmt(discountAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-400">
                    <span>Vận chuyển</span>
                    <span className="text-emerald-600 font-bold">Miễn phí</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-2 border-t border-blue-200 mt-1">
                    <span>Tổng thanh toán</span>
                    <span className="text-blue-600 text-xl">{fmt(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 space-y-2">
              <button
                onClick={onCheckout} disabled={submittingOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                {submittingOrder ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Đang đặt hàng...</>
                ) : (
                  <><Check className="w-5 h-5" />Đặt hàng {fmt(finalTotal)}</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center">
                Đơn hàng sẽ được gửi cho người bán và chờ xác nhận
              </p>
            </div>
          </>
        )}
      </motion.section>
    </div>
  );
}
