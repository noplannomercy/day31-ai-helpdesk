/**
 * Phase 5 검증 테스트
 * - AI 통합 파일 존재 확인
 * - 컴포넌트 통합 확인
 * - DB 테이블 확인
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../lib/db/schema';
import fs from 'fs';
import path from 'path';

const { knowledgeBases, aiPromptTemplates } = schema;

interface TestResults {
  files: { [key: string]: boolean };
  integration: { [key: string]: boolean };
  db: { [key: string]: any };
  summary: {
    filesTotal: number;
    filesExist: number;
    integrationTotal: number;
    integrationPassed: number;
    dbChecks: number;
    dbPassed: number;
  };
}

async function testPhase5() {
  console.log('🔍 Phase 5 검증 테스트 시작\n');

  const results: TestResults = {
    files: {},
    integration: {},
    db: {},
    summary: {
      filesTotal: 0,
      filesExist: 0,
      integrationTotal: 0,
      integrationPassed: 0,
      dbChecks: 0,
      dbPassed: 0,
    },
  };

  try {
    // ========================================
    // 1. AI 서비스 파일 존재 확인
    // ========================================
    console.log('=== 1. AI 서비스 파일 확인 ===\n');

    const aiServiceFiles = [
      'lib/ai/openrouter.ts',
      'lib/ai/prompts.ts',
      'lib/services/ai-service.ts',
    ];

    aiServiceFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += aiServiceFiles.length;

    // ========================================
    // 2. AI API 라우트 파일 존재 확인
    // ========================================
    console.log('\n=== 2. AI API 라우트 확인 ===\n');

    const aiApiFiles = [
      'app/api/ai/classify/route.ts',
      'app/api/ai/suggest/route.ts',
      'app/api/ai/sentiment/route.ts',
      'app/api/ai/similar/route.ts',
    ];

    aiApiFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += aiApiFiles.length;

    // ========================================
    // 3. AI 컴포넌트 파일 존재 확인
    // ========================================
    console.log('\n=== 3. AI 컴포넌트 확인 ===\n');

    const aiComponentFiles = [
      'components/ai/ai-response-panel.tsx',
      'components/ai/sentiment-badge.tsx',
      'components/ai/similar-tickets.tsx',
      'components/ai/category-suggestion.tsx',
      'components/ui/skeleton.tsx',
      'components/ai/index.ts',
    ];

    aiComponentFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      const exists = fs.existsSync(filePath);
      results.files[file] = exists;
      if (exists) results.summary.filesExist++;
      console.log(`${exists ? '✓' : '✗'} ${file}`);
    });

    results.summary.filesTotal += aiComponentFiles.length;

    console.log(
      `\n파일 존재: ${results.summary.filesExist}/${results.summary.filesTotal}\n`
    );

    // ========================================
    // 4. 컴포넌트 통합 확인
    // ========================================
    console.log('=== 4. 컴포넌트 통합 확인 ===\n');

    results.summary.integrationTotal = 3;

    // ticket-form.tsx - CategorySuggestion 통합
    const ticketFormPath = path.join(
      process.cwd(),
      'components/tickets/ticket-form.tsx'
    );
    if (fs.existsSync(ticketFormPath)) {
      const content = fs.readFileSync(ticketFormPath, 'utf-8');
      const hasCategorySuggestion =
        content.includes('CategorySuggestion') &&
        content.includes("from '@/components/ai'");
      results.integration['ticket-form.tsx'] = hasCategorySuggestion;
      if (hasCategorySuggestion) results.summary.integrationPassed++;
      console.log(
        `${hasCategorySuggestion ? '✓' : '✗'} ticket-form.tsx - CategorySuggestion 통합`
      );
    } else {
      console.log('✗ ticket-form.tsx 파일 없음');
      results.integration['ticket-form.tsx'] = false;
    }

    // ticket-detail.tsx - AIResponsePanel, SentimentBadge, SimilarTickets 통합
    const ticketDetailPath = path.join(
      process.cwd(),
      'components/tickets/ticket-detail.tsx'
    );
    if (fs.existsSync(ticketDetailPath)) {
      const content = fs.readFileSync(ticketDetailPath, 'utf-8');
      const hasAIResponsePanel = content.includes('AIResponsePanel');
      const hasSentimentBadge = content.includes('SentimentBadge');
      const hasSimilarTickets = content.includes('SimilarTickets');
      const hasAllIntegrations =
        hasAIResponsePanel && hasSentimentBadge && hasSimilarTickets;
      results.integration['ticket-detail.tsx'] = hasAllIntegrations;
      if (hasAllIntegrations) results.summary.integrationPassed++;
      console.log(
        `${hasAllIntegrations ? '✓' : '✗'} ticket-detail.tsx - AIResponsePanel, SentimentBadge, SimilarTickets 통합`
      );
    } else {
      console.log('✗ ticket-detail.tsx 파일 없음');
      results.integration['ticket-detail.tsx'] = false;
    }

    // ticket-card.tsx - SentimentBadge 통합
    const ticketCardPath = path.join(
      process.cwd(),
      'components/tickets/ticket-card.tsx'
    );
    if (fs.existsSync(ticketCardPath)) {
      const content = fs.readFileSync(ticketCardPath, 'utf-8');
      const hasSentimentBadge =
        content.includes('SentimentBadge') &&
        content.includes("from '@/components/ai'");
      results.integration['ticket-card.tsx'] = hasSentimentBadge;
      if (hasSentimentBadge) results.summary.integrationPassed++;
      console.log(
        `${hasSentimentBadge ? '✓' : '✗'} ticket-card.tsx - SentimentBadge 통합`
      );
    } else {
      console.log('✗ ticket-card.tsx 파일 없음');
      results.integration['ticket-card.tsx'] = false;
    }

    console.log(
      `\n컴포넌트 통합: ${results.summary.integrationPassed}/${results.summary.integrationTotal}\n`
    );

    // ========================================
    // 5. 데이터베이스 확인 (Phase 4 테이블)
    // ========================================
    console.log('=== 5. 데이터베이스 확인 ===\n');

    const connectionString = process.env.DATABASE_URL!;
    const sql = postgres(connectionString, { prepare: false });
    const db = drizzle(sql, { schema });

    // Knowledge Base 테이블 접근 확인
    try {
      results.summary.dbChecks++;
      const allKBs = await db.select().from(knowledgeBases);
      console.log(`✓ Knowledge Base 테이블 접근 가능 (${allKBs.length}개)`);
      results.db.knowledgeBasesAccessible = true;
      results.summary.dbPassed++;
    } catch (error) {
      console.log('✗ Knowledge Base 테이블 접근 실패:', error);
      results.db.knowledgeBasesAccessible = false;
    }

    // AI Prompt Templates 테이블 접근 확인
    try {
      results.summary.dbChecks++;
      const allTemplates = await db.select().from(aiPromptTemplates);
      console.log(
        `✓ AI Prompt Templates 테이블 접근 가능 (${allTemplates.length}개)`
      );
      results.db.templatesAccessible = true;
      results.summary.dbPassed++;
    } catch (error) {
      console.log('✗ AI Prompt Templates 테이블 접근 실패:', error);
      results.db.templatesAccessible = false;
    }

    await sql.end();

    // ========================================
    // 6. 결과 요약
    // ========================================
    console.log('\n=== 테스트 결과 요약 ===\n');

    console.log(`파일 구현:`);
    console.log(
      `  - AI 서비스: ${aiServiceFiles.filter((f) => results.files[f]).length}/${aiServiceFiles.length}`
    );
    console.log(
      `  - AI API: ${aiApiFiles.filter((f) => results.files[f]).length}/${aiApiFiles.length}`
    );
    console.log(
      `  - AI 컴포넌트: ${aiComponentFiles.filter((f) => results.files[f]).length}/${aiComponentFiles.length}`
    );
    console.log(
      `  - 전체: ${results.summary.filesExist}/${results.summary.filesTotal} (${Math.round((results.summary.filesExist / results.summary.filesTotal) * 100)}%)`
    );

    console.log(`\n컴포넌트 통합:`);
    console.log(
      `  - 통합 완료: ${results.summary.integrationPassed}/${results.summary.integrationTotal} (${Math.round((results.summary.integrationPassed / results.summary.integrationTotal) * 100)}%)`
    );

    console.log(`\n데이터베이스:`);
    console.log(
      `  - 테스트 통과: ${results.summary.dbPassed}/${results.summary.dbChecks} (${Math.round((results.summary.dbPassed / results.summary.dbChecks) * 100)}%)`
    );

    const overallPassed =
      results.summary.filesExist === results.summary.filesTotal &&
      results.summary.integrationPassed === results.summary.integrationTotal &&
      results.summary.dbPassed === results.summary.dbChecks;

    console.log(`\n전체 상태: ${overallPassed ? '✓ 통과' : '✗ 실패'}`);

    // JSON 저장
    fs.writeFileSync(
      'test_results_phase5.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n결과 저장: test_results_phase5.json');

    process.exit(overallPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  }
}

testPhase5();
