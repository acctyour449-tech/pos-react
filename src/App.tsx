// ... (giữ nguyên các imports cũ)
import { Star, X, RotateCcw } from 'lucide-react'; // Thêm RotateCcw để khôi phục sản phẩm bị ẩn

// Thêm interface cho Preference
interface ProductPreference {
  user_id: string;
  product_id: number;
  is_priority: boolean;
  is_excluded: boolean;
}

export default function App() {
  // ... (các state cũ)
  const [preferences, setPreferences] = useState<ProductPreference[]>([]);
  const [showExcluded, setShowExcluded] = useState(false); // Để xem lại các SP đã loại bỏ

  // ---- Fetch Preferences ----
  const fetchPreferences = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('product_preferences')
      .select('*')
      .eq('user_id', session.user.id);
    setPreferences(data || []);
  };

  useEffect(() => {
    if (session) {
      fetchPreferences();
    }
  }, [session]);

  // ---- Xử lý Ưu tiên / Loại bỏ ----
  const togglePreference = async (productId: number, field: 'is_priority' | 'is_excluded') => {
    if (!session?.user?.id) return;

    const currentPref = preferences.find(p => p.product_id === productId);
    const newValue = !currentPref?.[field];

    // Optimistic Update (Cập nhật UI trước để mượt mà)
    setPreferences(prev => {
      const exists = prev.find(p => p.product_id === productId);
      if (exists) {
        return prev.map(p => p.product_id === productId ? { ...p, [field]: newValue } : p);
      }
      return [...prev, { user_id: session!.user.id, product_id: productId, is_priority: false, is_excluded: false, [field]: newValue }];
    });

    try {
      const { error } = await supabase
        .from('product_preferences')
        .upsert({ 
          user_id: session.user.id, 
          product_id: productId, 
          [field]: newValue,
          // Giữ lại giá trị của trường còn lại nếu đã tồn tại
          is_priority: currentPref ? currentPref.is_priority : (field === 'is_priority' ? newValue : false),
          is_excluded: currentPref ? currentPref.is_excluded : (field === 'is_excluded' ? newValue : false),
        });
      if (error) throw error;
      showToast(newValue ? 'Đã cập nhật' : 'Đã hủy chọn', 'success');
    } catch (err: any) {
      showToast('Lỗi cập nhật: ' + err.message, 'error');
      fetchPreferences(); // Rollback
    }
  };

  // ---- Logic lọc và sắp xếp sản phẩm ----
  const processedProducts = useMemo(() => {
    if (!products) return [];

    // 1. Lọc bỏ các sản phẩm bị đánh dấu is_excluded (trừ khi đang ở chế độ xem SP bị ẩn)
    let filtered = products.filter(p => {
      const pref = preferences.find(pref => pref.product_id === p.id);
      if (showExcluded) return pref?.is_excluded; // Chỉ hiện SP bị ẩn
      return !pref?.is_excluded; // Ẩn SP bị đánh dấu loại bỏ
    });

    // 2. Sắp xếp: Sản phẩm ưu tiên (is_priority) lên đầu
    return filtered.sort((a, b) => {
      const prefA = preferences.find(p => p.product_id === a.id)?.is_priority;
      const prefB = preferences.find(p => p.product_id === b.id)?.is_priority;
      return (prefB ? 1 : 0) - (prefA ? 1 : 0);
    });
  }, [products, preferences, showExcluded]);

  // ... (Các phần logic khác giữ nguyên)

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A]">
      {/* ... Navbar ... */}

      <AnimatePresence mode="wait">
        {/* ... Các tab Seller giữ nguyên ... */}

        {activeTab === 'marketplace' ? (
          <motion.main key="marketplace" className="flex h-[calc(100vh-80px)]">
            <section className="w-full p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-10">
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-4xl font-black tracking-tight mb-2">
                        {showExcluded ? 'Sản phẩm đã loại bỏ' : 'Khám phá Chợ chung'}
                      </h2>
                      <p className="text-gray-500 font-medium">
                        {showExcluded ? 'Quản lý các sản phẩm bạn đã ẩn' : 'Tìm kiếm những sản phẩm tốt nhất từ cộng đồng'}
                      </p>
                    </div>
                    
                    {/* Nút chuyển đổi xem SP bị loại bỏ */}
                    <button 
                      onClick={() => setShowExcluded(!showExcluded)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${showExcluded ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      {showExcluded ? 'Quay lại Chợ chung' : 'Xem SP đã loại bỏ'}
                    </button>
                  </div>
                  {/* ... Search bar ... */}
                </div>

                {/* Categories ... */}

                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    <p className="font-bold">Đang tìm kiếm sản phẩm...</p>
                  </div>
                ) : processedProducts.length === 0 ? (
                  <div className="h-96 flex flex-col items-center justify-center text-gray-400 gap-4 bg-white rounded-[3rem] border border-[#E9ECEF]">
                    <Search className="w-16 h-16 opacity-10" />
                    <p className="text-xl font-bold text-gray-900">Không tìm thấy sản phẩm nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {processedProducts.map((product) => {
                      const pref = preferences.find(p => p.product_id === product.id);
                      return (
                        <motion.div key={product.id} whileHover={{ y: -8 }}
                          className={`bg-white rounded-[2.5rem] border overflow-hidden shadow-sm hover:shadow-xl transition-all group ${pref?.is_priority ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-[#E9ECEF]'}`}>
                          
                          <div className="h-64 overflow-hidden relative">
                            {/* ... Video/Image render ... */}
                            
                            {/* NÚT ĐIỀU KHIỂN ƯU TIÊN & LOẠI BỎ */}
                            <div className="absolute top-5 right-5 flex flex-col gap-2">
                              <button 
                                onClick={() => togglePreference(product.id, 'is_priority')}
                                className={`p-3 rounded-2xl transition-all shadow-lg ${pref?.is_priority ? 'bg-yellow-400 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-yellow-500'}`}
                                title="Ưu tiên sản phẩm này"
                              >
                                <Star className={`w-5 h-5 ${pref?.is_priority ? 'fill-current' : ''}`} />
                              </button>
                              
                              <button 
                                onClick={() => togglePreference(product.id, 'is_excluded')}
                                className={`p-3 rounded-2xl transition-all shadow-lg ${pref?.is_excluded ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
                                title="Loại bỏ khỏi danh sách"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                              {product.category} {pref?.is_priority && '⭐'}
                            </div>
                          </div>

                          <div className="p-8">
                            {/* ... Nội dung tên, giá, nút thêm vào giỏ hàng ... */}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
            {/* ... Cart Sidebar ... */}
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}