import { config } from 'dotenv';

// Load .env.local file FIRST
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/db/schema';
import { hash } from 'bcryptjs';

const { users, categories } = schema;

async function seed() {
  console.log('🌱 Seeding database...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  try {
    // Create Admin account
    const adminPassword = await hash('Admin123!', 10);

    const [admin] = await db.insert(users).values({
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: '관리자',
      role: 'admin',
    }).returning();

    console.log('✅ Admin user created:', admin.email);

    // Create default categories
    const defaultCategories = [
      { name: '결제', sortOrder: 1 },
      { name: '배송', sortOrder: 2 },
      { name: '반품/교환', sortOrder: 3 },
      { name: '계정', sortOrder: 4 },
      { name: '기타', sortOrder: 5 },
    ];

    const insertedCategories = await db.insert(categories).values(defaultCategories).returning();

    console.log('✅ Categories created:', insertedCategories.length);
    insertedCategories.forEach((cat) => console.log(`  - ${cat.name}`));

    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('📝 Admin credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: Admin123!\n');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await client.end();
    process.exit(1);
  }
}

seed();
