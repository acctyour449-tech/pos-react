/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Coffee, Utensils, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: 'Cà phê sữa đá', price: 25000, category: 'Đồ uống', image: 'https://picsum.photos/seed/coffee/400/300' },
  { id: 2, name: 'Trà sữa trân châu', price: 35000, category: 'Đồ uống', image: 'https://picsum.photos/seed/milktea/400/300' },
  { id: 3, name: 'Bánh mì thịt', price: 20000, category: 'Thức ăn', image: 'https://picsum.photos/seed/bread/400/300' },
  { id: 4, name: 'Nước cam ép', price: 30000, category: 'Đồ uống', image: 'https://picsum.photos/seed/orange/400/300' },
];

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A]">
      {/* Header */}
      <header className="bg-white border-b border-[#E9ECEF] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">POS Pro</h1>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </header>

      <main className="flex h-[calc(100vh-65px)]">
        {/* Left Side: Product List (60%) */}
        <section className="w-[60%] p-6 overflow-y-auto border-r border-[#E9ECEF]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Utensils className="w-6 h-6 text-blue-600" />
              Danh sách Sản phẩm
            </h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-white border border-[#E9ECEF] rounded-full text-xs font-medium text-gray-600">Tất cả</span>
              <span className="px-3 py-1 bg-white border border-[#E9ECEF] rounded-full text-xs font-medium text-gray-400">Đồ uống</span>
              <span className="px-3 py-1 bg-white border border-[#E9ECEF] rounded-full text-xs font-medium text-gray-400">Thức ăn</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRODUCTS.map((product) => (
              <motion.div
                key={product.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-blue-600">
                    {product.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                  <p className="text-blue-600 font-bold text-xl mb-4">{formatPrice(product.price)}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm vào giỏ
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Right Side: Shopping Cart (40%) */}
        <section className="w-[40%] bg-white flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
          <div className="p-6 border-b border-[#E9ECEF]">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Đơn hàng hiện tại
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3"
                >
                  <div className="bg-gray-50 p-6 rounded-full">
                    <ShoppingCart className="w-12 h-12 opacity-20" />
                  </div>
                  <p className="font-medium">Chưa có món nào trong giỏ</p>
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-4 p-4 bg-[#F8F9FA] rounded-2xl border border-[#E9ECEF]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-blue-600 font-bold text-sm">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-[#E9ECEF] rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 bg-[#F8F9FA] border-t border-[#E9ECEF] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Tạm tính</span>
              <span className="font-bold">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Tổng tiền</span>
              <span className="font-black text-blue-600 text-2xl">{formatPrice(total)}</span>
            </div>
            <button
              disabled={cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
            >
              <CreditCard className="w-6 h-6" />
              Thanh toán ngay
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
