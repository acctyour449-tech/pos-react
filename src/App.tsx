import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Coffee, Utensils, Zap, 
  Loader2, AlertCircle, LayoutDashboard, BarChart3, Clock, DollarSign, 
  LogIn, UserPlus, LogOut, Mail, Lock, Store, User, PackagePlus, 
  ShoppingBag, Search, Filter, ChevronRight, Star, Tag, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  seller_id: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: number;
  created_at: string;
  total_price: number;
  items: any;
  seller_id: string;
}

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { role }
          }
        });
        if (error) throw error;
        alert('Đăng ký thành công! Một email xác nhận đã được gửi đến hộp thư của bạn. Vui lòng kiểm tra và xác nhận trước khi đăng nhập.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E9ECEF] p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
            <Zap className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Marketplace Pro</h1>
          <p className="text-gray-500 font-medium">{isLogin ? 'Chào mừng bạn quay trở lại' : 'Tạo tài khoản mới'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Bạn là ai?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    role === 'buyer' 
                      ? 'border-blue-600 bg-blue-50 text-blue-600' 
                      : 'border-[#E9ECEF] bg-[#F8F9FA] text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <User className="w-6 h-6" />
                  <span className="text-xs font-bold">Người mua</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('seller')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    role === 'seller' 
                      ? 'border-blue-600 bg-blue-50 text-blue-600' 
                      : 'border-[#E9ECEF] bg-[#F8F9FA] text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <Store className="w-6 h-6" />
                  <span className="text-xs font-bold">Người bán</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isLogin ? (
              <LogIn className="w-5 h-5" />
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            {isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-[#E9ECEF]"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hoặc</span>
          <div className="flex-1 h-px bg-[#E9ECEF]"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-6 bg-white border-2 border-[#E9ECEF] hover:border-gray-300 text-gray-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Tiếp tục với Google
        </button>

        <div className="mt-8 pt-6 border-t border-[#E9ECEF] text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RoleSelection({ onSelect }: { onSelect: (role: 'seller' | 'buyer') => void }) {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (selectedRole: 'seller' | 'buyer') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });
      if (error) throw error;
      onSelect(selectedRole);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl border border-[#E9ECEF] p-12 text-center"
      >
        <div className="bg-blue-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-600/20">
          <User className="text-white w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">Chào mừng bạn!</h1>
        <p className="text-gray-500 text-lg font-medium mb-12">Hãy chọn vai trò của bạn để bắt đầu trải nghiệm Marketplace</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            disabled={loading}
            onClick={() => handleSelect('buyer')}
            className="group relative bg-[#F8F9FA] border-2 border-[#E9ECEF] hover:border-blue-600 rounded-[2.5rem] p-10 transition-all hover:shadow-xl hover:shadow-blue-600/5 text-left active:scale-[0.98]"
          >
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">Tôi là Người mua</h3>
            <p className="text-gray-500 font-medium">Khám phá hàng ngàn sản phẩm từ các người bán uy tín.</p>
            <ChevronRight className="absolute right-8 bottom-8 w-6 h-6 text-gray-300 group-hover:text-blue-600 transition-colors" />
          </button>

          <button
            disabled={loading}
            onClick={() => handleSelect('seller')}
            className="group relative bg-[#F8F9FA] border-2 border-[#E9ECEF] hover:border-blue-600 rounded-[2.5rem] p-10 transition-all hover:shadow-xl hover:shadow-blue-600/5 text-left active:scale-[0.98]"
          >
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">Tôi là Người bán</h3>
            <p className="text-gray-500 font-medium">Bắt đầu kinh doanh và tiếp cận hàng triệu khách hàng.</p>
            <ChevronRight className="absolute right-8 bottom-8 w-6 h-6 text-gray-300 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
        
        {loading && (
          <div className="mt-8 flex items-center justify-center gap-2 text-blue-600 font-bold">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang thiết lập tài khoản...
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seller specific state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Thực phẩm' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const role = useMemo(() => {
    if (!session?.user) return null;
    return session.user.user_metadata?.role as 'seller' | 'buyer' | undefined;
  }, [session]);

  useEffect(() => {
    // Set default tab based on role
    if (role === 'seller') setActiveTab('my-products');
    else if (role === 'buyer') setActiveTab('marketplace');
  }, [role]);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    fetchProducts();
  }, [session, activeTab]);

  useEffect(() => {
    if (activeTab === 'my-orders' && role === 'seller') {
      fetchOrders();
    }
  }, [activeTab, role]);

  async function fetchProducts() {
    try {
      setLoading(true);
      let query = supabase.from('products').select('*');
      
      if (role === 'seller' && activeTab === 'my-products') {
        query = query.eq('seller_id', session?.user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      setReportsLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', session?.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
    } finally {
      setReportsLoading(false);
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user.id) return;
    if (!editingProduct && !selectedFile) {
      alert('Vui lòng chọn ảnh hoặc video sản phẩm');
      return;
    }

    try {
      setLoading(true);
      
      let imageUrl = editingProduct?.image || '';

      // 1. Upload file if selected
      if (selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      // 2. Insert or Update product
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: newProduct.name,
            price: Number(newProduct.price),
            category: newProduct.category,
            image: imageUrl
          })
          .eq('id', editingProduct.id)
          .eq('seller_id', session.user.id); // Security check

        if (error) throw error;
        alert('Cập nhật sản phẩm thành công!');
      } else {
        const { error } = await supabase.from('products').insert([{
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          image: imageUrl,
          seller_id: session.user.id
        }]);

        if (error) throw error;
        alert('Thêm sản phẩm thành công!');
      }
      
      setShowAddProduct(false);
      setEditingProduct(null);
      setNewProduct({ name: '', price: '', category: 'Thực phẩm' });
      setSelectedFile(null);
      fetchProducts();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('seller_id', session?.user.id); // Security check

      if (error) throw error;
      alert('Đã xóa sản phẩm');
      fetchProducts();
    } catch (err: any) {
      alert('Lỗi xóa sản phẩm: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      category: product.category
    });
    setShowAddProduct(true);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      // Check if trying to add from a different seller
      if (prev.length > 0 && prev[0].seller_id !== product.seller_id) {
        if (confirm('Giỏ hàng hiện tại chứa sản phẩm của người bán khác. Bạn có muốn làm trống giỏ hàng để thêm sản phẩm này không?')) {
          return [{ ...product, quantity: 1 }];
        }
        return prev;
      }

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

  const isVideo = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().split('?')[0].endsWith(ext));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);
      
      const orderData = {
        total_price: total,
        seller_id: cart[0].seller_id,
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

      alert('Gửi đơn hàng thành công!');
      setCart([]);
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Lỗi đặt hàng: ' + (err.message || 'Không thể lưu đơn hàng'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  if (!role) {
    return <RoleSelection onSelect={(selectedRole) => {
      // Refresh session to get updated metadata
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A]">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#E9ECEF] px-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-20">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
                <ShoppingBag className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight">Marketplace</span>
            </div>
            
            <div className="hidden md:flex gap-2">
              {role === 'seller' ? (
                <>
                  <button
                    onClick={() => setActiveTab('my-products')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === 'my-products' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Sản phẩm của tôi
                  </button>
                  <button
                    onClick={() => setActiveTab('my-orders')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === 'my-orders' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Đơn hàng của tôi
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === 'marketplace' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Chợ chung
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-0.5">
                {role === 'seller' ? 'Người bán' : 'Người mua'}
              </p>
              <p className="text-sm font-bold text-gray-900">{session.user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === 'my-products' ? (
          <motion.main
            key="my-products"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto p-6 space-y-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Cửa hàng của bạn</h2>
                <p className="text-gray-500 font-medium">Quản lý các sản phẩm bạn đang kinh doanh</p>
              </div>
              <button 
                onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                <PackagePlus className="w-5 h-5" />
                Thêm sản phẩm mới
              </button>
            </div>

            {/* Product Grid for Seller */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="font-medium">Đang tải sản phẩm của bạn...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="col-span-full h-96 flex flex-col items-center justify-center text-gray-400 gap-4 bg-white rounded-[2rem] border-2 border-dashed border-[#E9ECEF]">
                  <div className="bg-gray-50 p-8 rounded-full">
                    <Store className="w-16 h-16 opacity-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">Chưa có sản phẩm nào</p>
                    <p className="font-medium">Hãy bắt đầu bằng việc thêm sản phẩm đầu tiên của bạn</p>
                  </div>
                  <button 
                    onClick={() => setShowAddProduct(true)}
                    className="mt-4 text-blue-600 font-bold hover:underline"
                  >
                    Thêm ngay
                  </button>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="bg-white rounded-3xl border border-[#E9ECEF] overflow-hidden shadow-sm group">
                    <div className="h-48 overflow-hidden relative">
                      {isVideo(product.image) ? (
                        <video 
                          src={product.image} 
                          controls 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={product.image || 'https://picsum.photos/seed/placeholder/400/300'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-wider">
                        {product.category}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-1 truncate">{product.name}</h3>
                      <div className="flex justify-between items-center">
                        <p className="text-blue-600 font-black text-xl">{formatPrice(product.price)}</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Product Modal */}
            <AnimatePresence>
              {showAddProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAddProduct(false)}
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10"
                  >
                    <h3 className="text-2xl font-black mb-6">{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                    <form onSubmit={handleAddProduct} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Tên sản phẩm</label>
                        <input
                          type="text"
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                          placeholder="Ví dụ: Cà phê sữa đá"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Giá bán (VND)</label>
                          <input
                            type="number"
                            required
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                            className="w-full bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
                            placeholder="35000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Danh mục</label>
                          <select
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                            className="w-full bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium appearance-none"
                          >
                            <option>Thực phẩm</option>
                            <option>Đồ uống</option>
                            <option>Thời trang</option>
                            <option>Điện tử</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                          {editingProduct ? 'Thay đổi ảnh/video (Để trống nếu giữ cũ)' : 'Ảnh hoặc Video sản phẩm'}
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            required={!editingProduct}
                            accept="image/*,video/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                          />
                        </div>
                        {selectedFile && (
                          <p className="text-[10px] font-bold text-blue-600 mt-1">
                            Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                        {editingProduct && !selectedFile && (
                          <p className="text-[10px] font-bold text-gray-400 mt-1">
                            Đang sử dụng: {editingProduct.image.split('/').pop()?.slice(-20)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddProduct(false);
                            setEditingProduct(null);
                            setNewProduct({ name: '', price: '', category: 'Thực phẩm' });
                            setSelectedFile(null);
                          }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                          {editingProduct ? 'Cập nhật' : 'Lưu sản phẩm'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.main>
        ) : activeTab === 'my-orders' ? (
          <motion.main
            key="my-orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto p-6 space-y-8"
          >
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Đơn hàng của tôi</h2>
                <p className="text-gray-500 font-medium">Theo dõi doanh thu và các đơn hàng mới nhất</p>
              </div>
              <button 
                onClick={fetchOrders}
                className="px-5 py-2.5 bg-white border border-[#E9ECEF] rounded-2xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Clock className="w-4 h-4" />
                Làm mới dữ liệu
              </button>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-2">Tổng doanh thu</p>
                  <h3 className="text-5xl font-black">{formatPrice(totalRevenue)}</h3>
                </div>
                <DollarSign className="absolute -right-6 -bottom-6 w-40 h-40 text-blue-500 opacity-20" />
              </div>
              
              <div className="bg-white rounded-[2.5rem] p-10 border border-[#E9ECEF] shadow-sm flex flex-col justify-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Đơn hàng đã nhận</p>
                <h3 className="text-5xl font-black text-gray-900">{orders.length}</h3>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-[#E9ECEF] shadow-sm flex flex-col justify-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Giá trị trung bình</p>
                <h3 className="text-5xl font-black text-gray-900">
                  {orders.length > 0 ? formatPrice(totalRevenue / orders.length) : '0đ'}
                </h3>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2.5rem] border border-[#E9ECEF] overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-[#E9ECEF] bg-gray-50/30 flex justify-between items-center">
                <h4 className="font-black text-lg">Lịch sử giao dịch</h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">Hoàn thành</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E9ECEF] bg-gray-50/10">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Mã đơn hàng</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Thời gian</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Chi tiết món</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {reportsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                          <p className="font-bold">Đang tải dữ liệu báo cáo...</p>
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center text-gray-400">
                          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 opacity-20" />
                          </div>
                          <p className="font-bold text-gray-900">Chưa có đơn hàng nào</p>
                          <p className="text-sm">Các đơn hàng khách đặt sẽ xuất hiện tại đây</p>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">#{order.id.toString().slice(-8)}</span>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString('vi-VN')}</p>
                            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString('vi-VN')}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                                <span key={idx} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">
                                  {item.name} x{item.quantity}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-black text-right text-blue-600">
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
        ) : (
          <motion.main
            key="marketplace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex h-[calc(100vh-80px)]"
          >
            {/* Left Side: Marketplace Feed (65%) */}
            <section className="w-[65%] p-8 overflow-y-auto border-r border-[#E9ECEF]">
              <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight mb-2">Khám phá Chợ chung</h2>
                      <p className="text-gray-500 font-medium">Tìm kiếm những sản phẩm tốt nhất từ cộng đồng người bán</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="p-3 bg-white border border-[#E9ECEF] rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
                        <Filter className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm sản phẩm, người bán..."
                      className="w-full bg-white border border-[#E9ECEF] rounded-[2rem] py-5 pl-14 pr-6 focus:outline-none focus:ring-4 focus:ring-blue-600/5 transition-all font-medium shadow-sm"
                    />
                  </div>
                </div>

                {/* Categories Scroll */}
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {['Tất cả', 'Thực phẩm', 'Đồ uống', 'Thời trang', 'Điện tử', 'Gia dụng'].map((cat) => (
                    <button 
                      key={cat}
                      className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                        cat === 'Tất cả' ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-white border border-[#E9ECEF] text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="font-bold">Đang tìm kiếm sản phẩm...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4 bg-white rounded-[3rem] border border-[#E9ECEF]">
                    <Search className="w-16 h-16 opacity-10" />
                    <p className="text-xl font-bold text-gray-900">Không tìm thấy sản phẩm nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {products.map((product) => (
                      <motion.div
                        key={product.id}
                        whileHover={{ y: -8 }}
                        className="bg-white rounded-[2.5rem] border border-[#E9ECEF] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-blue-600/5 transition-all group"
                      >
                        <div className="h-64 overflow-hidden relative">
                          {isVideo(product.image) ? (
                            <video 
                              src={product.image} 
                              controls 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={product.image || 'https://picsum.photos/seed/placeholder/400/300'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                            {product.category}
                          </div>
                          <button className="absolute top-5 right-5 p-3 bg-white/90 backdrop-blur-sm rounded-2xl text-gray-400 hover:text-red-500 transition-colors">
                            <Star className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-8">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-black text-2xl mb-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                              <div className="flex items-center gap-2 text-gray-400">
                                <Store className="w-3 h-3" />
                                <span className="text-xs font-bold uppercase tracking-wider">Seller ID: {product.seller_id.slice(0, 8)}...</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-blue-600 font-black text-2xl">{formatPrice(product.price)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="w-full bg-gray-900 hover:bg-blue-600 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-gray-900/10 hover:shadow-blue-600/20"
                          >
                            <Plus className="w-6 h-6" />
                            Thêm vào giỏ hàng
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Right Side: Modern Cart (35%) */}
            <section className="w-[35%] bg-white flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
              <div className="p-8 border-b border-[#E9ECEF] flex justify-between items-center">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                  Giỏ hàng
                </h2>
                {cart.length > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                    {cart.length} MÓN
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <AnimatePresence mode="popLayout">
                  {cart.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4"
                    >
                      <div className="bg-gray-50 p-10 rounded-[2.5rem]">
                        <ShoppingBag className="w-16 h-16 opacity-10" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">Giỏ hàng trống</p>
                        <p className="text-sm font-medium">Hãy chọn những món đồ bạn yêu thích</p>
                      </div>
                    </motion.div>
                  ) : (
                    cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-5 p-5 bg-[#F8F9FA] rounded-[2rem] border border-[#E9ECEF] relative group"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-2xl object-cover shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-base truncate">{item.name}</h4>
                          <p className="text-blue-600 font-black text-sm mb-2">{formatPrice(item.price)}</p>
                          <div className="flex items-center gap-4 bg-white border border-[#E9ECEF] rounded-xl p-1 w-fit shadow-sm">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-black text-sm min-w-[20px] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-white rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="p-8 bg-[#F8F9FA] border-t border-[#E9ECEF] space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                    <span>Tạm tính</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400 font-bold text-xs uppercase tracking-widest">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-500">Miễn phí</span>
                  </div>
                  <div className="pt-3 border-t border-[#E9ECEF] flex justify-between items-center">
                    <span className="font-black text-lg">Tổng cộng</span>
                    <span className="font-black text-blue-600 text-3xl">{formatPrice(total)}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <ChevronRight className="w-6 h-6" />
                  )}
                  {loading ? 'Đang xử lý...' : 'Gửi đơn hàng ngay'}
                </button>
                
                <p className="text-[10px] text-center text-gray-400 font-medium">
                  Bằng cách nhấn nút, bạn đồng ý với các điều khoản của Marketplace
                </p>
              </div>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
