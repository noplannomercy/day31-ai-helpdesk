# Phase 3 검증 체크리스트

**테스트 환경**
- 서버: `npm run dev` → `http://localhost:3002`
- DB: `postgresql://budget:budget123@193.168.195.222:5432/helpdesk`
- Admin: `admin@example.com` / `Admin123!`

**자동 검증 완료 (2026-01-29)**
- ✅ Phase 3 모든 파일 구현 완료 (16/16 = 100%)
- ✅ API 엔드포인트: 8/8 (100%)
- ✅ 페이지: 5/5 (100%)
- ✅ 서비스 레이어: 3/3 (100%)
- ✅ 빌드 성공 (0 에러)

---

## ✅ 구현 완료 항목 (자동 검증)

### 코드 구현 상태
- [x] **카테고리 API** (2파일)
  - [x] `app/api/categories/route.ts` - GET/POST
  - [x] `app/api/categories/[id]/route.ts` - GET/PATCH/DELETE

- [x] **티켓 API** (6파일)
  - [x] `app/api/tickets/route.ts` - 목록/생성
  - [x] `app/api/tickets/[id]/route.ts` - 상세/수정
  - [x] `app/api/tickets/[id]/comments/route.ts` - 댓글
  - [x] `app/api/tickets/[id]/attachments/route.ts` - 첨부파일
  - [x] `app/api/tickets/[id]/status/route.ts` - 상태 변경
  - [x] `app/api/tickets/[id]/assign/route.ts` - 담당자 할당

- [x] **페이지** (5파일)
  - [x] `app/(admin)/categories/page.tsx` - 카테고리 관리
  - [x] `app/(main)/tickets/page.tsx` - 티켓 목록
  - [x] `app/(main)/tickets/new/page.tsx` - 티켓 생성
  - [x] `app/(main)/tickets/[id]/page.tsx` - 티켓 상세
  - [x] `app/(main)/dashboard/page.tsx` - 대시보드

- [x] **서비스 레이어** (3파일)
  - [x] `lib/services/ticket-service.ts` - 티켓 비즈니스 로직
  - [x] `lib/services/assignment-service.ts` - Round-robin 할당
  - [x] `lib/services/history-service.ts` - 이력 추적

- [x] **데이터베이스**
  - [x] Admin 계정 존재: `admin@example.com`
  - [x] 기본 카테고리 5개: 결제, 배송, 반품/교환, 계정, 기타

---

## 📋 수동 테스트 시나리오 (사용자 테스트 필요)

> **참고:** 아래 항목들은 실제 브라우저에서 수동으로 테스트가 필요합니다.
> `http://localhost:3002`에서 각 시나리오를 순서대로 진행하세요.

### 0. 사전 준비
- [ ] Admin 로그인 확인 (`admin@example.com` / `Admin123!`)
- [ ] Agent 2명 생성 (`/admin/users`)
  - [ ] `agent1@example.com` / `Agent123!` (역할: Agent)
  - [ ] `agent2@example.com` / `Agent123!` (역할: Agent)
- [ ] Manager 1명 생성
  - [ ] `manager@example.com` / `Manager123!` (역할: Manager)
- [ ] Customer 2명 회원가입 (`/register`)
  - [ ] `customer1@example.com` / `Customer123!`
  - [ ] `customer2@example.com` / `Customer123!`
- [ ] Agent 2명 온라인 상태 설정 (`/admin/users` → 온라인 스위치 켜기)

---

### 1. 카테고리 관리 (Admin)

#### 기본 기능
- [ ] `/admin/categories` 접속 → 기본 카테고리 5개 표시 확인
- [ ] 카테고리 추가 → "제품 문의" 생성 → 목록에 추가됨
- [ ] 카테고리 수정 → "제품 문의" → "제품 상담" 변경
- [ ] 카테고리 비활성화 → 활성 스위치 토글 → 비활성 표시
- [ ] 카테고리 삭제 → 삭제 버튼 → 목록에서 제거

#### 유효성 검증
- [ ] 중복 이름 생성 시도 → 에러 메시지 표시

---

### 2. 티켓 생성 (Customer)

**로그인:** `customer1@example.com`

#### 기본 생성
- [ ] `/tickets/new` 접속 → 폼 표시 (제목/내용/카테고리/우선순위/파일첨부)
- [ ] 티켓 A 생성: "로그인이 안됩니다" / 카테고리: 계정 / 우선순위: High
  - [ ] 생성 성공 → 상세 페이지 이동
  - [ ] 상태: Open
  - [ ] 담당자: agent1 또는 agent2 (자동 할당)
  - [ ] SLA 마감시간 표시 (응답 1시간, 해결 24시간)

#### 파일 첨부
- [ ] 티켓 B 생성: "제품 사진과 다릅니다" + 이미지 첨부 (2MB 이하)
  - [ ] 파일 업로드 성공 → 첨부파일 표시
  - [ ] 다운로드 버튼 클릭 → 파일 다운로드

