/**
 * 공통 API 응답 타입 정의
 */

// 에러 응답
export interface ApiError {
  error: string;
  code?: string;
}

// 성공 응답
export interface ApiSuccess<T = void> {
  message?: string;
  data?: T;
}

// 프로젝트
export interface Project {
  id: string;
  user_id: string;
  name: string;
  files: Record<string, ProjectFile>;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  name: string;
  language: string;
  content: string;
}

// 발행된 앱
export interface PublishedApp {
  slug: string;
  name: string;
  html: string;
  views: number;
  user_id: string;
  created_at: string;
}

// 구독
export interface Subscription {
  id: string;
  user_id: string;
  plan: 'pro' | 'team';
  status: 'active' | 'canceled' | 'past_due' | 'cancel_at_period_end' | 'refunded';
  stripe_subscription_id?: string;
  toss_payment_key?: string;
  toss_order_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
}

// 청구 이벤트
export interface BillingEvent {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

// 월별 사용량
export interface MonthlyUsage {
  billing_period: string;
  ai_calls: number;
  amount_krw: number;
  status: string;
  stripe_invoice_id?: string;
}

// 사용량 요약
export interface UsageSummary {
  amount_krw: number;
  ai_calls: number;
  status: string;
  monthly_limit: number;
  warn_threshold: number;
  hard_limit: number;
}

// 도메인
export interface Domain {
  id: string;
  user_id: string;
  domain: string;
  status: 'pending' | 'active' | 'failed';
  ssl_status: 'pending' | 'active' | 'failed';
  created_at: string;
}

// 관리자 - 사용자
export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  created_at: string;
}

// 포크 응답
export interface ForkResponse {
  projectId: string;
  name: string;
}

// LM 모델
export interface LMModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'ollama';
  context: string;
  size?: number;
}

// 이미지 생성
export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}
