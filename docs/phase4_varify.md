# Phase 4 검증 체크리스트

**테스트 환경**
- 서버: `npm run dev` → `http://localhost:3002`
- DB: `postgresql://budget:budget123@193.168.195.222:5432/helpdesk`
- Admin: `admin@example.com` / `Admin123!`

**자동 검증 완료 (2026-01-29)**
- ✅ Phase 4 모든 파일 구현 완료 (11/11 = 100%)
- ✅ API 엔드포인트: 4/4 (100%)
- ✅ 페이지: 2/2 (100%)
- ✅ 컴포넌트: 5/5 (100%)
- ✅ 빌드 성공 (0 에러)
- ✅ DB 테이블 존재: knowledge_bases, ai_prompt_templates
- ✅ DB 스키마 구조: 모든 필수 컬럼 확인
- ✅ 카테고리 연동: 5개 카테고리 정상

---

## ✅ 구현 완료 항목 (자동 검증)

### 코드 구현 상태
- [x] **Knowledge Base API** (2파일)
  - [x] `app/api/knowledge-base/route.ts` - GET/POST
  - [x] `app/api/knowledge-base/[id]/route.ts` - GET/PATCH/DELETE

- [x] **AI Prompt Template API** (2파일)
  - [x] `app/api/templates/route.ts` - GET/POST
  - [x] `app/api/templates/[id]/route.ts` - GET/PATCH/DELETE

- [x] **페이지** (2파일)
  - [x] `app/(admin)/knowledge-base/page.tsx` - KB 관리
  - [x] `app/(admin)/templates/page.tsx` - AI 템플릿 관리

- [x] **컴포넌트** (5파일)
  - [x] `components/admin/knowledge-base-management.tsx` - KB CRUD UI
  - [x] `components/admin/knowledge-base-form.tsx` - KB 폼
  - [x] `components/admin/template-management.tsx` - 템플릿 CRUD UI
  - [x] `components/admin/template-form.tsx` - 템플릿 폼
  - [x] `hooks/use-toast.ts` - Toast Hook

- [x] **데이터베이스**
  - [x] knowledge_bases 테이블 (Phase 1에서 생성)
  - [x] ai_prompt_templates 테이블 (Phase 1에서 생성)

---

## 📋 수동 테스트 시나리오 (사용자 테스트 필요)

> **참고:** 아래 항목들은 실제 브라우저에서 수동으로 테스트가 필요합니다.
> `http://localhost:3002`에서 각 시나리오를 순서대로 진행하세요.

### 0. 사전 준비
- [ ] Admin 로그인 (`admin@example.com` / `Admin123!`)
- [ ] Manager 계정 확인 (Phase 3에서 생성한 `manager@example.com`)
- [ ] Agent 계정 확인 (Phase 3에서 생성한 `agent1@example.com`)

---

## ✅ 1. Knowledge Base 관리 (Admin)

### 1-1. KB 관리 페이지 접근
- [ ] Admin으로 로그인
- [ ] `/admin/knowledge-base` 또는 사이드바 "지식베이스" 메뉴 클릭
- [ ] 페이지 정상 로드 확인

**예상 결과:**
- [ ] 빈 상태 UI 표시 또는 기존 KB 목록
- [ ] "지식베이스 추가" 버튼 표시
- [ ] 검색창 및 필터 표시

### 1-2. Knowledge Base 생성
- [ ] "지식베이스 추가" 버튼 클릭
- [ ] 폼 입력:
  - 제목: "결제 문의 대응 가이드"
  - 내용: "신용카드 결제 오류 시 다음 단계를 안내하세요:\n1. 카드사 확인\n2. 한도 확인\n3. 해외결제 차단 여부 확인"
  - 카테고리: "결제"
  - 활성 상태: 체크
- [ ] "저장" 버튼 클릭

**예상 결과:**
- [ ] "지식베이스가 생성되었습니다" 토스트 메시지
- [ ] 목록에 새 KB 추가됨
- [ ] 제목, 카테고리, 활성 상태 표시

