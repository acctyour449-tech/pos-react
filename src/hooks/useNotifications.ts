import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export function useNotifications(
  userId: string | undefined,
  showToast: (msg: string, type?: any) => void
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const realtimeRef = useRef<any>(null);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.is_read).length,
    [notifications]
  );

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    setupRealtime(userId);
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, [userId]);

  async function fetchNotifications() {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
  }

  function setupRealtime(uid: string) {
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    const ch = supabase
      .channel('rt-notif-' + uid)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        payload => {
          const n = payload.new as Notification;
          setNotifications(prev => [n, ...prev]);
          showToast(`🔔 ${n.message}`, 'info');
        }
      )
      .subscribe();
    realtimeRef.current = ch;
  }

  async function markRead(id: number) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(p => p.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  }

  async function markAllRead(userId: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  }

  return { notifications, unreadCount, markRead, markAllRead };
}
