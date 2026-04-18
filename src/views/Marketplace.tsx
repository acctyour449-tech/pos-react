import { useState, useMemo } from 'react';
import { Search, Filter, EyeOff, Grid3X3, List, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/product';
import { fmt } from '../utils';
import { CATEGORIES } from '../constants';
import type { Product } from '../types';

interface MarketplaceProps {
  allProducts: Product[];
  disliked: number[];
  wishlist: number[];
  loading: boolean;
  onAddToCart: (p: Product) => void;
  onView: (p: Product) => void;
  onWishlist: (id: number) => void;
  onDislike: (id: number) => void;
  onShowHidden: () => void;
}

export function Marketplace({
  allProducts, disliked, wishlist, loading,
  onAddToCart, onView, onWishlist, onDislike, onShowHidden,
}: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'>('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10_000_000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredProducts = useMemo(() => {
    let list = [...allProducts].filter(p => !disliked.includes(p.id));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      const catLabel = CATEGORIES.find(c => c.id === selectedCategory)?.label;
      if (catLabel) list = list.filter(p => p.category === catLabel);
    }

    if (selectedSubcat) list = list.filter(p => p.subcategory === selectedSubcat);
    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price_asc': list.sort((a, b) => a.price - b.price); break;
      case 'price_desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating': list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'popular': list.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)); break;
      default: list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    return list;
  }, [allProducts, disliked, searchQuery, selectedCategory, selectedSubcat, sortBy, priceRange]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubcat('');
    setPriceRange([0, 10_000_000]);
    setSortBy('newest');
  };

  return (
    <main className="max-w-7xl mx-auto p-5 space-y-4">
      {/* Search */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm sản phẩm, thương hiệu, danh mục..."
            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3.5 rounded-2xl border-2 transition-all flex items-center gap-2 text-sm font-bold ${
            showFilters ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:block">Bộ lọc</span>
        </button>
        {disliked.length > 0 && (
          <button
            onClick={onShowHidden}
            className="px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white text-gray-500 hover:border-gray-300 transition-all flex items-center gap-2 text-sm font-bold"
          >
            <EyeOff className="w-4 h-4" />
            <span className="hidden sm:block">{disliked.length} ẩn</span>
          </button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Sort */}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sắp xếp</p>
                <div className="space-y-1">
                  {[
                    { v: 'newest', l: '🕐 Mới nhất' },
                    { v: 'popular', l: '🔥 Phổ biến nhất' },
                    { v: 'price_asc', l: '💰 Giá thấp → cao' },
                    { v: 'price_desc', l: '💎 Giá cao → thấp' },
                    { v: 'rating', l: '⭐ Đánh giá cao' },
                  ].map(({ v, l }) => (
                    <button key={v} onClick={() => setSortBy(v as any)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all font-medium ${sortBy === v ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Khoảng giá</p>
                <div className="space-y-1">
                  {[[0, 100_000], [100_000, 500_000], [500_000, 1_000_000], [1_000_000, 5_000_000], [5_000_000, 10_000_000]].map(([min, max]) => (
                    <button key={`${min}-${max}`} onClick={() => setPriceRange([min, max])}
                      className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all ${priceRange[0] === min && priceRange[1] === max ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}`}>
                      {min === 0 ? `Dưới ${fmt(max)}` : `${fmt(min)} – ${fmt(max)}`}
                    </button>
                  ))}
                  {(priceRange[0] !== 0 || priceRange[1] !== 10_000_000) && (
                    <button onClick={() => setPriceRange([0, 10_000_000])} className="text-xs text-blue-500 hover:text-blue-700 font-bold mt-1">✕ Xoá bộ lọc giá</button>
                  )}
                </div>
              </div>

              {/* View mode + Reset */}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Hiển thị</p>
                <div className="flex gap-2 mb-3">
                  {[{ v: 'grid', icon: Grid3X3, label: 'Lưới' }, { v: 'list', icon: List, label: 'Danh sách' }].map(({ v, icon: Icon, label }) => (
                    <button key={v} onClick={() => setViewMode(v as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${viewMode === v ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </div>
                <button onClick={() => { resetFilters(); setShowFilters(false); }}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-colors">
                  Đặt lại bộ lọc
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedSubcat(''); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategory === cat.id ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            <span>{cat.icon}</span>{cat.label}
          </button>
        ))}
      </div>

      {/* Sub-categories */}
      <AnimatePresence>
        {selectedCategory !== 'all' && (CATEGORIES.find(c => c.id === selectedCategory)?.sub.length || 0) > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setSelectedSubcat('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${!selectedSubcat ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              Tất cả
            </button>
            {CATEGORIES.find(c => c.id === selectedCategory)?.sub.map(sub => (
              <button key={sub} onClick={() => setSelectedSubcat(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${selectedSubcat === sub ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {sub}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? 'Đang tải...' : (
            <>
              <span className="font-bold text-gray-900">{filteredProducts.length}</span> sản phẩm
              {searchQuery && <span className="text-blue-600"> cho "<strong>{searchQuery}</strong>"</span>}
              {disliked.length > 0 && <span className="text-gray-400"> (đã ẩn {disliked.length})</span>}
            </>
          )}
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl border transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-500'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Products */}
      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-400 font-medium">Đang tải sản phẩm...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm">
          <Search className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-600">Không tìm thấy sản phẩm</p>
          <p className="text-gray-400 text-sm mt-1">Thử thay đổi từ khoá hoặc bộ lọc</p>
          <button onClick={resetFilters} className="mt-4 text-blue-600 font-bold text-sm hover:underline">Xoá bộ lọc →</button>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {filteredProducts.map(p => (
              <ProductCard key={p.id} product={p}
                onAddToCart={onAddToCart} onView={onView}
                wishlisted={wishlist.includes(p.id)} onWishlist={onWishlist}
                disliked={disliked.includes(p.id)} onDislike={onDislike}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer" onClick={() => onView(p)}>
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm line-clamp-2 mb-1">{p.name}</p>
                {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>}
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                <div>
                  <p className="font-black text-blue-600">{fmt(p.price)}</p>
                  {p.original_price && p.original_price > p.price && (
                    <p className="text-xs text-gray-400 line-through">{fmt(p.original_price)}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={e => { e.stopPropagation(); onDislike(p.id); }}
                    className={`p-2 rounded-xl border transition-all ${disliked.includes(p.id) ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}>
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); onAddToCart(p); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all">Thêm</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
