// ─────────── CONSTANTS ───────────

export const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: '🏪', sub: [] },
  { id: 'food', label: 'Thực phẩm', icon: '🥘', sub: ['Đồ ăn nhanh', 'Đặc sản', 'Hữu cơ', 'Bánh kẹo', 'Gia vị'] },
  { id: 'drink', label: 'Đồ uống', icon: '☕', sub: ['Cà phê', 'Trà', 'Nước ép', 'Sinh tố', 'Nước đóng chai'] },
  { id: 'fashion', label: 'Thời trang', icon: '👗', sub: ['Áo', 'Quần', 'Váy', 'Phụ kiện', 'Giày dép'] },
  { id: 'electronics', label: 'Điện tử', icon: '📱', sub: ['Điện thoại', 'Laptop', 'Tai nghe', 'Phụ kiện', 'Smart home'] },
  { id: 'beauty', label: 'Làm đẹp', icon: '💄', sub: ['Skincare', 'Makeup', 'Tóc', 'Nước hoa', 'Nail'] },
  { id: 'home', label: 'Gia dụng', icon: '🏠', sub: ['Nội thất', 'Nhà bếp', 'Phòng ngủ', 'Trang trí', 'Vệ sinh'] },
  { id: 'sport', label: 'Thể thao', icon: '⚽', sub: ['Gym', 'Yoga', 'Bơi lội', 'Chạy bộ', 'Cầu lông'] },
  { id: 'books', label: 'Sách', icon: '📚', sub: ['Tiểu thuyết', 'Kỹ năng', 'Khoa học', 'Trẻ em', 'Giáo trình'] },
];

export const ORDER_STATUSES = {
  'Chờ xác nhận': { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Chờ xác nhận', next: 'Đã xác nhận', nextLabel: '✓ Xác nhận đơn', nextBg: 'bg-emerald-600 hover:bg-emerald-700' },
  'Đã xác nhận':  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Đã xác nhận', next: 'Đang giao', nextLabel: '🚚 Bắt đầu giao', nextBg: 'bg-blue-600 hover:bg-blue-700' },
  'Đang giao':    { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', label: 'Đang giao', next: 'Hoàn thành', nextLabel: '🎉 Giao xong', nextBg: 'bg-violet-600 hover:bg-violet-700' },
  'Hoàn thành':   { color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400', label: 'Hoàn thành', next: null, nextLabel: null, nextBg: null },
  'Đã hủy':       { color: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-400', label: 'Đã hủy', next: null, nextLabel: null, nextBg: null },
} as const;

export const PROGRESS_STEPS = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Hoàn thành'];

export const COUPONS: Record<string, number> = {
  'SALE10': 0.10,
  'WELCOME': 0.15,
  'FIT20': 0.20,
  'VIP30': 0.30,
};
