import { useState, useMemo, useCallback } from 'react';
import type { Product, CartItem } from '../types';
import { COUPONS } from '../constants';

export function useCart(showToast: (msg: string, type?: any) => void) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const discountAmt = cartTotal * couponDiscount;
  const finalTotal = Math.max(0, cartTotal - discountAmt);

  const addToCart = useCallback((product: Product, qty = 1, note = '') => {
    if ((product.stock ?? 1) <= 0) { showToast('Sản phẩm đã hết hàng', 'error'); return; }
    setCart(prev => {
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
    showToast('✓ Đã thêm vào giỏ');
  }, [showToast]);

  const updateQty = useCallback((id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newQty = Math.max(1, i.quantity + delta);
      const capped = i.stock !== undefined ? Math.min(newQty, i.stock) : newQty;
      return { ...i, quantity: capped };
    }));
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
    showToast('Đã xoá khỏi giỏ hàng', 'info');
  }, [showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
    setCouponCode('');
    setCouponDiscount(0);
  }, []);

  const applyCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    const discount = COUPONS[code];
    if (discount) {
      setCouponDiscount(discount);
      showToast(`✓ Mã "${code}" — giảm ${(discount * 100).toFixed(0)}%`);
    } else {
      showToast('Mã giảm giá không hợp lệ hoặc đã hết hạn', 'error');
    }
  }, [couponCode, showToast]);

  const removeCoupon = useCallback(() => {
    setCouponDiscount(0);
    setCouponCode('');
    showToast('Đã xoá mã giảm giá', 'info');
  }, [showToast]);

  return {
    cart, setCart,
    cartTotal, discountAmt, finalTotal,
    couponCode, setCouponCode,
    couponDiscount,
    addToCart, updateQty, removeFromCart, clearCart,
    applyCoupon, removeCoupon,
  };
}
