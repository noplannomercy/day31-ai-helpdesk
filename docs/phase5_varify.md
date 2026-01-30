# Phase 5 검증 체크리스트

**테스트 환경**
- 서버: `npm run dev` → `http://localhost:3002`
- DB: `postgresql://budget:budget123@193.168.195.222:5432/helpdesk`
- Admin: `admin@example.com` / `Admin123!`
- **OpenRouter API Key**: `.env.local`에 설정 필요

**자동 검증 완료 (2026-01-29)**
- ✅ Phase 5 모든 파일 구현 완료 (13/13 = 100%)
- ✅ AI 서비스: 3/3 (100%)
- ✅ API 라우트: 4/4 (100%)
- ✅ UI 컴포넌트: 6/6 (100%)
- ✅ 통합 파일: 3/3 (100%)
- ✅ 빌드 성공 (0 에러)

---

## ✅ 구현 완료 항목 (자동 검증)

### 코드 구현 상태
- [x] **AI 서비스 레이어** (3파일)
  - [x] `lib/ai/openrouter.ts` - OpenRouter API 클라이언트
  - [x] `lib/ai/prompts.ts` - 시스템 프롬프트
  - [x] `lib/services/ai-service.ts` - AI 통합 서비스

- [x] **AI API 라우트** (4파일)
  - [x] `app/api/ai/classify/route.ts` - 카테고리 분류
  - [x] `app/api/ai/suggest/route.ts` - 답변 제안
  - [x] `app/api/ai/sentiment/route.ts` - 감정 분석
  - [x] `app/api/ai/similar/route.ts` - 유사 티켓

- [x] **AI UI 컴포넌트** (6파일)
  - [x] `components/ai/ai-response-panel.tsx`
  - [x] `components/ai/sentiment-badge.tsx`
  - [x] `components/ai/similar-tickets.tsx`
  - [x] `components/ai/category-suggestion.tsx`
  - [x] `components/ui/skeleton.tsx`
  - [x] `components/ai/index.ts`

- [x] **통합된 파일** (3파일)
  - [x] `components/tickets/ticket-form.tsx` - CategorySuggestion 통합
  - [x] `components/tickets/ticket-detail.tsx` - AI 패널 통합
  - [x] `components/tickets/ticket-card.tsx` - SentimentBadge 통합

---

## 📋 수동 테스트 시나리오

> **중요:** AI 기능 테스트를 위해 OpenRouter API 키가 필요합니다.
> `.env.local` 파일에 `OPENROUTER_API_KEY=sk-or-v1-xxx` 추가 필수

### 0. 사전 준비

#### 0-1. API 키 설정
- [ ] `.env.local` 파일에 `OPENROUTER_API_KEY` 추가
- [ ] 개발 서버 재시작 (`npm run dev`)
- [ ] API 키 유효성 확인

#### 0-2. Knowledge Base 데이터 준비
- [ ] Admin 로그인
- [ ] `/admin/knowledge-base` 접속
- [ ] 각 카테고리별 KB 최소 1개씩 추가:
  - [ ] "결제" 카테고리: 결제 관련 가이드
  - [ ] "배송" 카테고리: 배송 관련 가이드
  - [ ] "계정" 카테고리: 계정 관련 가이드

#### 0-3. AI Prompt Templates 설정
- [ ] `/admin/templates` 접속
- [ ] 기본 템플릿 생성 (카테고리 없음)
- [ ] (선택) 카테고리별 템플릿 추가

---

## ✅ 1. 카테고리 자동 분류 (Customer)

### 1-1. 티켓 생성 시 AI 추천
**사전조건:** Customer 로그인 (`customer1@example.com`)

- [ ] `/tickets/new` 접속
- [ ] 제목 입력: "결제가 안됩니다"
- [ ] 내용 입력: "신용카드로 결제를 시도했는데 계속 오류가 발생합니다. 카드 정보는 정확히 입력했는데 왜 안되는지 모르겠습니다."

**예상 결과:**
- [ ] CategorySuggestion 컴포넌트 자동 표시
- [ ] "AI가 카테고리를 분석중입니다..." 로딩 표시
- [ ] 추천 카테고리 표시: "결제" (신뢰도: 90%+)
- [ ] "이 카테고리 적용" 버튼 표시

### 1-2. AI 추천 수락
- [ ] "이 카테고리 적용" 버튼 클릭

**예상 결과:**
- [ ] 카테고리 필드가 "결제"로 자동 선택됨
- [ ] CategorySuggestion 컴포넌트 숨김
- [ ] 성공 토스트 메시지

