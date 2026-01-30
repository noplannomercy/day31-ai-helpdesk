import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  console.log(`📍 Connection string: ${DATABASE_URL.replace(/:[^:@]+@/, ':***@')}\n`);

  try {
    const sql = postgres(DATABASE_URL, { prepare: false });

    // Test query
    const result = await sql`SELECT version(), current_database(), current_user`;

    console.log('✅ Database connection successful!\n');
    console.log('📊 Database Info:');
    console.log(`   - Database: ${result[0].current_database}`);
    console.log(`   - User: ${result[0].current_user}`);
    console.log(`   - PostgreSQL Version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}\n`);

    // Check tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 Existing Tables:');
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found - migrations need to be run\n');
    } else {
      tables.forEach(t => console.log(`   - ${t.table_name}`));
      console.log();
    }

    await sql.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Database connection failed!\n');
    console.error('Error:', error);
    process.exit(1);
  }
}

testConnection();
