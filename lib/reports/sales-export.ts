/**
 * Sales Report Export Module
 * Excel 및 PDF 형식으로 매출 리포트 생성
 */

import { getSalesDashboard, getMonthSales, getMonthlySummary, getProductSales } from '@/lib/google/sales-data';

// ============================================
// Types
// ============================================

export interface ReportOptions {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  format: 'excel' | 'pdf' | 'csv';
  startDate?: string;
  endDate?: string;
  includeCharts?: boolean;
  includeProducts?: boolean;
  includeChannels?: boolean;
}

export interface ReportData {
  title: string;
  generatedAt: string;
  period: { start: string; end: string };
  summary: {
    totalGrossSales: number;
    totalNetSales: number;
    totalOrders: number;
    totalReturns: number;
    averageOrderValue: number;
    growth: number;
  };
  dailyData?: Array<{
    date: string;
    grossSales: number;
    netSales: number;
    orders: number;
    returns: number;
  }>;
  channelData?: Array<{
    channel: string;
    grossSales: number;
    netSales: number;
    orders: number;
    share: number;
  }>;
  productData?: Array<{
    rank: number;
    productName: string;
    category: string;
    quantitySold: number;
    grossSales: number;
  }>;
  monthlyTrend?: Array<{
    month: string;
    grossSales: number;
    netSales: number;
    orders: number;
  }>;
}

// ============================================
// Report Data Generation
// ============================================