### 1-3. AI 추천 무시
- [ ] 다른 티켓으로 다시 테스트
- [ ] CategorySuggestion 표시 후 "닫기" 또는 무시

**예상 결과:**
- [ ] 컴포넌트가 닫힘
- [ ] 사용자가 직접 카테고리 선택 가능
- [ ] 기능 정상 동작

### 1-4. 짧은 입력 시 AI 미실행
- [ ] 제목: "결제" (10자 미만)
- [ ] 내용: "안됩니다" (20자 미만)

**예상 결과:**
- [ ] CategorySuggestion 표시되지 않음
- [ ] AI API 호출 안함

---

## ✅ 2. AI 답변 생성 (Agent)

### 2-1. AI Response Panel 표시
**사전조건:** Agent 로그인 (`agent1@example.com`)

- [ ] 할당된 티켓 상세 페이지 접속
- [ ] AI Response Panel 표시 확인

**예상 결과:**
- [ ] "AI 답변 제안" 섹션 표시
- [ ] "AI 답변 생성" 버튼 표시
- [ ] Customer는 이 패널 안 보임 (권한 확인)

### 2-2. AI 답변 생성
- [ ] "AI 답변 생성" 버튼 클릭

**예상 결과:**
- [ ] 로딩 스피너 표시 (5-15초)
- [ ] AI 답변 텍스트 표시
- [ ] 답변에 관련 KB 내용 포함 확인
- [ ] "수정" 및 "댓글로 추가" 버튼 표시

### 2-3. 생성된 답변 확인
- [ ] 답변 내용 검토
- [ ] KB 내용이 참조되었는지 확인
- [ ] 카테고리별 프롬프트 템플릿 적용 확인

**예상 결과:**
- [ ] 한국어 답변
- [ ] 관련 KB 내용 포함
- [ ] 단계별 해결 방법 제시
- [ ] 전문적이고 친절한 톤

### 2-4. 답변 수정
- [ ] "수정" 버튼 클릭
- [ ] 텍스트 영역에서 답변 수정
- [ ] "저장" 클릭

**예상 결과:**
- [ ] 수정 모드 활성화
- [ ] 텍스트 편집 가능
- [ ] 수정 내용 저장됨

### 2-5. 댓글로 추가
- [ ] "댓글로 추가" 버튼 클릭

**예상 결과:**
- [ ] 댓글 작성 폼에 AI 답변 내용 자동 입력
- [ ] 또는 자동으로 댓글 생성
- [ ] 성공 토스트 메시지

### 2-6. API 에러 처리
**사전조건:** 잘못된 API 키 설정 또는 네트워크 문제

- [ ] "AI 답변 생성" 버튼 클릭

**예상 결과:**
- [ ] 에러 메시지 표시
- [ ] "AI 답변을 생성할 수 없습니다. 나중에 다시 시도해주세요."
- [ ] 앱 크래시 없음

---

## ✅ 3. 감정 분석 (Agent)

### 3-1. Sentiment Badge 표시 (티켓 상세)
**사전조건:** Agent 로그인, 티켓 상세 페이지

- [ ] 티켓 제목 근처에 감정 배지 확인

**예상 결과:**
- [ ] 감정 데이터 있을 때만 표시
- [ ] 색상 코딩:
  - [ ] 긍정 (Positive) → 초록색
  - [ ] 중립 (Neutral) → 회색
  - [ ] 부정 (Negative) → 빨간색

### 3-2. Sentiment Badge 표시 (티켓 목록)
- [ ] `/tickets` 페이지 접속
- [ ] 각 티켓 카드에서 감정 배지 확인

**예상 결과:**
- [ ] 감정 배지가 상태/우선순위 배지와 함께 표시
- [ ] 색상으로 감정 상태 한눈에 파악

### 3-3. 감정 분석 API 직접 호출 (선택)
**참고:** API 직접 테스트

- [ ] POST `/api/ai/sentiment`
- [ ] Body: `{ "content": "정말 짜증나네요. 계속 안됩니다." }`

**예상 결과:**
- [ ] `sentiment: "negative"`
- [ ] `confidence: 0.9`
- [ ] `reason: "부정적인 단어 사용"`

---

## ✅ 4. 유사 티켓 검색 (Agent)

### 4-1. Similar Tickets 사이드바
**사전조건:** Agent 로그인, 티켓 상세 페이지

- [ ] 오른쪽 사이드바에 "유사 티켓" 섹션 확인

