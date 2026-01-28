# TeamWiki - Database Schema

> **Version**: 1.0
> **Date**: 2026-01-27
> **ORM**: Drizzle ORM
> **Database**: PostgreSQL 16

---

## Table of Contents
1. [Overview](#overview)
2. [Database Configuration](#database-configuration)
3. [Core Tables](#core-tables)
4. [Relationship Tables](#relationship-tables)
5. [Indexes & Performance](#indexes--performance)
6. [Drizzle Schema](#drizzle-schema)
7. [Migrations](#migrations)
8. [Queries & Examples](#queries--examples)

---

## Overview

TeamWiki uses **PostgreSQL 16** with **Drizzle ORM** for type-safe database access. The schema is designed for:

- **Multi-tenancy**: Workspace-based isolation
- **Soft deletes**: User deletion preserves documents
- **Audit trails**: Created/updated timestamps on all tables
- **Versioning**: Permanent version history with diff storage
- **Full-text search**: PostgreSQL GIN indexes for search
- **AI integration**: Job tracking and suggestion acceptance

### Key Design Decisions

1. **UUID Primary Keys**: For security and distributed systems
2. **No Cascading Deletes**: Explicit control over data retention
3. **JSON for Content**: Flexible document structure (Tiptap JSON)
4. **Depth Tracking**: Folder depth column for validation (max 5)
5. **Soft Deletes**: `is_deleted` + `deleted_at` for users
6. **Title Duplication**: Allowed, documents identified by UUID

---

## Database Configuration

### Connection Setup

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

export const client = postgres(connectionString, {
  prepare: false, // For Neon serverless
  max: 10, // Connection pool size
})

export const db = drizzle(client, { schema })
```

### Environment Variables

```bash
# Primary connection (for queries)
DATABASE_URL="postgresql://user:password@host:5432/teamwiki?sslmode=require"

# Direct connection (for migrations)
DATABASE_DIRECT_URL="postgresql://user:password@host:5432/teamwiki"
```

---

## Core Tables

### 1. Workspaces

**Purpose**: Top-level tenant isolation. MVP supports 1 workspace per user.

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- `name` cannot be empty
- `primary_color` must be valid hex (#RRGGBB)

**Indexes**:
```sql
-- None needed for MVP (single workspace)
```

---

### 2. Users

**Purpose**: User accounts with OAuth and email/password support.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Nullable for OAuth users
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  oauth_provider VARCHAR(50), -- 'google' | 'github' | NULL
  oauth_id VARCHAR(255), -- OAuth provider user ID
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- `email` must be unique and valid format
- `password_hash` nullable only if `oauth_provider` is set
- `oauth_id` must be unique per provider
- `deleted_at` set when `is_deleted` = true

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
```

**Security**:
- Passwords hashed with bcrypt (rounds=10)
- OAuth tokens stored in NextAuth sessions, not database

---

### 3. Workspace Members

**Purpose**: User-workspace relationship with roles.

```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joined_at TIMESTAMP NOT NULL DEFAULT now(),
  left_at TIMESTAMP, -- Nullable, set when member removed
  is_active BOOLEAN NOT NULL DEFAULT true,

  UNIQUE(workspace_id, user_id)
);
```

**Constraints**:
- One workspace membership per user (enforced by unique constraint)
- At least one `owner` per workspace (application-enforced)
- `left_at` set when member removed, `is_active` = false

**Indexes**:
```sql
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_active ON workspace_members(workspace_id, is_active);
```

---

### 4. Folders

**Purpose**: Hierarchical document organization (max 5 levels).

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  parent_folder_id UUID REFERENCES folders(id), -- Nullable for root folders
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT '📁',
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color
  depth INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth <= 5),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- `depth` must be 0-5 (0 = root level)
- `parent_folder_id` must exist if not null
- Cannot create circular references (application-enforced)

**Indexes**:
```sql
CREATE INDEX idx_folders_workspace ON folders(workspace_id);
CREATE INDEX idx_folders_parent ON folders(parent_folder_id);
CREATE INDEX idx_folders_depth ON folders(workspace_id, depth);
```

**Depth Calculation**:
```sql
-- Recursive query to get folder depth
WITH RECURSIVE folder_path AS (
  SELECT id, parent_folder_id, 0 AS depth
  FROM folders
  WHERE parent_folder_id IS NULL

  UNION ALL

  SELECT f.id, f.parent_folder_id, fp.depth + 1
  FROM folders f
  JOIN folder_path fp ON f.parent_folder_id = fp.id
)
SELECT * FROM folder_path;
```

---

### 5. Documents

**Purpose**: Core content storage with no size limit.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  folder_id UUID REFERENCES folders(id), -- Nullable for root-level docs
  title VARCHAR(500) NOT NULL, -- Duplicates allowed
  content JSONB NOT NULL, -- Tiptap JSON structure
  ai_summary TEXT, -- Nullable, set by AI
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- `title` can be duplicated (documents identified by UUID)
- `content` must be valid JSON (Tiptap format)
- `ai_summary` nullable until AI processing completes

**Indexes**:
```sql
CREATE INDEX idx_documents_workspace ON documents(workspace_id);
CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_updated ON documents(updated_at DESC);

-- Full-text search
CREATE INDEX idx_documents_title_fts ON documents USING GIN(to_tsvector('english', title));
CREATE INDEX idx_documents_content_fts ON documents USING GIN(to_tsvector('english', content::text));
```

**Content Structure** (Tiptap JSON):
```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Document Title" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Content here..." }]
    },
    {
      "type": "image",
      "attrs": {
        "src": "https://...",
        "alt": "Image description"
      }
    }
  ]
}
```

---

### 6. Document Versions

**Purpose**: Permanent version history with diff storage.

```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  content JSONB NOT NULL, -- Full snapshot
  diff JSONB, -- Delta from previous version (for efficiency)
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- Never deleted (permanent retention)
- `diff` nullable for first version

**Indexes**:
```sql
CREATE INDEX idx_document_versions_document ON document_versions(document_id, created_at DESC);
```

**Diff Format** (JSON Patch RFC 6902):
```json
[
  { "op": "replace", "path": "/content/0/content/0/text", "value": "New title" },
  { "op": "add", "path": "/content/-", "value": { "type": "paragraph", "content": [...] } }
]
```

---

### 7. Images

**Purpose**: Track uploaded images (PNG/JPG/GIF, auto-optimized).

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL, -- Bytes
  mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/gif')),
  is_optimized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- `file_size` post-optimization if > 1MB
- `is_optimized` = true if Sharp processing applied

**Indexes**:
```sql
CREATE INDEX idx_images_document ON images(document_id);
```

**Image Lifecycle**:
1. Upload → Validate MIME type
2. If size > 1MB → Sharp optimize (quality 80-85%, max 1920px)
3. Upload to storage (Uploadthing/S3)
4. INSERT into `images` table
5. On document delete → DELETE from storage + table

---

### 8. Tags

**Purpose**: Document categorization (manual + AI-generated).

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),

  UNIQUE(workspace_id, name) -- Tag names unique per workspace
);
```

**Constraints**:
- `name` unique per workspace (case-insensitive recommended)
- `is_ai_generated` = true for AI-created tags

**Indexes**:
```sql
CREATE INDEX idx_tags_workspace ON tags(workspace_id);
CREATE INDEX idx_tags_ai_generated ON tags(workspace_id, is_ai_generated);
```

---

### 9. Document Tags (Junction Table)

**Purpose**: Many-to-many relationship between documents and tags.

```sql
CREATE TABLE document_tags (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  is_accepted BOOLEAN NOT NULL DEFAULT true, -- false for AI suggestions
  created_at TIMESTAMP NOT NULL DEFAULT now(),

  PRIMARY KEY (document_id, tag_id)
);
```

**Constraints**:
- `is_accepted` = false when AI suggests, true when user accepts/creates manually
- Cascade delete when document or tag deleted

**Indexes**:
```sql
CREATE INDEX idx_document_tags_document ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag ON document_tags(tag_id);
CREATE INDEX idx_document_tags_pending ON document_tags(document_id, is_accepted);
```

**AI Workflow**:
1. AI suggests tags → INSERT with `is_accepted` = false
2. User accepts → UPDATE `is_accepted` = true
3. User rejects → DELETE row

---

### 10. Comments

**Purpose**: Document annotations with threading and resolution.

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id), -- Nullable for top-level comments
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES users(id), -- Nullable until resolved
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  is_edited BOOLEAN NOT NULL DEFAULT false
);
```

**Constraints**:
- `parent_comment_id` for threading (max 1 level recommended)
- `resolved_by` can be document owner OR comment creator
- Viewer role CAN create/edit own comments

**Indexes**:
```sql
CREATE INDEX idx_comments_document ON comments(document_id, created_at DESC);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);

-- Full-text search on comments
CREATE INDEX idx_comments_content_fts ON comments USING GIN(to_tsvector('english', content));
```

**Permission Rules**:
- **Create**: Viewer, Editor, Admin, Owner
- **Edit own**: Comment creator
- **Delete own**: Comment creator
- **Delete any**: Admin, Owner

---

### 11. Favorites

**Purpose**: User-specific bookmarks (max 20 per user).

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  document_id UUID REFERENCES documents(id), -- Nullable if favoriting folder
  folder_id UUID REFERENCES folders(id), -- Nullable if favoriting document
  "order" INTEGER NOT NULL DEFAULT 0, -- Display order
  created_at TIMESTAMP NOT NULL DEFAULT now(),

  CHECK (
    (document_id IS NOT NULL AND folder_id IS NULL) OR
    (document_id IS NULL AND folder_id IS NOT NULL)
  ), -- Either document OR folder, not both
  UNIQUE(user_id, document_id),
  UNIQUE(user_id, folder_id)
);
```

**Constraints**:
- Max 20 favorites per user (application-enforced)
- Must favorite either document OR folder, not both
- `order` for drag-and-drop sorting

**Indexes**:
```sql
CREATE INDEX idx_favorites_user ON favorites(user_id, "order");
```

---

### 12. Share Links

**Purpose**: Public/password-protected document sharing.

```sql
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  token VARCHAR(255) UNIQUE NOT NULL, -- UUID + hashed
  password VARCHAR(255), -- Nullable, bcrypt hashed if set
  expires_at TIMESTAMP, -- Nullable for permanent links
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- `token` must be unique (UUID + hashed for security)
- `password` bcrypt hashed if set
- `expires_at` nullable for no expiration

**Indexes**:
```sql
CREATE UNIQUE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_links_document ON share_links(document_id);
```

**Security**:
- Token format: `https://teamwiki.app/share/{uuid}`
- Password optional, hashed with bcrypt
- View count incremented on each access

---

### 13. Activities

**Purpose**: Audit trail for all workspace actions.

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'commented', 'shared', 'deleted')),
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('document', 'folder', 'comment')),
  target_id UUID NOT NULL, -- ID of document/folder/comment
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

**Constraints**:
- `target_id` references document/folder/comment (not foreign key for flexibility)
- Immutable (no updates/deletes)

**Indexes**:
```sql
CREATE INDEX idx_activities_workspace ON activities(workspace_id, created_at DESC);
CREATE INDEX idx_activities_user ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_target ON activities(target_type, target_id);
```

**Retention**: Permanent in MVP, consider archiving strategy for production

---

### 14. AI Jobs

**Purpose**: Track background AI processing (tagging, summarization).

```sql
CREATE TABLE ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('tagging', 'summarize', 'qa')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT, -- Nullable until failure
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  completed_at TIMESTAMP -- Nullable until completion
);
```

**Constraints**:
- `retry_count` max 3 (application-enforced)
- `error_message` set on failure
- `completed_at` set when status = 'completed' or 'failed'

**Indexes**:
```sql
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status, created_at);
CREATE INDEX idx_ai_jobs_document ON ai_jobs(document_id, created_at DESC);
```

**Job States**:
1. `pending` → Job created, waiting for worker
2. `processing` → Worker picked up job
3. `completed` → Success, result saved
4. `failed` → Max retries reached, error logged

---

## Relationship Tables

### Entity Relationship Summary

```
workspaces
  ├─ 1:N workspace_members
  ├─ 1:N folders
  ├─ 1:N documents
  ├─ 1:N tags
  └─ 1:N activities

users
  ├─ 1:N workspace_members
  ├─ 1:N documents (created_by)
  ├─ 1:N comments
  └─ 1:N favorites

folders
  ├─ 1:N folders (parent-child)
  └─ 1:N documents

documents
  ├─ 1:N document_versions
  ├─ 1:N images
  ├─ N:M tags (via document_tags)
  ├─ 1:N comments
  ├─ 1:N favorites
  ├─ 1:N share_links
  └─ 1:N ai_jobs

comments
  └─ 1:N comments (parent-child)
```

---

## Indexes & Performance

### Primary Indexes (Automatically Created)

```sql
-- Primary keys (B-tree indexes)
workspaces(id), users(id), workspace_members(id), folders(id),
documents(id), document_versions(id), images(id), tags(id),
comments(id), favorites(id), share_links(id), activities(id), ai_jobs(id)

-- Unique constraints (B-tree indexes)
users(email), share_links(token), tags(workspace_id, name),
workspace_members(workspace_id, user_id)
```

### Full-Text Search Indexes (GIN)

```sql
-- Documents
CREATE INDEX idx_documents_title_fts
  ON documents USING GIN(to_tsvector('english', title));

CREATE INDEX idx_documents_content_fts
  ON documents USING GIN(to_tsvector('english', content::text));

-- Comments
CREATE INDEX idx_comments_content_fts
  ON comments USING GIN(to_tsvector('english', content));
```

**Search Query Example**:
```sql
SELECT id, title, ts_rank(to_tsvector('english', title || ' ' || content::text), query) AS rank
FROM documents, plainto_tsquery('english', 'API 명세') AS query
WHERE to_tsvector('english', title || ' ' || content::text) @@ query
ORDER BY rank DESC
LIMIT 20;
```

### Performance Monitoring

```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 500 -- milliseconds
ORDER BY mean_exec_time DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Drizzle Schema

### Schema Definition (TypeScript)

```typescript
// lib/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb, check } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Workspaces
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#3B82F6'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Users
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  oauthProvider: varchar('oauth_provider', { length: 50 }),
  oauthId: varchar('oauth_id', { length: 255 }),
  isDeleted: boolean('is_deleted').notNull().default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Workspace Members
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: varchar('role', { length: 20 }).notNull(), // 'owner' | 'admin' | 'editor' | 'viewer'
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  leftAt: timestamp('left_at'),
  isActive: boolean('is_active').notNull().default(true),
})

