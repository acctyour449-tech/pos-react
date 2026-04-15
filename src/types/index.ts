// ─────────── TYPES ───────────

export interface Review {
  id: number;
  product_id: number;
  order_id?: number;
  user_id: string;
  user_name: string;
  rating: number; // 1 - 5
  comment: string;
  seller_reply?: string; // Phản hồi từ người bán
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  category: string;
  subcategory?: string;
  image: string;
  images?: string[];
  seller_id: string;
  seller_name?: string;
  description?: string;
  stock?: number;
  sold_count?: number;
  rating?: number;
  review_count?: number;
  tags?: string[];
  is_featured?: boolean;
  discount_percent?: number;
  created_at?: string;
  reviews?: Review[]; // Danh sách đánh giá của sản phẩm
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export interface OrderItem extends Product {
  quantity: number;
  note?: string;
  review?: Review; // Thêm thông tin đánh giá vào từng item trong đơn hàng
}

export interface Order {
  id: number;
  created_at: string;
  total_price: number;
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  items: OrderItem[] | any;
  seller_id: string;
  buyer_id: string;
  buyer_name?: string;
  buyer_email?: string;
  status: string;
  shipping_address?: string;
  payment_method?: string;
  note?: string;
  tracking_code?: string;
  estimated_delivery?: string;
}

export interface Notification {
  id: number;
  user_id: string;
  order_id: number;
  message: string;
  type: 'order_confirmed' | 'order_shipped' | 'order_completed' | 'new_order' | 'promo' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}