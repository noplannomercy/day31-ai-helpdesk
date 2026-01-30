// Check customer and agent accounts in database
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './lib/db';
import { users } from './drizzle/schema';
import { eq, or } from 'drizzle-orm';

async function checkAccounts() {
  try {
    console.log('Checking customer and agent accounts...\n');

    const accounts = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status
    })
    .from(users)
    .where(or(
      eq(users.role, 'customer'),
      eq(users.role, 'agent')
    ));

    console.log('Found accounts:');
    console.log(JSON.stringify(accounts, null, 2));

    console.log('\n=== Customer Accounts ===');
    accounts.filter(a => a.role === 'customer').forEach(a => {
      console.log(`Email: ${a.email}`);
      console.log(`Name: ${a.name}`);
      console.log(`Status: ${a.status}`);
      console.log('---');
    });

    console.log('\n=== Agent Accounts ===');
    accounts.filter(a => a.role === 'agent').forEach(a => {
      console.log(`Email: ${a.email}`);
      console.log(`Name: ${a.name}`);
      console.log(`Status: ${a.status}`);
      console.log('---');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAccounts();