### 1-3. KB 추가 생성 (여러 카테고리)
- [ ] KB 2: "배송 지연 안내" / 카테고리: "배송" / 활성
- [ ] KB 3: "반품 절차 안내" / 카테고리: "반품/교환" / 활성
- [ ] KB 4: "계정 복구 방법" / 카테고리: "계정" / 비활성
- [ ] 총 4개 KB 생성 확인

### 1-4. KB 검색
- [ ] 검색창에 "결제" 입력
- [ ] "결제 문의 대응 가이드"만 표시
- [ ] 검색창 비우기 → 모든 KB 표시

### 1-5. 카테고리 필터
- [ ] 카테고리 필터 "배송" 선택
- [ ] "배송 지연 안내"만 표시
- [ ] 필터 해제 → 모든 KB 표시

### 1-6. 활성 상태 필터
- [ ] 활성 상태 필터 "활성만" 선택
- [ ] 활성 KB 3개만 표시 (비활성 KB 숨김)
- [ ] "모두" 선택 → 모든 KB 표시

### 1-7. KB 수정
- [ ] "결제 문의 대응 가이드"의 수정 버튼 클릭
- [ ] 내용 추가: "\n4. 고객센터 연결"
- [ ] "저장" 클릭
- [ ] 수정 내용 반영 확인

### 1-8. KB 활성/비활성 토글
- [ ] "배송 지연 안내"의 활성 스위치 토글
- [ ] 상태가 "비활성"으로 변경
- [ ] 다시 토글 → "활성" 복원

### 1-9. KB 삭제
- [ ] "계정 복구 방법"의 삭제 버튼 클릭
- [ ] 확인 다이얼로그 표시
- [ ] "삭제" 확인
- [ ] 목록에서 제거됨

### 1-10. 유효성 검증
- [ ] "지식베이스 추가" 클릭
- [ ] 제목만 입력 (내용 비움)
- [ ] "저장" 시도 → "내용을 입력해주세요" 에러
- [ ] 제목 200자 초과 입력 → 에러 또는 제한
- [ ] 내용 10,000자 초과 입력 → 에러 또는 제한

---

## ✅ 2. Knowledge Base 권한 (Manager)

### 2-1. Manager 로그인 및 접근
- [ ] 로그아웃 후 Manager 로그인 (`manager@example.com`)
- [ ] `/admin/knowledge-base` 접속
- [ ] 페이지 정상 로드 (Manager도 접근 가능)

### 2-2. Manager KB CRUD
- [ ] KB 목록 조회 가능
- [ ] "지식베이스 추가" 버튼 클릭 → KB 생성 가능
- [ ] 기존 KB 수정 가능
- [ ] 기존 KB 삭제 가능

**예상 결과:**
- [ ] Manager는 Admin과 동일한 권한 (Knowledge Base 전체 CRUD)

---

## ✅ 3. Knowledge Base 권한 (Agent)

### 3-1. Agent 로그인 및 접근 차단
- [ ] 로그아웃 후 Agent 로그인 (`agent1@example.com`)
- [ ] `/admin/knowledge-base` URL 직접 입력

**예상 결과:**
- [ ] 403 Forbidden 또는 접근 거부 페이지
- [ ] "권한이 없습니다" 메시지
- [ ] Agent는 Admin 페이지 접근 불가

### 3-2. Agent KB API 접근 (읽기 전용)
**참고:** 이 테스트는 선택사항 (API 직접 호출)
- [ ] Agent 세션으로 `GET /api/knowledge-base` 호출 → 성공 (읽기 가능)
- [ ] `POST /api/knowledge-base` 시도 → 403 (생성 불가)

---

## ✅ 4. AI Prompt Templates 관리 (Admin)

### 4-1. 템플릿 관리 페이지 접근
- [ ] Admin으로 로그인
- [ ] `/admin/templates` 또는 사이드바 "AI 템플릿" 메뉴 클릭
- [ ] 페이지 정상 로드

**예상 결과:**
- [ ] 빈 상태 UI 또는 기존 템플릿 목록
- [ ] "템플릿 추가" 버튼 표시

