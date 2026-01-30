/**
 * AI Service
 *
 * High-level service that integrates AI capabilities with the database.
 * Handles category classification, answer generation, sentiment analysis,
 * and similar ticket search.
 */

import { db } from '@/lib/db';
import { tickets, categories, knowledgeBases, aiPromptTemplates } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, ne } from 'drizzle-orm';
import {
  createChatCompletion,
  extractContent,
  isOpenRouterAvailable,
  OpenRouterError,
  type Message,
} from '@/lib/ai/openrouter';
import {
  getSystemPrompt,
  buildPromptWithTemplate,
  buildKnowledgeBaseContext,
  buildCategoryList,
  DEFAULT_ANSWER_TEMPLATE,
  type TemplateVariables,
} from '@/lib/ai/prompts';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CategoryClassification {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number;
  reason: string;
}

export interface AnswerGeneration {
  response: string;
  usedKB: boolean;
  kbEntriesUsed: number;
}

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface SentimentAnalysis {
  sentiment: SentimentType;
  confidence: number;
  reason: string;
}

export interface SimilarTicket {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}

// ============================================================================
// Category Classification
// ============================================================================

/**
 * Classify ticket into a category using AI
 */
export async function classifyCategory(
  title: string,
  content: string
): Promise<CategoryClassification> {
  // Check if AI is available
  if (!isOpenRouterAvailable()) {
    return {
      categoryId: null,
      categoryName: null,
      confidence: 0,
      reason: 'AI 서비스가 설정되지 않았습니다.',
    };
  }

  try {
    // Get all active categories
    const allCategories = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder);

    if (allCategories.length === 0) {
      return {
        categoryId: null,
        categoryName: null,
        confidence: 0,
        reason: '사용 가능한 카테고리가 없습니다.',
      };
    }

    // Build category list
    const categoryList = buildCategoryList(allCategories);

    // Create messages
    const messages: Message[] = [
      {
        role: 'system',
        content: getSystemPrompt('category-classifier'),
      },
      {
        role: 'user',
        content: `${categoryList}

제목: ${title}
내용: ${content}

위 티켓을 가장 적절한 카테고리로 분류해주세요.`,
      },
    ];

    // Call AI
    const response = await createChatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 200,
    });

    const aiContent = extractContent(response);

    // Parse JSON response
    const parsed = JSON.parse(aiContent);

    // Find matching category
    const matchedCategory = allCategories.find(
      (cat) => cat.name === parsed.categoryName
    );

    return {
      categoryId: matchedCategory?.id || null,
      categoryName: parsed.categoryName || null,
      confidence: parsed.confidence || 0,
      reason: parsed.reason || '',
    };

  } catch (error) {
    console.error('Category classification error:', error);

    if (error instanceof OpenRouterError) {
      return {
        categoryId: null,
        categoryName: null,
        confidence: 0,
        reason: `AI 분류 실패: ${error.message}`,
      };
    }

    return {
      categoryId: null,
      categoryName: null,
      confidence: 0,
      reason: '카테고리 분류 중 오류가 발생했습니다.',
    };
  }
}

// ============================================================================
// Answer Generation
// ============================================================================

