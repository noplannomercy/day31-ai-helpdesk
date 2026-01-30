/**
 * Phase 7 검증 테스트
 * - 파일 존재 확인
 * - DB 스키마 확인 (customer_satisfactions 테이블)
 * - 의존성 확인 (recharts, date-fns)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/db/schema';
import fs from 'fs';
import path from 'path';

const { customerSatisfactions } = schema;

interface TestResults {
  files: { [key: string]: boolean };
  schema: { [key: string]: any };
  dependencies: { [key: string]: boolean };
  summary: {
    filesTotal: number;
    filesExist: number;
    schemaChecks: number;
    schemaPassed: number;
    depsTotal: number;
    depsPassed: number;
  };
}

async function testPhase7() {
  console.log('🔍 Phase 7 검증 테스트 시작\n');

  const results: TestResults = {
    files: {},
    schema: {},
    dependencies: {},
    summary: {
      filesTotal: 0,
      filesExist: 0,
      schemaChecks: 0,
      schemaPassed: 0,
      depsTotal: 0,
      depsPassed: 0,
    },
  };

  try {
    // ========================================
    // 1. 만족도 API 파일 존재 확인
    // ========================================
    console.log('=== 1. 만족도 API 파일 확인 ===\n');

    const satisfactionApiFiles = [
      'app/api/tickets/[id]/satisfaction/route.ts',
    ];

    satisfactionApiFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += satisfactionApiFiles.length;

    // ========================================
    // 2. 보고서 API 파일 존재 확인
    // ========================================
    console.log('\n=== 2. 보고서 API 파일 확인 ===\n');

    const reportsApiFiles = [
      'app/api/reports/overview/route.ts',
      'app/api/reports/satisfaction/route.ts',
      'app/api/reports/sla/route.ts',
    ];

    reportsApiFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += reportsApiFiles.length;

    // ========================================
    // 3. 보고서 페이지 파일 존재 확인
    // ========================================
    console.log('\n=== 3. 보고서 페이지 확인 ===\n');

    const pageFiles = ['app/(main)/reports/page.tsx'];

    pageFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += pageFiles.length;

    // ========================================
    // 4. 보고서 컴포넌트 파일 존재 확인
    // ========================================
    console.log('\n=== 4. 보고서 컴포넌트 확인 ===\n');

    const reportComponentFiles = [
      'components/reports/reports-dashboard.tsx',
      'components/reports/stats-overview.tsx',
      'components/reports/satisfaction-chart.tsx',
      'components/reports/ticket-chart.tsx',
      'components/reports/date-range-picker.tsx',
    ];

    reportComponentFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += reportComponentFiles.length;

    // ========================================
    // 5. 만족도 컴포넌트 파일 존재 확인
    // ========================================
    console.log('\n=== 5. 만족도 컴포넌트 확인 ===\n');

    const satisfactionComponentFiles = [
      'components/tickets/satisfaction-form.tsx',
      'components/tickets/satisfaction-prompt.tsx',
    ];

    satisfactionComponentFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += satisfactionComponentFiles.length;

    console.log(
      `\n파일 존재: ${results.summary.filesExist}/${results.summary.filesTotal}\n`
    );

    // ========================================
    // 6. DB 스키마 확인 (customer_satisfactions)
    // ========================================
    console.log('=== 6. DB 스키마 확인 ===\n');

    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { prepare: false });
    const db = drizzle(sql, { schema });

    // customer_satisfactions 테이블 존재 확인
    try {
      results.summary.schemaChecks++;
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'customer_satisfactions'
      `;

      const hasTable = tables.some(
        (t) => t.table_name === 'customer_satisfactions'
      );

      if (hasTable) {
        console.log('✓ customer_satisfactions 테이블 존재');
        results.schema.tableExists = true;
        results.summary.schemaPassed++;
      } else {
        console.log('✗ customer_satisfactions 테이블 없음');
        results.schema.tableExists = false;
      }
    } catch (error) {
      console.log('✗ 테이블 확인 실패:', error);
      results.schema.tableExists = false;
    }

    // customer_satisfactions 테이블 컬럼 확인
    try {
      results.summary.schemaChecks++;
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'customer_satisfactions'
        ORDER BY ordinal_position
      `;

      console.log('\ncustomer_satisfactions 테이블 구조:');
      const requiredColumns = [
        'id',
        'ticket_id',
        'rating',
        'feedback',
        'created_at',
      ];

      const foundColumns = columns.map((c) => c.column_name);
      const hasAllColumns = requiredColumns.every((col) =>
        foundColumns.includes(col)
      );

      columns.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      if (hasAllColumns) {
        console.log(`✓ 필요한 모든 컬럼 존재 (${requiredColumns.length}/${requiredColumns.length})`);
        results.schema.columnsValid = true;
        results.summary.schemaPassed++;
      } else {
        console.log(`✗ 일부 컬럼 누락 (${foundColumns.length}/${requiredColumns.length})`);
        results.schema.columnsValid = false;
      }
    } catch (error) {
      console.log('✗ 컬럼 확인 실패:', error);
      results.schema.columnsValid = false;
    }

    // 테이블 접근 테스트
    try {
      results.summary.schemaChecks++;
      const satisfactions = await db.select().from(customerSatisfactions);
      console.log(`\n✓ customer_satisfactions 테이블 접근 가능 (${satisfactions.length}개)`);
      results.schema.tableAccessible = true;
      results.summary.schemaPassed++;
    } catch (error) {
      console.log('\n✗ 테이블 접근 실패:', error);
      results.schema.tableAccessible = false;
    }

    await sql.end();

    // ========================================
    // 7. 의존성 확인
    // ========================================
    console.log('\n=== 7. 의존성 확인 ===\n');

    results.summary.depsTotal = 2;

    // package.json 읽기
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf-8')
      );
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // recharts 확인
      if (dependencies['recharts']) {
        console.log(`✓ recharts: ${dependencies['recharts']}`);
        results.dependencies['recharts'] = true;
        results.summary.depsPassed++;
      } else {
        console.log('✗ recharts 미설치');
        results.dependencies['recharts'] = false;
      }

      // date-fns 확인
      if (dependencies['date-fns']) {
        console.log(`✓ date-fns: ${dependencies['date-fns']}`);
        results.dependencies['date-fns'] = true;
        results.summary.depsPassed++;
      } else {
        console.log('✗ date-fns 미설치');
        results.dependencies['date-fns'] = false;
      }
    } else {
      console.log('✗ package.json 없음');
    }

    // ========================================
    // 8. 결과 요약
    // ========================================
    console.log('\n=== 테스트 결과 요약 ===\n');

    console.log(`파일 구현:`);
    console.log(
      `  - 만족도 API: ${satisfactionApiFiles.filter((f) => results.files[f]).length}/${satisfactionApiFiles.length}`
    );
    console.log(
      `  - 보고서 API: ${reportsApiFiles.filter((f) => results.files[f]).length}/${reportsApiFiles.length}`
    );
    console.log(
      `  - 보고서 페이지: ${pageFiles.filter((f) => results.files[f]).length}/${pageFiles.length}`
    );
    console.log(
      `  - 보고서 컴포넌트: ${reportComponentFiles.filter((f) => results.files[f]).length}/${reportComponentFiles.length}`
    );
    console.log(
      `  - 만족도 컴포넌트: ${satisfactionComponentFiles.filter((f) => results.files[f]).length}/${satisfactionComponentFiles.length}`
    );
    console.log(
      `  - 전체: ${results.summary.filesExist}/${results.summary.filesTotal} (${Math.round((results.summary.filesExist / results.summary.filesTotal) * 100)}%)`
    );

    console.log(`\nDB 스키마:`);
    console.log(
      `  - 테스트 통과: ${results.summary.schemaPassed}/${results.summary.schemaChecks} (${Math.round((results.summary.schemaPassed / results.summary.schemaChecks) * 100)}%)`
    );

    console.log(`\n의존성:`);
    console.log(
      `  - 설치 완료: ${results.summary.depsPassed}/${results.summary.depsTotal} (${Math.round((results.summary.depsPassed / results.summary.depsTotal) * 100)}%)`
    );

    const overallPassed =
      results.summary.filesExist === results.summary.filesTotal &&
      results.summary.schemaPassed === results.summary.schemaChecks &&
      results.summary.depsPassed === results.summary.depsTotal;

    console.log(`\n전체 상태: ${overallPassed ? '✓ 통과' : '✗ 실패'}`);

    // JSON 저장
    fs.writeFileSync(
      'test_results_phase7.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n결과 저장: test_results_phase7.json');

    process.exit(overallPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testPhase7();
