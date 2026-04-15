import React, { useState } from 'react';
import { usePOSStore } from './store/posStore';
// Nạp Icon từ Web
import { 
  ShoppingCart, Trash2, Plus, Minus, Search, Receipt, Package 
} from 'https://esm.sh/lucide-react';

const App = () => {
  const { products, cart, addToCart, removeFromCart, updateQuantity, clearCart } = usePOSStore();
  const [searchTerm, setSearchTerm] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * 0.1); // 10% VAT
  const total = subtotal + tax;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    alert(`Thanh toán thành công!\nTổng cộng: ${total.toLocaleString()}đ`);
    clearCart();
  };

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
      
      {/* PHẦN TRÁI: DANH SÁCH SẢN PHẨM */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" /> Hệ thống POS
          </h1>
          <div className="relative w-1/3">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-2">
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-2 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all border border-transparent hover:border-blue-400 group"
            >
              <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-xl mb-3 group-hover:opacity-90" />
              <div className="px-2 pb-2">
                <h3 className="font-bold text-gray-700 truncate">{product.name}</h3>
                <p className="text-blue-600 font-black mt-1 text-lg">{product.price.toLocaleString()}đ</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PHẦN PHẢI: GIỎ HÀNG & THANH TOÁN */}
      <div className="w-[400px] bg-white shadow-2xl flex flex-col border-l border-gray-200">
        <div className="p-6 border-b flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart className="text-blue-600" size={24} /> Đơn hàng
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">{cart.length} món</span>
          </h2>
          <button onClick={clearCart} className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
              <ShoppingCart size={64} strokeWidth={1} />
              <p className="mt-4 font-medium">Chưa có món nào được chọn</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-sm">{item.name}</h4>
                  <p className="text-xs text-blue-600 font-semibold">{item.price.toLocaleString()}đ</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1 shadow-inner">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold text-gray-700">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"><Plus size={14} /></button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t space-y-3">
          <div className="flex justify-between text-gray-500 font-medium">
            <span>Tạm tính:</span>
            <span>{subtotal.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between text-gray-500 font-medium">
            <span>Thuế VAT (10%):</span>
            <span>{tax.toLocaleString()}đ</span>
          </div>
          <div className="flex justify-between text-2xl font-black text-gray-900 pt-3 border-t border-gray-200">
            <span>Tổng cộng:</span>
            <span className="text-blue-600 font-black">{total.toLocaleString()}đ</span>
          </div>
          <button 
            onClick={handleCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95"
          >
            <Receipt size={20} /> THANH TOÁN NGAY
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;