// Folders
export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  parentFolderId: uuid('parent_folder_id').references(() => folders.id),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 50 }).default('📁'),
  color: varchar('color', { length: 7 }).default('#6B7280'),
  depth: integer('depth').notNull().default(0),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  depthCheck: check('depth_check', `${table.depth} >= 0 AND ${table.depth} <= 5`)
}))

// Documents
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  folderId: uuid('folder_id').references(() => folders.id),
  title: varchar('title', { length: 500 }).notNull(),
  content: jsonb('content').notNull(),
  aiSummary: text('ai_summary'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Document Versions
export const documentVersions = pgTable('document_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  content: jsonb('content').notNull(),
  diff: jsonb('diff'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Images
export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  fileUrl: text('file_url').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  isOptimized: boolean('is_optimized').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Tags
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  isAiGenerated: boolean('is_ai_generated').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Document Tags
export const documentTags = pgTable('document_tags', {
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  isAccepted: boolean('is_accepted').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: { columns: [table.documentId, table.tagId] }
}))

// Comments
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  parentCommentId: uuid('parent_comment_id').references(() => comments.id),
  resolved: boolean('resolved').notNull().default(false),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  isEdited: boolean('is_edited').notNull().default(false),
})

// Favorites
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  documentId: uuid('document_id').references(() => documents.id),
  folderId: uuid('folder_id').references(() => folders.id),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Share Links
