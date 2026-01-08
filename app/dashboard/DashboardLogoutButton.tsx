"use client";

import { createClient } from '@/src/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import Toast from '@/app/components/Toast';

/**
 * 대시보드 로그아웃 버튼 컴포넌트
 */
export default function DashboardLogoutButton() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Dashboard] 로그아웃 오류:', error);
        showToast('로그아웃 중 오류가 발생했습니다.', 'error');
        setLoading(false);
      } else {
        // 블록체인에 로그아웃 기록 저장 (비동기, 실패해도 로그아웃은 계속 진행)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            fetch('/api/blockchain/store-auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                action: 'logout',
                metadata: { method: 'dashboard' },
              }),
            }).catch(err => console.warn('[Logout] 블록체인 저장 실패 (무시됨):', err));
          }
        } catch (error) {
          console.warn('[Logout] 블록체인 저장 오류 (무시됨):', error);
        }
        
        // 로그아웃 성공 시 메인 페이지로 리다이렉트
        showToast('로그아웃되었습니다.', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (err) {
      console.error('[Dashboard] 로그아웃 중 예상치 못한 오류:', err);
      showToast('로그아웃 중 오류가 발생했습니다.', 'error');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleLogout}
        disabled={loading}
        aria-label={loading ? "로그아웃 중" : "로그아웃"}
        {...(loading && { 'aria-busy': true })}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#6B6B6B] bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1A5D3F] focus:ring-offset-2"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLogout();
          }
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            <span className="font-medium">로그아웃 중...</span>
          </>
        ) : (
          <>
            <LogOut className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium">로그아웃</span>
          </>
        )}
      </button>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
