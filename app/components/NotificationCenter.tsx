"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/src/hooks/useNotifications';
import Toast from './Toast';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    // 외부 클릭 시 닫기
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#notification-center')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div id="notification-center" className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#171717] hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="알림"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-[#E5E5E0] rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-[#E5E5E0] flex items-center justify-between">
            <h3 className="font-semibold text-[#171717]">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1 text-[#6B6B6B] hover:text-[#171717] transition-colors"
                  aria-label="모두 읽음 처리"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-[#6B6B6B] hover:text-[#171717] transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#E5E5E0]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-[#171717]">{notification.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-[#6B6B6B] hover:text-[#171717] transition-colors flex-shrink-0"
                            aria-label="읽음 처리"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
