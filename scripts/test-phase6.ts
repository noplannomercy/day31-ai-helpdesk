/**
 * Phase 6 검증 테스트
 * - 파일 존재 확인
 * - DB 스키마 확인 (SLA 필드)
 * - 서비스 함수 확인
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/db/schema';
import fs from 'fs';
import path from 'path';

const { tickets } = schema;

interface TestResults {
  files: { [key: string]: boolean };
  schema: { [key: string]: any };
  services: { [key: string]: boolean };
  summary: {
    filesTotal: number;
    filesExist: number;
    schemaChecks: number;
    schemaPassed: number;
    servicesTotal: number;
    servicesPassed: number;
  };
}

async function testPhase6() {
  console.log('🔍 Phase 6 검증 테스트 시작\n');

  const results: TestResults = {
    files: {},
    schema: {},
    services: {},
    summary: {
      filesTotal: 0,
      filesExist: 0,
      schemaChecks: 0,
      schemaPassed: 0,
      servicesTotal: 0,
      servicesPassed: 0,
    },
  };

  try {
    // ========================================
    // 1. 이메일 서비스 파일 존재 확인
    // ========================================
    console.log('=== 1. 이메일 서비스 파일 확인 ===\n');

    const emailFiles = [
      'lib/email/index.ts',
      'lib/email/templates/ticket-created.tsx',
      'lib/email/templates/ticket-reply.tsx',
      'lib/email/templates/sla-warning.tsx',
      'lib/email/templates/sla-violated.tsx',
    ];

    emailFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += emailFiles.length;

    // ========================================
    // 2. SLA 서비스 파일 존재 확인
    // ========================================
    console.log('\n=== 2. SLA 서비스 파일 확인 ===\n');

    const slaServiceFiles = [
      'lib/services/sla-service.ts',
      'lib/services/notification-service.ts',
    ];

    slaServiceFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += slaServiceFiles.length;

    // ========================================
    // 3. API 라우트 파일 존재 확인
    // ========================================
    console.log('\n=== 3. API 라우트 확인 ===\n');

    const apiFiles = ['app/api/cron/sla-check/route.ts'];

    apiFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += apiFiles.length;

    console.log(
      `\n파일 존재: ${results.summary.filesExist}/${results.summary.filesTotal}\n`
    );

    // ========================================
    // 4. DB 스키마 확인 (SLA 필드)
    // ========================================
    console.log('=== 4. DB 스키마 확인 (SLA 필드) ===\n');

    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { prepare: false });
    const db = drizzle(sql, { schema });

    // tickets 테이블 컬럼 확인
    try {
      results.summary.schemaChecks++;
      const columns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'tickets'
        AND column_name IN (
          'sla_response_deadline',
          'sla_resolve_deadline',
          'sla_response_met',
          'sla_resolve_met'
        )
        ORDER BY column_name
      `;

      console.log('tickets 테이블 SLA 필드:');
      const requiredSLAFields = [
        'sla_response_deadline',
        'sla_resolve_deadline',
        'sla_response_met',
        'sla_resolve_met',
      ];

      const foundFields = columns.map((c) => c.column_name);
      const hasAllFields = requiredSLAFields.every((field) =>
        foundFields.includes(field)
      );

      columns.forEach((col) => {
        console.log(`  ✓ ${col.column_name}: ${col.data_type}`);
      });

      if (hasAllFields) {
        console.log(`✓ 필요한 모든 SLA 필드 존재 (4/4)`);
        results.schema.slaFields = true;
        results.summary.schemaPassed++;
      } else {
        console.log(
          `✗ 일부 SLA 필드 누락 (${foundFields.length}/4)`
        );
        results.schema.slaFields = false;
      }
    } catch (error) {
      console.log('✗ DB 스키마 확인 실패:', error);
      results.schema.slaFields = false;
    }

    // ========================================
    // 5. 서비스 함수 확인
    // ========================================
    console.log('\n=== 5. 서비스 함수 확인 ===\n');

    results.summary.servicesTotal = 3;

    // 5-1. sla-service.ts 함수 확인
    try {
      const slaServicePath = path.join(
        process.cwd(),
        'lib/services/sla-service.ts'
      );
      if (fs.existsSync(slaServicePath)) {
        const content = fs.readFileSync(slaServicePath, 'utf-8');
        const hasCalculate = content.includes('calculateSLADeadlines');
        const hasUpdate = content.includes('updateResponseSLA');
        const hasGetTickets = content.includes('getTicketsApproachingResponseSLA') ||
                             content.includes('getTicketsViolatedResponseSLA');

        if (hasCalculate && hasUpdate && hasGetTickets) {
          console.log('✓ sla-service.ts - 핵심 함수 존재');
          results.services['sla-service'] = true;
          results.summary.servicesPassed++;
        } else {
          console.log('✗ sla-service.ts - 일부 함수 누락');
          results.services['sla-service'] = false;
        }
      } else {
        console.log('✗ sla-service.ts 파일 없음');
        results.services['sla-service'] = false;
      }
    } catch (error) {
      console.log('✗ sla-service.ts 확인 실패:', error);
      results.services['sla-service'] = false;
    }

    // 5-2. notification-service.ts 함수 확인
    try {
      const notificationPath = path.join(
        process.cwd(),
        'lib/services/notification-service.ts'
      );
      if (fs.existsSync(notificationPath)) {
        const content = fs.readFileSync(notificationPath, 'utf-8');
        const hasTicketCreated = content.includes('sendTicketCreatedNotification');
        const hasReply = content.includes('sendTicketReplyNotification');
        const hasSLAWarning = content.includes('sendSLAWarningNotification');

        if (hasTicketCreated && hasReply && hasSLAWarning) {
          console.log('✓ notification-service.ts - 핵심 함수 존재');
          results.services['notification-service'] = true;
          results.summary.servicesPassed++;
        } else {
          console.log('✗ notification-service.ts - 일부 함수 누락');
          results.services['notification-service'] = false;
        }
      } else {
        console.log('✗ notification-service.ts 파일 없음');
        results.services['notification-service'] = false;
      }
    } catch (error) {
      console.log('✗ notification-service.ts 확인 실패:', error);
      results.services['notification-service'] = false;
    }

    // 5-3. email/index.ts 함수 확인
    try {
      const emailIndexPath = path.join(process.cwd(), 'lib/email/index.ts');
      if (fs.existsSync(emailIndexPath)) {
        const content = fs.readFileSync(emailIndexPath, 'utf-8');
        const hasSendEmail = content.includes('sendEmail');
        const hasTransporter = content.includes('transporter');

        if (hasSendEmail && hasTransporter) {
          console.log('✓ email/index.ts - 이메일 발송 함수 존재');
          results.services['email'] = true;
          results.summary.servicesPassed++;
        } else {
          console.log('✗ email/index.ts - 핵심 함수 누락');
          results.services['email'] = false;
        }
      } else {
        console.log('✗ email/index.ts 파일 없음');
        results.services['email'] = false;
      }
    } catch (error) {
      console.log('✗ email/index.ts 확인 실패:', error);
      results.services['email'] = false;
    }

    await sql.end();

    // ========================================
    // 6. 결과 요약
    // ========================================
    console.log('\n=== 테스트 결과 요약 ===\n');

    console.log(`파일 구현:`);
    console.log(
      `  - 이메일 서비스: ${emailFiles.filter((f) => results.files[f]).length}/${emailFiles.length}`
    );
    console.log(
      `  - SLA 서비스: ${slaServiceFiles.filter((f) => results.files[f]).length}/${slaServiceFiles.length}`
    );
    console.log(
      `  - API 라우트: ${apiFiles.filter((f) => results.files[f]).length}/${apiFiles.length}`
    );
    console.log(
      `  - 전체: ${results.summary.filesExist}/${results.summary.filesTotal} (${Math.round((results.summary.filesExist / results.summary.filesTotal) * 100)}%)`
    );

    console.log(`\nDB 스키마:`);
    console.log(
      `  - SLA 필드: ${results.schema.slaFields ? '✓ 모두 존재' : '✗ 누락'}`
    );

    console.log(`\n서비스 함수:`);
    console.log(
      `  - 검증 통과: ${results.summary.servicesPassed}/${results.summary.servicesTotal} (${Math.round((results.summary.servicesPassed / results.summary.servicesTotal) * 100)}%)`
    );

    const overallPassed =
      results.summary.filesExist === results.summary.filesTotal &&
      results.summary.schemaPassed === results.summary.schemaChecks &&
      results.summary.servicesPassed === results.summary.servicesTotal;

    console.log(`\n전체 상태: ${overallPassed ? '✓ 통과' : '✗ 실패'}`);

    // JSON 저장
    fs.writeFileSync(
      'test_results_phase6.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n결과 저장: test_results_phase6.json');

    process.exit(overallPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testPhase6();