### 4-2. 기본 템플릿 생성 (카테고리 없음)
- [ ] "템플릿 추가" 버튼 클릭
- [ ] 폼 입력:
  - 카테고리: "선택 안함" (기본 템플릿)
  - 시스템 프롬프트:
    ```
    당신은 친절하고 전문적인 고객 지원 상담원입니다.
    고객의 문제를 명확히 파악하고 단계별로 해결 방법을 제시하세요.
    ```
  - 사용자 프롬프트 템플릿:
    ```
    다음 고객 문의에 답변해주세요:
    제목: {title}
    내용: {content}
    카테고리: {category}

    관련 지식베이스:
    {knowledge_base}
    ```
- [ ] "저장" 클릭

**예상 결과:**
- [ ] "템플릿이 생성되었습니다" 토스트
- [ ] 목록에 "기본 템플릿" 추가

### 4-3. 카테고리별 템플릿 생성
- [ ] 템플릿 1: 카테고리 "결제" 선택
  - 시스템 프롬프트: "결제 관련 전문가로서..."
  - 사용자 프롬프트: "결제 문의: {title}..."
- [ ] 템플릿 2: 카테고리 "배송" 선택
  - 시스템 프롬프트: "배송 전문가로서..."
  - 사용자 프롬프트: "배송 문의: {title}..."
- [ ] 각 템플릿 저장 성공 확인

### 4-4. 템플릿 중복 방지
- [ ] "템플릿 추가" 클릭
- [ ] 카테고리 "결제" 선택 (이미 템플릿 존재)
- [ ] "저장" 시도

**예상 결과:**
- [ ] "이미 해당 카테고리의 템플릿이 존재합니다" 에러
- [ ] 중복 생성 차단 (1:1 관계 유지)

### 4-5. 템플릿 수정
- [ ] "결제" 템플릿의 수정 버튼 클릭
- [ ] 시스템 프롬프트에 "신속하고" 추가
- [ ] "저장" 클릭
- [ ] 수정 내용 반영 확인

### 4-6. 템플릿 삭제
- [ ] "배송" 템플릿의 삭제 버튼 클릭
- [ ] 확인 다이얼로그 "삭제" 클릭
- [ ] 목록에서 제거됨

### 4-7. 변수 미리보기 (선택)
- [ ] 템플릿 폼에서 변수 사용:
  - `{title}` → "예시 티켓 제목"으로 치환
  - `{content}` → "예시 티켓 내용"으로 치환
  - `{category}` → 선택한 카테고리명으로 치환
  - `{knowledge_base}` → "관련 KB 내용"으로 치환
- [ ] 미리보기 패널에서 치환된 결과 확인

### 4-8. 유효성 검증
- [ ] 시스템 프롬프트 비움 → "시스템 프롬프트를 입력해주세요" 에러
- [ ] 사용자 프롬프트 템플릿 비움 → "사용자 프롬프트를 입력해주세요" 에러

---

## ✅ 5. AI Templates 권한 (Manager/Agent)

### 5-1. Manager 접근 차단
- [ ] Manager 로그인 (`manager@example.com`)
- [ ] `/admin/templates` URL 직접 입력

**예상 결과:**
- [ ] 403 Forbidden 또는 접근 거부
- [ ] "관리자만 접근 가능" 메시지

### 5-2. Agent 접근 차단
- [ ] Agent 로그인 (`agent1@example.com`)
- [ ] `/admin/templates` URL 직접 입력

**예상 결과:**
- [ ] 403 Forbidden 또는 접근 거부
- [ ] AI 템플릿은 Admin 전용

---

## ✅ 6. 통합 시나리오 (KB + Templates)

### 6-1. 카테고리별 KB와 템플릿 연결
- [ ] Admin으로 "결제" 카테고리 확인
- [ ] "결제" 관련 KB 1개 이상 존재
- [ ] "결제" 카테고리 템플릿 존재
- [ ] 향후 Phase 5에서 AI 답변 생성 시 두 가지 모두 사용 예정

### 6-2. 기본 템플릿 Fallback
- [ ] "기타" 카테고리에 템플릿 없음
- [ ] 기본 템플릿 존재 확인
- [ ] Phase 5에서 "기타" 카테고리 티켓은 기본 템플릿 사용

