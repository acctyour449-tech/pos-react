// Nạp thư viện Zustand trực tiếp từ Web
import { create } from 'https://esm.sh/zustand';

export const usePOSStore = create((set) => ({
  cart: [],
  products: [
    { id: 1, name: 'Cà Phê Muối', price: 29000, category: 'Đồ uống', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200' },
    { id: 2, name: 'Bánh Mì Ô Mai', price: 25000, category: 'Thức ăn', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200' },
    { id: 3, name: 'Trà Thạch Vải', price: 35000, category: 'Đồ uống', image: 'https://images.unsplash.com/photo-1544787210-2211d44b565c?w=200' },
    { id: 4, name: 'Bánh Sừng Bò', price: 45000, category: 'Thức ăn', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200' },
    { id: 5, name: 'Bạc Xỉu', price: 29000, category: 'Đồ uống', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200' },
    { id: 6, name: 'Trà Sữa Trân Châu', price: 40000, category: 'Đồ uống', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200' },
  ],
  
  addToCart: (product) => set((state) => {
    const existing = state.cart.find(item => item.id === product.id);
    if (existing) {
      return {
        cart: state.cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),

  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter(item => item.id !== id)
  })),

  updateQuantity: (id, qty) => set((state) => ({
    cart: state.cart.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
    )
  })),

  clearCart: () => set({ cart: [] }),
}));