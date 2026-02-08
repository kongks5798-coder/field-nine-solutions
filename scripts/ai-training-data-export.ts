/**
 * AI Training Data Export Script
 * 
 * 목적: RTX 5090 AI 학습을 위한 데이터 Export
 * 사용법: npx ts-node scripts/ai-training-data-export.ts
 */

import { exportAllDataForAI, loadBatchDataForTraining } from '../lib/ai-data-access'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('🚀 AI 학습 데이터 Export 시작...')

  // 1. 전체 데이터 Export
  const allData = await exportAllDataForAI()
  
  const exportDir = path.join(process.cwd(), 'ai-training-data')
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  // 2. JSON 파일로 저장
  const jsonPath = path.join(exportDir, `export-${Date.now()}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(allData, null, 2))
  console.log(`✅ 전체 데이터 Export: ${jsonPath}`)

  // 3. 배치 데이터 Export (대량 데이터 처리용)
  const batches = await loadBatchDataForTraining(1000)
  const batchPath = path.join(exportDir, `batches-${Date.now()}.json`)
  fs.writeFileSync(batchPath, JSON.stringify(batches, null, 2))
  console.log(`✅ 배치 데이터 Export: ${batchPath} (${batches.length} batches)`)

  // 4. 통계 정보
  console.log('\n📊 Export 통계:')
  console.log(`- Mall Inventory: ${allData.mallInventory.length} records`)
  console.log(`- Feature Subscriptions: ${allData.featureSubscriptions.length} records`)
  console.log(`- Total Batches: ${batches.length}`)
  console.log(`- Export Directory: ${exportDir}`)

  console.log('\n✅ AI 학습 데이터 Export 완료!')
  console.log('💡 RTX 5090에서 이 데이터를 사용하여 AI 모델을 학습하세요.')
}

main()
  .catch(console.error)
  .finally(() => process.exit(0))
