#!/usr/bin/env node
/**
 * deploy.mjs — fieldnine.io 프로덕션 배포 스크립트
 * 실행: npm run deploy
 *
 * 1. vercel --prod 배포
 * 2. 배포 URL 추출
 * 3. www.fieldnine.io 별칭 자동 업데이트
 */
import { execSync, spawnSync } from "child_process";

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, stdio: "inherit", ...opts });
}

function capture(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

console.log("🚀 FieldNine 프로덕션 배포 시작...\n");

// 1. vercel --prod 실행 & URL 캡처
let deployOutput = "";
try {
  deployOutput = capture("npx vercel --prod 2>&1");
  console.log(deployOutput);
} catch (e) {
  console.error("❌ 배포 실패:", e.message);
  process.exit(1);
}

// 2. 배포 URL 추출 (형식: fn-xxxxx-kaus2025.vercel.app)
const match = deployOutput.match(/Production:\s+(https:\/\/fn-[\w]+-kaus2025\.vercel\.app)/);
if (!match) {
  console.warn("⚠️  배포 URL을 자동으로 찾지 못했습니다. www alias를 수동으로 업데이트하세요.");
  process.exit(0);
}

const deployUrl = match[1].replace("https://", "");
console.log(`\n✅ 배포 URL: ${deployUrl}`);

// 3. www.fieldnine.io 별칭 업데이트
console.log("\n🔗 www.fieldnine.io → 최신 배포 연결 중...");
const result = run(`npx vercel alias set ${deployUrl} www.fieldnine.io`);

if (result.status === 0) {
  console.log("\n✅ 완료!");
  console.log("   🌐 fieldnine.io     → 최신 배포");
  console.log("   🌐 www.fieldnine.io → 최신 배포");
} else {
  console.warn("\n⚠️  www alias 업데이트 실패. 수동으로 실행하세요:");
  console.warn(`   npx vercel alias set ${deployUrl} www.fieldnine.io`);
}
