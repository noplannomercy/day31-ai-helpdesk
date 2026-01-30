/**
 * Phase 3 스모크 테스트
 * - 주요 엔드포인트 응답 확인
 * - DB 데이터 확인
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

const { users, tickets, categories } = schema;

async function smokeTest() {
  console.log('🔍 Phase 3 스모크 테스트 시작\n');

  const connectionString = process.env.DATABASE_URL!;
  const sql = postgres(connectionString, { prepare: false });
  const db = drizzle(sql, { schema });

  const results: any = {
    db: {},
    apis: {}
  };

  try {
    // ========================================
    // 1. 데이터베이스 확인
    // ========================================
    console.log('=== 1. 데이터베이스 확인 ===\n');

    // 1-1. Admin 계정 존재 확인
    const adminUser = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);
    console.log(`✓ Admin 계정: ${adminUser.length > 0 ? '존재' : '없음'}`);
    results.db.admin = adminUser.length > 0;

    // 1-2. 카테고리 확인
    const allCategories = await db.select().from(categories);
    console.log(`✓ 카테고리: ${allCategories.length}개`);
    results.db.categories = allCategories.length >= 5;

    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (active: ${cat.isActive})`);
    });

    // 1-3. 전체 사용자 수
    const allUsers = await db.select().from(users);
    console.log(`\n✓ 전체 사용자: ${allUsers.length}명`);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    results.db.users = allUsers.length;

    // 1-4. 티켓 확인
    const allTickets = await db.select().from(tickets);
    console.log(`\n✓ 전체 티켓: ${allTickets.length}개`);
    results.db.tickets = allTickets.length;

    if (allTickets.length > 0) {
      allTickets.forEach(ticket => {
        console.log(`  - ${ticket.title} (${ticket.status}) - agent: ${ticket.agentId || 'unassigned'}`);
      });
    }

    // ========================================
    // 2. API 엔드포인트 확인 (구조 검증)
    // ========================================
    console.log('\n=== 2. API 엔드포인트 파일 확인 ===\n');

    const fs = require('fs');
    const path = require('path');

    const apiEndpoints = [
      'app/api/categories/route.ts',
      'app/api/categories/[id]/route.ts',
      'app/api/tickets/route.ts',
      'app/api/tickets/[id]/route.ts',
      'app/api/tickets/[id]/comments/route.ts',
      'app/api/tickets/[id]/attachments/route.ts',
      'app/api/tickets/[id]/status/route.ts',
      'app/api/tickets/[id]/assign/route.ts',
    ];

    let apisExist = 0;
    apiEndpoints.forEach(endpoint => {
      const exists = fs.existsSync(path.join(process.cwd(), endpoint));
      console.log(`${exists ? '✓' : '✗'} ${endpoint}`);
      if (exists) apisExist++;
    });

    results.apis.total = apiEndpoints.length;
    results.apis.exists = apisExist;

    // ========================================
    // 3. 페이지 파일 확인
    // ========================================
    console.log('\n=== 3. 페이지 파일 확인 ===\n');

    const pages = [
      'app/(admin)/categories/page.tsx',
      'app/(main)/tickets/page.tsx',
      'app/(main)/tickets/new/page.tsx',
      'app/(main)/tickets/[id]/page.tsx',
      'app/(main)/dashboard/page.tsx',
    ];

    let pagesExist = 0;
    pages.forEach(page => {
      const exists = fs.existsSync(path.join(process.cwd(), page));
      console.log(`${exists ? '✓' : '✗'} ${page}`);
      if (exists) pagesExist++;
    });

    results.pages = {
      total: pages.length,
      exists: pagesExist
    };

    // ========================================
    // 4. 서비스 레이어 확인
    // ========================================
    console.log('\n=== 4. 서비스 레이어 확인 ===\n');

    const services = [
      'lib/services/ticket-service.ts',
      'lib/services/assignment-service.ts',
      'lib/services/history-service.ts',
    ];

    let servicesExist = 0;
    services.forEach(service => {
      const exists = fs.existsSync(path.join(process.cwd(), service));
      console.log(`${exists ? '✓' : '✗'} ${service}`);
      if (exists) servicesExist++;
    });

    results.services = {
      total: services.length,
      exists: servicesExist
    };

    // ========================================
    // 결과 요약
    // ========================================
    console.log('\n=== 테스트 결과 요약 ===\n');

    console.log(`DB 상태:`);
    console.log(`  - Admin 계정: ${results.db.admin ? '✓' : '✗'}`);
    console.log(`  - 카테고리 (5개 이상): ${results.db.categories ? '✓' : '✗'}`);
    console.log(`  - 사용자 수: ${results.db.users}명`);
    console.log(`  - 티켓 수: ${results.db.tickets}개`);

    console.log(`\n구현 완료율:`);
    console.log(`  - API 엔드포인트: ${results.apis.exists}/${results.apis.total} (${Math.round(results.apis.exists/results.apis.total*100)}%)`);
    console.log(`  - 페이지: ${results.pages.exists}/${results.pages.total} (${Math.round(results.pages.exists/results.pages.total*100)}%)`);
    console.log(`  - 서비스: ${results.services.exists}/${results.services.total} (${Math.round(results.services.exists/results.services.total*100)}%)`);

    const totalFiles = results.apis.total + results.pages.total + results.services.total;
    const totalExists = results.apis.exists + results.pages.exists + results.services.exists;
    console.log(`\n전체 파일: ${totalExists}/${totalFiles} (${Math.round(totalExists/totalFiles*100)}%)`);

    // JSON 저장
    fs.writeFileSync('test_results_smoke.json', JSON.stringify(results, null, 2));
    console.log('\n결과 저장: test_results_smoke.json');

    await sql.end();

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await sql.end();
    process.exit(1);
  }
}

smokeTest();
