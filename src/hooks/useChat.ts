import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js'; // Import type chuẩn
import { supabase } from '../lib/supabase';
import type { Message } from '../types';
import { useToast } from './useToast'; // Giả định bạn có hook này dựa trên cấu trúc file của bạn

export function useChat(orderId: number | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null); // Sửa type any
  const { addToast } = useToast(); // Dùng toast để thông báo lỗi

  useEffect(() => {
    if (!orderId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      
      if (error) {
        addToast?.('error', 'Không thể tải lịch sử tin nhắn');
      } else {
        // Đánh dấu các tin nhắn tải về là đã gửi thành công
        setMessages((data || []).map(m => ({ ...m, status: 'sent' })));
      }
      setLoading(false);
    };

    fetchMessages();

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
            if (prev.some(m => m.id === newMsg.id)) return prev;
            
            // Xóa tin nhắn tạm (optimistic) dựa trên nội dung & sender
            const filtered = prev.filter(m => !(m.id < 0 && m.content === newMsg.content && m.sender_id === newMsg.sender_id));
            
            return [...filtered, { ...newMsg, status: 'sent' }];
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
    
    // ID tạm thời sinh từ timestamp (số âm để tránh trùng với DB)
    const tempId = -Date.now();
    
    // 🔥 Optimistic Update: Thêm trạng thái 'sending'
    const tempMsg: Message = {
      id: tempId,
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      created_at: new Date().toISOString(),
      status: 'sending' 
    };
    
    setMessages(prev => [...prev, tempMsg]);

    // Gửi dữ liệu thực tế lên database
    const { data, error } = await supabase.from('messages').insert({
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim()
    }).select().single();

    if (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      addToast?.('error', 'Gửi tin nhắn thất bại. Vui lòng thử lại!');
      
      // Chuyển trạng thái tin nhắn thành 'error' để UI hiện nút gửi lại, thay vì xóa mất
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } else if (data) {
       // Cập nhật ID thực từ DB và trạng thái 'sent' (nếu Realtime chậm hơn)
       setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id, status: 'sent' } : m));
    }
  };

  return { messages, loading, sendMessage };
}