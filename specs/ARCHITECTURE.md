# AI Help Desk - 시스템 아키텍처

## 개요

AI Help Desk는 Next.js 기반의 풀스택 애플리케이션으로, 고객 문의 티켓 관리와 AI 기반 답변 제안 기능을 제공합니다.

---

## 시스템 아키텍처

```mermaid
graph TB
    subgraph Client["클라이언트"]
        Browser["웹 브라우저<br/>(반응형)"]
    end

    subgraph NextJS["Next.js 16 App"]
        subgraph Frontend["프론트엔드"]
            Pages["App Router<br/>Pages"]
            Components["React<br/>Components"]
            UI["shadcn/ui"]
        end

        subgraph Backend["백엔드"]
            API["API Routes"]
            ServerActions["Server Actions"]
            Auth["NextAuth.js"]
        end
    end

    subgraph External["외부 서비스"]
        OpenRouter["OpenRouter API<br/>(LLM)"]
        Email["이메일 서비스<br/>(SMTP)"]
    end

    subgraph Database["데이터베이스"]
        PostgreSQL["PostgreSQL"]
        Drizzle["Drizzle ORM"]
    end

    subgraph Storage["파일 저장소"]
        FileStorage["로컬/클라우드<br/>스토리지"]
    end

    Browser --> Pages
    Pages --> Components
    Components --> UI
    Pages --> API
    Pages --> ServerActions
    API --> Auth
    ServerActions --> Auth
    API --> Drizzle
    ServerActions --> Drizzle
    Drizzle --> PostgreSQL
    API --> OpenRouter
    API --> Email
    API --> FileStorage
```

---

## 컴포넌트 계층 구조

```mermaid
graph TD
    subgraph App["Application"]
        Layout["RootLayout"]

        subgraph AuthRoutes["인증 라우트"]
            Login["로그인"]
            Register["회원가입"]
        end

        subgraph MainApp["Main App (인증 필요)"]
            CustomerPages["Customer 페이지"]
            AgentPages["Agent 페이지"]
            ManagerPages["Manager 페이지"]
        end

        subgraph BackOffice["Back Office (Admin)"]
            UserMgmt["사용자 관리"]
            CategoryMgmt["카테고리 관리"]
            TemplateMgmt["AI 템플릿 관리"]
            KBMgmt["지식베이스 관리"]
        end
    end

    Layout --> AuthRoutes
    Layout --> MainApp
    Layout --> BackOffice
```

---

## 데이터 흐름

### 티켓 생성 흐름

```mermaid
sequenceDiagram
    participant C as Customer
    participant UI as 웹 UI
    participant API as API Route
    participant AI as OpenRouter
    participant DB as PostgreSQL
    participant Email as 이메일 서비스

    C->>UI: 티켓 작성
    UI->>API: POST /api/tickets
    API->>DB: 티켓 저장
    API->>AI: 카테고리 분류 요청
    AI-->>API: 분류 결과
    API->>DB: 카테고리 업데이트
    API->>DB: Round-robin 담당자 조회
    API->>DB: 담당자 할당
    API->>Email: Agent 알림 발송
    API-->>UI: 티켓 생성 완료
    UI-->>C: 결과 표시
```

### AI 답변 제안 흐름

```mermaid
sequenceDiagram
    participant A as Agent
    participant UI as 웹 UI
    participant API as API Route
    participant AI as OpenRouter
    participant DB as PostgreSQL
    participant Email as 이메일 서비스

    A->>UI: 티켓 상세 조회
    UI->>API: GET /api/tickets/:id
    API->>DB: 티켓 정보 조회
    API->>DB: 지식베이스 검색
    API->>AI: 답변 초안 생성 요청
    AI-->>API: AI 답변 초안
    API-->>UI: 티켓 + AI 답변
    A->>UI: 답변 수정/승인
    UI->>API: POST /api/tickets/:id/reply
    API->>DB: 댓글 저장
    API->>DB: 티켓 상태 업데이트
    API->>Email: 고객 답변 알림
    API-->>UI: 완료
```

---

## NextAuth.js 통합 (4 역할)

### 인증 설정

```mermaid
graph LR
    subgraph Auth["NextAuth.js"]
        Provider["Credentials Provider"]
        Session["Session Management"]
        JWT["JWT Strategy"]
    end

    subgraph Roles["역할 (4종)"]
        Customer["Customer"]
        Agent["Agent"]
        Manager["Manager"]
        Admin["Admin"]
    end

    Provider --> Session
    Session --> JWT
    JWT --> Roles
```

### 역할별 권한 매트릭스

| 기능 | Customer | Agent | Manager | Admin |
|------|:--------:|:-----:|:-------:|:-----:|
| 티켓 생성 | O | O | O | O |
| 내 티켓 조회 | O | - | - | - |
| 할당된 티켓 처리 | - | O | O | O |
| 모든 티켓 조회 | - | - | O | O |
| AI 답변 사용 | - | O | O | O |
| 내부 노트 작성 | - | O | O | O |
| 대시보드 (개인) | O | O | - | - |
| 대시보드 (전체) | - | - | O | O |
| 통계/보고서 | - | - | O | O |
| 사용자 관리 | - | - | - | O |
| 카테고리 관리 | - | - | - | O |
| AI 템플릿 관리 | - | - | - | O |
| 지식베이스 관리 | - | - | O | O |

### 미들웨어 보호

```typescript
// middleware.ts 구조
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tickets/:path*',
    '/admin/:path*',
    '/api/:path*'
  ]
}
```

### 역할 기반 라우트 보호

