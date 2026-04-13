/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Coffee, Utensils, Zap, Loader2, AlertCircle, LayoutDashboard, BarChart3, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';

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

interface Order {
  id: number;
  created_at: string;
  total_price: number;
  items: any;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'pos' | 'reports'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Product')
          .select('*');

        if (error) throw error;
        setProducts(data || []);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Không thể tải danh sách sản phẩm');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchOrders();
    }
  }, [activeTab]);

  async function fetchOrders() {
    try {
      setReportsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setReportsLoading(false);
    }
  }

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

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0);
  }, [orders]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);
      
      const orderData = {
        total_price: total,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const { error: checkoutError } = await supabase
        .from('orders')
        .insert([orderData]);

      if (checkoutError) throw checkoutError;

      alert('Thanh toán thành công! Đơn hàng đã được lưu.');
      setCart([]);
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Lỗi thanh toán: ' + (err.message || 'Không thể lưu đơn hàng'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E9ECEF] px-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Zap className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">POS Pro</span>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('pos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'pos' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Bán hàng
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'reports' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Báo cáo
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 font-medium hidden md:block">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === 'pos' ? (
          <motion.main
            key="pos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex h-[calc(100vh-64px)]"
          >
            {/* Left Side: Product List (60%) */}
            <section className="w-[60%] p-6 overflow-y-auto border-r border-[#E9ECEF]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Utensils className="w-6 h-6 text-blue-600" />
                  Danh sách Sản phẩm
                </h2>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white border border-[#E9ECEF] rounded-full text-xs font-medium text-gray-600">Tất cả</span>
                </div>
              </div>

              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="font-medium">Đang tải sản phẩm...</p>
                </div>
              ) : error ? (
                <div className="h-64 flex flex-col items-center justify-center text-red-500 gap-3 bg-red-50 rounded-2xl border border-red-100 p-6">
                  <AlertCircle className="w-10 h-10" />
                  <p className="font-bold text-lg">Lỗi tải dữ liệu</p>
                  <p className="text-sm text-center max-w-xs">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm"
                  >
                    Thử lại
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Utensils className="w-10 h-10 opacity-20" />
                  <p className="font-medium">Không tìm thấy sản phẩm nào trong bảng 'Product'</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-2xl border border-[#E9ECEF] overflow-hidden shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="h-40 overflow-hidden relative">
                        <img
                          src={product.image || 'https://picsum.photos/seed/placeholder/400/300'}
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
              )}
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
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                  {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
                </button>
              </div>
            </section>
          </motion.main>
        ) : (
          <motion.main
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto p-6 space-y-8"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Báo cáo doanh thu</h2>
                <p className="text-gray-500 font-medium">Theo dõi hiệu quả kinh doanh của bạn</p>
              </div>
              <button 
                onClick={fetchOrders}
                className="px-4 py-2 bg-white border border-[#E9ECEF] rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Làm mới
              </button>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-blue-100 font-medium mb-1">Tổng doanh thu</p>
                  <h3 className="text-4xl font-black">{formatPrice(totalRevenue)}</h3>
                </div>
                <DollarSign className="absolute -right-4 -bottom-4 w-32 h-32 text-blue-500 opacity-20" />
              </div>
              
              <div className="bg-white rounded-3xl p-8 border border-[#E9ECEF] shadow-sm">
                <p className="text-gray-500 font-medium mb-1">Tổng đơn hàng</p>
                <h3 className="text-4xl font-black">{orders.length}</h3>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-[#E9ECEF] shadow-sm">
                <p className="text-gray-500 font-medium mb-1">Đơn hàng trung bình</p>
                <h3 className="text-4xl font-black">
                  {orders.length > 0 ? formatPrice(totalRevenue / orders.length) : '0đ'}
                </h3>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-[#E9ECEF] overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-[#E9ECEF] bg-gray-50/50">
                <h4 className="font-bold">Lịch sử đơn hàng</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E9ECEF] bg-gray-50/30">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mã đơn</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Thời gian mua</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Số món</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {reportsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Đang tải dữ liệu...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          Chưa có đơn hàng nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">#{order.id.toString().slice(-6)}</td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {new Date(order.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {Array.isArray(order.items) ? order.items.length : 0} món
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-right text-blue-600">
                            {formatPrice(order.total_price)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
