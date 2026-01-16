/**
 * Panopticon Sales Report Export API
 * Excel, PDF, CSV 형식으로 매출 리포트 다운로드
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateReportData,
  generateCSV,
  generateExcelXML,
  generatePDFHTML,
  ReportOptions,
} from '@/lib/reports/sales-export';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ============================================
// GET: 리포트 미리보기 데이터
// ============================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const options: ReportOptions = {
      type: (searchParams.get('type') as ReportOptions['type']) || 'monthly',
      format: (searchParams.get('format') as ReportOptions['format']) || 'excel',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      includeProducts: searchParams.get('includeProducts') !== 'false',
      includeChannels: searchParams.get('includeChannels') !== 'false',
    };

    const data = await generateReportData(options);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Reports API] GET Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '리포트 생성 실패',
      },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 리포트 다운로드
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const options: ReportOptions = {
      type: body.type || 'monthly',
      format: body.format || 'excel',
      startDate: body.startDate,
      endDate: body.endDate,
      includeProducts: body.includeProducts !== false,
      includeChannels: body.includeChannels !== false,
    };

    const data = await generateReportData(options);

    let content: string;
    let contentType: string;
    let filename: string;
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

    switch (options.format) {
      case 'csv':
        content = generateCSV(data);
        contentType = 'text/csv; charset=utf-8';
        filename = `sales-report-${dateStr}.csv`;
        break;

      case 'pdf':
        content = generatePDFHTML(data);
        contentType = 'text/html; charset=utf-8';
        filename = `sales-report-${dateStr}.html`;
        break;

      case 'excel':
      default:
        content = generateExcelXML(data);
        contentType = 'application/vnd.ms-excel';
        filename = `sales-report-${dateStr}.xls`;
        break;
    }

    // Add BOM for Excel/CSV to properly handle Korean characters
    const bom = '\uFEFF';
    const finalContent = options.format === 'csv' ? bom + content : content;

    return new NextResponse(finalContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[Reports API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '리포트 다운로드 실패',
      },
      { status: 500 }
    );
  }
}