**예상 결과:**
- [ ] "유사 티켓" 제목 표시
- [ ] 최대 5개 티켓 목록
- [ ] 각 티켓: 제목, 상태, 카테고리 표시
- [ ] 해결된 티켓 우선 표시

### 4-2. 유사 티켓 클릭
- [ ] 유사 티켓 중 하나 클릭

**예상 결과:**
- [ ] 해당 티켓 상세 페이지로 이동
- [ ] URL 변경 확인

### 4-3. 유사 티켓 없을 때
**사전조건:** 첫 티켓 또는 유사 티켓 없음

**예상 결과:**
- [ ] "유사한 티켓이 없습니다" 메시지 표시
- [ ] 빈 상태 UI

---

## ✅ 5. 통합 시나리오

### 5-1. 전체 워크플로우 (Customer → Agent)

**Step 1: Customer - 티켓 생성**
- [ ] Customer 로그인
- [ ] 티켓 생성 시작
- [ ] 제목/내용 입력
- [ ] AI 카테고리 추천 받기
- [ ] 추천 수락
- [ ] 티켓 생성

**Step 2: Agent - 티켓 확인**
- [ ] Agent 로그인
- [ ] 할당된 티켓 목록 확인
- [ ] 감정 배지로 우선순위 파악
- [ ] 티켓 상세 접속

**Step 3: Agent - AI 답변 활용**
- [ ] 유사 티켓 확인 (사이드바)
- [ ] AI 답변 생성 클릭
- [ ] KB 참조 답변 받기
- [ ] 답변 수정
- [ ] 댓글로 추가

**Step 4: 티켓 해결**
- [ ] 상태 "In Progress" 변경
- [ ] 추가 댓글 작성
- [ ] 상태 "Resolved" 변경

### 5-2. KB 내용 변경 후 답변 비교
- [ ] 특정 카테고리 KB 수정
- [ ] 동일 카테고리 티켓에서 AI 답변 생성
- [ ] 수정된 KB 내용 반영 확인

### 5-3. 프롬프트 템플릿 변경 후 답변 비교
- [ ] 특정 카테고리 템플릿 수정
- [ ] 동일 카테고리 티켓에서 AI 답변 생성
- [ ] 변경된 템플릿 적용 확인

---

## ✅ 6. 권한 제어

### 6-1. Customer - AI 도구 제한
**사전조건:** Customer 로그인

- [ ] 티켓 상세 페이지 접속 (본인 티켓)

**예상 결과:**
- [ ] AIResponsePanel 표시 안됨
- [ ] SimilarTickets 표시 안됨 (또는 표시됨 - 설정에 따라)
- [ ] SentimentBadge만 표시 (또는 숨김)

### 6-2. Agent - AI 도구 접근
**사전조건:** Agent 로그인

**예상 결과:**
- [ ] AIResponsePanel 표시
- [ ] SimilarTickets 표시
- [ ] 모든 AI 기능 사용 가능

### 6-3. AI API 직접 접근 차단
**참고:** Customer 세션으로 API 직접 호출 시도

- [ ] POST `/api/ai/suggest` (Customer 세션)

**예상 결과:**
- [ ] 403 Forbidden
- [ ] "권한이 없습니다" 에러

---

## ✅ 7. Graceful Degradation

### 7-1. API 키 없을 때
**사전조건:** `.env.local`에서 `OPENROUTER_API_KEY` 제거

- [ ] 서버 재시작
- [ ] 티켓 생성 시도
- [ ] 티켓 상세 (Agent) 접속

**예상 결과:**
- [ ] CategorySuggestion 표시 안됨
- [ ] AIResponsePanel 비활성화 또는 숨김
- [ ] 앱 크래시 없음
- [ ] 다른 기능 정상 동작

### 7-2. API 호출 실패
**사전조건:** 잘못된 API 키 또는 네트워크 오류

**예상 결과:**
- [ ] 로딩 후 에러 메시지
- [ ] "AI 기능을 사용할 수 없습니다"
- [ ] 재시도 가능
- [ ] 앱 정상 동작

### 7-3. 타임아웃
**참고:** 30초 이상 응답 없을 때

**예상 결과:**
- [ ] "요청 시간 초과" 메시지
- [ ] 앱 반응 유지
- [ ] 재시도 가능

---

## ✅ 8. UI/UX 확인

### 8-1. 로딩 상태
- [ ] AI 답변 생성 시 로딩 스피너
- [ ] 유사 티켓 로딩 스켈레톤
- [ ] 카테고리 추천 로딩 표시

