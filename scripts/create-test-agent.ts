/**
 * 테스트 Agent 계정 생성
 */

// IMPORTANT: Load .env.local before any imports that use process.env
import { config } from 'dotenv';
const result = config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('[ERROR] DATABASE_URL not found in .env.local');
  process.exit(1);
}

import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const TEST_AGENT = {
  email: 'testagent@test.com',
  password: 'Agent1234!',
  name: 'Test Agent',
  role: 'agent' as const,
};

async function createTestAgent() {
  try {
    console.log('=== Test Agent 계정 생성 ===\n');

    // 기존 계정 확인
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_AGENT.email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[INFO] 이미 존재하는 계정: ${TEST_AGENT.email}`);
      console.log(`[INFO] 기존 계정 정보:`);
      console.log(`  ID: ${existing[0].id}`);
      console.log(`  Name: ${existing[0].name}`);
      console.log(`  Role: ${existing[0].role}`);
      console.log(`  Status: ${existing[0].status}`);
      console.log(`  Is Online: ${existing[0].isOnline}`);
      console.log(`  Is Away: ${existing[0].isAway}`);

      // 온라인 상태로 업데이트
      if (!existing[0].isOnline || existing[0].isAway) {
        console.log('\n[INFO] Agent 상태를 온라인으로 업데이트...');
        await db
          .update(users)
          .set({
            isOnline: true,
            isAway: false,
            status: 'active',
          })
          .where(eq(users.id, existing[0].id));
        console.log('[SUCCESS] Agent 상태 업데이트 완료');
      }

      return;
    }

    // 비밀번호 해시
    console.log('[INFO] 비밀번호 해싱...');
    const passwordHash = await bcrypt.hash(TEST_AGENT.password, 10);

    // Agent 계정 생성
    console.log('[INFO] Agent 계정 생성 중...');
    const [newAgent] = await db
      .insert(users)
      .values({
        email: TEST_AGENT.email,
        passwordHash,
        name: TEST_AGENT.name,
        role: TEST_AGENT.role,
        status: 'active',
        isOnline: true,
        isAway: false,
      })
      .returning();

    console.log('\n[SUCCESS] Agent 계정 생성 완료!');
    console.log(`  ID: ${newAgent.id}`);
    console.log(`  Email: ${newAgent.email}`);
    console.log(`  Name: ${newAgent.name}`);
    console.log(`  Role: ${newAgent.role}`);
    console.log(`  Is Online: ${newAgent.isOnline}`);

    console.log('\n=== 테스트 계정 정보 ===');
    console.log(`Email: ${TEST_AGENT.email}`);
    console.log(`Password: ${TEST_AGENT.password}`);

    process.exit(0);
  } catch (error) {
    console.error('\n[ERROR] Agent 계정 생성 실패:', error);
    process.exit(1);
  }
}

createTestAgent();
