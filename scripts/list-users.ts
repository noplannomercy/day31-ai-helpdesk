/**
 * 데이터베이스 사용자 목록 조회
 */

import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { or, eq } from 'drizzle-orm';

async function listUsers() {
  try {
    console.log('=== 데이터베이스 사용자 목록 ===\n');

    const allUsers = await db.select().from(users);

    console.log(`총 ${allUsers.length}명의 사용자가 있습니다.\n`);

    for (const user of allUsers) {
      console.log(`ID: ${user.id}`);
      console.log(`  이메일: ${user.email}`);
      console.log(`  이름: ${user.name}`);
      console.log(`  역할: ${user.role}`);
      console.log(`  상태: ${user.status}`);
      console.log(`  온라인: ${user.isOnline}`);
      console.log(`  자리비움: ${user.isAway}`);
      console.log(`  생성일: ${user.createdAt}`);
      console.log('');
    }

    // Customer와 Agent 계정 특별 표시
    console.log('=== 테스트 계정 확인 ===\n');

    const testCustomer = allUsers.find(u => u.email === 'testcustomer@test.com');
    if (testCustomer) {
      console.log('✓ Test Customer 계정 존재');
    } else {
      console.log('✗ Test Customer 계정 없음');
    }

    const testAgent = allUsers.find(u => u.email === 'testagent@test.com');
    if (testAgent) {
      console.log('✓ Test Agent 계정 존재');
      console.log(`  온라인: ${testAgent.isOnline}`);
      console.log(`  자리비움: ${testAgent.isAway}`);
    } else {
      console.log('✗ Test Agent 계정 없음');
    }

    process.exit(0);
  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

listUsers();
