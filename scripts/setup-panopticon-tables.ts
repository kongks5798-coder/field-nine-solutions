/**
 * Panopticon Tables Setup via Supabase Management API
 * 테이블 생성 및 초기 데이터 설정
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

// Supabase project ref 추출 (URL에서)
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

async function executeSQLViaAPI(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Supabase SQL API endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY!,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

async function insertInitialData() {
  console.log('\n📦 초기 데이터 삽입 중...\n');

  // 생산 데이터 삽입
  const productionData = [
    {
      brand: 'Aura Sydney',
      item: 'S/S 컬렉션',
      status: 'sampling',
      progress: 80,
      quantity: 500,
      due_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '샘플링 80% 완료',
      is_active: true,
    },
    {
      brand: 'Filluminate',
      item: '24FW 리오더',
      status: 'shipping',
      progress: 95,
      quantity: 1200,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '공장 출고 대기',
      is_active: true,
    },
  ];

  for (const data of productionData) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/panopticon_production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(`  ✅ 생산 데이터 삽입: ${data.brand} - ${data.item}`);
    } else {
      const error = await response.text();
      if (error.includes('duplicate') || error.includes('already exists')) {
        console.log(`  ⏭️  이미 존재: ${data.brand} - ${data.item}`);
      } else {
        console.log(`  ❌ 삽입 실패: ${data.brand} - ${error}`);
      }
    }
  }

  // 설정 데이터 삽입
  const settingsData = [
    { key: 'dashboard_refresh_interval', value: '"30000"' },
    { key: 'jarvis_enabled', value: '"true"' },
    { key: 'notification_enabled', value: '"true"' },
  ];

  for (const data of settingsData) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/panopticon_settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(`  ✅ 설정 삽입: ${data.key}`);
    } else {
      const error = await response.text();
      if (error.includes('duplicate') || error.includes('already exists')) {
        console.log(`  ⏭️  이미 존재: ${data.key}`);
      } else {
        console.log(`  ❌ 삽입 실패: ${data.key}`);
      }
    }
  }
}

async function main() {
  console.log('🔍 Panopticon 테이블 상태 확인 중...\n');

  const tables = [
    'panopticon_financial',
    'panopticon_musinsa_ranking',
    'panopticon_musinsa_sales',
    'panopticon_cs_reports',
    'panopticon_server_status',
    'panopticon_production',
    'panopticon_jarvis_logs',
    'panopticon_settings',
  ];

  let allExist = true;
  const missingTables: string[] = [];

  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`  ✅ ${table}`);
    } else {
      console.log(`  ❌ ${table} (없음)`);
      missingTables.push(table);
      allExist = false;
    }
  }

  if (!allExist) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  일부 테이블이 없습니다. Supabase Dashboard에서 생성하세요.\n');
    console.log('📋 방법:');
    console.log('   1. https://supabase.com/dashboard 접속');
    console.log(`   2. 프로젝트 선택 (${projectRef})`);
    console.log('   3. 좌측 메뉴 → SQL Editor 클릭');
    console.log('   4. New query 클릭');
    console.log('   5. 아래 SQL 전체를 복사하여 붙여넣기');
    console.log('   6. Run 버튼 클릭\n');
    console.log('='.repeat(60));

    // SQL 파일 내용 출력
    const sqlPath = path.join(__dirname, '../supabase/migrations/020_panopticon_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log('\n📄 SQL:\n');
    console.log(sql);
    console.log('\n' + '='.repeat(60));
  } else {
    console.log('\n✅ 모든 테이블이 존재합니다!');
    await insertInitialData();
  }

  console.log('\n✨ 완료');
}

main().catch(console.error);
