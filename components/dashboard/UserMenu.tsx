'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

/**
 * UserMenu Component - 사용자 메뉴 및 로그아웃
 * 
 * 비즈니스 목적:
 * - 사용자 인증 상태 표시
 * - 로그아웃 기능 제공
 * - 사용자 경험 향상
 */
export default function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // 현재 사용자 정보 가져오기
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/auth/login')}
        className="border-[#E5E5E5] text-[#171717] hover:bg-[#F9F9F7]"
        style={{ borderRadius: '4px' }}
      >
        로그인
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-[#171717]/60">
        <User className="h-4 w-4" />
        <span>{user.email}</span>
      </div>
      <Button
        variant="outline"
        onClick={handleLogout}
        className="border-[#E5E5E5] text-[#171717] hover:bg-[#F9F9F7]"
        style={{ borderRadius: '4px' }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        로그아웃
      </Button>
    </div>
  );
}
