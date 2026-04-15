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
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  const sendMessage = async (senderId: string, receiverId: string, content: string) => {
    if (!content.trim() || !orderId) return;
    await supabase.from('messages').insert({
      order_id: orderId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim()
    });
  };

  return { messages, loading, sendMessage };
}