"use client";

import { createClient } from '@/src/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Package, Search, Filter, Download, Loader2, Edit, Trash2, Check, X, ChevronDown } from 'lucide-react';
import Toast from '@/app/components/Toast';
import { logger } from '@/src/utils/logger';
import { decrypt } from '@/src/utils/security';

interface Order {
  id: string;
  external_order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkSessionAndLoadOrders();
  }, []);

  const checkSessionAndLoadOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/dashboard/orders');
        return;
      }
      await loadOrders();
    } catch (error) {
      logger.error("세션 확인 오류", error as Error);
      router.push('/login?redirect=/dashboard/orders');
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      setOrders(data || []);
      logger.info("주문 목록 로드 완료", { count: data?.length || 0 });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("주문 목록 로드 실패", err as Error);
      setToast({ message: "주문 목록을 불러오는데 실패했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOrders = async () => {
    try {
      setSyncing(true);

      // 1. DB에서 유저의 활성화된 스토어와 API Key 조회
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setToast({ message: "로그인이 필요합니다.", type: "error" });
        router.push('/login?redirect=/dashboard/orders');
        return;
      }

      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, platform, store_name, api_key, is_active')
        .eq('user_id', session.user.id)
        .eq('is_active', true);

      if (storesError) {
        throw new Error(`스토어 조회 실패: ${storesError.message}`);
      }

      if (!stores || stores.length === 0) {
        setToast({ 
          message: "연동된 스토어가 없습니다. 설정 페이지에서 스토어를 먼저 연동해주세요.", 
          type: "error" 
        });
        router.push('/dashboard/settings');
        return;
      }

      // 2. 각 스토어에 대해 Python 서버로 주문 동기화 요청
      const pythonServerUrl = process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || 'http://localhost:8000';
      const syncResults = [];

      for (const store of stores) {
        if (!store.api_key) {
          logger.warn(`[Orders Sync] 스토어 ${store.store_name}의 API Key가 없습니다.`);
          continue;
        }

        try {
          // API Key 복호화
          const decryptedApiKey = decrypt(store.api_key);

          // Python 서버로 주문 동기화 요청
          const pythonResponse = await fetch(`${pythonServerUrl}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              platform: store.platform,
              api_key: decryptedApiKey,
              store_id: store.id,
            }),
          });

          if (!pythonResponse.ok) {
            throw new Error(`Python 서버 오류: ${pythonResponse.status}`);
          }

          const pythonData = await pythonResponse.json();

          if (!pythonData.success || !pythonData.orders) {
            throw new Error(pythonData.error || 'Python 서버에서 주문 데이터를 반환하지 않았습니다.');
          }

          // 3. Python 서버에서 받은 주문 데이터를 Next.js API로 전달하여 DB에 저장
          const syncResponse = await fetch('/api/orders/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orders: pythonData.orders,
              store_id: store.id,
            }),
          });

          if (!syncResponse.ok) {
            throw new Error(`주문 저장 실패: ${syncResponse.status}`);
          }

          const syncData = await syncResponse.json();

          if (!syncData.success) {
            throw new Error(syncData.error || '주문 저장 실패');
          }

          syncResults.push({
            store_name: store.store_name,
            success: true,
            count: syncData.results?.success || 0,
          });

          logger.info(`[Orders Sync] ${store.store_name} 동기화 성공: ${syncData.results?.success || 0}건`);
        } catch (storeError: unknown) {
          const err = storeError as { message?: string };
          syncResults.push({
            store_name: store.store_name,
            success: false,
            error: err.message || '알 수 없는 오류',
          });
          logger.error(`[Orders Sync] ${store.store_name} 동기화 실패:`, err as Error);
        }
      }

      // 4. 결과 요약
      const successCount = syncResults.filter(r => r.success).length;
      const totalCount = syncResults.reduce((sum, r) => sum + (r.count || 0), 0);

      if (successCount === 0) {
        setToast({ 
          message: `모든 스토어 동기화 실패. ${syncResults[0]?.error || '알 수 없는 오류'}`, 
          type: "error" 
        });
      } else if (successCount < syncResults.length) {
        setToast({ 
          message: `${successCount}개 스토어 동기화 성공, ${totalCount}건의 주문이 추가되었습니다. 일부 스토어는 실패했습니다.`, 
          type: "info" 
        });
      } else {
        setToast({ 
          message: `모든 스토어 동기화 완료! 총 ${totalCount}건의 주문이 추가되었습니다.`, 
          type: "success" 
        });
      }

      // 5. 주문 목록 새로고침
      await loadOrders();
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("주문 동기화 실패", err as Error);
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setToast({ 
          message: "Python 서버 연결에 실패했습니다. Python 서버가 실행 중인지 확인해주세요. (기본: http://localhost:8000)", 
          type: "error" 
        });
      } else {
        setToast({ message: `동기화 중 오류 발생: ${err.message || '알 수 없는 오류'}`, type: "error" });
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      setToast({ message: "주문 상태가 업데이트되었습니다.", type: "success" });
      await loadOrders();
      setStatusDropdownOpen(null);
      logger.info("주문 상태 업데이트 성공", { orderId, newStatus });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("주문 상태 업데이트 실패", err as Error);
      setToast({ message: `상태 업데이트 실패: ${err.message || '알 수 없는 오류'}`, type: "error" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("정말 이 주문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    try {
      setDeletingOrder(orderId);
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      setToast({ message: "주문이 삭제되었습니다.", type: "success" });
      await loadOrders();
      logger.info("주문 삭제 성공", { orderId });
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error("주문 삭제 실패", err as Error);
      setToast({ message: `삭제 실패: ${err.message || '알 수 없는 오류'}`, type: "error" });
    } finally {
      setDeletingOrder(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.external_order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      picked: 'bg-purple-100 text-purple-800',
      packed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '대기 중',
      processing: '처리 중',
      picked: '픽업 완료',
      packed: '포장 완료',
      shipped: '배송 중',
      delivered: '배송 완료',
      cancelled: '취소됨',
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusOptions = [
    { value: 'pending', label: '대기 중' },
    { value: 'processing', label: '처리 중' },
    { value: 'picked', label: '픽업 완료' },
    { value: 'packed', label: '포장 완료' },
    { value: 'shipped', label: '배송 중' },
    { value: 'delivered', label: '배송 완료' },
    { value: 'cancelled', label: '취소됨' },
  ];

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#171717] mb-2">주문 동기화</h1>
              <p className="text-[#6B6B6B]">외부 주문을 동기화하고 관리하세요</p>
            </div>
            <button
              onClick={handleSyncOrders}
              disabled={syncing}
              className="flex items-center gap-2 px-6 py-3 bg-[#1A5D3F] text-white rounded-lg font-medium hover:bg-[#144A32] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>동기화 중...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>주문 동기화</span>
                </>
              )}
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="주문번호, 고객명, 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기 중</option>
                <option value="processing">처리 중</option>
                <option value="picked">픽업 완료</option>
                <option value="packed">포장 완료</option>
                <option value="shipped">배송 중</option>
                <option value="delivered">배송 완료</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* 주문 목록 */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#171717] mb-2">
              {orders.length === 0 ? "동기화된 주문이 없습니다" : "검색 결과가 없습니다"}
            </h3>
            <p className="text-gray-600 mb-6">
              {orders.length === 0 
                ? "주문 동기화 버튼을 클릭하여 외부 쇼핑몰 주문을 가져오세요."
                : "다른 검색어나 필터를 시도해보세요."}
            </p>
            {orders.length === 0 && (
              <button
                onClick={handleSyncOrders}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A5D3F] text-white rounded-lg font-medium hover:bg-[#144A32] transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-5 h-5" />
                <span>주문 동기화 시작하기</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      주문번호
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고객 정보
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      주문일시
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#171717]">
                          {order.external_order_id}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm text-[#171717]">{order.customer_name}</div>
                        {order.customer_email && (
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#171717]">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={() => setStatusDropdownOpen(statusDropdownOpen === order.id ? null : order.id)}
                            disabled={updatingStatus === order.id}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-[#1A5D3F] disabled:opacity-50"
                          >
                            <span className={`px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                            {updatingStatus !== order.id && (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            {updatingStatus === order.id && (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            )}
                          </button>
                          {statusDropdownOpen === order.id && (
                            <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
                              {statusOptions.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => handleUpdateStatus(order.id, option.value)}
                                  disabled={updatingStatus === order.id || order.status === option.value}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            disabled={deletingOrder === order.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="주문 삭제"
                          >
                            {deletingOrder === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 통계 */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">총 주문 수</div>
              <div className="text-2xl font-bold text-[#171717]">{orders.length}</div>
            </div>
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">총 매출</div>
              <div className="text-2xl font-bold text-[#171717]">
                {formatCurrency(orders.reduce((sum, order) => sum + order.total_amount, 0))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">처리 중</div>
              <div className="text-2xl font-bold text-[#171717]">
                {orders.filter(o => o.status === 'processing').length}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">대기 중</div>
              <div className="text-2xl font-bold text-[#171717]">
                {orders.filter(o => o.status === 'pending').length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
