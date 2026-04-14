import { useState, useEffect, useCallback } from 'react';

export function useWishlist(userId: string | undefined, showToast: (msg: string, type?: any) => void) {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(`wl_${userId}`);
      if (saved) setWishlist(JSON.parse(saved));
      const savedDl = localStorage.getItem(`dl_${userId}`);
      if (savedDl) setDisliked(JSON.parse(savedDl));
    } catch {}
  }, [userId]);

  // Persist wishlist
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`wl_${userId}`, JSON.stringify(wishlist));
  }, [wishlist, userId]);

  // Persist disliked
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`dl_${userId}`, JSON.stringify(disliked));
  }, [disliked, userId]);

  const toggleWishlist = useCallback((id: number, isDisliked: boolean) => {
    if (isDisliked) {
      showToast('Bỏ ẩn sản phẩm trước để thêm vào yêu thích', 'warning');
      return;
    }
    setWishlist(w => {
      const added = w.includes(id);
      showToast(added ? 'Đã bỏ yêu thích' : '❤️ Đã thêm vào yêu thích');
      return added ? w.filter(x => x !== id) : [...w, id];
    });
  }, [showToast]);

  const addDisliked = useCallback((id: number) => {
    setDisliked(d => [...d, id]);
    setWishlist(w => w.filter(x => x !== id));
    showToast('👁️ Đã ẩn sản phẩm này', 'info');
  }, [showToast]);

  const restoreProduct = useCallback((id: number) => {
    setDisliked(d => d.filter(x => x !== id));
    showToast('✓ Đã hiện lại sản phẩm', 'success');
  }, [showToast]);

  const restoreAll = useCallback(() => {
    setDisliked([]);
    showToast('✓ Đã hiện tất cả sản phẩm', 'success');
  }, [showToast]);

  return { wishlist, disliked, toggleWishlist, addDisliked, restoreProduct, restoreAll };
}
