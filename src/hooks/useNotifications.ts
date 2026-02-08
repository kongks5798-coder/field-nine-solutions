"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/src/utils/supabase/client';
import { logger } from '@/src/utils/logger';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

/**
 * 알림 시스템 훅
 * 실시간 알림 관리 및 읽음 처리
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // 실제 알림 테이블이 있다면 여기서 로드
      // 현재는 로컬 스토리지 기반 시뮬레이션
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      logger.error("알림 로드 실패", error as Error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        );
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      logger.error("알림 읽음 처리 실패", error as Error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(0);
    } catch (error) {
      logger.error("모든 알림 읽음 처리 실패", error as Error);
    }
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // 최대 50개
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
    refresh: loadNotifications,
  };
}
