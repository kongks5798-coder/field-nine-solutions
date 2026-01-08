"use client";

import { createClient } from '@/src/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Bell, Shield, Save, Loader2 } from 'lucide-react';
import Toast from '@/app/components/Toast';
import { logger } from '@/src/utils/logger';
import { validateEmail } from '@/src/utils/validation';
import StoreConnectionSection from './StoreConnectionSection';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login?redirect=/dashboard/settings');
        return;
      }

      setUser(session.user);
      setEmail(session.user.email || '');

      // 프로필 정보 로드
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("사용자 데이터 로드 실패", err as Error);
      setToast({ message: "사용자 정보를 불러오는데 실패했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // 이메일 검증
      if (email) {
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
          setToast({ message: emailValidation.errors[0], type: "error" });
          setSaving(false);
          return;
        }
      }

      if (!user) {
        setToast({ message: "사용자 정보를 찾을 수 없습니다.", type: "error" });
        setSaving(false);
        return;
      }

      // 프로필 업데이트 또는 생성
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: email || user.email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        throw error;
      }

      setToast({ message: "프로필이 성공적으로 저장되었습니다.", type: "success" });
      logger.info("프로필 업데이트 성공", { userId: user.id });
      await loadUserData();
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("프로필 저장 실패", err as Error);
      setToast({ message: `프로필 저장 실패: ${err.message || '알 수 없는 오류'}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A5D3F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#171717] mb-2">설정</h1>
          <p className="text-[#6B6B6B]">계정 및 환경 설정을 관리하세요</p>
        </div>

        <div className="space-y-6">
          {/* 프로필 설정 */}
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#1A5D3F]/10 flex items-center justify-center">
                <User className="w-5 h-5 text-[#1A5D3F]" />
              </div>
              <h2 className="text-xl font-semibold text-[#171717]">프로필 설정</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#171717] mb-2">
                  이메일 주소
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
                  placeholder="your@email.com"
                />
                <p className="mt-1 text-sm text-gray-500">이메일 주소는 로그인에 사용됩니다.</p>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#171717] mb-2">
                  이름
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
                  placeholder="홍길동"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#1A5D3F] text-white rounded-lg font-medium hover:bg-[#144A32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>저장 중...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>저장</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 알림 설정 */}
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#171717]">알림 설정</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-lg border border-[#E5E5E0] hover:bg-gray-50 cursor-pointer">
                <div>
                  <div className="font-medium text-[#171717]">이메일 알림</div>
                  <div className="text-sm text-gray-500">이메일로 알림을 받습니다</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                  className="w-5 h-5 text-[#1A5D3F] focus:ring-[#1A5D3F] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-[#E5E5E0] hover:bg-gray-50 cursor-pointer">
                <div>
                  <div className="font-medium text-[#171717]">푸시 알림</div>
                  <div className="text-sm text-gray-500">브라우저 푸시 알림을 받습니다</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                  className="w-5 h-5 text-[#1A5D3F] focus:ring-[#1A5D3F] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border border-[#E5E5E0] hover:bg-gray-50 cursor-pointer">
                <div>
                  <div className="font-medium text-[#171717]">SMS 알림</div>
                  <div className="text-sm text-gray-500">SMS로 알림을 받습니다</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                  className="w-5 h-5 text-[#1A5D3F] focus:ring-[#1A5D3F] rounded"
                />
              </label>
            </div>
          </div>

          {/* 스토어 연동 설정 */}
          <StoreConnectionSection userId={user?.id || ''} />

          {/* 보안 설정 */}
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-[#171717]">보안 설정</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#E5E5E0]">
                <div className="font-medium text-[#171717] mb-2">비밀번호 변경</div>
                <p className="text-sm text-gray-500 mb-4">비밀번호를 변경하려면 로그아웃 후 비밀번호 찾기를 사용하세요.</p>
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-[#1A5D3F] hover:text-[#144A32] font-medium"
                >
                  로그인 페이지로 이동 →
                </button>
              </div>

              <div className="p-4 rounded-lg border border-[#E5E5E0]">
                <div className="font-medium text-[#171717] mb-2">2단계 인증</div>
                <p className="text-sm text-gray-500 mb-4">향후 지원 예정입니다.</p>
                <button
                  disabled
                  className="text-sm text-gray-400 font-medium cursor-not-allowed"
                >
                  곧 출시 예정
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