export const shareLinks = pgTable('share_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  expiresAt: timestamp('expires_at'),
  viewCount: integer('view_count').notNull().default(0),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Activities
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 50 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: uuid('target_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// AI Jobs
export const aiJobs = pgTable('ai_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  jobType: varchar('job_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})

// Relations
export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [documents.workspaceId],
    references: [workspaces.id],
  }),
  folder: one(folders, {
    fields: [documents.folderId],
    references: [folders.id],
  }),
  creator: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  versions: many(documentVersions),
  images: many(images),
  tags: many(documentTags),
  comments: many(comments),
  shareLinks: many(shareLinks),
  aiJobs: many(aiJobs),
}))
```

---

## Migrations

### Drizzle Kit Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_DIRECT_URL!,
  },
} satisfies Config
```

### Migration Commands

```bash
# Generate migration from schema changes
npx drizzle-kit generate:pg

# Push schema to database (dev only)
npx drizzle-kit push:pg

# Run migrations
npx drizzle-kit migrate

# Studio (visual database browser)
npx drizzle-kit studio
```

### Initial Migration

```sql
-- drizzle/migrations/0000_initial.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all tables (see SQL definitions above)
-- ...

-- Create indexes
-- ...

-- Insert seed data (optional)
INSERT INTO workspaces (name) VALUES ('Default Workspace');
```