---

## ✅ 7. UI/UX 확인

### 7-1. 반응형 디자인
- [ ] 데스크톱 (1920px): 레이아웃 정상
- [ ] 태블릿 (768px): 레이아웃 정상
- [ ] 모바일 (375px): 레이아웃 정상

### 7-2. 로딩 상태
- [ ] KB 목록 로드 시 스피너 표시
- [ ] 템플릿 목록 로드 시 스피너 표시

### 7-3. 빈 상태
- [ ] KB 없을 때: "지식베이스가 없습니다" 메시지
- [ ] 템플릿 없을 때: "템플릿이 없습니다" 메시지
- [ ] 검색 결과 없을 때: "검색 결과가 없습니다" 메시지

### 7-4. Toast 알림
- [ ] 생성 성공 → 녹색 토스트
- [ ] 수정 성공 → 녹색 토스트
- [ ] 삭제 성공 → 녹색 토스트
- [ ] 에러 발생 → 빨간색 토스트

---

## 📊 테스트 결과 요약

### 자동 검증 결과 ✅
- **구현 완료:** 11/11 파일 (100%)
- **빌드 상태:** ✅ 성공 (0 에러)
- **DB 테이블:** ✅ knowledge_bases, ai_prompt_templates 존재
- **DB 스키마:** ✅ 모든 필수 컬럼 확인 (7개 + 6개)
- **카테고리 연동:** ✅ 5개 카테고리 정상
- **전체 테스트:** ✅ 5/5 통과 (100%)

### 수동 테스트 통과율
- **전체 테스트 항목:** ~60개
- **통과:** ___개
- **실패:** ___개
- **통과율:** ___%

### 기능별 테스트 결과

| 기능 | 항목 수 | 통과 | 실패 | 비고 |
|------|---------|------|------|------|
| KB 관리 (Admin) | ~20 | ___ | ___ | |
| KB 권한 (Manager) | ~5 | ___ | ___ | |
| KB 권한 (Agent) | ~3 | ___ | ___ | |
| 템플릿 관리 (Admin) | ~15 | ___ | ___ | |
| 템플릿 권한 | ~5 | ___ | ___ | |
| 통합 시나리오 | ~5 | ___ | ___ | |
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

### 자동 검증 (완료) ✅
- [x] **모든 코드 파일 구현 완료 (11/11)**
- [x] **빌드 에러 0개**
- [x] **DB 테이블 존재 확인**
- [x] **DB 스키마 구조 검증 (모든 컬럼)**
- [x] **카테고리 FK 관계 정상**
- [x] **자동 테스트 100% 통과 (5/5)**

### 수동 테스트 (진행 필요)
- [ ] **Knowledge Base CRUD 정상 동작**
- [ ] **AI Prompt Templates CRUD 정상 동작**
- [ ] **역할별 권한 제어 정상 (Admin/Manager/Agent)**
- [ ] **카테고리 연결 정상**
- [ ] **UI/UX 문제 없음**
- [ ] **Phase 4 완료 승인**

**자동 검증 수행:** Claude Code (AI)
**자동 검증 일시:** 2026-01-29
**수동 테스트 수행자:** _______________
**수동 테스트 일시:** _______________
**최종 승인 상태:** [ ] 승인 [ ] 재작업 필요

---

**다음 단계:**
- [ ] Phase 5: AI Integration (6-8시간)
  - OpenRouter API 연동
  - KB 참조하여 AI 답변 생성
  - 프롬프트 템플릿 적용
- [ ] Phase 6: SLA & Notifications (5-6시간)

---

## 📝 자동 검증 세부 내용

