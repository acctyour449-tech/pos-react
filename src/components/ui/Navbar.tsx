import {
  Zap, ShoppingCart, Bell, User, LogOut, EyeOff,
  LayoutDashboard, BarChart3, Home, Package, Heart,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface NavbarProps {
  role: 'seller' | 'buyer';
  email: string | undefined;
  activeTab: string;
  cartCount: number;
  unreadCount: number;
  dislikedCount: number;
  wishlistCount: number;
  onTabChange: (tab: string) => void;
  onCartOpen: () => void;
  onNotificationsOpen: () => void;
  onHiddenOpen: () => void;
}

export function Navbar({
  role, email, activeTab, cartCount, unreadCount, dislikedCount, wishlistCount,
  onTabChange, onCartOpen, onNotificationsOpen, onHiddenOpen,
}: NavbarProps) {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-5">
        {/* Logo + tabs */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onTabChange(role === 'seller' ? 'my-products' : 'marketplace')}
          >
            <div className="bg-blue-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-black tracking-tight hidden sm:block">Marketplace</span>
            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md hidden sm:block ${
              role === 'seller' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {role === 'seller' ? 'Seller' : 'Buyer'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {role === 'seller' ? (
              <>
                {[
                  { id: 'my-products', icon: LayoutDashboard, label: 'Sản phẩm' },
                  { id: 'my-orders', icon: BarChart3, label: 'Đơn hàng' },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id} onClick={() => onTabChange(id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeTab === id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </>
            ) : (
              <>
                {[
                  { id: 'marketplace', icon: Home, label: 'Mua sắm', badge: 0 },
                  { id: 'my-purchases', icon: Package, label: 'Đơn của tôi', badge: 0 },
                  { id: 'wishlist-tab', icon: Heart, label: 'Yêu thích', badge: wishlistCount },
                ].map(({ id, icon: Icon, label, badge }) => (
                  <button
                    key={id} onClick={() => onTabChange(id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeTab === id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />{label}
                    {badge > 0 && (
                      <span className={`ml-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        activeTab === id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                      }`}>{badge}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {role === 'buyer' && dislikedCount > 0 && (
            <button
              onClick={onHiddenOpen}
              className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              title="Sản phẩm đã ẩn"
            >
              <EyeOff className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 bg-gray-700 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {dislikedCount}
              </span>
            </button>
          )}

          {role === 'buyer' && (
            <button onClick={onCartOpen} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </motion.span>
              )}
            </button>
          )}

          <button onClick={onNotificationsOpen} className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-gray-600 max-w-[110px] truncate">{email}</span>
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─────────── MOBILE BOTTOM NAV ───────────
interface MobileNavProps {
  role: 'seller' | 'buyer';
  activeTab: string;
  cartCount: number;
  unreadCount: number;
  onTabChange: (tab: string) => void;
  onCartOpen: () => void;
  onNotificationsOpen: () => void;
  onAddProduct: () => void;
}

export function MobileNav({
  role, activeTab, cartCount, unreadCount,
  onTabChange, onCartOpen, onNotificationsOpen, onAddProduct,
}: MobileNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/60 z-20 md:hidden">
      <div className="flex items-center justify-around py-2 px-2">
        {role === 'buyer' ? (
          <>
            {[
              { id: 'marketplace', icon: Home, label: 'Mua sắm' },
              { id: 'my-purchases', icon: Package, label: 'Đơn hàng' },
              { id: 'wishlist-tab', icon: Heart, label: 'Yêu thích' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id} onClick={() => onTabChange(id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  activeTab === id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold">{label}</span>
              </button>
            ))}
            <button onClick={onCartOpen} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-blue-600 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
              <span className="text-[9px] font-bold">Giỏ</span>
            </button>
            <button onClick={onNotificationsOpen} className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-gray-400 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="text-[9px] font-bold">Thông báo</span>
            </button>
          </>
        ) : (
          <>
            {[
              { id: 'my-products', icon: LayoutDashboard, label: 'Sản phẩm' },
              { id: 'my-orders', icon: BarChart3, label: 'Đơn hàng' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id} onClick={() => onTabChange(id)}
                className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-all ${
                  activeTab === id ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold">{label}</span>
              </button>
            ))}
            <button
              onClick={onAddProduct}
              className="flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl text-gray-400"
            >
              <Package className="w-5 h-5" />
              <span className="text-[9px] font-bold">Thêm SP</span>
            </button>
            <button onClick={onNotificationsOpen} className="flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl text-gray-400 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-3 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
              <span className="text-[9px] font-bold">Thông báo</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
