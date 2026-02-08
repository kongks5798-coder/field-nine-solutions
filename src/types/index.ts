/**
 * 프로젝트 전역 타입 정의
 * 프론트엔드와 백엔드가 엄격히 따르는 공통 타입
 */

/**
 * 대시보드 통계 데이터 타입
 * API 응답과 프론트엔드 컴포넌트가 공유하는 타입
 */
export interface DashboardStatsData {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  orders: {
    total: number;
    by_status: {
      PAID: number;
      PREPARING: number;
      SHIPPED: number;
      DELIVERED: number;
      CANCELLED: number;
      [key: string]: number; // Allow other statuses
    };
  };
  revenue: {
    total_amount: number;
    total_cost: number;
    platform_fee?: number; // 플랫폼 수수료
    shipping_fee?: number; // 배송비
    net_profit: number;
    profit_rate: number;
  };
  daily_stats: Array<{
    date: string; // YYYY-MM-DD 형식
    orders_count: number;
    revenue: number;
    profit: number;
  }>;
  today: {
    orders_count: number;
    revenue: number;
    profit: number;
    preparing: number;
    cancelled: number;
  };
  expected_settlement: number;
  low_stock_products?: Array<{
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
  }>;
}

/**
 * 주문 데이터 타입
 */
export interface Order {
  id: string;
  user_id: string;
  store_id?: string;
  market_order_id: string;
  order_date: string;
  customer_name: string;
  customer_email?: string;
  total_amount: number;
  status: 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 스토어 데이터 타입
 */
export interface Store {
  id: string;
  user_id: string;
  platform: 'naver' | 'coupang' | '11st' | 'gmarket' | 'auction' | 'shopify' | 'woocommerce' | 'custom';
  store_name: string;
  api_key?: string; // 암호화된 값
  refresh_token?: string; // 암호화된 값
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 주문 동기화 요청 타입 (Python 서버 → Next.js API)
 */
export interface OrderSyncRequest {
  orders: OrderData[];
  store_id?: string;
}

export interface OrderData {
  market_order_id: string;
  store_id?: string;
  order_date: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address: string;
  shipping_address_detail?: string;
  shipping_postcode?: string;
  shipping_memo?: string;
  product_amount: number;
  shipping_fee: number;
  discount_amount: number;
  platform_fee: number;
  payment_fee: number;
  total_amount: number;
  status: 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  tracking_number?: string;
  items: OrderItemData[];
}

export interface OrderItemData {
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost?: number;
  option_name?: string;
}

/**
 * Python 서버 동기화 요청 타입 (Next.js → Python)
 */
export interface PythonSyncRequest {
  platform: string;
  api_key: string;
  store_id: string;
}

/**
 * Python 서버 동기화 응답 타입
 */
export interface PythonSyncResponse {
  success: boolean;
  orders?: OrderData[];
  error?: string;
  message?: string;
}