#### 유효성 검증
- [ ] 5MB 초과 파일 업로드 시도 → "5MB 초과" 에러
- [ ] 제목만 입력 후 생성 시도 → "내용 필수" 에러

---

### 3. 티켓 목록 & 필터링

#### 역할별 권한
- [ ] **Customer1** 로그인 → `/tickets` → 본인 티켓 2개만 표시
- [ ] **Agent1** 로그인 → `/tickets` → agent1 할당 티켓만 표시
- [ ] **Manager** 로그인 → `/tickets` → 모든 티켓 표시

#### 필터링
- [ ] 상태 필터: "Open" 선택 → Open 티켓만 표시
- [ ] 우선순위 필터: "High" 선택 → High 티켓만 표시
- [ ] 카테고리 필터: "계정" 선택 → 계정 카테고리만 표시
- [ ] 검색: "로그인" 입력 → 제목/내용 포함 티켓 표시
- [ ] 복합 필터: 상태 Open + 우선순위 High → 조건 모두 만족하는 티켓만

---

### 4. 댓글 시스템

**티켓:** customer1의 "로그인이 안됩니다" 티켓

#### 공개 댓글
- [ ] **Customer1** → 댓글 작성: "크롬 브라우저입니다" → 댓글 추가됨
- [ ] **Agent1** → 댓글 작성: "비밀번호 재설정 링크 전송했습니다" (내부 노트 체크 안함)
  - [ ] 공개 댓글로 추가
  - [ ] first_response_at 기록 (첫 응답)
  - [ ] customer1도 볼 수 있음

#### 내부 노트
- [ ] **Agent1** → 댓글 작성: "고객 계정 확인 완료" + **내부 노트 체크**
  - [ ] "내부" 배지 표시
- [ ] **Customer1** 로그인 → 동일 티켓 → 내부 노트 보이지 않음
- [ ] **Manager** 로그인 → 동일 티켓 → 내부 노트 표시됨

---

### 5. 상태 변경 & 이력

**티켓:** agent1 할당 티켓

#### 상태 흐름
- [ ] **Agent1** → 상태 "In Progress" 변경 → 배지 업데이트
- [ ] 이력 탭 → "status: open → in_progress" 기록 확인
- [ ] 상태 "Resolved" 변경 + 해결 댓글 작성
  - [ ] resolved_at 시간 기록
  - [ ] SLA 해결 충족 여부 계산
- [ ] **Customer1** → "해결 완료" 버튼 클릭 → 상태 "Closed"
  - [ ] closed_at 시간 기록
  - [ ] "재오픈" 버튼 표시

#### 기타 변경
- [ ] **Agent1** → 우선순위 Medium → High 변경 → 이력 기록
- [ ] **Manager** → 담당자 agent1 → agent2 변경 → 이력 기록

#### 이력 확인
- [ ] 이력 탭 → 모든 변경 사항 시간순 표시
  - [ ] 상태 변경 (open → in_progress → resolved → closed)
  - [ ] 우선순위 변경
  - [ ] 담당자 변경
  - [ ] 각 변경의 변경자/시간 표시

---

### 6. 자동 할당 (Round-robin)

**사전조건:** agent1, agent2 모두 온라인

#### Round-robin 테스트
- [ ] **Customer2** → 티켓 1 생성 → agent1 또는 agent2에게 할당 (할당자 기록)
- [ ] **Customer2** → 티켓 2 생성 → 이전과 다른 Agent에게 할당 (순환 확인)
- [ ] **Customer2** → 티켓 3 생성 → 다시 첫 번째 Agent에게 할당

#### 부재/오프라인 테스트
- [ ] **Admin** → agent1 부재 설정 (is_away = true)
- [ ] **Customer2** → 티켓 생성 → agent2에게만 할당 (agent1 제외)
- [ ] **Admin** → 모든 Agent 오프라인 설정
- [ ] **Customer2** → 티켓 생성 → 담당자 없음 (null)

---

### 7. 티켓 재오픈

#### 3일 이내 재오픈
- [ ] **Customer1** → Closed 티켓 상세 → "재오픈" 버튼 표시
- [ ] "재오픈" 클릭 → 사유 입력: "문제 재발생" → 확인
  - [ ] 상태 "Open"으로 변경
  - [ ] 재오픈 댓글 자동 추가
  - [ ] 이전 담당자에게 재할당

---

### 8. 파일 첨부 관리

#### 업로드 & 다운로드
- [ ] **Customer1** → 티켓 생성 시 3개 파일 첨부 (각 1MB) → 모두 업로드 성공
- [ ] 티켓 상세 → 3개 파일 표시
- [ ] 다운로드 버튼 → 파일 정상 다운로드

#### 삭제 권한
- [ ] **Agent1** → 첨부파일 "삭제" 버튼 클릭 → 파일 제거
- [ ] **Customer1** → 본인 업로드 파일 → 삭제 버튼 없음 (권한 없음)

