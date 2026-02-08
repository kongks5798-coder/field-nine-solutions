/**
 * Field Nine: Meta (Facebook/Instagram) 광고 커넥터
 * 
 * 비동기 리포팅 API 패턴 사용
 */
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AdConnector, DateRange, SyncResult } from '../../core/interfaces/ad-connector.interface';
import { AdPlatform } from '../../core/enums/ad-platform.enum';

@Injectable()
export class MetaConnector implements AdConnector {
  readonly platform = AdPlatform.META;
  private readonly logger = new Logger(MetaConnector.name);

  constructor(private readonly httpService: HttpService) {}

  async syncStructure(tenantId: string, accountId: string): Promise<SyncResult> {
    try {
      this.logger.log(`[${tenantId}] Syncing Meta structure for account ${accountId}`);

      // 1. 캠페인 조회
      const campaigns = await this.fetchCampaigns(accountId);
      
      // 2. 광고 세트 조회
      const adsets = await this.fetchAdSets(accountId);
      
      // 3. 광고 조회
      const ads = await this.fetchAds(accountId);

      // 4. PostgreSQL에 구조 저장 (Schema-per-Tenant)
      // TODO: TypeORM으로 tenant schema에 저장

      return {
        success: true,
        recordsProcessed: campaigns.length + adsets.length + ads.length,
      };
    } catch (error) {
      this.logger.error(`[${tenantId}] Meta structure sync failed:`, error);
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
      this.logger.log(`[${tenantId}] Syncing Meta performance for account ${accountId}`);

      // 1. 비동기 리포트 요청
      const reportRunId = await this.requestAsyncReport(accountId, dateRange);

      // 2. 리포트 완료 대기 (폴링)
      await this.waitForReportCompletion(reportRunId);

      // 3. 리포트 다운로드
      const reportData = await this.downloadReport(reportRunId);

      // 4. UMDM으로 정규화
      const normalizedData = this.normalizeToUMDM(reportData, tenantId, accountId);

      // 5. ClickHouse에 배치 삽입
      // TODO: ClickHouse client로 배치 삽입

      return {
        success: true,
        recordsProcessed: normalizedData.length,
      };
    } catch (error) {
      this.logger.error(`[${tenantId}] Meta performance sync failed:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateAuth(credentials: any): Promise<boolean> {
    try {
      const accessToken = credentials.accessToken;
      const response = await firstValueFrom(
        this.httpService.get(`https://graph.facebook.com/v19.0/me`, {
          params: { access_token: accessToken },
        })
      );
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * 비동기 리포트 요청
   */
  private async requestAsyncReport(accountId: string, dateRange: DateRange): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post(`https://graph.facebook.com/v19.0/${accountId}/insights`, {
        level: 'ad',
        fields: ['impressions', 'clicks', 'spend', 'actions', 'action_values'],
        time_range: {
          since: dateRange.start.toISOString().split('T')[0],
          until: dateRange.end.toISOString().split('T')[0],
        },
      })
    );
    return response.data.report_run_id;
  }

  /**
   * 리포트 완료 대기 (폴링)
   */
  private async waitForReportCompletion(reportRunId: string, maxAttempts = 60): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await firstValueFrom(
        this.httpService.get(`https://graph.facebook.com/v19.0/${reportRunId}`)
      );
      
      if (response.data.async_percent_completion === 100) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
    }
    throw new Error('Report generation timeout');
  }

  /**
   * 리포트 다운로드
   */
  private async downloadReport(reportRunId: string): Promise<any[]> {
    const response = await firstValueFrom(
      this.httpService.get(`https://graph.facebook.com/v19.0/${reportRunId}/insights`)
    );
    return response.data.data || [];
  }

  /**
   * UMDM으로 정규화
   */
  private normalizeToUMDM(
    data: any[],
    tenantId: string,
    accountId: string
  ): any[] {
    return data.map((row) => ({
      tenant_id: tenantId,
      platform: 'meta',
      account_id: accountId,
      campaign_id: row.campaign_id,
      adset_id: row.adset_id,
      ad_id: row.ad_id,
      date: row.date_start,
      impressions: parseInt(row.impressions || '0', 10),
      clicks: parseInt(row.clicks || '0', 10),
      spend: parseFloat(row.spend || '0'),
      conversions: this.extractConversions(row.actions),
      revenue: this.extractRevenue(row.action_values),
      campaign_name: row.campaign_name,
      adset_name: row.adset_name,
      ad_name: row.ad_name,
    }));
  }

  private extractConversions(actions: any[]): number {
    if (!actions) return 0;
    const purchase = actions.find((a: any) => a.action_type === 'purchase');
    return purchase ? parseInt(purchase.value || '0', 10) : 0;
  }

  private extractRevenue(actionValues: any[]): number {
    if (!actionValues) return 0;
    const purchase = actionValues.find((a: any) => a.action_type === 'purchase');
    return purchase ? parseFloat(purchase.value || '0') : 0;
  }

  private async fetchCampaigns(accountId: string): Promise<any[]> {
    // TODO: Meta API로 캠페인 조회
    return [];
  }

  private async fetchAdSets(accountId: string): Promise<any[]> {
    // TODO: Meta API로 광고 세트 조회
    return [];
  }

  private async fetchAds(accountId: string): Promise<any[]> {
    // TODO: Meta API로 광고 조회
    return [];
  }
}
