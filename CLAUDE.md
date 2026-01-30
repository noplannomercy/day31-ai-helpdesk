# AI Help Desk

## Overview
고객 문의 티켓 관리 + AI 답변 제안 시스템. 4개 역할(Customer/Agent/Manager/Admin), 단일 통합 앱.

## Tech Stack
- **Frontend**: Next.js 16 App Router, React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Server Actions
- **Auth**: NextAuth.js v5 (Credentials)
- **DB**: PostgreSQL + Drizzle ORM
- **AI**: OpenRouter API (LLM)
- **Email**: Nodemailer

## Key Features

### Ticket Management
- 웹 포털 전용 등록 (제목+내용 필수)
- 상태: Open → In Progress → Resolved → Closed
- 우선순위: Low/Medium/High (3단계)
- 카테고리: 1단계 평면 목록
- 파일 첨부: 이미지+문서 (5MB/파일)
- 양방향 댓글 + 내부 노트
- 3일 내 재오픈 가능
- 전체 이력 추적

### Agent Features
- 자동 할당 (Round-robin, 온라인만)
- 부재 시 자동 재할당
- AI 답변 제안 (Agent 직접 승인)
- 카테고리별 AI 프롬프트 템플릿

### SLA
- 응답: 1시간 / 해결: 24시간
- 이메일 알림 (위반 경고)

### Dashboard & Reports
- 기본 지표 (티켓 수, 상태별 현황)
- 화면 조회만 (Excel 내보내기 없음)
- 5점 만족도 수집

## Database Tables (8개)
```
users, tickets, ticket_comments, ticket_attachments,
ticket_histories, categories, ai_prompt_templates,
knowledge_bases, customer_satisfactions
```

## Directory Structure
```
app/
├── (auth)/          # 로그인/회원가입
├── (main)/          # 인증 필요 (Customer/Agent/Manager)
│   ├── dashboard/
│   ├── tickets/
│   └── reports/     # Manager+
├── (admin)/         # Admin 전용 (Back Office)
│   ├── users/
│   ├── categories/
│   ├── templates/
│   └── knowledge-base/
└── api/
```

## Implementation Approach

### Phase 1: Foundation
1. 프로젝트 셋업 (Next.js, Drizzle, shadcn/ui)
2. DB 스키마 생성 및 마이그레이션
3. NextAuth.js 인증 (4역할)
4. 레이아웃 + 네비게이션

### Phase 2: Core Features
1. 티켓 CRUD (Customer/Agent)
2. 댓글 시스템 (공개+내부)
3. 파일 업로드
4. 상태 관리 + 이력 추적

### Phase 3: Assignment & SLA
1. Round-robin 자동 할당
2. Agent 온라인/부재 상태
3. SLA 계산 및 알림

### Phase 4: AI Integration
1. OpenRouter API 연동
2. 카테고리 자동 분류
3. 답변 초안 생성
4. 감정 분석 (참고용)

### Phase 5: Admin & Reports
1. Back Office (사용자/카테고리/KB 관리)
2. 대시보드
3. 만족도 수집

## Important Notes

### Constraints (미지원)
- 이메일→티켓 변환, 다국어, 웹 푸시
- 티켓 병합, 에스컬레이션, 팀 구분
- Excel 내보내기, 고객용 FAQ

### Security
- 역할 기반 접근 제어 (RBAC)
- 민감 정보 마스킹 없음 (HTTPS만)

### UI/UX
- 반응형 웹 (모바일 최적화)
- 한국어 단일 언어

## Development Priorities
1. **P0**: 인증, 티켓 CRUD, 상태 관리
2. **P1**: 담당자 할당, 댓글, 파일 첨부
3. **P2**: AI 답변 제안, SLA
4. **P3**: 대시보드, Back Office
5. **P4**: 만족도, 보고서

## References
- `docs/SRS_FINAL.md`, `specs/ARCHITECTURE.md`, `specs/DATABASE.md`, `specs/COMPONENTS.md`
