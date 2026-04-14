import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Session } from '@supabase/supabase-js';

import { supabase } from './lib/supabase';

// Types
import type { Product, Order } from './types';

// Hooks
import { useToast } from './hooks/useToast';
import { useCart } from './hooks/useCart';
import { useWishlist } from './hooks/useWishlist';
import { useNotifications } from './hooks/useNotifications';

// UI
import { ToastContainer } from './components/ui';
import { Navbar, MobileNav } from './components/ui/Navbar';

// Auth
import { AuthForm, RoleSelection } from './components/auth';

// Product
import { DislikeModal, ProductDetailModal } from './components/product';

// Notification
import { NotificationPanel, HiddenProductsPanel } from './components/notification';

// Cart
import { CartSidebar } from './components/cart';

// Views
import { SellerProducts } from './views/SellerProducts';
import { SellerOrders } from './views/SellerOrders';
import { Marketplace } from './views/Marketplace';
import { BuyerOrders, Wishlist } from './views/BuyerViews';

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirm';

export default function App() {
  // ── Auth ──
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Data ──
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Navigation ──
  const [activeTab, setActiveTab] = useState('');

  // ── UI state ──
  const [showCart, setShowCart] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [pendingDislike, setPendingDislike] = useState<Product | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [shippingAddr, setShippingAddr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank' | 'momo'>('cod');
  const [orderNote, setOrderNote] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // ── Hooks ──
  const { toasts, showToast } = useToast();
  const {
    cart, cartTotal, discountAmt, finalTotal,
    couponCode, setCouponCode, couponDiscount,
    addToCart, updateQty, removeFromCart, clearCart,
    applyCoupon, removeCoupon,
  } = useCart(showToast);

  const role = useMemo(
    () => session?.user?.user_metadata?.role as 'seller' | 'buyer' | undefined,
    [session]
  );

  const {
    wishlist, disliked,
    toggleWishlist, addDisliked, restoreProduct, restoreAll,
  } = useWishlist(session?.user?.id, showToast);

  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(session?.user?.id, showToast);

  // ── Derived ──
  const wishlistProducts = useMemo(
    () => allProducts.filter(p => wishlist.includes(p.id)),
    [allProducts, wishlist]
  );

  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => s + (Number(o.total_price) || 0), 0),
    [orders]
  );

  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return orders
      .filter(o => new Date(o.created_at).toDateString() === today)
      .reduce((s, o) => s + Number(o.total_price), 0);
  }, [orders]);

  // ── Auth init ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // ── Default tab ──
  useEffect(() => {
    if (role === 'seller') setActiveTab('my-products');
    else if (role === 'buyer') setActiveTab('marketplace');
  }, [role]);

  // ── Fetch triggers ──
  useEffect(() => { if (session) fetchAllProducts(); }, [session]);

  useEffect(() => {
    if (session && role === 'seller' && activeTab === 'my-products') fetchMyProducts();
  }, [session, role, activeTab]);

  useEffect(() => {
    if (activeTab === 'my-orders' && role === 'seller') fetchOrders();
  }, [activeTab, role]);

  useEffect(() => {
    if (activeTab === 'my-purchases' && role === 'buyer') fetchBuyerOrders();
  }, [activeTab, role]);

  // ── Data fetchers ──
  async function fetchAllProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAllProducts(data || []);
    } catch (err: any) {
      showToast('Lỗi tải sản phẩm: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMyProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', session!.user.id)
      .order('created_at', { ascending: false });
    setMyProducts(data || []);
  }

  async function fetchOrders() {
    setOrdersLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', session!.user.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setOrdersLoading(false);
  }

  async function fetchBuyerOrders() {
    setOrdersLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', session!.user.id)
      .order('created_at', { ascending: false });
    setBuyerOrders(data || []);
    setOrdersLoading(false);
  }

  // ── Dislike handlers ──
  const handleDislikeRequest = useCallback((productId: number) => {
    if (disliked.includes(productId)) {
      restoreProduct(productId);
      return;
    }
    const product = allProducts.find(p => p.id === productId);
    if (product) setPendingDislike(product);
  }, [disliked, allProducts, restoreProduct]);

  const confirmDislike = useCallback(() => {
    if (!pendingDislike) return;
    addDisliked(pendingDislike.id);
    setPendingDislike(null);
    if (viewProduct?.id === pendingDislike.id) setViewProduct(null);
  }, [pendingDislike, addDisliked, viewProduct]);

  // ── Wishlist toggle ──
  const handleWishlist = useCallback((id: number) => {
    toggleWishlist(id, disliked.includes(id));
  }, [toggleWishlist, disliked]);

  // ── Order status update ──
  const updateOrderStatus = async (order: Order, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)
        .eq('seller_id', session!.user.id);
      if (error) throw error;

      const msgMap: Record<string, string> = {
        'Đã xác nhận': `✅ Đơn hàng #${String(order.id).slice(-6)} đã được xác nhận!`,
        'Đang giao':   `🚚 Đơn hàng #${String(order.id).slice(-6)} đang trên đường giao đến bạn!`,
        'Hoàn thành':  `🎉 Đơn hàng #${String(order.id).slice(-6)} hoàn thành. Cảm ơn bạn!`,
      };
      const typeMap: Record<string, any> = {
        'Đã xác nhận': 'order_confirmed',
        'Đang giao': 'order_shipped',
        'Hoàn thành': 'order_completed',
      };
      if (msgMap[newStatus] && order.buyer_id) {
        await supabase.from('notifications').insert([{
          user_id: order.buyer_id, order_id: order.id,
          message: msgMap[newStatus], type: typeMap[newStatus], is_read: false,
        }]);
      }

      showToast(`✓ Đã cập nhật: ${newStatus}`);
      fetchOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!confirm('Xác nhận từ chối / huỷ đơn hàng này?')) return;
    const { error } = await supabase.from('orders').update({ status: 'Đã hủy' }).eq('id', order.id);
    if (error) { showToast(error.message, 'error'); return; }
    if (order.buyer_id) {
      await supabase.from('notifications').insert([{
        user_id: order.buyer_id, order_id: order.id,
        message: `❌ Đơn hàng #${String(order.id).slice(-6)} đã bị huỷ.`,
        type: 'system', is_read: false,
      }]);
    }
    showToast('Đã huỷ đơn hàng', 'info');
    fetchOrders();
  };

  // ── Checkout ──
  const handleCheckout = async () => {
    if (!cart.length || !session?.user?.id) return;
    if (!shippingAddr.trim()) {
      showToast('Vui lòng nhập địa chỉ giao hàng', 'error');
      setCheckoutStep('address');
      return;
    }
    try {
      setSubmittingOrder(true);
      const orderData = {
        total_price: finalTotal,
        subtotal: cartTotal,
        discount_amount: discountAmt,
        shipping_fee: 0,
        seller_id: cart[0].seller_id,
        buyer_id: session.user.id,
        buyer_email: session.user.email,
        status: 'Chờ xác nhận',
        shipping_address: shippingAddr.trim(),
        payment_method: paymentMethod,
        note: orderNote.trim() || null,
        items: cart.map(i => ({
          id: i.id, name: i.name, price: i.price,
          quantity: i.quantity, image: i.image, note: i.note || null,
        })),
      };

      const { data: order, error } = await supabase.from('orders').insert([orderData]).select().single();
      if (error) throw error;

      await supabase.from('notifications').insert([{
        user_id: cart[0].seller_id,
        order_id: order.id,
        message: `🛍️ Đơn hàng mới #${String(order.id).slice(-6)} — ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalTotal)}`,
        type: 'new_order',
        is_read: false,
      }]);

      clearCart();
      setShowCart(false);
      setCheckoutStep('cart');
      setShippingAddr('');
      setOrderNote('');
      setPaymentMethod('cod');
      showToast('🎉 Đặt hàng thành công! Đang chờ xác nhận...', 'success');
      setTimeout(() => setActiveTab('my-purchases'), 1500);
    } catch (err: any) {
      showToast('Lỗi đặt hàng: ' + err.message, 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // ── Guards ──
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center">
        <div>
          <h1 className="text-2xl font-black text-red-900">Thiếu cấu hình Supabase</h1>
          <p className="text-red-600 mt-2 text-sm">Kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY</p>
        </div>
      </div>
    );
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/30 animate-pulse">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
      </div>
    </div>
  );

  if (!session) return <AuthForm />;

  if (!role) return (
    <RoleSelection onSelect={() =>
      supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    } />
  );

  // ══════════════════════════ RENDER ══════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">

      {/* Toasts */}
      <ToastContainer toasts={toasts} />

      {/* Panels & Modals */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationPanel
            notifications={notifications}
            onClose={() => setShowNotifications(false)}
            onMarkRead={markRead}
            onMarkAllRead={() => markAllRead(session!.user.id)}
          />
        )}
        {showHiddenPanel && (
          <HiddenProductsPanel
            hiddenIds={disliked}
            allProducts={allProducts}
            onRestore={restoreProduct}
            onClose={() => setShowHiddenPanel(false)}
          />
        )}
        {pendingDislike && (
          <DislikeModal
            product={pendingDislike}
            onConfirm={confirmDislike}
            onCancel={() => setPendingDislike(null)}
          />
        )}
        {viewProduct && (
          <ProductDetailModal
            product={viewProduct}
            onClose={() => setViewProduct(null)}
            onAddToCart={(p, qty, note) => addToCart(p, qty, note)}
            wishlisted={wishlist.includes(viewProduct.id)}
            onWishlist={handleWishlist}
            disliked={disliked.includes(viewProduct.id)}
            onDislike={handleDislikeRequest}
          />
        )}
        {showCart && (
          <CartSidebar
            cart={cart}
            cartTotal={cartTotal}
            discountAmt={discountAmt}
            finalTotal={finalTotal}
            couponCode={couponCode}
            couponDiscount={couponDiscount}
            checkoutStep={checkoutStep}
            shippingAddr={shippingAddr}
            paymentMethod={paymentMethod}
            orderNote={orderNote}
            submittingOrder={submittingOrder}
            onClose={() => setShowCart(false)}
            onSetCheckoutStep={setCheckoutStep}
            onUpdateQty={updateQty}
            onRemoveFromCart={removeFromCart}
            onSetCouponCode={setCouponCode}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            onSetShippingAddr={setShippingAddr}
            onSetPaymentMethod={setPaymentMethod}
            onSetOrderNote={setOrderNote}
            onCheckout={handleCheckout}
            showToast={showToast}
            onGoToMarketplace={() => { setShowCart(false); setActiveTab('marketplace'); }}
          />
        )}
      </AnimatePresence>

      {/* Navbar */}
      <Navbar
        role={role}
        email={session?.user?.email}
        activeTab={activeTab}
        cartCount={cart.length}
        unreadCount={unreadCount}
        dislikedCount={disliked.length}
        wishlistCount={wishlist.length}
        onTabChange={setActiveTab}
        onCartOpen={() => { setShowCart(true); setCheckoutStep('cart'); }}
        onNotificationsOpen={() => setShowNotifications(true)}
        onHiddenOpen={() => setShowHiddenPanel(true)}
      />

      {/* Views */}
      <AnimatePresence mode="wait">

        {/* ── Seller: Products ── */}
        {activeTab === 'my-products' && (
          <motion.div key="my-products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SellerProducts
              products={myProducts}
              loading={loading}
              session={session}
              onProductsChanged={() => { fetchMyProducts(); fetchAllProducts(); }}
              showToast={showToast}
            />
          </motion.div>
        )}

        {/* ── Seller: Orders ── */}
        {activeTab === 'my-orders' && (
          <motion.div key="my-orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <SellerOrders
              orders={orders}
              loading={ordersLoading}
              totalRevenue={totalRevenue}
              todayRevenue={todayRevenue}
              onRefresh={fetchOrders}
              onUpdateStatus={updateOrderStatus}
              onCancelOrder={cancelOrder}
            />
          </motion.div>
        )}

        {/* ── Buyer: Marketplace ── */}
        {activeTab === 'marketplace' && (
          <motion.div key="marketplace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Marketplace
              allProducts={allProducts}
              disliked={disliked}
              wishlist={wishlist}
              loading={loading}
              onAddToCart={addToCart}
              onView={setViewProduct}
              onWishlist={handleWishlist}
              onDislike={handleDislikeRequest}
              onShowHidden={() => setShowHiddenPanel(true)}
            />
          </motion.div>
        )}

        {/* ── Buyer: My Purchases ── */}
        {activeTab === 'my-purchases' && (
          <motion.div key="my-purchases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <BuyerOrders
              orders={buyerOrders}
              loading={ordersLoading}
              onRefresh={fetchBuyerOrders}
              onGoMarketplace={() => setActiveTab('marketplace')}
            />
          </motion.div>
        )}

        {/* ── Buyer: Wishlist ── */}
        {activeTab === 'wishlist-tab' && (
          <motion.div key="wishlist-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Wishlist
              wishlistProducts={wishlistProducts}
              disliked={disliked}
              wishlist={wishlist}
              onAddToCart={addToCart}
              onView={setViewProduct}
              onWishlist={handleWishlist}
              onDislike={handleDislikeRequest}
              onShowHidden={() => setShowHiddenPanel(true)}
              onGoMarketplace={() => setActiveTab('marketplace')}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <MobileNav
        role={role}
        activeTab={activeTab}
        cartCount={cart.length}
        unreadCount={unreadCount}
        onTabChange={setActiveTab}
        onCartOpen={() => { setShowCart(true); setCheckoutStep('cart'); }}
        onNotificationsOpen={() => setShowNotifications(true)}
        onAddProduct={() => setActiveTab('my-products')}
      />

      {/* Bottom padding for mobile nav */}
      <div className="h-16 md:hidden" />
    </div>
  );
}
