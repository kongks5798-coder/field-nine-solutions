/**
 * Panopticon Schema Migration Script
 * Supabase REST API를 통한 마이그레이션 적용
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// .env.local 로드
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runMigration() {
  console.log('🚀 Panopticon 마이그레이션 시작...\n');

  // SQL 파일 읽기
  const sqlPath = path.join(__dirname, '../supabase/migrations/020_panopticon_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // SQL을 개별 문장으로 분리 (세미콜론 기준, 단 문자열 내부 제외)
  const statements = sql
    .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 총 ${statements.length}개의 SQL 문장 실행 예정\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        // RPC가 없으면 직접 실행 시도
        throw error;
      }

      console.log(`✅ [${i + 1}/${statements.length}] ${preview}`);
      successCount++;
    } catch (rpcError) {
      // Supabase REST API로 직접 실행이 안되는 경우 표시
      // 테이블 생성 등 DDL은 대시보드에서 실행 필요
      console.log(`⏸️  [${i + 1}/${statements.length}] ${preview}`);
      console.log(`    → Supabase Dashboard SQL Editor에서 실행 필요`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 결과: 성공 ${successCount} / 실패 ${errorCount}`);

  if (errorCount > 0) {
    console.log('\n⚠️  일부 SQL은 Supabase Dashboard에서 직접 실행해야 합니다.');
    console.log('   1. https://supabase.com/dashboard 접속');
    console.log('   2. 프로젝트 선택 → SQL Editor');
    console.log('   3. 아래 파일 내용 붙여넣기 후 실행:');
    console.log(`   ${sqlPath}`);
  }
}

// 대안: SQL 전체를 직접 출력하여 복사/붙여넣기 가능하게
async function printSQLForManualExecution() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/020_panopticon_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('\n📄 Supabase SQL Editor에 붙여넣을 SQL:\n');
  console.log('='.repeat(60));
  console.log(sql);
  console.log('='.repeat(60));
}

// 실행
runMigration()
  .then(() => {
    console.log('\n✨ 마이그레이션 스크립트 완료');
  })
  .catch((err) => {
    console.error('\n❌ 마이그레이션 실패:', err);
    printSQLForManualExecution();
    process.exit(1);
  });