### 8-2. 에러 상태
- [ ] API 실패 시 에러 메시지
- [ ] 재시도 버튼
- [ ] 사용자 친화적 한국어 메시지

### 8-3. 성공 피드백
- [ ] 카테고리 적용 시 토스트
- [ ] 답변 추가 시 토스트
- [ ] 시각적 피드백

### 8-4. 반응형 디자인
- [ ] 데스크톱 (1920px): 2단 레이아웃
- [ ] 태블릿 (768px): 1단 레이아웃
- [ ] 모바일 (375px): 스택 레이아웃

---

## 📊 테스트 결과 요약

### 자동 검증 결과
- **구현 완료:** 13/13 파일 (100%)
- **빌드 상태:** ✅ 통과
- **DB 통합:** ✅ 통과 (2/2)
- **Phase 4 연동:** ✅ Knowledge Base + AI Templates 접근 가능

### 수동 테스트 통과율
- **전체 테스트 항목:** ~70개
- **통과:** ___개
- **실패:** ___개
- **통과율:** ___%

### 기능별 테스트 결과

| 기능 | 항목 수 | 통과 | 실패 | 비고 |
|------|---------|------|------|------|
| 카테고리 분류 | ~10 | ___ | ___ | |
| AI 답변 생성 | ~15 | ___ | ___ | |
| 감정 분석 | ~8 | ___ | ___ | |
| 유사 티켓 | ~6 | ___ | ___ | |
| 통합 시나리오 | ~10 | ___ | ___ | |
| 권한 제어 | ~6 | ___ | ___ | |
| Graceful Degradation | ~8 | ___ | ___ | |
| UI/UX | ~7 | ___ | ___ | |

### 발견된 이슈
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### 개선 제안
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

---

## ✅ 최종 승인

### 자동 검증 (완료)
- [x] **모든 코드 파일 구현 완료 (13/13)**
- [x] **빌드 에러 0개**
- [x] **Phase 4 테이블 통합 완료**
- [x] **API 라우트 생성 확인**
- [x] **컴포넌트 통합 확인**

### 수동 테스트 (진행 필요)
- [ ] **카테고리 자동 분류 동작**
- [ ] **AI 답변 생성 (KB 참조)**
- [ ] **감정 분석 표시**
- [ ] **유사 티켓 검색**
- [ ] **역할별 권한 제어**
- [ ] **Graceful Degradation 확인**
- [ ] **Phase 5 완료 승인**

**자동 검증 수행:** Claude Code
**자동 검증 일시:** 2026-01-29
**수동 테스트 수행자:** (대기 중)
**수동 테스트 일시:** (대기 중)
**최종 승인 상태:** [ ] 승인 [ ] 재작업 필요 (수동 테스트 대기)

---

**다음 단계:**
- [ ] Phase 6: SLA & Notifications (5-6시간)
- [ ] Phase 7: Reports & Satisfaction (4-5시간)
- [ ] Phase 8: Polish & Optimization (4-5시간)

---

## 📝 자동 검증 세부 내용

### 파일 존재 확인
```
=== 1. AI 서비스 파일 확인 ===
✓ lib/ai/openrouter.ts
✓ lib/ai/prompts.ts
✓ lib/services/ai-service.ts

=== 2. AI API 라우트 확인 ===
✓ app/api/ai/classify/route.ts
✓ app/api/ai/suggest/route.ts
✓ app/api/ai/sentiment/route.ts
✓ app/api/ai/similar/route.ts

=== 3. AI 컴포넌트 확인 ===
✓ components/ai/ai-response-panel.tsx
✓ components/ai/sentiment-badge.tsx
✓ components/ai/similar-tickets.tsx
✓ components/ai/category-suggestion.tsx
✓ components/ui/skeleton.tsx
✓ components/ai/index.ts

파일 존재: 13/13 (100%)
```

### Phase 4 통합 확인
```
=== 4. 컴포넌트 통합 확인 ===
✓ ticket-form.tsx - CategorySuggestion 통합
✓ ticket-detail.tsx - AIResponsePanel, SentimentBadge, SimilarTickets 통합
✓ ticket-card.tsx - SentimentBadge 통합

컴포넌트 통합: 3/3 (100%)
```

### 빌드 상태
```
=== 5. 데이터베이스 확인 ===
✓ Knowledge Base 테이블 접근 가능 (0개)
✓ AI Prompt Templates 테이블 접근 가능 (0개)

전체 상태: ✓ 통과
```

---

*문서 버전: 1.0*
*작성일: 2026-01-29*
*최종 업데이트: 2026-01-29*
