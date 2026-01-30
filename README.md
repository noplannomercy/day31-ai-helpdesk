# AI Help Desk 🎫

고객 문의 티켓 관리 및 AI 답변 제안 시스템

[![Vercel](https://img.shields.io/badge/vercel-deployed-success)](https://day31-ai-helpdesk.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [배포](#배포)
- [테스트](#테스트)
- [프로젝트 구조](#프로젝트-구조)
- [문서](#문서)

---

## 🎯 개요

AI Help Desk는 4가지 역할(Customer/Agent/Manager/Admin)을 지원하는 통합 헬프데스크 시스템입니다.

### 핵심 가치

- **자동화**: Round-robin 알고리즘으로 티켓 자동 할당
- **AI 지원**: OpenRouter API를 활용한 답변 제안 및 카테고리 분류
- **효율성**: SLA 관리 및 실시간 알림
- **확장성**: PostgreSQL + Next.js로 높은 확장성 보장

### 라이브 데모

🌐 **[https://day31-ai-helpdesk.vercel.app](https://day31-ai-helpdesk.vercel.app)**

**테스트 계정:**
- Customer: `testcustomer@test.com` / `Test1234!`
- Agent: `testagent@test.com` / `Agent1234!`

---

## ✨ 주요 기능

### 1. 티켓 관리
- ✅ 티켓 생성/조회/수정 (CRUD)
- ✅ 상태 관리: Open → In Progress → Resolved → Closed
- ✅ 우선순위: Low / Medium / High
- ✅ 카테고리 분류
- ✅ 파일 첨부 (이미지, 문서, 최대 5MB)
- ✅ 양방향 댓글 (공개/내부)
- ✅ 3일 이내 재오픈 가능
- ✅ 전체 이력 추적

### 2. 자동 할당
- ✅ **Round-robin 알고리즘**: 온라인 Agent에게 자동 할당
- ✅ 부하 분산: 미해결 티켓 수 기반
- ✅ Agent 부재 시 자동 재할당
- ✅ 할당 이력 기록

### 3. AI 기능
- ✅ 답변 초안 생성 (OpenRouter API)
- ✅ 카테고리 자동 분류
- ✅ 감정 분석 (참고용)
- ✅ 카테고리별 AI 프롬프트 템플릿

### 4. SLA 관리
- ✅ 응답 마감: 1시간
- ✅ 해결 마감: 24시간
- ✅ 이메일 알림 (위반 경고)
- ✅ Cron Job으로 자동 체크

### 5. 대시보드 & 보고서
- ✅ 티켓 통계 (상태별, 우선순위별)
- ✅ Agent 성과 분석
- ✅ SLA 준수율
- ✅ 만족도 조사 (5점 척도)
- ✅ Recharts 차트 시각화

### 6. 인증 & 권한
- ✅ NextAuth.js v5 인증
- ✅ 4가지 역할: Customer / Agent / Manager / Admin
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ 세션 관리

---

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Backend
- **API**: Next.js API Routes
- **Server Actions**: Next.js Server Actions
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js v5

### External Services
- **AI**: OpenRouter API
- **Email**: Nodemailer (선택)
- **Deployment**: Vercel
- **Version Control**: Git + GitHub

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 14+
- npm 또는 yarn

### 1. 저장소 클론

```bash
git clone https://github.com/noplannomercy/day31-ai-helpdesk.git
cd day31-ai-helpdesk
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일 생성:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth.js
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# OpenRouter API
OPENROUTER_API_KEY=your-api-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3002
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
```

### 4. 데이터베이스 마이그레이션

```bash
npx drizzle-kit push
```

### 5. 개발 서버 실행

```bash
npm run dev
```

🌐 **http://localhost:3002** 접속

---

## 📦 배포

### Vercel 배포 (권장)

1. **GitHub Push**
   ```bash
   git push origin master
   ```

2. **Vercel Import**
   - https://vercel.com 접속
   - GitHub 저장소 Import
   - 환경 변수 설정
   - Deploy 클릭

📚 **상세 가이드**: [DEPLOYMENT.md](DEPLOYMENT.md), [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md)

---

## 🧪 테스트

### E2E 테스트 (Playwright)

```bash
# 테스트 Agent 계정 생성
npx tsx --env-file=.env.local scripts/create-test-agent.ts

# 티켓 할당 테스트 실행
python test_final.py
```

**테스트 결과**: ✅ 100% 통과 (5/5)
- 상세 보고서: [docs/ticket_assignment_test_result.md](docs/ticket_assignment_test_result.md)

---

## 📁 프로젝트 구조

```
day31-ai-helpdesk/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 페이지
│   ├── (main)/            # 메인 앱
│   ├── (admin)/           # Admin Back Office
│   └── api/               # API Routes
├── components/            # React 컴포넌트
├── lib/                   # 라이브러리 & 유틸리티
├── drizzle/              # DB 마이그레이션
├── scripts/              # 유틸리티 스크립트
├── docs/                 # 문서
└── specs/                # 명세서
```

---

## 📚 문서

### 프로젝트 문서
- [SRS 최종 명세서](docs/SRS_FINAL.md)
- [아키텍처 설계](specs/ARCHITECTURE.md)
- [데이터베이스 스키마](specs/DATABASE.md)

### 배포 문서
- [배포 가이드](DEPLOYMENT.md)
- [빠른 시작](DEPLOY_QUICK_START.md)

### 테스트 문서
- [티켓 할당 테스트 결과](docs/ticket_assignment_test_result.md)

---

## 🗄 데이터베이스

8개 테이블:
- users, tickets, ticket_comments, ticket_attachments
- ticket_histories, categories, ai_prompt_templates, customer_satisfactions

---

## 🔐 역할 및 권한

| 역할 | 권한 |
|------|------|
| **Customer** | 티켓 생성/조회, 댓글 작성, 만족도 평가 |
| **Agent** | 티켓 처리, AI 답변 사용, 내부 노트 |
| **Manager** | Agent + 보고서 조회 |
| **Admin** | 전체 권한 + 사용자/카테고리 관리 |

---

## 🐛 알려진 이슈

현재 알려진 사소한 이슈:
- 티켓 상세 페이지 담당자 이름 표시 오류 (DB는 정상)
- 일부 UI 개선 항목 미완성

→ **핵심 기능은 모두 정상 작동**

---

## 📄 라이선스

MIT License

---

## 👨‍💻 개발

- 개발 기간: 2026-01-29 ~ 2026-01-30
- 구현 단계: Phase 1-8 완료
- 배포: Vercel ✅
- 테스트: 100% 통과 ✅

---

## 📞 문의

**프로젝트 저장소**: https://github.com/noplannomercy/day31-ai-helpdesk

**라이브 데모**: https://day31-ai-helpdesk.vercel.app

---

**Made with ❤️ using Next.js & AI**
