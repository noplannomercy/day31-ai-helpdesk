import type { TicketStatus, TicketPriority, UserRole } from './types';

// ============================================================================
// TICKET CONSTANTS
// ============================================================================

export const TICKET_STATUS: Record<TicketStatus, { label: string; color: string }> = {
  open: { label: '열림', color: 'blue' },
  in_progress: { label: '진행중', color: 'yellow' },
  resolved: { label: '해결됨', color: 'green' },
  closed: { label: '닫힘', color: 'gray' },
};

export const TICKET_PRIORITY: Record<TicketPriority, { label: string; color: string }> = {
  low: { label: '낮음', color: 'gray' },
  medium: { label: '보통', color: 'blue' },
  high: { label: '높음', color: 'red' },
};

export const TICKET_STATUS_FLOW: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'closed'],
  in_progress: ['resolved', 'open'],
  resolved: ['closed', 'open'],
  closed: ['open'], // 재오픈 (3일 이내)
};

// ============================================================================
// USER ROLE CONSTANTS
// ============================================================================

export const USER_ROLES: Record<UserRole, { label: string; color: string }> = {
  customer: { label: '고객', color: 'blue' },
  agent: { label: '상담원', color: 'green' },
  manager: { label: '관리자', color: 'purple' },
  admin: { label: '시스템 관리자', color: 'red' },
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 1,
  agent: 2,
  manager: 3,
  admin: 4,
};

// ============================================================================
// SLA CONSTANTS (in milliseconds)
// ============================================================================

export const SLA_RESPONSE_TIME = 1 * 60 * 60 * 1000; // 1 hour
export const SLA_RESOLVE_TIME = 24 * 60 * 60 * 1000; // 24 hours
export const SLA_WARNING_TIME = 30 * 60 * 1000; // 30 minutes before deadline
export const REOPEN_WINDOW = 3 * 24 * 60 * 60 * 1000; // 3 days

// ============================================================================
// FILE UPLOAD CONSTANTS
// ============================================================================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
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
];

export const FILE_TYPE_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG 이미지',
  'image/png': 'PNG 이미지',
  'image/gif': 'GIF 이미지',
  'image/webp': 'WebP 이미지',
  'application/pdf': 'PDF 문서',
  'application/msword': 'Word 문서',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word 문서',
  'application/vnd.ms-excel': 'Excel 문서',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel 문서',
  'text/plain': '텍스트 파일',
};

// ============================================================================
// PAGINATION CONSTANTS
// ============================================================================

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// ============================================================================
// SENTIMENT CONSTANTS
// ============================================================================

export const SENTIMENT_LABELS = {
  positive: { label: '긍정', color: 'green', icon: '😊' },
  neutral: { label: '중립', color: 'gray', icon: '😐' },
  negative: { label: '부정', color: 'red', icon: '😞' },
};

// ============================================================================
// RATING CONSTANTS
// ============================================================================

export const SATISFACTION_RATINGS = [
  { value: 1, label: '매우 불만족', emoji: '😞' },
  { value: 2, label: '불만족', emoji: '😕' },
  { value: 3, label: '보통', emoji: '😐' },
  { value: 4, label: '만족', emoji: '🙂' },
  { value: 5, label: '매우 만족', emoji: '😊' },
];

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

export const PROTECTED_ROUTES = ['/dashboard', '/tickets', '/profile'];
export const ADMIN_ROUTES = ['/admin'];
export const MANAGER_ROUTES = ['/reports'];
export const AUTH_ROUTES = ['/login', '/register'];
export const PUBLIC_ROUTES = ['/'];

// ============================================================================
// DATE FORMAT CONSTANTS
// ============================================================================

export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';
export const TIME_FORMAT = 'HH:mm';
