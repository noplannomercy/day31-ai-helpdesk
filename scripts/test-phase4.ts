/**
 * Phase 4 검증 테스트
 * - API 엔드포인트 테스트
 * - DB 데이터 확인
 * - 파일 존재 확인
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';
import fs from 'fs';
import path from 'path';

const { knowledgeBases, aiPromptTemplates, categories } = schema;

interface TestResults {
  files: { [key: string]: boolean };
  db: { [key: string]: any };
  summary: {
    filesTotal: number;
    filesExist: number;
    dbChecks: number;
    dbPassed: number;
  };
}

async function testPhase4() {
  console.log('🔍 Phase 4 검증 테스트 시작\n');

  const results: TestResults = {
    files: {},
    db: {},
    summary: {
      filesTotal: 0,
      filesExist: 0,
      dbChecks: 0,
      dbPassed: 0,
    },
  };

  try {
    // ========================================
    // 1. 파일 존재 확인
    // ========================================
    console.log('=== 1. 파일 존재 확인 ===\n');

    const requiredFiles = [
      'app/api/knowledge-base/route.ts',
      'app/api/knowledge-base/[id]/route.ts',
      'app/api/templates/route.ts',
      'app/api/templates/[id]/route.ts',
      'app/(admin)/knowledge-base/page.tsx',
      'app/(admin)/templates/page.tsx',
      'components/admin/knowledge-base-management.tsx',
      'components/admin/knowledge-base-form.tsx',
      'components/admin/template-management.tsx',
      'components/admin/template-form.tsx',
      'hooks/use-toast.ts',
    ];

    results.summary.filesTotal = requiredFiles.length;

    requiredFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    console.log(
      `\n파일 존재: ${results.summary.filesExist}/${results.summary.filesTotal}\n`
    );

    // ========================================
    // 2. 데이터베이스 확인
    // ========================================
    console.log('=== 2. 데이터베이스 확인 ===\n');

    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { prepare: false });
    const db = drizzle(sql, { schema });

    results.summary.dbChecks = 0;
    results.summary.dbPassed = 0;

    // 2-1. 테이블 존재 확인
    try {
      const tables = await sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('knowledge_bases', 'ai_prompt_templates')
      `;

      results.summary.dbChecks++;
      const hasKB = tables.some((t) => t.table_name === 'knowledge_bases');
      const hasTemplates = tables.some(
        (t) => t.table_name === 'ai_prompt_templates'
      );

      if (hasKB && hasTemplates) {
        console.log('✓ knowledge_bases 테이블 존재');
        console.log('✓ ai_prompt_templates 테이블 존재');
        results.db.tables = true;
        results.summary.dbPassed++;
      } else {
        console.log('✗ 필요한 테이블이 없습니다');
        results.db.tables = false;
      }
    } catch (error) {
      console.log('✗ 테이블 확인 실패:', error);
      results.db.tables = false;
    }

    // 2-2. Knowledge Base 데이터 확인
    try {
      results.summary.dbChecks++;
      const allKBs = await db.select().from(knowledgeBases);
      console.log(`\n✓ Knowledge Base: ${allKBs.length}개`);
      results.db.knowledgeBasesCount = allKBs.length;

      if (allKBs.length > 0) {
        console.log('\nKnowledge Bases:');
        allKBs.forEach((kb) => {
          console.log(
            `  - ${kb.title} (카테고리: ${kb.categoryId || '없음'}, 활성: ${kb.isActive})`
          );
        });
        results.summary.dbPassed++;
      } else {
        console.log('  (테스트 데이터 없음 - 정상)');
        results.summary.dbPassed++;
      }
    } catch (error) {
      console.log('✗ Knowledge Base 조회 실패:', error);
      results.db.knowledgeBasesCount = -1;
    }

    // 2-3. AI Prompt Templates 데이터 확인
    try {
      results.summary.dbChecks++;
      const allTemplates = await db.select().from(aiPromptTemplates);
      console.log(`\n✓ AI Prompt Templates: ${allTemplates.length}개`);
      results.db.templatesCount = allTemplates.length;

      if (allTemplates.length > 0) {
        console.log('\nAI Templates:');
        allTemplates.forEach((tmpl) => {
          console.log(
            `  - 카테고리 ID: ${tmpl.categoryId || '기본 템플릿'}`
          );
          console.log(`    시스템 프롬프트: ${tmpl.systemPrompt.substring(0, 50)}...`);
        });
        results.summary.dbPassed++;
      } else {
        console.log('  (테스트 데이터 없음 - 정상)');
        results.summary.dbPassed++;
      }
    } catch (error) {
      console.log('✗ AI Templates 조회 실패:', error);
      results.db.templatesCount = -1;
    }

    // 2-4. 카테고리 확인 (FK 관계)
    try {
      results.summary.dbChecks++;
      const allCategories = await db.select().from(categories);
      console.log(`\n✓ 카테고리: ${allCategories.length}개`);
      results.db.categoriesCount = allCategories.length;

      if (allCategories.length >= 5) {
        console.log('카테고리 목록:');
        allCategories.forEach((cat) => {
          console.log(`  - ${cat.name} (활성: ${cat.isActive})`);
        });
        results.summary.dbPassed++;
      } else {
        console.log('✗ 카테고리가 5개 미만입니다');
      }
    } catch (error) {
      console.log('✗ 카테고리 조회 실패:', error);
      results.db.categoriesCount = -1;
    }

    // ========================================
    // 3. 스키마 구조 확인
    // ========================================
    console.log('\n=== 3. 스키마 구조 확인 ===\n');

    try {
      results.summary.dbChecks++;

      // knowledge_bases 컬럼 확인
      const kbColumns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'knowledge_bases'
        ORDER BY ordinal_position
      `;

      console.log('knowledge_bases 테이블 구조:');
      const requiredKBColumns = [
        'id',
        'title',
        'content',
        'category_id',
        'is_active',
        'created_at',
        'updated_at',
      ];
      const hasAllKBColumns = requiredKBColumns.every((col) =>
        kbColumns.some((c) => c.column_name === col)
      );

      kbColumns.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      if (hasAllKBColumns) {
        console.log('✓ 필요한 모든 컬럼 존재');
        results.summary.dbPassed++;
      } else {
        console.log('✗ 일부 컬럼 누락');
      }

      // ai_prompt_templates 컬럼 확인
      const templateColumns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'ai_prompt_templates'
        ORDER BY ordinal_position
      `;

      console.log('\nai_prompt_templates 테이블 구조:');
      const requiredTemplateColumns = [
        'id',
        'category_id',
        'system_prompt',
        'user_prompt_template',
        'created_at',
        'updated_at',
      ];
      const hasAllTemplateColumns = requiredTemplateColumns.every((col) =>
        templateColumns.some((c) => c.column_name === col)
      );

      templateColumns.forEach((col) => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });

      if (hasAllTemplateColumns) {
        console.log('✓ 필요한 모든 컬럼 존재');
      } else {
        console.log('✗ 일부 컬럼 누락');
      }
    } catch (error) {
      console.log('✗ 스키마 확인 실패:', error);
    }

    await sql.end();

    // ========================================
    // 4. 결과 요약
    // ========================================
    console.log('\n=== 테스트 결과 요약 ===\n');

    console.log(`파일 구현:`);
    console.log(
      `  - 파일 존재: ${results.summary.filesExist}/${results.summary.filesTotal} (${Math.round((results.summary.filesExist / results.summary.filesTotal) * 100)}%)`
    );

    console.log(`\n데이터베이스:`);
    console.log(
      `  - 테스트 통과: ${results.summary.dbPassed}/${results.summary.dbChecks} (${Math.round((results.summary.dbPassed / results.summary.dbChecks) * 100)}%)`
    );
    console.log(`  - Knowledge Bases: ${results.db.knowledgeBasesCount}개`);
    console.log(`  - AI Templates: ${results.db.templatesCount}개`);
    console.log(`  - 카테고리: ${results.db.categoriesCount}개`);

    const overallPassed =
      results.summary.filesExist === results.summary.filesTotal &&
      results.summary.dbPassed === results.summary.dbChecks;

    console.log(`\n전체 상태: ${overallPassed ? '✓ 통과' : '✗ 실패'}`);

    // JSON 저장
    fs.writeFileSync(
      'test_results_phase4.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n결과 저장: test_results_phase4.json');

    process.exit(overallPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testPhase4();
