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
}

export interface CartItem extends Product {
  quantity: number;
  note?: string;
}

export interface Order {
  id: number;
  created_at: string;
  total_price: number;
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  items: any;
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
  is_reviewed?: boolean;
}

export interface Review {
  id: number;
  order_id: number;
  product_id: number;
  buyer_id: string;
  buyer_name?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Message {
  id: number;
  order_id?: number | null; // Cho phép null/undefined để hỗ trợ chat tư vấn trước mua
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean; // Trạng thái đã xem
  status?: 'sending' | 'sent' | 'error'; // Trạng thái UI nội bộ (không bắt buộc phải lưu db)
}

export interface Notification {
  id: number;
  user_id: string;
  order_id: number;
  message: string;
  type: 'order_confirmed' | 'order_shipped' | 'order_completed' | 'new_order' | 'promo' | 'system' | 'review_requested' | 'chat_message';
  is_read: boolean;
  created_at: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}