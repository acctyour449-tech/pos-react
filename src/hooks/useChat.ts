import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export function useChat(orderId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!orderId) {
      setMessages([]);
      return;
    }

    // 1. Tải tin nhắn cũ
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      
      if (!error) setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    // 2. Thiết lập đăng ký Realtime
    // Xóa channel cũ nếu có để tránh trùng lặp subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat-room-${orderId}`)
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `order_id=eq.${orderId}` 
        }, 
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Ngăn chặn tin nhắn trùng lặp
            if (prev.some(m => m.id === newMsg.id)) return prev;
            
            // Loại bỏ tin nhắn tạm (optimistic) nếu nội dung trùng khớp
            const filtered = prev.filter(m => !(m.id < 0 && m.content === newMsg.content));
            return [...filtered, newMsg];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Đã kết nối Realtime cho đơn hàng:', orderId);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [orderId]);

  const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    if (!content.trim() || !orderId) return;
    
    // 🔥 Optimistic Update: Hiển thị ngay lập tức trên máy người gửi
    const tempMsg: Message = {
      id: -Date.now(),
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    // Gửi dữ liệu thực tế lên database
    const { error } = await supabase.from('messages').insert({
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim()
    });

    if (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      // Nếu lỗi, xóa tin nhắn tạm để người dùng biết gửi thất bại
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  return { messages, loading, sendMessage };
}