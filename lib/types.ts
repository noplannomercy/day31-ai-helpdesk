import type { User, Ticket, TicketComment, Category } from './db/schema';

// User role types
export type UserRole = 'customer' | 'agent' | 'manager' | 'admin';

// Ticket status types
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

// Ticket priority types
export type TicketPriority = 'low' | 'medium' | 'high';

// Sentiment types
export type Sentiment = 'positive' | 'neutral' | 'negative';

// Extended types with relations
export interface TicketWithRelations extends Ticket {
  customer: User;
  agent?: User | null;
  category?: Category | null;
  commentsCount?: number;
  attachmentsCount?: number;
}

export interface CommentWithAuthor extends TicketComment {
  author: User;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
}

export interface TicketFormData {
  title: string;
  content: string;
  priority: TicketPriority;
  categoryId?: string;
}

export interface CommentFormData {
  content: string;
  isInternal: boolean;
}

// Filter types
export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  agentId?: string;
  customerId?: string;
  search?: string;
}

// Statistics types
export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  avgResponseTime?: number;
  avgResolutionTime?: number;
  slaComplianceRate?: number;
}

export interface AgentStats {
  agentId: string;
  agentName: string;
  assignedTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
}

// SLA types
export interface SLAStatus {
  isResponseOverdue: boolean;
  isResolveOverdue: boolean;
  responseTimeRemaining?: number;
  resolveTimeRemaining?: number;
}
