import { NextRequest, NextResponse } from 'next/server';
import {
  getDashboardData,
  formatKRW,
  calculatePercentChange,
  calculateDDay,
  getUpcomingEvents,
  checkLocalServerConnection,
  type DashboardData,
} from '@/lib/panopticon';

/**
 * POST /api/jarvis
 * AI 비서 자비스 - 자연어 질의 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const lowerQuery = query.toLowerCase();

    // 질의 분석 및 응답 생성
    let answer: string;
    let data: DashboardData | Record<string, unknown> | null = null;

    // 1. 매출/재무 관련 질의
    if (
      lowerQuery.includes('매출') ||
      lowerQuery.includes('수익') ||
      lowerQuery.includes('정산') ||
      lowerQuery.includes('재무')
    ) {
      const dashboardData = await getDashboardData();
      const change = calculatePercentChange(
        dashboardData.financial.monthlyRevenue,
        dashboardData.financial.previousMonthRevenue
      );

      answer = `보스, 이번 달 매출 현황입니다.

📊 **이번 달 총 매출:** ${formatKRW(dashboardData.financial.monthlyRevenue)}
📈 **전월 대비:** ${change > 0 ? '+' : ''}${change}%
🎯 **목표 달성률:** ${Math.round((dashboardData.financial.monthlyRevenue / dashboardData.financial.targetRevenue) * 100)}%

💰 **무신사 정산 현황:**
- 확정 정산금: ${formatKRW(dashboardData.musinsa.sales.settlementAmount)}
- 미정산금: ${formatKRW(dashboardData.musinsa.sales.pendingSettlement)}

영업 이익률은 ${dashboardData.financial.operatingMargin}%로 ${dashboardData.financial.operatingMargin >= 12 ? '목표를 달성' : '목표에 근접'}하고 있습니다.`;

      data = {
        revenue: dashboardData.financial.monthlyRevenue,
        change,
        margin: dashboardData.financial.operatingMargin,
      };
    }

    // 2. 무신사/랭킹 관련 질의
    else if (
      lowerQuery.includes('무신사') ||
      lowerQuery.includes('랭킹') ||
      lowerQuery.includes('순위')
    ) {
      const dashboardData = await getDashboardData();
      const ranking = dashboardData.musinsa.ranking;

      answer = `보스, 무신사 실시간 현황입니다.

🏆 **전체 랭킹:** ${ranking.overallRank}위
📍 **${ranking.category} 부문:** ${ranking.categoryRank}위 ${ranking.change === 'up' ? '▲' : ranking.change === 'down' ? '▼' : ''}${ranking.changeAmount > 0 ? ranking.changeAmount : ''}

💵 **오늘 매출:** ${formatKRW(dashboardData.musinsa.sales.todaySales)}
📅 **이번 주 매출:** ${formatKRW(dashboardData.musinsa.sales.weekSales)}

${ranking.categoryRank <= 3 ? '아우터 부문 TOP 3를 유지하고 있습니다. 좋은 성과입니다!' : '순위 상승을 위한 추가 프로모션을 검토해보시겠습니까?'}`;

      data = { ranking };
    }

    // 3. CS/클레임 관련 질의
    else if (
      lowerQuery.includes('cs') ||
      lowerQuery.includes('클레임') ||
      lowerQuery.includes('문의') ||
      lowerQuery.includes('고객')
    ) {
      const dashboardData = await getDashboardData();
      const cs = dashboardData.cs;

      const statusText =
        cs.urgentCases > 5
          ? '⚠️ 긴급 대응이 필요합니다!'
          : cs.urgentCases > 0
          ? '주의가 필요한 상태입니다.'
          : '정상 범위입니다.';

      answer = `보스, CS 현황 보고드립니다.

📋 **전체 문의:** ${cs.totalCases}건
⏳ **처리 대기:** ${cs.pendingCases}건
🚨 **긴급 건:** ${cs.urgentCases}건 ${statusText}

**카테고리별 현황:**
- 배송 관련: ${cs.categories.delivery}건
- 품질 문의: ${cs.categories.quality}건
- 교환 요청: ${cs.categories.exchange}건
- 환불 요청: ${cs.categories.refund}건

${cs.categories.delivery > 10 ? '배송 관련 문의가 증가하고 있습니다. 물류팀 점검이 필요해 보입니다.' : ''}`;

      data = { cs };
    }

    // 4. 생산/디자인 관련 질의
    else if (
      lowerQuery.includes('생산') ||
      lowerQuery.includes('디자인') ||
      lowerQuery.includes('컬렉션') ||
      lowerQuery.includes('런칭') ||
      lowerQuery.includes('aura') ||
      lowerQuery.includes('filluminate')
    ) {
      const dashboardData = await getDashboardData();
      const production = dashboardData.production;

      let productionReport = '보스, 생산/디자인 현황입니다.\n\n';

      production.forEach((item) => {
        const dDay = calculateDDay(item.dueDate);
        const statusEmoji =
          item.status === 'completed'
            ? '✅'
            : item.status === 'shipping'
            ? '🚚'
            : item.status === 'production'
            ? '🏭'
            : '🎨';

        productionReport += `${statusEmoji} **${item.brand} - ${item.item}**
- 진행률: ${item.progress}%
- D-${Math.abs(dDay)}${dDay < 0 ? ' (지연)' : ''}
- 수량: ${item.quantity.toLocaleString()}장
${item.notes ? `- 비고: ${item.notes}` : ''}

`;
      });

      answer = productionReport;
      data = { production };
    }

    // 5. 서버/시스템 관련 질의
    else if (
      lowerQuery.includes('서버') ||
      lowerQuery.includes('시스템') ||
      lowerQuery.includes('rtx') ||
      lowerQuery.includes('gpu')
    ) {
      const dashboardData = await getDashboardData();
      const server = dashboardData.server;
      const connection = await checkLocalServerConnection();

      answer = `보스, 서버 상태 보고드립니다.

🖥️ **${server.name}**
- 상태: ${server.status === 'online' ? '✅ 정상 가동' : '⚠️ 점검 필요'}
- CPU 사용률: ${server.cpuUsage}%
- 메모리 사용률: ${server.memoryUsage}%
${server.gpuUsage !== undefined ? `- GPU 사용률: ${server.gpuUsage}%` : ''}
${server.temperature !== undefined ? `- 온도: ${server.temperature}°C` : ''}
- 가동 시간: ${Math.floor(server.uptime / 86400)}일

🔗 **연결 상태:** ${connection.connected ? '정상' : '연결 끊김'}
${connection.latency ? `- 지연 시간: ${connection.latency}ms` : ''}`;

      data = { server, connection };
    }

    // 6. 일정 관련 질의
    else if (
      lowerQuery.includes('일정') ||
      lowerQuery.includes('캘린더') ||
      lowerQuery.includes('스케줄') ||
      lowerQuery.includes('미팅')
    ) {
      try {
        const events = await getUpcomingEvents(7);

        if (events.length === 0) {
          answer = '보스, 이번 주 등록된 일정이 없습니다. Google Calendar 연동을 확인해주세요.';
        } else {
          let scheduleReport = '보스, 다가오는 일정입니다.\n\n';

          events.slice(0, 5).forEach((event) => {
            const dDay = calculateDDay(event.start);
            scheduleReport += `📅 **${event.title}**
- ${event.start.toLocaleDateString('ko-KR')} ${event.start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
${dDay === 0 ? '- 🔴 오늘!' : `- D-${dDay}`}
${event.location ? `- 장소: ${event.location}` : ''}

`;
          });

          answer = scheduleReport;
        }

        data = { events };
      } catch {
        answer =
          '보스, 일정 조회 중 오류가 발생했습니다. Google Calendar 연동 설정을 확인해주세요.';
      }
    }

    // 7. 전체 보고서 요청
    else if (
      lowerQuery.includes('보고서') ||
      lowerQuery.includes('요약') ||
      lowerQuery.includes('전체') ||
      lowerQuery.includes('현황')
    ) {
      const dashboardData = await getDashboardData();
      const revenueChange = calculatePercentChange(
        dashboardData.financial.monthlyRevenue,
        dashboardData.financial.previousMonthRevenue
      );

      answer = `보스, Field Nine 전체 현황 보고드립니다.

**📊 재무**
- 이번 달 매출: ${formatKRW(dashboardData.financial.monthlyRevenue)} (${revenueChange > 0 ? '+' : ''}${revenueChange}%)
- 영업 이익률: ${dashboardData.financial.operatingMargin}%

**🛒 무신사**
- 전체 ${dashboardData.musinsa.ranking.overallRank}위 / ${dashboardData.musinsa.ranking.category} ${dashboardData.musinsa.ranking.categoryRank}위
- 오늘 매출: ${formatKRW(dashboardData.musinsa.sales.todaySales)}

**📞 CS**
- 처리 대기: ${dashboardData.cs.pendingCases}건 / 긴급: ${dashboardData.cs.urgentCases}건

**🏭 생산**
${dashboardData.production.map((p) => `- ${p.brand}: ${p.progress}% (D-${calculateDDay(p.dueDate)})`).join('\n')}

**🖥️ 서버**
- ${dashboardData.server.name}: ${dashboardData.server.status === 'online' ? '정상' : '점검 필요'}

추가로 궁금하신 사항이 있으시면 말씀해주세요.`;

      data = dashboardData;
    }

    // 8. 기본 응답 (인식 못한 질의)
    else {
      // 1.5초 딜레이 (빠른 응답)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      answer = `보스, 말씀하신 "${query}"에 대해 분석 중입니다.

현재 제가 도와드릴 수 있는 영역:
- 📊 매출/재무 현황
- 🛒 무신사 랭킹/매출
- 📞 CS/클레임 현황
- 🏭 생산/디자인 진행 상황
- 📅 일정/캘린더
- 🖥️ 서버 상태

더 구체적으로 말씀해주시면 정확한 데이터를 보여드리겠습니다.`;
    }

    // 응답 딜레이 (자연스러운 UX)
    if (!answer.includes('분석 중')) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      query,
      answer,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Jarvis API] 오류:', error);

    return NextResponse.json({
      success: true,
      query: '',
      answer:
        '보스, 죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
