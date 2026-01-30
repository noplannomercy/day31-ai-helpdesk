/**
 * 테스트 계정 비밀번호 재설정
 */

import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const ACCOUNTS = [
  {
    email: 'testcustomer@test.com',
    password: 'Test1234!',
  },
  {
    email: 'testagent@test.com',
    password: 'Agent1234!',
  },
];

async function resetPasswords() {
  try {
    console.log('=== 테스트 계정 비밀번호 재설정 ===\n');

    for (const account of ACCOUNTS) {
      console.log(`처리 중: ${account.email}`);

      // 계정 확인
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, account.email))
        .limit(1);

      if (!user) {
        console.log(`  [ERROR] 계정 없음\n`);
        continue;
      }

      // 비밀번호 해시
      const newHash = await bcrypt.hash(account.password, 10);

      // 업데이트
      await db
        .update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.id, user.id));

      console.log(`  [SUCCESS] 비밀번호 재설정 완료`);
      console.log(`  새 비밀번호: ${account.password}\n`);
    }

    console.log('=== 완료 ===');
    console.log('\n테스트 계정 정보:');
    console.log('\nCustomer:');
    console.log(`  Email: ${ACCOUNTS[0].email}`);
    console.log(`  Password: ${ACCOUNTS[0].password}`);
    console.log('\nAgent:');
    console.log(`  Email: ${ACCOUNTS[1].email}`);
    console.log(`  Password: ${ACCOUNTS[1].password}`);

    process.exit(0);
  } catch (error) {
    console.error('[ERROR]', error);
    process.exit(1);
  }
}

resetPasswords();
