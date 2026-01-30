/**
 * AI Prompt Templates
 *
 * Defines system prompts and prompt building utilities for various AI tasks.
 */

export type SystemPromptRole =
  | 'customer-support'
  | 'category-classifier'
  | 'sentiment-analyzer';

/**
 * Get system prompt for a specific role
 */
export function getSystemPrompt(role: SystemPromptRole): string {
  switch (role) {
    case 'customer-support':
      return `당신은 전문적이고 친절한 고객 지원 상담원입니다.

역할:
- 고객의 문제를 정확히 이해하고 해결책을 제시합니다
- 단계별로 명확하고 이해하기 쉽게 설명합니다
- 친절하고 공감하는 태도로 응대합니다
- 제공된 지식베이스 정보를 활용하여 정확한 답변을 제공합니다

답변 형식:
1. 먼저 고객의 문제를 요약하고 공감을 표현합니다
2. 해결 방법을 단계별로 제시합니다
3. 추가 도움이 필요한 경우 안내합니다

참고사항:
- 모든 답변은 한국어로 작성합니다
- 전문 용어는 쉽게 풀어서 설명합니다
- 확실하지 않은 내용은 추측하지 않습니다`;

    case 'category-classifier':
      return `당신은 고객 문의를 정확하게 분류하는 전문가입니다.

역할:
- 티켓의 제목과 내용을 분석하여 가장 적절한 카테고리를 선택합니다
- 하나의 카테고리만 선택합니다
- 신뢰도 점수를 함께 제공합니다 (0.0 ~ 1.0)

응답 형식:
반드시 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요.
{
  "categoryName": "카테고리 이름",
  "confidence": 0.85,
  "reason": "선택한 이유 간단히 설명"
}`;

    case 'sentiment-analyzer':
      return `당신은 고객 문의의 감정을 분석하는 전문가입니다.

역할:
- 텍스트에서 감정을 분석합니다
- positive(긍정), neutral(중립), negative(부정) 중 하나를 선택합니다

응답 형식:
반드시 JSON 형식으로만 응답하세요. 다른 설명은 포함하지 마세요.
{
  "sentiment": "positive|neutral|negative",
  "confidence": 0.85,
  "reason": "판단 근거 간단히 설명"
}`;

    default:
      return 'You are a helpful assistant.';
  }
}

/**
 * Default template variables
 */
export interface TemplateVariables {
  title?: string;
  content?: string;
  category?: string;
  knowledge_base?: string;
  [key: string]: string | undefined;
}

/**
 * Build prompt with template and variables
 *
 * Replaces {variable_name} placeholders with actual values.
 */
export function buildPromptWithTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let result = template;

  // Replace all {variable} placeholders
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined) {
      const placeholder = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(placeholder, value);
    }
  });

  return result;
}

/**
 * Default user prompt template for answer generation
 */
export const DEFAULT_ANSWER_TEMPLATE = `다음 고객 문의에 대한 답변을 작성해주세요:

제목: {title}
카테고리: {category}

문의 내용:
{content}

{knowledge_base}

위 정보를 참고하여 고객에게 도움이 되는 답변을 작성해주세요.`;

/**
 * Build knowledge base context for prompts
 */
export function buildKnowledgeBaseContext(
  knowledgeBaseEntries: Array<{ title: string; content: string }>
): string {
  if (knowledgeBaseEntries.length === 0) {
    return '';
  }

  const kbContent = knowledgeBaseEntries
    .map((entry, index) => `[참고 자료 ${index + 1}] ${entry.title}\n${entry.content}`)
    .join('\n\n');

  return `참고 자료:\n${kbContent}`;
}

/**
 * Build category list for classification
 */
export function buildCategoryList(
  categories: Array<{ name: string; id: string }>
): string {
  const categoryNames = categories.map(c => c.name).join(', ');
  return `다음 카테고리 중에서 선택하세요: ${categoryNames}`;
}
