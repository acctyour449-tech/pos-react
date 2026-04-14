import { useState } from 'react';
import { PackagePlus, Search, Loader2, Store, Edit, Trash2, X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductMedia } from '../components/ui';
import { fmt, getDiscount } from '../utils';
import { CATEGORIES } from '../constants';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';

interface SellerProductsProps {
  products: Product[];
  loading: boolean;
  session: any;
  onProductsChanged: () => void;
  showToast: (msg: string, type?: any) => void;
}

const EMPTY_FORM = { name: '', price: '', original_price: '', category: 'food', subcategory: '', description: '', stock: '100', tags: '' };

export function SellerProducts({ products, loading, session, onProductsChanged, showToast }: SellerProductsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const catOptions = CATEGORIES.find(c => c.id === form.category)?.sub || [];

  const resetForm = () => {
    setShowAddProduct(false);
    setEditingProduct(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setForm(EMPTY_FORM);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    const catId = CATEGORIES.find(c => c.label === p.category)?.id || 'food';
    setForm({
      name: p.name, price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : '',
      category: catId, subcategory: p.subcategory || '',
      description: p.description || '',
      stock: String(p.stock ?? 100),
      tags: p.tags?.join(', ') || '',
    });
    setPreviewUrl(p.image);
    setShowAddProduct(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { showToast('File quá lớn (tối đa 10MB)', 'error'); return; }
    setSelectedFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct && !selectedFile) { showToast('Vui lòng chọn ảnh sản phẩm', 'error'); return; }
    if (!form.name.trim()) { showToast('Vui lòng nhập tên sản phẩm', 'error'); return; }
    if (Number(form.price) <= 0) { showToast('Giá bán phải lớn hơn 0', 'error'); return; }

    try {
      setSaving(true);
      let imageUrl = editingProduct?.image || '';

      if (selectedFile) {
        const ext = selectedFile.name.split('.').pop();
        const path = `${session.user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('assets').upload(path, selectedFile, { upsert: false });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
      }

      const catLabel = CATEGORIES.find(c => c.id === form.category)?.label || form.category;
      const data = {
        name: form.name.trim(),
        price: Number(form.price),
        original_price: form.original_price && Number(form.original_price) > Number(form.price) ? Number(form.original_price) : null,
        category: catLabel,
        subcategory: form.subcategory || null,
        description: form.description.trim() || null,
        stock: Math.max(0, Number(form.stock) || 0),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        image: imageUrl,
        seller_id: session.user.id,
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id).eq('seller_id', session.user.id);
        if (error) throw error;
        showToast('✓ Cập nhật sản phẩm thành công');
      } else {
        const { error } = await supabase.from('products').insert([data]);
        if (error) throw error;
        showToast('✓ Đã đăng sản phẩm thành công');
      }

      resetForm();
      onProductsChanged();
    } catch (err: any) {
      showToast(err.message || 'Lỗi không xác định', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá sản phẩm này? Thao tác không thể hoàn tác.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id).eq('seller_id', session.user.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Đã xoá sản phẩm');
    onProductsChanged();
  };

  const filtered = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  return (
    <main className="max-w-7xl mx-auto p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Sản phẩm của tôi</h1>
          <p className="text-gray-500 text-sm">{products.length} sản phẩm đang kinh doanh</p>
        </div>
        <button
          onClick={() => setShowAddProduct(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.97] text-sm"
        >
          <PackagePlus className="w-4 h-4" />Thêm sản phẩm
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          placeholder="Tìm sản phẩm..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" /><span>Đang tải...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
          <Store className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-600 mb-1">Cửa hàng trống rỗng</p>
          <p className="text-gray-400 text-sm mb-5">Thêm sản phẩm đầu tiên để bắt đầu bán hàng</p>
          <button onClick={() => setShowAddProduct(true)} className="bg-blue-600 text-white font-bold px-5 py-2.5 rounded-2xl text-sm hover:bg-blue-700 transition-colors">
            + Thêm ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => {
            const disc = getDiscount(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="h-40 overflow-hidden relative bg-gray-50">
                  <ProductMedia src={p.image} alt={p.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  {disc > 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">-{disc}%</span>}
                  {(p.stock || 0) <= 5 && (p.stock || 0) > 0 && <span className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Sắp hết</span>}
                  {(p.stock || 0) === 0 && <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">Hết hàng</span>}
                </div>
                <div className="p-3">
                  <p className="font-bold text-sm truncate mb-0.5">{p.name}</p>
                  <p className="text-blue-600 font-black text-sm">{fmt(p.price)}</p>
                  {p.original_price && p.original_price > p.price && (
                    <p className="text-gray-400 text-xs line-through">{fmt(p.original_price)}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[10px] font-bold ${(p.stock || 0) === 0 ? 'text-red-500' : (p.stock || 0) <= 5 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {p.stock !== undefined ? `${p.stock} kho` : '∞ kho'}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-3xl">
                <h3 className="text-lg font-black">{editingProduct ? '✏️ Chỉnh sửa sản phẩm' : '📦 Thêm sản phẩm mới'}</h3>
                <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Image */}
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Ảnh / Video sản phẩm *</label>
                  <label className="relative block h-44 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors group">
                    {previewUrl ? (
                      <ProductMedia src={previewUrl} alt="preview" className="w-full h-full" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Camera className="w-10 h-10" />
                        <p className="text-sm font-medium">Nhấn để chọn ảnh hoặc video</p>
                        <p className="text-xs text-gray-300">JPG, PNG, MP4 — tối đa 10MB</p>
                      </div>
                    )}
                    {previewUrl && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" required={!editingProduct} />
                  </label>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tên sản phẩm *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nhập tên sản phẩm..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>

                {/* Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Danh mục *</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
                      {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  {catOptions.length > 0 && (
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Phân loại</label>
                      <select value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none">
                        <option value="">-- Tất cả --</option>
                        {catOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Giá bán (₫) *</label>
                    <input type="number" required min="1" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      placeholder="0"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Giá gốc (sale)</label>
                    <input type="number" min="0" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))}
                      placeholder="Để trống nếu không sale"
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                </div>

                {/* Stock + Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Số lượng kho</label>
                    <input type="number" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tags (phân cách dấu phẩy)</label>
                    <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                      placeholder="tươi, ngon, sale..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1.5">Mô tả sản phẩm</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Mô tả chi tiết sản phẩm..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={resetForm}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl text-sm transition-all">Huỷ</button>
                  <button type="submit" disabled={saving}
                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm transition-all active:scale-[0.98]">
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingProduct ? 'Lưu thay đổi' : 'Đăng sản phẩm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