---

## Queries & Examples

### Common Query Patterns

#### 1. Get User's Workspace with Role

```typescript
import { db } from '@/lib/db'
import { workspaces, workspaceMembers, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

async function getUserWorkspace(userId: string) {
  return await db
    .select({
      workspace: workspaces,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.isActive, true)
      )
    )
    .limit(1)
}
```

#### 2. Get Documents with Creator Info

```typescript
async function getDocumentsWithCreator(workspaceId: string) {
  return await db
    .select({
      document: documents,
      creator: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(documents)
    .innerJoin(users, eq(documents.createdBy, users.id))
    .where(eq(documents.workspaceId, workspaceId))
    .orderBy(desc(documents.updatedAt))
}
```

#### 3. Search Documents + Comments (Full-Text)

```typescript
import { sql } from 'drizzle-orm'

async function searchDocumentsAndComments(query: string, workspaceId: string) {
  // Search documents
  const docResults = await db
    .select({
      id: documents.id,
      title: documents.title,
      type: sql<string>`'document'`,
      rank: sql<number>`ts_rank(to_tsvector('english', ${documents.title} || ' ' || ${documents.content}::text), plainto_tsquery('english', ${query}))`,
    })
    .from(documents)
    .where(
      and(
        eq(documents.workspaceId, workspaceId),
        sql`to_tsvector('english', ${documents.title} || ' ' || ${documents.content}::text) @@ plainto_tsquery('english', ${query})`
      )
    )

  // Search comments
  const commentResults = await db
    .select({
      id: comments.id,
      documentId: comments.documentId,
      content: comments.content,
      type: sql<string>`'comment'`,
      rank: sql<number>`ts_rank(to_tsvector('english', ${comments.content}), plainto_tsquery('english', ${query}))`,
    })
    .from(comments)
    .innerJoin(documents, eq(comments.documentId, documents.id))
    .where(
      and(
        eq(documents.workspaceId, workspaceId),
        sql`to_tsvector('english', ${comments.content}) @@ plainto_tsquery('english', ${query})`
      )
    )

  return [...docResults, ...commentResults].sort((a, b) => b.rank - a.rank)
}
```

