import React, { useState, useMemo } from 'react';

// --- ICON SVG (Để không phải tải thư viện ngoài) ---
const IconCart = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;

const App = () => {
  // 1. Dữ liệu sản phẩm
  const products = [
    { id: 1, name: 'Cà Phê Muối', price: 29000, image: 'https://picsum.photos/200?random=1' },
    { id: 2, name: 'Bánh Mì Thịt', price: 25000, image: 'https://picsum.photos/200?random=2' },
    { id: 3, name: 'Trà Thạch Vải', price: 35000, image: 'https://picsum.photos/200?random=3' },
    { id: 4, name: 'Bánh Sừng Bò', price: 45000, image: 'https://picsum.photos/200?random=4' },
    { id: 5, name: 'Bạc Xỉu', price: 29000, image: 'https://picsum.photos/200?random=5' },
    { id: 6, name: 'Trà Sữa', price: 40000, image: 'https://picsum.photos/200?random=6' },
  ];

  // 2. Quản lý trạng thái (State) bằng React thuần
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');

  // 3. Các hàm xử lý
  const addToCart = (product) => {
    setCart(prev => {
      const isExisted = prev.find(item => item.id === product.id);
      if (isExisted) {
        return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));

  // 4. Tính toán tiền nong
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen w-full bg-gray-100 font-sans overflow-hidden">
      
      {/* BÊN TRÁI: DANH SÁCH MÓN */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">POS SYSTEM</h1>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center text-gray-400"><IconSearch /></div>
            <input 
              type="text" 
              placeholder="Tìm món ăn..." 
              className="pl-10 pr-4 py-2 border rounded-lg w-64 outline-none focus:ring-2 focus:ring-blue-400"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
          {filteredProducts.map(p => (
            <div key={p.id} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl shadow-sm hover:shadow-md cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all">
              <img src={p.image} className="w-full h-32 object-cover rounded-lg mb-2" />
              <div className="font-bold text-gray-700 truncate">{p.name}</div>
              <div className="text-blue-600 font-bold">{p.price.toLocaleString()}đ</div>
            </div>
          ))}
        </div>
      </div>

      {/* BÊN PHẢI: GIỎ HÀNG */}
      <div className="w-96 bg-white border-l flex flex-col shadow-xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><IconCart /> Đơn hàng</h2>
          <button onClick={() => setCart([])} className="text-red-500 p-2 hover:bg-red-50 rounded"><IconTrash /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">Giỏ hàng trống</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-bold">{item.name}</div>
                  <div className="text-xs text-blue-500">{item.price.toLocaleString()}đ</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white border rounded shadow">-</button>
                  <span className="font-bold">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-white border rounded shadow">+</button>
                  <button onClick={() => removeItem(item.id)} className="ml-2 text-gray-300 hover:text-red-500">×</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-blue-50 space-y-2">
          <div className="flex justify-between text-sm"><span>Tạm tính:</span><span>{subtotal.toLocaleString()}đ</span></div>
          <div className="flex justify-between text-sm"><span>Thuế (10%):</span><span>{tax.toLocaleString()}đ</span></div>
          <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
            <span>Tổng:</span><span className="text-blue-700">{total.toLocaleString()}đ</span>
          </div>
          <button 
            onClick={() => {alert('Thanh toán thành công!'); setCart([]);}}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
          >
            XUẤT HÓA ĐƠN
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;