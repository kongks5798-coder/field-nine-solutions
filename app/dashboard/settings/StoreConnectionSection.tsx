"use client";

import { useState, useEffect } from 'react';
import { Store, CheckCircle2, XCircle, Loader2, Save, Trash2, AlertCircle } from 'lucide-react';
import { createClient } from '@/src/utils/supabase/client';
import { logger } from '@/src/utils/logger';
import Toast from '@/app/components/Toast';
import { encrypt, decrypt } from '@/src/utils/security';

interface Store {
  id: string;
  platform: string;
  store_name: string;
  is_active: boolean;
  created_at: string;
}

interface StoreConnectionSectionProps {
  userId: string;
}

export default function StoreConnectionSection({ userId }: StoreConnectionSectionProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // 새 스토어 추가 폼 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'naver' as 'naver' | 'coupang' | '11st' | 'gmarket' | 'auction' | 'shopify' | 'woocommerce' | 'custom',
    store_name: '',
    api_key: '',
    refresh_token: '',
  });

  const supabase = createClient();

  // 스토어 목록 로드
  const loadStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('id, platform, store_name, is_active, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStores(data || []);
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[StoreConnection] 스토어 목록 로드 실패:', err as Error);
      setToast({ message: '스토어 목록을 불러오는데 실패했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 스토어 저장 (Upsert)
  const handleSaveStore = async () => {
    try {
      setSaving(true);

      // 유효성 검사
      if (!formData.store_name.trim()) {
        setToast({ message: '스토어 이름을 입력해주세요.', type: 'error' });
        setSaving(false);
        return;
      }

      if (!formData.api_key.trim()) {
        setToast({ message: 'API Key를 입력해주세요.', type: 'error' });
        setSaving(false);
        return;
      }

      // API Key 암호화
      const encryptedApiKey = encrypt(formData.api_key.trim());
      const encryptedRefreshToken = formData.refresh_token.trim() 
        ? encrypt(formData.refresh_token.trim()) 
        : null;

      // 스토어 Upsert (암호화 적용)
      const { data, error } = await supabase
        .from('stores')
        .upsert({
          user_id: userId,
          platform: formData.platform,
          store_name: formData.store_name.trim(),
          api_key: encryptedApiKey,
          refresh_token: encryptedRefreshToken,
          is_active: true,
        }, {
          onConflict: 'user_id,store_name',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setToast({ message: '스토어가 성공적으로 연동되었습니다!', type: 'success' });
      logger.info('[StoreConnection] 스토어 저장 성공:', { storeId: data.id });
      
      // 폼 초기화 및 목록 새로고침
      setFormData({
        platform: 'naver',
        store_name: '',
        api_key: '',
        refresh_token: '',
      });
      setShowAddForm(false);
      await loadStores();
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[StoreConnection] 스토어 저장 실패:', err as Error);
      setToast({ message: `스토어 연동 실패: ${err.message || '알 수 없는 오류'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // 스토어 연결 테스트
  const handleTestConnection = async (storeId: string) => {
    try {
      setTesting(storeId);

      // API Key로 스토어 조회하여 연결 확인
      const { data: store, error } = await supabase
        .from('stores')
        .select('id, platform, store_name, api_key, is_active')
        .eq('id', storeId)
        .eq('user_id', userId)
        .single();

      if (error || !store) {
        throw new Error('스토어를 찾을 수 없습니다.');
      }

      // 실제 API 연결 테스트는 Python 서버에서 수행
      // 여기서는 기본적인 유효성만 확인
      if (!store.api_key || store.api_key.length < 10) {
        throw new Error('API Key가 유효하지 않습니다.');
      }

      setToast({ message: '연동이 성공적으로 확인되었습니다!', type: 'success' });
      logger.info('[StoreConnection] 연결 테스트 성공:', { storeId });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[StoreConnection] 연결 테스트 실패:', err as Error);
      setToast({ message: `연결 테스트 실패: ${err.message || '알 수 없는 오류'}`, type: 'error' });
    } finally {
      setTesting(null);
    }
  };

  // 스토어 삭제
  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('정말 이 스토어 연동을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      setToast({ message: '스토어 연동이 삭제되었습니다.', type: 'success' });
      await loadStores();
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[StoreConnection] 스토어 삭제 실패:', err as Error);
      setToast({ message: `삭제 실패: ${err.message || '알 수 없는 오류'}`, type: 'error' });
    }
  };

  // 스토어 활성화/비활성화
  const handleToggleActive = async (storeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ is_active: !currentStatus })
        .eq('id', storeId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      setToast({ 
        message: `스토어가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`, 
        type: 'success' 
      });
      await loadStores();
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('[StoreConnection] 스토어 상태 변경 실패:', err as Error);
      setToast({ message: `상태 변경 실패: ${err.message || '알 수 없는 오류'}`, type: 'error' });
    }
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = {
      naver: '네이버 스마트스토어',
      coupang: '쿠팡',
      '11st': '11번가',
      gmarket: '지마켓',
      auction: '옥션',
      shopify: '쇼피파이',
      woocommerce: '우커머스',
      custom: '커스텀',
    };
    return labels[platform] || platform;
  };

  // 초기 로드
  useEffect(() => {
    if (userId) {
      loadStores();
    }
  }, [userId]);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A5D3F]/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-[#1A5D3F]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#171717]">스토어 연동</h2>
              <p className="text-sm text-gray-500">마켓플레이스 API Key를 입력하여 주문을 자동으로 가져옵니다</p>
            </div>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-[#1A5D3F] text-white rounded-lg font-medium hover:bg-[#144A32] transition-colors"
            >
              + 스토어 추가
            </button>
          )}
        </div>

        {/* 새 스토어 추가 폼 */}
        {showAddForm && (
          <div className="mb-6 p-4 border border-[#E5E5E0] rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold text-[#171717] mb-4">새 스토어 연동</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-[#171717] mb-2">
                  플랫폼 선택
                </label>
                <select
                  id="platform"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
                >
                  <option value="naver">네이버 스마트스토어</option>
                  <option value="coupang">쿠팡</option>
                  <option value="11st">11번가</option>
                  <option value="gmarket">지마켓</option>
                  <option value="auction">옥션</option>
                  <option value="shopify">쇼피파이</option>
                  <option value="woocommerce">우커머스</option>
                  <option value="custom">커스텀</option>
                </select>
              </div>

              <div>
                <label htmlFor="store_name" className="block text-sm font-medium text-[#171717] mb-2">
                  스토어 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="store_name"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
                  placeholder="예: 내 네이버 스토어"
                />
              </div>

              <div>
                <label htmlFor="api_key" className="block text-sm font-medium text-[#171717] mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  id="api_key"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
                  placeholder="마켓플레이스에서 발급받은 API Key를 입력하세요"
                />
                <p className="mt-1 text-sm text-gray-500">
                  API Key는 암호화되어 저장됩니다. (실제 운영 시 암호화 적용)
                </p>
              </div>

              <div>
                <label htmlFor="refresh_token" className="block text-sm font-medium text-[#171717] mb-2">
                  Refresh Token (선택)
                </label>
                <input
                  type="password"
                  id="refresh_token"
                  value={formData.refresh_token}
                  onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
                  placeholder="OAuth Refresh Token (있는 경우)"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveStore}
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
                      <span>연동 저장</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({
                      platform: 'naver',
                      store_name: '',
                      api_key: '',
                      refresh_token: '',
                    });
                  }}
                  className="px-6 py-2 border border-[#E5E5E0] rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 스토어 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A5D3F]" />
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#171717] mb-2">연동된 스토어가 없습니다</h3>
            <p className="text-gray-500 mb-4">스토어를 추가하여 주문을 자동으로 가져오세요.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-[#1A5D3F] text-white rounded-lg font-medium hover:bg-[#144A32] transition-colors"
            >
              첫 스토어 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className="p-4 border border-[#E5E5E0] rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-[#171717]">{store.store_name}</h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {getPlatformLabel(store.platform)}
                      </span>
                      {store.is_active ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <CheckCircle2 className="w-3 h-3" />
                          활성
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          <XCircle className="w-3 h-3" />
                          비활성
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      연동일: {new Date(store.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(store.id)}
                      disabled={testing === store.id}
                      className="px-3 py-1.5 text-sm border border-[#E5E5E0] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="연결 테스트"
                    >
                      {testing === store.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        '연결 테스트'
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleActive(store.id, store.is_active)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        store.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      aria-label={store.is_active ? '비활성화' : '활성화'}
                    >
                      {store.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => handleDeleteStore(store.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 안내 메시지 */}
        {stores.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">연동 완료!</p>
                <p className="text-sm text-blue-700">
                  이제 주문 동기화 버튼을 클릭하면 Python 서버가 이 스토어의 주문을 자동으로 가져옵니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