#### 4. Check Folder Depth Before Creation

```typescript
async function validateFolderDepth(parentFolderId: string | null): Promise<number> {
  if (!parentFolderId) return 0

  const result = await db.execute(sql`
    WITH RECURSIVE folder_path AS (
      SELECT id, parent_folder_id, depth
      FROM folders
      WHERE id = ${parentFolderId}

      UNION ALL

      SELECT f.id, f.parent_folder_id, f.depth
      FROM folders f
      JOIN folder_path fp ON f.id = fp.parent_folder_id
    )
    SELECT MAX(depth) AS max_depth FROM folder_path
  `)

  const maxDepth = result.rows[0]?.max_depth ?? 0
  if (maxDepth >= 5) {
    throw new Error('Maximum folder depth (5) exceeded')
  }
  return maxDepth + 1
}
```

#### 5. Get Document with AI Suggested Tags

```typescript
async function getDocumentWithSuggestedTags(documentId: string) {
  return await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
    with: {
      tags: {
        with: {
          tag: true,
        },
        where: eq(documentTags.isAccepted, false), // Only pending suggestions
      },
    },
  })
}
```

#### 6. Transfer Document Ownership (Member Removal)

```typescript
async function transferDocumentsOnMemberRemoval(userId: string, newOwnerId: string) {
  await db.transaction(async (tx) => {
    // Update documents
    await tx
      .update(documents)
      .set({ createdBy: newOwnerId })
      .where(eq(documents.createdBy, userId))

    // Mark user as deleted
    await tx
      .update(users)
      .set({ isDeleted: true, deletedAt: new Date() })
      .where(eq(users.id, userId))

    // Deactivate workspace membership
    await tx
      .update(workspaceMembers)
      .set({ isActive: false, leftAt: new Date() })
      .where(eq(workspaceMembers.userId, userId))
  })
}
```

---

## Document Version

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-27 | Initial database schema document |

**Status**: ✅ Complete - Ready for Drizzle implementation