#### 유효성
- [ ] `.exe` 파일 업로드 시도 → "지원하지 않는 형식" 에러

---

### 9. 대시보드

#### 역할별 통계
- [ ] **Customer1** → `/dashboard` → 본인 티켓 통계만 (총/Open/In Progress/Resolved/Closed)
- [ ] **Agent1** → `/dashboard` → 본인 할당 티켓 통계
- [ ] **Manager** → `/dashboard` → 전체 티켓 통계
- [ ] **Admin** → `/dashboard` → 전체 시스템 통계 + Agent별 할당 현황

#### 최근 티켓
- [ ] 각 역할별 최근 티켓 목록 표시 (권한에 맞게)

---

### 10. 권한 제어

#### 접근 차단
- [ ] **Customer1** → `/admin/users` 직접 접근 → 403 Forbidden
- [ ] **Customer1** → customer2 티켓 URL 직접 접근 → 404 또는 접근 거부
- [ ] **Agent1** → agent2 할당 티켓 수정 시도 → 버튼 비활성화 또는 권한 에러
- [ ] **Agent1** → `/admin/categories` 접근 → 403 Forbidden

---

### 11. SLA 확인

#### 자동 설정
- [ ] **Customer1** → 티켓 생성 → SLA 마감시간 표시
  - [ ] 응답 마감: 생성 시간 + 1시간
  - [ ] 해결 마감: 생성 시간 + 24시간

#### 충족 기록
- [ ] **Agent1** → 1시간 내 첫 댓글 → sla_response_met = true
- [ ] **Agent1** → 24시간 내 Resolved → sla_resolve_met = true

---

### 12. 엣지 케이스

#### 유효성 검증
- [ ] 빈 댓글 작성 시도 → "내용 입력" 에러
- [ ] 200자 초과 제목 입력 → 제한 또는 에러
- [ ] 제목에 `<script>alert('XSS')</script>` 입력 → 이스케이프 처리 (XSS 방지)

#### 페이지네이션 (티켓 10개 이상 시)
- [ ] `/tickets` → 페이지당 10개 표시
- [ ] 다음/이전 버튼 동작

---

## 📊 테스트 결과 요약

### 자동 검증 결과
- **구현 완료:** 16/16 파일 (100%)
- **빌드 상태:** ✅ 성공 (0 에러)
- **DB 상태:** ✅ 정상
- **기본 데이터:** ✅ Admin + 5개 카테고리

### 수동 테스트 통과율
- **전체 테스트 항목:** ~80개
- **통과:** ___개
- **실패:** ___개
- **통과율:** ___%

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
- [x] **모든 코드 파일 구현 완료 (16/16)**
- [x] **빌드 에러 0개**
- [x] **DB 연결 및 기본 데이터 정상**

### 수동 테스트 (진행 필요)
- [ ] **모든 핵심 기능 정상 동작**
- [ ] **역할별 권한 제어 정상**
- [ ] **UI/UX 문제 없음**
- [ ] **Phase 3 완료 승인**

**자동 검증 수행:** Claude Code (AI)
**자동 검증 일시:** 2026-01-29
**수동 테스트 수행자:** _______________
**수동 테스트 일시:** _______________
**최종 승인 상태:** [ ] 승인 [ ] 재작업 필요

---

**다음 단계:**
- [ ] Phase 4: Knowledge Base & AI Preparation (4-5시간)
- [ ] Phase 5: AI Integration (6-8시간)
- [ ] Phase 6: SLA & Notifications (5-6시간)

---

## 📝 자동 검증 세부 내용

### 스모크 테스트 결과
```
✅ API 엔드포인트: 8/8 (100%)
  ✓ app/api/categories/route.ts
  ✓ app/api/categories/[id]/route.ts
  ✓ app/api/tickets/route.ts
  ✓ app/api/tickets/[id]/route.ts
  ✓ app/api/tickets/[id]/comments/route.ts
  ✓ app/api/tickets/[id]/attachments/route.ts
  ✓ app/api/tickets/[id]/status/route.ts
  ✓ app/api/tickets/[id]/assign/route.ts

✅ 페이지: 5/5 (100%)
  ✓ app/(admin)/categories/page.tsx
  ✓ app/(main)/tickets/page.tsx
  ✓ app/(main)/tickets/new/page.tsx
  ✓ app/(main)/tickets/[id]/page.tsx
  ✓ app/(main)/dashboard/page.tsx

✅ 서비스 레이어: 3/3 (100%)
  ✓ lib/services/ticket-service.ts
  ✓ lib/services/assignment-service.ts
  ✓ lib/services/history-service.ts

✅ DB 상태:
  ✓ 카테고리: 5개 (결제, 배송, 반품/교환, 계정, 기타)
  ✓ 사용자: 1명 (admin@example.com)
  - 티켓: 0개 (테스트 데이터 없음)
```

---

*문서 버전: 3.0 (자동 검증 통합)*
*작성일: 2026-01-29*
*최종 업데이트: 2026-01-29*
