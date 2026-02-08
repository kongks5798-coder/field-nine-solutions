/**
 * Google API 연동 테스트
 */
import { getCalendar, getDrive, getGmail, getTodayEvents, getRecentFiles, getUnreadCount } from '../lib/google/client';

async function main() {
  console.log('\n========================================');
  console.log('  Google API 연동 테스트');
  console.log('  Field Nine - PANOPTICON');
  console.log('========================================\n');

  // 1. Calendar 테스트
  console.log('📅 [Calendar] 오늘의 일정 조회...');
  try {
    const events = await getTodayEvents();
    console.log(`   ✅ 성공! 오늘 일정 ${events.length}개`);
    events.slice(0, 3).forEach((event: any) => {
      console.log(`      - ${event.summary || '(제목 없음)'}`);
    });
  } catch (error: any) {
    console.log(`   ❌ 실패: ${error.message}`);
  }

  // 2. Drive 테스트
  console.log('\n📁 [Drive] 최근 파일 조회...');
  try {
    const files = await getRecentFiles(5);
    console.log(`   ✅ 성공! 최근 파일 ${files.length}개`);
    files.slice(0, 3).forEach((file: any) => {
      console.log(`      - ${file.name}`);
    });
  } catch (error: any) {
    console.log(`   ❌ 실패: ${error.message}`);
  }

  // 3. Gmail 테스트
  console.log('\n📧 [Gmail] 읽지 않은 메일 수 조회...');
  try {
    const unreadCount = await getUnreadCount();
    console.log(`   ✅ 성공! 읽지 않은 메일 ${unreadCount}개`);
  } catch (error: any) {
    console.log(`   ❌ 실패: ${error.message}`);
  }

  console.log('\n========================================');
  console.log('  🎉 테스트 완료!');
  console.log('========================================\n');
}

main().catch(console.error);
