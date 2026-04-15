import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export function useChat(orderId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${orderId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${orderId}` }, 
      payload => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          // Bỏ qua nếu tin nhắn đã tồn tại
          if (prev.some(m => m.id === newMsg.id)) return prev;
          // Xóa tin nhắn tạm (optimistic) có cùng nội dung để thay bằng tin nhắn thật từ DB
          const filtered = prev.filter(m => !(m.id < 0 && m.content === newMsg.content));
          return [...filtered, newMsg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    if (!content.trim() || !orderId) return;
    
    // 🔥 Optimistic UI Update: Hiển thị ngay lập tức cho mượt
    const tempMsg: Message = {
      id: -Date.now(), // ID âm để đánh dấu là tin nhắn tạm
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    // Gửi ngầm lên server
    await supabase.from('messages').insert({
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim()
    });
  };

  return { messages, loading, sendMessage };
}