"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import SidebarLayout from "@/components/layout/SidebarLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/src/utils/supabase/client"
import {
  RefreshCw,
  Package,
  Search,
  Loader2,
  Eye,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Box,
  AlertCircle,
} from "lucide-react"
import { logger } from "@/src/utils/logger"
import { decrypt } from "@/src/utils/security"

/**
 * Order Interface
 * Matches Supabase orders table schema
 */
interface Order {
  id: string
  market_order_id: string
  customer_name: string
  total_amount: number
  status: "PAID" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED"
  order_date: string
  tracking_number?: string | null
  created_at: string
  updated_at: string
  store_id?: string | null
}

/**
 * Order Detail Interface (with items)
 */
interface OrderDetail extends Order {
  order_items?: Array<{
    id: string
    product_name: string
    quantity: number
    unit_price: number
    subtotal: number
  }>
}

/**
 * Orders Management Page
 * 
 * Features:
 * - View all orders from Supabase
 * - Search and filter orders
 * - Update order status
 * - View order details
 * - Sync orders from external platforms
 */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Load orders on mount
  useEffect(() => {
    checkSessionAndLoadOrders()
  }, [])

  const checkSessionAndLoadOrders = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login?redirect=/dashboard/orders")
        return
      }
      await loadOrders()
    } catch (error) {
      logger.error("세션 확인 오류", error as Error)
      router.push("/login?redirect=/dashboard/orders")
    }
  }

  // Load orders from Supabase with timeout and error handling
  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("로그인이 필요합니다")
      }

      // Add timeout for network requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.")), 10000)
      )

      const fetchPromise = supabase
        .from("orders")
        .select("*")
        .eq("user_id", session.user.id)
        .order("order_date", { ascending: false })
        .limit(200)

      const { data, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as { data: any; error: any }

      if (fetchError) {
        throw fetchError
      }

      // Edge Case: Handle null/undefined data
      if (!data) {
        setOrders([])
        logger.info("주문 목록이 비어있습니다")
        return
      }

      // Transform data to match Order interface with null safety
      const transformedData: Order[] = (Array.isArray(data) ? data : [])
        .filter((order: any) => order && order.id) // Filter out invalid orders
        .map((order: any) => ({
          id: order.id || "",
          market_order_id: order.market_order_id || order.external_order_id || "",
          customer_name: order.customer_name || "고객명 없음",
          total_amount: Number(order.total_amount || 0),
          status: (order.status || "PAID") as Order["status"],
          order_date: order.order_date || order.created_at || new Date().toISOString(),
          tracking_number: order.tracking_number || null,
          created_at: order.created_at || new Date().toISOString(),
          updated_at: order.updated_at || new Date().toISOString(),
          store_id: order.store_id || null,
        }))

      setOrders(transformedData)
      logger.info("주문 목록 로드 완료", { count: transformedData.length })
    } catch (err: unknown) {
      const error = err as { message?: string }
      logger.error("주문 목록 로드 실패", error as Error)
      
      // User-friendly error messages
      let errorMessage = "주문 목록을 불러오는데 실패했습니다"
      if (error.message?.includes("시간이 초과")) {
        errorMessage = "네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요."
      } else if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        errorMessage = "인터넷 연결을 확인해주세요."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      setOrders([]) // Set empty array on error to prevent UI breakage
    } finally {
      setLoading(false)
    }
  }

  // Sync orders from external platforms
  const handleSyncOrders = async () => {
    try {
      setSyncing(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError("로그인이 필요합니다")
        router.push("/login?redirect=/dashboard/orders")
        return
      }

      // Get active stores
      const { data: stores, error: storesError } = await supabase
        .from("stores")
        .select("id, platform, store_name, api_key, is_active")
        .eq("user_id", session.user.id)
        .eq("is_active", true)

      if (storesError) {
        throw new Error(`스토어 조회 실패: ${storesError.message}`)
      }

      if (!stores || stores.length === 0) {
        setError("연동된 스토어가 없습니다. 설정 페이지에서 스토어를 먼저 연동해주세요.")
        setTimeout(() => router.push("/dashboard/settings"), 2000)
        return
      }

      // Sync from Python server
      const pythonServerUrl =
        process.env.NEXT_PUBLIC_PYTHON_SERVER_URL || "http://localhost:8000"
      const syncResults = []

      for (const store of stores) {
        if (!store.api_key) {
          logger.warn(`[Orders Sync] 스토어 ${store.store_name}의 API Key가 없습니다.`)
          continue
        }

        try {
          const decryptedApiKey = decrypt(store.api_key)

          // Add timeout for Python server requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30초 타임아웃

          const pythonResponse = await fetch(`${pythonServerUrl}/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              platform: store.platform,
              api_key: decryptedApiKey,
              store_id: store.id,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!pythonResponse.ok) {
            throw new Error(`Python 서버 오류: ${pythonResponse.status}`)
          }

          const pythonData = await pythonResponse.json()

          if (!pythonData.success || !pythonData.orders) {
            throw new Error(
              pythonData.error || "Python 서버에서 주문 데이터를 반환하지 않았습니다."
            )
          }

          // Save to database with timeout
          const syncController = new AbortController()
          const syncTimeoutId = setTimeout(() => syncController.abort(), 30000)

          const syncResponse = await fetch("/api/orders/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orders: pythonData.orders || [], // Edge Case: Handle empty orders array
              store_id: store.id,
            }),
            signal: syncController.signal,
          })

          clearTimeout(syncTimeoutId)

          if (!syncResponse.ok) {
            throw new Error(`주문 저장 실패: ${syncResponse.status}`)
          }

          const syncData = await syncResponse.json()

          if (!syncData.success) {
            throw new Error(syncData.error || "주문 저장 실패")
          }

          syncResults.push({
            store_name: store.store_name,
            success: true,
            count: syncData.results?.success || 0,
          })

          logger.info(
            `[Orders Sync] ${store.store_name} 동기화 성공: ${syncData.results?.success || 0}건`
          )
        } catch (storeError: unknown) {
          const err = storeError as { message?: string }
          syncResults.push({
            store_name: store.store_name,
            success: false,
            error: err.message || "알 수 없는 오류",
          })
          logger.error(`[Orders Sync] ${store.store_name} 동기화 실패:`, err as Error)
        }
      }

      const successCount = syncResults.filter((r) => r.success).length
      const totalCount = syncResults.reduce((sum, r) => sum + (r.count || 0), 0)

      if (successCount === 0) {
        setError(
          `모든 스토어 동기화 실패. ${syncResults[0]?.error || "알 수 없는 오류"}`
        )
      } else if (successCount < syncResults.length) {
        setError(
          `${successCount}개 스토어 동기화 성공, ${totalCount}건 추가. 일부 스토어는 실패했습니다.`
        )
      } else {
        // Success - reload orders
        await loadOrders()
      }
    } catch (err: unknown) {
      const error = err as { message?: string; name?: string }
      logger.error("주문 동기화 실패", error as Error)
      
      // Edge Case: Handle different error types
      if (error.name === "AbortError") {
        setError("요청 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.")
      } else if (
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("NetworkError") ||
        error.message?.includes("fetch")
      ) {
        setError(
          "Python 서버 연결에 실패했습니다. Python 서버가 실행 중인지 확인해주세요."
        )
      } else if (error.message?.includes("timeout") || error.message?.includes("시간")) {
        setError("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
      } else {
        setError(`동기화 중 오류 발생: ${error.message || "알 수 없는 오류"}`)
      }
    } finally {
      setSyncing(false)
    }
  }

  // Update order status
  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      setUpdatingStatus(orderId)
      setError(null)

      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (updateError) {
        throw updateError
      }

      await loadOrders()
      logger.info("주문 상태 업데이트 성공", { orderId, newStatus })
    } catch (err: unknown) {
      const error = err as { message?: string }
      logger.error("주문 상태 업데이트 실패", error as Error)
      setError(`상태 업데이트 실패: ${error.message || "알 수 없는 오류"}`)
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Load order details
  const handleViewDetails = async (order: Order) => {
    try {
      setIsDetailModalOpen(true)
      setSelectedOrder(order as OrderDetail)

      // Load order items if available
      const { data: items } = await supabase
        .from("order_items")
        .select("*, products(name)")
        .eq("order_id", order.id)

      if (items) {
        setSelectedOrder({
          ...order,
          order_items: items.map((item: any) => ({
            id: item.id,
            product_name: item.products?.name || item.product_name || "상품명 없음",
            quantity: item.quantity,
            unit_price: Number(item.unit_price),
            subtotal: Number(item.subtotal || item.quantity * item.unit_price),
          })),
        } as OrderDetail)
      }
    } catch (err: unknown) {
      logger.error("주문 상세 로드 실패", err as Error)
    }
  }

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.market_order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false

      const matchesStatus = statusFilter === "all" || order.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  // Status configuration with dark mode support
  const statusConfig: Record<
    Order["status"],
    { label: string; color: string; darkColor: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    PAID: { 
      label: "결제 완료", 
      color: "bg-blue-100 text-blue-800", 
      darkColor: "dark:bg-blue-900/30 dark:text-blue-300",
      icon: CheckCircle2 
    },
    PREPARING: { 
      label: "준비 중", 
      color: "bg-yellow-100 text-yellow-800", 
      darkColor: "dark:bg-yellow-900/30 dark:text-yellow-300",
      icon: Clock 
    },
    SHIPPED: { 
      label: "배송 중", 
      color: "bg-purple-100 text-purple-800", 
      darkColor: "dark:bg-purple-900/30 dark:text-purple-300",
      icon: Truck 
    },
    DELIVERED: { 
      label: "배송 완료", 
      color: "bg-green-100 text-green-800", 
      darkColor: "dark:bg-green-900/30 dark:text-green-300",
      icon: Box 
    },
    CANCELLED: { 
      label: "취소됨", 
      color: "bg-red-100 text-red-800", 
      darkColor: "dark:bg-red-900/30 dark:text-red-300",
      icon: XCircle 
    },
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Statistics
  const stats = useMemo(() => {
    return {
      total: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
      preparing: orders.filter((o) => o.status === "PREPARING").length,
      shipped: orders.filter((o) => o.status === "SHIPPED").length,
    }
  }, [orders])

  return (
    <SidebarLayout>
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">오류 발생</p>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
            >
              닫기
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={loadOrders}
            >
              다시 시도
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">주문 관리</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            총 {orders.length}건 · 준비 중 {stats.preparing}건
          </p>
        </div>
        <Button onClick={handleSyncOrders} disabled={syncing} className="w-full sm:w-auto">
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              동기화 중...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              주문 동기화
            </>
          )}
        </Button>
      </div>

      {/* Statistics Cards */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E5E5E0] dark:border-[#2A2A2A] shadow-sm p-4 transition-colors">
            <div className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3] mb-1">총 주문 수</div>
            <div className="text-2xl font-bold text-[#171717] dark:text-[#F5F5F5]">{stats.total}</div>
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E5E5E0] dark:border-[#2A2A2A] shadow-sm p-4 transition-colors">
            <div className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3] mb-1">총 매출</div>
            <div className="text-2xl font-bold text-[#171717] dark:text-[#F5F5F5]">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E5E5E0] dark:border-[#2A2A2A] shadow-sm p-4 transition-colors">
            <div className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3] mb-1">준비 중</div>
            <div className="text-2xl font-bold text-[#171717] dark:text-[#F5F5F5]">{stats.preparing}</div>
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E5E5E0] dark:border-[#2A2A2A] shadow-sm p-4 transition-colors">
            <div className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3] mb-1">배송 중</div>
            <div className="text-2xl font-bold text-[#171717] dark:text-[#F5F5F5]">{stats.shipped}</div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E5E5E0] dark:border-[#2A2A2A] shadow-sm p-4 mb-6 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
            <Input
              type="text"
              placeholder="주문번호, 고객명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-[#E5E5E0] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-[#171717] dark:text-[#F5F5F5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#1A5D3F] dark:focus:ring-[#2DD4BF] transition-colors"
          >
            <option value="all">전체 상태</option>
            <option value="PAID">결제 완료</option>
            <option value="PREPARING">준비 중</option>
            <option value="SHIPPED">배송 중</option>
            <option value="DELIVERED">배송 완료</option>
            <option value="CANCELLED">취소됨</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-lg border border-[#E5E5E0] dark:border-[#2A2A2A] shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="p-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#171717] dark:text-[#F5F5F5] mb-2">
              {orders.length === 0 ? "주문이 없습니다" : "검색 결과가 없습니다"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {orders.length === 0
                ? "주문 동기화 버튼을 클릭하여 외부 쇼핑몰 주문을 가져오세요."
                : "다른 검색어나 필터를 시도해보세요."}
            </p>
            {orders.length === 0 && (
              <Button onClick={handleSyncOrders} disabled={syncing}>
                <RefreshCw className="w-4 h-4 mr-2" />
                주문 동기화 시작하기
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>주문번호</TableHead>
                  <TableHead>고객명</TableHead>
                  <TableHead className="text-right">금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="hidden md:table-cell">주문일시</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status]
                  const StatusIcon = status.icon

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.market_order_id}
                      </TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const statuses: Order["status"][] = [
                                  "PAID",
                                  "PREPARING",
                                  "SHIPPED",
                                  "DELIVERED",
                                  "CANCELLED",
                                ]
                                const currentIndex = statuses.indexOf(order.status)
                                const nextIndex = (currentIndex + 1) % statuses.length
                                handleUpdateStatus(order.id, statuses[nextIndex])
                              }}
                              disabled={updatingStatus === order.id}
                              className="flex items-center gap-1"
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span className={`px-2 py-1 rounded-full text-xs ${status.color} ${status.darkColor}`}>
                                {status.label}
                              </span>
                              {updatingStatus === order.id && (
                                <Loader2 className="w-3 h-3 animate-spin ml-1" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-[#6B6B6B] text-sm">
                        {formatDate(order.order_date)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          상세
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>주문 상세</DialogTitle>
            <DialogDescription>
              주문번호: {selectedOrder?.market_order_id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">고객명</p>
                  <p className="font-medium text-[#171717] dark:text-[#F5F5F5]">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">주문일시</p>
                  <p className="font-medium text-[#171717] dark:text-[#F5F5F5]">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">상태</p>
                  <p className="font-medium text-[#171717] dark:text-[#F5F5F5]">
                    {statusConfig[selectedOrder.status].label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">총 금액</p>
                  <p className="font-medium text-lg text-[#171717] dark:text-[#F5F5F5]">
                    {formatCurrency(selectedOrder.total_amount)}
                  </p>
                </div>
                {selectedOrder.tracking_number && (
                  <div className="col-span-2">
                    <p className="text-sm text-[#6B6B6B] dark:text-[#A3A3A3]">송장번호</p>
                    <p className="font-medium text-[#171717] dark:text-[#F5F5F5]">{selectedOrder.tracking_number}</p>
                  </div>
                )}
              </div>

              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#171717] mb-2">주문 상품</p>
                  <div className="border border-[#E5E5E0] dark:border-[#2A2A2A] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>상품명</TableHead>
                          <TableHead className="text-right">수량</TableHead>
                          <TableHead className="text-right">단가</TableHead>
                          <TableHead className="text-right">소계</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.order_items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  )
}