export async function generateReportData(options: ReportOptions): Promise<ReportData> {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  // Determine date range based on type
  switch (options.type) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'custom':
      startDate = options.startDate ? new Date(options.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = options.endDate ? new Date(options.endDate) : now;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Fetch data
  const [dashboard, monthSales, monthlyHistory, products] = await Promise.all([
    getSalesDashboard(),
    getMonthSales(),
    getMonthlySummary(undefined, 6),
    options.includeProducts ? getProductSales(undefined, 20) : Promise.resolve([]),
  ]);

  // Calculate summary
  const summary = {
    totalGrossSales: dashboard.month.grossSales,
    totalNetSales: dashboard.month.netSales,
    totalOrders: dashboard.month.orders,
    totalReturns: dashboard.month.returns,
    averageOrderValue: dashboard.month.orders > 0
      ? dashboard.month.grossSales / dashboard.month.orders
      : 0,
    growth: dashboard.month.growth,
  };

  // Build daily data from byDate
  const dailyData = Object.entries(monthSales.byDate || {}).map(([date, data]) => ({
    date,
    grossSales: data.grossSales,
    netSales: data.netSales,
    orders: data.orders,
    returns: 0,
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Build channel data
  const totalSales = dashboard.month.grossSales || 1;
  const channelData = options.includeChannels ? dashboard.channelRanking.map(ch => ({
    channel: ch.channel,
    grossSales: ch.grossSales,
    netSales: ch.netSales,
    orders: ch.orders,
    share: (ch.grossSales / totalSales) * 100,
  })) : undefined;

  // Build product data
  const productData = options.includeProducts ? products.map((p, idx) => ({
    rank: idx + 1,
    productName: p.productName,
    category: p.category,
    quantitySold: p.quantitySold,
    grossSales: p.grossSales,
  })) : undefined;

  // Build monthly trend
  const monthlyTrend = monthlyHistory.map(m => ({
    month: m.month,
    grossSales: m.totalGrossSales,
    netSales: m.totalNetSales,
    orders: m.totalOrders,
  })).reverse();

  return {
    title: getReportTitle(options.type),
    generatedAt: now.toISOString(),
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    summary,
    dailyData,
    channelData,
    productData,
    monthlyTrend,
  };
}

function getReportTitle(type: ReportOptions['type']): string {
  const titles = {
    daily: '일일 매출 리포트',
    weekly: '주간 매출 리포트',
    monthly: '월간 매출 리포트',
    custom: '맞춤 매출 리포트',
  };
  return titles[type];
}

// ============================================
// CSV Export
// ============================================

export function generateCSV(data: ReportData): string {
  const lines: string[] = [];

  // Header info
  lines.push(`"${data.title}"`);
  lines.push(`"생성일시","${new Date(data.generatedAt).toLocaleString('ko-KR')}"`);
  lines.push(`"기간","${data.period.start} ~ ${data.period.end}"`);
  lines.push('');

  // Summary section
  lines.push('"=== 요약 ==="');
  lines.push(`"총 매출","${formatKRW(data.summary.totalGrossSales)}"`);
  lines.push(`"순 매출","${formatKRW(data.summary.totalNetSales)}"`);
  lines.push(`"총 주문수","${data.summary.totalOrders}건"`);
  lines.push(`"총 환불","${data.summary.totalReturns}건"`);
  lines.push(`"평균 주문액","${formatKRW(data.summary.averageOrderValue)}"`);
  lines.push(`"전월 대비","${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%"`);
  lines.push('');

  // Daily data
  if (data.dailyData && data.dailyData.length > 0) {
    lines.push('"=== 일별 매출 ==="');
    lines.push('"날짜","총매출","순매출","주문수"');
    data.dailyData.forEach(d => {
      lines.push(`"${d.date}","${d.grossSales}","${d.netSales}","${d.orders}"`);
    });
    lines.push('');
  }

  // Channel data
  if (data.channelData && data.channelData.length > 0) {
    lines.push('"=== 채널별 매출 ==="');
    lines.push('"채널","총매출","순매출","주문수","점유율"');
    data.channelData.forEach(c => {
      lines.push(`"${c.channel}","${c.grossSales}","${c.netSales}","${c.orders}","${c.share.toFixed(1)}%"`);
    });
    lines.push('');
  }

  // Product data
  if (data.productData && data.productData.length > 0) {
    lines.push('"=== 상품별 매출 ==="');
    lines.push('"순위","상품명","카테고리","판매수량","매출액"');
    data.productData.forEach(p => {
      lines.push(`"${p.rank}","${p.productName}","${p.category}","${p.quantitySold}","${p.grossSales}"`);
    });
    lines.push('');
  }

  // Monthly trend
  if (data.monthlyTrend && data.monthlyTrend.length > 0) {
    lines.push('"=== 월별 추이 ==="');
    lines.push('"월","총매출","순매출","주문수"');
    data.monthlyTrend.forEach(m => {
      lines.push(`"${m.month}","${m.grossSales}","${m.netSales}","${m.orders}"`);
    });
  }

  return lines.join('\n');
}

// ============================================
// Excel Export (XML format for compatibility)
// ============================================

export function generateExcelXML(data: ReportData): string {
  const formatCell = (value: string | number, type: 'String' | 'Number' = 'String') => {
    return `<Cell><Data ss:Type="${type}">${value}</Data></Cell>`;
  };

  const formatRow = (cells: string[]) => {
    return `<Row>${cells.join('')}</Row>`;
  };

  const rows: string[] = [];

  // Title
  rows.push(formatRow([formatCell(data.title)]));
  rows.push(formatRow([formatCell(`생성일시: ${new Date(data.generatedAt).toLocaleString('ko-KR')}`)]));
  rows.push(formatRow([formatCell(`기간: ${data.period.start} ~ ${data.period.end}`)]));
  rows.push(formatRow([formatCell('')]));

  // Summary
  rows.push(formatRow([formatCell('=== 요약 ===')]));
  rows.push(formatRow([formatCell('항목'), formatCell('값')]));
  rows.push(formatRow([formatCell('총 매출'), formatCell(data.summary.totalGrossSales, 'Number')]));
  rows.push(formatRow([formatCell('순 매출'), formatCell(data.summary.totalNetSales, 'Number')]));
  rows.push(formatRow([formatCell('총 주문수'), formatCell(data.summary.totalOrders, 'Number')]));
  rows.push(formatRow([formatCell('총 환불'), formatCell(data.summary.totalReturns, 'Number')]));
  rows.push(formatRow([formatCell('평균 주문액'), formatCell(Math.round(data.summary.averageOrderValue), 'Number')]));
  rows.push(formatRow([formatCell('전월 대비(%)'), formatCell(data.summary.growth.toFixed(1))]));
  rows.push(formatRow([formatCell('')]));

  // Daily data
  if (data.dailyData && data.dailyData.length > 0) {
    rows.push(formatRow([formatCell('=== 일별 매출 ===')]));
    rows.push(formatRow([
      formatCell('날짜'),
      formatCell('총매출'),
      formatCell('순매출'),
      formatCell('주문수'),
    ]));
    data.dailyData.forEach(d => {
      rows.push(formatRow([
        formatCell(d.date),
        formatCell(d.grossSales, 'Number'),
        formatCell(d.netSales, 'Number'),
        formatCell(d.orders, 'Number'),
      ]));
    });
    rows.push(formatRow([formatCell('')]));
  }

  // Channel data
  if (data.channelData && data.channelData.length > 0) {
    rows.push(formatRow([formatCell('=== 채널별 매출 ===')]));
    rows.push(formatRow([
      formatCell('채널'),
      formatCell('총매출'),
      formatCell('순매출'),
      formatCell('주문수'),
      formatCell('점유율(%)'),
    ]));
    data.channelData.forEach(c => {
      rows.push(formatRow([
        formatCell(c.channel),
        formatCell(c.grossSales, 'Number'),
        formatCell(c.netSales, 'Number'),
        formatCell(c.orders, 'Number'),
        formatCell(c.share.toFixed(1)),
      ]));
    });
    rows.push(formatRow([formatCell('')]));
  }

  // Product data
  if (data.productData && data.productData.length > 0) {
    rows.push(formatRow([formatCell('=== 상품별 매출 ===')]));
    rows.push(formatRow([
      formatCell('순위'),
      formatCell('상품명'),
      formatCell('카테고리'),
      formatCell('판매수량'),
      formatCell('매출액'),
    ]));
    data.productData.forEach(p => {
      rows.push(formatRow([
        formatCell(p.rank, 'Number'),
        formatCell(p.productName),
        formatCell(p.category),
        formatCell(p.quantitySold, 'Number'),
        formatCell(p.grossSales, 'Number'),
      ]));
    });
    rows.push(formatRow([formatCell('')]));
  }

  // Monthly trend
  if (data.monthlyTrend && data.monthlyTrend.length > 0) {
    rows.push(formatRow([formatCell('=== 월별 추이 ===')]));
    rows.push(formatRow([
      formatCell('월'),
      formatCell('총매출'),
      formatCell('순매출'),
      formatCell('주문수'),
    ]));
    data.monthlyTrend.forEach(m => {
      rows.push(formatRow([
        formatCell(m.month),
        formatCell(m.grossSales, 'Number'),
        formatCell(m.netSales, 'Number'),
        formatCell(m.orders, 'Number'),
      ]));
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="매출리포트">
<Table>
${rows.join('\n')}
</Table>
</Worksheet>
</Workbook>`;
}

// ============================================
// PDF Export (HTML for printing)
// ============================================

export function generatePDFHTML(data: ReportData): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Pretendard', -apple-system, sans-serif;
      color: #1f2937;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    .header p {
      font-size: 14px;
      color: #6b7280;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card .label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .summary-card .value {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
    }
    .summary-card .sub {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
    }
    .growth-positive { color: #059669 !important; }
    .growth-negative { color: #dc2626 !important; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    td { color: #4b5563; }
    .text-right { text-align: right; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    <p>기간: ${data.period.start} ~ ${data.period.end}</p>
    <p>생성일시: ${new Date(data.generatedAt).toLocaleString('ko-KR')}</p>
  </div>

  <div class="section">
    <h2>매출 요약</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">총 매출</div>
        <div class="value">${formatKRW(data.summary.totalGrossSales)}</div>
      </div>
      <div class="summary-card">
        <div class="label">순 매출</div>
        <div class="value">${formatKRW(data.summary.totalNetSales)}</div>
      </div>
      <div class="summary-card">
        <div class="label">전월 대비</div>
        <div class="value ${data.summary.growth >= 0 ? 'growth-positive' : 'growth-negative'}">
          ${data.summary.growth >= 0 ? '+' : ''}${data.summary.growth.toFixed(1)}%
        </div>
      </div>
      <div class="summary-card">
        <div class="label">총 주문</div>
        <div class="value">${data.summary.totalOrders.toLocaleString()}</div>
        <div class="sub">건</div>
      </div>
      <div class="summary-card">
        <div class="label">평균 주문액</div>
        <div class="value">${formatKRW(data.summary.averageOrderValue)}</div>
      </div>
      <div class="summary-card">
        <div class="label">환불</div>
        <div class="value">${data.summary.totalReturns.toLocaleString()}</div>
        <div class="sub">건</div>
      </div>
    </div>
  </div>

  ${data.channelData && data.channelData.length > 0 ? `
  <div class="section">
    <h2>채널별 매출</h2>
    <table>
      <thead>
        <tr>
          <th>채널</th>
          <th class="text-right">매출</th>
          <th class="text-right">주문수</th>
          <th class="text-right">점유율</th>
        </tr>
      </thead>
      <tbody>
        ${data.channelData.map(c => `
        <tr>
          <td>${c.channel}</td>
          <td class="text-right">${formatKRW(c.grossSales)}</td>
          <td class="text-right">${c.orders.toLocaleString()}건</td>
          <td class="text-right">${c.share.toFixed(1)}%</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.productData && data.productData.length > 0 ? `
  <div class="section">
    <h2>상품별 매출 TOP 10</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>상품명</th>
          <th class="text-right">판매수량</th>
          <th class="text-right">매출액</th>
        </tr>
      </thead>
      <tbody>
        ${data.productData.slice(0, 10).map(p => `
        <tr>
          <td>${p.rank}</td>
          <td>${p.productName}</td>
          <td class="text-right">${p.quantitySold.toLocaleString()}개</td>
          <td class="text-right">${formatKRW(p.grossSales)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${data.monthlyTrend && data.monthlyTrend.length > 0 ? `
  <div class="section">
    <h2>월별 매출 추이</h2>
    <table>
      <thead>
        <tr>
          <th>월</th>
          <th class="text-right">총매출</th>
          <th class="text-right">순매출</th>
          <th class="text-right">주문수</th>
        </tr>
      </thead>
      <tbody>
        ${data.monthlyTrend.map(m => `
        <tr>
          <td>${m.month}</td>
          <td class="text-right">${formatKRW(m.grossSales)}</td>
          <td class="text-right">${formatKRW(m.netSales)}</td>
          <td class="text-right">${m.orders.toLocaleString()}건</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Field Nine Solutions · Panopticon Business Intelligence</p>
    <p>본 리포트는 자동 생성되었습니다.</p>
  </div>
</body>
</html>`;
}

// ============================================
// Utility Functions
// ============================================

function formatKRW(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(1)}천만원`;
  }
  if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}
