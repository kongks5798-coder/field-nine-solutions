"use client";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Loader2, Edit, Trash2 } from 'lucide-react';
import { logger } from '@/src/utils/logger';

interface Order {
  id: string;
  order_number: string;
  market_order_id: string;
  market_order_number?: string;
  status: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  total_amount: number;
  net_profit: number;
  profit_rate: number;
  ordered_at: string;
  store_id?: string;
}

interface OrdersDataTableProps {
  orders: Order[];
  loading?: boolean;
  onStatusUpdate?: (orderId: string, newStatus: string) => Promise<void>;
  onDelete?: (orderId: string) => Promise<void>;
}

export default function OrdersDataTable({
  orders,
  loading = false,
  onStatusUpdate,
  onDelete,
}: OrdersDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready_to_ship: 'bg-indigo-100 text-indigo-800',
      shipping: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-red-100 text-red-800',
      exchanged: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '대기',
      confirmed: '확인',
      preparing: '준비중',
      ready_to_ship: '배송준비',
      shipping: '배송중',
      delivered: '배송완료',
      cancelled: '취소',
      refunded: '환불',
      exchanged: '교환',
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'order_number',
        header: '주문번호',
        cell: ({ row }) => (
          <div className="font-medium text-[#171717]">{row.getValue('order_number')}</div>
        ),
      },
      {
        accessorKey: 'market_order_number',
        header: '외부 주문번호',
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">
            {row.getValue('market_order_number') || row.original.market_order_id}
          </div>
        ),
      },
      {
        accessorKey: 'customer_name',
        header: '고객명',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-[#171717]">{row.getValue('customer_name')}</div>
            {row.original.customer_email && (
              <div className="text-sm text-gray-500">{row.original.customer_email}</div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: '금액',
        cell: ({ row }) => (
          <div className="font-medium text-[#171717]">
            {formatCurrency(row.getValue('total_amount'))}
          </div>
        ),
      },
      {
        accessorKey: 'net_profit',
        header: '순이익',
        cell: ({ row }) => {
          const profit = row.getValue('net_profit') as number;
          const profitRate = row.original.profit_rate;
          return (
            <div>
              <div className="font-medium text-[#10B981]">{formatCurrency(profit)}</div>
              <div className="text-xs text-gray-500">{profitRate.toFixed(1)}%</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: '상태',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          return (
            <div className="relative inline-block text-left">
              <select
                value={status}
                onChange={(e) => {
                  if (onStatusUpdate) {
                    setUpdatingStatus(row.original.id);
                    onStatusUpdate(row.original.id, e.target.value)
                      .finally(() => setUpdatingStatus(null));
                  }
                }}
                disabled={updatingStatus === row.original.id}
                className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(
                  status
                )} focus:outline-none focus:ring-2 focus:ring-[#1A5D3F] disabled:opacity-50`}
              >
                <option value="pending">대기</option>
                <option value="confirmed">확인</option>
                <option value="preparing">준비중</option>
                <option value="ready_to_ship">배송준비</option>
                <option value="shipping">배송중</option>
                <option value="delivered">배송완료</option>
                <option value="cancelled">취소</option>
                <option value="refunded">환불</option>
                <option value="exchanged">교환</option>
              </select>
              {updatingStatus === row.original.id && (
                <Loader2 className="w-3 h-3 animate-spin ml-1 inline-block" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'ordered_at',
        header: '주문일시',
        cell: ({ row }) => (
          <div className="text-sm text-gray-600">{formatDate(row.getValue('ordered_at'))}</div>
        ),
      },
      {
        id: 'actions',
        header: '작업',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onDelete && confirm('정말 이 주문을 삭제하시겠습니까?')) {
                  setDeletingOrder(row.original.id);
                  onDelete(row.original.id).finally(() => setDeletingOrder(null));
                }
              }}
              disabled={deletingOrder === row.original.id}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="주문 삭제"
            >
              {deletingOrder === row.original.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ),
      },
    ],
    [onStatusUpdate, onDelete, updatingStatus, deletingOrder]
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A5D3F]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="주문번호, 고객명, 이메일로 검색..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={(table.getColumn('status')?.getFilterValue() as string) || 'all'}
            onChange={(e) => {
              const column = table.getColumn('status');
              if (e.target.value === 'all') {
                column?.setFilterValue(undefined);
              } else {
                column?.setFilterValue(e.target.value);
              }
            }}
            className="pl-10 pr-4 py-2 border border-[#E5E5E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5D3F]"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기</option>
            <option value="confirmed">확인</option>
            <option value="preparing">준비중</option>
            <option value="ready_to_ship">배송준비</option>
            <option value="shipping">배송중</option>
            <option value="delivered">배송완료</option>
            <option value="cancelled">취소</option>
            <option value="refunded">환불</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="text-gray-400">
                              {{
                                asc: <ChevronUp className="w-4 h-4" />,
                                desc: <ChevronDown className="w-4 h-4" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronDown className="w-4 h-4 opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#E5E5E0] flex items-center justify-between">
          <div className="text-sm text-gray-600">
            총 {table.getFilteredRowModel().rows.length}개 중{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            개 표시
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border border-[#E5E5E0] rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border border-[#E5E5E0] rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
