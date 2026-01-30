# AI Help Desk - SRS

## 목적
고객 문의 티켓 관리 + AI 답변 제안 시스템

## 사용자
- Customer: 문의 등록
- Agent: 티켓 처리, AI 답변 활용
- Manager: 팀 관리, 보고서
- Admin: 시스템 설정, Back Office

## 주요 기능

### Main App
1. 티켓 CRUD
2. 티켓 상태 (Open → In Progress → Resolved → Closed)
3. AI 답변 제안 (LLM)
4. 답변 수정/승인 후 전송
5. 담당자 할당
6. 고객 이력 조회
7. 대시보드

### Back Office
1. 사용자/팀 관리
2. 카테고리 관리
3. AI 프롬프트 템플릿
4. FAQ/지식베이스 관리
5. 통계/보고서

### LLM 기능
1. 문의 자동 분류
2. 답변 초안 생성
3. 유사 티켓 검색
4. 감정 분석

## 기술 스택
- Next.js 16 + TypeScript
- PostgreSQL + Drizzle ORM
- shadcn/ui + Recharts
- OpenRouter API (LLM)
- NextAuth.js