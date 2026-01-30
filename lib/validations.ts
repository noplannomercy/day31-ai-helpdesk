import { z } from 'zod';

// ============================================================================
// AUTH VALIDATIONS
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
});

export const registerSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '비밀번호에 대문자가 포함되어야 합니다')
    .regex(/[a-z]/, '비밀번호에 소문자가 포함되어야 합니다')
    .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
});

// ============================================================================
// USER VALIDATIONS
// ============================================================================

export const userCreateSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력하세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  role: z.enum(['customer', 'agent', 'manager', 'admin']),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다').optional(),
  role: z.enum(['customer', 'agent', 'manager', 'admin']).optional(),
  isOnline: z.boolean().optional(),
  isAway: z.boolean().optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
  newPassword: z
    .string()
    .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Z]/, '비밀번호에 대문자가 포함되어야 합니다')
    .regex(/[a-z]/, '비밀번호에 소문자가 포함되어야 합니다')
    .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다'),
});

export const userStatusUpdateSchema = z.object({
  isOnline: z.boolean().optional(),
  isAway: z.boolean().optional(),
}).refine(data => data.isOnline !== undefined || data.isAway !== undefined, {
  message: 'isOnline 또는 isAway 중 하나는 필수입니다',
});

// ============================================================================
// TICKET VALIDATIONS
// ============================================================================

export const ticketCreateSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(200, '제목은 최대 200자까지 입력 가능합니다'),
  content: z
    .string()
    .min(10, '내용은 최소 10자 이상이어야 합니다')
    .max(5000, '내용은 최대 5000자까지 입력 가능합니다'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  categoryId: z.string().uuid('올바른 카테고리를 선택하세요').optional(),
});

export const ticketUpdateSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(200, '제목은 최대 200자까지 입력 가능합니다')
    .optional(),
  content: z
    .string()
    .min(10, '내용은 최소 10자 이상이어야 합니다')
    .max(5000, '내용은 최대 5000자까지 입력 가능합니다')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
});

export const ticketStatusUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const ticketAssignSchema = z.object({
  agentId: z.string().uuid('올바른 담당자를 선택하세요'),
});

// ============================================================================
// COMMENT VALIDATIONS
// ============================================================================

export const commentCreateSchema = z.object({
  content: z
    .string()
    .min(1, '댓글 내용을 입력하세요')
    .max(2000, '댓글은 최대 2000자까지 입력 가능합니다'),
  isInternal: z.boolean().default(false),
});

// ============================================================================
// CATEGORY VALIDATIONS
// ============================================================================

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(2, '카테고리명은 최소 2자 이상이어야 합니다')
    .max(100, '카테고리명은 최대 100자까지 입력 가능합니다'),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const categoryUpdateSchema = z.object({
  name: z
    .string()
    .min(2, '카테고리명은 최소 2자 이상이어야 합니다')
    .max(100, '카테고리명은 최대 100자까지 입력 가능합니다')
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// KNOWLEDGE BASE VALIDATIONS
// ============================================================================

export const knowledgeBaseCreateSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(200, '제목은 최대 200자까지 입력 가능합니다'),
  content: z
    .string()
    .min(10, '내용은 최소 10자 이상이어야 합니다')
    .max(10000, '내용은 최대 10000자까지 입력 가능합니다'),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

export const knowledgeBaseUpdateSchema = z.object({
  title: z
    .string()
    .min(5, '제목은 최소 5자 이상이어야 합니다')
    .max(200, '제목은 최대 200자까지 입력 가능합니다')
    .optional(),
  content: z
    .string()
    .min(10, '내용은 최소 10자 이상이어야 합니다')
    .max(10000, '내용은 최대 10000자까지 입력 가능합니다')
    .optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// AI TEMPLATE VALIDATIONS
// ============================================================================

export const aiTemplateCreateSchema = z.object({
  categoryId: z.string().uuid('올바른 카테고리를 선택하세요'),
  systemPrompt: z
    .string()
    .min(10, '시스템 프롬프트는 최소 10자 이상이어야 합니다')
    .max(5000, '시스템 프롬프트는 최대 5000자까지 입력 가능합니다'),
  userPromptTemplate: z
    .string()
    .min(10, '사용자 프롬프트 템플릿은 최소 10자 이상이어야 합니다')
    .max(5000, '사용자 프롬프트 템플릿은 최대 5000자까지 입력 가능합니다'),
});

export const aiTemplateUpdateSchema = z.object({
  systemPrompt: z
    .string()
    .min(10, '시스템 프롬프트는 최소 10자 이상이어야 합니다')
    .max(5000, '시스템 프롬프트는 최대 5000자까지 입력 가능합니다')
    .optional(),
  userPromptTemplate: z
    .string()
    .min(10, '사용자 프롬프트 템플릿은 최소 10자 이상이어야 합니다')
    .max(5000, '사용자 프롬프트 템플릿은 최대 5000자까지 입력 가능합니다')
    .optional(),
});

// ============================================================================
// SATISFACTION VALIDATIONS
// ============================================================================

export const satisfactionCreateSchema = z.object({
  rating: z.number().int().min(1, '최소 1점').max(5, '최대 5점'),
  feedback: z.string().max(1000, '피드백은 최대 1000자까지 입력 가능합니다').optional(),
});

// ============================================================================
// FILE UPLOAD VALIDATIONS
// ============================================================================

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, '파일 크기는 5MB 이하여야 합니다')
    .refine(
      (file) =>
        [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ].includes(file.type),
      '지원하지 않는 파일 형식입니다'
    ),
});

// ============================================================================
// PAGINATION VALIDATIONS
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

// ============================================================================
// SEARCH & FILTER VALIDATIONS
// ============================================================================

export const ticketFiltersSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  categoryId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type KnowledgeBaseCreateInput = z.infer<typeof knowledgeBaseCreateSchema>;
export type KnowledgeBaseUpdateInput = z.infer<typeof knowledgeBaseUpdateSchema>;
export type SatisfactionCreateInput = z.infer<typeof satisfactionCreateSchema>;
export type TicketFiltersInput = z.infer<typeof ticketFiltersSchema>;