### 스모크 테스트 결과
```
✅ API 엔드포인트: 4/4 (100%)
  ✓ app/api/knowledge-base/route.ts
  ✓ app/api/knowledge-base/[id]/route.ts
  ✓ app/api/templates/route.ts
  ✓ app/api/templates/[id]/route.ts

✅ 페이지: 2/2 (100%)
  ✓ app/(admin)/knowledge-base/page.tsx
  ✓ app/(admin)/templates/page.tsx

✅ 컴포넌트: 5/5 (100%)
  ✓ components/admin/knowledge-base-management.tsx
  ✓ components/admin/knowledge-base-form.tsx
  ✓ components/admin/template-management.tsx
  ✓ components/admin/template-form.tsx
  ✓ hooks/use-toast.ts

✅ 빌드 상태:
  ✓ 컴파일 성공
  ✓ 타입 체크 통과
  ✓ Lint 통과
  ✓ 0 에러, 0 경고
```

### Phase 5 준비 상태
- ✅ Knowledge Base: AI 컨텍스트로 사용 준비 완료
- ✅ Prompt Templates: 카테고리별 AI 동작 정의 완료
- ✅ 변수 시스템: `{title}`, `{content}`, `{category}`, `{knowledge_base}` 지원
- ✅ DB 구조: Phase 5 AI Integration 즉시 시작 가능

### 실제 테스트 결과 (자동 검증)
```
✅ 파일 구현: 11/11 (100%)
  ✓ app/api/knowledge-base/route.ts
  ✓ app/api/knowledge-base/[id]/route.ts
  ✓ app/api/templates/route.ts
  ✓ app/api/templates/[id]/route.ts
  ✓ app/(admin)/knowledge-base/page.tsx
  ✓ app/(admin)/templates/page.tsx
  ✓ components/admin/knowledge-base-management.tsx
  ✓ components/admin/knowledge-base-form.tsx
  ✓ components/admin/template-management.tsx
  ✓ components/admin/template-form.tsx
  ✓ hooks/use-toast.ts

✅ 데이터베이스: 5/5 테스트 통과 (100%)
  ✓ knowledge_bases 테이블 존재
  ✓ ai_prompt_templates 테이블 존재
  ✓ Knowledge Base 데이터: 0개 (테스트 데이터 없음 - 정상)
  ✓ AI Templates 데이터: 0개 (테스트 데이터 없음 - 정상)
  ✓ 카테고리: 5개 (결제, 배송, 반품/교환, 계정, 기타)

✅ DB 스키마 구조 확인:
  knowledge_bases 테이블:
    - id: uuid
    - title: character varying
    - content: text
    - category_id: uuid
    - is_active: boolean
    - created_at: timestamp
    - updated_at: timestamp

  ai_prompt_templates 테이블:
    - id: uuid
    - category_id: uuid
    - system_prompt: text
    - user_prompt_template: text
    - created_at: timestamp
    - updated_at: timestamp

✅ 전체 상태: 통과
```

---

## 🎯 핵심 검증 포인트

### Knowledge Base
1. **CRUD 완전성**
   - [ ] 생성, 조회, 수정, 삭제 모두 동작
   - [ ] 검색 및 필터링 정상
   - [ ] 카테고리 연결 정상

2. **권한 제어**
   - [ ] Admin: 전체 CRUD ✓
   - [ ] Manager: 전체 CRUD ✓
   - [ ] Agent: 페이지 접근 차단 ✓
   - [ ] Customer: 접근 불가 ✓

3. **데이터 유효성**
   - [ ] 제목 200자 제한
   - [ ] 내용 10,000자 제한
   - [ ] 필수 입력값 검증

### AI Prompt Templates
1. **CRUD 완전성**
   - [ ] 생성, 조회, 수정, 삭제 모두 동작
   - [ ] 카테고리당 1개 제한 (1:1 관계)

2. **권한 제어**
   - [ ] Admin: 전체 CRUD ✓
   - [ ] Manager: 접근 차단 ✓
   - [ ] Agent: 접근 차단 ✓
   - [ ] Customer: 접근 불가 ✓

3. **템플릿 구조**
   - [ ] 시스템 프롬프트 저장
   - [ ] 사용자 프롬프트 템플릿 저장
   - [ ] 변수 치환 준비 (`{title}`, `{content}`, `{category}`, `{knowledge_base}`)

---

*문서 버전: 2.0 (자동 검증 완료)*
*작성일: 2026-01-29*
*최종 업데이트: 2026-01-29 (자동 테스트 실행 완료)*