| 경로 패턴 | 허용 역할 |
|----------|----------|
| `/` | 모든 사용자 |
| `/auth/*` | 비로그인 사용자 |
| `/dashboard` | Customer, Agent |
| `/tickets` | Customer, Agent, Manager |
| `/tickets/:id` | 관련 사용자 (본인 티켓 또는 담당자) |
| `/reports` | Manager, Admin |
| `/admin/*` | Admin |

---

## OpenRouter API 통합 (LLM)

### API 연동 구조

```mermaid
graph LR
    subgraph App["Next.js App"]
        Service["AI Service"]
        Cache["응답 캐시"]
    end

    subgraph OpenRouter["OpenRouter API"]
        Completion["Chat Completion"]
        Models["모델 선택"]
    end

    Service --> Cache
    Service --> Completion
    Completion --> Models
```

### LLM 기능별 사용

| 기능 | 용도 | 프롬프트 소스 |
|------|------|-------------|
| 카테고리 분류 | 티켓 자동 분류 | 시스템 프롬프트 |
| 답변 초안 생성 | AI 답변 제안 | 카테고리별 템플릿 + 지식베이스 |
| 유사 티켓 검색 | 과거 티켓 참조 | 시스템 프롬프트 |
| 감정 분석 | 고객 감정 파악 | 시스템 프롬프트 |

### API 호출 구조

```typescript
// AI Service 구조
interface AIService {
  classifyTicket(content: string): Promise<Category>
  generateResponse(ticket: Ticket, kb: KnowledgeBase[]): Promise<string>
  findSimilarTickets(content: string): Promise<Ticket[]>
  analyzeSentiment(content: string): Promise<Sentiment>
}
```

---

## Main App vs Back Office 구조

### 통합 애플리케이션 구조

```mermaid
graph TB
    subgraph App["단일 Next.js 애플리케이션"]
        subgraph Common["공통"]
            Layout["공통 레이아웃"]
            Auth["인증 시스템"]
            API["API Routes"]
        end

        subgraph MainApp["Main App"]
            subgraph CustomerUI["Customer 영역"]
                CTickets["내 티켓 관리"]
                CProfile["프로필"]
            end

            subgraph AgentUI["Agent 영역"]
                ATickets["티켓 처리"]
                AResponse["AI 답변"]
                ADashboard["대시보드"]
            end

            subgraph ManagerUI["Manager 영역"]
                MReports["보고서"]
                MStats["통계"]
                MTickets["전체 티켓"]
            end
        end

        subgraph BackOffice["Back Office (Admin 전용)"]
            UserMgmt["사용자 관리"]
            CategoryMgmt["카테고리 관리"]
            TemplateMgmt["AI 템플릿"]
            KBMgmt["지식베이스"]
        end
    end

    Auth --> MainApp
    Auth --> BackOffice
    Common --> MainApp
    Common --> BackOffice
```

### 디렉토리 구조

```
app/
├── (auth)/                    # 인증 관련 (로그인/회원가입)
│   ├── login/
│   └── register/
├── (main)/                    # Main App (인증 필요)
│   ├── dashboard/             # 대시보드
│   ├── tickets/               # 티켓 관리
│   │   ├── [id]/
│   │   └── new/
│   ├── reports/               # 보고서 (Manager+)
│   └── profile/               # 프로필
├── (admin)/                   # Back Office (Admin 전용)
│   ├── users/                 # 사용자 관리
│   ├── categories/            # 카테고리 관리
│   ├── templates/             # AI 템플릿
│   └── knowledge-base/        # 지식베이스
├── api/                       # API Routes
│   ├── auth/
│   ├── tickets/
│   ├── users/
│   ├── categories/
│   ├── ai/
│   └── knowledge-base/
└── layout.tsx                 # 루트 레이아웃
```

### 네비게이션 구조

```mermaid
graph LR
    subgraph Navigation["사이드바 네비게이션"]
        subgraph AllUsers["모든 사용자"]
            Dashboard["대시보드"]
            Profile["프로필"]
        end

        subgraph TicketUsers["Customer/Agent/Manager"]
            Tickets["티켓"]
        end

        subgraph ManagerPlus["Manager/Admin"]
            Reports["보고서"]
            Stats["통계"]
        end

        subgraph AdminOnly["Admin 전용"]
            Users["사용자 관리"]
            Categories["카테고리"]
            Templates["AI 템플릿"]
            KB["지식베이스"]
        end
    end
```

---

## 기술 스택 상세

| 레이어 | 기술 | 용도 |
|--------|------|------|
| Frontend | Next.js 16 App Router | 풀스택 프레임워크 |
| UI | shadcn/ui + Tailwind CSS | UI 컴포넌트 |
| Charts | Recharts | 대시보드 차트 |
| State | React Server Components | 서버 상태 관리 |
| Auth | NextAuth.js v5 | 인증/인가 |
| ORM | Drizzle ORM | 데이터베이스 접근 |
| Database | PostgreSQL | 데이터 저장 |
| LLM | OpenRouter API | AI 기능 |
| Email | Nodemailer / SendGrid | 이메일 발송 |
| Validation | Zod | 스키마 검증 |
| Forms | React Hook Form | 폼 관리 |

---

## 배포 아키텍처

```mermaid
graph TB
    subgraph Production["프로덕션 환경"]
        subgraph Hosting["호스팅"]
            Vercel["Vercel / 자체 서버"]
        end

        subgraph Services["외부 서비스"]
            DB["PostgreSQL<br/>(Neon/Supabase/자체)"]
            Storage["파일 스토리지<br/>(S3/로컬)"]
            SMTP["이메일 서비스"]
            LLM["OpenRouter API"]
        end
    end

    Vercel --> DB
    Vercel --> Storage
    Vercel --> SMTP
    Vercel --> LLM
```

---

*문서 버전: 1.0*
*작성일: 2026-01-29*
