/**
 * Field Nine: ClickHouse 클라이언트
 * 
 * 대용량 마케팅 성과 데이터 분석
 */
import { createClient, ClickHouseClient } from '@clickhouse/client';

let client: ClickHouseClient | null = null;

export function getClickHouseClient(): ClickHouseClient {
  if (!client) {
    client = createClient({
      host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
      database: process.env.CLICKHOUSE_DATABASE || 'fieldnine_analytics',
    });
  }
  return client;
}

/**
 * 마케팅 성과 데이터 배치 삽입
 */
export async function insertMarketingFacts(data: any[]): Promise<void> {
  const clickhouse = getClickHouseClient();
  
  await clickhouse.insert({
    table: 'marketing_facts',
    values: data,
    format: 'JSONEachRow',
  });
}

/**
 * 테넌트별 집계 쿼리
 */
export async function queryMarketingAnalytics(
  tenantId: string,
  startDate: string,
  endDate: string,
  platform?: string
): Promise<any> {
  const clickhouse = getClickHouseClient();
  
  let query = `
    SELECT
      platform,
      sum(impressions) as impressions,
      sum(clicks) as clicks,
      sum(spend) as spend,
      sum(conversions) as conversions,
      sum(revenue) as revenue,
      sum(revenue) / sum(spend) as roas
    FROM marketing_facts_daily
    WHERE tenant_id = {tenantId:UUID}
      AND date >= {startDate:Date}
      AND date <= {endDate:Date}
  `;
  
  if (platform) {
    query += ` AND platform = {platform:String}`;
  }
  
  query += `
    GROUP BY platform
    ORDER BY spend DESC
  `;
  
  const result = await clickhouse.query({
    query,
    query_params: {
      tenantId,
      startDate,
      endDate,
      ...(platform && { platform }),
    },
    format: 'JSON',
  });
  
  return await result.json();
}
