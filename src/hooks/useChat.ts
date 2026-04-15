import { useState, useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';

interface UseChatParams {
  orderId?: number | null;
  productId?: number | null;
  buyerId?: string;
  sellerId?: string;
}

const MESSAGES_PER_PAGE = 20;

export function useChat({ orderId, productId, buyerId, sellerId }: UseChatParams) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Xây dựng query linh hoạt dựa trên bối cảnh Chat
  const buildQuery = useCallback(() => {
    let query = supabase.from('messages').select('*');
    
    if (orderId) {
      query = query.eq('order_id', orderId);
    } else if (productId && buyerId && sellerId) {
      // Chat tư vấn: lọc tin nhắn giữa 2 người về 1 sản phẩm
      query = query.eq('product_id', productId)
        .or(`and(sender_id.eq.${buyerId},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${buyerId})`);
    } else {
      return null;
    }
    return query;
  }, [orderId, productId, buyerId, sellerId]);

  // Tải tin nhắn với phân trang
  const fetchMessages = useCallback(async (isLoadMore = false) => {
    const query = buildQuery();
    if (!query) return;

    if (!isLoadMore) setLoading(true);
    
    const from = page * MESSAGES_PER_PAGE;
    const to = from + MESSAGES_PER_PAGE - 1;

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      const formatted = data.map(m => ({ ...m, status: 'sent' as const }));
      setMessages(prev => isLoadMore ? [...prev, ...formatted] : formatted);
      setHasMore(data.length === MESSAGES_PER_PAGE);
    }
    setLoading(false);
  }, [buildQuery, page]);

  useEffect(() => {
    setPage(0);
    fetchMessages(false);
  }, [orderId, productId, fetchMessages]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchMessages(true);
    }
  };

  // Đăng ký Realtime (Insert và Update)
  useEffect(() => {
    const query = buildQuery();
    if (!query) return;

    const channel = supabase
      .channel(`chat-room-${orderId || productId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        } 
        else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [buildQuery, orderId, productId]);

  const markAsRead = async (messageIds: number[]) => {
    if (messageIds.length === 0) return;
    await supabase.from('messages').update({ is_read: true }).in('id', messageIds);
  };

  const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    if (!content.trim()) return;
    
    const tempId = -Date.now();
    const tempMsg: Message = {
      id: tempId,
      order_id: orderId || null,
      product_id: productId || null,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      status: 'sending'
    };

    setMessages(prev => [tempMsg, ...prev]);

    const { data, error } = await supabase.from('messages').insert({
      order_id: orderId || null,
      product_id: productId || null,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false
    }).select().single();

    if (error) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, status: 'sent' } : m));
    }
  };

  return { 
    messages: [...messages].reverse(), 
    loading, 
    hasMore, 
    loadMore, 
    sendMessage, 
    markAsRead 
  };
}