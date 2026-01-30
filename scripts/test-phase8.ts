/**
 * Phase 8 검증 테스트
 * - 코드 품질 확인 (console.log, TypeScript 'any' 제거)
 * - UI 개선 파일 확인
 * - 빌드 성공 확인
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface TestResults {
  codeQuality: {
    consoleLogs: number;
    anyTypes: number;
    files: string[];
  };
  files: { [key: string]: boolean };
  improvements: { [key: string]: boolean };
  build: {
    success: boolean;
    errors: number;
  };
  summary: {
    filesTotal: number;
    filesExist: number;
    improvementsTotal: number;
    improvementsPassed: number;
  };
}

async function testPhase8() {
  console.log('🔍 Phase 8 검증 테스트 시작\n');

  const results: TestResults = {
    codeQuality: {
      consoleLogs: 0,
      anyTypes: 0,
      files: [],
    },
    files: {},
    improvements: {},
    build: {
      success: false,
      errors: 0,
    },
    summary: {
      filesTotal: 0,
      filesExist: 0,
      improvementsTotal: 0,
      improvementsPassed: 0,
    },
  };

  try {
    // ========================================
    // 1. 새로 생성된 파일 확인
    // ========================================
    console.log('=== 1. 새로 생성된 파일 확인 ===\n');

    const newFiles = ['components/common/error-boundary.tsx'];

    newFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal = newFiles.length;

    // ========================================
    // 2. 코드 품질 확인 - console.log
    // ========================================
    console.log('\n=== 2. console.log 사용 확인 ===\n');

    const filesToCheck = [
      'app/api/cron/sla-check/route.ts',
      'lib/services/sla-service.ts',
      'lib/email/index.ts',
      'components/dashboard/dashboard-stats.tsx',
      'components/tickets/ticket-list.tsx',
    ];

    let totalConsoleLogs = 0;
    const filesWithConsoleLogs: string[] = [];

    filesToCheck.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // console.log 찾기 (console.error는 제외)
        const matches = content.match(/console\.log\(/g);
        const count = matches ? matches.length : 0;
        if (count > 0) {
          totalConsoleLogs += count;
          filesWithConsoleLogs.push(`${file} (${count}개)`);
        }
      }
    });

    results.codeQuality.consoleLogs = totalConsoleLogs;
    results.codeQuality.files = filesWithConsoleLogs;

    if (totalConsoleLogs === 0) {
      console.log('✓ 프로덕션 코드에 console.log 없음');
    } else {
      console.log(`✗ console.log 발견: ${totalConsoleLogs}개`);
      filesWithConsoleLogs.forEach((file) => console.log(`  - ${file}`));
    }

    // ========================================
    // 3. 코드 품질 확인 - TypeScript 'any'
    // ========================================
    console.log('\n=== 3. TypeScript "any" 타입 확인 ===\n');

    const apiFiles = [
      'app/api/users/route.ts',
      'app/api/users/[id]/route.ts',
      'app/api/users/[id]/status/route.ts',
    ];

    let totalAnyTypes = 0;

    apiFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // ': any' 패턴 찾기
        const matches = content.match(/:\s*any\b/g);
        const count = matches ? matches.length : 0;
        totalAnyTypes += count;
      }
    });

    results.codeQuality.anyTypes = totalAnyTypes;

    if (totalAnyTypes === 0) {
      console.log('✓ 프로덕션 API 코드에 "any" 타입 없음');
    } else {
      console.log(`✗ "any" 타입 발견: ${totalAnyTypes}개`);
    }

    // ========================================
    // 4. UI 개선 확인
    // ========================================
    console.log('\n=== 4. UI 개선 확인 ===\n');

    results.summary.improvementsTotal = 5;

    // 4-1. Skeleton UI in dashboard-stats
    const dashboardStatsPath = path.join(
      process.cwd(),
      'components/dashboard/dashboard-stats.tsx'
    );
    if (fs.existsSync(dashboardStatsPath)) {
      const content = fs.readFileSync(dashboardStatsPath, 'utf-8');
      const hasSkeleton = content.includes('Skeleton');
      results.improvements['dashboard-skeleton'] = hasSkeleton;
      if (hasSkeleton) results.summary.improvementsPassed++;
      console.log(
        `${hasSkeleton ? '✓' : '✗'} Dashboard stats - Skeleton UI 적용`
      );
    }

    // 4-2. Skeleton UI in ticket-list
    const ticketListPath = path.join(
      process.cwd(),
      'components/tickets/ticket-list.tsx'
    );
    if (fs.existsSync(ticketListPath)) {
      const content = fs.readFileSync(ticketListPath, 'utf-8');
      const hasSkeleton = content.includes('Skeleton');
      results.improvements['ticket-list-skeleton'] = hasSkeleton;
      if (hasSkeleton) results.summary.improvementsPassed++;
      console.log(
        `${hasSkeleton ? '✓' : '✗'} Ticket list - Skeleton UI 적용`
      );
    }

    // 4-3. ErrorBoundary in dashboard page
    const dashboardPagePath = path.join(
      process.cwd(),
      'app/(main)/dashboard/page.tsx'
    );
    if (fs.existsSync(dashboardPagePath)) {
      const content = fs.readFileSync(dashboardPagePath, 'utf-8');
      const hasErrorBoundary = content.includes('ErrorBoundary');
      results.improvements['dashboard-error-boundary'] = hasErrorBoundary;
      if (hasErrorBoundary) results.summary.improvementsPassed++;
      console.log(
        `${hasErrorBoundary ? '✓' : '✗'} Dashboard page - ErrorBoundary 적용`
      );
    }

    // 4-4. useCallback in ticket-list
    if (fs.existsSync(ticketListPath)) {
      const content = fs.readFileSync(ticketListPath, 'utf-8');
      const hasUseCallback = content.includes('useCallback');
      results.improvements['ticket-list-callback'] = hasUseCallback;
      if (hasUseCallback) results.summary.improvementsPassed++;
      console.log(
        `${hasUseCallback ? '✓' : '✗'} Ticket list - useCallback 적용`
      );
    }

    // 4-5. Zod validation in status route
    const statusRoutePath = path.join(
      process.cwd(),
      'app/api/users/[id]/status/route.ts'
    );
    if (fs.existsSync(statusRoutePath)) {
      const content = fs.readFileSync(statusRoutePath, 'utf-8');
      const hasZodValidation = content.includes('userStatusUpdateSchema');
      results.improvements['status-zod-validation'] = hasZodValidation;
      if (hasZodValidation) results.summary.improvementsPassed++;
      console.log(
        `${hasZodValidation ? '✓' : '✗'} Status route - Zod 검증 적용`
      );
    }

    // ========================================
    // 5. 빌드 확인
    // ========================================
    console.log('\n=== 5. 빌드 확인 ===\n');

    try {
      console.log('빌드 실행 중... (시간이 걸릴 수 있습니다)');
      execSync('npm run build', {
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      results.build.success = true;
      results.build.errors = 0;
      console.log('✓ 빌드 성공 (0 에러)');
    } catch (error) {
      results.build.success = false;
      console.log('✗ 빌드 실패');
    }

    // ========================================
    // 6. 결과 요약
    // ========================================
    console.log('\n=== 테스트 결과 요약 ===\n');

    console.log(`파일 생성:`);
    console.log(
      `  - 새 파일: ${results.summary.filesExist}/${results.summary.filesTotal}`
    );

    console.log(`\n코드 품질:`);
    console.log(
      `  - console.log: ${results.codeQuality.consoleLogs === 0 ? '✓ 0개' : `✗ ${results.codeQuality.consoleLogs}개`}`
    );
    console.log(
      `  - TypeScript 'any': ${results.codeQuality.anyTypes === 0 ? '✓ 0개' : `✗ ${results.codeQuality.anyTypes}개`}`
    );

    console.log(`\nUI 개선:`);
    console.log(
      `  - 개선 완료: ${results.summary.improvementsPassed}/${results.summary.improvementsTotal} (${Math.round((results.summary.improvementsPassed / results.summary.improvementsTotal) * 100)}%)`
    );

    console.log(`\n빌드:`);
    console.log(
      `  - 상태: ${results.build.success ? '✓ 성공' : '✗ 실패'}`
    );

    const overallPassed =
      results.summary.filesExist === results.summary.filesTotal &&
      results.codeQuality.consoleLogs === 0 &&
      results.codeQuality.anyTypes === 0 &&
      results.summary.improvementsPassed === results.summary.improvementsTotal &&
      results.build.success;

    console.log(`\n전체 상태: ${overallPassed ? '✓ 통과' : '✗ 실패'}`);

    // JSON 저장
    fs.writeFileSync(
      'test_results_phase8.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n결과 저장: test_results_phase8.json');

    process.exit(overallPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testPhase8();