interface GenerateResponseOptions {
  useCustomPrompt?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Generate AI response for a ticket
 */
export async function generateResponse(
  ticketId: string,
  options: GenerateResponseOptions = {}
): Promise<AnswerGeneration> {
  // Check if AI is available
  if (!isOpenRouterAvailable()) {
    throw new Error('AI 서비스가 설정되지 않았습니다.');
  }

  try {
    // Get ticket details
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      throw new Error('티켓을 찾을 수 없습니다.');
    }

    // Get category name
    let categoryName = '미분류';
    if (ticket.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, ticket.categoryId))
        .limit(1);
      if (category) {
        categoryName = category.name;
      }
    }

    // Get relevant knowledge base entries
    let kbEntries: Array<{ title: string; content: string }> = [];
    if (ticket.categoryId) {
      const kbResults = await db
        .select({ title: knowledgeBases.title, content: knowledgeBases.content })
        .from(knowledgeBases)
        .where(
          and(
            eq(knowledgeBases.categoryId, ticket.categoryId),
            eq(knowledgeBases.isActive, true)
          )
        )
        .limit(3);
      kbEntries = kbResults;
    }

    // Build knowledge base context
    const kbContext = buildKnowledgeBaseContext(kbEntries);

    // Get custom prompt template if exists
    let userPrompt = DEFAULT_ANSWER_TEMPLATE;
    let systemPrompt = getSystemPrompt('customer-support');

    if (options.useCustomPrompt && ticket.categoryId) {
      const [template] = await db
        .select()
        .from(aiPromptTemplates)
        .where(eq(aiPromptTemplates.categoryId, ticket.categoryId))
        .limit(1);

      if (template) {
        systemPrompt = template.systemPrompt;
        userPrompt = template.userPromptTemplate;
      }
    }

    // Build prompt with variables
    const variables: TemplateVariables = {
      title: ticket.title,
      content: ticket.content,
      category: categoryName,
      knowledge_base: kbContext,
    };

    const finalUserPrompt = buildPromptWithTemplate(userPrompt, variables);

    // Create messages
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: finalUserPrompt },
    ];

    // Call AI
    const response = await createChatCompletion(messages, {
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 1000,
    });

    const aiContent = extractContent(response);

    return {
      response: aiContent,
      usedKB: kbEntries.length > 0,
      kbEntriesUsed: kbEntries.length,
    };

  } catch (error) {
    console.error('Answer generation error:', error);

    if (error instanceof OpenRouterError) {
      throw new Error(`AI 답변 생성 실패: ${error.message}`);
    }

    throw error;
  }
}

// ============================================================================
// Sentiment Analysis
// ============================================================================

/**
 * Analyze sentiment of ticket content
 */
export async function analyzeSentiment(content: string): Promise<SentimentAnalysis> {
  // Check if AI is available
  if (!isOpenRouterAvailable()) {
    return {
      sentiment: 'neutral',
      confidence: 0,
      reason: 'AI 서비스가 설정되지 않았습니다.',
    };
  }

  try {
    // Create messages
    const messages: Message[] = [
      {
        role: 'system',
        content: getSystemPrompt('sentiment-analyzer'),
      },
      {
        role: 'user',
        content: `다음 텍스트의 감정을 분석해주세요:\n\n${content}`,
      },
    ];

    // Call AI
    const response = await createChatCompletion(messages, {
      temperature: 0.3,
      maxTokens: 200,
    });

    const aiContent = extractContent(response);

    // Parse JSON response
    const parsed = JSON.parse(aiContent);

    return {
      sentiment: parsed.sentiment || 'neutral',
      confidence: parsed.confidence || 0,
      reason: parsed.reason || '',
    };

  } catch (error) {
    console.error('Sentiment analysis error:', error);

    return {
      sentiment: 'neutral',
      confidence: 0,
      reason: '감정 분석 중 오류가 발생했습니다.',
    };
  }
}

// ============================================================================
// Similar Ticket Search
// ============================================================================

/**
 * Find similar tickets based on keywords
 */
export async function findSimilarTickets(
  ticketId: string,
  limit: number = 5
): Promise<SimilarTicket[]> {
  try {
    // Get current ticket
    const [currentTicket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!currentTicket) {
      return [];
    }

    // Extract keywords from title (simple approach)
    const keywords = currentTicket.title
      .toLowerCase()
      .split(' ')
      .filter((word) => word.length > 2); // Only words with 3+ characters

    if (keywords.length === 0) {
      return [];
    }

    // Build search conditions (search in title or content)
    const searchConditions = keywords.map((keyword) =>
      or(
        ilike(tickets.title, `%${keyword}%`),
        ilike(tickets.content, `%${keyword}%`)
      )
    );

    // Find similar tickets (prioritize resolved tickets)
    const similarTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        createdAt: tickets.createdAt,
        resolvedAt: tickets.resolvedAt,
      })
      .from(tickets)
      .where(
        and(
          or(...searchConditions),
          // Exclude current ticket
          ne(tickets.id, ticketId)
        )
      )
      .orderBy(
        // Prioritize resolved tickets
        desc(tickets.resolvedAt)
      )
      .limit(limit);

    return similarTickets as SimilarTicket[];

  } catch (error) {
    console.error('Similar ticket search error:', error);
    return [];
  }
}
