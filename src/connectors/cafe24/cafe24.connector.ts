/**
 * Field Nine: 카페24 커머스 커넥터
 * 
 * 주문 데이터와 광고 기여 분석
 */
import { Injectable, Logger } from '@nestjs/common';
import { AdConnector, DateRange, SyncResult } from '../../core/interfaces/ad-connector.interface';
import { AdPlatform } from '../../core/enums/ad-platform.enum';

@Injectable()
export class Cafe24Connector implements AdConnector {
  readonly platform = AdPlatform.CAFE24;
  private readonly logger = new Logger(Cafe24Connector.name);

  async syncStructure(tenantId: string, accountId: string): Promise<SyncResult> {
    try {
      this.logger.log(`[${tenantId}] Syncing Cafe24 structure for account ${accountId}`);

      // 카페24는 구조가 없으므로 스킵
      return {
        success: true,
        recordsProcessed: 0,
      };
    } catch (error) {
      this.logger.error(`[${tenantId}] Cafe24 structure sync failed:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async syncPerformance(
    tenantId: string,
    accountId: string,
    dateRange: DateRange
  ): Promise<SyncResult> {
    try {
      this.logger.log(`[${tenantId}] Syncing Cafe24 orders for account ${accountId}`);

      // TODO: 카페24 OAuth 2.0 인증
      // TODO: GET /orders API로 주문 데이터 수집
      // TODO: UTM 파라미터 파싱하여 광고 기여 분석
      // TODO: ClickHouse에 매출 데이터 저장

      return {
        success: true,
        recordsProcessed: 0,
      };
    } catch (error) {
      this.logger.error(`[${tenantId}] Cafe24 performance sync failed:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateAuth(credentials: any): Promise<boolean> {
    try {
      const { accessToken } = credentials;
      if (!accessToken) return false;

      // TODO: 카페24 API로 토큰 검증
      // GET /oauth/token/validate
      return true;
    } catch {
      return false;
    }
  }

  /**
   * UTM 파라미터에서 광고 캠페인 추출
   * 기여 분석(Attribution)을 위한 핵심 로직
   */
  extractCampaignFromUTM(referer: string, additionalInfo: any): string | null {
    try {
      const url = new URL(referer);
      const utmSource = url.searchParams.get('utm_source');
      const utmCampaign = url.searchParams.get('utm_campaign');
      
      if (utmSource === 'fieldnine' && utmCampaign) {
        return utmCampaign;
      }
      return null;
    } catch {
      return null;
    }
  }
}
