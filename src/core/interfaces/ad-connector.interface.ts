/**
 * Field Nine: 통합 마케팅 분석 SaaS
 * 
 * AdConnector Interface - 모든 광고 플랫폼의 공통 인터페이스
 * 
 * 헥사고날 아키텍처: 비즈니스 로직과 외부 의존성 분리
 */

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  error?: string;
}

/**
 * 모든 광고 매체가 구현해야 하는 공통 인터페이스
 * 
 * OCP (Open-Closed Principle): 새로운 플랫폼 추가 시 기존 코드 수정 없이 확장
 */
export interface AdConnector {
  /**
   * 계정 구조(캠페인-광고세트-광고)를 동기화합니다.
   * 
   * @param tenantId - 테넌트 식별자
   * @param accountId - 광고 매체 계정 ID
   * @returns 동기화 결과
   */
  syncStructure(tenantId: string, accountId: string): Promise<SyncResult>;

  /**
   * 특정 기간의 성과 데이터(노출, 클릭, 비용 등)를 동기화합니다.
   * 
   * @param tenantId - 테넌트 식별자
   * @param accountId - 광고 매체 계정 ID
   * @param dateRange - 조회 기간 (시작일, 종료일)
   * @returns 동기화 결과
   */
  syncPerformance(
    tenantId: string,
    accountId: string,
    dateRange: DateRange
  ): Promise<SyncResult>;

  /**
   * 인증 토큰의 유효성을 검사하고 필요 시 갱신합니다.
   * 
   * @param credentials - 인증 정보 (OAuth tokens, API keys 등)
   * @returns 인증 유효성
   */
  validateAuth(credentials: any): Promise<boolean>;

  /**
   * 플랫폼 식별자
   */
  readonly platform: string;
}
