import type { Product } from '../types';

// ─────────── HELPERS ───────────
export const fmt = (p: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0);

export const isVideo = (url: string) =>
  url && ['.mp4', '.webm', '.ogg', '.mov'].some(e => url.toLowerCase().split('?')[0].endsWith(e));

export const timeAgo = (date: string) => {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(date).toLocaleDateString('vi-VN');
};

export const getDiscount = (p: Product) =>
  p.original_price && p.original_price > p.price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : 0;
