import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Loader2, X, Plus, Minus, Star, MessageCircle, Heart, Share2, ShieldCheck, Truck, Zap } from 'lucide-react';
import { fmt } from '../utils';
import { ProductCard } from '../components/product';
import { ProductMedia } from '../components/ui';
import { supabase } from '../lib/supabase';
import type { Product, Review } from '../types';

interface MarketplaceProps {
  products: Product[];
  categories: string[];
  loading: boolean;
  wishlist: number[];
  disliked: number[];
  onAddToCart: (p: Product) => void;
  onWishlist: (id: number) => void;
  onDislike: (id: number) => void;
}

export function Marketplace({ products, categories, loading, wishlist, disliked, onAddToCart, onWishlist, onDislike }: MarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Fetch reviews khi mở modal sản phẩm
  useEffect(() => {
    if (selectedProduct) {
      const fetchReviews = async () => {
        const { data } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', selectedProduct.id)
          .order('created_at', { ascending: false });
        setReviews(data || []);
      };
      fetchReviews();
      setQty(1);
    }
  }, [selectedProduct]);

  const filtered = products.filter(p => {
    const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isHidden = disliked.includes(p.id);
    return matchCat && matchSearch && !isHidden;
  });

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Search & Categories */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Tìm kiếm sản phẩm..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
          {['Tất cả', ...categories].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400 font-bold"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /><p>Đang tải sản phẩm...</p></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200"><ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" /><p className="text-gray-500 font-bold">Không tìm thấy sản phẩm nào</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onView={setSelectedProduct} wishlisted={wishlist.includes(p.id)} onWishlist={onWishlist} disliked={disliked.includes(p.id)} onDislike={onDislike} />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-5xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur shadow-xl rounded-full hover:bg-white transition-all"><X className="w-5 h-5" /></button>
            <div className="w-full md:w-1/2 h-[40vh] md:h-auto bg-gray-50 flex items-center justify-center p-8"><ProductMedia src={selectedProduct.image} alt={selectedProduct.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" /></div>
            <div className="w-full md:w-1/2 flex flex-col h-full md:max-h-[90vh] p-6 sm:p-10 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-full">{selectedProduct.category}</span>
                <h2 className="text-3xl font-black text-gray-900 leading-tight">{selectedProduct.name}</h2>
                <div className="flex items-center gap-4">
                  <p className="text-3xl font-black text-blue-600">{fmt(selectedProduct.price)}</p>
                  {selectedProduct.original_price && <p className="text-lg text-gray-400 line-through font-bold">{fmt(selectedProduct.original_price)}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-3xl space-y-3">
                  <p className="text-gray-600 text-sm leading-relaxed">{selectedProduct.description || "Chưa có mô tả chi tiết cho sản phẩm này."}</p>
                </div>
              </div>

              {/* PUBLIC REVIEWS SECTION */}
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-black flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Đánh giá cộng đồng</h3>
                {reviews.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map(rev => (
                      <div key={rev.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-10 flex gap-4">
                <button onClick={() => onAddToCart(selectedProduct)} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all">Thêm vào giỏ hàng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}